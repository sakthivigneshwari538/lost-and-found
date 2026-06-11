# Lost & Found

A full-stack web application that helps campus communities report, track, and reclaim lost items. Built with **React** and **FastAPI**.

## Features

- **Post Lost & Found Items** — Report items with images, category, location, and date details
- **Search & Filter** — Find items by type, category, keyword, and date
- **Verification Questions** — Item posters can set questions only the real owner would know
- **Claim System** — Submit claims on found items, answer verification questions, and get reviewed by the poster
- **Smart Match** — Automatically suggests possible matches between lost and found items based on category, title, location, and date proximity
- **Email OTP Authentication** — Secure registration with email verification
- **User Dashboard** — Manage your posts, edit profile, and track claims
- **Responsive Design** — Clean, light-themed UI that works across devices

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | FastAPI (Python), SQLAlchemy ORM |
| Database | PostgreSQL |
| Auth | JWT + Email OTP Verification |
| Email | SMTP (Gmail) |

## Project Structure

```
lost-and-found/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, email, dependencies
│   │   ├── db/             # Database session, enums
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   └── schemas/        # Pydantic schemas
│   ├── alembic/            # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance
│   │   ├── components/     # Navbar, Toast, ProtectedRoute
│   │   ├── context/        # AuthContext
│   │   └── pages/          # All page components
│   └── package.json
└── README.md
```

## Database Schema

```
Users ─────────< Items ─────────< Verification Questions
                   │                        │
                   │                        │
                   ├──────< Item Images     │
                   │                        │
                   └──────< Claims ────────< Claim Answers
```

**Tables:** Users, Items, Item Images, Verification Questions, Claims, Claim Answers, Notifications, Admin Actions

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP for registration |
| POST | `/api/auth/verify-otp` | Verify OTP and create account |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/items` | Create a new item |
| GET | `/api/items` | List items (with filters & pagination) |
| GET | `/api/items/{id}` | Get item details |
| PUT | `/api/items/{id}` | Update item |
| DELETE | `/api/items/{id}` | Delete item |
| POST | `/api/items/{id}/images` | Upload images |
| GET | `/api/items/{id}/matches` | Get smart match suggestions |

### Claims & Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/items/{id}/questions` | Add verification questions (owner) |
| GET | `/api/items/{id}/questions` | Get questions (public) |
| POST | `/api/items/{id}/claims` | Submit a claim |
| GET | `/api/items/{id}/claims` | List claims (owner) |
| PUT | `/api/items/{id}/claims/{claim_id}` | Approve/reject claim |

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
# Edit .env with your database URL, JWT secret, and email credentials

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

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:8000`.

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/lost_and_found
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=1440

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

## How It Works

### For someone who found an item:
1. Post the item with photos, category, location, and date
2. Add verification questions (e.g., "What color is the case?")
3. Review incoming claims — compare answers against expected answers
4. Approve the rightful owner

### For someone who lost an item:
1. Post what you lost with details
2. Browse found items or check Smart Match suggestions
3. Submit a claim on a matching found item
4. Answer verification questions to prove ownership

## License

This project is open source and available under the [MIT License](LICENSE).
