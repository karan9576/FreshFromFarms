require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js DNS resolver to use Google DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server configuration failed, using default system DNS.');
}

const Product = require('../models/Product');

const seedProducts = [
  {
    name: 'Raw Makhana',
    description: 'Premium, unprocessed organic fox nuts straight from our water farms.',
    price: 139,
    flavour: 'Raw',
    imageUrl: '/raw.png',
    inStock: true
  },
  {
    name: 'Salted Makhana',
    description: 'Lightly roasted with trace rock salt for a pure, salty crunch.',
    price: 159,
    flavour: 'Salted',
    imageUrl: '/salted.png',
    inStock: true
  },
  {
    name: 'Peri Peri Makhana',
    description: 'Spiced with fiery African bird\'s eye chili and premium herbs.',
    price: 179,
    flavour: 'Peri Peri',
    imageUrl: '/periperi.png',
    inStock: true
  },
  {
    name: 'Cheese & Herbs',
    description: 'Rich cheese dusting mixed with natural Italian oregano.',
    price: 179,
    flavour: 'Cheese & Herbs',
    imageUrl: '/cheese.png',
    inStock: true
  },
  {
    name: 'Mint & Lime',
    description: 'Tangy lemon zest with dried mint leaves for a refreshing kick.',
    price: 179,
    flavour: 'Mint & Lime',
    imageUrl: '/mint.png',
    inStock: true
  }
];

const seedDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database connected for seeding: ${conn.connection.host}`);
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products.');

    // Seed new products
    await Product.insertMany(seedProducts);
    console.log('Successfully seeded database products!');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
