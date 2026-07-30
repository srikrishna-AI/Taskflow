# Task Management Full-Stack App

This workspace contains a full-stack task management application with:
- FastAPI backend with PostgreSQL and SQLAlchemy
- React frontend with routing and auth

## Backend
- API docs: http://localhost:8000/docs
- Create and activate a virtual environment in the backend folder:
  - `python -m venv .venv`
  - `.venv\Scripts\activate` on Windows
  - `pip install -r requirements.txt`
- Copy `.env.example` to `.env` and update the values.
- Run the server with `uvicorn app.main:app --reload`

## Frontend
- Run locally from the frontend folder with `npm install` and `npm run dev`

## Notes
- Make sure PostgreSQL is running and the database from the backend settings exists.
