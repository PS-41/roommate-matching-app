# 🏠 RoomieMatch  
### Preference-Based Roommate Matching Web Application

![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)
![Flask](https://img.shields.io/badge/Backend-Flask-black?logo=flask)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey?logo=sqlite)
![Status](https://img.shields.io/badge/Status-Completed-success)
![License](https://img.shields.io/badge/License-Academic-blue)

---

## 📌 Overview

**RoomieMatch** is a full-stack web application that intelligently matches potential roommates based on **lifestyle preferences, constraints, and geographic proximity**.

Unlike traditional roommate platforms, this system uses a **mutual compatibility scoring engine** to recommend only those matches where **both users are likely to be satisfied**, ensuring higher quality and realistic roommate pairings.

---

## ✨ Key Features

### 🔐 Authentication
- Secure login & signup (JWT-based)
- Protected routes
- Password hashing

### 👤 Smart Profile System
- Personal details: age, gender, occupation, bio
- Budget preferences
- Location (ZIP + radius)
- Lifestyle attributes:
  - Cleanliness
  - Sleep schedule
  - Noise tolerance
  - Guests
  - Smoking & drinking

### 🎯 Advanced Matching Engine
- Mutual compatibility scoring (A ↔ B)
- Hard filters (dealbreakers):
  - Location radius
  - Gender
  - Age range
  - Budget
  - Pets
- Soft scoring:
  - Lifestyle similarity
- Cached for fast performance ⚡

### 📊 Dashboard
- Ranked roommate recommendations
- Shows:
  - Compatibility %
  - Distance
  - Profile summary

### 🤝 Connection System
- Send / accept / decline requests
- Organized into:
  - Connected users
  - Incoming requests
  - Outgoing requests

### 💬 Messaging
- Chat unlocked only after connection
- Inbox with:
  - Threads
  - Message history
  - Unread indicators

### 👀 Profile Viewing
- View your profile
- View other users
- Dynamic actions:
  - Connect / Accept / Chat / Remove

---

## 🖥️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router

### Backend
- Flask (Python)
- SQLAlchemy ORM
- JWT Authentication
- Flask-Migrate

### Database
- SQLite (dev)
- PostgreSQL-ready (prod)

### Geolocation
- `pgeocode` (ZIP → coordinates)
- `geopy` (distance calculation)

---

## 📂 Project Structure
```
roommate-matching-app/
├── backend/
│ ├── run.py
│ ├── requirements.txt
│ ├── app/
│ │ ├── auth.py
│ │ ├── profile.py
│ │ ├── compatibility.py
│ │ ├── messages.py
│ │ ├── models.py
│ ├── migrations/
│ ├── app.db
│
├── frontend/
│ ├── src/
│ │ ├── pages/
│ │ ├── components/
│ │ ├── services/api.js
│
└── README.md
```

---

## ⚙️ Local Setup

1. Clone the Repository
```
git clone https://github.com/PS-41/roommate-matching-app.git
cd roommate-matching-app
```
------------------------------------------------------------

2. Backend Setup
```
cd backend
python -m venv .venv
```
Activate environment:

Mac/Linux:
```
source .venv/bin/activate
```
Windows:
```
.venv\Scripts\activate
```
Install dependencies:
```
pip install -r requirements.txt
```
Create .env file inside backend/:
```
FLASK_ENV=development
PORT=5000
SECRET_KEY=dev_secret_key
JWT_SECRET_KEY=dev_jwt_secret
DATABASE_URL=sqlite:///app.db
```
Run backend:
```
python run.py
```
Backend runs at:
```
http://localhost:5000
```
------------------------------------------------------------

3. Frontend Setup
```
cd frontend
npm install
```
Create .env inside frontend/:
```
VITE_API_BASE_URL=http://localhost:5000/api
```
Run frontend:
```
npm run dev
```
Frontend runs at:
```
http://localhost:5173
```
------------------------------------------------------------

## 🧪 How to Test

1. Register a user
2. Complete profile (IMPORTANT)
3. Create second user
4. Verify:
   - Matches appear
   - Connection works
   - Chat works after acceptance

---

## 🧠 System Design Highlights

### ✔ Mutual Matching Logic
Ensures compatibility from both users’ perspectives

### ✔ Cached Compatibility Table
- Heavy computation → profile update
- Fast dashboard queries

### ✔ Hybrid Matching
- Hard constraints → filtering
- Soft scoring → ranking

### ✔ Controlled Communication
- No chat unless both users agree

---

## 🔮 Future Improvements

- Match explanation (Why this match?)
- AI-assisted roommate suggestions with natural language preferences
- Weighted preferences
- Real-time chat (WebSockets)
- Profile photos & verification
- Notifications system
- PostgreSQL migration
- Cloud deployment (AWS/GCP)

---

## 🌐 Repository

👉 https://github.com/PS-41/roommate-matching-app

---

## 👨‍💻 Author

**Prakhar Suryavansh**  
CSCE 685 – Directed Studies  
Texas A&M University

---

## 📜 License

This project is developed for academic purposes.  
You are free to extend and build upon it with proper attribution.

---

⭐ If you found this project interesting, consider starring the repo!