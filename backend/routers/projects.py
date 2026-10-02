from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

try:
    from database import get_db
    import models, schemas, auth
except (ImportError, ValueError):
    from ..database import get_db
    from .. import models, schemas, auth


router = APIRouter(prefix="/api/projects", tags=["Project Management"])

class DeveloperAssign(BaseModel):
    developer_id: int

@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Developers see projects they belong to, Scrum Master sees all
    if current_user.role == "scrum":
        projects = db.query(models.Project).all()
    else:
        projects = current_user.projects
        
    out_projects = []
    for p in projects:
        # Calculate active (non-disabled) developers count
        active_members = [m for m in p.members if not m.is_disabled]
        proj_out = schemas.ProjectOut(
            id=p.id,
            name=p.name,
            description=p.description,
            current_sprint_id=p.current_sprint_id,
            color=p.color,
            completion=p.completion,
            ai_health=p.ai_health,
            developer_count=len(active_members),
            developer_ids=[m.id for m in active_members]
        )
        out_projects.append(proj_out)
        
    return out_projects

@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    proj_in: schemas.ProjectCreate,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    existing = db.query(models.Project).filter(models.Project.name == proj_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project with this name already exists"
        )
        
    db_proj = models.Project(
        name=proj_in.name,
        description=proj_in.description,
        color=proj_in.color or "from-violet-500 to-fuchsia-500",
        completion=0.0,
        ai_health=100.0
    )
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return schemas.ProjectOut(
        id=db_proj.id,
        name=db_proj.name,
        description=db_proj.description,
        current_sprint_id=db_proj.current_sprint_id,
        color=db_proj.color,
        completion=db_proj.completion,
        ai_health=db_proj.ai_health,
        developer_count=0,
        developer_ids=[]
    )

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    proj_in: schemas.ProjectUpdate,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    if proj_in.name is not None:
        existing = db.query(models.Project).filter(models.Project.name == proj_in.name, models.Project.id != project_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project with this name already exists"
            )
        db_proj.name = proj_in.name
    if proj_in.description is not None:
        db_proj.description = proj_in.description
    if proj_in.color is not None:
        db_proj.color = proj_in.color
    if proj_in.current_sprint_id is not None:
        db_proj.current_sprint_id = proj_in.current_sprint_id
    if proj_in.completion is not None:
        db_proj.completion = proj_in.completion
    if proj_in.ai_health is not None:
        db_proj.ai_health = proj_in.ai_health
        
    db.commit()
    db.refresh(db_proj)
    
    active_members = [m for m in db_proj.members if not m.is_disabled]
    return schemas.ProjectOut(
        id=db_proj.id,
        name=db_proj.name,
        description=db_proj.description,
        current_sprint_id=db_proj.current_sprint_id,
        color=db_proj.color,
        completion=db_proj.completion,
        ai_health=db_proj.ai_health,
        developer_count=len(active_members),
        developer_ids=[m.id for m in active_members]
    )

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    db.delete(db_proj)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/{project_id}/developers")
def assign_developer_to_project(
    project_id: int,
    assign_data: DeveloperAssign,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db_dev = db.query(models.User).filter(models.User.id == assign_data.developer_id, models.User.role == "developer").first()
    if not db_dev:
        raise HTTPException(status_code=404, detail="Developer not found")
        
    # Check if already assigned
    is_assigned = db.query(models.project_members).filter(
        models.project_members.c.project_id == project_id,
        models.project_members.c.developer_id == assign_data.developer_id
    ).first()
    
    if not is_assigned:
        db.execute(
            models.project_members.insert().values(
                project_id=project_id,
                developer_id=assign_data.developer_id
            )
        )
        db.commit()
        
    return {"message": "Developer assigned to project successfully"}

@router.delete("/{project_id}/developers/{developer_id}")
def remove_developer_from_project(
    project_id: int,
    developer_id: int,
    current_user: models.User = Depends(auth.get_current_active_scrum_master),
    db: Session = Depends(get_db)
):
    db_proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    is_assigned = db.query(models.project_members).filter(
        models.project_members.c.project_id == project_id,
        models.project_members.c.developer_id == developer_id
    ).first()
    
    if is_assigned:
        db.execute(
            models.project_members.delete().where(
                (models.project_members.c.project_id == project_id) &
                (models.project_members.c.developer_id == developer_id)
            )
        )
        db.commit()
        
    return {"message": "Developer removed from project successfully"}
