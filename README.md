# Global AI Skill Challenge

Quiz + creative response app with OTP email verification, retry-limited quiz attempts, and AI scoring.

## Tech Stack

- Frontend: React Native (Expo Web), React Navigation, Axios, AsyncStorage
- Backend: FastAPI, Uvicorn, SQLAlchemy, Pydantic, JWT (`python-jose`), `passlib` + `bcrypt`
- Database: SQLite (`global_quiz.db`)
- Integrations: Mailtrap SMTP (OTP email), Groq (creative scoring)

## Quick Start

### 1) API

```bash
cd api
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API: `http://127.0.0.1:8000`  
Docs: `http://127.0.0.1:8000/docs`

### 2) UI

```bash
cd ui
npm install
npx expo start --web -c
```

UI: `http://localhost:8081`

## Required Environment (`api/.env`)

Use standard dotenv format (`KEY=value`), not PowerShell syntax.

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
SMTP_FROM=noreply@example.com
FROM_NAME=Global AI Skill Challenge
```

Optional:

```env
GROQ_API_KEY=your_groq_api_key
SMTP_DEBUG=false
```

## Core API Endpoints

- `POST /signup` -> creates user, stores OTP, sends OTP email
- `POST /resend-otp` -> regenerates and resends OTP for unverified users
- `POST /verify-otp` -> verifies email and issues token
- `POST /login` -> login for verified users; returns next screen info
- `GET /quiz` -> quiz questions + attempts remaining
- `POST /verify-answer` -> immediate correctness check
- `POST /quiz-timeout` -> records timeout as failed attempt
- `POST /submit-quiz` -> records final quiz attempt
- `GET /my-quiz-attempts` -> attempts used/remaining
- `POST /submit-response` -> 25-word creative response scoring (supports resubmission and rescoring)
- `GET /my-creative-result` -> current user creative result (submitted or not)
- `GET /leaderboard` -> public top scores
- `GET /adjudication/shortlist?limit=10` -> ranked shortlist from scored entries
- `GET /adjudication/audit/{user_id}` -> evaluation audit events per user

## AI Adjudication Pipeline

- Multi-agent flow with two LLM roles:
  - Agent A: initial rubric scoring
  - Agent B: review/adjustment for consistency
- Tool steps:
  - `word_count_tool`
  - `normalize_scores_tool`
  - `aggregate_total_tool`
  - `off_topic_guard_tool` (keeps unrelated responses from scoring high)
- Audit trail is persisted in `evaluation_audits`.

## UX Notes

- Max quiz attempts per user: **10**
- Timeout and wrong answers both consume an attempt
- Quiz answer flow is explicit:
  - select an option (highlighted)
  - click **NEXT QUESTION** / **SUBMIT QUIZ**
- Dashboard attempts and leaderboard refresh on focus
- `VIEW AI RESULT` is user-scoped (fetched from backend), avoiding stale cross-user local cache
- Session persists on refresh via `AsyncStorage` token
