# CodeSentinel AI — Next-Generation AI Code Reviewer & Project Security Auditor

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-MERN%20%2B%20TypeScript-cyan.svg)](#technology-stack)
[![Security](https://img.shields.io/badge/security-Pre--flight%20Redaction%20%7C%20Zip%20Slip%20Defense-emerald.svg)](#security-architecture)

**CodeSentinel AI** is an enterprise-grade AI-powered code review and multi-file project analysis platform built on the MERN stack with strict first-party JWT authentication, pre-flight credential redaction, Zip Slip protection, deterministic quality scoring, and automated vulnerability detection.

---

## 🌟 Key Capabilities

- **Pure First-Party Authentication (JWT + Session Revocation)**:
  - Zero Google/GitHub/social OAuth dependencies.
  - Short-lived access tokens (15m) paired with rotated, cryptographic refresh tokens.
  - Passwords hashed using `bcrypt` (12 salt rounds).
  - Explicit session table invalidation upon logout.
- **Pre-Flight Secret Redaction Engine**:
  - Scans code prior to AI transmission using high-performance regex detection (AWS keys, private SSH/RSA keys, Slack/GitHub tokens, DB credentials).
  - Replaces exposed secrets with masked tokens (`[REDACTED_SECRET_xxx]`) and alerts the developer.
- **Multi-File Project Analyzer**:
  - Upload compressed repositories (`.zip`) with strict streaming validation.
  - Defends against **Zip Slip** directory traversal, decompression bombs, and binary files.
  - Automatically filters `node_modules`, `.git`, build output, and `.env` files.
- **Deterministic Quality Scoring System**:
  - Transparent mathematical formula calculating scores (0-100) based on weighted finding severities (Critical: 25, High: 15, Medium: 7, Low: 2, Info: 0) and lines of code analyzed.
  - Repeatable, explainable, and free of LLM score hallucination.
- **Review Comparison & Drift Analysis**:
  - Side-by-side diff between baseline and target audits.
  - Isolates newly introduced defects, verified resolved issues, and persistent vulnerabilities.
- **Observable & Secure Architecture**:
  - Centralized structured logging with automatic secret redaction.
  - Request IDs (`X-Request-Id`) attached to all incoming transactions.
  - Tiered rate limiting protecting auth and AI review endpoints.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Monaco Editor, Lucide React, Motion.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, MongoDB.
- **AI Integration**: Google GenAI SDK (`@google/genai` with `gemini-2.5-flash`), abstract provider interface with deterministic static analysis fallback.
- **Security**: Helmet, CORS, express-rate-limit, Zod, adm-zip with path canonicalization.

---

## 📁 Project Structure

- `frontend/` contains the React application and its Vite entry point.
- `backend/` contains the Express server and backend source code.
- Shared package, TypeScript, and Vite configuration files remain at the repository root.

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 22.18+ installed (the production server uses Node's native TypeScript support)
- MongoDB installed locally or a free MongoDB Atlas connection string (or use the automatic high-fidelity in-memory storage fallback)

### 2. Installation
```bash
# Clone repository
git clone https://github.com/yourusername/codesentinel-ai.git
cd codesentinel-ai

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a root `.env` file only if you need to override the local defaults:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/codesentinel
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

For production, set `MONGODB_URI` and `JWT_ACCESS_SECRET` in the deployment environment. The access-token secret must contain at least 32 non-whitespace characters. Refresh tokens are random opaque values stored as hashes, so they do not use a separate JWT signing secret. The server refuses to start in production if the required values are missing or invalid, or if MongoDB cannot be reached. Development runs generate a temporary access-token secret when none is provided.

### 4. Running the Application
```bash
# Development (Full-Stack Express + Vite)
npm run dev

# Build Production Bundle
npm run build

# Start Production Server
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Data Retention Policies

1. **Zero Secret Persistence**: Source files with detected credentials have sensitive tokens redacted.
2. **Untrusted Code Sandbox**: Uploaded source code is treated as untrusted data within strict system prompts, preventing prompt-injection attacks.
3. **Data Isolation**: All queries enforce user ownership. A user cannot access or modify projects or reviews belonging to another user.
4. **Temporary Upload Cleanup**: All uploaded archives are unpacked into temporary memory buffers and purged immediately after processing.

---

## 📄 License
Released under the Apache-2.0 License.
