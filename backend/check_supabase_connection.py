import sys
import os
from sqlalchemy import text
from app.db.session import SessionLocal

def verify_connection():
    print("Connecting to Supabase Database...")
    db = SessionLocal()
    try:
        # 1. Check basic connection
        print("Checking connection...")
        db.execute(text("SELECT 1;"))
        print("[OK] Connection established!")

        # 2. Check if tables are there
        result = db.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
        )).fetchall()
        tables = [row[0] for row in result]
        print(f"[OK] Found public tables: {', '.join(tables)}")

        # 3. Insert a temporary check record
        test_username = "supabase_check_user"
        test_email = "check@supabase.io"
        
        # Clean up existing verification user if any
        db.execute(text("DELETE FROM users WHERE username = :username;"), {"username": test_username})
        db.commit()

        # Insert user
        db.execute(text(
            "INSERT INTO users (username, email, hashed_password, created_at, updated_at) "
            "VALUES (:username, :email, 'temp_hash', NOW(), NOW());"
        ), {"username": test_username, "email": test_email})
        db.commit()
        print(f"[OK] Successfully inserted user '{test_username}' with email '{test_email}' into the database!")

        # 4. Read back
        user_row = db.execute(text(
            "SELECT id, username, email FROM users WHERE username = :username;"
        ), {"username": test_username}).fetchone()
        
        if user_row:
            print("\nVerification User details in database:")
            print(f" - ID: {user_row[0]}")
            print(f" - Username: {user_row[1]}")
            print(f" - Email: {user_row[2]}")
            print("\n--------------------------------------------------------------")
            print("How to check on Supabase Dashboard:")
            print("1. Go to: https://supabase.com/dashboard/project/ihzbnaecybeovlainsqt")
            print("2. Click on 'Table Editor' in the left sidebar.")
            print("3. Click on the 'users' table.")
            print(f"4. You will see the record for '{test_username}' in the table rows!")
            print("--------------------------------------------------------------\n")
        else:
            print("[ERROR] Failed to verify user insert.")

    except Exception as e:
        print(f"[ERROR] Error connecting to database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_connection()
