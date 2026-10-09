const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

class FinanceService {
  // ─── CATEGORY CONSTANTS ────────────────────────────────────────────
  static CATEGORIES = ['Flights', 'Hotels', 'Food', 'Activities', 'Transport', 'Shopping', 'Miscellaneous'];

  static CATEGORY_ICONS = {
    Flights: '✈️',
    Hotels: '🏨',
    Food: '🍽️',
    Activities: '🎯',
    Transport: '🚕',
    Shopping: '🛍️',
    Miscellaneous: '📦',
  };

  // Budget allocation ratios for AI estimation
  static DEFAULT_ALLOCATION = {
    Flights: 0.30,
    Hotels: 0.28,
    Food: 0.15,
    Activities: 0.12,
    Transport: 0.08,
    Shopping: 0.05,
    Miscellaneous: 0.02,
  };

  // ─── EXPENSE CRUD ──────────────────────────────────────────────────

  /**
   * Create a new expense entry
   */
  async createExpense(userId, tripId, expenseData) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw this._error('Trip not found', 404);
    if (trip.userId.toString() !== userId.toString()) throw this._error('Access denied', 403);

    const expense = new Expense({
      ...expenseData,
      tripId,
      userId,
      currency: expenseData.currency || trip.budget?.currency || 'INR',
    });

    await expense.save();

    // Sync spent on trip budget
    await this._syncTripSpent(tripId);

