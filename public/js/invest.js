let watchlist = [];
let portfolio = [];
let rawInvestData = null;

const $ = (id) => document.getElementById(id);
const fmt = (n) =>
  Number(n).toLocaleString(undefined, { style: "currency", currency: "USD" });

let modalMode = "portfolio";
let activeRange = "1M";
let editingTicker = null;
const chartSeries = {
  "1D": [],
  "1W": [],
  "1M": [],
  "1Y": [],
};

function showError(msg) {
  const box = $("errorBox");
  if (!box) return;

  box.textContent = msg;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

async function loadData() {
  const res = await fetch("/api/invest");
  if (!res.ok) throw new Error("Failed to fetch data");

  rawInvestData = await res.json();

  watchlist = (rawInvestData.watchlist || []).map((w) => ({
    ...w,
    prev: w.price,
  }));

  portfolio = (rawInvestData.portfolio || []).map((p) => ({
    ...p,
  }));

  initializeChartHistory();
  renderAll();
}

function renderAll() {
  renderWatchlist();
  renderPortfolio();
  renderSummary();
  renderChart();
}

function renderWatchlist() {
  const body = $("watchlistBody");
  if (!body) return;

  body.innerHTML = "";

  watchlist.forEach((w) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${w.ticker}</strong></td>
      <td>${fmt(w.price)}</td>
      <td style="text-align:right;">
        <button class="iconBtn" type="button" data-remove-watch="${w.ticker}" aria-label="Remove">✕</button>
      </td>
    `;
    body.appendChild(tr);
  });

  const watchCount = $("watchCount");
  if (watchCount) watchCount.textContent = String(watchlist.length);

  body.onclick = (e) => {
    const btn = e.target.closest("[data-remove-watch]");
    if (!btn) return;

    const ticker = btn.getAttribute("data-remove-watch");
    watchlist = watchlist.filter((w) => w.ticker !== ticker);
    renderAll();
  };
}

function renderPortfolio() {
  const body = $("portfolioBody");
  if (!body) return;

  body.innerHTML = "";

  portfolio.forEach((p) => {
    const tr = document.createElement("tr");

    const value = p.current * p.shares;
    const plPercent = p.buyPrice > 0 ? ((p.current - p.buyPrice) / p.buyPrice) * 100 : 0;
    const plColor = plPercent >= 0 ? "#38d39f" : "#ff6b6b";

    tr.innerHTML = `
      <td><strong>${p.ticker}</strong></td>
      <td>${fmt(p.buyPrice)}</td>
      <td>${fmt(p.current)}</td>
      <td>${p.shares}</td>
      <td>${fmt(value)}</td>
      <td style="color:${plColor}">${plPercent.toFixed(2)}%</td>
      <td style="text-align:right; white-space:nowrap;">
        <button class="iconBtn btn-sm editBtn" type="button" data-edit-port="${p.ticker}" aria-label="Update">Edit</button>
        <button class="iconBtn btn-sm" type="button" data-remove-port="${p.ticker}" aria-label="Remove">✕</button>
      </td>
    `;

    body.appendChild(tr);
  });

  body.onclick = (e) => {
      const editBtn = e.target.closest("[data-edit-port]");
      if (editBtn) {
        const ticker = editBtn.getAttribute("data-edit-port");
        openEditModal(ticker);
        return;
      }

      const removeBtn = e.target.closest("[data-remove-port]");
      if (removeBtn) {
        const ticker = removeBtn.getAttribute("data-remove-port");
        portfolio = portfolio.filter((p) => p.ticker !== ticker);

        initializeChartHistory();
        renderAll();
      }
    };
}

function renderSummary() {
  const cost = getTotalCost();
  const market = getTotalMarket();
  const pl = market - cost;

  const costBasis = $("costBasis");
  const marketValue = $("marketValue");
  const plValue = $("plValue");
  const costBar = $("costBar");
  const marketBar = $("marketBar");

  if (costBasis) costBasis.textContent = fmt(cost);
  if (marketValue) marketValue.textContent = fmt(market);
  if (plValue) plValue.textContent = `${pl < 0 ? "-" : ""}${fmt(Math.abs(pl))}`;

  if (costBar && marketBar) {
    const max = Math.max(cost, market, 1);
    costBar.style.width = `${Math.max(3, (cost / max) * 100)}%`;
    marketBar.style.width = `${Math.max(3, (market / max) * 100)}%`;
  }
}

function getTotalCost() {
  return portfolio.reduce((sum, p) => sum + p.buyPrice * p.shares, 0);
}

function getTotalMarket() {
  return portfolio.reduce((sum, p) => sum + p.current * p.shares, 0);
}

function simulatePriceTick() {
  watchlist.forEach((w) => {
    w.prev = w.price;
    const step = (Math.random() - 0.5) * 0.02;
    w.price = Math.max(0.01, +(w.price * (1 + step)).toFixed(2));
  });

  portfolio.forEach((p) => {
    const match = watchlist.find((x) => x.ticker === p.ticker);

    if (match) {
      p.current = match.price;
    } else {
      const step = (Math.random() - 0.5) * 0.01;
      p.current = Math.max(0.01, +(p.current * (1 + step)).toFixed(2));
    }
  });

  updateLiveChartPoint();
  renderAll();
}

/* =========================
   Chart setup
========================= */

function initializeChartHistory() {
  const totalCost = getTotalCost();
  const totalMarket = getTotalMarket();

  chartSeries["1D"] = buildSeries({
    points: 24,
    volatility: 0.008,
    startValue: totalMarket,
    totalCost,
    unit: "hour",
  });

  chartSeries["1W"] = buildSeries({
    points: 7,
    volatility: 0.015,
    startValue: totalMarket,
    totalCost,
    unit: "day",
  });

  chartSeries["1M"] = buildSeries({
    points: 30,
    volatility: 0.02,
    startValue: totalMarket,
    totalCost,
    unit: "day",
  });

  chartSeries["1Y"] = buildSeries({
    points: 12,
    volatility: 0.05,
    startValue: totalMarket,
    totalCost,
    unit: "month",
  });

  syncSeriesLastPoint();
}

function buildSeries({ points, volatility, startValue, totalCost, unit }) {
  const now = new Date();
  const safeStartValue = Math.max(startValue, 1);
  const values = new Array(points);

  values[points - 1] = Number(safeStartValue.toFixed(2));

  for (let i = points - 2; i >= 0; i--) {
    const reverseStep = 1 + (Math.random() - 0.5) * volatility * 2;
    values[i] = Math.max(1, +(values[i + 1] / reverseStep).toFixed(2));
  }

  return values.map((market, index) => {
    const date = new Date(now);

    if (unit === "hour") {
      date.setHours(now.getHours() - (points - 1 - index));
    } else if (unit === "day") {
      date.setDate(now.getDate() - (points - 1 - index));
    } else {
      date.setMonth(now.getMonth() - (points - 1 - index));
    }

    return {
      label: formatLabelForUnit(date, unit),
      cost: +totalCost.toFixed(2),
      market,
    };
  });
}

function formatLabelForUnit(date, unit) {
  if (unit === "hour") {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  if (unit === "month") {
    return date.toLocaleDateString([], { month: "short", year: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function syncSeriesLastPoint() {
  const totalCost = getTotalCost();
  const totalMarket = getTotalMarket();

  Object.values(chartSeries).forEach((series) => {
    if (!series.length) return;
    series[series.length - 1].cost = +totalCost.toFixed(2);
    series[series.length - 1].market = +totalMarket.toFixed(2);
  });
}

function updateLiveChartPoint() {
  syncSeriesLastPoint();
}

function renderChart() {
  const series = chartSeries[activeRange] || [];
  if (!series.length) return;

  const svg = $("portfolioChart");
  const grid = $("chartGridLines");
  const costPolyline = $("costPolyline");
  const marketPolyline = $("marketPolyline");

  if (!svg || !grid || !costPolyline || !marketPolyline) return;

  const svgWidth = 900;
  const svgHeight = 320;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };

  const values = series.flatMap((p) => [p.cost, p.market]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(maxValue - minValue, 1);

  const usableWidth = svgWidth - padding.left - padding.right;
  const usableHeight = svgHeight - padding.top - padding.bottom;

  const toX = (index) => {
    if (series.length <= 1) return padding.left;
    return padding.left + (index / (series.length - 1)) * usableWidth;
  };

  const toY = (value) =>
    padding.top + ((maxValue - value) / valueRange) * usableHeight;

  const costPoints = series
    .map((point, index) => `${toX(index)},${toY(point.cost)}`)
    .join(" ");

  const marketPoints = series
    .map((point, index) => `${toX(index)},${toY(point.market)}`)
    .join(" ");

  costPolyline.setAttribute("points", costPoints);
  marketPolyline.setAttribute("points", marketPoints);

  renderChartGrid({
    grid,
    svgWidth,
    padding,
    usableHeight,
    maxValue,
    valueRange,
  });

  renderAxisLabels(series);
  renderChartStats(series);
  bindChartTooltip({ svg, series });
}

function renderChartGrid({ grid, svgWidth, padding, usableHeight, maxValue, valueRange }) {
  grid.innerHTML = "";

  const lineCount = 5;

  for (let i = 0; i < lineCount; i++) {
    const ratio = i / (lineCount - 1);
    const y = padding.top + usableHeight * ratio;
    const value = maxValue - ratio * valueRange;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("x2", svgWidth - padding.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "rgba(255,255,255,0.08)");
    line.setAttribute("stroke-width", "1");
    grid.appendChild(line);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 5);
    text.setAttribute("y", y + 4);
    text.setAttribute("class", "chartYAxis");
    text.textContent = fmt(value);
    grid.appendChild(text);
  }
}

function renderAxisLabels(series) {
  const labelsEl = $("chartAxisLabels");
  if (!labelsEl) return;

  labelsEl.innerHTML = "";

  const indexes = Array.from(
    new Set([
      0,
      Math.floor((series.length - 1) * 0.33),
      Math.floor((series.length - 1) * 0.66),
      series.length - 1,
    ])
  );

  indexes.forEach((index) => {
    const span = document.createElement("span");
    span.textContent = series[index].label;
    labelsEl.appendChild(span);
  });
}

function renderChartStats(series) {
  const start = series[0].market;
  const end = series[series.length - 1].market;
  const change = end - start;

  const startEl = $("rangeStartValue");
  const endEl = $("rangeEndValue");
  const changeEl = $("rangeChangeValue");

  if (startEl) startEl.textContent = fmt(start);
  if (endEl) endEl.textContent = fmt(end);
  if (changeEl) changeEl.textContent = `${change < 0 ? "-" : ""}${fmt(Math.abs(change))}`;
}

function bindChartTooltip({ svg, series }) {
  const tooltip = $("chartTooltip");
  if (!tooltip) return;

  svg.onmousemove = (e) => {
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const rawIndex = (x / rect.width) * (series.length - 1);
    const index = Math.max(0, Math.min(series.length - 1, Math.round(rawIndex)));
    const point = series[index];

    if (!point) return;

    tooltip.style.display = "block";
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${e.clientY - rect.top}px`;

    tooltip.innerHTML = `
      <strong>${point.label}</strong><br>
      Cost: ${fmt(point.cost)}<br>
      Value: ${fmt(point.market)}
    `;
  };

  svg.onmouseleave = () => {
    tooltip.style.display = "none";
  };
}

function setActiveRange(range) {
  activeRange = range;

  document.querySelectorAll(".rangeTab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.range === range);
  });

  renderChart();
}

