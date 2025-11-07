const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const helmet = require('helmet');
const csrf = require('csurf');

// Initialize app
const app = express();

// Basic middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// NEW SECURITY MIDDLEWARE 6/11/25
// Helmet helps secure Express apps by setting various HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, 
  })
);

// Secure session management for authenticated users
app.use(
  session({
    secret: 'super_secure_secret_key', // In production, store in environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,  // Prevents JavaScript access to cookies
      secure: false,   // Set true if using HTTPS
      sameSite: 'lax', // Helps protect against CSRF
    },
  })
);

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
// Health check routes (for testing)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ROUTE IMPORTS 
// Import and mount insecure routes
const insecureRouter = require('./routes/insecure');
app.use('/insecure', insecureRouter);

// Import and mount secure routes
const secureRouter = require('./routes/secure');
app.use('/secure', secureRouter);

// Root route provides navigation
app.get('/', (req, res) => {
  res.send(`
    <h2>Secure Blog Application</h2>
    <p><a href="/insecure">Visit Insecure Version</a></p>
    <p><a href="/secure">Visit Secure Version</a></p>
  `);
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Secure Blog App running on http://localhost:${PORT}`);
  console.log('Insecure and Secure routes are both available for testing.');
});
