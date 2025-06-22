// backend/models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    amount: Number,
    category: String,
    date: String
});

module.exports = mongoose.model("Expense", expenseSchema);
