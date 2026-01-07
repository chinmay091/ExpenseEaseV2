# ExpenseEase - Dependencies

This project uses `package.json` for dependency management (Node.js/npm).

---

## Backend Dependencies

Located in `backend/package.json`

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | Web framework |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `dotenv` | ^17.2.3 | Environment variable management |
| `sequelize` | ^6.37.7 | PostgreSQL ORM |
| `pg` | ^8.16.3 | PostgreSQL client |
| `pg-hstore` | ^2.3.4 | PostgreSQL hstore support |
| `bcrypt` | ^6.0.0 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT authentication |
| `axios` | ^1.13.2 | HTTP client (for external APIs) |
| `langchain` | ^1.2.3 | LLM framework |
| `@langchain/google-genai` | ^2.1.3 | Gemini AI integration |
| `@langchain/openai` | ^1.2.0 | OpenAI integration (optional) |
| `zod` | ^4.2.1 | Schema validation |
| `cron` | ^4.4.0 | Scheduled jobs |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `nodemon` | ^3.1.11 | Auto-restart on file changes |
| `sequelize-cli` | ^6.6.3 | Database migrations |

### Install Command
```bash
cd backend
npm install
```

---

## Mobile (Frontend) Dependencies

Located in `mobile/package.json`

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.30 | React Native framework |
| `expo-router` | ~6.0.21 | File-based routing |
| `react` | 19.1.0 | UI library |
| `react-native` | 0.81.5 | Mobile framework |
| `axios` | ^1.13.2 | HTTP client |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local storage |
| `@react-native-picker/picker` | ^2.11.4 | Dropdown picker |
| `@react-navigation/native` | ^7.1.26 | Navigation |
| `@react-navigation/bottom-tabs` | ^7.9.0 | Tab navigation |
| `expo-camera` | (via expo install) | Camera access |
| `expo-image-picker` | (via expo install) | Photo library access |
| `expo-dev-client` | (via expo install) | Development builds |
| `@react-native-google-signin/google-signin` | latest | Google OAuth |
| `@maniac-tech/react-native-expo-read-sms` | latest | SMS reading (Android) |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.2 | Type checking |
| `@types/react` | ~19.1.0 | React type definitions |
| `eslint` | ^9.25.0 | Linting |

### Install Command
```bash
cd mobile
npm install
```

---

## External Services Required

| Service | Required | Free Tier | Purpose |
|---------|----------|-----------|---------|
| PostgreSQL | Yes | Yes | Database |
| Google Gemini API | Yes | Yes (limited) | AI features (chat, OCR, parsing) |
| Hugging Face API | No | Yes | Alternative OCR (optional) |
| Google Cloud OAuth | For Gmail | Yes | Gmail transaction import |
| Apple Developer | For iOS | No ($99/yr) | iOS distribution (EAS only) |

---

## Quick Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configure your environment

# Mobile
cd mobile
npm install
npx expo prebuild --platform ios  # or android
```
