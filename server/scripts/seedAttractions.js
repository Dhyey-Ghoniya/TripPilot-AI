require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Destination = require('../models/Destination');
const Attraction = require('../models/Attraction');

const attractionsData = [
  // --- GOA ATTRACTIONS ---
  {
    destinationSlug: 'goa',
    name: 'Baga Beach',
    shortDescription: 'Vibrant golden sand beach famous for nightlife, water sports, and beach shacks.',
    description: 'Baga Beach is one of North Goa\'s most energetic beaches. Located adjacent to Calangute Beach, it offers water sports like banana rides, parasailing, jet skiing, as well as bustling beach shacks serving fresh seafood and tropical drinks.',
    category: 'Beach',
    type: 'Natural Attraction',
    tags: ['Must Visit', 'Water Sports', 'Nightlife', 'Family Friendly', 'Popular'],
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    ],
    location: { latitude: 15.5557, longitude: 73.7517, address: 'Baga Beach Rd, Baga, Goa 403516', area: 'North Goa' },
    openingHours: { monday: { open: '00:00', close: '23:59', closed: false }, notes: 'Accessible 24 hours. Water sports operate 09:00 - 18:00.' },
    ticketPrice: { amount: 0, isFree: true, adult: 0, child: 0, foreignVisitor: 0 },
    estimatedVisitDuration: { minMinutes: 120, maxMinutes: 240 },
    bestTimeToVisit: { months: ['November', 'December', 'January', 'February'], season: 'Winter', description: 'Sunsets and pleasant evening breezes.' },
    facilities: ['Parking', 'Food Court', 'Restrooms', 'Water Sports', 'Beach Chairs'],
    accessibility: 'Wheelchair Accessible',
    safetyInformation: 'Always obey lifeguard flags and avoid swimming after dark or in heavy current.',
    travelTips: ['Rent a sunbed early', 'Try authentic Goan fish curry at local shacks', 'Pre-book parasailing slots'],
    rating: 4.7,
    reviewCount: 1420,
    popularityScore: 95,
    isFeatured: true,
  },
  {
    destinationSlug: 'goa',
    name: 'Fort Aguada',
    shortDescription: '17th-century Portuguese fortress and lighthouse overlooking the Arabian Sea.',
    description: 'Fort Aguada is a well-preserved 17th-century Portuguese fort standing on Sinquerim Beach. Built in 1612 to guard against the Dutch and Marathas, it features a four-storey lighthouse and panoramic ocean views.',
    category: 'Historical',
    type: 'Historical Site',
    tags: ['History', 'Photography', 'Viewpoint', 'Must Visit', 'Architecture'],
    coverImage: 'https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1587922546307-776227941871?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 15.4924, longitude: 73.7737, address: 'Aguada Fort Rd, Candolim, Goa 403515', area: 'Candolim' },
    openingHours: { monday: { open: '09:30', close: '18:00', closed: false }, notes: 'Closes at 18:00 strictly.' },
    ticketPrice: { amount: 25, isFree: false, adult: 25, child: 10, foreignVisitor: 300 },
    estimatedVisitDuration: { minMinutes: 60, maxMinutes: 120 },
    bestTimeToVisit: { months: ['October', 'November', 'December', 'January'], season: 'Winter', description: 'Best visited late afternoon for sunset views.' },
    facilities: ['Parking', 'Restrooms', 'Guided Tours', 'Drinking Water'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Mind uneven stone pathways and guardrails along high cliffs.',
    travelTips: ['Carry a hat and sunblock', 'Visit around 16:30 for magnificent sunset photography'],
    rating: 4.6,
    reviewCount: 980,
    popularityScore: 90,
    isFeatured: true,
  },
  {
    destinationSlug: 'goa',
    name: 'Basilica of Bom Jesus',
    shortDescription: 'UNESCO World Heritage monument holding the mortal remains of St. Francis Xavier.',
    description: 'The Basilica of Bom Jesus is an iconic Baroque Roman Catholic church located in Old Goa. Constructed between 1594 and 1605, it is one of the oldest churches in India and a designated UNESCO World Heritage Site.',
    category: 'Religious',
    type: 'Religious Site',
    tags: ['UNESCO', 'History', 'Culture', 'Architecture', 'Peaceful'],
    coverImage: 'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 15.5009, longitude: 73.9116, address: 'Old Goa Rd, Velha Goa, Goa 403402', area: 'Old Goa' },
    openingHours: { sunday: { open: '10:30', close: '18:30', closed: false }, notes: 'Monday-Saturday: 09:00 - 18:30. Sunday mass mornings.' },
    ticketPrice: { amount: 0, isFree: true, adult: 0, child: 0, foreignVisitor: 0 },
    estimatedVisitDuration: { minMinutes: 45, maxMinutes: 90 },
    bestTimeToVisit: { months: ['November', 'December', 'January'], season: 'Winter', description: 'Early morning to appreciate peaceful architecture.' },
    facilities: ['Parking', 'Restrooms', 'Wheelchair Access', 'Guided Tours'],
    accessibility: 'Wheelchair Accessible',
    safetyInformation: 'Maintain silence inside the sanctuary and dress modestly.',
    travelTips: ['Combine visit with Se Cathedral right across the street', 'Photography prohibited inside main altar area'],
    rating: 4.8,
    reviewCount: 1120,
    popularityScore: 92,
    isFeatured: false,
  },

  // --- MANALI ATTRACTIONS ---
  {
    destinationSlug: 'manali',
    name: 'Solang Valley',
    shortDescription: 'Hub for snow adventure sports including paragliding, zorbing, and skiing.',
    description: 'Solang Valley is a picturesque side valley at the top of the Kullu Valley in Himachal Pradesh. Renowned for its snow-covered slopes in winter and lush green meadows in summer, it offers thrill-seekers paragliding, quad biking, and skiing.',
    category: 'Adventure',
    type: 'Adventure Activity',
    tags: ['Snow', 'Paragliding', 'Adventure', 'Must Visit', 'Mountains'],
    coverImage: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 32.3166, longitude: 77.1578, address: 'Solang Valley, Manali, Himachal Pradesh 175131', area: 'Solang' },
    openingHours: { monday: { open: '09:00', close: '17:00', closed: false }, notes: 'Adventure sports depend on weather conditions.' },
    ticketPrice: { amount: 0, isFree: true, adult: 0, child: 0, foreignVisitor: 0 },
    estimatedVisitDuration: { minMinutes: 180, maxMinutes: 360 },
    bestTimeToVisit: { months: ['December', 'January', 'February', 'May', 'June'], season: 'Winter / Summer', description: 'Winter for snow activities, summer for paragliding.' },
    facilities: ['Parking', 'Food Court', 'Restrooms', 'Equipment Rental'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Only hire licensed adventure sports operators with proper safety harnesses.',
    travelTips: ['Rent snow suits at government-approved rates near valley entrance', 'Start early to beat traffic'],
    rating: 4.8,
    reviewCount: 1850,
    popularityScore: 98,
    isFeatured: true,
  },
  {
    destinationSlug: 'manali',
    name: 'Hadimba Temple',
    shortDescription: 'Ancient 16th-century wooden temple nestled in dense cedar forest.',
    description: 'Hadimba Temple (also known as Dhungari Temple) is an ancient cave temple dedicated to Hidimbi Devi from the Mahabharata epic. Built in 1553, the wooden temple features intricate carved timber pagodas surrounded by giant Deodar trees.',
    category: 'Temple',
    type: 'Religious Site',
    tags: ['Culture', 'History', 'Nature', 'Wood Carving', 'Peaceful'],
    coverImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 32.2483, longitude: 77.1802, address: 'Hadimba Temple Rd, Old Manali, Himachal Pradesh 175131', area: 'Old Manali' },
    openingHours: { monday: { open: '08:00', close: '18:00', closed: false }, notes: 'Open daily year round.' },
    ticketPrice: { amount: 0, isFree: true, adult: 0, child: 0, foreignVisitor: 0 },
    estimatedVisitDuration: { minMinutes: 45, maxMinutes: 90 },
    bestTimeToVisit: { months: ['March', 'April', 'May', 'October', 'November'], season: 'Spring / Autumn', description: 'Lush green forest surroundings.' },
    facilities: ['Parking', 'Restrooms', 'Souvenir Shops', 'Yak Rides'],
    accessibility: 'Wheelchair Accessible',
    safetyInformation: 'Watch out for monkeys in the surrounding cedar woods.',
    travelTips: ['Take pictures with local Angora rabbits or yaks near entrance', 'Try local Himachali snacks nearby'],
    rating: 4.7,
    reviewCount: 1290,
    popularityScore: 92,
    isFeatured: true,
  },

  // --- JAIPUR ATTRACTIONS ---
  {
    destinationSlug: 'jaipur',
    name: 'Amber Fort',
    shortDescription: 'Majestic hilltop sandstone and marble fortress with Sheesh Mahal.',
    description: 'Amber Fort (Amer Fort) is a UNESCO World Heritage site located in Amer, 11 km from Jaipur. Built in 1592 by Raja Man Singh I, the opulent palace complex is constructed from yellow and pink sandstone and white marble.',
    category: 'Historical',
    type: 'Historical Site',
    tags: ['UNESCO', 'History', 'Architecture', 'Must Visit', 'Photography'],
    coverImage: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 26.9855, longitude: 75.8513, address: 'Devisinghpura, Amer, Jaipur, Rajasthan 302001', area: 'Amer' },
    openingHours: { monday: { open: '08:00', close: '17:30', closed: false }, notes: 'Evening Light & Sound Show: 18:30 - 20:30.' },
    ticketPrice: { amount: 100, isFree: false, adult: 100, child: 50, foreignVisitor: 500 },
    estimatedVisitDuration: { minMinutes: 120, maxMinutes: 240 },
    bestTimeToVisit: { months: ['October', 'November', 'December', 'January', 'February'], season: 'Winter', description: 'Cool mornings ideal for exploring large fort compounds.' },
    facilities: ['Parking', 'Restrooms', 'Guided Tours', 'Audio Guides', 'Food Court'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Cliffs and high battlements require caution near parapet edges.',
    travelTips: ['Hire an official guide to hear stories of the Sheesh Mahal (Mirror Palace)', 'Attend the night light show'],
    rating: 4.9,
    reviewCount: 2300,
    popularityScore: 99,
    isFeatured: true,
  },
  {
    destinationSlug: 'jaipur',
    name: 'Hawa Mahal',
    shortDescription: 'Iconic 5-story pink honeycomb palace with 953 intricate jharokhas.',
    description: 'Hawa Mahal ("Palace of Breeze") is Jaipur\'s most recognized landmark. Built in 1799 by Maharaja Sawai Pratap Singh, its unique 5-story facade resembles a honeycomb with 953 small windows designed for royal women to observe street festivals undetected.',
    category: 'Landmark',
    type: 'Tourist Attraction',
    tags: ['Architecture', 'Instagrammable', 'History', 'Must Visit', 'Culture'],
    coverImage: 'https://images.unsplash.com/photo-1603201667141-5a2d4c673378?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1603201667141-5a2d4c673378?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 26.9239, longitude: 75.8267, address: 'Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Jaipur, Rajasthan 302002', area: 'Pink City' },
    openingHours: { monday: { open: '09:00', close: '17:00', closed: false }, notes: 'Best photo light early morning.' },
    ticketPrice: { amount: 50, isFree: false, adult: 50, child: 20, foreignVisitor: 200 },
    estimatedVisitDuration: { minMinutes: 45, maxMinutes: 90 },
    bestTimeToVisit: { months: ['October', 'November', 'December', 'January'], season: 'Winter', description: 'Early morning sunrise light hits the facade.' },
    facilities: ['Souvenir Shops', 'Restrooms', 'Audio Guides'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Narrow staircases inside require slow careful steps.',
    travelTips: ['Visit the rooftop cafes right opposite Hawa Mahal for panoramic photo shots', 'Combine with City Palace'],
    rating: 4.7,
    reviewCount: 1950,
    popularityScore: 96,
    isFeatured: true,
  },

  // --- KERALA ATTRACTIONS ---
  {
    destinationSlug: 'kerala',
    name: 'Alleppey Backwaters',
    shortDescription: 'Tranquil network of canals, lagoons, and traditional luxury houseboats.',
    description: 'Alappuzha (Alleppey) is known as the "Venice of the East". The serene backwaters feature a vast network of palm-fringed waterways, rustic villages, paddy fields, and traditional Kettuvallam houseboats providing overnight stays.',
    category: 'Nature',
    type: 'Natural Attraction',
    tags: ['Couples', 'Relaxation', 'Must Visit', 'Romantic', 'Nature'],
    coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 9.4981, longitude: 76.3388, address: 'Finishing Point, Alappuzha, Kerala 688013', area: 'Alleppey' },
    openingHours: { monday: { open: '06:00', close: '18:00', closed: false }, notes: 'Houseboat cruises run continuously.' },
    ticketPrice: { amount: 500, isFree: false, adult: 500, child: 250, foreignVisitor: 1000 },
    estimatedVisitDuration: { minMinutes: 240, maxMinutes: 720 },
    bestTimeToVisit: { months: ['September', 'October', 'November', 'December', 'January', 'February'], season: 'Winter', description: 'Cool tropical breezes and clear blue skies.' },
    facilities: ['Food Court', 'Restrooms', 'Houseboat Rental', 'Parking'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Wear life jackets during shikara or canoe rides in open lake sections.',
    travelTips: ['Book a private overnight houseboat for fresh cooked Karimeen fish meal', 'Opt for sunset canoe rides in narrow canals'],
    rating: 4.9,
    reviewCount: 2100,
    popularityScore: 97,
    isFeatured: true,
  },

  // --- KASHMIR ATTRACTIONS ---
  {
    destinationSlug: 'kashmir',
    name: 'Dal Lake',
    shortDescription: 'Jewel in the crown of Kashmir featuring colorful Shikaras and floating markets.',
    description: 'Dal Lake is an urban lake in Srinagar, summer capital of Jammu and Kashmir. Covering 18 sq km, it is renowned for vibrant wooden Shikara boats, traditional houseboats, floating vegetable markets, and lotus gardens.',
    category: 'Nature',
    type: 'Natural Attraction',
    tags: ['Shikara', 'Couples', 'Photography', 'Must Visit', 'Romantic'],
    coverImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 34.1182, longitude: 74.8636, address: 'Boulevard Road, Srinagar, Jammu and Kashmir 190001', area: 'Srinagar' },
    openingHours: { monday: { open: '05:00', close: '21:00', closed: false }, notes: 'Shikaras operate from sunrise to late evening.' },
    ticketPrice: { amount: 400, isFree: false, adult: 400, child: 200, foreignVisitor: 800 },
    estimatedVisitDuration: { minMinutes: 90, maxMinutes: 180 },
    bestTimeToVisit: { months: ['April', 'May', 'June', 'September', 'October'], season: 'Spring / Autumn', description: 'Pleasant weather and blooming lotus flowers.' },
    facilities: ['Restrooms', 'Shikara Service', 'Floating Markets', 'Food Stalls'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Step carefully onto wooden boat edges during embarkation.',
    travelTips: ['Take a 6 AM shikara ride to witness the early morning floating vegetable market', 'Sip authentic Kashmiri Kahwa tea on the boat'],
    rating: 4.9,
    reviewCount: 1780,
    popularityScore: 98,
    isFeatured: true,
  },

  // --- UDAIPUR ATTRACTIONS ---
  {
    destinationSlug: 'udaipur',
    name: 'City Palace Udaipur',
    shortDescription: 'Grand palace complex overlooking Lake Pichola built across 400 years.',
    description: 'Udaipur City Palace is a colossal palace complex situated on the east bank of Lake Pichola. Built in a flamboyant style combining Rajasthani and Mughal architecture, it offers panoramic views of the Lake Palace and city.',
    category: 'Historical',
    type: 'Historical Site',
    tags: ['Architecture', 'History', 'Luxury', 'Must Visit', 'Photography'],
    coverImage: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1615836245337-f5b9b2303f1c?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 24.5764, longitude: 73.6835, address: 'City Palace Complex, Udaipur, Rajasthan 313001', area: 'Old City' },
    openingHours: { monday: { open: '09:30', close: '17:30', closed: false }, notes: 'Museum ticket counter closes at 17:00.' },
    ticketPrice: { amount: 300, isFree: false, adult: 300, child: 100, foreignVisitor: 300 },
    estimatedVisitDuration: { minMinutes: 120, maxMinutes: 240 },
    bestTimeToVisit: { months: ['October', 'November', 'December', 'January', 'February'], season: 'Winter', description: 'Ideal for walking through open courtyard gardens.' },
    facilities: ['Parking', 'Restrooms', 'Guided Tours', 'Museum Store', 'Cafes'],
    accessibility: 'Wheelchair Partially Accessible',
    safetyInformation: 'Elevated marble balconies and narrow corridors require careful walking.',
    travelTips: ['Combine museum tour with a boat ride on Lake Pichola departing from Rameshwar Ghat inside palace grounds'],
    rating: 4.8,
    reviewCount: 1650,
    popularityScore: 94,
    isFeatured: true,
  },

  // --- RISHIKESH ATTRACTIONS ---
  {
    destinationSlug: 'rishikesh',
    name: 'Triveni Ghat',
    shortDescription: 'Holy bathing ghat on the Ganges renowned for the enchanting evening Ganga Aarti.',
    description: 'Triveni Ghat is the biggest and most sacred ghat in Rishikesh, situated on the banks of the holy River Ganges. Every evening, thousands gather to witness the soul-stirring Ganga Aarti accompanied by rhythmic chants, oil lamps, and bells.',
    category: 'Religious',
    type: 'Religious Site',
    tags: ['Ganga Aarti', 'Culture', 'Religious', 'Must Visit', 'Peaceful'],
    coverImage: 'https://images.unsplash.com/photo-1598977123118-4e309076b573?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1598977123118-4e309076b573?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 30.1035, longitude: 78.2974, address: 'Mayapur, Rishikesh, Uttarakhand 249201', area: 'Rishikesh Town' },
    openingHours: { monday: { open: '05:00', close: '21:00', closed: false }, notes: 'Evening Aarti starts around 18:00 in winter, 19:00 in summer.' },
    ticketPrice: { amount: 0, isFree: true, adult: 0, child: 0, foreignVisitor: 0 },
    estimatedVisitDuration: { minMinutes: 60, maxMinutes: 120 },
    bestTimeToVisit: { months: ['September', 'October', 'November', 'March', 'April'], season: 'Autumn / Spring', description: 'Arrive 45 minutes before Aarti for good seating.' },
    facilities: ['Restrooms', 'Shoe Stand', 'Seating Steps', 'Souvenir Shops'],
    accessibility: 'Wheelchair Accessible',
    safetyInformation: 'Beware of strong currents if dipping feet into the river steps.',
    travelTips: ['Leave footwear at organized shoe counters', 'Float a leaf diya lamp on the river after Aarti'],
    rating: 4.8,
    reviewCount: 1490,
    popularityScore: 93,
    isFeatured: true,
  },

  // --- ANDAMAN ISLANDS ATTRACTIONS ---
  {
    destinationSlug: 'andaman-islands',
    name: 'Radhanagar Beach',
    shortDescription: 'Award-winning turquoise water beach on Havelock Island surrounded by rainforest.',
    description: 'Radhanagar Beach (Beach No. 7) on Havelock Island (Swaraj Dweep) has been voted among Asia\'s best beaches by Time Magazine. Famous for fine white sand, crystal-clear turquoise waters, and lush forest backdrop.',
    category: 'Beach',
    type: 'Natural Attraction',
    tags: ['Beach', 'Sunset', 'Must Visit', 'Couples', 'Photography'],
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
    location: { latitude: 11.9841, longitude: 92.9515, address: 'Radhanagar Beach, Havelock Island, Andaman and Nicobar Islands 744211', area: 'Havelock Island' },
    openingHours: { monday: { open: '06:00', close: '17:30', closed: false }, notes: 'Sunset swimming restricted after 17:00 for safety.' },
    ticketPrice: { amount: 0, isFree: true, adult: 0, child: 0, foreignVisitor: 0 },
    estimatedVisitDuration: { minMinutes: 120, maxMinutes: 240 },
    bestTimeToVisit: { months: ['October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'], season: 'Dry Season', description: 'Crystal clear waters perfect for swimming.' },
    facilities: ['Changing Rooms', 'Showers', 'Restrooms', 'Lifeguards', 'Food Stalls'],
    accessibility: 'Wheelchair Accessible',
    safetyInformation: 'Always swim within designated green lifeguard zones.',
    travelTips: ['Stay till sunset around 17:15 for incredible sky colors', 'No plastic bottles allowed on beach entrance'],
    rating: 4.9,
    reviewCount: 2050,
    popularityScore: 99,
    isFeatured: true,
  },
];

const seedAttractions = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trippilot';
    await mongoose.connect(mongoUri);
    console.log('[Seed Attractions] Connected to MongoDB');

    let seededCount = 0;

    for (const attrData of attractionsData) {
      const { destinationSlug, ...data } = attrData;
      const destination = await Destination.findOne({ slug: destinationSlug });

      if (!destination) {
        console.warn(`[Seed Warning] Destination slug '${destinationSlug}' not found for attraction '${data.name}'. Skipping.`);
        continue;
      }

      const slug = Attraction.generateSlug(data.name);
      await Attraction.findOneAndUpdate(
        { slug },
        { ...data, slug, destination: destination._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Seed] Seeded attraction: ${data.name} (Slug: ${slug} → Destination: ${destination.name})`);
      seededCount++;
    }

    console.log(`[Seed Attractions] Success! ${seededCount} sample attractions seeded.`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed Attractions Error]:', error);
    process.exit(1);
  }
};

seedAttractions();
