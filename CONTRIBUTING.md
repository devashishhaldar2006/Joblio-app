# Contributing to Joblio

Thank you for your interest in contributing to **Joblio**! As an open-source, AI-powered developer intelligence and career acceleration platform, we welcome contributions from engineers of all experience levels.

---

## 🧭 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all contributors and maintainers with respect, empathy, and constructive feedback.

---

## 🛠️ Project Architecture Overview

Joblio is structured as a multi-tier microservice workspace:

```
Joblio-app/
├── innovatex/
│   ├── mobile/         # React Native (Expo SDK 58, TypeScript, Clerk Auth)
│   ├── backend/        # Node.js + Express (TypeScript, MongoDB Atlas, Resend)
│   └── pythonservice/  # Python 3.11+ (FastAPI, LangGraph, Prophet, Auto-ARIMA)
├── docs/               # System architecture & visual assets
├── LICENSE             # MIT License
└── README.md           # Master project overview & Play Store links
```

---

## 🚀 Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/devashishhaldar2006/Joblio-app.git
cd Joblio-app
```

### 2. Setting Up Components

#### A. Backend (Node.js & Express TS)
```bash
cd innovatex/backend
npm install
cp .env.example .env
# Fill in MONGO_URI, CLERK_SECRET_KEY, RESEND_API_KEY, PYTHON_SERVICE_URL
npm run dev
```

#### B. AI / ML Microservice (FastAPI + LangGraph)
```bash
cd innovatex/pythonservice
python -m venv venv
# Windows:
venv\Scripts\activate
# Unix:
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### C. Mobile App (Expo SDK 58)
```bash
cd innovatex/mobile
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
npx expo start
```

---

## 📋 Contribution Workflow

1. **Find or Open an Issue**: Check existing issues or propose a feature / bugfix before writing code.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
3. **Write Clean, Typed Code**:
   - Mobile & Backend: Maintain 0 TypeScript errors (`npx tsc --noEmit`).
   - Mobile: Strictly preserve the Sunset Noir dark-mode palette (`#FF7A00` orange accents, `#121214` dark backgrounds).
   - Backend: Ensure any new endpoints implement proper `authMiddleware` and quota protection.
4. **Test Thoroughly**:
   - Verify cloud cold-start resilience and error handling.
   - Test authentication and token verification flows.
5. **Commit with Conventional Commits**:
   - `feat(...)`: New capability or screen
   - `fix(...)`: Bug fix or resilience patch
   - `docs(...)`: Documentation or badge update
   - `refactor(...)`: Code cleanups with no behavioral change
6. **Submit a Pull Request**:
   - Provide a clear PR summary, linked issue, and screenshots for any UI adjustments.

---

## 🔒 Security Vulnerabilities

Please do not report security vulnerabilities via public GitHub issues. Instead, report them directly to the maintainers at:
📧 `workfordevashishhaldar@gmail.com`

---

## 📜 License

By contributing to Joblio, you agree that your contributions will be licensed under the [MIT License](LICENSE).
