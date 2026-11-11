from database import engine

try:
    with engine.connect() as connection:
        print("MySQL connected successfully!")
except Exception as e:
    print("Database connection failed:", e)