const Destination = require('../models/Destination');

class DestinationService {
  async getDestinations(query = {}, isAdmin = false) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const filter = {};

    // For non-admin public requests, only return active destinations
    if (!isAdmin) {
      filter.isActive = true;
    } else if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    // Featured filter
    if (query.featured !== undefined) {
      filter.isFeatured = query.featured === 'true';
    }

    // Category filter
    if (query.category && query.category !== 'All') {
      filter.categories = query.category;
    }

    // Season filter
    if (query.season && query.season !== 'All Seasons') {
      filter['bestTimeToVisit.season'] = { $regex: query.season, $options: 'i' };
    }

    // Maximum Budget filter
    if (query.maxBudget && !isNaN(query.maxBudget)) {
      filter['estimatedBudget.minPerDay'] = { $lte: Number(query.maxBudget) };
    }

    // Search query (case-insensitive across name, city, state, country, tags, categories)
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { country: searchRegex },
        { tags: searchRegex },
        { categories: searchRegex },
      ];
    }

    // Sorting strategy
    let sortOptions = { popularityScore: -1, rating: -1 };
    switch (query.sort) {
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'budget-low':
        sortOptions = { 'estimatedBudget.minPerDay': 1 };
        break;
      case 'budget-high':
        sortOptions = { 'estimatedBudget.minPerDay': -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'alphabetical':
      case 'name':
        sortOptions = { name: 1 };
        break;
      case 'popular':
      default:
        sortOptions = { popularityScore: -1, rating: -1 };
        break;
    }

    const totalItems = await Destination.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const destinations = await Destination.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    return {
      destinations,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getDestinationBySlug(slug) {
    const cleanSlug = slug.toLowerCase().trim();
    const destination = await Destination.findOne({ slug: cleanSlug });
    if (!destination) {
      const error = new Error('Destination not found');
      error.statusCode = 404;
      throw error;
    }
    return destination;
  }

  async getDestinationById(id) {
    const destination = await Destination.findById(id);
    if (!destination) {
      const error = new Error('Destination not found');
      error.statusCode = 404;
      throw error;
    }
    return destination;
  }

  async createDestination(data, userId) {
    const slug = data.slug || Destination.generateSlug(data.name);

    // Check slug uniqueness
    const existing = await Destination.findOne({ slug });
    if (existing) {
      const error = new Error('A destination with a similar name or slug already exists');
      error.statusCode = 409;
      throw error;
    }

    const destination = new Destination({
      ...data,
      slug,
      createdBy: userId,
    });

    await destination.save();
    return destination;
  }

  async updateDestination(id, data) {
    if (data.name && !data.slug) {
      data.slug = Destination.generateSlug(data.name);
    }

    const destination = await Destination.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!destination) {
      const error = new Error('Destination not found');
      error.statusCode = 404;
      throw error;
    }

    return destination;
  }

  async deleteDestination(id) {
    const destination = await Destination.findByIdAndDelete(id);
    if (!destination) {
      const error = new Error('Destination not found');
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Destination deleted successfully' };
  }

  async toggleDestinationStatus(id, isActive) {
    const destination = await Destination.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    );
    if (!destination) {
      const error = new Error('Destination not found');
      error.statusCode = 404;
      throw error;
    }
    return destination;
  }

  async toggleDestinationFeatured(id, isFeatured) {
    const destination = await Destination.findByIdAndUpdate(
      id,
      { $set: { isFeatured } },
      { new: true }
    );
    if (!destination) {
      const error = new Error('Destination not found');
      error.statusCode = 404;
      throw error;
    }
    return destination;
  }
}

module.exports = new DestinationService();
