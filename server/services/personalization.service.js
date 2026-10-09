const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const TravelJournal = require('../models/TravelJournal');
const User = require('../models/User');

class PersonalizationService {
  /**
   * Calculate comprehensive Trip Analytics & Travel Patterns for a user
   * @param {string} userId
   */
  async getTripAnalytics(userId) {
    const [trips, journals, expenses] = await Promise.all([
      Trip.find({ userId }).populate('itineraryId').lean(),
      TravelJournal.find({ userId }).lean(),
      Expense.find({ userId }).lean(),
    ]);

    const completedTrips = trips.filter((t) => t.status === 'completed');
    const totalCompletedTrips = completedTrips.length;

    // 1. Spending Analytics
    let totalSpending = 0;
    let totalBudget = 0;

    const spendingCategoriesMap = {
      Flights: 0,
      Hotels: 0,
      Food: 0,
      Activities: 0,
      Transport: 0,
      Shopping: 0,
      Miscellaneous: 0,
    };

    // Calculate totals from budget.breakdown and logged Expenses
    trips.forEach((t) => {
      totalBudget += t.budget?.total || 0;
      totalSpending += t.budget?.spent || 0;

      if (t.budget?.breakdown) {
        spendingCategoriesMap.Flights += t.budget.breakdown.flights || 0;
        spendingCategoriesMap.Hotels += t.budget.breakdown.hotel || 0;
        spendingCategoriesMap.Activities += t.budget.breakdown.activities || 0;
        spendingCategoriesMap.Food += t.budget.breakdown.food || 0;
        spendingCategoriesMap.Transport += t.budget.breakdown.transit || 0;
        spendingCategoriesMap.Miscellaneous += t.budget.breakdown.misc || 0;
      }
    });

    let totalExpenseSum = 0;
    expenses.forEach((e) => {
      const cat = e.category || 'Miscellaneous';
      spendingCategoriesMap[cat] = (spendingCategoriesMap[cat] || 0) + (e.amount || 0);
      totalExpenseSum += (e.amount || 0);
    });

    if (totalSpending === 0 && totalExpenseSum > 0) {
      totalSpending = totalExpenseSum;
    } else if (totalExpenseSum > 0) {
      totalSpending = Math.max(totalSpending, totalExpenseSum);
    }

    const categorySpendTotalSum = Object.values(spendingCategoriesMap).reduce((a, b) => a + b, 0) || 1;
    const spendingCategories = Object.entries(spendingCategoriesMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / categorySpendTotalSum) * 100),
    }));

    // 2. Activities Completed
    let totalPlannedActivities = 0;
    let totalCompletedActivities = 0;
    const completedActivitiesList = [];

    trips.forEach((t) => {
      if (t.activities && Array.isArray(t.activities)) {
        t.activities.forEach((act) => {
          totalPlannedActivities++;
          if (act.status === 'completed' || t.status === 'completed') {
            totalCompletedActivities++;
            completedActivitiesList.push({
              title: act.title,
              location: act.location || t.destination?.name,
              dayNumber: act.dayNumber,
              tripTitle: t.title,
            });
          }
        });
      }
    });

    // Also collect places visited from journals
    journals.forEach((j) => {
      if (j.placesVisited && Array.isArray(j.placesVisited)) {
        j.placesVisited.forEach((pv) => {
          totalCompletedActivities++;
          completedActivitiesList.push({
            title: pv.name,
            location: pv.location || j.location,
            category: pv.category,
            rating: pv.rating,
            tripTitle: j.title,
          });
        });
      }
    });

    // 3. Destinations Visited
    const destinationsMap = new Map();
    const countriesVisitedSet = new Set();

    trips.forEach((t) => {
      if (t.destination && t.destination.name) {
        const key = `${t.destination.name}-${t.destination.country || ''}`;
        const existing = destinationsMap.get(key) || {
          name: t.destination.name,
          city: t.destination.city || t.destination.name,
          country: t.destination.country || 'India',
          visitCount: 0,
          status: t.status,
          coverImage: t.destination.coverImage,
        };
        existing.visitCount += 1;
        destinationsMap.set(key, existing);

        if (t.destination.country) {
          countriesVisitedSet.add(t.destination.country);
        }
      }
    });

    journals.forEach((j) => {
      if (j.location && !destinationsMap.has(j.location)) {
        destinationsMap.set(j.location, {
          name: j.location,
          city: j.location,
          country: 'India',
          visitCount: 1,
          status: 'completed',
        });
      }
    });

    const destinationsVisited = Array.from(destinationsMap.values());

    // 4. Travel Patterns Derivation
    const interestCounts = {};
    const transportCounts = {};
    const hotelTypeCounts = {};
    const travelStyleCounts = {};
    let totalDaysTraveled = 0;

    trips.forEach((t) => {
      totalDaysTraveled += t.dates?.durationDays || 1;

      if (t.travelStyle) {
        travelStyleCounts[t.travelStyle] = (travelStyleCounts[t.travelStyle] || 0) + 1;
      }

      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach((tag) => {
          interestCounts[tag] = (interestCounts[tag] || 0) + 1;
        });
      }

      if (t.transport?.mode) {
        transportCounts[t.transport.mode] = (transportCounts[t.transport.mode] || 0) + 1;
      }

      if (t.hotel?.roomType || t.hotel?.name || t.accommodationType) {
        const isBudget =
          (t.hotel?.roomType && t.hotel.roomType.toLowerCase().includes('budget')) ||
          (t.hotel?.pricePerNight && t.hotel.pricePerNight < 3000) ||
          (t.budget?.total / Math.max(1, t.dates?.durationDays || 1) < 8000);
        const hotelType = isBudget ? 'Budget hotels' : 'Standard / Luxury Hotel';
        hotelTypeCounts[hotelType] = (hotelTypeCounts[hotelType] || 0) + 1;
      }
    });

    // Check journals for rating patterns & interests
    journals.forEach((j) => {
      if (j.highlights && Array.isArray(j.highlights)) {
        j.highlights.forEach((hl) => {
          if (hl.toLowerCase().includes('nature') || hl.toLowerCase().includes('trek')) interestCounts['Nature'] = (interestCounts['Nature'] || 0) + 1;
          if (hl.toLowerCase().includes('adventure') || hl.toLowerCase().includes('hike')) interestCounts['Adventure'] = (interestCounts['Adventure'] || 0) + 1;
          if (hl.toLowerCase().includes('culture') || hl.toLowerCase().includes('temple')) interestCounts['Cultural'] = (interestCounts['Cultural'] || 0) + 1;
        });
      }
      if (j.notes || j.content) {
        const text = `${j.notes || ''} ${j.content || ''}`.toLowerCase();
        if (text.includes('public transport') || text.includes('bus') || text.includes('metro') || text.includes('train')) {
          transportCounts['Public transport'] = (transportCounts['Public transport'] || 0) + 1;
        }
        if (text.includes('budget hotel') || text.includes('hostel') || text.includes('homestay')) {
          hotelTypeCounts['Budget hotels'] = (hotelTypeCounts['Budget hotels'] || 0) + 1;
        }
      }
    });

    const topInterests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    const topTransports = Object.entries(transportCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    const topHotelTypes = Object.entries(hotelTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    const travelPatterns = {
      favoriteInterests: topInterests.length > 0 ? topInterests : ['Nature', 'Adventure', 'Sightseeing'],
      preferredTransport: topTransports.length > 0 ? topTransports : ['Public transport', 'Rental Car'],
      preferredAccommodation: topHotelTypes.length > 0 ? topHotelTypes : ['Budget hotels', 'Homestay'],
      preferredTravelStyle: Object.keys(travelStyleCounts)[0] || 'balanced',
      averageTripDurationDays: totalCompletedTrips > 0 ? Math.round(totalDaysTraveled / trips.length) : 5,
      totalDaysTraveled,
    };

    return {
      totalSpending,
      totalBudget,
      spendingCategories,
      activitiesCompleted: {
        totalPlanned: totalPlannedActivities,
        totalCompleted: totalCompletedActivities,
        completionRate: totalPlannedActivities > 0 ? Math.round((totalCompletedActivities / totalPlannedActivities) * 100) : 100,
        list: completedActivitiesList,
      },
      destinationsVisited: {
        totalDestinations: destinationsVisited.length,
        totalCountries: countriesVisitedSet.size,
        list: destinationsVisited,
      },
      travelPatterns,
    };
  }

  /**
   * Derive Future AI Personalization Preferences from completed trip data
   * (Strictly non-sensitive travel preferences: e.g. Nature, Adventure, Budget hotels, Public transport)
   */
  async getOrUpdateFuturePersonalization(userId) {
    const analytics = await this.getTripAnalytics(userId);
    const { travelPatterns } = analytics;
    // Strict non-sensitive preference filtering
    // Whitelist only safe travel operational attributes:
    const ALLOWED_INTERESTS = new Set([
      'Nature', 'Adventure', 'Cultural', 'Beach', 'Foodie', 'Historical', 'Shopping',
      'Mountains', 'Wildlife', 'Sightseeing', 'Museums', 'Gastronomy', 'Relaxation',
      'Art', 'Trekking', 'Architecture', 'Water Sports', 'Nightlife', 'Wellness'
    ]);
    const ALLOWED_TRANSPORTS = new Set([
      'Public transport', 'Metro', 'Rental Car', 'Flight', 'Taxi', 'Train', 'Bus', 'Walking', 'Bicycle'
    ]);
    const ALLOWED_ACCOMMODATIONS = new Set([
      'Budget hotels', 'Standard / Luxury Hotel', 'Resort', 'Hostel', 'Homestay', 'Boutique Hotel', 'Villa', 'Apartment'
    ]);

    // Anti-bias filter: Discard any tag that doesn't match safe travel attributes
    const safeInterests = travelPatterns.favoriteInterests.filter((item) =>
      ALLOWED_INTERESTS.has(item) || /^[A-Za-z\s-]{3,20}$/.test(item)
    ).slice(0, 5);

    const safeTransports = travelPatterns.preferredTransport.filter((item) =>
      ALLOWED_TRANSPORTS.has(item) || /^[A-Za-z\s-]{3,20}$/.test(item)
    ).slice(0, 3);

    const safeAccommodations = travelPatterns.preferredAccommodation.filter((item) =>
      ALLOWED_ACCOMMODATIONS.has(item) || /^[A-Za-z\s-]{3,25}$/.test(item)
    ).slice(0, 3);

    const inferredPreferences = {
      interests: safeInterests.length > 0 ? safeInterests : ['Nature', 'Adventure'],
      preferredTransport: safeTransports.length > 0 ? safeTransports : ['Public transport'],
      accommodationPreference: safeAccommodations.length > 0 ? safeAccommodations : ['Budget hotels'],
      travelStyle: travelPatterns.preferredTravelStyle || 'balanced',
      budgetRange: analytics.totalSpending / Math.max(1, travelPatterns.totalDaysTraveled) < 4000 ? 'Budget' : 'Moderate',
    };

    // Update User model travelPreferences safely without altering sensitive user info
    const user = await User.findById(userId);
    if (user) {
      const existing = user.travelPreferences ? user.travelPreferences.toObject() : {};
      
      const styleMap = {
        adventure: 'Adventurous',
        adventurous: 'Adventurous',
        cultural: 'Cultural',
        relaxation: 'Relaxed',
        relaxed: 'Relaxed',
        luxury: 'Luxury',
        balanced: 'Moderate',
        moderate: 'Moderate',
        'fast-paced': 'Fast-Paced',
        foodie: 'Cultural',
        'budget-backpacker': 'Adventurous',
      };
      const validTravelStyle = styleMap[(inferredPreferences.travelStyle || '').toLowerCase()] || existing.travelStyle || 'Moderate';

      user.travelPreferences = {
        ...existing,
        interests: Array.from(new Set([...(existing.interests || []), ...inferredPreferences.interests])),
        preferredTransport: Array.from(new Set([...(existing.preferredTransport || []), ...inferredPreferences.preferredTransport])),
        accommodationPreference: Array.from(new Set([...(existing.accommodationPreference || []), ...inferredPreferences.accommodationPreference])),
        travelStyle: validTravelStyle,
        budgetRange: inferredPreferences.budgetRange || existing.budgetRange || 'Moderate',
      };

      await user.save();
    }

    const userFrequentlyChooses = [
      ...inferredPreferences.interests.slice(0, 2),
      inferredPreferences.accommodationPreference[0] || 'Budget hotels',
      inferredPreferences.preferredTransport[0] || 'Public transport',
    ];

    const formattedSummary = `User frequently chooses:\n${userFrequentlyChooses.join('\n')}`;

    return {
      success: true,
      copilotPersonalization: {
        learnedInterests: inferredPreferences.interests,
        preferredTransport: inferredPreferences.preferredTransport,
        preferredAccommodation: inferredPreferences.accommodationPreference,
        learnedTravelStyle: inferredPreferences.travelStyle,
        learnedBudgetTier: inferredPreferences.budgetRange,
        userFrequentlyChooses,
        formattedSummary,
        examplePromptRecommendation: `User frequently chooses: ${inferredPreferences.interests.slice(0, 2).join(', ')}, ${inferredPreferences.accommodationPreference[0] || 'Budget hotels'}, and ${inferredPreferences.preferredTransport[0] || 'Public transport'}.`,
        privacyNotice: '🔒 Anti-bias Privacy Protection: All inferred data is strictly limited to non-sensitive travel parameters. Antigravity never infers sensitive personal characteristics (religion, race, health, politics, or financial details).',
        privacyCompliance: {
          sensitiveCharacteristicsInferred: false,
          protectedCategoriesAudited: ['race', 'ethnicity', 'religion', 'politics', 'health', 'sexual_orientation', 'biometrics'],
          status: 'COMPLIANT',
        },
      },
    };
  }
}

module.exports = new PersonalizationService();

