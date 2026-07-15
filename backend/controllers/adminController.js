const Stat = require('../models/Stat');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

exports.getStats = async (req, res) => {
  try {
    const stats = await Stat.find().sort({ date: -1 }).limit(30);
    const totalUsers = await User.countDocuments();
    
    // Sum up total revenue from all daily statistics entries in the database
    const allStats = await Stat.find();
    const totalRevenue = allStats.reduce((sum, item) => sum + (item.revenue || 0), 0);

    res.json({ stats, totalUsers, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
