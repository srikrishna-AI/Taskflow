# Task Management API

This backend provides a FastAPI-based task management service with PostgreSQL persistence, JWT authentication, and SQLAlchemy models.

## Features
- User registration/login with JWT tokens
- Task CRUD with filtering and pagination
- Category management
- Task statistics
- Alembic migrations

## Setup
1. Create and activate a virtual environment:
   - `python -m venv .venv`
   - `.venv\Scripts\activate` on Windows
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and update the values.
4. Start PostgreSQL and create the database `taskmanagement`.
5. Run migrations: `alembic upgrade head`
6. Start the server: `uvicorn app.main:app --reload`

## Testing
- Run `pytest`
