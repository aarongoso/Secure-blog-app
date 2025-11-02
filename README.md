# Secure Blog Application (Node.js / Express / SQLite3)

Purpose: A small blog application implemented in Node.js/Express with two branches:
- `insecure` — intentionally vulnerable implementation for SQLi, XSS, and Sensitive Data Exposure demonstration.
- `secure` — mitigated implementation with prepared statements, encoding, CSRF protection, secure session management, logging/monitoring.

## Local setup (dev)
```bash
npm install
npm run dev
