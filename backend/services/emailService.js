const axios = require('axios');
const nodemailer = require('nodemailer');

const sendMailHelper = async (mailOptions) => {
  let brevoSent = false;
  const cleanApiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;

  // PRIMARY: Brevo REST API via axios (works on Render free tier — no SMTP needed)
  if (cleanApiKey) {
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            name: 'FreshFromFarms',
            email: process.env.SENDER_EMAIL || process.env.SMTP_USER || 'care.freshfromfarms@gmail.com'
          },
          to: [{ email: mailOptions.to }],
          subject: mailOptions.subject,
          htmlContent: mailOptions.html
        },
        {
          headers: {
            'api-key': cleanApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`📧 Email sent via Brevo to: ${mailOptions.to}`);
      brevoSent = true;
    } catch (err) {
      console.error('❌ Brevo send failed, trying SMTP fallback... Error:', err.response?.data || err.message);
    }
  }

  if (brevoSent) return;

  // FALLBACK: Nodemailer SMTP (for local development or if Brevo API fails)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        connectionTimeout: 10000, // Fail fast (10s) if blocked by cloud IP restrictions
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
      const info = await transporter.sendMail({
        from: `"FreshFromFarms" <${process.env.SMTP_USER}>`,
        ...mailOptions
      });
      console.log(`📧 Email sent via SMTP to: ${mailOptions.to} | ID: ${info.messageId}`);
    } catch (err) {
      console.error('❌ SMTP email failed:', err.message);
    }
    return;
  }

  console.warn('[Email] No email provider configured or succeeded (set BREVO_API_KEY or SMTP parameters correctly).');
};

