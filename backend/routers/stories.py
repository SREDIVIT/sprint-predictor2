from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas, auth
from ..ml.predictor import predict_sprint_risk

router = APIRouter(prefix="/api/stories", tags=["User Story Backlog"])

@router.get("", response_model=List[schemas.UserStoryOut])
def list_stories(
    project_id: Optional[int] = None,
    sprint_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.UserStory)
    if project_id is not None:
        query = query.filter(models.UserStory.project_id == project_id)
    if sprint_id is not None:
        query = query.filter(models.UserStory.sprint_id == sprint_id)
    return query.all()

@router.post("", response_model=schemas.UserStoryOut, status_code=status.HTTP_201_CREATED)
def create_story(
    story_in: schemas.UserStoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_story = models.UserStory(
        project_id=story_in.project_id,
        sprint_id=story_in.sprint_id,
        title=story_in.title,
        description=story_in.description,
        developer_id=story_in.developer_id,
        priority=story_in.priority,
        points=story_in.points,
        status=story_in.status or "To Do",
        health="healthy",
        bugs=story_in.bugs or 0,
        hours_estimated=story_in.hours_estimated or 0.0,
        hours_spent=story_in.hours_spent or 0.0,
        days_remaining=story_in.days_remaining or 5,
        risk_percent=10.0,
        completion_probability=90.0,
        reasons=["Initial story backlog creation"],
        recommendation="Proceed with standard sprint planning."
    )
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

@router.put("/{story_id}", response_model=schemas.UserStoryOut)
def update_story(
    story_id: int,
    story_in: schemas.UserStoryUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_story = db.query(models.UserStory).filter(models.UserStory.id == story_id).first()
    if not db_story:
        raise HTTPException(status_code=404, detail="User story not found")
        
    if story_in.title is not None:
        db_story.title = story_in.title
    if story_in.description is not None:
        db_story.description = story_in.description
    if story_in.priority is not None:
        db_story.priority = story_in.priority
    if story_in.points is not None:
        db_story.points = story_in.points
    if story_in.status is not None:
        db_story.status = story_in.status
    if story_in.sprint_id is not None:
        db_story.sprint_id = story_in.sprint_id
    if story_in.developer_id is not None:
        db_story.developer_id = story_in.developer_id
    if story_in.bugs is not None:
        db_story.bugs = story_in.bugs
    if story_in.hours_estimated is not None:
        db_story.hours_estimated = story_in.hours_estimated
    if story_in.hours_spent is not None:
        db_story.hours_spent = story_in.hours_spent
    if story_in.days_remaining is not None:
        db_story.days_remaining = story_in.days_remaining
        
    # Dynamically update AI status attributes during updates
    old_health = db_story.health
    if db_story.bugs > 4:
        db_story.health = "critical"
        db_story.risk_percent = 75.0
        db_story.completion_probability = 30.0
        db_story.reasons = ["High bug density.", "Progress bottlenecked by QA triage."]
        db_story.recommendation = "Reassign assistance or declare QA bug-bash focus."
    elif db_story.status == "Blocked":
        db_story.health = "critical"
        db_story.risk_percent = 90.0
        db_story.completion_probability = 10.0
        db_story.reasons = ["Logged blocker halts development."]
        db_story.recommendation = "Hold Scrum Master focus session to resolve dependencies."
    elif db_story.hours_spent > db_story.hours_estimated * 1.2 and db_story.status != "Done":
        db_story.health = "warning"
        db_story.risk_percent = 55.0
        db_story.completion_probability = 50.0
        db_story.reasons = ["Effort spent exceeds original estimate."]
        db_story.recommendation = "Pair program with a senior developer to expedite feature release."
    else:
        db_story.health = "healthy"
        db_story.risk_percent = 12.0
        db_story.completion_probability = 92.0
        db_story.reasons = ["Progress conforms to elapsed schedule."]
        db_story.recommendation = "Continue sprint execution as planned."
        
    # Dispatch warning/critical notification to Scrum Masters if status degraded
    if db_story.health in ["warning", "critical"] and db_story.health != old_health:
        scrum_masters = db.query(models.User).filter(models.User.role == "scrum").all()
        for sm in scrum_masters:
            notif = models.Notification(
                user_id=sm.id,
                title=f"Story Health Alert: {db_story.health.capitalize()}",
                message=f"User Story '{db_story.title}' was flagged with {db_story.health} health status. Risk is {db_story.risk_percent}%.",
                type=db_story.health,
                read=False
            )
            db.add(notif)
            
    db.commit()
    db.refresh(db_story)
    return db_story

@router.delete("/{story_id}")
def delete_story(
    story_id: int,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_story = db.query(models.UserStory).filter(models.UserStory.id == story_id).first()
    if not db_story:
        raise HTTPException(status_code=404, detail="User story not found")
        
    db.delete(db_story)
    db.commit()
    return {"message": "User story deleted successfully"}

@router.get("/{story_id}/ai-analysis")
def analyze_user_story(
    story_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_story = db.query(models.UserStory).filter(models.UserStory.id == story_id).first()
    if not db_story:
        raise HTTPException(status_code=404, detail="User story not found")
        
    return {
        "story_id": db_story.id,
        "title": db_story.title,
        "health": db_story.health,
        "risk_percent": db_story.risk_percent,
        "completion_probability": db_story.completion_probability,
        "reasons": db_story.reasons,
        "recommendation": db_story.recommendation
    }
