# Smart Pet Care – Backend (Flask + MongoDB)

Production-ready REST API backend for the **Smart Pet Care – Pet Accessories & Healthcare Platform**, built with **Flask** and **MongoDB** and designed to integrate with a Next.js 14 frontend.

## Tech Stack

- **Runtime**: Python 3.10+
- **Framework**: Flask
- **Database**: MongoDB (localhost by default)
- **Auth**: JWT (access token) + password hashing (bcrypt)
- **Scheduling**: APScheduler (daily vaccination reminder job)
- **Notifications**: Email + Firebase Cloud Messaging (FCM) stubs
- **AI Chatbot**: Google Gemini API stub
- **File Uploads**: Flask file handling (prescription upload)

> **Note**: Payment / Razorpay integration is intentionally **omitted** as requested. Payment endpoints can be added later if needed.

## Project Structure

```text
Backend/
  requirements.txt
  .env.example
  src/
    app.py
    server.py
    config/
      __init__.py
      db.py
      jwt_config.py
      mail.py
      firebase_config.py
      gemini_config.py
      scheduler.py
    models/
      __init__.py
      user.py
      pet.py
      product.py
      cart.py
      order.py
      vet.py
      appointment.py
      vaccination.py
      medicine.py
    services/
      __init__.py
      auth_service.py
      user_service.py
      product_service.py
      cart_service.py
      order_service.py
      vet_service.py
      appointment_service.py
      vaccination_service.py
      medicine_service.py
      notification_service.py
      chatbot_service.py
    controllers/
      __init__.py
      auth_controller.py
      user_controller.py
      pet_controller.py
      product_controller.py
      cart_controller.py
      order_controller.py
      vet_controller.py
      appointment_controller.py
      vaccination_controller.py
      medicine_controller.py
      upload_controller.py
      chatbot_controller.py
      admin_controller.py
    routes/
      __init__.py
      auth_routes.py
      user_routes.py
      pet_routes.py
      product_routes.py
      cart_routes.py
      order_routes.py
      vet_routes.py
      appointment_routes.py
      vaccination_routes.py
      medicine_routes.py
      upload_routes.py
      chatbot_routes.py
      admin_routes.py
    middlewares/
      __init__.py
      auth_middleware.py
      error_handler.py
      rate_limit.py
    utils/
      __init__.py
      password.py
      responses.py
      decorators.py
      dates.py
      logging.py
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
MONGO_URI=mongodb://localhost:27017/care_my_pet
JWT_SECRET=super-secret-key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,capacitor://localhost
ADMIN_EMAILS=admin@example.com,owner@example.com
GEMINI_API_KEY=your-gemini-api-key
FIREBASE_SERVER_KEY=your-firebase-server-key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=CareMyPet <onboarding@resend.dev>
RESEND_REPLY_TO=caremypetofficial@gmail.com
```

## Getting Started

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env  # then edit values

python -m src.server
```

The API will start on `http://localhost:5000` by default.

## API Overview

All endpoints are prefixed with `/api`, for example:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/products`
- `GET  /api/vets`
- `POST /api/chatbot/message`

The Flask routes and controllers are organized per domain and match the expected frontend services.