exports.sendSignupEmail = async (userEmail, displayName) => {
  const storeUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const mailOptions = {
    to: userEmail,
    subject: 'Welcome to FreshFromFarms! 🍿',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f9f7; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e0eae0;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0c3823; font-size: 28px; font-weight: 800; margin: 0;">FreshFromFarms</h1>
          <p style="color: #cf5c36; font-size: 14px; font-weight: 700; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 1px;">Mithila's Finest Foxnuts</p>
        </div>

        <!-- Body -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(12, 56, 35, 0.04); border: 1px solid #edf2ed;">
          <h2 style="color: #0c3823; font-size: 20px; font-weight: 700; margin-top: 0;">Welcome, ${displayName}!</h2>
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
            Thank you for signing up to FreshFromFarms! We specialize in sourcing the highest grade water-cultivated lotus seeds (Makhana) straight from our local water fields.
          </p>
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            Roasting them oil-free with curated spices, we bring you the ultimate healthy superfood crunch in five delicious flavours: 
            <strong>Raw</strong>, <strong>Classic Sea Salt</strong>, <strong>Fiery Peri Peri</strong>, <strong>Cheese & Herbs</strong>, and <strong>Mint & Lime</strong>.
          </p>

          <!-- Button -->
          <div style="text-align: center; margin-bottom: 10px;">
            <a href="${storeUrl}" style="background-color: #0c3823; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(12, 56, 35, 0.25);">
              Explore the Shop
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #7f8c8d;">
          <p style="margin: 0 0 5px;">© 2026 FreshFromFarms. All rights reserved.</p>
          <p style="margin: 0;">Bihar, India | Sustainable Water Cultivation</p>
        </div>
      </div>
    `
  };

  // Run asynchronously
  sendMailHelper(mailOptions);
};

exports.sendOrderConfirmationEmail = async (order) => {
  const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-orders`;
  
  const itemsRows = order.items.map(item => `
    <tr style="border-bottom: 1px solid #edf2ed; font-size: 14px;">
      <td style="padding: 12px 8px; color: #2c3e50;">${item.name} (${item.weight})</td>
      <td style="padding: 12px 8px; text-align: center; color: #2c3e50;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #0c3823; font-weight: 600;">₹${item.price * item.quantity}</td>
    </tr>
  `).join('');

  const mailOptions = {
    to: order.email,
    subject: `Order Placed Successfully! - #${order._id.toString().substring(18).toUpperCase()}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f9f7; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e0eae0;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0c3823; font-size: 28px; font-weight: 800; margin: 0;">FreshFromFarms</h1>
          <p style="color: #40916c; font-size: 14px; font-weight: 700; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 1px;">Order Invoice Confirmation</p>
        </div>

        <!-- Body -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(12, 56, 35, 0.04); border: 1px solid #edf2ed;">
          <h2 style="color: #0c3823; font-size: 18px; font-weight: 700; margin-top: 0; border-bottom: 2px solid #edf2ed; padding-bottom: 10px;">Order Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Order ID:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #2c3e50; font-size: 14px; text-align: right;">${order._id.toString().toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Date Placed:</td>
                <td style="padding: 6px 0; color: #2c3e50; font-size: 14px; text-align: right;">${new Date(order.createdAt).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Transaction ID:</td>
                <td style="padding: 6px 0; font-family: monospace; color: #2c3e50; font-size: 13px; text-align: right;">${order.razorpayPaymentId}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="color: #0c3823; font-size: 15px; font-weight: 700; margin-top: 0; margin-bottom: 10px;">Items Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #edf2ed; font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr>
                <td colspan="2" style="padding: 15px 8px 0; font-weight: 700; color: #2c3e50; font-size: 16px;">Total Paid:</td>
                <td style="padding: 15px 8px 0; font-weight: 800; color: #0c3823; font-size: 18px; text-align: right;">₹${order.totalAmount}</td>
              </tr>
            </tbody>
          </table>

          <!-- Shipping -->
          <h3 style="color: #0c3823; font-size: 15px; font-weight: 700; border-top: 1px solid #edf2ed; padding-top: 15px; margin-top: 15px; margin-bottom: 10px;">Delivery Coordinates</h3>
          <p style="color: #2c3e50; font-size: 14px; line-height: 1.5; margin: 0 0 25px;">
            <strong>Mobile Contact:</strong> ${order.phone}<br/>
            <strong>Address Line 1:</strong> ${order.addressLine1}<br/>
            ${order.addressLine2 ? `<strong>Address Line 2:</strong> ${order.addressLine2}<br/>` : ''}
            <strong>Location:</strong> ${order.city}, ${order.state} - <strong>${order.pincode}</strong>
          </p>

          <!-- Button -->
          <div style="text-align: center; margin-bottom: 10px;">
            <a href="${trackingUrl}" style="background-color: #0c3823; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(12, 56, 35, 0.255);">
              Track Fulfillment Journey
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #7f8c8d;">
          <p style="margin: 0 0 5px;">© 2026 FreshFromFarms. All rights reserved.</p>
          <p style="margin: 0;">Bihar, India | Sustainable Water Cultivation</p>
        </div>
      </div>
    `
  };

  // Run asynchronously
  sendMailHelper(mailOptions);
};

exports.sendAdminNewOrderNotification = async (order) => {
  const adminEmails = process.env.ADMIN_EMAIL;
  if (!adminEmails) {
    console.warn('No ADMIN_EMAIL environment variable found. Admin notification email skipped.');
    return;
  }

  const adminDashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin`;
  
  const itemsRows = order.items.map(item => `
    <tr style="border-bottom: 1px solid #edf2ed; font-size: 14px;">
      <td style="padding: 12px 8px; color: #2c3e50;">${item.name} (${item.weight})</td>
      <td style="padding: 12px 8px; text-align: center; color: #2c3e50;">${item.quantity}</td>
    </tr>
  `).join('');

  const mailOptions = {
    to: adminEmails,
    subject: `🚨 [Action Required] New Order Placed - #${order._id.toString().substring(18).toUpperCase()}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f9f7; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e0eae0;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0c3823; font-size: 28px; font-weight: 800; margin: 0;">FreshFromFarms</h1>
          <p style="color: #d63031; font-size: 14px; font-weight: 700; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 1px;">Admin Notification</p>
        </div>

        <!-- Body -->
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(12, 56, 35, 0.04); border: 1px solid #edf2ed;">
          <h2 style="color: #d63031; font-size: 18px; font-weight: 700; margin-top: 0; border-bottom: 2px solid #edf2ed; padding-bottom: 10px;">New Order to Pack & Ship</h2>
          <p style="color: #2c3e50; font-size: 15px; line-height: 1.6; margin: 15px 0;">
            A new payment has been successfully processed. Please fulfill this order as soon as possible.
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Order ID:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #2c3e50; font-size: 14px; text-align: right;">${order._id.toString().toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Buyer Email:</td>
                <td style="padding: 6px 0; color: #2c3e50; font-size: 14px; text-align: right;">${order.email}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="color: #0c3823; font-size: 15px; font-weight: 700; margin-top: 0; margin-bottom: 10px;">Items to Pack</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #edf2ed; font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Shipping Details -->
          <h3 style="color: #0c3823; font-size: 15px; font-weight: 700; border-top: 1px solid #edf2ed; padding-top: 15px; margin-top: 15px; margin-bottom: 10px;">Shipping Details</h3>
          <p style="color: #2c3e50; font-size: 14px; line-height: 1.5; margin: 0 0 25px;">
            <strong>Mobile Contact:</strong> ${order.phone}<br/>
            <strong>Address Line 1:</strong> ${order.addressLine1}<br/>
            ${order.addressLine2 ? `<strong>Address Line 2:</strong> ${order.addressLine2}<br/>` : ''}
            <strong>Location:</strong> ${order.city}, ${order.state} - <strong>${order.pincode}</strong>
          </p>

          <!-- Button -->
          <div style="text-align: center; margin-bottom: 10px;">
            <a href="${adminDashboardUrl}" style="background-color: #d63031; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(214, 48, 49, 0.25);">
              Manage Orders in Admin Panel
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #7f8c8d;">
          <p style="margin: 0 0 5px;">© 2026 FreshFromFarms. All rights reserved.</p>
        </div>
      </div>
    `
  };

  sendMailHelper(mailOptions);
};

exports.sendVerificationEmail = async (userEmail, displayName, verificationCode) => {
  const mailOptions = {
    to: userEmail,
    subject: 'Verify Your Email Address - FreshFromFarms 🔑',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f9f7; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e0eae0;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0c3823; font-size: 28px; font-weight: 800; margin: 0;">FreshFromFarms</h1>
          <p style="color: #cf5c36; font-size: 14px; font-weight: 700; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 1px;">Mithila's Finest Foxnuts</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(12, 56, 35, 0.04); border: 1px solid #edf2ed; text-align: center;">
          <h2 style="color: #0c3823; font-size: 20px; font-weight: 700; margin-top: 0;">Verify your email, ${displayName}!</h2>
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            Thank you for starting your signup. Please use the verification code below to confirm your email and log in to your account.
          </p>

          <div style="background-color: rgba(12, 56, 35, 0.04); padding: 15px; border-radius: 8px; font-size: 32px; font-weight: 800; color: #0c3823; letter-spacing: 5px; margin: 20px auto; max-width: 200px; border: 1px solid rgba(12, 56, 35, 0.08); text-transform: uppercase;">
            ${verificationCode}
          </div>

          <p style="color: #7f8c8d; font-size: 13px; margin-top: 25px;">
            This code will expire in 1 hour. If you didn't request this code, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #7f8c8d;">
          <p style="margin: 0 0 5px;">© 2026 FreshFromFarms. All rights reserved.</p>
        </div>
      </div>
    `
  };

  sendMailHelper(mailOptions);
};

