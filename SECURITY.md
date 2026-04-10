# 🛡️ Security Policy (SECURITY.md)

## Overview
This document outlines the security procedures, reporting mechanisms, and built-in protections for the **Acadly** project. We prioritize the integrity of academic data and user privacy.

---

## 🚀 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0.0 | ❌ No (Legacy)     |

---

## 🔒 Implemented Security Measures

The **Acadly** architecture integrates several layers of defense based on our **Node.js/Express** and **MERN** stack:

### 1. Authentication & Authorization
* **JWT (JSON Web Tokens):** Protected routes require a valid Bearer token. Tokens are signed with high-entropy secrets and include expiration logic.
* **OAuth 2.0:** Secure third-party login integration (e.g., Google) to reduce the risk of handling raw passwords.
* **Role-Based Access Control (RBAC):** Strict permission separation between **Student** and **Professor** roles implemented at the controller level.

### 2. Data Protection
* **Mongoose/ODM Sanitization:** Automatic schema validation via **Mongoose** to prevent NoSQL injection.
* **SQL Injection Prevention:** Use of parameterized queries via **node-postgres** for all relational database operations.
* **Bcrypt Hashing:** User passwords are encrypted using `bcrypt` with a high salt factor before storage.
* **Environment Isolation:** Sensitive credentials (DB URIs, JWT Secrets) are managed via `.env` files and are excluded from version control.

### 3. API & Infrastructure Security
* **Helmet.js:** Middleware configuration to set secure HTTP headers (XSS, Clickjacking, and Sniffing protection).
* **CORS Policy:** Restrictive Cross-Origin Resource Sharing to ensure only authorized frontends (React/Next.js) can access the API.
* **Docker Security:** Containerized environments ensure process isolation and consistent security configurations across deployments.

---

## 🚩 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a potential security flaw in Acadly, please follow these steps:

1.  **Draft a Report:** Include a description of the vulnerability, steps to reproduce, and the potential impact.
2.  **Private Submission:** Email your report directly to the maintainer or submit a private **GitHub Security Advisory**.
3.  **Response Time:** We aim to acknowledge reports within **48 hours** and provide a patch timeline within **5 business days**.

---

## 🛠️ Security Checklist for Contributors
* Run `npm audit` before submitting any Pull Request.
* Ensure all new endpoints are wrapped in the `auth` middleware.
* Never hardcode API keys or secrets; always use `process.env`.
* Sanitize all user-generated content before rendering to prevent stored XSS.

---
*Last Updated: April 2026*