    return expense;
  }

  /**
   * Get all expenses for a trip with optional filters
   */
  async getExpenses(tripId, userId, filters = {}) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw this._error('Trip not found', 404);

    // Allow owner or public shared trips
    if (trip.userId.toString() !== userId.toString() && !trip.shareSettings?.isPublic) {
      throw this._error('Access denied', 403);
    }

    const query = { tripId };

    if (filters.category) query.category = filters.category;
    if (filters.costType) query.costType = filters.costType;
    if (filters.dayNumber) query.dayNumber = parseInt(filters.dayNumber, 10);
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }

    const expenses = await Expense.find(query).sort({ date: 1, createdAt: 1 });
    return expenses;
  }

  /**
   * Update an expense
   */
  async updateExpense(expenseId, userId, updateData) {
    const expense = await Expense.findById(expenseId);
    if (!expense) throw this._error('Expense not found', 404);
    if (expense.userId.toString() !== userId.toString()) throw this._error('Access denied', 403);

    const allowedFields = [
      'title', 'description', 'amount', 'currency', 'category',
      'costType', 'date', 'dayNumber', 'paidBy', 'paymentMethod',
      'receiptUrl', 'tags', 'notes', 'isIncludedInBudget',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        expense[field] = updateData[field];
      }
    });

    await expense.save();
    await this._syncTripSpent(expense.tripId);

    return expense;
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId, userId) {
    const expense = await Expense.findById(expenseId);
    if (!expense) throw this._error('Expense not found', 404);
    if (expense.userId.toString() !== userId.toString()) throw this._error('Access denied', 403);

    const tripId = expense.tripId;
    await Expense.findByIdAndDelete(expenseId);
    await this._syncTripSpent(tripId);

    return { success: true };
  }

  // ─── BUDGET DASHBOARD ─────────────────────────────────────────────

  /**
   * Comprehensive budget dashboard aggregation
   * Separates: Estimated | Confirmed | Actual costs
   */
  async getBudgetDashboard(tripId, userId) {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw this._error('Trip not found', 404);
    if (trip.userId.toString() !== userId.toString() && !trip.shareSettings?.isPublic) {
      throw this._error('Access denied', 403);
    }

    const expenses = await Expense.find({ tripId, isIncludedInBudget: true });
    const itinerary = trip.itineraryId;

    const totalBudget = trip.budget?.total || 0;
    const currency = trip.budget?.currency || 'INR';
    const durationDays = trip.dates?.durationDays || 1;

    // ── Aggregate by costType ──
    const estimated = { total: 0, byCategory: {} };
    const confirmed = { total: 0, byCategory: {} };
    const actual = { total: 0, byCategory: {} };

    FinanceService.CATEGORIES.forEach((cat) => {
      estimated.byCategory[cat] = 0;
      confirmed.byCategory[cat] = 0;
      actual.byCategory[cat] = 0;
    });

    expenses.forEach((exp) => {
      const bucket = exp.costType === 'confirmed' ? confirmed : exp.costType === 'actual' ? actual : estimated;
      bucket.total += exp.amount;
      bucket.byCategory[exp.category] = (bucket.byCategory[exp.category] || 0) + exp.amount;
    });

    // ── Derive estimated costs from trip model fields ──
    const tripEstimatedFlights = (trip.flights || []).reduce((s, f) => s + (f.price || 0), 0);
    const tripEstimatedHotel = trip.hotel?.totalCost || 0;
    const tripEstimatedTransport = trip.transport?.estimatedCost || 0;
    const tripEstimatedActivities = (trip.activities || []).reduce((s, a) => s + (a.estimatedCost || 0), 0);

    // Itinerary-based day costs
    const itineraryEstimatedTotal = itinerary?.totalEstimatedCost || 0;
    const dailyCosts = (itinerary?.days || []).map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title || `Day ${day.dayNumber}`,
      theme: day.theme || '',
      estimatedCost: day.estimatedDayCost || 0,
      activityCount: (day.activities || []).length,
    }));

    // ── Integrated breakdown (trip model + expenses) ──
    const integratedBreakdown = {};
    FinanceService.CATEGORIES.forEach((cat) => {
      let tripModelAmount = 0;
      if (cat === 'Flights') tripModelAmount = tripEstimatedFlights;
      if (cat === 'Hotels') tripModelAmount = tripEstimatedHotel;
      if (cat === 'Transport') tripModelAmount = tripEstimatedTransport;
      if (cat === 'Activities') tripModelAmount = tripEstimatedActivities;

      integratedBreakdown[cat] = {
        estimated: estimated.byCategory[cat] + tripModelAmount,
        confirmed: confirmed.byCategory[cat],
        actual: actual.byCategory[cat],
        icon: FinanceService.CATEGORY_ICONS[cat],
      };
    });

    // ── Summary metrics ──
    const totalEstimated = estimated.total + tripEstimatedFlights + tripEstimatedHotel + tripEstimatedTransport + tripEstimatedActivities;
    const totalConfirmed = confirmed.total;
    const totalActual = actual.total;
    const totalSpent = totalConfirmed + totalActual; // Confirmed + Actual = real spend
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const overBudgetAmount = totalSpent > totalBudget ? totalSpent - totalBudget : 0;
    const averageDailyCost = durationDays > 0 ? Math.round(totalSpent / durationDays) : 0;
    const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // ── Budget alerts ──
    const alerts = this._generateBudgetAlerts(totalBudget, totalSpent, totalEstimated, integratedBreakdown, durationDays);

    return {
      tripId,
      currency,
      totalBudget,
      durationDays,
      summary: {
        totalEstimated,
        totalConfirmed,
        totalActual,
        totalSpent,
        remainingBudget,
        overBudgetAmount,
        averageDailyCost,
        budgetUtilization,
        isOverBudget: totalSpent > totalBudget,
      },
      breakdown: integratedBreakdown,
      dailyCosts,
      alerts,
      expenseCount: expenses.length,
    };
  }

  // ─── AI BUDGET OPTIMIZATION ───────────────────────────────────────

  /**
   * AI Budget Copilot: Process budget-related commands
   * Supported commands:
   *   - "Keep the trip under ₹X"
   *   - "Make Day N cheaper"
   *   - "Find cheaper activities"
   *   - "Suggest a cheaper hotel"
   *   - "Where am I overspending?"
   */
  async processBudgetCommand(tripId, userId, command) {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw this._error('Trip not found', 404);
    if (userId && trip.userId && trip.userId.toString() !== userId.toString()) throw this._error('Access denied', 403);

    const lowerCmd = command.toLowerCase();
    const itinerary = trip.itineraryId;

    // Command: "Keep the trip under ₹X" or "below ₹X" or "Budget under X"
    if (lowerCmd.match(/under\s*₹?\s*[\d,]+|below\s*₹?\s*[\d,]+|budget.*[\d,]+|limit.*[\d,]+/)) {
      return this._handleBudgetLimit(trip, itinerary, command);
    }

    // Command: "Make Day N cheaper"
    if (lowerCmd.match(/day\s*\d+.*cheap|cheaper.*day\s*\d+/)) {
      const dayMatch = lowerCmd.match(/day\s*(\d+)/);
      const dayNumber = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      return this._handleMakeDayCheaper(trip, itinerary, dayNumber);
    }

    // Command: "Find cheaper activities"
    if (lowerCmd.includes('cheaper activit') || lowerCmd.includes('cheap activit')) {
      return this._handleCheaperActivities(trip, itinerary);
    }

    // Command: "Suggest a cheaper hotel"
    if (lowerCmd.includes('cheaper hotel') || lowerCmd.includes('cheap hotel') || lowerCmd.includes('cheaper stay')) {
      return this._handleCheaperHotel(trip);
    }

    // Command: "Where am I overspending?"
    if (lowerCmd.includes('overspend') || lowerCmd.includes('over budget') || lowerCmd.includes('spending too much')) {
      return this._handleOverspendingAnalysis(trip, itinerary);
    }

    // Command: "Optimize budget" or "Make it cheaper"
    if (lowerCmd.includes('optimize budget') || lowerCmd.includes('make it cheaper') || lowerCmd.includes('reduce cost')) {
      return this._handleOptimizeBudget(trip, itinerary);
    }

    return {
      success: true,
      command: 'budget_general',
      message: 'I can help optimize your budget. Try commands like "Keep the trip under ₹80,000", "Make Day 3 cheaper", "Find cheaper activities", "Suggest a cheaper hotel", or "Where am I overspending?"',
      suggestions: [
        'Keep the trip under ₹80,000',
        'Make Day 3 cheaper',
        'Find cheaper activities',
        'Suggest a cheaper hotel',
        'Where am I overspending?',
        'Optimize budget',
      ],
    };
  }

  // ─── AI BUDGET HANDLERS ───────────────────────────────────────────

  async _handleBudgetLimit(trip, itinerary, command) {
    const amountMatch = command.match(/₹?\s*([\d,]+)/);
    const targetBudget = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : trip.budget?.total || 50000;
    const currentTotal = this._calculateTripTotal(trip, itinerary);

    const recommendations = [];
    const savings = [];

    if (currentTotal > targetBudget) {
      const overBy = currentTotal - targetBudget;

      // Suggest activity cost reduction
      if (itinerary?.days) {
        const expensiveDays = [...itinerary.days]
          .sort((a, b) => (b.estimatedDayCost || 0) - (a.estimatedDayCost || 0));

        for (const day of expensiveDays.slice(0, 3)) {
          const expensiveActivities = (day.activities || [])
            .filter((a) => a.estimatedCost > 500)
            .sort((a, b) => b.estimatedCost - a.estimatedCost);

          if (expensiveActivities.length > 0) {
            const top = expensiveActivities[0];
            const savingsAmount = Math.round(top.estimatedCost * 0.4);
            savings.push({
              type: 'activity',
              dayNumber: day.dayNumber,
              item: top.activity,
              currentCost: top.estimatedCost,
              suggestedSavings: savingsAmount,
              suggestion: `Replace "${top.activity}" with a free/cheaper alternative on Day ${day.dayNumber}`,
            });
          }
        }
      }

      // Hotel savings
      if (trip.hotel?.totalCost > 0) {
        const hotelSavings = Math.round(trip.hotel.totalCost * 0.25);
        savings.push({
          type: 'hotel',
          item: trip.hotel.name || 'Current Hotel',
          currentCost: trip.hotel.totalCost,
          suggestedSavings: hotelSavings,
          suggestion: 'Consider a 3-star or budget-friendly alternative hotel',
        });
      }

      // Transport savings
      if (trip.transport?.estimatedCost > 0) {
        const transportSavings = Math.round(trip.transport.estimatedCost * 0.3);
        savings.push({
          type: 'transport',
          item: trip.transport.mode || 'Transport',
          currentCost: trip.transport.estimatedCost,
          suggestedSavings: transportSavings,
          suggestion: 'Use public transport instead of taxis where possible',
        });
      }

      const totalPotentialSavings = savings.reduce((s, item) => s + item.suggestedSavings, 0);

      recommendations.push({
        title: `Budget Target: ₹${targetBudget.toLocaleString()}`,
        description: `Current estimated total is ₹${currentTotal.toLocaleString()} — over by ₹${overBy.toLocaleString()}. Found ${savings.length} potential savings worth ₹${totalPotentialSavings.toLocaleString()}.`,
        category: 'budget',
        confidenceScore: 85,
        estimatedCost: -totalPotentialSavings,
      });
    } else {
      recommendations.push({
        title: `✅ Within Budget`,
        description: `Estimated total ₹${currentTotal.toLocaleString()} is under your target of ₹${targetBudget.toLocaleString()}.`,
        category: 'budget',
        confidenceScore: 95,
        estimatedCost: 0,
      });
    }

    // Update trip budget target
    trip.budget.total = targetBudget;
    await trip.save();

    return {
      success: true,
      command: 'budget_limit',
      message: `Budget target updated to ₹${targetBudget.toLocaleString()}.`,
      data: {
        targetBudget,
        currentEstimated: currentTotal,
        isOverBudget: currentTotal > targetBudget,
        savings,
        recommendations,
        trip,
      },
    };
  }

  async _handleMakeDayCheaper(trip, itinerary, dayNumber) {
    if (!itinerary?.days) {
      return { success: false, message: 'No itinerary found to optimize.' };
    }

    const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
    if (!day) {
      return { success: false, message: `Day ${dayNumber} not found in itinerary.` };
    }

    const originalCost = day.estimatedDayCost || 0;
    const savings = [];

    // Reduce costly activities
    for (const activity of (day.activities || [])) {
      const actTitle = activity.activity || activity.title || 'Activity';
      if (activity.estimatedCost > 300) {
        const reduction = Math.round(activity.estimatedCost * 0.35);
        const oldCost = activity.estimatedCost;
        activity.estimatedCost = Math.max(100, activity.estimatedCost - reduction);
        const savedAmount = oldCost - activity.estimatedCost;

        savings.push({
          activity: actTitle,
          currentCost: oldCost,
          suggestedCost: activity.estimatedCost,
          savings: savedAmount,
          suggestion: `Optimized "${actTitle}" with a budget-friendly alternative on Day ${dayNumber}`,
        });
      }
    }

    // Recalculate day & itinerary costs and save
    day.estimatedDayCost = (day.activities || []).reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
    itinerary.totalEstimatedCost = itinerary.days.reduce((sum, d) => sum + (d.estimatedDayCost || 0), 0);
    await itinerary.save();

    const totalSavings = savings.reduce((s, item) => s + item.savings, 0);
    const newEstimatedCost = day.estimatedDayCost;

    return {
      success: true,
      command: 'make_day_cheaper',
      message: `Day ${dayNumber} optimized! Saved ₹${totalSavings.toLocaleString()} (Day cost updated from ₹${originalCost.toLocaleString()} to ₹${newEstimatedCost.toLocaleString()}).`,
      data: {
        dayNumber,
        originalCost,
        newEstimatedCost,
        totalSavings,
        savings,
      },
    };
  }

  async _handleCheaperActivities(trip, itinerary) {
    if (!itinerary?.days) {
      return { success: false, message: 'No itinerary available.' };
    }

    const alternatives = [];
    const destination = trip.destination?.name || 'this destination';

    for (const day of itinerary.days) {
      for (const activity of day.activities || []) {
        if (activity.estimatedCost > 500) {
          alternatives.push({
            dayNumber: day.dayNumber,
            currentActivity: activity.activity,
            currentCost: activity.estimatedCost,
            suggestedAlternative: `Free walking tour or park visit near ${activity.location || destination}`,
            alternativeCost: Math.round(activity.estimatedCost * 0.2),
            potentialSavings: Math.round(activity.estimatedCost * 0.8),
          });
        }
      }
    }

    alternatives.sort((a, b) => b.potentialSavings - a.potentialSavings);

    return {
      success: true,
      command: 'cheaper_activities',
      message: `Found ${alternatives.length} activities that could be replaced with cheaper alternatives.`,
      data: {
        alternatives: alternatives.slice(0, 10),
        totalPotentialSavings: alternatives.reduce((s, a) => s + a.potentialSavings, 0),
      },
    };
  }

  async _handleCheaperHotel(trip) {
    const currentHotel = trip.hotel || {};
    const currentCost = currentHotel.totalCost || currentHotel.pricePerNight * (trip.dates?.durationDays || 5) || 0;

    const suggestions = [
      {
        type: 'budget',
        description: 'Budget hostel or guesthouse near city center',
        estimatedCostPerNight: Math.round((currentHotel.pricePerNight || 3000) * 0.3),
        totalEstimated: Math.round(currentCost * 0.3),
        savingsPercent: 70,
      },
      {
        type: 'mid-range',
        description: '3-star hotel in the same area',
        estimatedCostPerNight: Math.round((currentHotel.pricePerNight || 3000) * 0.6),
        totalEstimated: Math.round(currentCost * 0.6),
        savingsPercent: 40,
      },
      {
        type: 'alternative-area',
        description: `Hotel in a less-touristy neighborhood near ${trip.destination?.name || 'city'}`,
        estimatedCostPerNight: Math.round((currentHotel.pricePerNight || 3000) * 0.5),
        totalEstimated: Math.round(currentCost * 0.5),
        savingsPercent: 50,
      },
    ];

    return {
      success: true,
      command: 'cheaper_hotel',
      message: `Here are cheaper hotel alternatives for ${trip.destination?.name || 'your destination'}.`,
      data: {
        currentHotel: {
          name: currentHotel.name || 'Not Selected',
          totalCost: currentCost,
          pricePerNight: currentHotel.pricePerNight || 0,
        },
        suggestions,
      },
    };
  }

  async _handleOverspendingAnalysis(trip, itinerary) {
    const totalBudget = trip.budget?.total || 0;
    const budgetBreakdown = trip.budget?.breakdown || {};

    // Check each category vs its allocation
    const analysis = [];
    const allocations = FinanceService.DEFAULT_ALLOCATION;

    FinanceService.CATEGORIES.forEach((cat) => {
      let spent = 0;
      const catLower = cat.toLowerCase();

      if (cat === 'Flights') spent = (trip.flights || []).reduce((s, f) => s + (f.price || 0), 0) || budgetBreakdown.flights || 0;
      else if (cat === 'Hotels') spent = trip.hotel?.totalCost || budgetBreakdown.hotel || 0;
      else if (cat === 'Transport') spent = trip.transport?.estimatedCost || budgetBreakdown.transit || 0;
      else if (cat === 'Activities') spent = (trip.activities || []).reduce((s, a) => s + (a.estimatedCost || 0), 0) || budgetBreakdown.activities || 0;
      else if (cat === 'Food') spent = budgetBreakdown.food || 0;
      else if (cat === 'Shopping') spent = budgetBreakdown.shopping || 0;
      else spent = budgetBreakdown.misc || 0;

      const allocatedAmount = Math.round(totalBudget * (allocations[cat] || 0.02));
      const isOverspent = spent > allocatedAmount;
      const overBy = Math.max(0, spent - allocatedAmount);
      const pctOfBudget = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

      analysis.push({
        category: cat,
        icon: FinanceService.CATEGORY_ICONS[cat],
        spent,
        allocated: allocatedAmount,
        isOverspent,
        overBy,
        pctOfBudget,
        status: isOverspent ? '🔴 Over Budget' : pctOfBudget > (allocations[cat] || 0.02) * 80 ? '🟡 Near Limit' : '🟢 On Track',
      });
    });

    const overspentCategories = analysis.filter((a) => a.isOverspent);

    return {
      success: true,
      command: 'overspending_analysis',
      message: overspentCategories.length > 0
        ? `Found ${overspentCategories.length} overspent categories.`
        : 'Your spending is on track across all categories.',
      data: {
        analysis,
        overspentCategories,
        totalBudget,
        totalSpent: analysis.reduce((s, a) => s + a.spent, 0),
      },
    };
  }

  async _handleOptimizeBudget(trip, itinerary) {
    const recommendations = [];
    const totalBudget = trip.budget?.total || 50000;
    const currentTotal = this._calculateTripTotal(trip, itinerary);

    // Flight optimization
    if ((trip.flights || []).length > 0) {
      const flightCost = trip.flights.reduce((s, f) => s + (f.price || 0), 0);
      if (flightCost > totalBudget * 0.35) {
        recommendations.push({
          category: 'Flights',
          icon: '✈️',
          suggestion: 'Consider flexible dates or book early for better deals',
          potentialSavings: Math.round(flightCost * 0.15),
          priority: 'high',
        });
      }
    }

    // Hotel optimization
    if (trip.hotel?.totalCost > totalBudget * 0.3) {
      recommendations.push({
        category: 'Hotels',
        icon: '🏨',
        suggestion: 'Try a 3-star hotel or vacation rental for significant savings',
        potentialSavings: Math.round(trip.hotel.totalCost * 0.3),
        priority: 'high',
      });
    }

    // Activity optimization
    if (itinerary?.days) {
      const totalActivityCost = itinerary.days.reduce((s, d) => s + (d.estimatedDayCost || 0), 0);
      if (totalActivityCost > totalBudget * 0.2) {
        recommendations.push({
          category: 'Activities',
          icon: '🎯',
          suggestion: 'Mix paid attractions with free walking tours and park visits',
          potentialSavings: Math.round(totalActivityCost * 0.25),
          priority: 'medium',
        });
      }
    }

    // Transport optimization
    if (trip.transport?.estimatedCost > totalBudget * 0.1) {
      recommendations.push({
        category: 'Transport',
        icon: '🚕',
        suggestion: 'Use public transit (metro/bus) instead of private taxis',
        potentialSavings: Math.round(trip.transport.estimatedCost * 0.4),
        priority: 'medium',
      });
    }

    // Food optimization
    recommendations.push({
      category: 'Food',
      icon: '🍽️',
      suggestion: 'Eat at local street food stalls and mid-range restaurants instead of tourist spots',
      potentialSavings: Math.round(totalBudget * 0.03),
      priority: 'low',
    });

    const totalPotentialSavings = recommendations.reduce((s, r) => s + r.potentialSavings, 0);

    return {
      success: true,
      command: 'optimize_budget',
      message: `Found ${recommendations.length} optimization opportunities that could save ₹${totalPotentialSavings.toLocaleString()}.`,
      data: {
        currentEstimated: currentTotal,
        totalBudget,
        isOverBudget: currentTotal > totalBudget,
        recommendations: recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings),
        totalPotentialSavings,
        optimizedEstimate: currentTotal - totalPotentialSavings,
      },
    };
  }

  // ─── HELPER: BUDGET ALERTS ────────────────────────────────────────

  _generateBudgetAlerts(totalBudget, totalSpent, totalEstimated, breakdown, durationDays) {
    const alerts = [];

    // Overall budget check
    if (totalSpent > totalBudget) {
      alerts.push({
        type: 'critical',
        icon: '🔴',
        title: 'Over Budget',
        message: `You have exceeded your budget by ₹${(totalSpent - totalBudget).toLocaleString()}. Consider reducing some planned expenses.`,
      });
    } else if (totalSpent > totalBudget * 0.85) {
      alerts.push({
        type: 'warning',
        icon: '🟡',
        title: 'Approaching Budget Limit',
        message: `You have used ${Math.round((totalSpent / totalBudget) * 100)}% of your budget. Only ₹${(totalBudget - totalSpent).toLocaleString()} remaining.`,
      });
    }

    // Estimated total check
    if (totalEstimated > totalBudget * 1.2) {
      alerts.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Estimated Costs Exceed Budget',
        message: `AI-estimated total of ₹${totalEstimated.toLocaleString()} is ${Math.round(((totalEstimated - totalBudget) / totalBudget) * 100)}% over your budget.`,
      });
    }

    // Per-category overspend check
    Object.entries(breakdown).forEach(([cat, data]) => {
      const catTotal = (data.estimated || 0) + (data.confirmed || 0) + (data.actual || 0);
      const expectedAllocation = Math.round(totalBudget * (FinanceService.DEFAULT_ALLOCATION[cat] || 0.02));
      if (catTotal > expectedAllocation * 1.5) {
        alerts.push({
          type: 'info',
          icon: data.icon || '📊',
          title: `${cat} Spending High`,
          message: `${cat} costs (₹${catTotal.toLocaleString()}) are ${Math.round(((catTotal - expectedAllocation) / expectedAllocation) * 100)}% above typical allocation.`,
        });
      }
    });

    return alerts;
  }

  // ─── HELPER: SYNC TRIP SPENT ──────────────────────────────────────

  async _syncTripSpent(tripId) {
    const expenses = await Expense.find({ tripId, isIncludedInBudget: true });
    const confirmedAndActual = expenses
      .filter((e) => e.costType === 'confirmed' || e.costType === 'actual')
      .reduce((sum, e) => sum + e.amount, 0);

    await Trip.findByIdAndUpdate(tripId, { 'budget.spent': confirmedAndActual });
  }

  // ─── HELPER: CALCULATE TRIP TOTAL ─────────────────────────────────

  _calculateTripTotal(trip, itinerary) {
    const flightCost = (trip.flights || []).reduce((s, f) => s + (f.price || 0), 0);
    const hotelCost = trip.hotel?.totalCost || 0;
    const transportCost = trip.transport?.estimatedCost || 0;
    const itineraryCost = itinerary?.totalEstimatedCost || 0;
    const foodBudget = trip.budget?.breakdown?.food || 0;
    const shoppingBudget = trip.budget?.breakdown?.shopping || 0;
    const miscBudget = trip.budget?.breakdown?.misc || 0;

    return flightCost + hotelCost + transportCost + itineraryCost + foodBudget + shoppingBudget + miscBudget;
  }

  // ─── HELPER: ERROR FACTORY ────────────────────────────────────────

  _error(message, statusCode = 500) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
  }
}

module.exports = new FinanceService();
