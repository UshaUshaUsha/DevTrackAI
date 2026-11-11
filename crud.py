from sqlalchemy.orm import Session
from models import Issue
from schemas import IssueCreate

#Create – add an issue.
# Read – retrieve issues.
# Update – modify an issue.
# Delete – remove an issue.

def create_issue(db: Session, issue, user_id: int):
    db_issue = Issue(**issue.model_dump(), user_id=user_id)
    db.add(db_issue)        #Adds issue to database session
    db.commit()             #Saves changes permanently
    db.refresh(db_issue)    #Gets updated database values
    return db_issue

def get_all_issues(db: Session):
    return db.query(Issue).all()      #Retrieves database records

def get_issue_by_id(db: Session, issue_id: int):                  # .first() Returns first matching record
    return db.query(Issue).filter(Issue.id == issue_id).first()   # .filter()Searches for a specific issue

def update_issue(db: Session, issue_id: int, issue_data: IssueCreate):
    db_issue = get_issue_by_id(db, issue_id)

    if db_issue is None:
        return None

    for key, value in issue_data.model_dump().items():
        setattr(db_issue, key, value)

    db.commit()
    db.refresh(db_issue)
    return db_issue


def delete_issue(db: Session, issue_id: int):
    db_issue = get_issue_by_id(db, issue_id)

    if db_issue is None:
        return False

    db.delete(db_issue)
    db.commit()
    return True

def get_filtered_issues(
    db: Session,
    priority: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 10
):
    query = db.query(Issue)
    if priority:
        query = query.filter(Issue.priority == priority)
    if status:
        query = query.filter(Issue.status == status)
    return query.offset(skip).limit(limit).all()

def get_user_issues(db: Session, user_id: int):
    return db.query(Issue).filter(
        Issue.user_id == user_id
    ).all()


def get_user_issue_by_id(db: Session, issue_id: int, user_id: int):
    return db.query(Issue).filter(
        Issue.id == issue_id,
        Issue.user_id == user_id
    ).first()


def update_user_issue(db: Session, issue_id: int, user_id: int, issue_data):
    db_issue = get_user_issue_by_id(db, issue_id, user_id)

    if db_issue is None:
        return None

    for key, value in issue_data.model_dump().items():
        setattr(db_issue, key, value)

    db.commit()
    db.refresh(db_issue)
    return db_issue


def delete_user_issue(db: Session, issue_id: int, user_id: int):
    db_issue = get_user_issue_by_id(db, issue_id, user_id)

    if db_issue is None:
        return None

    db.delete(db_issue)
    db.commit()
    return db_issue