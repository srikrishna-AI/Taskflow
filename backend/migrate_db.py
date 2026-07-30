from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.database_url)
    with engine.connect() as conn:
        print("Running database migrations...")
        
        # Add meta_data to tasks
        try:
            conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS meta_data JSON;"))
            conn.commit()
            print("Successfully added meta_data JSON column to tasks table.")
        except Exception as e:
            print("Tasks table migration check:", e)
            
        # Add meta_data to categories
        try:
            conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_data JSON;"))
            conn.commit()
            print("Successfully added meta_data JSON column to categories table.")
        except Exception as e:
            print("Categories table migration check:", e)
            
        print("Database migrations applied successfully!")

if __name__ == "__main__":
    migrate()
