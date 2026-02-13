// Expense Page (A1): GET + POST + DELETE
// + Welcome message
// + Budget totals (client-side)
// + Pie chart (small, transparent, crisp)

// ---- DOM ----
const welcomeTitle = document.getElementById("welcomeTitle");

const tbody = document.getElementById("expenseTbody");
const form = document.getElementById("expenseForm");

const formMsg = document.getElementById("formMsg");
const listMsg = document.getElementById("listMsg");

// Budget cards
const totalBudgetEl = document.getElementById("totalBudget");
const totalSpentEl = document.getElementById("totalSpent");
const remainingBudgetEl = document.getElementById("remainingBudget");

const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");

// Pie chart
const pieCanvas = document.getElementById("categoryPie");
const pieLegend = document.getElementById("pieLegend");

// ---- Helpers ----
function setMsg(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

// // (1) Welcome back <name>
// // =====================
// const USER_KEY = "finmate_username";

// function getUserName() {
//   let name = localStorage.getItem(USER_KEY);
//   if (!name) {
//     name = prompt("Enter your name (for Welcome message):") || "there";
//     name = name.trim() || "there";
//     localStorage.setItem(USER_KEY, name);
//   }
//   return name;
// }

// (function setWelcomeMessage() {
//   if (!welcomeTitle) return;
//   const name = getUserName();
//   welcomeTitle.textContent = `Welcome back ${name} 👋`;
// })();

// =====================
// (2) Budget (client-side only for A1)
// =====================
const BUDGET_KEY = "finmate_budget";

function getBudget() {
  const raw = localStorage.getItem(BUDGET_KEY);
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function setBudget(val) {
  localStorage.setItem(BUDGET_KEY, String(val));
}

function syncBudgetUI() {
  const budget = getBudget();
  if (totalBudgetEl) totalBudgetEl.textContent = money(budget);
  if (budgetInput) budgetInput.value = budget ? String(budget) : "";
}

saveBudgetBtn?.addEventListener("click", async () => {
  const val = Number(budgetInput.value);
  if (!Number.isFinite(val) || val < 0) {
    alert("Please enter a valid budget (0 or higher).");
    return;
  }
  setBudget(val);
  syncBudgetUI();
  await loadExpenses();
});

// (3) API: GET -> Render table + totals + pie

async function loadExpenses() {
  setMsg(listMsg, "Loading...");
  try {
    const res = await fetch("/api/expenses");
    const data = await res.json();

    if (!res.ok) {
      setMsg(listMsg, data.message || "Failed to load expenses.");
      return;
    }

    renderExpenses(data);
    renderTotals(data);
    renderPieFromExpenses(data);

    setMsg(listMsg, data.length ? "" : "No expenses yet. Add your first one!");
  } catch {
    setMsg(listMsg, "Server error: could not fetch expenses.");
  }
}

function renderExpenses(expenses) {
  if (!tbody) return;
  tbody.innerHTML = "";

  expenses.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.title}</td>
      <td>${e.category}</td>
      <td>${money(e.amount)}</td>
      <td>${e.date}</td>
      <td>
        <button class="btn btn-secondary" data-id="${e.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // DELETE buttons
  tbody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteExpense(btn.dataset.id);
    });
  });
}

function renderTotals(expenses) {
  const spent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const budget = getBudget();
  const remaining = budget - spent;

  if (totalSpentEl) totalSpentEl.textContent = money(spent);
  if (remainingBudgetEl) remainingBudgetEl.textContent = money(remaining);
}
// (4) POST -> Add Expense
async function addExpense(payload) {
  setMsg(formMsg, "Adding...");
  try {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg(formMsg, data.message || "Failed to add expense.");
      return;
    }

    setMsg(formMsg, "Added!");
    form.reset();
    await loadExpenses();
  } catch {
    setMsg(formMsg, "Server error: could not add expense.");
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title")?.value.trim();
  const amount = document.getElementById("amount")?.value;
  const category = document.getElementById("category")?.value;
  const date = document.getElementById("date")?.value;

  await addExpense({ title, amount, category, date });
});

// (5) DELETE -> Remove Expense

async function deleteExpense(id) {
  setMsg(listMsg, "Deleting...");
  try {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setMsg(listMsg, data.message || "Failed to delete expense.");
      return;
    }

    await loadExpenses();
  } catch {
    setMsg(listMsg, "Server error: could not delete expense.");
  }
}

// (6) Pie chart (small + transparent + crisp)
function renderPieFromExpenses(expenses) {
  if (!pieCanvas) return;

  const byCategory = {};
  for (const e of expenses) {
    const cat = e.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
  }

  drawPieChart(byCategory);
}

function drawPieChart(byCategory) {
  const entries = Object.entries(byCategory).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  const ctx = pieCanvas.getContext("2d");
  if (total <= 0) {
    if (pieLegend) pieLegend.textContent = "Add expenses to see the chart.";
    ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);
    return;
  }

  // Crisp scaling
  const cssWidth = 280;
  const cssHeight = 180;
  const dpr = window.devicePixelRatio || 1;

  pieCanvas.style.width = cssWidth + "px";
  pieCanvas.style.height = cssHeight + "px";
  pieCanvas.width = Math.floor(cssWidth * dpr);
  pieCanvas.height = Math.floor(cssHeight * dpr);

  // Draw in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // Transparent background: do NOT draw a background rect.

  const colors = ["#27d17f", "#60a5fa", "#fbbf24", "#fb7185", "#a78bfa", "#34d399", "#f472b6"];

  const cx = 95;
  const cy = 90;
  const radius = 65;

  let start = -Math.PI / 2;

  if (pieLegend) pieLegend.innerHTML = "";

  entries.forEach(([cat, val], i) => {
    const slice = (val / total) * Math.PI * 2;
    const end = start + slice;
    const color = colors[i % colors.length];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    const pct = ((val / total) * 100).toFixed(1);
    if (pieLegend) {
      const item = document.createElement("div");
      item.innerHTML =
        `<span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:2px;margin-right:8px;"></span>` +
        `${cat} — ${money(val)} (${pct}%)`;
      pieLegend.appendChild(item);
    }

    start = end;
  });
}

// Init
syncBudgetUI();
loadExpenses();
