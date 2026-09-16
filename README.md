# CloudDesk

**Smart Customer Support, Built for the Cloud.**

CloudDesk is a full-stack customer-support SaaS application where customers can raise support tickets, support agents can triage and resolve them with AI assistance, and administrators can manage users, categories, analytics, and audit logs.

> **Current status:** CloudDesk is fully available as a local Docker application. A public live URL requires deployment to a cloud hosting provider.

---

## 🚀 Features

### 👤 Customers

* Register and log in
* Create support tickets
* Upload attachments
* Follow ticket conversations
* Receive notifications
* Rate ticket resolutions

### 🧑‍💻 Support Agents

* View and filter ticket queues
* Assign tickets
* Change ticket status
* Change priority
* Manage categories
* Add internal notes
* Use AI ticket analysis
* View dashboard statistics

### 👨‍💼 Administrators

* Manage users
* Manage ticket categories
* View platform analytics
* View system statistics
* View audit logs
* Perform agent-level ticket management

### 🤖 Google Gemini AI

CloudDesk can use Google Gemini to provide:

* Ticket summary
* Category prediction
* Priority prediction
* Sentiment analysis
* Missing information detection
* Suggested customer response
* Recommended action

AI responses are validated before being displayed.

If a Gemini API key is not configured, or if the AI service fails or times out, CloudDesk uses a deterministic rule-based fallback analyser.

**The application is designed so that an AI failure does not crash the application.**

### 🔐 Platform Security

* JWT authentication
* bcrypt password hashing
* Role-based authorization
* Zod request validation
* Helmet security headers
* CORS allowlist
* Rate limiting
* Pino structured logging
* Centralized error handling
* MIME type validation
* File-size validation
* Light/dark mode
* Responsive SaaS interface

---

# 🏗️ Architecture

```text
React + Vite
     │
     │ HTTP / JSON
     ▼
Express REST API
     │
     ├──────────────► Prisma ──────────────► PostgreSQL
     │
     ├──────────────► Gemini AI
     │
     └──────────────► Storage Service
                         │
                         ├── Local Storage
                         └── AWS S3 (when configured)
```

Detailed architecture:

`docs/ARCHITECTURE.md`

API documentation:

`docs/API.md`

AWS deployment documentation:

`docs/AWS_DEPLOYMENT.md`

---

# 📁 Project Structure

```text
CloudDesk/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── styles/
│   └── ...
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   │
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       └── validation/
│
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── AWS_DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── API.md
├── ARCHITECTURE.md
├── AWS_DEPLOYMENT.md
├── README.md
└── .gitignore
```

---

# 💻 Prerequisites

For local development you need:

* Node.js 20+
* npm
* Docker Desktop
* Git
* Optional: Google Gemini API key

---

# 🪟 Installation — Windows PowerShell

Clone the repository:

```powershell
git clone https://github.com/23MH1A1227/CloudDesk.git
cd CloudDesk
```

## 1. Start PostgreSQL

```powershell
docker compose up -d db
```

## 2. Configure the backend

```powershell
cd server
Copy-Item ..\.env.example .env
```

Install dependencies:

```powershell
npm install
```

Generate Prisma client:

```powershell
npx prisma generate
```

Apply database migrations:

```powershell
npx prisma migrate deploy
```

Seed development data:

```powershell
npm run seed
```

Return to the project root:

```powershell
cd ..
```

## 3. Configure the frontend

```powershell
cd client
Copy-Item .env.example .env
npm install
cd ..
```

---

# 🔑 JWT Secret

Generate a secure JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into:

```text
server/.env
```

Example:

```env
JWT_SECRET=your_generated_secret_here
```

**Never commit a real `.env` file to GitHub.**

---

# ▶️ Run CloudDesk Locally

There are two ways to run CloudDesk.

## Option 1 — Docker

This is the easiest way to run the complete application.

From the project root:

```powershell
docker compose up --build
```

After the containers start:

### 🌐 Web Application

```text
http://localhost:8080
```

### 🔌 API

```text
http://localhost:5000
```

### ❤️ Health Check

```text
http://localhost:5000/health
```

### 🗄️ PostgreSQL

```text
localhost:5432
```

To seed the database inside Docker:

```powershell
docker compose exec server npm run seed
```

To stop the application:

```powershell
docker compose down
```

To stop the application and remove database volumes:

```powershell
docker compose down -v
```

---

# 🛠️ Option 2 — Local Development

## Backend

Open Terminal 1:

```powershell
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

API:

```text
http://localhost:5000/api
```

## Frontend

Open Terminal 2:

```powershell
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🌐 Local URLs

| Service              | URL                          |
| -------------------- | ---------------------------- |
| Docker Frontend      | http://localhost:8080        |
| Development Frontend | http://localhost:5173        |
| API                  | http://localhost:5000/api    |
| Health Check         | http://localhost:5000/health |
| PostgreSQL           | localhost:5432               |

> **Important:** `localhost` URLs work only on the computer where CloudDesk is running. They are not public internet URLs.

---

# 🤖 Gemini AI Configuration

Gemini AI is optional.

Backend environment file:

```text
server/.env
```

