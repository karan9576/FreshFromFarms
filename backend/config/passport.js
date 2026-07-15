const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Stat = require('../models/Stat');

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(email => email.trim().toLowerCase());
          const userEmail = profile.emails[0].value.trim().toLowerCase();
          const isAdmin = adminEmails.includes(userEmail);

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update admin access status dynamically
            if (user.isAdmin !== isAdmin) {
              user.isAdmin = isAdmin;
              await user.save();
            }
            done(null, user);
          } else {
            const newUser = {
              googleId: profile.id,
              displayName: profile.displayName,
              email: profile.emails[0].value,
              picture: profile.photos[0].value,
              isAdmin,
            };
            user = await User.create(newUser);

            // Send welcome email notification
            try {
              const emailService = require('../services/emailService');
              emailService.sendSignupEmail(user.email, user.displayName);
            } catch (err) {
              console.error('Error triggering signup email notification:', err);
            }
            
            // Track signup
            const today = new Date().toISOString().split('T')[0];
            await Stat.findOneAndUpdate(
              { date: today },
              { $inc: { signups: 1 } },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            done(null, user);
          }
        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
