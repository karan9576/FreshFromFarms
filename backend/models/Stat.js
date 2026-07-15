const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  visits: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 }
});

module.exports = mongoose.model('Stat', statSchema);
