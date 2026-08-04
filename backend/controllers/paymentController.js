const Razorpay = require('razorpay');
const crypto = require('crypto');
const Stat = require('../models/Stat');
const Order = require('../models/Order');

const getRazorpayInstance = () => {
  let keyId = process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : '';
  let keySecret = process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.trim() : '';

  if (!keyId || keyId.includes('TDnk2IxhFOao0q') || keyId.length < 10) {
    keyId = 'rzp_test_TLfcrrpSYAfpKX';
  }
  if (!keySecret || keySecret.includes('Gf7VRzJTMSau9SmaZNrVH67f') || keySecret.length < 10) {
    keySecret = 'zeoILwMkvwo8wz8P7hSWQafo';
  }

  return {
    instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret
  };
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid order amount specified.' });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // convert INR to paise, integer
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const { instance, keyId } = getRazorpayInstance();
    console.log('[createOrder] Using Razorpay keyId:', keyId);
    const order = await instance.orders.create(options);
    res.json({
      ...order,
      key: keyId
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ 
      message: error?.error?.description || error?.message || 'Error creating razorpay order',
      debug_key_used: (() => { try { return getRazorpayInstance().keyId; } catch(e) { return 'unknown'; } })()
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, shippingInfo } = req.body;
    const { instance, keySecret } = getRazorpayInstance();
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', keySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // 1. Fetch order details to get transaction amount (converted to INR)
      const orderDetails = await instance.orders.fetch(razorpay_order_id);
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
        email: shippingInfo?.email || (req.user ? req.user.email : 'anonymous@freshfromfarms.shop'),
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

exports.createCodOrder = async (req, res) => {
  try {
    const { cartItems, shippingInfo, totalAmount } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart items are required.' });
    }

    // Save COD Order record in database
    const newOrder = await Order.create({
      user: req.user ? req.user._id : null,
      email: shippingInfo?.email || (req.user ? req.user.email : 'anonymous@freshfromfarms.shop'),
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
      totalAmount: totalAmount || 0,
      razorpayOrderId: `COD_${Date.now()}`,
      razorpayPaymentId: `COD_PAY_${Date.now()}`,
      status: 'Pending (COD)'
    });

    // Send invoice confirmation email
    try {
      const emailService = require('../services/emailService');
      emailService.sendOrderConfirmationEmail(newOrder);
      emailService.sendAdminNewOrderNotification(newOrder);
    } catch (err) {
      console.error('Error triggering COD order email notification:', err);
    }

    return res.json({ message: 'COD Order placed successfully!', orderId: newOrder._id });
  } catch (error) {
    console.error('Error placing COD order:', error);
    res.status(500).json({ message: 'Error creating COD order' });
  }
};
