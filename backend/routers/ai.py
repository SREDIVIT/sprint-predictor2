from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from .. import models, schemas, auth
from ..rag.rag_service import generate_chat_response, analyze_meeting_transcript

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

@router.post("/chat")
def chat_with_copilot(
    request: schemas.ChatRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Assemble contextual state of their project/sprint if requested/applicable
    context_info = {}
    if request.context:
        context_info = request.context
    else:
        # Fallback to gathering active project/sprint status to enrich RAG context
        active_project = db.query(models.Project).first()
        if active_project:
            context_info["project_name"] = active_project.name
            active_sprint = db.query(models.Sprint).filter(
                models.Sprint.project_id == active_project.id,
                models.Sprint.is_active == True
            ).first()
            if active_sprint:
                context_info["sprint_name"] = active_sprint.name
                context_info["sprint_goal"] = active_sprint.goal
                context_info["days_elapsed"] = active_sprint.days_elapsed
                context_info["success_probability"] = active_sprint.success_probability

    response = generate_chat_response(request.message, context_info)
    return response

@router.post("/meeting/upload", response_model=schemas.MeetingOut)
async def upload_meeting(
    project_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    try:
        content = await file.read()
        transcript = content.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read transcript file: {e}"
        )
        
    if not transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript file is empty"
        )
        
    # Analyze transcript
    analysis = analyze_meeting_transcript(transcript)
    
    # Save Meeting
    db_meeting = models.Meeting(
        project_id=project_id,
        title=title,
        transcript=transcript,
        summary=analysis["summary"],
        blockers=analysis["blockers"],
        action_items=analysis["action_items"],
        responsible_developers=analysis["responsible_developers"]
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # Add notifications for responsible developers or blockers found
    for dev_name in analysis["responsible_developers"]:
        # Find developer user in project to notify them
        dev_user = db.query(models.User).filter(
            models.User.name.like(f"%{dev_name}%"),
            models.User.role == "developer"
        ).first()
        if dev_user:
            notif = models.Notification(
                user_id=dev_user.id,
                title="Action Item from Meeting",
                message=f"You have been assigned action items in meeting '{title}'. Check meeting reports.",
                type="info"
            )
            db.add(notif)
            
    db.commit()
    return db_meeting
