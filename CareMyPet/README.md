# CareMyPet

CareMyPet is a full-stack pet care platform that combines e-commerce, pet health tracking, vet discovery, educational content, and AI-assisted support into one product.

The repository contains two coordinated applications:

- `Backend`: a Flask and MongoDB API service.
- `Frontend`: a Next.js 14 web application.

## Platform Overview

The platform is designed for pet owners who want to manage daily care in one place. It supports:

- Shopping for pet accessories, medicines, and related products.
- Creating and maintaining pet profiles.
- Tracking vaccinations and reminder-driven care workflows.
- Browsing vets and related service data.
- Reading learning content and symptom guidance.
- Using a chatbot for quick assistance and navigation.
- Handling authentication, contact requests, uploads, and order-related flows through the API.

## What Is Included

Backend capabilities:

- Flask REST API with modular controllers and services.
- MongoDB persistence.
- JWT-based authentication.
- Password reset and OTP support.
- Scheduling and reminder jobs.
- Email, Gemini, and Firebase-ready integrations.
- File upload support for pet-related documents and prescriptions.

Frontend capabilities:

- Next.js 14 app router structure.
- TypeScript and Tailwind CSS UI.
- Dedicated pages for shop, vets, vaccinations, medicines, dashboard, profile, diary, community, and support flows.
- API integration through a configurable public base URL.
- Mobile packaging support through Capacitor.

## Technology Stack

- Python 3.10+
- Flask
- MongoDB
- JWT authentication
- APScheduler
- Flask-CORS
- Flask-Compress
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Repository Structure

```text
CareMyPet/
  Backend/
    src/
      app.py
      server.py
      config/
      controllers/
      middlewares/
      models/
      routes/
      services/
      utils/
    requirements.txt
    README.md
    .env.example
  Frontend/
    src/
      app/
      components/
      context/
      hooks/
      services/
      styles/
      utils/
    package.json
    .env.example
```

## Backend Modules

The backend is organized by responsibility rather than by one large monolith:

- Controllers: `auth`, `cart`, `chatbot`, `contact`, `learning`, `medicine`, `order`, `pet`, `product`, `upload`, `user`, `vaccination`, `vet`.
- Services: `auth`, `cart`, `chatbot`, `contact`, `learning`, `medicine`, `notification`, `order`, `otp`, `prescription`, `product`, `vaccination`, `vet`.
- Middleware and utilities handle errors, rate limiting, security, logging, password helpers, response formatting, and date helpers.

## Frontend Pages

The frontend is organized into user-facing flows such as:

- `page.tsx` for the landing page.
- `shop`, `cart`, and `checkout` for shopping.
- `vets` and `vaccinations` for care planning.
- `dashboard`, `profile`, and `diary` for personal tracking.
- `assistant`, `symptoms`, `library`, and `community` for guidance and learning.
- `auth`, `contact`, `medicines`, and `admin` for account and support flows.

## Local Setup

### Backend

```powershell
cd Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m src.server
```

The backend runs on `http://localhost:5000` by default.

### Frontend

```powershell
cd Frontend
npm install
copy .env.example .env.local
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Environment Variables

Backend variables are documented in [Backend/.env.example](Backend/.env.example).

Common values include:

```bash
PORT=5000
FLASK_DEBUG=false
MONGO_URI=mongodb://localhost:27017/care_my_pet
JWT_SECRET=replace-with-at-least-32-characters
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_BASE_URL=http://localhost:3000
BREVO_API_KEY=
GEMINI_API_KEY=
FIREBASE_SERVER_KEY=
```

Frontend variables are documented in [Frontend/.env.example](Frontend/.env.example).

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## API Surface

The backend exposes its API under `/api`. Major areas include:

- Authentication and user management.
- Pet profiles.
- Products, cart, and orders.
- Vet discovery.
- Vaccination tracking.
- Medicines and uploads.
- Chatbot, learning, and contact routes.

The service also provides a `GET /health` endpoint for basic checks.

## Runtime Behavior

- The backend seeds initial vet and product data when collections are empty.
- The app can bootstrap an admin account from environment variables.
- Reminder jobs run through the scheduler when the app is not in test mode.
- Real deployment settings are preserved because `.env` does not override existing environment variables.

## Deployment Notes

- Set `CORS_ALLOWED_ORIGINS` to the deployed frontend domain.
- Set `FRONTEND_BASE_URL` so password-reset and notification links resolve correctly.
- Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend API URL before building the frontend.
- Use a strong, persistent `JWT_SECRET` in production.

## Project Highlights

- Clear separation between API, business logic, and presentation layers.
- Modular services for authentication, orders, products, pets, vets, vaccination, medicine, and notifications.
- A polished frontend layout with multiple task-specific pages instead of a single generic shell.
- A project structure that is easy to extend as more care, commerce, or support features are added.

## Useful Entry Points

- Backend app factory: [Backend/src/app.py](Backend/src/app.py)
- Backend server runner: [Backend/src/server.py](Backend/src/server.py)
- Frontend home page: [Frontend/src/app/page.tsx](Frontend/src/app/page.tsx)
- Frontend app shell: [Frontend/src/app/layout.tsx](Frontend/src/app/layout.tsx)

## Documentation

- Project overview: this file
- Backend setup details: [Backend/README.md](Backend/README.md)
