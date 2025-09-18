// import mongoose from 'mongoose';
// import { Hotel } from './src/models/hotel.models.js';
// import dotenv from 'dotenv';

// dotenv.config({ path: './.env' });

// const sampleHotels = [
//   {
//     name: 'Luxury Palace Hotel',
//     description: 'A luxurious 5-star hotel with premium amenities and exceptional service',
//     city: 'Paris',
//     address: '123 Champs-Élysées, Paris, France',
//     amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Bar'],
//     starRating: 5,
//     images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'],
//     adminId: new mongoose.Types.ObjectId()
//   },
//   {
//     name: 'Urban Comfort Inn',
//     description: 'Modern hotel in the heart of the city with comfortable rooms',
//     city: 'New York',
//     address: '456 Broadway, New York, NY 10012',
//     amenities: ['WiFi', 'Breakfast', 'Parking', 'Business Center'],
//     starRating: 4,
//     images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop'],
//     adminId: new mongoose.Types.ObjectId()
//   },
//   {
//     name: 'Seaside Resort',
//     description: 'Beautiful beachfront resort with stunning ocean views',
//     city: 'Miami',
//     address: '789 Ocean Drive, Miami Beach, FL 33139',
//     amenities: ['Beach Access', 'Pool', 'Spa', 'Restaurant', 'Water Sports'],
//     starRating: 4.5,
//     images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop'],
//     adminId: new mongoose.Types.ObjectId()
//   },
//   {
//     name: 'Mountain View Lodge',
//     description: 'Cozy lodge with breathtaking mountain views and rustic charm',
//     city: 'Denver',
//     address: '101 Mountain Road, Denver, CO 80202',
//     amenities: ['Fireplace', 'Hiking Trails', 'Restaurant', 'Free Parking'],
//     starRating: 3.5,
//     images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop'],
//     adminId: new mongoose.Types.ObjectId()
//   },
//   {
//     name: 'Tokyo Skyline Hotel',
//     description: 'Modern hotel with panoramic city views in downtown Tokyo',
//     city: 'Tokyo',
//     address: '234 Shibuya Crossing, Tokyo, Japan',
//     amenities: ['City View', 'WiFi', 'Restaurant', 'Spa', 'Concierge'],
//     starRating: 4,
//     images: ['https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?q=80&w=2071&auto=format&fit=crop'],
//     adminId: new mongoose.Types.ObjectId()
//   }
// ];

// async function seedDatabase() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URL);
//     console.log('Connected to MongoDB');

//     // Clear existing hotels
//     await Hotel.deleteMany({});
//     console.log('Cleared existing hotels');

//     // Insert sample hotels
//     const insertedHotels = await Hotel.insertMany(sampleHotels);
//     console.log(`Inserted ${insertedHotels.length} hotels`);

//     // Display the cities that were added
//     const cities = [...new Set(insertedHotels.map(hotel => hotel.city))];
//     console.log('Available cities:', cities.join(', '));

//     console.log('Database seeded successfully!');
//     process.exit(0);
//   } catch (error) {
//     console.error('Error seeding database:', error);
//     process.exit(1);
//   }
// }

// seedDatabase();