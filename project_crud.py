
from sqlalchemy.orm import Session
from models import Project
from project_schemas import ProjectCreate, ProjectUpdate


def create_project(db: Session, project: ProjectCreate, owner_id: int):
    new_project = Project(
        name=project.name,
        description=project.description,
        owner_id=owner_id
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


def get_user_projects(db: Session, owner_id: int):
    return db.query(Project).filter(
        Project.owner_id == owner_id
    ).order_by(Project.created_at.desc()).all()


def get_project(db: Session, project_id: int, owner_id: int):
    return db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == owner_id
    ).first()


def update_project(
    db: Session,
    project: Project,
    updates: ProjectUpdate
):
    update_data = updates.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)

    return project


def delete_project(db: Session, project: Project):
    db.delete(project)
    db.commit()

    return True
