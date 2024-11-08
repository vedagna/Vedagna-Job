const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const connectDB = require('./config/db');
const User = require('./models/user');
const userRoutes = require('./routes/user'); // Use the MongoDB-based routes

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for parsing POST request bodies (for form data)
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Set the view engine to Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// Use the routes from the user.js file in the routes folder
app.use('/', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// Other routes...
app.get('/jobs', (req, res) => {
  res.render('jobs', { title: 'Jobs', user: req.session.user });
});
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.get('/success', (req, res) => {
  res.render('success', { title: 'Registration Successful' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Use MongoDB to find the user
  const user = await User.findOne({ username });
  if (!user) {
    return res.render('login', { title: 'Login', error: 'Invalid username' });
  }

  // Compare hashed passwords
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('login', { title: 'Login', error: 'Invalid password' });
  }

  // Store user information in session
  req.session.user = {
    username: user.username,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage // Store profile image in session
  };
  req.session.userId = user._id;

  // Redirect to homepage or dashboard
  res.redirect('/');
});


app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

app.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  // Fetch user data from MongoDB
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.redirect('/login');
  }

  res.render('profile', { title: 'User Profile', user: req.session.user });
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Directory to save uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as file name
  }
});

const upload = multer({ storage });

// Route to handle profile picture uploads
app.post('/upload-profile-pic', upload.single('profileImage'), async (req, res) => {
  if (req.file) {
    // Find the user in the database using their session user ID
    const user = await User.findById(req.session.userId);
    
    if (user) {
      user.profileImage = `/uploads/${req.file.filename}`; // Save relative path to user object
      await user.save(); // Save the updated user to MongoDB
      req.session.user.profileImage = user.profileImage; // Update session with new profile image
    }

    res.redirect('/profile'); // Redirect to profile page
  } else {
    res.redirect('/profile'); // Handle error case if no file was uploaded
  }
});

// Route to update the profile
app.post('/update-profile', async (req, res) => {
  const updatedData = req.body;

  // Find the user by ID
  const user = await User.findById(req.session.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Update the user fields based on the edited data
  Object.keys(updatedData).forEach(field => {
    if (updatedData[field]) {
      user[field] = updatedData[field];
    }
  });

  // Save the updated user back to MongoDB
  await user.save();

  // Update session data
  req.session.user = {
    ...req.session.user,
    ...updatedData
  };

  res.json({ success: true });
});


// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error logging out:", err);
      return res.redirect('/dashboard');
    }
    res.redirect('/');
  });
});

const axios = require('axios'); // Require Axios

// Route to fetch jobs from Adzuna API based on user input
app.get('/search-jobs', async (req, res) => {
  const { what = 'developer', where = 'london' } = req.query; // default search terms
  
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  
  try {
    // Construct API URL with query parameters
    const apiUrl = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&what=${what}&where=${where}`;
    
    // Fetch data from Adzuna API
    const response = await axios.get(apiUrl);
    const jobs = response.data.results; // Assuming results contain job data
    
    // Render the 'jobs' view with job data
    res.render('jobs', { title: 'Job Listings', jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).send('Error fetching job data');
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
