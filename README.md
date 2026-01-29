# ExpenseEase 💰

A full-stack personal finance assistant built with React Native (Expo) and Node.js, featuring JWT authentication, RESTful APIs, LLM-powered parsing, ML-based SMS classification, and real-time push notifications.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF6B6B?style=for-the-badge&logo=redis&logoColor=white)

---

## ✨ Features

### Expense Management
- Full CRUD operations for transactions with category classification
- Receipt scanning with OCR (CloudVault integration for storage)
- Duplicate detection on import to prevent data redundancy
- Soft delete pattern for data retention and recovery

### Automatic Budget Generation
- Analyzes 3-6 months of spending history per category
- **Dynamic seasonal multipliers** - Learns from user's own spending patterns
- **Exponential Weighted Moving Average (EWMA)** - Recent months weighted higher
- **Category-specific volatility thresholds** - Different expected variance per category
- **Dynamic confidence scoring** - Based on data quality, not hardcoded
- Falls back to LLM (Google Gemini) for explanation generation

### Data Import Pipeline
- **SMS Parsing** - DistilBERT ML classifier (ONNX) + regex fallback for bank SMS
- **Gmail Import** - OAuth2 authentication, email fetching via Gmail API, LLM-based extraction
- **Receipt OCR** - Tesseract.js for text extraction, regex pattern matching for amounts/dates/merchants

### Savings Goals
- Goal tracking with target amount and deadline
- Auto-contribution from income based on configurable percentage
- Progress visualization with contribution history

### Bill Management
- Recurring bill reminders with customizable reminder days
- Auto-expense creation when marking bills as paid
- Monthly reset for recurring bills

### Split Expenses
- Group creation with member management
- Equal split calculation with balance tracking
- Settlement flow with debt simplification

### Smart Chat Assistant
- Rule-based query processing for common financial questions
- LLM fallback for complex natural language queries
- Context-aware responses using user's actual financial data

### Push Notifications
- Budget overspend warnings (90%+ usage)
- Bill due date reminders
- Anomaly detection for unusual transactions
- Weekly spending summaries

---

## 🏗️ Backend Architecture

### Authentication System
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Login     │───▶│ Access Token │───▶│  API Call   │
│  (email/pw) │    │   (15 min)   │    │ (protected) │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                          ▼ expires
                   ┌──────────────┐
                   │Refresh Token │───▶ New Access Token
                   │   (7 days)   │
                   └──────────────┘
```
- JWT with access/refresh token rotation
- Bcrypt password hashing (10 salt rounds)
- Token blacklisting on logout
- Automatic token refresh via Axios interceptors (frontend)

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat | 10 requests | 1 minute |
| LLM (global) | 15 requests | 1 minute |
| Budget Gen | 3 requests | 5 minutes |
| OCR | 10 requests | 1 minute |
| SMS Parse | 5 requests | 1 minute |
| Auth (login/signup) | 10 requests | 15 minutes |

### Database Design (PostgreSQL)
```
User ──┬── Expense ──── Category
       ├── Budget ───── Category  
       ├── Goal ─────── GoalContribution ── Expense
       ├── Bill ─────── Category
       ├── Device (push tokens)
       └── GroupMember ── Group ── GroupExpense ── Split
```
- Sequelize ORM with model associations
- Foreign key constraints with cascade delete
- Decimal precision for financial amounts
- **Connection pooling** (max: 20, min: 5 connections)
- **Performance indexes** on frequently queried columns
- **Race condition prevention** via unique constraints and `findOrCreate`

### API Layer
- **Controller-Service-Model** pattern for separation of concerns
- **Zod schemas** for request validation
- **Consistent response format**: `{ success: boolean, data?: T, message?: string }`
- **Error middleware** for centralized error handling

### Caching Strategy (Redis)
```javascript
// Cache key pattern: prefix:md5(input)
SMS_PARSE: 86400s   // 24 hours - parsed SMS results
EMAIL_PARSE: 86400s // 24 hours - parsed email results  
ANALYTICS: 1800s    // 30 minutes - analytics data
```
- MD5 hashing for cache key generation
- TTL-based automatic expiration
- Rate limiter storage (persistent across restarts)
- Graceful degradation when Redis unavailable

### ML Integration
| Model | Purpose | Format |
|-------|---------|--------|
| SMS Classifier | Transactional vs non-transactional SMS | DistilBERT (ONNX) |
| Budget Predictor | Spending forecasting with trends & seasonality | Prophet (Python microservice) |

### Background Jobs (BullMQ)
Distributed job scheduling with Redis-backed persistence. Safe for multi-instance deployments.

| Schedule | Job | Description |
|----------|-----|-------------|
| 12:00 AM | Budget Recalculation | Regenerate budgets for all users |
| 3:00 AM | Token Cleanup | Remove expired refresh tokens |
| 6:00 AM | Goal Contributions | Process auto-contributions |
| 8:00 AM | Bill Reminders | Send due date notifications |
| 9:00 AM | Budget Warnings | Alert users at 90% budget usage |
| 10:00 AM Sun | Weekly Summary | Send spending summaries |

### Async Processing (BullMQ Workers)
Heavy operations run in background workers for instant API responses:

| Queue | Operation | Benefits |
|-------|-----------|----------|
| `budget-generation` | AI-powered budget creation | Instant response, push notification on complete |
| `ocr-processing` | Receipt scanning with Tesseract | Non-blocking, handles large images |
| `ai-insights` | LLM-based spending insights | Rate limit friendly, resilient |

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching + rate limiting)
- Google Cloud Project (for Gemini API + Gmail OAuth)

### Quick Start with Docker
```bash
# Clone the repo
git clone https://github.com/chinmay091/ExpenseEaseV2.git
cd ExpenseEaseV2

# Create .env file (optional - defaults work for local dev)
cp backend/env.example backend/.env

# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# Backend runs at http://localhost:5000
```

### Manual Setup
```bash
# Backend
cd backend
npm install
cp env.example .env
npm run db:migrate
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

### Environment Variables
```env
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/expenseease

# Authentication
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# LLM (Google Gemini)
GOOGLE_API_KEY=your_gemini_api_key
LLM_ENABLED=true

# ML Model (SMS Classification)
SMS_ML_MODEL_ENABLED=true
SMS_ML_MODEL_PATH=../ML/sms_classifier.onnx

# Caching + Rate Limiting
REDIS_URL=redis://localhost:6379
```

### Mobile
```bash
cd mobile
npm install
npx expo start
npx expo run:android  # For development build
```

---

## 🔒 Security

| Layer | Implementation |
|-------|----------------|
| Passwords | Bcrypt (10 rounds) |
| Tokens | JWT RS256, 15min access / 7day refresh |
| API | Rate limiting, CORS, Helmet.js |
| Input | Zod validation on all endpoints |
| Database | Parameterized queries (Sequelize) |

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Chinmay** - [GitHub](https://github.com/chinmay0910)
