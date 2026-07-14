from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import time

app = FastAPI(title="BIST Hisse Tahmin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BIST_STOCKS = [
    "THYAO", "ASELS", "GARAN", "AKBNK", "ISCTR",
    "KCHOL", "SAHOL", "SISE", "EREGL", "BIMAS",
    "TUPRS", "PETKM", "FROTO", "TOASO", "PGSUS",
    "YKBNK", "VAKBN", "HALKB", "ARCLK", "TCELL",
]

TIMEFRAME_MAP = {
    "5m":  {"interval": "5m",  "period": "5d"},
    "1h":  {"interval": "1h",  "period": "1mo"},
    "1d":  {"interval": "1d",  "period": "1y"},
    "1mo": {"interval": "1mo", "period": "5y"},
}

_cache = {}
CACHE_TTL = 60


def get_data(ticker: str, timeframe: str) -> pd.DataFrame:
    key = f"{ticker}_{timeframe}"
    now = time.time()
    if key in _cache and now - _cache[key]["ts"] < CACHE_TTL:
        return _cache[key]["data"]

    cfg = TIMEFRAME_MAP[timeframe]
    df = yf.download(
        ticker, interval=cfg["interval"], period=cfg["period"],
        progress=False, auto_adjust=True,
    )

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    if df.empty:
        raise HTTPException(status_code=404, detail="Veri bulunamadi")

    _cache[key] = {"ts": now, "data": df}
    return df


def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["SMA5"] = df["Close"].rolling(5).mean()
    df["SMA20"] = df["Close"].rolling(20).mean()

    delta = df["Close"].diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = -delta.clip(upper=0).rolling(14).mean()
    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))

    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"] = ema12 - ema26

    df["Return"] = df["Close"].pct_change()
    df["Target"] = (df["Close"].shift(-1) > df["Close"]).astype(int)

    df = df.dropna()
    return df


def train_and_predict(df: pd.DataFrame):
    from sklearn.ensemble import RandomForestClassifier
    features = ["SMA5", "SMA20", "RSI", "MACD", "Return"]

    if len(df) < 30:
        raise HTTPException(status_code=400, detail="Model icin yeterli veri yok")

    X_train = df[features].iloc[:-1]
    y_train = df["Target"].iloc[:-1]
    X_last = df[features].iloc[[-1]]

    if y_train.nunique() < 2:
        return int(y_train.iloc[0]), 0.55

    model = RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    pred = int(model.predict(X_last)[0])
    prob = float(model.predict_proba(X_last)[0].max())
    return pred, prob


@app.get("/")
def root():
    return {"status": "ok", "message": "BIST Tahmin API calisiyor"}


@app.get("/stocks")
def stocks():
    return {"stocks": BIST_STOCKS}


@app.get("/predict")
def predict(
    ticker: str = Query(...),
    timeframe: str = Query(...),
):
    if timeframe not in TIMEFRAME_MAP:
        raise HTTPException(status_code=400, detail="Gecersiz zaman dilimi")

    clean_ticker = ticker.upper().replace(".IS", "")
    full_ticker = f"{clean_ticker}.IS"

    df = get_data(full_ticker, timeframe)
    feat_df = compute_features(df)
    pred, prob = train_and_predict(feat_df)

    chart_df = df.tail(60).reset_index()
    time_col = chart_df.columns[0]

    last_price = float(df["Close"].iloc[-1])
    prev_price = float(df["Close"].iloc[-2]) if len(df) > 1 else last_price
    change_pct = ((last_price - prev_price) / prev_price) * 100 if prev_price else 0.0

    return {
        "ticker": clean_ticker,
        "timeframe": timeframe,
        "last_price": round(last_price, 2),
        "change_pct": round(change_pct, 2),
        "prediction": "yukselis" if pred == 1 else "dusus",
        "probability": round(prob * 100, 1),
        "chart": {
            "labels": chart_df[time_col].astype(str).tolist(),
            "prices": [round(float(p), 2) for p in chart_df["Close"].tolist()],
        },
    }
