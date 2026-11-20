
from sqlalchemy.orm import Session
from models import Task
from task_schemas import TaskCreate, TaskUpdate


def create_task(db: Session, task: TaskCreate, user_id: int):
    new_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        project_id=task.project_id,
        assigned_to=task.assigned_to,
        created_by=user_id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def get_user_tasks(db: Session, user_id: int):
    return db.query(Task).filter(
        Task.created_by == user_id
    ).order_by(Task.created_at.desc()).all()


def get_task(db: Session, task_id: int, user_id: int):
    return db.query(Task).filter(
        Task.id == task_id,
        Task.created_by == user_id
    ).first()


def update_task(db: Session, task: Task, updates: TaskUpdate):
    update_data = updates.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task):
    db.delete(task)
    db.commit()
    return True
