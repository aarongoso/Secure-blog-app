const express = require('express');
const bcrypt = require('bcrypt'); // Used for password hashing
const db = require('../models/db');
const { body, validationResult } = require('express-validator'); // Used for input validation and sanitisation
const csrf = require('csurf'); // Protects against Cross Site Request Forgery attacks


// .trim() removes unwanted whitespace before validation
// Prevents bypassing length checks and keeps user data consiistent
//.escape() sanitises user input for safe storage and rendering
const router = express.Router();
// Initialise CSRF protection middleware, tokens will be generated per form
const csrfProtection = csrf({ cookie: true });

//----- HOME -------
// Displays all blog posts using parameterised queries to prevent SQL injection
router.get('/', (req, res) => {
  db.all(
    `SELECT p.post_id, p.title, p.content, u.username, p.created_at
     FROM posts p
     JOIN users u ON p.user_id = u.user_id
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).send('Database error.');
      // Renders posts using EJS with automatic escaping to prevent XSS
      res.render('secure/index', { posts: rows });
    }
  );
});

//------- REGISTER -----------
// Includes input validation, sanitisation, and bcrypt password hashing
// CSRF protection is used to prevent forged form submissions
router.get('/register', csrfProtection, (req, res) => {
  // Renders registration form with CSRF token and empty errors list
  res.render('secure/register', { csrfToken: req.csrfToken(), errors: [] });
});

router.post(
  '/register',
  csrfProtection,
  [
    // Validate and sanitise user input
    body('username').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }),
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If validation fails, re-render form with error messages
    if (!errors.isEmpty()) {
      return res.render('secure/register', {
        csrfToken: req.csrfToken(),
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // hash the password using bcrypt (adds salt and hashes securely)
    const hashed = bcrypt.hashSync(password, 10);

    // Use parameterised query to prevent SQL injection
    const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
    db.run(sql, [username, email, hashed], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Registration error.');
      }
      res.redirect('/secure/login');
    });
  }
);

//--------- LOGIN -----------------
// Authenticates users securely using bcrypt password comparison
// prevents SQL injection via parameterised query
router.get('/login', csrfProtection, (req, res) => {
  res.render('secure/login', { csrfToken: req.csrfToken(), error: null });
});

router.post('/login', csrfProtection, (req, res) => {
  const { username, password } = req.body;

  // Securely retrieve the user record
  const sql = 'SELECT user_id, username, password_hash FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error.');
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.render('secure/login', {
        csrfToken: req.csrfToken(),
        error: 'Invalid credentials',
      });
    }

    // Create session for the logged in user
    req.session.user = { id: user.user_id, username: user.username };
    res.redirect('/secure');
  });
});

//-------------------- CREATE POST -----------------
// Uses parameterised SQL and input sanitisation to prevent SQLi and XSS
router.get('/create', csrfProtection, (req, res) => {
  // Only logged in users can access the form
  if (!req.session.user) return res.redirect('/secure/login');

  res.render('secure/create', {
    csrfToken: req.csrfToken(),
    user: req.session.user,
  });
});

router.post(
  '/create',
  csrfProtection,
  [
    // Validate and sanitise title and content
    body('title').trim().escape(),
    body('content').trim().escape(),
  ],
  (req, res) => {
    if (!req.session.user) return res.redirect('/secure/login');

    const { title, content } = req.body;
    const userId = req.session.user.id;

    // Insert post securely using prepared statement
    const sql = 'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)';
    db.run(sql, [userId, title, content], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error creating post.');
      }
      res.redirect('/secure');
    });
  }
);

//----------------- LOGOUT ---------------
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/secure/login');
  });
});


module.exports = router;
