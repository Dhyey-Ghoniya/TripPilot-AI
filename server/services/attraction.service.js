const Attraction = require('../models/Attraction');
const Destination = require('../models/Destination');

class AttractionService {
  async getAttractions(query = {}, isAdmin = false) {
    const {
      page = 1,
      limit = 12,
      search,
      destination,
      category,
      type,
      tag,
      featured,
      minPrice,
      maxPrice,
      maxDuration,
      sort = 'popular',
    } = query;

    const filter = {};

    // Active status filter for non-admins
    if (!isAdmin) {
      filter.isActive = true;
    } else if (query.status !== undefined && query.status !== '') {
      filter.isActive = query.status === 'active' || query.status === 'true';
    }

    // Search query
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'location.area': searchRegex },
        { 'location.address': searchRegex },
      ];
    }

    // Destination filter (ID or Slug)
    if (destination && destination !== 'all') {
      if (destination.match(/^[0-9a-fA-F]{24}$/)) {
        filter.destination = destination;
      } else {
        const destDoc = await Destination.findOne({ slug: destination });
        if (destDoc) {
          filter.destination = destDoc._id;
        }
      }
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Type filter
    if (type && type !== 'all') {
      filter.type = type;
    }

    // Tag filter
    if (tag && tag !== 'all') {
      filter.tags = tag;
    }

    // Featured filter
    if (featured === 'true' || featured === true) {
      filter.isFeatured = true;
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['ticketPrice.amount'] = {};
      if (minPrice !== undefined && minPrice !== '') {
        filter['ticketPrice.amount'].$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        filter['ticketPrice.amount'].$lte = Number(maxPrice);
      }
    }

    // Max Duration filter (in minutes)
    if (maxDuration && maxDuration !== 'all') {
      filter['estimatedVisitDuration.minMinutes'] = { $lte: Number(maxDuration) };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'rating':
        sortOption = { rating: -1, reviewCount: -1 };
        break;
      case 'price-low':
        sortOption = { 'ticketPrice.amount': 1 };
        break;
      case 'price-high':
        sortOption = { 'ticketPrice.amount': -1 };
        break;
      case 'duration-short':
        sortOption = { 'estimatedVisitDuration.minMinutes': 1 };
        break;
      case 'duration-long':
        sortOption = { 'estimatedVisitDuration.maxMinutes': -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'popular':
      default:
        sortOption = { popularityScore: -1, rating: -1 };
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [attractions, totalItems] = await Promise.all([
      Attraction.find(filter)
        .populate('destination', 'name slug city state country coverImage')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Attraction.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    return {
      attractions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  async getAttractionById(id) {
    const attraction = await Attraction.findById(id).populate('destination', 'name slug city state country coverImage');
    if (!attraction) {
      const error = new Error('Attraction not found');
      error.statusCode = 404;
      throw error;
    }
    return attraction;
  }

  async getAttractionBySlug(slug) {
    const attraction = await Attraction.findOne({ slug }).populate('destination', 'name slug city state country coverImage');
    if (!attraction) {
      const error = new Error('Attraction not found');
      error.statusCode = 404;
      throw error;
    }
    return attraction;
  }

  async getAttractionsByDestination(destinationIdOrSlug, query = {}) {
    let destId = destinationIdOrSlug;
    if (!destinationIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      const destDoc = await Destination.findOne({ slug: destinationIdOrSlug });
      if (!destDoc) {
        const error = new Error('Destination not found');
        error.statusCode = 404;
        throw error;
      }
      destId = destDoc._id;
    }

    return this.getAttractions({ ...query, destination: destId });
  }

  async getNearbyAttractions(latitude, longitude, radiusKm = 25) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const radius = Number(radiusKm);

    if (isNaN(lat) || isNaN(lng)) {
      const error = new Error('Valid latitude and longitude required');
      error.statusCode = 400;
      throw error;
    }

    // Approximate distance calculation using bounding box for standard query compatibility
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

    const attractions = await Attraction.find({
      isActive: true,
      'location.latitude': { $gte: lat - latDelta, $lte: lat + latDelta },
      'location.longitude': { $gte: lng - lngDelta, $lte: lng + lngDelta },
    })
      .populate('destination', 'name slug city state country')
      .limit(20)
      .lean();

    return attractions;
  }

  async createAttraction(data, userId) {
    // Verify destination exists
    const destination = await Destination.findById(data.destination);
    if (!destination) {
      const error = new Error('Associated destination does not exist');
      error.statusCode = 400;
      throw error;
    }

    let slug = Attraction.generateSlug(data.name);
    let existing = await Attraction.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const attraction = new Attraction({
      ...data,
      slug,
      createdBy: userId,
    });

    await attraction.save();
    return attraction.populate('destination', 'name slug city state country coverImage');
  }

  async updateAttraction(id, updateData) {
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      const error = new Error('Attraction not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.destination) {
      const dest = await Destination.findById(updateData.destination);
      if (!dest) {
        const error = new Error('Destination not found');
        error.statusCode = 400;
        throw error;
      }
    }

    if (updateData.name && updateData.name !== attraction.name) {
      let slug = Attraction.generateSlug(updateData.name);
      const existing = await Attraction.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
      updateData.slug = slug;
    }

    Object.assign(attraction, updateData);
    await attraction.save();
    return attraction.populate('destination', 'name slug city state country coverImage');
  }

  async deleteAttraction(id) {
    const attraction = await Attraction.findByIdAndDelete(id);
    if (!attraction) {
      const error = new Error('Attraction not found');
      error.statusCode = 404;
      throw error;
    }
    return { message: 'Attraction deleted successfully' };
  }

  async toggleStatus(id) {
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      const error = new Error('Attraction not found');
      error.statusCode = 404;
      throw error;
    }
    attraction.isActive = !attraction.isActive;
    await attraction.save();
    return attraction;
  }

  async toggleFeatured(id) {
    const attraction = await Attraction.findById(id);
    if (!attraction) {
      const error = new Error('Attraction not found');
      error.statusCode = 404;
      throw error;
    }
    attraction.isFeatured = !attraction.isFeatured;
    await attraction.save();
    return attraction;
  }
}

module.exports = new AttractionService();
