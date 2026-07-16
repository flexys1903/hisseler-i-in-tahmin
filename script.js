const API_URL = "https://bist-tahmin-api.onrender.com";

const timeframe = document.body.dataset.timeframe;
const stockSelect = document.getElementById("stockSelect");
const loadBtn = document.getElementById("loadBtn");
const priceEl = document.getElementById("price");
const changeEl = document.getElementById("change");
const predictionBox = document.getElementById("predictionBox");
const predictionLabel = document.getElementById("predictionLabel");
const probabilityEl = document.getElementById("probability");

let chart = null;

async function loadStocks() {
  try {
    const res = await fetch(API_URL + "/stocks");
    const data = await res.json();
    stockSelect.innerHTML = data.stocks
      .map(function (s) { return "<option value='" + s + "'>" + s + "</option>"; })
      .join("");
  } catch (err) {
    stockSelect.innerHTML = "<option>API'ye baglanilamadi</option>";
  }
}

async function loadPrediction() {
  const ticker = stockSelect.value;
  if (!ticker) return;

  loadBtn.disabled = true;
  loadBtn.textContent = "Yukleniyor...";

  try {
    const res = await fetch(API_URL + "/predict?ticker=" + ticker + "&timeframe=" + timeframe);
    const data = await res.json();

    if (!res.ok) {
      predictionLabel.textContent = data.detail || "Veri alinamadi.";
      loadBtn.disabled = false;
      loadBtn.textContent = "Tahmini Getir";
      return;
    }

    priceEl.textContent = data.last_price + " TL";
    changeEl.textContent = (data.change_pct > 0 ? "+" : "") + data.change_pct + "%";
    changeEl.className = "change " + (data.change_pct >= 0 ? "up" : "down");

    const isUp = data.prediction === "yukselis";
    predictionBox.className = "prediction-box " + (isUp ? "up" : "down");
    predictionLabel.textContent = isUp ? "YUKSELIS BEKLENIYOR" : "DUSUS BEKLENIYOR";
    probabilityEl.textContent = "Model guveni: %" + data.probability;

    drawChart(data.chart.labels, data.chart.prices);
  } catch (err) {
    predictionLabel.textContent = "Veri alinamadi, tekrar dene.";
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = "Tahmini Getir";
  }
}

function drawChart(labels, prices) {
  const ctx = document.getElementById("priceChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Kapanis Fiyati",
        data: prices,
        borderColor: "#5b8cff",
        backgroundColor: "rgba(91,140,255,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color: "#232c40" }, ticks: { color: "#7c8aa5" } }
      }
    }
  });
}

loadBtn.addEventListener("click", loadPrediction);
loadStocks();
