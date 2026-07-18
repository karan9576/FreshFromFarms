const Razorpay = require('razorpay');
const crypto = require('crypto');
const Stat = require('../models/Stat');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    const options = {
      amount: amount * 100, // convert INR to paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating razorpay order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, shippingInfo } = req.body;
    
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // 1. Fetch order details to get transaction amount (converted to INR)
      const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
      const amountInRupees = (orderDetails.amount || 0) / 100;

      // 2. Increment database daily stats revenue field
      const today = new Date().toISOString().split('T')[0];
      await Stat.findOneAndUpdate(
        { date: today },
        { $inc: { revenue: amountInRupees } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      // 3. Save verified Order record in database
      const newOrder = await Order.create({
        user: req.user ? req.user._id : null,
        email: shippingInfo?.email || (req.user ? req.user.email : 'anonymous@freshfromfarms.com'),
        phone: shippingInfo?.phone || '9999999999',
        addressLine1: shippingInfo?.addressLine1 || 'Default Address Line 1',
        addressLine2: shippingInfo?.addressLine2 || '',
        city: shippingInfo?.city || 'Default City',
        state: shippingInfo?.state || 'Default State',
        pincode: shippingInfo?.pincode || '000000',
        items: (cartItems || []).map(item => ({
          name: item.name,
          weight: item.weight,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: amountInRupees,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: 'Paid'
      });

      // 4. Send invoice confirmation email
      try {
        const emailService = require('../services/emailService');
        emailService.sendOrderConfirmationEmail(newOrder);
        emailService.sendAdminNewOrderNotification(newOrder);
      } catch (err) {
        console.error('Error triggering order confirmation email notification:', err);
      }

      return res.json({ message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid signature sent!' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment' });
  }
};
