const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const DeliveryPartner = require('../models/DeliveryPartner');
const Coupon = require('../models/Coupon');

dotenv.config();

const products = [
  {
    name: '20L Water Jar',
    description: 'Premium quality 20 liter water jar. Purified and mineral-enriched water.',
    category: 'Jar',
    size: '20L',
    price: 50,
    discountPrice: 45,
    image: 'https://via.placeholder.com/300x300?text=20L+Jar',
    stock: 100,
    features: ['Purified Water', 'Mineral Enriched', 'BPA Free Jar', 'Home Delivery']
  },
  {
    name: '1L Water Bottle',
    description: 'Convenient 1 liter packaged drinking water bottle.',
    category: 'Bottle',
    size: '1L',
    price: 20,
    stock: 200,
    features: ['Packaged Drinking Water', 'Sealed', 'Portable']
  },
  {
    name: '2L Water Bottle',
    description: 'Large 2 liter packaged drinking water bottle for families.',
    category: 'Bottle',
    size: '2L',
    price: 35,
    discountPrice: 30,
    stock: 150,
    features: ['Packaged Drinking Water', 'Family Pack', 'Sealed']
  },
  {
    name: 'RO Water Refill',
    description: 'RO purified water refill service for your existing containers.',
    category: 'RO Refill',
    size: '20L',
    price: 30,
    stock: 50,
    features: ['RO Purified', '7-Stage Filtration', 'TDS Controlled', 'Fresh Water']
  },
  {
    name: 'Cold Water Can',
    description: 'Chilled water can perfect for hot summer days.',
    category: 'Cold Water',
    size: '20L',
    price: 60,
    discountPrice: 55,
    stock: 80,
    features: ['Chilled Water', 'Refreshing', 'Purified', 'Ready to Drink']
  },
  {
    name: '500ml Water Bottle (Pack of 12)',
    description: 'Pack of 12 small 500ml bottles, perfect for parties and events.',
    category: 'Bottle',
    size: '500ml x 12',
    price: 120,
    discountPrice: 100,
    stock: 100,
    features: ['Party Pack', 'Portable', 'Sealed', 'Bulk Order']
  }
];

const deliveryPartners = [
  {
    name: 'Rajesh Kumar',
    phone: '+919876543210',
    email: 'rajesh@paniwallah.com',
    vehicleNumber: 'DL01AB1234',
    vehicleType: 'Bike',
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Amit Singh',
    phone: '+919876543211',
    email: 'amit@paniwallah.com',
    vehicleNumber: 'DL02CD5678',
    vehicleType: 'Scooter',
    isAvailable: true,
    isActive: true
  },
  {
    name: 'Suresh Sharma',
    phone: '+919876543212',
    email: 'suresh@paniwallah.com',
    vehicleNumber: 'DL03EF9012',
    vehicleType: 'Van',
    isAvailable: true,
    isActive: true
  }
];

const coupons = [
  {
    code: 'WELCOME50',
    description: 'Get 50% off on your first order',
    discountType: 'Percentage',
    discountValue: 50,
    minOrderValue: 100,
    maxDiscount: 100,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    isActive: true
  },
  {
    code: 'FLAT30',
    description: 'Flat ₹30 off on orders above ₹200',
    discountType: 'Fixed',
    discountValue: 30,
    minOrderValue: 200,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'SUMMER20',
    description: 'Get 20% off on all orders',
    discountType: 'Percentage',
    discountValue: 20,
    minOrderValue: 150,
    maxDiscount: 50,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    await DeliveryPartner.deleteMany({});
    await Coupon.deleteMany({});

    console.log('🗑️  Cleared existing data');

    await Product.insertMany(products);
    console.log('✅ Products seeded');

    await DeliveryPartner.insertMany(deliveryPartners);
    console.log('✅ Delivery partners seeded');

    await Coupon.insertMany(coupons);
    console.log('✅ Coupons seeded');

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
