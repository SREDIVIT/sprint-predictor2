from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

try:
    from database import get_db
    import models, schemas, auth
except (ImportError, ValueError):
    from ..database import get_db
    from .. import models, schemas, auth


router = APIRouter(prefix="/api/tasks", tags=["Task Management"])

@router.get("", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: Optional[int] = None,
    sprint_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    if project_id is not None:
        query = query.filter(models.Task.project_id == project_id)
    if sprint_id is not None:
        query = query.filter(models.Task.sprint_id == sprint_id)
    return query.all()

@router.post("", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Any user (Developer or Scrum Master) can create a task in project/sprint
    db_task = models.Task(
        project_id=task_in.project_id,
        sprint_id=task_in.sprint_id,
        title=task_in.title,
        description=task_in.description,
        assigned_developer_id=task_in.assigned_developer_id,
        story_points=task_in.story_points,
        priority=task_in.priority,
        due_date=task_in.due_date,
        status=task_in.status or "Backlog"
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Notify developer if assigned
    if task_in.assigned_developer_id:
        notif = models.Notification(
            user_id=task_in.assigned_developer_id,
            title="Task Assigned",
            message=f"You have been assigned the task: '{task_in.title}'",
            type="info"
        )
        db.add(notif)
        db.commit()
        
    return db_task

@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Check status transition rule: "Only the assigned developer can update task status."
    if task_in.status is not None and db_task.status != task_in.status:
        # Enforce that if user is a developer, they must be the assigned developer to change the status
        if current_user.role == "developer" and db_task.assigned_developer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned developer can update the task status"
            )
            
    # Process assignment updates
    old_assignee_id = db_task.assigned_developer_id
    
    if task_in.title is not None:
        db_task.title = task_in.title
    if task_in.description is not None:
        db_task.description = task_in.description
    if task_in.assigned_developer_id is not None:
        db_task.assigned_developer_id = task_in.assigned_developer_id
    if task_in.story_points is not None:
        db_task.story_points = task_in.story_points
    if task_in.priority is not None:
        db_task.priority = task_in.priority
    if task_in.due_date is not None:
        db_task.due_date = task_in.due_date
    if task_in.status is not None:
        db_task.status = task_in.status
    if task_in.sprint_id is not None:
        db_task.sprint_id = task_in.sprint_id
        
    db.commit()
    db.refresh(db_task)
    
    # Notify developer if assignment changed
    if task_in.assigned_developer_id and task_in.assigned_developer_id != old_assignee_id:
        notif = models.Notification(
            user_id=task_in.assigned_developer_id,
            title="Task Assigned",
            message=f"You have been assigned the task: '{db_task.title}'",
            type="info"
        )
        db.add(notif)
        db.commit()
        
    return db_task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

# --- Task Comments ---
@router.post("/{task_id}/comments", response_model=schemas.CommentOut)
def add_comment(
    task_id: int,
    comment_in: schemas.CommentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db_comment = models.TaskComment(
        task_id=task_id,
        user_name=current_user.name,
        comment=comment_in.comment
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@router.get("/{task_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return task.comments
