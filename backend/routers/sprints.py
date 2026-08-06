from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from ..database import get_db
from .. import models, schemas, auth
from ..ml.predictor import predict_sprint_risk

router = APIRouter(prefix="/api/sprints", tags=["Sprint Planning"])

@router.get("", response_model=List[schemas.SprintOut])
def list_sprints(
    project_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Sprint)
    if project_id is not None:
        query = query.filter(models.Sprint.project_id == project_id)
    return query.all()

@router.post("", response_model=schemas.SprintOut, status_code=status.HTTP_201_CREATED)
def create_sprint(
    sprint_in: schemas.SprintCreate,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == sprint_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    days = (sprint_in.end_date - sprint_in.start_date).days
    if days <= 0:
        raise HTTPException(status_code=400, detail="End date must be after start date")
        
    db_sprint = models.Sprint(
        project_id=sprint_in.project_id,
        name=sprint_in.name,
        goal=sprint_in.goal,
        capacity=sprint_in.capacity,
        start_date=sprint_in.start_date,
        end_date=sprint_in.end_date,
        is_active=False,
        days_total=days,
        days_elapsed=0,
        success_probability=100.0
    )
    db.add(db_sprint)
    db.commit()
    db.refresh(db_sprint)
    return db_sprint

@router.put("/{sprint_id}", response_model=schemas.SprintOut)
def update_sprint(
    sprint_id: int,
    sprint_in: schemas.SprintUpdate,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_sprint = db.query(models.Sprint).filter(models.Sprint.id == sprint_id).first()
    if not db_sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
        
    if sprint_in.name is not None:
        db_sprint.name = sprint_in.name
    if sprint_in.goal is not None:
        db_sprint.goal = sprint_in.goal
    if sprint_in.capacity is not None:
        db_sprint.capacity = sprint_in.capacity
    if sprint_in.start_date is not None:
        db_sprint.start_date = sprint_in.start_date
    if sprint_in.end_date is not None:
        db_sprint.end_date = sprint_in.end_date
        
    if sprint_in.start_date is not None or sprint_in.end_date is not None:
        db_sprint.days_total = (db_sprint.end_date - db_sprint.start_date).days
        
    if sprint_in.days_elapsed is not None:
        db_sprint.days_elapsed = sprint_in.days_elapsed
        
    if sprint_in.is_active is not None:
        db_sprint.is_active = sprint_in.is_active
        if sprint_in.is_active:
            # Set other sprints in this project to inactive
            db.query(models.Sprint).filter(
                models.Sprint.project_id == db_sprint.project_id,
                models.Sprint.id != sprint_id
            ).update({"is_active": False})
            
            # Set project's current sprint id
            project = db.query(models.Project).filter(models.Project.id == db_sprint.project_id).first()
            if project:
                project.current_sprint_id = sprint_id
                
    db.commit()
    db.refresh(db_sprint)
    return db_sprint

@router.post("/{sprint_id}/predict-risk", response_model=schemas.RiskPredictionOut)
def trigger_sprint_risk_prediction(
    sprint_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_sprint = db.query(models.Sprint).filter(models.Sprint.id == sprint_id).first()
    if not db_sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
        
    # Dynamically compute features from database
    sprint_duration = db_sprint.days_total
    
    # Team size = count of developers in project members
    team_size = db.query(models.project_members).filter(
        models.project_members.c.project_id == db_sprint.project_id
    ).count()
    if team_size == 0:
        team_size = 5  # default fallback if no devs assigned yet
        
    # User stories metrics
    stories = db.query(models.UserStory).filter(models.UserStory.sprint_id == sprint_id).all()
    story_points = sum(s.points for s in stories)
    completed_stories = sum(1 for s in stories if s.status == "Done")
    carry_forward_tasks = sum(1 for s in stories if s.status != "Done")
    bugs = sum(s.bugs for s in stories)
    blocked_tasks = sum(1 for s in stories if s.status == "Blocked")
    
    # Simple heuristic features
    team_experience = 4.5
    requirement_changes = 1
    previous_velocity = 35
    
    # Call ML predictor
    prediction_result = predict_sprint_risk(
        sprint_duration=sprint_duration,
        team_size=team_size,
        story_points=story_points,
        completed_stories=completed_stories,
        carry_forward_tasks=carry_forward_tasks,
        bugs=bugs,
        team_experience=team_experience,
        blocked_tasks=blocked_tasks,
        requirement_changes=requirement_changes,
        previous_velocity=previous_velocity
    )
    
    # Update sprint success probability
    success_prob = max(0.0, 100.0 - prediction_result["risk_percent"])
    db_sprint.success_probability = success_prob
    db.commit()
    
    # Save RiskPrediction
    db_pred = models.RiskPrediction(
        sprint_id=sprint_id,
        risk_percent=prediction_result["risk_percent"],
        risk_category=prediction_result["risk_category"],
        confidence_score=prediction_result["confidence_score"],
        explanation=prediction_result["explanation"],
        recommendations=prediction_result["recommendations"]
    )
    db.add(db_pred)
    
    # Create notification if risk is high
    if prediction_result["risk_category"] == "High":
        # Notify Scrum Master and project members
        project = db_sprint.project
        users_to_notify = [current_user]  # Notify triggerer
        if project:
            for member in project.members:
                if member.id not in [u.id for u in users_to_notify]:
                    users_to_notify.append(member)
            # Find Scrum Masters to notify
            sms = db.query(models.User).filter(models.User.role == "scrum").all()
            for sm in sms:
                if sm.id not in [u.id for u in users_to_notify]:
                    users_to_notify.append(sm)
                    
        for u in users_to_notify:
            db_notif = models.Notification(
                user_id=u.id,
                title="High Sprint Risk Detected",
                message=f"Sprint '{db_sprint.name}' is flagged as HIGH RISK ({prediction_result['risk_percent']}%). Check Copilot Recommendations.",
                type="critical"
            )
            db.add(db_notif)
            
    db.commit()
    db.refresh(db_pred)
    return db_pred
