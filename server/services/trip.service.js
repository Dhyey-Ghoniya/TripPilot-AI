const Trip = require('../models/Trip');
const crypto = require('crypto');
const Itinerary = require('../models/Itinerary');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { isTripOwner, canViewTrip, canEditTrip, assertTripEditAccess } = require('../utils/tripAccess');
require('../models/Activity');

class TripService {
  /**
   * Get all trips for an authenticated user filtered by tab or status.
   * Categories/Tabs supported:
   *   - 'upcoming': Upcoming & ongoing trips (future start date or status planning/upcoming/ongoing)
   *   - 'drafts': Draft & planning blueprints (status === 'draft' or 'planning')
   *   - 'saved': Saved wishlist trips (status === 'saved')
   *   - 'completed': Past completed trips (status === 'completed')
   *   - 'archived': Archived trips (status === 'archived')
   *   - 'all': All trips
   */
  async getUserTrips(userId, { tab, status, limit = 20, page = 1 } = {}) {
    const query = { $or: [{ userId }, { 'collaborators.userId': userId }] };
    const now = new Date();

    const selectedTab = tab || status;

    if (selectedTab && selectedTab !== 'all') {
      if (selectedTab === 'upcoming') {
        query.status = { $in: ['upcoming', 'planning', 'ongoing'] };
        query['dates.startDate'] = { $gte: new Date(now.setDate(now.getDate() - 1)) };
      } else if (selectedTab === 'drafts' || selectedTab === 'draft') {
        query.status = { $in: ['draft', 'planning'] };
      } else if (selectedTab === 'saved') {
        query.status = 'saved';
      } else if (selectedTab === 'completed') {
        query.status = 'completed';
      } else if (selectedTab === 'archived') {
        query.status = 'archived';
      } else {
        query.status = selectedTab;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [trips, total] = await Promise.all([
      Trip.find(query)
        .sort({ 'dates.startDate': -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('itineraryId'),
      Trip.countDocuments(query),
    ]);

    return {
      trips: trips.map((trip) => ({ ...trip.toObject(), isOwner: isTripOwner(trip, userId) })),
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1,
    };
  }

  /**
   * Get single trip details with security ownership & read-only access check
   */
  async getTripById(tripId, userId) {
    const trip = await Trip.findById(tripId).populate('itineraryId').populate('activities.activityId');
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    const isOwner = isTripOwner(trip, userId);
    if (!canViewTrip(trip, userId)) {
      const err = new Error('Access denied. You do not have permission to view this trip.');
      err.statusCode = 403;
      throw err;
    }

    const tripObj = trip.toObject();
    tripObj.isReadOnly = !canEditTrip(trip, userId);

    return tripObj;
  }

  /**
   * Create a new Trip blueprint
   */
  async createTrip(userId, tripData) {
    const {
      title,
      destination,
      origin,
      dates,
      travelers,
      budget,
      travelStyle,
      tags,
      notes,
      status,
    } = tripData;

    const startDate = dates?.startDate ? new Date(dates.startDate) : new Date();
    const endDate = dates?.endDate ? new Date(dates.endDate) : new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const durationDays = dates?.durationDays || Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

    const destinationObj = typeof destination === 'string'
      ? {
          name: destination,
          city: destination,
          country: 'India',
        }
      : {
          name: destination?.name || 'Destination',
          city: destination?.city || '',
          state: destination?.state || '',
          country: destination?.country || 'India',
          coordinates: destination?.coordinates || { lat: 0, lng: 0 },
          coverImage: destination?.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        };

    const newTrip = new Trip({
      userId,
      title: title || `Trip to ${destinationObj.name}`,
      status: status || 'planning',
      destinations: [destinationObj],
      origin: typeof origin === 'string' ? { name: origin, city: origin } : origin,
      dates: {
        startDate,
        endDate,
        durationDays,
        isFlexible: dates?.isFlexible || false,
      },
      travelers: {
        count: travelers?.count || 1,
        type: travelers?.type || 'solo',
        adults: travelers?.adults || 1,
        children: travelers?.children || 0,
      },
      budget: {
        total: budget?.total || 25000,
        currency: budget?.currency || 'INR',
        spent: budget?.spent || 0,
        breakdown: budget?.breakdown || {
          flights: Math.round((budget?.total || 25000) * 0.35),
          hotel: Math.round((budget?.total || 25000) * 0.35),
          activities: Math.round((budget?.total || 25000) * 0.15),
          food: Math.round((budget?.total || 25000) * 0.1),
          transit: Math.round((budget?.total || 25000) * 0.05),
          misc: 0,
        },
      },
      transport: tripData.transport || { mode: 'Rental Car' },
      travelStyle: travelStyle || 'balanced',
      tags: tags || [],
      notes: notes || '',
    });

    const savedTrip = await newTrip.save();

    // Auto-create initial itinerary shell for this trip
    const itinerary = new Itinerary({
      tripId: savedTrip._id,
      title: `${savedTrip.title} - Blueprint`,
      days: Array.from({ length: durationDays }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}: Discover ${destinationObj.name}`,
        theme: i === 0 ? 'Arrival & Orientation' : i === durationDays - 1 ? 'Last Highlights & Departure' : 'Exploration & Culture',
        summary: `Day ${i + 1} planned itinerary in ${destinationObj.name}`,
        activities: [],
      })),
      isAiGenerated: true,
    });

    const savedItinerary = await itinerary.save();
    savedTrip.itineraryId = savedItinerary._id;
    await savedTrip.save();

    return savedTrip;
  }

  /**
   * Update an existing Trip
   */
  async updateTrip(tripId, userId, updateData) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    assertTripEditAccess(trip, userId);

    const allowedFields = [
      'title',
      'status',
      'destination',
      'origin',
      'dates',
      'travelers',
      'budget',
      'flights',
      'hotel',
      'activities',
      'transport',
      'travelStyle',
      'tags',
      'notes',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        trip[field] = updateData[field];
      }
    });

    return await trip.save();
  }

  async setTripSharing(tripId, userId, isPublic) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
    if (!isTripOwner(trip, userId)) throw Object.assign(new Error('Only the trip owner can change sharing.'), { statusCode: 403 });
    trip.shareSettings.isPublic = Boolean(isPublic);
    await trip.save();
    return trip;
  }

  async getTripInvite(tripId, ownerId, rotate = false) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw Object.assign(new Error('Trip not found.'), { statusCode: 404 });
    if (!isTripOwner(trip, ownerId)) throw Object.assign(new Error('Only the trip owner can manage invite links.'), { statusCode: 403 });
    if (!trip.shareSettings) trip.shareSettings = {};
    if (!trip.shareSettings.inviteCode || rotate) {
      trip.shareSettings.inviteCode = crypto.randomBytes(12).toString('hex');
      await trip.save();
    }
    return { inviteCode: trip.shareSettings.inviteCode };
  }

  async joinTripByInvite(inviteCode, userId) {
    const trip = await Trip.findOne({ 'shareSettings.inviteCode': inviteCode });
    if (!trip) throw Object.assign(new Error('This trip invite is invalid or has expired.'), { statusCode: 404 });

    if (isTripOwner(trip, userId)) {
      return { tripId: trip._id, title: trip.title, role: 'owner' };
    }
    const existingMember = trip.collaborators.find((member) => String(member.userId) === String(userId));
    if (existingMember) {
      return { tripId: trip._id, title: trip.title, role: existingMember.role };
    }

    trip.collaborators.push({ userId, role: 'editor' });
    await trip.save();
    return { tripId: trip._id, title: trip.title, role: 'editor' };
  }

  async addCollaborator(tripId, ownerId, email, role = 'editor') {
    const trip = await Trip.findById(tripId);
    if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
    if (!isTripOwner(trip, ownerId)) throw Object.assign(new Error('Only the trip owner can invite collaborators.'), { statusCode: 403 });
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw Object.assign(new Error('Enter an account email address.'), { statusCode: 400 });
    const user = await User.findOne({ email: normalizedEmail }).select('_id email firstName lastName');
    if (!user) throw Object.assign(new Error('No TripPilot account uses that email yet. Ask them to create an account, then invite them.'), { statusCode: 404 });
    if (isTripOwner(trip, user._id)) throw Object.assign(new Error('The trip owner already has full access.'), { statusCode: 400 });
    const member = trip.collaborators.find((item) => String(item.userId) === String(user._id));
    if (member) member.role = role === 'viewer' ? 'viewer' : 'editor';
    else trip.collaborators.push({ userId: user._id, role: role === 'viewer' ? 'viewer' : 'editor' });
    await trip.save();
    return { trip, collaborator: { id: user._id, email: user.email, name: `${user.firstName} ${user.lastName}`.trim(), role: role === 'viewer' ? 'viewer' : 'editor' } };
  }

  async removeCollaborator(tripId, ownerId, collaboratorId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
    if (!isTripOwner(trip, ownerId)) throw Object.assign(new Error('Only the trip owner can remove collaborators.'), { statusCode: 403 });
    trip.collaborators = trip.collaborators.filter((item) => String(item.userId) !== String(collaboratorId));
    await trip.save();
    return trip;
  }

  async getCollaborators(tripId, userId) {
    const trip = await Trip.findById(tripId).populate('collaborators.userId', 'email firstName lastName');
    if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
    if (!canViewTrip(trip, userId)) throw Object.assign(new Error('Access denied.'), { statusCode: 403 });
    return trip.collaborators.map((member) => ({
      id: member.userId?._id,
      email: member.userId?.email,
      name: `${member.userId?.firstName || ''} ${member.userId?.lastName || ''}`.trim(),
      role: member.role,
      addedAt: member.addedAt,
    }));
  }

  async getTripConversation(tripId, userId) {
    const trip = await Trip.findById(tripId).select('conversation shareSettings collaborators userId');
    if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
    if (!canViewTrip(trip, userId)) throw Object.assign(new Error('Access denied.'), { statusCode: 403 });
    return trip.conversation || [];
  }

  async postTripConversation(tripId, userId, messageText) {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });
    assertTripEditAccess(trip, userId);
    const message = String(messageText || '').trim();
    if (!message || message.length > 2000) throw Object.assign(new Error('Message must contain 1 to 2,000 characters.'), { statusCode: 400 });
    const user = await User.findById(userId).select('firstName lastName');
    const authorName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Trip collaborator';
    trip.conversation.push({ sender: 'user', message, authorName, authorUserId: userId, timestamp: new Date() });

    let assistantReply = null;
    if (/@vani\b/i.test(message)) {
      const travelOrchestrator = require('./travelOrchestrator.service');
      const llmChat = require('./llmChat.service');
      const prompt = message.replace(/@vani\b/ig, '').trim();
      const interpreted = await llmChat.interpretTripTurn({ message: prompt, trip });
      if (interpreted && ['question', 'none'].includes(interpreted.intent)) {
        assistantReply = interpreted.reply || 'Could you clarify what you would like to know about this trip?';
      } else {
        const normalizedCommand = interpreted?.command || ({
          search_flights: 'find flights', search_hotels: 'find hotels',
          travel_requirements: 'show travel requirements', checklist: 'show booking checklist',
        }[interpreted?.intent] || prompt);
        const isSupportedWithoutLlm = /\b(cheaper|add |remove|hotel|restaurant|flight|checklist|visa|pack|road trip|rain|raining|indoor|swap|replace|move|weather|optimi[sz]e|route)\b/i.test(prompt);
        const canExecute = Boolean(interpreted && ['update', 'search_flights', 'search_hotels', 'travel_requirements', 'checklist'].includes(interpreted.intent)) || (!interpreted && isSupportedWithoutLlm);
        if (canExecute) {
          const result = await travelOrchestrator.orchestrateTripPlanning({ prompt: normalizedCommand, userId, tripId });
          assistantReply = result.copilotMessage || 'I could not apply that request. Please clarify the trip change you want.';
        } else {
          assistantReply = 'I can update activities, dates, route, budget, flights, hotels, or travel requirements. Tell me the trip change you want, or ask a question about the itinerary.';
        }
      }
      trip.conversation.push({ sender: 'ai', message: assistantReply, authorName: 'Vani', timestamp: new Date() });
    }
    await trip.save();
    return { conversation: trip.conversation, assistantReply };
  }

  /**
   * Action: Duplicate Trip (1-click Clone)
   */
  async duplicateTrip(tripId, userId) {
    const originalTrip = await Trip.findById(tripId).populate('itineraryId').lean();
    if (!originalTrip) throw new Error('Original trip not found');
    if (originalTrip.userId.toString() !== userId.toString() && !originalTrip.shareSettings?.isPublic) {
      throw new Error('Access denied to duplicate this trip.');
    }

    delete originalTrip._id;
    delete originalTrip.createdAt;
    delete originalTrip.updatedAt;

    const clonedTrip = new Trip({
      ...originalTrip,
      userId,
      title: `Copy of ${originalTrip.title}`,
      status: 'draft',
      shareSettings: {
        isPublic: false,
        shareCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        allowComments: true,
      },
    });

    await clonedTrip.save();

    if (originalTrip.itineraryId) {
      const origItinerary = originalTrip.itineraryId;
      delete origItinerary._id;
      delete origItinerary.createdAt;
      delete origItinerary.updatedAt;

      const clonedItinerary = new Itinerary({
        ...origItinerary,
        tripId: clonedTrip._id,
        title: `${clonedTrip.title} - Itinerary`,
      });

      await clonedItinerary.save();
      clonedTrip.itineraryId = clonedItinerary._id;
      await clonedTrip.save();
    }

    return clonedTrip;
  }

  /**
   * Action: Archive / Restore Trip
   */
  async archiveTrip(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.userId.toString() !== userId.toString()) throw new Error('Access denied.');

    trip.status = trip.status === 'archived' ? 'planning' : 'archived';
    await trip.save();

    return {
      success: true,
      message: `Trip "${trip.title}" is now ${trip.status}.`,
      trip,
    };
  }

  /**
   * Action: Mark Trip Completed
   */
  async markCompleted(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.userId.toString() !== userId.toString()) throw new Error('Access denied.');

    trip.status = 'completed';
    await trip.save();

    // Recalculate expenses
    const expenses = await Expense.find({ tripId });
    const actualSpent = expenses.reduce((s, e) => s + e.amount, 0);
    if (actualSpent > 0) {
      trip.budget.spent = actualSpent;
      await trip.save();
    }

    return {
      success: true,
      message: `🎉 Congratulations! Trip "${trip.title}" has been marked as completed. Travel history updated!`,
      trip,
    };
  }

  /**
   * Delete a Trip and its associated itinerary
   */
  async deleteTrip(tripId, userId) {
    const trip = await Trip.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.userId.toString() !== userId.toString()) throw new Error('Access denied.');

    await Promise.all([
      Trip.findByIdAndDelete(tripId),
      Itinerary.deleteMany({ tripId }),
      Expense.deleteMany({ tripId }),
    ]);

    return { success: true, message: 'Trip deleted successfully' };
  }

  /**
   * Find trip by public share code with privacy enforcement (Read-only for shared users)
   */
  async getSharedTrip(shareCode) {
    const trip = await Trip.findOne({
      'shareSettings.shareCode': shareCode,
      'shareSettings.isPublic': true,
    }).populate('itineraryId').lean();

    if (!trip) {
      const err = new Error('Shared trip not found or link has expired.');
      err.statusCode = 404;
      throw err;
    }

    // Privacy Protection: Strip owner private data
    delete trip.userId;
    delete trip.collaborators;
    delete trip.conversation;
    delete trip.travelerProfiles;
    delete trip.notes;
    delete trip.selectedOptions;
    delete trip.optimizationHistory;
    delete trip.constraints;
    delete trip.shareSettings;

    return {
      ...trip,
      isReadOnly: true,
      sharedAccess: 'read_only',
    };
  }

  /**
   * Export Trip (Printable Itinerary / PDF Data / Shareable Journey)
   */
  async exportTrip(tripId, userId) {
    const trip = await Trip.findById(tripId).populate('itineraryId').populate('activities.activityId').lean();
    if (!trip) throw new Error('Trip not found');
    if (trip.userId.toString() !== userId.toString() && !trip.shareSettings?.isPublic) {
      throw new Error('Access denied to export trip.');
    }

    const expenses = await Expense.find({ tripId }).lean();
    const itinerary = trip.itineraryId || { days: [] };

    // Format export package
    return {
      exportTimestamp: new Date(),
      trip: {
        title: trip.title,
        destination: trip.destinations?.[0]?.name,
        country: trip.destinations?.[0]?.country,
        durationDays: trip.dates?.durationDays || 5,
        startDate: trip.dates?.startDate,
        endDate: trip.dates?.endDate,
        totalBudget: trip.budget?.total,
        spent: trip.budget?.spent,
        currency: trip.budget?.currency || 'INR',
        travelersCount: trip.travelers?.count || 1,
        hotel: trip.hotels?.[0]?.name || 'Not booked',
        flights: trip.flights || [],
      },
      itineraryDays: (itinerary.days || []).map((day) => ({
        dayNumber: day.dayNumber,
        title: day.title,
        theme: day.theme,
        activities: (day.activities || []).map((a) => ({
          time: a.time,
          activity: a.activity || a.title,
          location: a.location,
          cost: a.estimatedCost,
        })),
      })),
      expenseSummary: {
        totalExpenseEntries: expenses.length,
        actualTotalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
      },
    };
  }

  /**
   * Completed Trips Analytics Data Structure (Travel History, Expense Analysis, Future Personalization)
   */
  async getCompletedTripsAnalytics(userId) {
    const personalizationService = require('./personalization.service');
    const analytics = await personalizationService.getTripAnalytics(userId);
    const personalization = await personalizationService.getOrUpdateFuturePersonalization(userId);

    const completedTrips = await Trip.find({ userId, status: 'completed' }).populate('itineraryId').lean();

    return {
      travelHistory: {
        totalCompletedTrips: analytics.destinationsVisited.totalDestinations || completedTrips.length,
        countriesCount: analytics.destinationsVisited.totalCountries,
        countriesList: analytics.destinationsVisited.list.map(d => d.country),
        citiesCount: analytics.destinationsVisited.totalDestinations,
        citiesList: analytics.destinationsVisited.list.map(d => d.name),
        totalDaysTraveled: analytics.travelPatterns.totalDaysTraveled,
        completedTripsSummary: completedTrips.map((t) => ({
          id: t._id,
          title: t.title,
          destination: t.destinations?.[0]?.name,
          durationDays: t.dates?.durationDays,
          startDate: t.dates?.startDate,
          spent: t.budget?.spent,
        })),
      },
      expenseAnalysis: {
        totalBudget: analytics.totalBudget,
        totalSpent: analytics.totalSpending,
        savingsOrDeficit: analytics.totalBudget - analytics.totalSpending,
        averageDailySpend: analytics.travelPatterns.totalDaysTraveled > 0 ? Math.round(analytics.totalSpending / analytics.travelPatterns.totalDaysTraveled) : 0,
        categorySpendTotals: analytics.spendingCategories.reduce((acc, curr) => {
          acc[curr.category] = curr.amount;
          return acc;
        }, {}),
      },
      futurePersonalization: {
        topPreferredTags: personalization.copilotPersonalization.learnedInterests,
        preferredTransport: personalization.copilotPersonalization.preferredTransport,
        preferredAccommodation: personalization.copilotPersonalization.preferredAccommodation,
        preferredPace: personalization.copilotPersonalization.learnedTravelStyle,
        budgetTier: personalization.copilotPersonalization.learnedBudgetTier,
        privacyNotice: personalization.copilotPersonalization.privacyNotice,
      },
      rawAnalytics: analytics,
    };
  }
}

module.exports = new TripService();
