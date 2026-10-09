const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All budget routes require authentication
router.use(authenticate);

// ── Budget Dashboard ────────────────────────────────────────────────
// GET /api/v1/budget/:tripId/dashboard
router.get('/:tripId/dashboard', (req, res) => financeController.getBudgetDashboard(req, res));

// ── Expense CRUD ────────────────────────────────────────────────────
// GET /api/v1/budget/:tripId/expenses
router.get('/:tripId/expenses', (req, res) => financeController.getExpenses(req, res));

// POST /api/v1/budget/:tripId/expenses
router.post('/:tripId/expenses', (req, res) => financeController.createExpense(req, res));

// PUT /api/v1/budget/expenses/:expenseId
router.put('/expenses/:expenseId', (req, res) => financeController.updateExpense(req, res));

// DELETE /api/v1/budget/expenses/:expenseId
router.delete('/expenses/:expenseId', (req, res) => financeController.deleteExpense(req, res));

// ── AI Budget Optimization ──────────────────────────────────────────
// POST /api/v1/budget/:tripId/ai-optimize
router.post('/:tripId/ai-optimize', (req, res) => financeController.aiBudgetOptimize(req, res));

module.exports = router;
