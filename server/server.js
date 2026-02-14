const express = require("express");
const path = require("path");
const fs = require("fs");


const { getExpenses, addExpense, deleteExpenseById } = require("./data");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// HTML Page Routes (3 pages)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "home.html"));
});

app.get("/expenses", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "expense.html"));
});

app.get("/investments", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "invest.html"));
});

// REST API: GET, POST, DELETE (expenses)
app.get("/api/expenses", (req, res) => {
  return res.status(200).json(getExpenses());
});

app.post("/api/expenses", (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || amount === undefined || !category || !date) {
    return res.status(400).json({
      message: "Missing required fields: title, amount, category, date",
    });
  }

  const numAmount = Number(amount);
  if (Number.isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number" });
  }

  const newExpense = {
    id: "e_" + Date.now(),
    title: String(title).trim(),
    amount: numAmount,
    category: String(category),
    date: String(date),
  };

  addExpense(newExpense);
  return res.status(201).json(newExpense);
});

app.get("/api/invest", (req, res) => {
  // read invest.json from server folder (adjust path if yours differs)
  const dataPath = path.join(__dirname, "src", "data", "invest.json");
  fs.readFile(dataPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading invest.json:", err);
      return res.status(500).json({ error: "Failed to load invest data" });
    }

    try {
      return res.status(200).json(JSON.parse(data)); // 200 OK
    } catch (parseError) {
      return res.status(500).json({ error: "Invalid invest JSON format" });
    }
  });
});

app.delete("/api/expenses/:id", (req, res) => {
  const deleted = deleteExpenseById(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: "Expense not found" });
  }

  return res.status(200).json({ message: "Deleted", deleted });
});

// Summary route (must be BEFORE 404)
app.get("/api/summary", (req, res) => {
  const expenses = getExpenses();

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const subsMonthly = expenses
    .filter((e) => String(e.category || "").toLowerCase() === "subscriptions")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Category totals
  const byCategoryMap = {};
  for (const e of expenses) {
    const cat = e.category || "Other";
    byCategoryMap[cat] = (byCategoryMap[cat] || 0) + Number(e.amount || 0);
  }

  const byCategory = Object.entries(byCategoryMap)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => ({ category, total }));

  // Trend by date
  const byDateMap = {};
  for (const e of expenses) {
    const d = e.date || "Unknown";
    byDateMap[d] = (byDateMap[d] || 0) + Number(e.amount || 0);
  }

  const trend = Object.entries(byDateMap)
    .filter(([d]) => d !== "Unknown")
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, spent]) => ({ date, spent }));

  return res.json({
    totalExpenses,
    subsMonthly,
    byCategory,
    trend,
  });
});
// ONE 404 handler (MUST be last)
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// ONE listen (MUST be last)
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