function bindChartRangeTabs() {
  const wrap = $("chartRangeTabs");
  if (!wrap) return;

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".rangeTab");
    if (!btn) return;
    setActiveRange(btn.dataset.range);
  });
}

/* =========================
   Modal logic
========================= */

const overlay = $("modalOverlay");

function openModal(mode = "portfolio") {
  if (!overlay) return;

  modalMode = mode;
  editingTicker = null;

  const submitBtn = $("submitInvestmentBtn");
  if (submitBtn) submitBtn.textContent = "Add";

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");

  const form = $("addForm");
  if (!form) return;

  const buy = form.buyPrice;
  const sh = form.shares;

  if (mode === "watchlist") {
    $("modalTitle").textContent = "Add Watchlist Ticker";
    $("investmentFields").style.display = "none";
    form.ticker.disabled = false;
    buy.required = false;
    sh.required = false;
    buy.disabled = true;
    sh.disabled = true;
  } else {
    $("modalTitle").textContent = "Add Investment";
    $("investmentFields").style.display = "grid";
    form.ticker.disabled = false;
    buy.disabled = false;
    sh.disabled = false;
    buy.required = true;
    sh.required = true;
  }
}
function openEditModal(ticker) {
  if (!overlay) return;

  const item = portfolio.find((p) => p.ticker === ticker);
  if (!item) return showError("Investment not found.");

  modalMode = "edit";
  editingTicker = ticker;

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");

  const form = $("addForm");
  if (!form) return;

  $("modalTitle").textContent = "Edit Investment";
  const submitBtn = $("submitInvestmentBtn");
  if (submitBtn) submitBtn.textContent = "Update";
  $("investmentFields").style.display = "grid";

  form.ticker.value = item.ticker;
  form.ticker.disabled = true;

  form.buyPrice.disabled = false;
  form.shares.disabled = false;

  form.buyPrice.required = true;
  form.shares.required = true;

  form.buyPrice.value = item.buyPrice;
  form.shares.value = item.shares;
}

