// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const bcrypt = require('bcrypt');
// const router = express.Router();

// // Path to the user.json file
// const usersFilePath = path.join(__dirname, '../data/users.json');

// // Login route
// router.post('/login', (req, res, next) => {
//     const { email, password } = req.body;

//     // Read the existing users from users.json
//     fs.readFile(usersFilePath, 'utf-8', (err, data) => {
//         if (err) {
//             return next(new Error('Error reading user data')); // Forward to error-handling middleware
//         }

//         let users = [];
//         if (data) {
//             try {
//                 users = JSON.parse(data); // Parse existing users
//             } catch (parseErr) {
//                 return next(new Error('Error parsing user data')); // Handle JSON parsing errors
//             }
//         }

//         // Find user by email
//         const user = users.find(user => user.email === email);

//         // Check if user exists
//         if (!user) {
//             return res.status(401).render('login', { errorMessage: 'Invalid user' });
//         }

//         // Check if password matches using bcrypt
//         bcrypt.compare(password, user.password, (err, match) => {
//             if (err) {
//                 return next(err); // Forward to error-handling middleware
//             }
//             if (!match) {
//                 return res.status(401).render('login', { errorMessage: 'Invalid password' });
//             }

//             // Store user information in session
//             req.session.userId = user.email; // You can store user ID or email
//             req.session.user = user;

//             // Redirect to the dashboard
//             return res.redirect('dashboard');
//         });
//     });
// });

// // Dashboard route
// router.get('/dashboard', (req, res) => {
//     // Check if user is authenticated
//     if (!req.session.userId) {
//         return res.redirect('/login'); // Redirect to login if not authenticated
//     }

//     res.render('dashboard', { user: req.session.user });
// });

// // Profile route
// router.get('/profile', (req, res) => {
//     // Check if user is authenticated
//     if (!req.session.userId) {
//         return res.redirect('/login'); // Redirect to login if not authenticated
//     }

//     res.render('profile', { user: req.session.user });
// });

// // Logout route
// router.get('/logout', (req, res) => {
//     // Destroy the session
//     req.session.destroy(err => {
//         if (err) {
//             return res.status(500).send("Could not log out. Please try again.");
//         }

//         // Redirect to login page or home page after logout
//         res.redirect('login');
//     });
// });

// module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user'); // Import the MongoDB User model

// Registration route
router.post('/register', async (req, res) => {
  try {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).render('register', { errorMessage: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user instance
    const newUser = new User({
      username: req.body.username, // Add this line
      email: req.body.email,
      password: hashedPassword, // Storing the hashed password
      name:req.body.name,
      phone:req.body.phone,
      dob:req.body.dob,
      status:req.body.status

    });

    // Save the user to MongoDB
    await newUser.save();

    // Redirect to login after successful registration
    res.redirect('/success');
  } catch (err) {
    console.error('Error during registration:', err);
    return res.status(500).render('register', { errorMessage: 'Registration failed, please try again' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).render('login', { errorMessage: 'Invalid email or password' });
    }

    // Compare passwords using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', { errorMessage: 'Invalid email or password' });
    }

    // Store user information in the session
    req.session.user = user;
    req.session.userId = user._id;

    // Redirect to dashboard after login
    // res.redirect('/dashboard');
    res.redirect('/profile');
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).render('login', { errorMessage: 'Login failed, please try again' });
  }
});

module.exports = router;