exports.sendNewsletterSignupEmail = async (userEmail) => {
  const mailOptions = {
    to: userEmail,
    subject: 'Your 10% Discount Code is Here! 🍿 - FreshFromFarms',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f9f7; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e0eae0;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0c3823; font-size: 28px; font-weight: 800; margin: 0;">FreshFromFarms</h1>
          <p style="color: #cf5c36; font-size: 14px; font-weight: 700; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 1px;">Mithila's Finest Foxnuts</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(12, 56, 35, 0.04); border: 1px solid #edf2ed; text-align: center;">
          <h2 style="color: #0c3823; font-size: 20px; font-weight: 700; margin-top: 0;">Welcome to the Fresh Farm!</h2>
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
            Thank you for subscribing to our newsletter! Enjoy 10% off your first order of premium water-cultivated organic Makhana (Indian Fox Nuts).
          </p>

          <div style="background-color: rgba(207, 92, 54, 0.08); padding: 15px; border-radius: 8px; font-size: 24px; font-weight: 800; color: #cf5c36; letter-spacing: 2px; margin: 20px auto; max-width: 250px; border: 1px solid rgba(207, 92, 54, 0.15); text-transform: uppercase;">
            FRESHSTART10
          </div>

          <p style="color: #7f8c8d; font-size: 13px; margin-top: 25px;">
            Simply enter this discount code during checkout to redeem your 10% off.
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #7f8c8d;">
          <p style="margin: 0 0 5px;">© 2026 FreshFromFarms. All rights reserved.</p>
        </div>
      </div>
    `
  };

  sendMailHelper(mailOptions);
};

exports.sendContactFormEmail = async (name, email, message) => {
  const mailOptions = {
    to: 'care.freshfromfarms@gmail.com',
    subject: `New Contact Form Query from ${name} 🔑`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f9f7; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e0eae0;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #0c3823; font-size: 28px; font-weight: 800; margin: 0;">FreshFromFarms</h1>
          <p style="color: #cf5c36; font-size: 14px; font-weight: 700; margin: 5px 0 0; text-transform: uppercase; letter-spacing: 1px;">Customer Inquiry</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(12, 56, 35, 0.04); border: 1px solid #edf2ed;">
          <h2 style="color: #0c3823; font-size: 18px; font-weight: 700; margin-top: 0; border-bottom: 2px solid #edf2ed; padding-bottom: 10px;">Inquiry Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px; width: 120px;">Customer Name:</td>
                <td style="padding: 6px 0; font-weight: 700; color: #2c3e50; font-size: 14px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Customer Email:</td>
                <td style="padding: 6px 0; color: #cf5c36; font-weight: 600; font-size: 14px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #7f8c8d; font-size: 14px;">Received Date:</td>
                <td style="padding: 6px 0; color: #2c3e50; font-size: 14px;">${new Date().toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="color: #0c3823; font-size: 15px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; border-top: 1px solid #edf2ed; padding-top: 15px;">Customer Message:</h3>
          <div style="background-color: #f9fbf9; padding: 15px; border-radius: 8px; border: 1px solid #edf2ed; color: #2c3e50; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
            ${message}
          </div>
        </div>

        <div style="text-align: center; margin-top: 25px; font-size: 12px; color: #7f8c8d;">
          <p style="margin: 0 0 5px;">© 2026 FreshFromFarms. All rights reserved.</p>
        </div>
      </div>
    `
  };

  sendMailHelper(mailOptions);
};