function closeModal() {
  if (!overlay) return;

  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");

  const form = $("addForm");
  if (!form) return;

  form.reset();
  form.ticker.disabled = false;
  form.buyPrice.disabled = false;
  form.shares.disabled = false;
  form.shares.value = "1";
  const submitBtn = $("submitInvestmentBtn");
  if (submitBtn) submitBtn.textContent = "Add";

  editingTicker = null;
}

if ($("openModalBtn")) $("openModalBtn").addEventListener("click", () => openModal("portfolio"));
if ($("openWatchModalBtn")) $("openWatchModalBtn").addEventListener("click", () => openModal("watchlist"));
if ($("closeModalBtn")) $("closeModalBtn").addEventListener("click", closeModal);
if ($("cancelBtn")) $("cancelBtn").addEventListener("click", closeModal);

if (overlay) {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}

if ($("addForm")) {
  $("addForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const ticker = e.target.ticker.value.trim().toUpperCase();
    if (!ticker) return showError("Ticker is required.");
    if (modalMode === "edit") {
        const buyPrice = Number(e.target.buyPrice.value);
        const shares = Number(e.target.shares.value);

        if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
          return showError("Enter valid buy price.");
        }

        if (!Number.isFinite(shares) || shares <= 0) {
          return showError("Enter valid shares.");
        }

        const item = portfolio.find((p) => p.ticker === editingTicker);
        if (!item) {
          return showError("Investment not found.");
        }

        item.buyPrice = +buyPrice.toFixed(2);
        item.shares = +shares.toFixed(4);

        initializeChartHistory();
        closeModal();
        renderAll();
        return;
      }
    if (modalMode === "watchlist") {
      if (watchlist.find((w) => w.ticker === ticker)) {
        return showError("Ticker already exists.");
      }

      const price = +(25 + Math.random() * 200).toFixed(2);
      watchlist.unshift({ ticker, price, prev: price });

      closeModal();
      renderAll();
      return;
    }

    const buyPrice = Number(e.target.buyPrice.value);
    const shares = Number(e.target.shares.value);

    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      return showError("Enter valid buy price.");
    }

    if (!Number.isFinite(shares) || shares <= 0) {
      return showError("Enter valid shares.");
    }

    let currentPrice;
    const watch = watchlist.find((x) => x.ticker === ticker);

    if (watch) {
      currentPrice = watch.price;
    } else {
      currentPrice = +(buyPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2);
    }

    const existing = portfolio.find((p) => p.ticker === ticker);

    if (existing) {
      const totalShares = existing.shares + shares;
      const weightedBuy =
        (existing.buyPrice * existing.shares + buyPrice * shares) / totalShares;

      existing.shares = +totalShares.toFixed(4);
      existing.buyPrice = +weightedBuy.toFixed(2);
      existing.current = currentPrice;
    } else {
      portfolio.unshift({
        ticker,
        buyPrice: +buyPrice.toFixed(2),
        shares: +shares.toFixed(4),
        current: currentPrice,
      });
    }

    initializeChartHistory();
    closeModal();
    renderAll();
  });
}

/* =========================
   Init
========================= */

bindChartRangeTabs();

loadData().catch(() => {
  watchlist = [
    { ticker: "AAPL", price: 189.12, prev: 189.12 },
    { ticker: "TSLA", price: 214.7, prev: 214.7 },
    { ticker: "MSFT", price: 412.05, prev: 412.05 },
  ];

  portfolio = [
    { ticker: "AAPL", buyPrice: 160.0, shares: 2, current: 189.12 },
    { ticker: "MSFT", buyPrice: 350.0, shares: 1, current: 412.05 },
  ];

  initializeChartHistory();
  renderAll();
});

setInterval(simulatePriceTick, 4000);