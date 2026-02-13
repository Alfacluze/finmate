let watchlist = [];
let portfolio = [];

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function showError(msg) {
  const box = $("errorBox");
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 3000);
}

async function loadData() {
  const res = await fetch("/api/invest"); 
  if (!res.ok) throw new Error("Failed to fetch data");
  const data = await res.json();
  watchlist = data.watchlist.map(w => ({ ...w, prev: w.price }));
  portfolio = data.portfolio;
  renderAll();
}

function renderAll() {
  renderWatchlist();
  renderPortfolio();
  renderSummary();
}

function renderWatchlist() {
  const body = $("watchlistBody");
  body.innerHTML = "";

  watchlist.forEach(w => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${w.ticker}</strong></td><td>${fmt(w.price)}</td>`;
    body.appendChild(tr);
  });

  $("watchCount").textContent = String(watchlist.length);
}

function renderPortfolio() {
  const body = $("portfolioBody");
  body.innerHTML = "";

  portfolio.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.ticker}</strong></td>
      <td>${fmt(p.buyPrice)}</td>
      <td>${fmt(p.current)}</td>
      <td>${p.shares}</td>
    `;
    body.appendChild(tr);
  });
}

function renderSummary() {
  const cost = portfolio.reduce((s, p) => s + p.buyPrice * p.shares, 0);
  const market = portfolio.reduce((s, p) => s + p.current * p.shares, 0);
  const pl = market - cost;

  $("costBasis").textContent = fmt(cost);
  $("marketValue").textContent = fmt(market);
  $("plValue").textContent = `${pl < 0 ? "-" : ""}${fmt(Math.abs(pl))}`;

  const max = Math.max(cost, market, 1);
  $("costBar").style.width = `${Math.max(3, (cost / max) * 100)}%`;
  $("marketBar").style.width = `${Math.max(3, (market / max) * 100)}%`;
}

function simulatePriceTick() {
  // Random walk prices (demo “live”)
  watchlist.forEach(w => {
    w.prev = w.price;
    const step = (Math.random() - 0.5) * 0.02; // +/- ~1%
    w.price = Math.max(0.01, +(w.price * (1 + step)).toFixed(2));
  });

  // Sync portfolio current to watchlist if ticker exists
  portfolio.forEach(p => {
    const w = watchlist.find(x => x.ticker === p.ticker);
    if (w) p.current = w.price;
    else {
      const step = (Math.random() - 0.5) * 0.01;
      p.current = Math.max(0.01, +(p.current * (1 + step)).toFixed(2));
    }
  });

  renderAll();
}

/** Modal logic */
const overlay = $("modalOverlay");

function openModal(mode = "portfolio") {
  modalMode = mode;

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");

  const buy = $("addForm").buyPrice;
  const sh = $("addForm").shares;

  if (mode === "watchlist") {
    $("modalTitle").textContent = "Add Watchlist Ticker";
    $("investmentFields").style.display = "none";

    // IMPORTANT: avoid HTML required blocking submit
    buy.required = false;
    sh.required = false;
    buy.disabled = true;
    sh.disabled = true;
  } else {
    $("modalTitle").textContent = "Add Investment";
    $("investmentFields").style.display = "grid";

    buy.disabled = false;
    sh.disabled = false;
    buy.required = true;
    sh.required = true;
  }
}


function closeModal() { overlay.classList.remove("open"); overlay.setAttribute("aria-hidden", "true"); $("addForm").reset(); $("addForm").shares.value = "1"; }

$("openModalBtn").addEventListener("click", () => openModal("portfolio"));
$("openWatchModalBtn").addEventListener("click", () => openModal("watchlist"));
$("closeModalBtn").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

$("addForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const ticker = e.target.ticker.value.trim().toUpperCase();
  if (!ticker) return showError("Ticker is required.");

  if (modalMode === "watchlist") {
    if (watchlist.find(w => w.ticker === ticker)) {
      return showError("Ticker already exists.");
    }

    const price = +(25 + Math.random() * 200).toFixed(2);
    watchlist.unshift({ticker,price,prev: price});

    closeModal();
    renderWatchlist();
    return;
  }

  // Portfolio Mode
  const buyPrice = Number(e.target.buyPrice.value);
  const shares = Number(e.target.shares.value);

  if (!Number.isFinite(buyPrice) || buyPrice <= 0)
    return showError("Enter valid buy price.");

  if (!Number.isFinite(shares) || shares <= 0)
    return showError("Enter valid shares.");

  let currentPrice;
  const w = watchlist.find(x => x.ticker === ticker);
  if (w) currentPrice = w.price;
  else currentPrice = +(buyPrice * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2);

  const existing = portfolio.find(p => p.ticker === ticker);

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
      current: currentPrice
    });
  }

  closeModal();
  renderAll();
});


$("refreshBtn").addEventListener("click", simulatePriceTick);

// Init
loadData().catch(() => {
  // If fetch fails (e.g., opened via file://), fallback to hardcoded data so page still works.
  watchlist = [
    { ticker: "AAPL", price: 189.12, prev: 189.12 },
    { ticker: "TSLA", price: 214.70, prev: 214.70 },
    { ticker: "MSFT", price: 412.05, prev: 412.05 }
  ];
  portfolio = [
    { ticker: "AAPL", buyPrice: 160.00, shares: 2, current: 189.12 },
    { ticker: "MSFT", buyPrice: 350.00, shares: 1, current: 412.05 }
  ];
  renderAll();
});

// Add simple watchlist ticker
$("saveTickerBtn").addEventListener("click", () => {
  const input = $("newTickerInput");
  const ticker = input.value.trim().toUpperCase();

  if (!ticker) return showError("Enter a ticker symbol.");

  // Prevent duplicates
  if (watchlist.find(w => w.ticker === ticker)) {
    return showError("Ticker already exists.");
  }

  // Fake starting price (A1 safe demo)
  const price = +(100 + Math.random() * 200).toFixed(2);

  watchlist.unshift({
    ticker,
    price,
    prev: price
  });

  input.value = "";
  renderWatchlist();
});

// Auto “live” demo tick every 4 seconds
setInterval(simulatePriceTick, 4000);