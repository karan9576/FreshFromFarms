const Stat = require('../models/Stat');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await Stat.find().sort({ date: -1 }).limit(30);
    const totalUsers = await User.countDocuments();
    
    // Sum up total revenue from all daily statistics entries in the database
    const allStats = await Stat.find();
    const totalRevenue = allStats.reduce((sum, item) => sum + (item.revenue || 0), 0);

    res.json({ stats, totalUsers, totalRevenue });
  } catch (error) {
    console.error('getStats error:', error.stack || error.message);
    res.status(500).json({ message: 'Error fetching administration stats.' });
  }
};

exports.addProduct = async (req, res, next) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('addProduct error:', error.stack || error.message);
    res.status(500).json({ message: 'Error adding product to catalogue.' });
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product successfully removed.' });
  } catch (error) {
    console.error('deleteProduct error:', error.stack || error.message);
    res.status(500).json({ message: 'Error removing product.' });
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('getOrders error:', error.stack || error.message);
    res.status(500).json({ message: 'Error retrieving order records.' });
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json(order);
  } catch (error) {
    console.error('updateOrderStatus error:', error.stack || error.message);
    res.status(500).json({ message: 'Error updating order status.' });
  }
};