Example:

```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash
```

If `GEMINI_API_KEY` is not configured, CloudDesk uses its deterministic fallback analyser.

**Never upload your real Gemini API key to GitHub.**

---

# ⚙️ Environment Variables

## Backend

| Variable                | Required | Description                  |
| ----------------------- | -------- | ---------------------------- |
| `DATABASE_URL`          | Yes      | PostgreSQL connection        |
| `JWT_SECRET`            | Yes      | Authentication secret        |
| `PORT`                  | No       | Backend port, default `5000` |
| `CLIENT_ORIGIN`         | No       | Frontend URL allowed by CORS |
| `JWT_EXPIRES_IN`        | No       | JWT expiration               |
| `BCRYPT_SALT_ROUNDS`    | No       | Password hashing rounds      |
| `GEMINI_API_KEY`        | No       | Google Gemini API key        |
| `GEMINI_MODEL`          | No       | Gemini model                 |
| `AI_TIMEOUT_MS`         | No       | AI request timeout           |
| `STORAGE_DRIVER`        | No       | `local` or `s3`              |
| `UPLOAD_DIR`            | No       | Local upload directory       |
| `MAX_UPLOAD_SIZE_MB`    | No       | Maximum upload size          |
| `AWS_REGION`            | No       | AWS region                   |
| `AWS_ACCESS_KEY_ID`     | No       | AWS access key               |
| `AWS_SECRET_ACCESS_KEY` | No       | AWS secret                   |
| `AWS_S3_BUCKET`         | No       | S3 bucket                    |
| `RATE_LIMIT_WINDOW_MS`  | No       | Rate limit window            |
| `RATE_LIMIT_MAX`        | No       | General rate limit           |
| `AUTH_RATE_LIMIT_MAX`   | No       | Authentication rate limit    |
| `LOG_LEVEL`             | No       | Pino logging level           |

## Frontend

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

# 🗄️ Database Commands

From the `server` directory:

```powershell
npx prisma migrate dev
```

Apply existing migrations:

```powershell
npx prisma migrate deploy
```

Seed development data:

```powershell
npm run seed
```

Reset and reseed the database:

```powershell
npm run db:reset
```

Open Prisma Studio:

```powershell
npx prisma studio
```

---

# 👤 Development Login Accounts

> ⚠️ These credentials are for local development/demo purposes only. Change or remove them before any real production deployment.

| Role          | Email                     | Password       |
| ------------- | ------------------------- | -------------- |
| Customer      | `customer@clouddesk.dev`  | `Customer@123` |
| Customer      | `customer2@clouddesk.dev` | `Customer@123` |
| Support Agent | `agent@clouddesk.dev`     | `Agent@123`    |
| Administrator | `admin@clouddesk.dev`     | `Admin@123`    |

The seed also creates sample categories and tickets.

---

# 🧪 Testing

Backend tests:

```powershell
cd server
npm test
```

Backend lint:

```powershell
npm run lint
```

Frontend lint:

```powershell
cd ..\client
npm run lint
```

Frontend production build:

```powershell
npm run build
```

---

# 🔄 Continuous Integration

CloudDesk includes a GitHub Actions workflow for automated checks.

The workflow can run checks such as:

* Dependency installation
* Backend linting
* Frontend linting
* Prisma checks
* Tests
* Frontend production build

GitHub Actions:

```text
.github/workflows/
```

---

# ☁️ Deployment

CloudDesk is designed to be deployable to cloud infrastructure.

A production deployment can use:

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │ Frontend / CDN  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ CloudDesk API   │
              │ Express/Node.js │
              └───────┬─────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     PostgreSQL    Gemini       S3
      Database       AI        Storage
```

For AWS deployment, see:

```text
AWS_DEPLOYMENT.md
```

The AWS documentation covers services such as:

* Amazon S3
* Amazon RDS
* Amazon EC2 / ECS
* CloudFront
* IAM
* CloudWatch

> **Note:** The repository itself does not automatically create AWS resources.

---

# 🌍 Public Website

The current repository provides a **local Docker application**.

Local URLs such as:

```text
http://localhost:8080
http://localhost:5000
http://localhost:5173
```

are only accessible from the computer running CloudDesk.

For other people to use CloudDesk through the internet, the application must first be deployed to a cloud hosting provider.

After deployment, a public URL can be added here:

```text
Live Demo: YOUR_DEPLOYED_URL
```

---

# 🔒 Security

Do not commit:

```text
.env
```

Do not publish:

* Gemini API keys
* AWS secret keys
* Database passwords
* JWT secrets
* Other private credentials

The repository contains `.env.example` files containing placeholder configuration only.

---

# 📚 Documentation

Additional documentation:

* `API.md` — API endpoint documentation
* `ARCHITECTURE.md` — application architecture
* `AWS_DEPLOYMENT.md` — AWS deployment guide

---

# 📦 GitHub Repository

GitHub:

https://github.com/23MH1A1227/CloudDesk

Clone:

```powershell
git clone https://github.com/23MH1A1227/CloudDesk.git
```

---

# 📄 License

MIT License.

CloudDesk was built as a portfolio and learning project.
