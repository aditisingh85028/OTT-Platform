const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Content = require('../models/Content');
const Plan = require('../models/Plan');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

dotenv.config();

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/ott', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    // Clear existing collections
    await User.deleteMany();
    await Content.deleteMany();
    await Plan.deleteMany();
    await Review.deleteMany();
    await Transaction.deleteMany();
    await Notification.deleteMany();

    console.log('Collections cleared...');

    // 1. Create Subscription Plans
    const plans = await Plan.insertMany([
      {
        name: 'Basic',
        price: 499, // in local currency (e.g. INR/cents, let's keep simple numbers)
        features: ['HD Streaming', 'Watch on 1 Device', 'Ad-Supported'],
        durationMonths: 1,
      },
      {
        name: 'Premium',
        price: 999,
        features: ['Full HD Streaming', 'Watch on 2 Devices', 'Ad-Free', 'Download Available'],
        durationMonths: 1,
      },
      {
        name: 'VIP Platinum',
        price: 1999,
        features: ['4K Ultra HD Streaming', 'Watch on 4 Devices', 'Ad-Free', 'Offline Downloads', 'Access to Watch Parties'],
        durationMonths: 3,
      },
    ]);

    console.log('Plans seeded...');

    // 2. Create Default Users (Admin & User)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    const adminUser = await User.create({
      name: 'OTT Administrator',
      email: 'admin@ott.com',
      password: 'admin123', // Will be hashed via User.pre('save')
      role: 'admin',
    });

    const standardUser = await User.create({
      name: 'Jane Doe',
      email: 'user@ott.com',
      password: 'user123', // Will be hashed via User.pre('save')
      role: 'user',
      subscription: {
        plan: plans[1]._id, // Premium
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    console.log('Users seeded...');

    // 3. Create Sample Contents
    const contents = await Content.insertMany([
      {
        title: 'Cosmic Odysseys',
        description: 'An immersive journey through the deepest frontiers of the cosmos, exploring alien worlds, black holes, and the origins of space-time itself.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        type: 'movie',
        genres: ['Sci-Fi', 'Adventure', 'Documentary'],
        duration: 112,
        releaseYear: 2024,
        cast: ['Neil deGrasse Tyson', 'Brian Cox', 'Michio Kaku'],
        isFeatured: true,
        views: 1240,
        rating: 4.8,
        numReviews: 1,
      },
      {
        title: 'Tears of Steel',
        description: 'Set in a dystopian future where human fighters must protect the planet against a horde of rogue machines. A sci-fi masterpiece showing love and revenge.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        type: 'movie',
        genres: ['Sci-Fi', 'Action'],
        duration: 95,
        releaseYear: 2023,
        cast: ['Derek de Lint', 'Rogier Schippers', 'Vanja Rukavina'],
        isFeatured: true,
        views: 850,
        rating: 4.2,
        numReviews: 0,
      },
      {
        title: 'Sintel: Legend of the Blade',
        description: 'A young female warrior searches for her lost pet dragon, facing extreme elements and dark forces that test her willpower and combat skills.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        type: 'movie',
        genres: ['Fantasy', 'Adventure', 'Animation'],
        duration: 88,
        releaseYear: 2022,
        cast: ['Halina Reijn', 'Thom Hoffman'],
        isFeatured: false,
        views: 620,
        rating: 4.5,
        numReviews: 0,
      },
      {
        title: 'The Cyber Hackers',
        description: 'Underground cyber activists wage war against greedy conglomerates in an attempt to open-source the global wealth index.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        type: 'movie',
        genres: ['Action', 'Thriller'],
        duration: 125,
        releaseYear: 2025,
        cast: ['Rami Malek', 'Christian Slater'],
        isFeatured: false,
        views: 450,
        rating: 4.0,
        numReviews: 0,
      },
      {
        title: 'Shadow Chronicles',
        description: 'A premium sci-fi series detailing a special detective unit analyzing inter-dimensional crimes across a futuristic metropolis.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
        type: 'series',
        genres: ['Sci-Fi', 'Mystery', 'Drama'],
        releaseYear: 2024,
        cast: ['David Harbour', 'Winona Ryder', 'Millie Bobby Brown'],
        isFeatured: true,
        views: 2310,
        rating: 4.9,
        numReviews: 0,
        seasons: [
          {
            seasonNumber: 1,
            episodes: [
              {
                episodeNumber: 1,
                title: 'The Portal Opens',
                description: 'A scientist mistakenly triggers a rift, opening communication with a parallel version of our planet.',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                duration: 45,
              },
              {
                episodeNumber: 2,
                title: 'Echoes of the Past',
                description: 'Detectives discover a set of footprints matching an historical detective who vanished in 1982.',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                duration: 50,
              },
            ],
          },
        ],
      },
    ]);

    console.log('Content seeded...');

    // 4. Create sample Review
    await Review.create({
      user: standardUser._id,
      userName: standardUser.name,
      content: contents[0]._id,
      rating: 5,
      comment: 'An absolute masterpiece! The animations and descriptions of deep space elements are beautiful and highly educational.',
    });

    // 5. Create a sample Transaction for analytics
    await Transaction.create({
      user: standardUser._id,
      plan: plans[1]._id,
      amount: plans[1].price,
      paymentStatus: 'success',
      paymentMethod: 'mock_card',
      transactionId: 'TXN-INITIALSEED99',
    });

    // 6. Create notifications
    await Notification.create({
      title: 'Welcome to OTT Stream!',
      message: 'Explore hundreds of high quality movies and custom watch parties. Join in now!',
      type: 'broadcast',
    });

    console.log('Seeder ran successfully. Database seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data: ', error);
    process.exit(1);
  }
};

seedData();
