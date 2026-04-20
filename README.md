# RoomieMatch – Preference-Based Roommate Matching Web Application

RoomieMatch is a full-stack web application designed to intelligently match potential roommates based on structured lifestyle preferences, personal constraints, and geographic proximity.

Unlike traditional roommate platforms that rely on manual browsing, RoomieMatch uses a mutual compatibility scoring engine to recommend the most suitable matches while enforcing strict dealbreakers such as location, budget, and lifestyle constraints.

------------------------------------------------------------

FEATURES

Authentication
- User registration and login using JWT-based authentication
- Protected routes for authenticated access
- Secure password hashing

Profile & Preferences
- Detailed user profiles including:
  - Age, gender, occupation, bio
  - Budget range
  - Location (ZIP/postal code + radius)
- Structured preference system:
  - Lifestyle traits (cleanliness, sleep schedule, noise tolerance, etc.)
  - Dealbreakers (strict constraints)
  - “Do not care” options

Compatibility Engine
- Mutual compatibility scoring (A → B and B → A)
- Hard constraints:
  - Location radius (strict)
  - Gender preference
  - Age range
  - Budget overlap (optional strict)
  - Pets preference
  - Lifestyle dealbreakers
- Soft scoring:
  - Normalized similarity across lifestyle traits
- Cached results stored in database for fast retrieval

Dashboard
- Ranked list of compatible users
- Displays:
  - Compatibility score
  - Distance
  - Basic profile info
- Real-time updates after profile changes

Connection System
- Send, accept, decline, and remove connection requests
- Organized views:
  - Connected users
  - Incoming requests
  - Outgoing requests

Messaging
- Chat system unlocked only after mutual connection
- Inbox with:
  - Conversation threads
  - Unread message indicators
  - Message history

Profile Viewing
- View your own profile
- View other users' profiles with:
  - Compatibility context
  - Connection actions (Connect / Accept / Chat / Remove)

------------------------------------------------------------

TECH STACK

Frontend
- React (Vite)
- Tailwind CSS
- React Router
- Fetch-based API service layer

Backend
- Flask (Python)
- SQLAlchemy ORM
- Flask-JWT-Extended (authentication)
- Flask-Migrate (database migrations)

Database
- SQLite (development)
- Designed for PostgreSQL (production-ready migration)

Geolocation
- pgeocode for ZIP → latitude/longitude
- geopy for distance computation

------------------------------------------------------------

PROJECT STRUCTURE

roommate-matching-app/
├── backend/
│   ├── run.py
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── extensions.py
│   │   ├── models.py
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── compatibility.py
│   │   ├── messages.py
│   ├── migrations/
│   ├── app.db
│   └── uploads/
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/api.js
│
├── README.md
└── .gitignore

------------------------------------------------------------

LOCAL SETUP INSTRUCTIONS

1. Clone the Repository

git clone https://github.com/PS-41/roommate-matching-app.git
cd roommate-matching-app

------------------------------------------------------------

2. Backend Setup

cd backend
python -m venv .venv

Activate environment:

Mac/Linux:
source .venv/bin/activate

Windows:
.venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

Create .env file inside backend/:

FLASK_ENV=development
PORT=5000
SECRET_KEY=dev_secret_key
JWT_SECRET_KEY=dev_jwt_secret
DATABASE_URL=sqlite:///app.db

Run backend:
python run.py

Backend runs at:
http://localhost:5000

------------------------------------------------------------

3. Frontend Setup

cd frontend
npm install

Create .env inside frontend/:

VITE_API_BASE_URL=http://localhost:5000/api

Run frontend:
npm run dev

Frontend runs at:
http://localhost:5173

------------------------------------------------------------

TESTING THE APPLICATION

1. Register a new user
2. Complete profile (location + preferences REQUIRED)
3. Create a second user
4. Verify:
   - Matches appear on dashboard
   - Connection requests work
   - Messaging works after acceptance

------------------------------------------------------------

KEY DESIGN DECISIONS

- Mutual Compatibility Scoring
  Ensures both users are satisfied, not just one side

- Precomputed Compatibility Cache
  Heavy computation happens on profile update
  Dashboard queries are fast and scalable

- Strict vs Flexible Preferences
  Hard constraints filter users completely
  Soft preferences influence ranking

- Controlled Communication
  Messaging only allowed after mutual acceptance

------------------------------------------------------------

FUTURE IMPROVEMENTS

- Weighted preference importance
- Match explanation system
- Real-time messaging (WebSockets)
- Profile photos and verification
- Notifications (requests/messages)
- PostgreSQL migration
- Cloud deployment (AWS/GCP)

------------------------------------------------------------

REPOSITORY

https://github.com/PS-41/roommate-matching-app

------------------------------------------------------------

AUTHOR

Prakhar Suryavansh  
CSCE 685 – Directed Studies  
Texas A&M University

------------------------------------------------------------

LICENSE

This project is developed for academic purposes.  
You may reuse or extend it with proper attribution.