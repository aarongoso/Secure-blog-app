# Secure Blog Application (Node.js / Express / SQLite)

This repository contains two versions of the same blog application:  
an intentionally insecure implementation and a secure, hardened version.  
The purpose is to demonstrate common web vulnerabilities, show how they can be exploited,  
and demonstrate how secure coding practices mitigate those issues.

---

## Core Features

- User registration & login (session-based authentication)
- Create, view, edit and delete blog posts
- Search functionality
- Input validation (secure version)
- Audit logging (secure version)
- Prepared SQL statements (secure version)
- Secure session/cookie handling (secure version)

---

## Summary of Vulnerabilities in `insecure`

The insecure version contains multiple intentional weaknesses, including:

- **SQL Injection (SQLi)** — unvalidated user input in search, login, and post creation queries.  
- **Cross-Site Scripting (XSS)** — user content displayed without output encoding.  
- **Weak Session / Cookie Handling** — missing flags and no hardening.  
- **No Input Validation** — user-submitted content stored directly.  
- **Authentication Weaknesses** — login form vulnerable to SQL injection and weak password logic.  
- **No Audit Logging** — no tracking of suspicious actions.  

These vulnerabilities can be tested directly when running the insecure version.

---

## Security Mitigations in `secure`

The secure branch improves the application through multiple defences:

- **Parameterized SQL queries** (SQLite prepared statements)
- **Input validation & sanitisation**
- **Output encoding in EJS views** to prevent reflected/stored XSS
- **Proper password hashing** using bcrypt
- **Secure session handling** with `HttpOnly`, `SameSite`, and other recommended flags
- **Audit logging** for sensitive actions (login failures, post creation, etc.)
- **Improved route access control** to prevent unauthorized access

---
## Testing the Application (Insecure vs Secure Versions)

The following steps demonstrate how to test the major vulnerabilities in both the insecure and secure versions of the application.  
You will enter the same inputs for both versions — the difference is in how each version responds.

---

## Important Note When Testing

Before performing each test, make sure you are running the correct version:

- **Use the insecure version** = vulnerabilities should EXECUTE  
- **Use the secure version** = vulnerabilities should be BLOCKED  

Clone the repository:

```
git clone https://github.com/aarongoso/Secure-blog-app.git
cd Secure-blog-app
```

Switch to the version you want to test:

```
git checkout insecure
git checkout secure
```

Install dependencies and start the application:

```
npm install
node src/server.js
```

The app runs at:
```
http://localhost:3000
```

You can confirm which version is active by checking the interface header.

---
## 1. SQL Injection (SQLi)

### 1.1 Login SQL Injection
**Test Input:**  
' OR '1'='1

**Insecure:**  
Login succeeds because the query is built using string concatenation.

**Secure:**  
Login fails because the prepared SQL statement blocks the injection.

---

### 1.2 Search SQL Injection
**Test Input:**  
%' OR 'a'='a

**Insecure:**  
Search returns unintended posts because the SQL query is manipulated.

**Secure:**  
Search behaves normally and ignores the malicious input.

---

## 2. Cross-Site Scripting (XSS)

### 2.1 Stored XSS
**Payload:**  
<script>alert("XSS")</script>

**Insecure:**  
The alert executes when viewing the post or comment.

**Secure:**  
The payload is escaped and displayed as text with no execution.

---

### 2.2 Reflected XSS
**Payload:**  
<script>alert("XSS")</script>

**Insecure:**  
The alert executes immediately after performing the search.

**Secure:**  
The payload appears safely with no script execution.

---

## 3. Missing Input Validation

Try the following:
- Empty fields  
- Excessively long input  
- Malformed characters  

**Insecure:**  
Invalid data is accepted and saved directly to the database.

**Secure:**  
The input is rejected and validation messages appear.

---

## 4. Authentication Weaknesses

### Test:
' OR '1'='1

**Insecure:**  
Authentication bypass works.

**Secure:**  
The attempt fails and login requires correct credentials.

---

## 5. Session / Cookie Security

Inspect cookies in browser tools:

**Insecure:**  
Cookies lack security flags (HttpOnly, SameSite, Secure).

**Secure:**  
Cookies include secure flags and cannot be accessed via JavaScript.

---

## 6. Access Control

Create a post as User A, then attempt to edit/delete it as User B:

**Insecure:**  
User B can access User A’s post functions.

**Secure:**  
The system blocks the request with proper access control.

---

## 7. Lack of Audit Logging

Perform actions like failed logins, creating posts, invalid submissions:

**Insecure:**  
No logs are stored.

**Secure:**  
Each event is written to the audit log.

---
## 8. Sensitive Data Exposure (Insecure Only)

### Test:
Visit the insecure debug route:
```
http://localhost:3000/insecure/debug/db
```

**Insecure:**  
The full SQLite database is returned in JSON format, including:
- Plaintext passwords  
- User emails  
- All posts  

This demonstrates intentional sensitive data exposure in the insecure version.

**Secure:**  
The debug route does not exist.  
If you visit the equivalent path in the secure version, it will return 404 or redirect, confirming the issue has been removed.

---
## 9. CSRF Protection (Secure Version Only)

### Test:
1. Go to:
   ```
   http://localhost:3000/secure/create
   ```
2. Open Developer Tools → Inspect the form  
3. Delete the hidden CSRF token field from the HTML  
4. Submit the form

**Secure:**  
The request is rejected with:
```
403 Forbidden: invalid CSRF token
```
This confirms CSRF protection is enabled and working.

**Insecure:**  
The insecure version does not include CSRF protection, and the submission will succeed without any token.

---
## Selenium Tests (Secure Branch Only)

The secure version includes a set of Selenium end-to-end tests to validate key application behaviour such as authentication, post creation, logout, and access control.  
These tests should run successfully only on the **secure branch**, as the insecure branch contains intentional vulnerabilities.

### Running the Selenium Tests

1. Make sure you are in the **secure version** of the application.

2. Install dependencies (if not already installed):
   ```
   npm install
   ```

3. Start the secure application:
   The server must be running at:
   ```
   http://localhost:3000
   ```

4. Open a new terminal window and run each Selenium test one at a time:
   ```
   node tests/LoginSuccessTest.js
   node tests/LoginFailTest.js
   node tests/CreatePostTest.js
   node tests/LogoutTest.js
   node tests/AccessControlTest.js
   ```
---
