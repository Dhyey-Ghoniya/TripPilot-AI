const financeService = require('../services/finance.service');
const ApiResponse = require('../utils/apiResponse');

class FinanceController {
  // ─── EXPENSE CRUD ──────────────────────────────────────────────────

  /**
   * POST /api/v1/budget/:tripId/expenses
   * Create a new expense for a trip
   */
  async createExpense(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user._id;
      const expense = await financeService.createExpense(userId, tripId, req.body);
      return ApiResponse.success(res, expense, 'Expense added successfully.', 201);
    } catch (err) {
      return ApiResponse.error(res, err.message, err.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/budget/:tripId/expenses
   * Get all expenses for a trip (with optional filters)
   */
  async getExpenses(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user._id;
      const filters = {
        category: req.query.category,
        costType: req.query.costType,
        dayNumber: req.query.dayNumber,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };
      const expenses = await financeService.getExpenses(tripId, userId, filters);
      return ApiResponse.success(res, expenses, 'Expenses retrieved.');
    } catch (err) {
      return ApiResponse.error(res, err.message, err.statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/budget/expenses/:expenseId
   * Update an expense
   */
  async updateExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const userId = req.user._id;
      const expense = await financeService.updateExpense(expenseId, userId, req.body);
      return ApiResponse.success(res, expense, 'Expense updated.');
    } catch (err) {
      return ApiResponse.error(res, err.message, err.statusCode || 500);
    }
  }

  /**
   * DELETE /api/v1/budget/expenses/:expenseId
   * Delete an expense
   */
  async deleteExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const userId = req.user._id;
      const result = await financeService.deleteExpense(expenseId, userId);
      return ApiResponse.success(res, result, 'Expense deleted.');
    } catch (err) {
      return ApiResponse.error(res, err.message, err.statusCode || 500);
    }
  }

  // ─── BUDGET DASHBOARD ─────────────────────────────────────────────

  /**
   * GET /api/v1/budget/:tripId/dashboard
   * Full budget dashboard with aggregations, alerts, and daily costs
   */
  async getBudgetDashboard(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user._id;
      const dashboard = await financeService.getBudgetDashboard(tripId, userId);
      return ApiResponse.success(res, dashboard, 'Budget dashboard loaded.');
    } catch (err) {
      return ApiResponse.error(res, err.message, err.statusCode || 500);
    }
  }

  // ─── AI BUDGET COPILOT ────────────────────────────────────────────

  /**
   * POST /api/v1/budget/:tripId/ai-optimize
   * Process AI budget optimization command
   */
  async aiBudgetOptimize(req, res) {
    try {
      const { tripId } = req.params;
      const userId = req.user._id;
      const { command } = req.body;

      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        return ApiResponse.error(res, 'A budget optimization command is required.', 400);
      }

      const result = await financeService.processBudgetCommand(tripId, userId, command.trim());
      return ApiResponse.success(res, result, result.message || 'Budget optimization processed.');
    } catch (err) {
      return ApiResponse.error(res, err.message, err.statusCode || 500);
    }
  }
}

module.exports = new FinanceController();
