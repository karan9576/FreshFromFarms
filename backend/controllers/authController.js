const passport = require('passport');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const emailService = require('../services/emailService');

exports.googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
      }
      
      // Generate JWT session token for cross-domain mobile clients
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026',
        { expiresIn: '30d' }
      );
      
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-success?token=${token}`);
    });
  })(req, res, next);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect(process.env.FRONTEND_URL);
  });
};

exports.getCurrentUser = (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your orders' });
  }
};

exports.trackGuestOrder = async (req, res) => {
  try {
    const { orderId, email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required to track orders.' });
    }

    const emailRegex = new RegExp(`^${email.trim()}$`, 'i');

    // If orderId is provided, track that specific order
    if (orderId && orderId.trim()) {
      if (!mongoose.Types.ObjectId.isValid(orderId.trim())) {
        return res.status(400).json({ message: 'Invalid Order ID format. It must be a 24-character hex string.' });
      }

      const order = await Order.findOne({
        _id: orderId.trim(),
        email: emailRegex
      });

      if (!order) {
        return res.status(404).json({ message: 'No matching order found for this Order ID and email.' });
      }

      return res.json([order]); // Return as array for consistent frontend mapping
    }

    // If orderId is NOT provided, return all guest orders associated with this email
    const orders = await Order.find({ email: emailRegex }).sort({ createdAt: -1 });
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found associated with this email address.' });
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error tracking orders' });
  }
};

exports.register = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      // If user exists but is not verified, allow them to overwrite registration with new code
      if (!existingUser.isVerified) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        existingUser.displayName = displayName.trim();
        existingUser.password = hashedPassword;
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.verificationCode = verificationCode;
        existingUser.verificationCodeExpires = new Date(Date.now() + 3600000);
        
        await existingUser.save();
        await emailService.sendVerificationEmail(existingUser.email, existingUser.displayName, verificationCode);
        
        return res.status(201).json({
          message: 'Verification code resent to your email. Please verify to complete registration.',
          email: existingUser.email,
          requiresVerification: true
        });
      }
      return res.status(400).json({ message: 'A user with this email address already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour expiration

    // Create the user (unverified by default)
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(emailNormalized);

    const newUser = new User({
      displayName: displayName.trim(),
      email: emailNormalized,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
      isAdmin
    });

    await newUser.save();

    // Send verification email
    await emailService.sendVerificationEmail(newUser.email, newUser.displayName, verificationCode);

    res.status(201).json({
      message: 'Verification code sent to your email. Please verify to complete registration.',
      email: newUser.email,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering new user. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailNormalized = email.toLowerCase().trim();

    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if it is a Google-only account (no password set)
    if (!user.password) {
      return res.status(400).json({ message: 'This account is set up with Google Login. Please sign in with Google.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Sync isAdmin state dynamically from environment configurations
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email.toLowerCase());
    if (user.isAdmin !== isAdmin) {
      user.isAdmin = isAdmin;
      await user.save();
    }

    // Check if account is verified
    if (!user.isVerified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = new Date(Date.now() + 3600000);
      await user.save();

      await emailService.sendVerificationEmail(user.email, user.displayName, verificationCode);

      return res.status(403).json({
        message: 'Your email address is not verified. A new code has been sent to your inbox.',
        email: user.email,
        requiresVerification: true
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        picture: user.picture,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in. Please try again.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Set verified and sync admin status
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email.toLowerCase());
    
    user.isVerified = true;
    user.isAdmin = isAdmin;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Trigger welcome signup email asynchronously
    emailService.sendSignupEmail(user.email, user.displayName).catch(err => {
      console.error('Welcome email trigger failed:', err.message);
    });

    // Track signup stat
    try {
      const Stat = require('../models/Stat');
      const today = new Date().toISOString().split('T')[0];
      await Stat.findOneAndUpdate(
        { date: today },
        { $inc: { signups: 1 } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (statErr) {
      console.error('Stat update failed:', statErr.message);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'freshfromfarmssecret_key_2026',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Error verifying code. Please try again.' });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 3600000);
    await user.save();

    await emailService.sendVerificationEmail(user.email, user.displayName, verificationCode);

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Error resending verification code. Please try again.' });
  }
};

exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Trigger welcome subscription email containing the 10% discount coupon
    await emailService.sendNewsletterSignupEmail(emailNormalized);

    res.json({ message: 'Thank you! You have successfully subscribed. Check your inbox for your 10% discount code!' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ message: 'Error processing subscription. Please try again.' });
  }
};

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Trigger customer inquiry email notification to care.freshfromfarms@gmail.com
    await emailService.sendContactFormEmail(name.trim(), emailNormalized, phone ? phone.trim() : 'N/A', message.trim());

    res.json({ message: 'Thank you! Your message has been sent successfully. We will get back to you shortly.' });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Error sending your message. Please try again.' });
  }
};

const SYSTEM_PROMPT = `
You are the official AI Customer Support Assistant for "FreshFromFarms", a premium brand selling high-quality organic Makhana (Indian Foxnuts / Water Lily Seeds).
Respond politely, concisely, and helpfully based on the following verified information about FreshFromFarms:

1. Brand Overview:
   - "FreshFromFarms" sources premium, water-cultivated organic Makhana directly from the mineral-rich waters of Bihar, India.
   - It is a GI-tagged superfood, 100% natural, roasted to perfection, and 100% preservative-free (0% added additives).

2. Products and Collection:
   - Raw Makhana: Natural, unprocessed organic fox nuts. (Prices: 50g = ₹79, 100g = ₹139, 1kg = ₹899)
   - Salted Makhana: Lightly roasted with trace rock salt. (Prices: 50g = ₹89, 100g = ₹159, 1kg = ₹999)
   - Flavoured Makhana (Peri Peri, Mint, Cheese): Gourmet roasted fox nuts. (Prices: 50g = ₹99, 100g = ₹179, 1kg = ₹1099)

3. Promotional Offers:
   - Shipping: Free delivery on all orders above ₹499. For orders under ₹499, shipping charges apply.
   - First Order Discount: Use coupon code "FRESHSTART10" during checkout to get 10% OFF your first order.

4. Contact & Compliance Info:
   - FSSAI License Number: 20426121001137
   - GSTIN (GST Registration): 10ACJFA8885A1ZL
   - Support Email: care.freshfromfarms@gmail.com
   - Contact/WhatsApp Support: +91 9870415174 and +91 9576600246
   - Call Back SLA: We guarantee to respond to callback requests within 1 hour!

5. Checkout & Tracking:
   - Registered users can track orders in their customer dashboard.
   - Guest users can track orders on the "Track Orders" page by entering their email address.
   - Payment is securely handled online via Razorpay.

Guidelines:
- Keep answers under 3-4 sentences when possible.
- **Strict Grounding Rule**: You must ONLY answer questions using the verified facts provided above. Do not hallucinate, speculate, or use external knowledge to make assumptions about FreshFromFarms products, stock availability, shipping policies, returns, or operations.
- If the customer asks about something NOT explicitly detailed in the verified facts (e.g. customized bulk deals, refund timeframes, product details not listed), you MUST respond exactly: *"I apologize, but I do not have verified information regarding that query. Please submit a request on our Contact form or reach out to our team at care.freshfromfarms@gmail.com, and we will call you back within 1 hour."*
- If a user asks about something unrelated to the brand, gently redirect them back to FreshFromFarms.
- Use formatting (bullet points, bold text) to make your answers easy to scan.
`;

exports.chatWithAssistant = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Conversation history (messages) is required' });
    }

    const lastUserMessage = messages[messages.length - 1].text;

    // Fetch logged-in user's order details from MongoDB
    let ordersContext = "No orders found for this user.";
    if (req.user && req.user.email) {
      const Order = require('../models/Order');
      const orders = await Order.find({ email: req.user.email }).sort({ createdAt: -1 }).limit(5);
      if (orders && orders.length > 0) {
        ordersContext = orders.map((o, idx) => {
          return `Order #${idx + 1}:
