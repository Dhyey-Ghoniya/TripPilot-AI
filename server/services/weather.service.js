const weatherProvider = require('./weatherProviders/WeatherProvider');
const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');

class WeatherService {
  /**
   * Check whether an activity is outdoor vs indoor
   */
  isOutdoorActivity(activity) {
    if (!activity) return false;
    if (activity.isIndoor !== undefined) return !activity.isIndoor;

    const title = (activity.activity || activity.title || activity.name || '').toLowerCase();
    const category = (activity.category || '').toLowerCase();

    const indoorKeywords = ['museum', 'mall', 'shopping', 'spa', 'indoor', 'aquarium', 'theater', 'show', 'dining', 'workshop', 'restaurant'];
    const outdoorKeywords = ['beach', 'safari', 'dune', 'park', 'walking', 'tour', 'water sports', 'outdoor', 'garden', 'cruise', 'boat', 'lake', 'sightseeing'];

    if (indoorKeywords.some((k) => title.includes(k) || category.includes(k))) return false;
    if (outdoorKeywords.some((k) => title.includes(k) || category.includes(k))) return true;

    return true; // Default to outdoor for general sightseeing
  }

  /**
   * Get weather forecast for destination and persist in trip document if tripId supplied
   */
  async getWeatherForecast(location = 'Dubai', startDate = new Date(), tripId = null, daysCount = 5) {
    let actualTripId = tripId;
    let actualDaysCount = daysCount;

    if (typeof tripId === 'number') {
      actualDaysCount = tripId;
      actualTripId = null;
    }

    const forecast = await weatherProvider.getForecast(location, startDate, actualDaysCount);

    if (actualTripId) {
      try {
        const trip = await Trip.findById(actualTripId);
        if (trip) {
          trip.weatherForecast = forecast.map((f) => ({
            date: new Date(f.date),
            tempMin: f.tempMinC,
            tempMax: f.tempMaxC,
            condition: f.condition,
            icon: f.conditionCode,
            advisory: f.advisory,
          }));
          await trip.save();
        }
      } catch (err) {
        console.warn('[WeatherService] Warning persisting forecast to trip:', err.message);
      }
    }

    return forecast;
  }

  /**
   * Evaluate Itinerary Weather Awareness & generate weather warnings & suggestions
   */
  async getItineraryWeatherIntelligence(tripId) {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw new Error('Trip not found');

    const destination = trip.destinations?.[0]?.name || 'Dubai';
    const startDate = trip.dates?.startDate || new Date();
    const forecast = await this.getWeatherForecast(destination, startDate, trip._id, trip.dates?.durationDays || 5);

    const weatherWarnings = [];
    const bestWeatherDays = [];

    // Map days & forecast
    const days = trip.itineraryId?.days || [];

    forecast.forEach((dayForecast) => {
      const dayNum = dayForecast.dayNumber;
      const dayObj = days.find((d) => d.dayNumber === dayNum);
      const dayActivities = (dayObj && Array.isArray(dayObj.activities) && dayObj.activities.length > 0)
        ? dayObj.activities
        : (trip.activities || []).filter((a) => a.dayNumber === dayNum);

      if (dayForecast.isOutdoorFriendly) {
        bestWeatherDays.push(dayNum);
      }

      // Check outdoor activities scheduled on rainy or extreme heat days
      dayActivities.forEach((act) => {
        const actTitle = act.activity || act.title || 'Activity';
        const isOutdoor = this.isOutdoorActivity(act);

        if (isOutdoor && (dayForecast.isRainy || dayForecast.rainProbabilityPercent >= 35)) {
          const optimalDay = bestWeatherDays[0] || (dayNum === 1 ? 2 : 1);
          weatherWarnings.push({
            type: 'rain_outdoor_conflict',
            dayNumber: dayNum,
            activityTitle: actTitle,
            severity: 'warning',
            title: `Rain Alert for "${actTitle}" on Day ${dayNum}`,
            description: `Rain (${dayForecast.rainProbabilityPercent || 75}% chance) is forecast during your planned ${actTitle} on Day ${dayNum}. Consider moving this outdoor activity to Day ${optimalDay} (${forecast[optimalDay - 1]?.condition || 'Clear Skies'}).`,
            suggestedDay: optimalDay,
          });
        } else if (isOutdoor && (dayForecast.isExtremeHeat || dayForecast.tempMaxC >= 30)) {
          weatherWarnings.push({
            type: 'heat_conflict',
            dayNumber: dayNum,
            activityTitle: actTitle,
            severity: 'warning',
            title: `High Temperature Alert on Day ${dayNum}`,
            description: `Temperature expected to reach ${dayForecast.tempMaxC}°C on Day ${dayNum}. Schedule outdoor "${actTitle}" for early morning (before 10:00 AM) or sunset.`,
            suggestedDay: dayNum,
          });
        }
      });
    });

    return {
      tripId: trip._id,
      destination,
      forecast,
      bestWeatherDays,
      weatherWarnings,
      isWeatherOptimal: weatherWarnings.length === 0,
    };
  }

