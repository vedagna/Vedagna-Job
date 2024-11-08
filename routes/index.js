const express = require('express');
const router = express.Router();

// Get the registration success page
router.get('/success', (req, res) => {
  res.render('success'); // renders the success.pug file
});
// In your routes/index.js file or a similar routes file
router.get('/jobs', (req, res) => {
  res.render('jobs'); // Renders a Pug template named 'jobs.pug' (in the 'views' folder)
});
// In your routes/index.js file or a similar routes file
router.get('/register', (req, res) => {
  res.render('register'); // Renders a Pug template named 'jobs.pug' (in the 'views' folder)
});
// In your routes/index.js file or a similar routes file
router.get('/login', (req, res) => {
  res.render('login'); // Renders a Pug template named 'jobs.pug' (in the 'views' folder)
});

// Get the dashboard page after login
router.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) { // assuming you're using passport for authentication
    res.render('dashboard'); // renders the dashboard.pug file
  } else {
    res.redirect('/login');
  }
});

module.exports = router;
