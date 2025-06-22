const express = require("express");
const Expense = require("../models/Expense");
const jwt = require("jsonwebtoken");

const router = express.Router();

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    console.log("No Authorization header found");
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.log("No token found after Bearer");
    return res.status(401).json({ message: 'No token provided' });
  }

  console.log("Token received:", token); // <-- Add this line

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("JWT verification error:", err); // <-- And this line
      return res.status(403).json({ message: 'Invalid token' });
    }

    console.log("Decoded token:", decoded); // <-- And this line
    req.userId = decoded.id;
    next();
  });
}


// Add Expense
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, amount, category, date } = req.body;
    const expense = new Expense({ user: req.userId, name, amount, category, date });
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all expenses for user
router.get("/", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.userId });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete expense
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
