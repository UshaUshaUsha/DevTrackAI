
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ai_service import analyze_issue
from database import engine, Base
from dependencies import get_db

from schemas import IssueCreate, IssueResponse
from user_schemas import UserCreate, UserResponse, UserLogin

from models import User, Issue, AIAnalysis

from crud import (
    create_issue,
    get_user_issues,
    get_user_issue_by_id,
    update_user_issue,
    delete_user_issue
)

from user_crud import create_user, get_user_by_email
from auth import verify_password, create_access_token
from security import get_current_user


# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DevTrackAI")


# HOME
@app.get("/")
def home():
    return {"message": "Welcome to DevTrackAI!"}


# USER REGISTRATION
@app.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = get_user_by_email(db, user.email)

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return create_user(db, user)


# USER LOGIN
@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = get_user_by_email(db, user.email)

    if not db_user or not verify_password(
        user.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token({
        "sub": db_user.email
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# CREATE ISSUE
@app.post("/issues", response_model=IssueResponse)
def create_new_issue(
    issue: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_issue(
        db,
        issue,
        user_id=current_user.id
    )


# GET ALL USER ISSUES
@app.get("/issues", response_model=list[IssueResponse])
def read_issues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_issues(db, current_user.id)


# FILTER AND PAGINATE ISSUES
@app.get("/issues/filter", response_model=list[IssueResponse])
def filter_issues(
    priority: str = None,
    status: str = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Issue).filter(
        Issue.user_id == current_user.id
    )

    if priority:
        query = query.filter(Issue.priority == priority)

    if status:
        query = query.filter(Issue.status == status)

    return query.offset(skip).limit(limit).all()


# GET ISSUE BY ID
@app.get("/issues/{issue_id}", response_model=IssueResponse)
def read_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = get_user_issue_by_id(
        db,
        issue_id,
        current_user.id
    )

    if issue is None:
        raise HTTPException(
            status_code=404,
            detail="Issue not found"
        )

    return issue


# UPDATE ISSUE
@app.put("/issues/{issue_id}", response_model=IssueResponse)
def edit_issue(
    issue_id: int,
    issue: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = update_user_issue(
        db,
        issue_id,
        current_user.id,
        issue
    )

    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Issue not found"
        )

    return updated


# DELETE ISSUE
@app.delete("/issues/{issue_id}")
def remove_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = delete_user_issue(
        db,
        issue_id,
        current_user.id
    )

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Issue not found"
        )

    return {
        "message": "Issue deleted successfully"
    }


# AI ISSUE ANALYSIS AND AUTOMATIC PRIORITY UPDATE
@app.post("/issues/{issue_id}/analyze")
def analyze_issue_endpoint(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = get_user_issue_by_id(
        db,
        issue_id,
        current_user.id
    )

    if issue is None:
        raise HTTPException(
            status_code=404,
            detail="Issue not found"
        )

    try:
        # Analyze issue using Gemini
        analysis = analyze_issue(
            title=issue.title,
            description=issue.description
        )

        # Validate suggested priority
        suggested_priority = analysis.get(
            "suggested_priority"
        )

        allowed_priorities = {"Low", "Medium", "High"}

        priority_updated = False

        if suggested_priority in allowed_priorities:
            issue.priority = suggested_priority
            priority_updated = True

        # Save AI analysis in MySQL
        saved_analysis = AIAnalysis(
            issue_id=issue.id,
            category=analysis["category"],
            suggested_priority=suggested_priority,
            root_cause=analysis["root_cause"],
            troubleshooting_steps=analysis["troubleshooting_steps"]
        )

        db.add(saved_analysis)
        db.commit()
        db.refresh(saved_analysis)

        return {
            "message": "AI analysis saved successfully",
            "issue_id": issue.id,
            "analysis_id": saved_analysis.id,
            "priority_updated": priority_updated,
            "updated_priority": issue.priority,
            "ai_analysis": analysis
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"AI analysis or database storage failed: {str(e)}"
        )


# GET SAVED AI ANALYSIS
@app.get("/issues/{issue_id}/analysis")
def get_saved_analysis(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = get_user_issue_by_id(
        db,
        issue_id,
        current_user.id
    )

    if issue is None:
        raise HTTPException(
            status_code=404,
            detail="Issue not found"
        )

    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.issue_id == issue_id)
        .order_by(AIAnalysis.created_at.desc())
        .all()
    )

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="No AI analysis found for this issue"
        )

    return {
        "issue_id": issue_id,
        "total_analyses": len(analysis),
        "analyses": [
            {
                "analysis_id": item.id,
                "category": item.category,
                "suggested_priority": item.suggested_priority,
                "root_cause": item.root_cause,
                "troubleshooting_steps": item.troubleshooting_steps,
                "created_at": item.created_at
            }
            for item in analysis
        ]
    }



# AI-POWERED DASHBOARD SUMMARY

@app.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(func.count(Issue.id)).filter(
        Issue.user_id == current_user.id
    ).scalar()

    status_counts = db.query(
        Issue.status,
        func.count(Issue.id)
    ).filter(
        Issue.user_id == current_user.id
    ).group_by(Issue.status).all()

    priority_counts = db.query(
        Issue.priority,
        func.count(Issue.id)
    ).filter(
        Issue.user_id == current_user.id
    ).group_by(Issue.priority).all()

    # Retrieve saved AI analyses for this user's issues
    analyses = db.query(AIAnalysis).join(
        Issue,
        AIAnalysis.issue_id == Issue.id
    ).filter(
        Issue.user_id == current_user.id
    ).all()

    category_counts = {}

    for analysis in analyses:
        category = analysis.category
        category_counts[category] = (
            category_counts.get(category, 0) + 1
        )

    most_common_category = (
        max(category_counts, key=category_counts.get)
        if category_counts else None
    )

    high_priority = next(
        (count for priority, count in priority_counts
         if priority == "High"),
        0
    )

    open_issues = next(
        (count for status, count in status_counts
         if status.lower() == "open"),
        0
    )

    recommendations = []

    if high_priority > 0:
        recommendations.append(
            f"Investigate the {high_priority} high-priority issues first."
        )

    if open_issues > 0:
        recommendations.append(
            f"Follow up on {open_issues} open issues."
        )

    if most_common_category:
        recommendations.append(
            f"{most_common_category} is the most common AI-detected issue category."
        )

    if not recommendations:
        recommendations.append(
            "No outstanding issues. Keep monitoring the system."
        )

    return {
        "total_issues": total,
        "issues_by_status": {
            status: count for status, count in status_counts
        },
        "issues_by_priority": {
            priority: count for priority, count in priority_counts
        },
        "ai_insights": {
            "total_analyzed": len(analyses),
            "category_distribution": category_counts,
            "most_common_category": most_common_category,
            "recommendations": recommendations
        }
    }
