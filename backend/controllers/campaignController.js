const axios = require('axios');

/**
 * Create a Brevo email campaign.
 * Expects the request body to contain:
 *   - name: campaign name
 *   - subject: email subject
 *   - senderName: name for the sender
 *   - senderEmail: email address for the sender
 *   - htmlContent: HTML string of the email body
 *   - listIds: array of Brevo list IDs to send to
 *   - scheduledAt (optional): ISO string or "YYYY-MM-DD HH:mm:ss" UTC time
 */
exports.createCampaign = async (req, res) => {
  const {
    name,
    subject,
    senderName,
    senderEmail,
    htmlContent,
    listIds,
    scheduledAt
  } = req.body;

  if (!process.env.BREVO_API_KEY) {
    return res.status(500).json({ message: 'BREVO_API_KEY not configured' });
  }

  const payload = {
    name,
    subject,
    sender: { name: senderName, email: senderEmail },
    type: 'classic',
    htmlContent,
    recipients: { listIds },
    ...(scheduledAt && { scheduledAt })
  };

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/emailCampaigns',
      payload,
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('📣 Brevo campaign created:', response.data);
    res.status(201).json({ message: 'Campaign created', data: response.data });
  } catch (err) {
    console.error('❌ Brevo campaign error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Brevo campaign creation failed', error: err.response?.data || err.message });
  }
};