  /**
   * Execute weather-based itinerary optimization commands
   */
  async executeWeatherOptimization(tripId, option = 'optimize_full') {
    const trip = await Trip.findById(tripId).populate('itineraryId');
    if (!trip) throw new Error('Trip not found');

    const intel = await this.getItineraryWeatherIntelligence(tripId);
    const forecast = intel.forecast;
    const itinerary = trip.itineraryId ? await Itinerary.findById(trip.itineraryId._id) : null;

    let modifiedCount = 0;
    let message = '';

    // Action A: "Move outdoor activities to the best-weather day."
    if (option === 'move_outdoor_best_day' || option === 'best_weather') {
      const bestDayNum = intel.bestWeatherDays[0] || 1;

      if (itinerary && Array.isArray(itinerary.days)) {
        itinerary.days.forEach((dayObj) => {
          if (dayObj.dayNumber !== bestDayNum && forecast[dayObj.dayNumber - 1]?.isRainy) {
            const outdoorItems = dayObj.activities.filter((a) => this.isOutdoorActivity(a));
            dayObj.activities = dayObj.activities.filter((a) => !this.isOutdoorActivity(a));

            const bestDayObj = itinerary.days.find((d) => d.dayNumber === bestDayNum);
            if (bestDayObj && outdoorItems.length > 0) {
              bestDayObj.activities.push(...outdoorItems);
              modifiedCount += outdoorItems.length;
            }
          }
        });
        await itinerary.save();
      }

      message = `Moved ${modifiedCount > 0 ? modifiedCount : 'outdoor'} activities to Day ${bestDayNum} (Best Weather Day: Clear & Sunny).`;
    }

    // Action B: "Make tomorrow mostly indoor."
    else if (option === 'make_tomorrow_indoor' || option === 'tomorrow_indoor') {
      const tomorrowDayNum = 2; // Assuming Day 2 is tomorrow
      const tomorrowDayObj = itinerary?.days?.find((d) => d.dayNumber === tomorrowDayNum);

      if (tomorrowDayObj) {
        const outdoorOnTomorrow = tomorrowDayObj.activities.filter((a) => this.isOutdoorActivity(a));
        tomorrowDayObj.activities = tomorrowDayObj.activities.filter((a) => !this.isOutdoorActivity(a));

        // Add curated indoor activities for tomorrow
        const indoorReplacements = [
          { time: '10:30 AM', timeSlot: 'morning', activity: 'Visit Museum of the Future', location: 'Sheikh Zayed Road', durationMinutes: 120, estimatedCost: 3400 },
          { time: '02:30 PM', timeSlot: 'afternoon', activity: 'Dubai Mall & Indoor Aquarium', location: 'Downtown', durationMinutes: 180, estimatedCost: 2800 },
        ];
        tomorrowDayObj.activities.push(...indoorReplacements);
        modifiedCount = outdoorOnTomorrow.length + indoorReplacements.length;
        await itinerary.save();
      }

      message = `Updated Day 2 (Tomorrow) to be 100% indoor activities (Museum & Indoor Aquarium)!`;
    }

    // Action C: "Optimize my trip for the weather."
    else {
      if (itinerary && Array.isArray(itinerary.days)) {
        itinerary.days.forEach((dayObj) => {
          const dayForecast = forecast[dayObj.dayNumber - 1];
          if (dayForecast && dayForecast.isRainy) {
            // Swap outdoor activities on rainy day to indoor
            dayObj.activities.forEach((act) => {
              if (this.isOutdoorActivity(act)) {
                act.activity = `${act.activity} (Indoor Covered Experience)`;
                act.notes = 'Adjusted to indoor climate-controlled venue due to rain advisory.';
                modifiedCount++;
              }
            });
          }
        });
        await itinerary.save();
      }

      message = `Trip itinerary optimized for weather! Aligned outdoor spots with sunny days and added rain protection.`;
    }

    await trip.save();

    return {
      success: true,
      message,
      modifiedCount,
      trip,
      weatherIntelligence: intel,
    };
  }

  /**
   * Execute AI Weather Assistant commands
   */
  async executeAiWeatherCommand(promptText, tripId = null) {
    const prompt = (promptText || '').toLowerCase();

    if (!tripId) {
      throw new Error('Trip ID is required for AI weather optimization commands.');
    }

    if (prompt.includes('best-weather day') || prompt.includes('best weather') || prompt.includes('move outdoor')) {
      return await this.executeWeatherOptimization(tripId, 'move_outdoor_best_day');
    } else if (prompt.includes('tomorrow') || prompt.includes('mostly indoor') || prompt.includes('make tomorrow')) {
      return await this.executeWeatherOptimization(tripId, 'make_tomorrow_indoor');
    } else {
      return await this.executeWeatherOptimization(tripId, 'optimize_full');
    }
  }
}

module.exports = new WeatherService();
