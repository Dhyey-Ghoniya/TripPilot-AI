import api from './api';

const budgetService = {
  /**
   * Get full budget dashboard for a trip
   */
  getDashboard: async (tripId) => {
    return await api.get(`/budget/${tripId}/dashboard`);
  },

  /**
   * Get all expenses for a trip with optional filters
   */
  getExpenses: async (tripId, filters = {}) => {
    return await api.get(`/budget/${tripId}/expenses`, { params: filters });
  },

  /**
   * Add a new expense
   */
  createExpense: async (tripId, expenseData) => {
    return await api.post(`/budget/${tripId}/expenses`, expenseData);
  },

  /**
   * Update an expense
   */
  updateExpense: async (expenseId, updateData) => {
    return await api.put(`/budget/expenses/${expenseId}`, updateData);
  },

  /**
   * Delete an expense
   */
  deleteExpense: async (expenseId) => {
    return await api.delete(`/budget/expenses/${expenseId}`);
  },

  /**
   * Execute AI budget optimization command
   */
  aiOptimize: async (tripId, command) => {
    return await api.post(`/budget/${tripId}/ai-optimize`, { command });
  },
};

export default budgetService;
