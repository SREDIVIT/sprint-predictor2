from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

try:
    from database import get_db
    import models, schemas, auth
except (ImportError, ValueError):
    from ..database import get_db
    from .. import models, schemas, auth


router = APIRouter(prefix="/api/developers", tags=["Developer Management"])

@router.get("", response_model=List[schemas.UserOut])
def list_developers(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    developers = db.query(models.User).filter(models.User.role == "developer").all()
    for dev in developers:
        stories = db.query(models.UserStory).filter(models.UserStory.developer_id == dev.id).all()
        tasks = db.query(models.Task).filter(models.Task.assigned_developer_id == dev.id).all()
        
        assigned_cnt = len(stories) + len(tasks)
        completed_cnt = sum(1 for s in stories if s.status == "Done") + sum(1 for t in tasks if t.status in ["Done", "Completed"])
        
        active_story = next((s.title for s in stories if s.status != "Done"), None)
        if not active_story:
            active_story = next((t.title for t in tasks if t.status not in ["Done", "Completed"]), None)
            
        dev.assigned_count = assigned_cnt
        dev.completed_count = completed_cnt
        dev.current_story = active_story if active_story else ("No active story assigned" if assigned_cnt == 0 else "All tasks completed")
        
        if assigned_cnt == 0:
            dev.performance = 100
            dev.health = "healthy"
        else:
            perf = int(round((completed_cnt / assigned_cnt) * 100))
            dev.performance = perf
            if perf >= 85:
                dev.health = "healthy"
            elif perf >= 70:
                dev.health = "warning"
            else:
                dev.health = "critical"

    return developers

@router.post("", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_developer(
    dev_in: schemas.DeveloperCreate,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == dev_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
        
    hashed_password = auth.get_password_hash(dev_in.temporary_password)
    
    db_dev = models.User(
        name=dev_in.name,
        email=dev_in.email.lower(),
        hashed_password=hashed_password,
        role="developer",
        first_login=True,  # Forced to reset on first login
        is_disabled=False
    )
    db.add(db_dev)
    db.commit()
    db.refresh(db_dev)

    db_dev.assigned_count = 0
    db_dev.completed_count = 0
    db_dev.current_story = "No active story assigned"
    db_dev.performance = 100
    db_dev.health = "healthy"
    
    # Create notification for audit
    notification = models.Notification(
        user_id=current_user.id,
        title="Developer Created",
        message=f"Developer account created for {dev_in.name} ({dev_in.email})",
        type="success"
    )
    db.add(notification)
    db.commit()

    
    return db_dev

@router.put("/{dev_id}", response_model=schemas.UserOut)
def edit_developer(
    dev_id: int,
    dev_in: schemas.DeveloperUpdate,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_dev = db.query(models.User).filter(models.User.id == dev_id, models.User.role == "developer").first()
    if not db_dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found"
        )
        
    if dev_in.name is not None:
        db_dev.name = dev_in.name
    if dev_in.email is not None:
        # Check duplicate emails
        email_lower = dev_in.email.lower()
        if email_lower != db_dev.email:
            existing = db.query(models.User).filter(models.User.email == email_lower).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            db_dev.email = email_lower
    if dev_in.is_disabled is not None:
        db_dev.is_disabled = dev_in.is_disabled
        
    db.commit()
    db.refresh(db_dev)
    return db_dev

@router.delete("/{dev_id}")
def delete_developer(
    dev_id: int,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_dev = db.query(models.User).filter(models.User.id == dev_id, models.User.role == "developer").first()
    if not db_dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found"
        )
        
    db.delete(db_dev)
    db.commit()
    return {"message": "Developer deleted successfully"}

@router.post("/reset-password")
def reset_developer_password(
    data: schemas.DeveloperResetPassword,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_dev = db.query(models.User).filter(models.User.email == data.email.lower(), models.User.role == "developer").first()
    if not db_dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found"
        )
        
    db_dev.hashed_password = auth.get_password_hash(data.temporary_password)
    db_dev.first_login = True  # force password change again
    db.commit()
    return {"message": "Developer password reset successfully"}

@router.post("/standup", response_model=schemas.DailyStandupOut)
def submit_daily_standup(
    standup_in: schemas.DailyStandupCreate,
    current_user: models.User = Depends(auth.get_current_active_developer),
    db: Session = Depends(get_db)
):
    db_standup = models.DailyStandup(
        developer_id=current_user.id,
        yesterday_work=standup_in.yesterday_work,
        today_plan=standup_in.today_plan,
        blockers=standup_in.blockers
    )
    db.add(db_standup)
    db.commit()
    db.refresh(db_standup)
    
    # Notify Scrum Masters of any active blockers
    if standup_in.blockers and standup_in.blockers.strip():
        sms = db.query(models.User).filter(models.User.role == "scrum").all()
        for sm in sms:
            notif = models.Notification(
                user_id=sm.id,
                title=f"Blocker logged by {current_user.name}",
                message=f"Developer {current_user.name} reported a blocker: '{standup_in.blockers}'",
                type="warning"
            )
            db.add(notif)
        db.commit()
        
    return db_standup
