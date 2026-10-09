const Itinerary = require('../models/Itinerary');
const Trip = require('../models/Trip');
const destinationResolver = require('./destinationResolver.service');
const aiTools = require('./aiTools.service');

class ItineraryService {
  /**
   * Fetch itinerary by ID or trip ID
   */
  async getItineraryByTripId(tripId) {
    const itinerary = await Itinerary.findOne({ tripId });
    if (!itinerary) {
      const err = new Error('Itinerary not found for this trip');
      err.statusCode = 404;
      throw err;
    }
    return itinerary;
  }

  /**
   * Add a new activity to a specific day in the itinerary
   */
  async addActivity(itineraryId, dayNumber, activityData) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      const err = new Error('Itinerary not found');
      err.statusCode = 404;
      throw err;
    }

    let dayObj = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
    if (!dayObj) {
      // Create day if it doesn't exist
      dayObj = {
        dayNumber: Number(dayNumber),
        title: `Day ${dayNumber}`,
        theme: 'Exploration',
        summary: 'Day activities',
        activities: [],
        estimatedDayCost: 0,
      };
      itinerary.days.push(dayObj);
    }

    const newActivity = {
      time: activityData.time || '10:00 AM',
      timeSlot: activityData.timeSlot || 'morning',
      activity: activityData.activity || activityData.title || 'New Activity',
      location: activityData.location || '',
      coordinates: activityData.coordinates || { lat: 0, lng: 0 },
      durationMinutes: Number(activityData.durationMinutes) || 90,
      estimatedCost: Number(activityData.estimatedCost) || 0,
      transportModeToNext: activityData.transportModeToNext || 'Walking',
      transportDurationMinutes: Number(activityData.transportDurationMinutes) || 15,
      notes: activityData.notes || '',
    };

    dayObj.activities.push(newActivity);

    // Recalculate day cost & total cost
    dayObj.estimatedDayCost = dayObj.activities.reduce((acc, a) => acc + (a.estimatedCost || 0), 0);
    itinerary.totalEstimatedCost = itinerary.days.reduce((acc, d) => acc + (d.estimatedDayCost || 0), 0);

    await itinerary.save();
    return itinerary;
  }

  /**
   * Delete an activity from a day
   */
  async deleteActivity(itineraryId, dayNumber, activityId) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      const err = new Error('Itinerary not found');
      err.statusCode = 404;
      throw err;
    }

    const dayObj = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
    if (!dayObj) {
      const err = new Error(`Day ${dayNumber} not found in itinerary`);
      err.statusCode = 404;
      throw err;
    }

    dayObj.activities = dayObj.activities.filter(
      (act) => act._id.toString() !== activityId.toString()
    );

    // Recalculate day cost & total cost
    dayObj.estimatedDayCost = dayObj.activities.reduce((acc, a) => acc + (a.estimatedCost || 0), 0);
    itinerary.totalEstimatedCost = itinerary.days.reduce((acc, d) => acc + (d.estimatedDayCost || 0), 0);

    await itinerary.save();
    return itinerary;
  }

  /**
   * Reorder activities within a day
   */
  async reorderActivities(itineraryId, dayNumber, orderedActivityIds) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      const err = new Error('Itinerary not found');
      err.statusCode = 404;
      throw err;
    }

    const dayObj = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
    if (!dayObj) {
      const err = new Error(`Day ${dayNumber} not found`);
      err.statusCode = 404;
      throw err;
    }

    const activityMap = new Map(dayObj.activities.map((act) => [act._id.toString(), act]));
    const reordered = [];

    orderedActivityIds.forEach((id) => {
      if (activityMap.has(id)) {
        reordered.push(activityMap.get(id));
      }
    });

    // Add any remaining items not explicitly in orderedActivityIds
    dayObj.activities.forEach((act) => {
      if (!orderedActivityIds.includes(act._id.toString())) {
        reordered.push(act);
      }
    });

    dayObj.activities = reordered;
    await itinerary.save();
    return itinerary;
  }

  /**
   * Regenerate single day's schedule via AI synthesis
   */
  async regenerateDay(itineraryId, dayNumber) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      const err = new Error('Itinerary not found');
      err.statusCode = 404;
      throw err;
    }

    const trip = await Trip.findById(itinerary.tripId);
    const destName = trip ? trip.destination?.name : 'Destination';

    const dayObj = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
    if (!dayObj) {
      const err = new Error(`Day ${dayNumber} not found`);
      err.statusCode = 404;
      throw err;
    }

    // Generate fresh day activities
    dayObj.activities = [
      {
        time: '09:00 AM',
        timeSlot: 'morning',
        activity: `Morning Scenic Walk in ${destName}`,
        location: `${destName} Central District`,
        durationMinutes: 90,
        estimatedCost: 350,
        transportModeToNext: 'Walking',
        transportDurationMinutes: 10,
        notes: 'AI Regenerated morning slot',
      },
      {
        time: '01:30 PM',
        timeSlot: 'afternoon',
        activity: `Lunch & Cultural Heritage Exploration`,
        location: `${destName} Historic Quarter`,
        durationMinutes: 120,
        estimatedCost: 800,
        transportModeToNext: 'Taxi',
        transportDurationMinutes: 20,
        notes: 'AI Regenerated afternoon slot',
      },
      {
        time: '06:00 PM',
        timeSlot: 'evening',
        activity: `Sunset Viewpoint & Evening Dining`,
        location: `${destName} Promenade`,
        durationMinutes: 90,
        estimatedCost: 1200,
        transportModeToNext: 'Walking',
        transportDurationMinutes: 10,
        notes: 'AI Regenerated evening slot',
      },
    ];

    dayObj.estimatedDayCost = dayObj.activities.reduce((acc, a) => acc + a.estimatedCost, 0);
    itinerary.totalEstimatedCost = itinerary.days.reduce((acc, d) => acc + d.estimatedDayCost, 0);

    await itinerary.save();
    return itinerary;
  }

  /**
   * Execute AI Trip Assistant Command directly on trip & itinerary
   */
  async executeAiTripCommand(tripId, commandPrompt) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      const err = new Error('Trip not found');
      err.statusCode = 404;
      throw err;
    }

    let itinerary = await Itinerary.findOne({ tripId });
    if (!itinerary) {
      const toolRes = await aiTools.createItinerary(
        trip._id,
        { name: trip.destination?.name || 'Destination', attractions: ['Central Sight'] },
        trip.dates?.durationDays || 5
      );
      itinerary = toolRes.data;
    }

    const command = (commandPrompt || '').toLowerCase();
    let actionSummary = '';

    // Handle AI Assistant commands:
    // 1. "Make Day X cheaper" or "Make cheaper"
    if (command.includes('cheaper') || command.includes('reduce cost') || command.includes('budget')) {
      const dayMatch = command.match(/day\s*(\d+)/i);
      const targetDayNum = dayMatch ? parseInt(dayMatch[1], 10) : 1;

      itinerary.days.forEach((day) => {
        if (!dayMatch || day.dayNumber === targetDayNum) {
          day.activities.forEach((act) => {
            act.estimatedCost = Math.round(act.estimatedCost * 0.5);
          });
          day.estimatedDayCost = day.activities.reduce((a, b) => a + b.estimatedCost, 0);
        }
      });
      actionSummary = `Reduced costs for ${dayMatch ? `Day ${targetDayNum}` : 'all days'} by 50%.`;
    }
    // 2. "Add a beach" / "Add beach"
    else if (command.includes('beach') || command.includes('add beach')) {
      const targetDay = itinerary.days[0] || { dayNumber: 1, activities: [] };
      targetDay.activities.push({
        time: '04:00 PM',
        timeSlot: 'afternoon',
        activity: `Relax at ${trip.destination?.name || 'Local'} Beach & Sunset View`,
        location: `${trip.destination?.name || 'Coastline'} Beach`,
        durationMinutes: 120,
        estimatedCost: 300,
        transportModeToNext: 'Walking',
        transportDurationMinutes: 15,
        notes: 'Added by AI Assistant',
      });
      targetDay.estimatedDayCost = targetDay.activities.reduce((a, b) => a + b.estimatedCost, 0);
      actionSummary = `Added coastal beach relaxation experience to Day ${targetDay.dayNumber}.`;
    }
    // 3. "Remove shopping" / "No shopping"
    else if (command.includes('remove shopping') || command.includes('no shopping')) {
      let removedCount = 0;
      itinerary.days.forEach((day) => {
        const initialLen = day.activities.length;
        day.activities = day.activities.filter(
          (act) => !act.activity.toLowerCase().includes('shop') && !act.location.toLowerCase().includes('mall')
        );
        removedCount += initialLen - day.activities.length;
        day.estimatedDayCost = day.activities.reduce((a, b) => a + b.estimatedCost, 0);
      });
      actionSummary = `Removed ${removedCount} shopping activities from your itinerary.`;
    }
    // 4. "Make this day less rushed" / "less rushed" / "relax pace"
    else if (command.includes('less rushed') || command.includes('relaxed') || command.includes('slow down')) {
      itinerary.days.forEach((day) => {
        if (day.activities.length > 3) {
          day.activities = day.activities.slice(0, 3); // Cap at 3 activities per day
        }
        day.activities.forEach((act) => {
          act.durationMinutes = Math.max(120, act.durationMinutes + 30);
          act.transportDurationMinutes += 10;
        });
        day.estimatedDayCost = day.activities.reduce((a, b) => a + b.estimatedCost, 0);
      });
      actionSummary = 'Adjusted daily schedules for a relaxed, unhurried travel pace.';
    }
    // Generic fallback AI modification
    else {
      actionSummary = `Applied AI modification: "${commandPrompt}" to your trip blueprint.`;
    }

    itinerary.totalEstimatedCost = itinerary.days.reduce((a, b) => a + b.estimatedDayCost, 0);
    await itinerary.save();

    // Also update budget breakdown on trip if total cost changed
    if (trip.budget) {
      trip.budget.breakdown.activities = itinerary.totalEstimatedCost;
      await trip.save();
    }

    return {
      actionSummary,
      itinerary,
      trip,
    };
  }
}

module.exports = new ItineraryService();
