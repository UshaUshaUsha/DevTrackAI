
from getpass import getpass
from database import SessionLocal
from models import User
from auth import hash_password

db = SessionLocal()

try:
    email = "usha@example.com"

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        print("User not found!")
    else:
        new_password = getpass("Enter your new password: ")
        confirm_password = getpass("Confirm your new password: ")

        if new_password != confirm_password:
            print("Passwords do not match!")
        elif len(new_password) < 8:
            print("Password must be at least 8 characters!")
        else:
            user.hashed_password = hash_password(new_password)
            db.commit()
            print("Password reset successfully!")

finally:
    db.close()
