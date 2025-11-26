const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Home: list posts
router.get('/', (req, res) => {
  db.all('SELECT p.post_id, p.title, p.content, u.username, p.created_at FROM posts p JOIN users u ON p.user_id = u.user_id ORDER BY p.created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).send('DB error: ' + err.message); // intentional sensitive message
    res.render('insecure/index', { posts: rows });
  });
});

// View a single post (shows stored XSS because content is rendered unescaped)
router.get('/post/:id', (req, res) => {
  const id = req.params.id;
  // vulnerable: no parameter binding
  db.get(`SELECT p.post_id, p.title, p.content, u.username, p.created_at FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.post_id = ${id}`, [], (err, row) => {
    if (err) return res.status(500).send('DB error: ' + err.message); // show SQL errors
    if (!row) return res.status(404).send('Post not found');
    res.render('insecure/post', { post: row });
  });
});

// Create post form
router.get('/create', (req, res) => {
  res.render('insecure/create');
});

// Create post (vulnerable to stored XSS and SQL injection if user_id uses input)
router.post('/create', (req, res) => {
  const { username, title, content } = req.body;

  // find user_id by username (and vulnerable if username contains SQL)
  db.get(`SELECT user_id FROM users WHERE username = '${username}'`, [], (err, user) => {
    if (err) return res.status(500).send('DB error: ' + err.message);
    if (!user) return res.status(400).send('Unknown user - create a valid username first.');
    const userId = user.user_id;
    // vulnerable insertion (string concatenation)
    const sql = `INSERT INTO posts (user_id, title, content) VALUES (${userId}, '${title}', '${content}')`;
    db.run(sql, function(err) {
      if (err) return res.status(500).send('DB error: ' + err.message);
      res.redirect('/');
    });
  });
});

// Simple registration (insecure: stores password as plain text)
router.get('/register', (req, res) => {
  res.render('insecure/register');
});

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  // vulnerable: no validation or hashing
  const sql = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`;
  db.run(sql, function(err) {
    if (err) return res.status(500).send('DB error: ' + err.message);
    res.redirect('/');
  });
});

// Insecure login (vulnerable to SQL injection)
router.get('/login', (req, res) => {
  res.render('insecure/login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // vulnerable query - SQL injection possible
  const sql = `SELECT user_id, username FROM users WHERE username = '${username}' AND password = '${password}'`;
  db.get(sql, [], (err, user) => {
    if (err) return res.status(500).send('DB error: ' + err.message);
    if (!user) return res.status(401).send('Invalid credentials');
    // naive session: set cookie value (insecure)
    res.cookie('user', user.username, { httpOnly: false }); // httpOnly false intentionally
    res.redirect('/');
  });
});

// Reflected XSS demo - echoes query param into page unsafely
router.get('/search', (req, res) => {
  const q = req.query.q || '';
  // this page simply reflects the q parameter (reflected XSS)
  res.render('insecure/search', { q });
});

// Debug route - sensitive data exposure: dumps all users and posts (local only)
router.get('/debug/db', (req, res) => {
  db.all('SELECT * FROM users', [], (err, users) => {
    if (err) return res.status(500).send('DB error: ' + err.message);
    db.all('SELECT * FROM posts', [], (err2, posts) => {
      if (err2) return res.status(500).send('DB error: ' + err2.message);
      res.send({ users, posts }); // sensitive exposure
    });
  });
});

module.exports = router;
