const { Resend } = require('resend');

// Keep track of Ethereal test accounts to avoid creating them repeatedly on every email send
let testTransporter = null;

const sendMailHelper = async (mailOptions) => {
  // 1. Use Resend API if key is configured (works on Render free tier - HTTP, not SMTP)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: 'FreshFromFarms <onboarding@resend.dev>',
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      if (error) {
        console.error('❌ Resend API error:', error);
        return;
      }
      console.log(`📧 Email sent via Resend to: ${mailOptions.to} | ID: ${data.id}`);
      return;
    } catch (err) {
      console.error('❌ Resend send failed:', err.message);
      return;
    }
  }

  // 2. Fall back to Nodemailer SMTP (for local dev with Gmail)
  const nodemailer = require('nodemailer');
  if (process.env.SMTP_HOST) {
    try {
      console.log(`[Email] Using SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        tls: { rejectUnauthorized: false }
      });
      const info = await transporter.sendMail({
        from: `"FreshFromFarms Support" <${process.env.SMTP_USER}>`,
        ...mailOptions
      });
      console.log(`📧 Email sent via SMTP to: ${mailOptions.to} | ID: ${info.messageId}`);
      return;
    } catch (error) {
      console.error('❌ SMTP Error:', error.message, '| Code:', error.code);
      return;
    }
  }

  // 3. Fall back to Ethereal mock for testing
  try {
    if (!testTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      console.log('--- Ethereal Test Account ---', testAccount.user);
      testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }
    const info = await testTransporter.sendMail({
      from: '"FreshFromFarms Support" <noreply@freshfromfarms.com>',
      ...mailOptions
    });
    console.log(`📧 Ethereal test email: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error('❌ Ethereal Error:', error.message);
  }
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
