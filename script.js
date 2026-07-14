// Backend'ini Render'a deploy ettikten sonra buradaki URL'yi değiştir
const API_URL = "// Backend'ini Render'a deploy ettikten sonra buradaki URL'yi değiştir
const API_URL = "https://bist-tahmin-api.onrender.com";

const timeframe = document.body.dataset.timeframe; // her sayfada farklı: 5m, 1h, 1d, 1mo
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
    const res = await fetch(`${API_URL}/stocks`);
    const data = await res.json();
    stockSelect.innerHTML = data.stocks
      .map(s => `<option value="${s}">${s}</option>`)
      .join("");
  } catch (err) {
    stockSelect.innerHTML = `<option>API'ye bağlanılamadı</option>`;
  }
}

async function loadPrediction() {
  const ticker = stockSelect.value;
  if (!ticker) return;

  loadBtn.disabled = true;
  loadBtn.textContent = "Yükleniyor...";

  try {
    const res = await fetch(`${API_URL}/predict?ticker=${ticker}&timeframe=${timeframe}`);
    const data = await res.json();

    priceEl.textContent = `${data.last_price} ₺`;
    changeEl.textContent = `${data.change_pct > 0 ? "+" : ""}${data.change_pct}%`;
    changeEl.className = `change ${data.change_pct >= 0 ? "up" : "down"}`;

    const isUp = data.prediction === "yukselis";
    predictionBox.className = `prediction-box ${isUp ? "up" : "down"}`;
    predictionLabel.textContent = isUp ? "YÜKSELİŞ BEKLENİYOR ▲" : "DÜŞÜŞ BEKLENİYOR ▼";
    probabilityEl.textContent = `Model güveni: %${data.probability}`;

    drawChart(data.chart.labels, data.chart.prices);
  } catch (err) {
    predictionLabel.textContent = "Veri alınamadı, tekrar dene.";
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
      labels,
      datasets: [{
        label: "Kapanış Fiyatı",
        data: prices,
        borderColor: "#5b8cff",
        backgroundColor: "rgba(91,140,255,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color: "#232c40" }, ticks: { color: "#7c8aa5" } },
      },
    },
  });
}

loadBtn.addEventListener("click", loadPrediction);
loadStocks();
";

const timeframe = document.body.dataset.timeframe; // her sayfada farklı: 5m, 1h, 1d, 1mo
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
    const res = await fetch(`${API_URL}/stocks`);
    const data = await res.json();
    stockSelect.innerHTML = data.stocks
      .map(s => `<option value="${s}">${s}</option>`)
      .join("");
  } catch (err) {
    stockSelect.innerHTML = `<option>API'ye bağlanılamadı</option>`;
  }
}

async function loadPrediction() {
  const ticker = stockSelect.value;
  if (!ticker) return;

  loadBtn.disabled = true;
  loadBtn.textContent = "Yükleniyor...";

  try {
    const res = await fetch(`${API_URL}/predict?ticker=${ticker}&timeframe=${timeframe}`);
    const data = await res.json();

    priceEl.textContent = `${data.last_price} ₺`;
    changeEl.textContent = `${data.change_pct > 0 ? "+" : ""}${data.change_pct}%`;
    changeEl.className = `change ${data.change_pct >= 0 ? "up" : "down"}`;

    const isUp = data.prediction === "yukselis";
    predictionBox.className = `prediction-box ${isUp ? "up" : "down"}`;
    predictionLabel.textContent = isUp ? "YÜKSELİŞ BEKLENİYOR ▲" : "DÜŞÜŞ BEKLENİYOR ▼";
    probabilityEl.textContent = `Model güveni: %${data.probability}`;

    drawChart(data.chart.labels, data.chart.prices);
  } catch (err) {
    predictionLabel.textContent = "Veri alınamadı, tekrar dene.";
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
      labels,
      datasets: [{
        label: "Kapanış Fiyatı",
        data: prices,
        borderColor: "#5b8cff",
        backgroundColor: "rgba(91,140,255,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color: "#232c40" }, ticks: { color: "#7c8aa5" } },
      },
    },
  });
}

loadBtn.addEventListener("click", loadPrediction);
loadStocks();