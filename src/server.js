const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Initialize app
const app = express();

// Basic middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Routes
// Health check routes (for testing)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import and mount insecure routes
const insecureRouter = require('./routes/insecure');
app.use('/', insecureRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Insecure Blog running on http://localhost:${PORT}`);
  console.log('This branch is intentionally vulnerable. Do not deploy.');
});
