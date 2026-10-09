const TravelJournal = require('../models/TravelJournal');
const Trip = require('../models/Trip');

class JournalService {
  /**
   * Create a new travel journal entry
   */
  async createJournal(userId, journalData) {
    const {
      tripId,
      title,
      content,
      notes,
      memories,
      photos,
      placesVisited,
      ratings,
      highlights,
      location,
      isPublic,
    } = journalData;

    let locationName = location || '';
    if (tripId && !locationName) {
      const trip = await Trip.findById(tripId);
      if (trip && trip.destination) {
        locationName = trip.destination.name || trip.destination.city || '';
      }
    }

    const newJournal = new TravelJournal({
      userId,
      tripId: tripId || null,
      title: title || 'Travel Memory',
      content: content || notes || 'A memorable trip entry.',
      notes: notes || '',
      memories: memories || [],
      photos: photos || [],
      placesVisited: placesVisited || [],
      ratings: {
        overall: ratings?.overall || 5,
        accommodation: ratings?.accommodation || 5,
        activities: ratings?.activities || 5,
        transport: ratings?.transport || 5,
        food: ratings?.food || 5,
      },
      highlights: highlights || [],
      location: locationName,
      isPublic: isPublic || false,
    });

    return await newJournal.save();
  }

  /**
   * Get all journal entries for a user
   */
  async getUserJournals(userId, { search, tripId, page = 1, limit = 20 } = {}) {
    const query = { userId };

    if (tripId) {
      query.tripId = tripId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { highlights: { $regex: search, $options: 'i' } },
        { memories: { $regex: search, $options: 'i' } },
        { 'placesVisited.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [journals, total] = await Promise.all([
      TravelJournal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('tripId', 'title destination dates budget status'),
      TravelJournal.countDocuments(query),
    ]);

    return {
      journals,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1,
    };
  }

  /**
   * Get single journal by ID
   */
  async getJournalById(journalId, userId) {
    const journal = await TravelJournal.findById(journalId).populate('tripId');
    if (!journal) {
      const err = new Error('Journal entry not found');
      err.statusCode = 404;
      throw err;
    }

    if (journal.userId.toString() !== userId.toString() && !journal.isPublic) {
      const err = new Error('Access denied to view this journal entry.');
      err.statusCode = 403;
      throw err;
    }

    return journal;
  }

  /**
   * Update journal entry
   */
  async updateJournal(journalId, userId, updateData) {
    const journal = await TravelJournal.findById(journalId);
    if (!journal) {
      const err = new Error('Journal entry not found');
      err.statusCode = 404;
      throw err;
    }

    if (journal.userId.toString() !== userId.toString()) {
      const err = new Error('Access denied to edit this journal entry.');
      err.statusCode = 403;
      throw err;
    }

    const allowedFields = [
      'title',
      'content',
      'notes',
      'memories',
      'photos',
      'placesVisited',
      'ratings',
      'highlights',
      'location',
      'isPublic',
      'tripId',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        journal[field] = updateData[field];
      }
    });

    return await journal.save();
  }

  /**
   * Delete journal entry
   */
  async deleteJournal(journalId, userId) {
    const journal = await TravelJournal.findById(journalId);
    if (!journal) {
      const err = new Error('Journal entry not found');
      err.statusCode = 404;
      throw err;
    }

    if (journal.userId.toString() !== userId.toString()) {
      const err = new Error('Access denied to delete this journal entry.');
      err.statusCode = 403;
      throw err;
    }

    await TravelJournal.findByIdAndDelete(journalId);
    return { success: true, message: 'Journal entry deleted successfully' };
  }
}

module.exports = new JournalService();
