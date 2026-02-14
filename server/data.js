// server/data.js
const fs = require("fs");
const path = require("path");


const DATA_PATH = path.join(__dirname, "src","data", "expenses.json");

function readExpenses() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(DATA_PATH, "[]", "utf-8");
    }
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("❌ Failed to read expenses.json:", err);
    return [];
  }
}

function writeExpenses(expenses) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(expenses, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("❌ Failed to write expenses.json:", err);
    return false;
  }
}

function getExpenses() {
  return readExpenses();
}

function addExpense(expense) {
  const expenses = readExpenses();
  expenses.push(expense);
  writeExpenses(expenses);
  return expense;
}

function deleteExpenseById(id) {
  const expenses = readExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const deleted = expenses.splice(index, 1)[0];
  writeExpenses(expenses);
  return deleted;
}

module.exports = { getExpenses, addExpense, deleteExpenseById };
