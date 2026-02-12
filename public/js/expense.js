const tbody = document.getElementById("expenseTbody");
const form = document.getElementById("expenseForm");
const formMsg = document.getElementById("formMsg");
const listMsg = document.getElementById("listMsg");

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function setMsg(el, msg) {
  el.textContent = msg || "";
}

async function loadExpenses() {
  setMsg(listMsg, "Loading...");
  try {
    const res = await fetch("/api/expenses");
    const data = await res.json();

    if (!res.ok) {
      setMsg(listMsg, data.message || "Failed to load expenses.");
      return;
    }

    renderTable(data);
    setMsg(listMsg, data.length ? "" : "No expenses yet. Add your first one!");
  } catch {
    setMsg(listMsg, "Server error: could not fetch expenses.");
  }
}

function renderTable(expenses) {
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

  tbody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteExpense(btn.dataset.id);
    });
  });
}

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  await addExpense({ title, amount, category, date });
});

loadExpenses();
