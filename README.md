# Lost & Found

A full-stack web application that helps campus communities report, track, and reclaim lost items. Built with **React** and **FastAPI**.

---

## Features

### Core
- **Post Lost/Found Items** — Report items with title, category, location, date, description, and images
- **Search & Filter** — Find items by keyword, type (lost/found), category, with pagination
- **Image Upload** — Attach multiple images to item posts

### Claims & Verification
- **Verification Questions** — Item posters can add questions only the real owner would know
- **Claim System** — Users can submit claims on found items with answers to verification questions
- **Claim Review** — Item owners can compare answers, then approve or reject claims
- **Auto-Reject** — Approving one claim automatically rejects all other pending claims

### Smart Match
- **Match Engine** — Automatically suggests possible matches between lost and found items
- **Scoring Algorithm** — Ranks matches by category, title keywords, location proximity, and date closeness

### Authentication
- **Email OTP Verification** — New accounts are verified via a 6-digit OTP sent to email
- **JWT Tokens** — Secure session management with JSON Web Tokens
- **Protected Routes** — Dashboard and posting require authentication

### User Management
- **Profile Dashboard** — View profile info, manage posts, and review claims
- **Edit Profile** — Update display name from the dashboard
- **My Posts** — Quick access to all items you've posted

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Backend** | FastAPI (Python), SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT + Email OTP (SMTP) |
| **Migrations** | Alembic |

---

## Database Schema

```
Users ──────────< Items ──────────< Item Images
                    │
                    ├──────────< Verification Questions
                    │
                    └──────────< Claims ──────────< Claim Answers
```

**Tables:** `users`, `items`, `item_images`, `verification_questions`, `claims`, `claim_answers`, `pending_registrations`, `notifications`, `admin_actions`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP for registration |
| POST | `/api/auth/verify-otp` | Verify OTP and create account |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile |

### Items
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/items` | Create a new item |
| GET | `/api/items` | List items (with filters & pagination) |
| GET | `/api/items/my-items` | Get current user's items |
| GET | `/api/items/{id}` | Get item details |
| PUT | `/api/items/{id}` | Update an item |
| DELETE | `/api/items/{id}` | Delete an item |
| POST | `/api/items/{id}/images` | Upload images |
| GET | `/api/items/{id}/matches` | Get smart match suggestions |

### Claims & Verification
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/items/{id}/questions` | Add verification questions |
| GET | `/api/items/{id}/questions` | Get questions (hides answers) |
| POST | `/api/items/{id}/claims` | Submit a claim |
| GET | `/api/items/{id}/claims` | List claims (owner only) |
| PUT | `/api/items/{id}/claims/{claim_id}` | Approve/reject claim |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and SMTP credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend API on `http://localhost:8000`.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/lost_and_found
SECRET_KEY=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## License

This project is open source 
