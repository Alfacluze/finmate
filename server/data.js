// server/data.js
// ✅ A1 requirement: JSON object list that we can add/remove items from

let expenses = [
  {
    id: "e1",
    title: "Groceries",
    amount: 55.2,
    category: "Food",
    date: "2026-02-01",
  },
];

function getExpenses() {
  return expenses;
}

function addExpense(expense) {
  expenses.push(expense);
  return expense;
}

function deleteExpenseById(id) {
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return null;
  return expenses.splice(index, 1)[0];
}

module.exports = { getExpenses, addExpense, deleteExpenseById };
