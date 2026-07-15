const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js DNS resolver to use Google DNS.
// This bypasses local Windows/ISP router DNS lookup bottlenecks for Atlas SRV records.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('DNS server configuration failed, using default system DNS.');
}

const connectDB = async () => {
  try {
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freshfromfarms', {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Database Connection Warning: ${err.message}`);
    console.log('Backend is running, but database features will timeout/fail gracefully.');
  }
};

module.exports = connectDB;
