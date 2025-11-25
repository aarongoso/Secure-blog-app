const express = require('express'); 
const bcrypt = require('bcrypt'); // Used for password hashing
const db = require('../models/db');
const { body, validationResult } = require('express-validator'); // Used for input validation and sanitisation
const csrf = require('csurf'); // Protects against Cross Site Request Forgery attacks
const audit = require('../helpers/audit'); // Audit logging helper for monitoring security events

// .trim() removes unwanted whitespace before validation
// Prevents bypassing length checks and keeps user data consiistent
//.escape() sanitises user input for safe storage and rendering
const router = express.Router();
// All secure routes use secure layout and expose user + csrf to all views
router.use((req, res, next) => {
  res.locals.layout = "secure/layout"; 
  res.locals.currentUser = req.session.user; // Makes username appear in navbar
  next();
});
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
      if (err) {
        console.error("Database error:", err.message);
        audit.record(req.session?.user?.id, `Database error: ${err.message}`, req.ip);
        return res.status(500).send('Database error.');
      }

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
  res.render('secure/register', { 
    csrfToken: req.csrfToken(), 
    errors: [] 
  });
});

router.post(
  '/register',
  csrfProtection,
  [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }),
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If validation fails, re-render form
    if (!errors.isEmpty()) {
      return res.render('secure/register', {
        csrfToken: req.csrfToken(),
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // hash the password using bcrypt (adds salt and hashes securely)
    const hashed = bcrypt.hashSync(password, 10);

    // Insert new user using prepared statement
    const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
    db.run(sql, [username, email, hashed], (err) => {
      if (err) {
        console.error("Registration error:", err.message);
        audit.record(null, `Registration error for ${username}`, req.ip);
        return res.status(500).send('Registration error.');
      }

      audit.record(null, `New user registered: ${username}`, req.ip);
      console.info(`New user registered: ${username}`);

      res.redirect('/secure/login');
    });
  }
);

//--------- LOGIN -----------------
// Authenticates users securely using bcrypt password comparison
// prevents SQL injection via parameterised query
router.get('/login', csrfProtection, (req, res) => {
  res.render('secure/login', { 
    csrfToken: req.csrfToken(), 
    error: null 
  });
});

router.post('/login', csrfProtection, (req, res) => {
  const { username, password } = req.body;

  // Securely retrieve the user record
  const sql = 'SELECT user_id, username, password_hash FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error("Database error:", err.message);
      audit.record(null, `DB error during login for ${username}`, req.ip);
      return res.status(500).send('Database error.');
    }

    // Invalid login attempt
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      console.warn("Failed login attempt:", username);
      audit.record(null, `Failed login attempt for ${username}`, req.ip);

      return res.render('secure/login', {
        csrfToken: req.csrfToken(),
        error: 'Invalid credentials',
      });
    }

    // Success — createa session for the logged in user
    req.session.user = { id: user.user_id, username: user.username };

    console.info(`User logged in: ${user.username}`);
    audit.record(user.user_id, "User logged in", req.ip);

    res.redirect('/secure');
  });
});


//---------------- VIEW POST ---------------------
// Securely display an individual blog post
router.get('/post/:id', (req, res) => {
  const sql = `
    SELECT p.post_id, p.title, p.content, u.username, p.created_at
    FROM posts p
    JOIN users u ON p.user_id = u.user_id
    WHERE p.post_id = ?
  `;

  db.get(sql, [req.params.id], (err, post) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).send('Database error.');
    }

    if (!post) return res.status(404).send("Post not found");

    // Render safely escaped content
    res.render('secure/post', { post });
  });
});


//---------------- SEARCH ---------------------
// Secure search with fully qualified column names
router.get('/search', (req, res) => {
  const q = req.query.q || "";

  if (!q) {
    return res.render("secure/search", { q: "", results: [] });
  }

  const wildcard = `%${q}%`;

  const sql = `
    SELECT 
      posts.post_id, 
      posts.title, 
      users.username, 
      posts.created_at
    FROM posts
    JOIN users ON posts.user_id = users.user_id
    WHERE posts.title LIKE ? OR posts.content LIKE ?
  `;

  db.all(sql, [wildcard, wildcard], (err, results) => {
    if (err) {
      console.error("Search error:", err.message);
      return res.status(500).send("Search error.");
    }

    res.render("secure/search", { q, results });
  });
});


//---------------- CREATE POST ---------------------
// Uses parameterised SQL and input sanitisation to prevent SQLi and XSS
router.get('/create', csrfProtection, (req, res) => {
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
        console.error("Post creation error:", err.message);
        audit.record(userId, `Post creation error: ${err.message}`, req.ip);
        return res.status(500).send('Error creating post.');
      }
      console.info(`Post created by ${req.session.user.username}: ${title}`);
      audit.record(userId, `Created post titled: ${title}`, req.ip);
      res.redirect('/secure');
    });
  }
);

//----------------- LOGOUT ---------------
// This route handles situations where a logged-out user clicks "Logout".
// It does NOT destroy sessions (POST handles that securely with CSRF).
// It simply redirects to login with a friendly message.
router.get('/logout', (req, res) => {
  // If no session exists, user is already logged out
  if (!req.session.user) {
    return res.redirect('/secure/login?msg=loggedout');
  }

  // If user is logged in, do NOT destroy session here (only POST is allowed)
  return res.redirect('/secure/login?msg=loggedout');
});
// Logout MUST be POST (GET cannot securely carry CSRF tokens)
router.post('/logout', csrfProtection, (req, res) => {
  if (req.session.user) {
    console.info(`User logged out: ${req.session.user.username}`);
    audit.record(req.session.user.id, "User logged out", req.ip);
  }

  req.session.destroy(() => {
    res.redirect('/secure/login');
  });
});


module.exports = router;
