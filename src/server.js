 const express = require('express');
 const path = require('path');

 const app = express();

 // basic middleware
 app.use(express.urlencoded({ extended: true }));
 app.use(express.json());

 // view engine placeholder
 app.set('view engine', 'ejs');
 app.set('views', path.join(__dirname, 'views'));

 // health route
 app.get('/', (req, res) => {
   res.send('Secure Blog App - setup OK');
 });

 // example API route
 app.get('/api/health', (req, res) => {
   res.json({ status: 'ok', timestamp: new Date().toISOString() });
 });

 const PORT = process.env.PORT || 3000;
 app.listen(PORT, () => {
   console.log(`Secure Blog App running on http://localhost:${PORT}`);
 });