- ID: ${o._id}
- Reference ID: ${o.orderId || 'N/A'}
- Status: ${o.status}
- Total Amount: ₹${o.totalAmount}
- Date: ${new Date(o.createdAt).toLocaleDateString()}
- Items: ${o.items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ')}`;
        }).join('\n\n');
      }
    }

    const userEmail = req.user ? req.user.email : 'Not Logged In';
    const dynamicPrompt = `${SYSTEM_PROMPT}

6. Current Logged-In User Information:
   - Email: ${userEmail}
   - Login Status: ${req.user ? 'Logged In' : 'Guest (Not Logged In)'}
   - User's Order History:
${ordersContext}

Instructions regarding User's Orders:
- If the user asks "where is my order", "status of my order", or "track my order", and they are logged in, directly reference their order status (e.g. "You have 1 active order #..., status is ...").
- If the user is NOT logged in and asks about order details, tell them to log in to their profile, or use the "Track Orders" link in the navbar to search for guest orders by entering their email address.
- Strictly do NOT disclose orders belonging to other emails. Only disclose orders present in the 'User's Order History' block above, which matches their logged-in email.
`;

    // 1. Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY) {
      const apiKeyClean = process.env.GEMINI_API_KEY.trim().replace(/^['"]|['"]$/g, '');
      if (apiKeyClean && apiKeyClean !== 'undefined' && apiKeyClean !== 'null') {
        try {
          const models = [
            'gemini-3.5-flash',
            'gemini-3-flash-preview',
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro'
          ];
          
          // Map messages format: user -> user, assistant -> model
          const contents = [
            {
              role: 'user',
              parts: [{ text: dynamicPrompt }]
            },
            {
              role: 'model',
              parts: [{ text: "Understood. I will answer customer queries and reference the specific order details of the current logged-in user strictly as instructed." }]
            }
          ];

          // Append historical messages (limit to last 6 messages to save context limits)
          const activeHistory = messages.slice(-6);
          activeHistory.forEach(msg => {
            contents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          });

          // Try models sequentially if we get a 404
          for (const model of models) {
            try {
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyClean}`;
              const geminiRes = await fetch(geminiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contents })
              });

              if (geminiRes.status === 404) {
                console.warn(`Model ${model} returned 404. Trying next model...`);
                continue;
              }

              if (!geminiRes.ok) {
                throw new Error(`Request failed with status code ${geminiRes.status}`);
              }

              const geminiData = await geminiRes.json();
              const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

              if (replyText) {
                return res.json({ text: replyText.trim() });
              }
            } catch (modelErr) {
              console.error(`Error with model ${model}:`, modelErr.message);
              if (modelErr.message.includes('404')) {
                continue;
              }
              throw modelErr;
            }
          }
        } catch (geminiErr) {
          console.error('Gemini API call failed, falling back to local search:', geminiErr.message);
        }
      }
    }

    // 2. Local smart keyword fallback engine
    const query = lastUserMessage.toLowerCase();
    let reply = "";

    if (query.includes('price') || query.includes('cost') || query.includes('rate') || query.includes('collect')) {
      reply = "Our Makhana collection includes:\n" +
              "• **Raw Makhana**: ₹79 (50g) | ₹139 (100g) | ₹899 (1kg)\n" +
              "• **Salted Makhana**: ₹89 (50g) | ₹159 (100g) | ₹999 (1kg)\n" +
              "• **Flavoured Makhana** (Peri Peri, Mint, Cheese): ₹99 (50g) | ₹179 (100g) | ₹1099 (1kg).\n" +
              "All our foxnuts are water-cultivated and preservative-free!";
    } else if (query.includes('coupon') || query.includes('discount') || query.includes('offer') || query.includes('promo')) {
      reply = "Yes! You can get **10% OFF** your first order by applying the coupon code **FRESHSTART10** during checkout. We also offer free delivery on orders above ₹499!";
    } else if (query.includes('shipping') || query.includes('delivery') || query.includes('charge')) {
      reply = "We offer **Free Shipping** on all orders above **₹499**. For orders below ₹499, delivery charges will be calculated during checkout.";
    } else if (query.includes('contact') || query.includes('phone') || query.includes('whatsapp') || query.includes('call') || query.includes('email')) {
      reply = "You can reach our support team here:\n" +
              "• 📞 **Phone/WhatsApp**: +91 9870415174 / +91 9576600246\n" +
              "• ✉️ **Email**: care.freshfromfarms@gmail.com\n" +
              "• ⚡ **Callback SLA**: Submit our contact form and we will call you back within **1 hour**!";
    } else if (query.includes('fssai') || query.includes('gst') || query.includes('licence') || query.includes('compliance')) {
      reply = "FreshFromFarms is fully compliant and registered:\n" +
              "• **FSSAI Licence No**: 20426121001137\n" +
              "• **GSTIN**: 10ACJFA8885A1ZL";
    } else if (query.includes('status') || query.includes('track') || query.includes('where is my order') || query.includes('my order')) {
      if (req.user && req.user.email) {
        const Order = require('../models/Order');
        const orders = await Order.find({ email: req.user.email }).sort({ createdAt: -1 }).limit(5);
        if (orders && orders.length > 0) {
          const orderLines = orders.map((o, idx) => {
            return `• **Order Reference ID**: ${o.orderId || o._id} | **Status**: ${o.status} | **Total**: ₹${o.totalAmount} | **Items**: ${o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}`;
          }).join('\n');
          reply = `Here is your recent order history for **${req.user.email}**:\n${orderLines}`;
        } else {
          reply = `You are logged in as **${req.user.email}**, but we could not find any order records matching your account email.`;
        }
      } else {
        reply = "To check your order information, please **Log In** to your account. If you checked out as a guest, please use the **Track Orders** page in the navigation bar to search for guest orders by entering your email address.";
      }
    } else if (query.includes('preservative') || query.includes('organic') || query.includes('natural') || query.includes('bihar')) {
      reply = "All FreshFromFarms foxnuts are harvested from the mineral-rich waters of Bihar, India. They are **100% organic**, water-cultivated, roasted to perfection, and **100% preservative-free** with no added chemicals.";
    } else {
      reply = "Hello! I am your Fresh Farm Assistant. I can help you with questions about our organic Makhana prices, delivery fees, order tracking, compliance, and custom bulk inquiries. Ask me anything!";
    }

    res.json({ text: reply });
  } catch (error) {
    console.error('Chatbot handler error:', error);
    res.status(500).json({ message: 'Error processing chat assistant request' });
  }
};
