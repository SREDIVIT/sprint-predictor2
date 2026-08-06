import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import models, schemas, auth
from .ml.predictor import predict_sprint_risk
from .routers import auth as auth_router, developers, projects, sprints, tasks, stories, ai, reports, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SprintSense AI - Agile Sprint Risk Predictor API",
    description="Backend API powering the Agile Sprint Risk Predictor with ML-driven risk forecasting and LLM-driven RAG copilot.",
    version="1.0.0"
)

# CORS Configuration
# Allow local React/Vite development server origins
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For simplified testing and local pair programming, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router.router)
app.include_router(developers.router)
app.include_router(projects.router)
app.include_router(sprints.router)
app.include_router(tasks.router)
app.include_router(stories.router)
app.include_router(ai.router)
app.include_router(reports.router)
app.include_router(analytics.router)


# --- Notifications Endpoints ---
@app.get("/api/notifications", response_model=List[schemas.NotificationOut], tags=["Notifications"])
def list_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()

@app.put("/api/notifications/{notif_id}/read", tags=["Notifications"])
def mark_notification_read(
    notif_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    return {"message": "Notification marked read"}


# --- Generic ML Risk Prediction Endpoint ---
@router_post := app.post("/api/predict-risk", tags=["Risk Prediction"])
def predict_generic_risk(request: schemas.PredictRiskRequest):
    """
    Exposed FastAPI endpoint to predict sprint risk from raw features
    """
    prediction = predict_sprint_risk(
        sprint_duration=request.sprint_duration,
        team_size=request.team_size,
        story_points=request.story_points,
        completed_stories=request.completed_stories,
        carry_forward_tasks=request.carry_forward_tasks,
        bugs=request.bugs,
        team_experience=request.team_experience,
        blocked_tasks=request.blocked_tasks,
        requirement_changes=request.requirement_changes,
        previous_velocity=request.previous_velocity
    )
    return prediction


# --- Database Seeding ---
def seed_database(db: Session):
    # Check if we have users already
    if db.query(models.User).count() > 0:
        return
        
    print("Seeding database with default mock data...")
    
    # 1. Create Scrum Master
    hashed_sm_password = auth.get_password_hash("Password123")
    scrum_master = models.User(
        name="Riley Park",
        email="riley@sprintsense.ai",
        hashed_password=hashed_sm_password,
        role="scrum",
        first_login=False,
        is_disabled=False
    )
    db.add(scrum_master)
    db.commit()
    db.refresh(scrum_master)
    
    # 2. Create Developers
    hashed_dev_password = auth.get_password_hash("Password123")
    dev_data = [
        {"name": "Ava Chen", "email": "ava@sprintsense.ai"},
        {"name": "Marcus Reed", "email": "marcus@sprintsense.ai"},
        {"name": "Priya Natarajan", "email": "priya@sprintsense.ai"},
        {"name": "Diego Alvarez", "email": "diego@sprintsense.ai"},
        {"name": "Sofia Larsen", "email": "sofia@sprintsense.ai"},
        {"name": "Ken Watanabe", "email": "ken@sprintsense.ai"},
    ]
    
    developers = []
    for d in dev_data:
        dev = models.User(
            name=d["name"],
            email=d["email"],
            hashed_password=hashed_dev_password,
            role="developer",
            first_login=True,  # Devs must change password on first login
            is_disabled=False
        )
        db.add(dev)
        developers.append(dev)
    db.commit()
    
    # 3. Create Projects
    projects_data = [
        {"name": "Atlas Payments", "color": "from-violet-500 to-fuchsia-500", "description": "Payment platform upgrades, processor integrations, and fraud rule engine revamps."},
        {"name": "Nimbus Analytics", "color": "from-sky-500 to-cyan-500", "description": "Customer dashboard analytics, clickstream processors, and live monitoring pipelines."},
        {"name": "Helio Mobile", "color": "from-amber-500 to-rose-500", "description": "React Native iOS and Android mobile app rollout with biometrics and offline support."},
        {"name": "Orbit Platform", "color": "from-emerald-500 to-teal-500", "description": "Core platform infrastructure migration to multi-region Kubernetes clusters."}
    ]
    
    db_projects = []
    for p in projects_data:
        proj = models.Project(
            name=p["name"],
            color=p["color"],
            description=p["description"],
            completion=0.0,
            ai_health=100.0
        )
        db.add(proj)
        db_projects.append(proj)
    db.commit()
    
    # Assign developers to projects (Many-to-Many)
    # Project 1 (Atlas Payments) gets all developers
    p1 = db_projects[0]
    for dev in developers:
        db.execute(models.project_members.insert().values(project_id=p1.id, developer_id=dev.id))
        
    # Project 2 (Nimbus Analytics) gets Ava, Marcus, Priya, Ken
    p2 = db_projects[1]
    for idx in [0, 1, 2, 5]:
        db.execute(models.project_members.insert().values(project_id=p2.id, developer_id=developers[idx].id))
        
    # Project 3 (Helio Mobile) gets Priya, Diego, Sofia
    p3 = db_projects[2]
    for idx in [2, 3, 4]:
        db.execute(models.project_members.insert().values(project_id=p3.id, developer_id=developers[idx].id))
        
    db.commit()
    
    # 4. Create Sprint for Project 1 (Atlas Payments)
    start_date = datetime.date.today() - datetime.timedelta(days=10)
    end_date = start_date + datetime.timedelta(days=14)
    sprint1 = models.Sprint(
        project_id=p1.id,
        name="Sprint 24 — Atlas Payments",
        goal="Ship Apple Pay + harden checkout pipeline for Black Friday.",
        capacity=50,
        start_date=start_date,
        end_date=end_date,
        is_active=True,
        days_total=14,
        days_elapsed=10,
        success_probability=74.0
    )
    db.add(sprint1)
    db.commit()
    db.refresh(sprint1)
    
    # Associate current sprint back to project
    p1.current_sprint_id = sprint1.id
    db.commit()
    
    # 5. Create User Stories / Tasks for Sprint 1 (matching mock-data.ts)
    stories_data = [
        {
            "title": "Checkout: Apple Pay integration",
            "desc": "Add Apple Pay to the mobile web checkout flow.",
            "dev_idx": 0, "priority": "High", "points": 8, "status": "In Progress", "health": "healthy",
            "bugs": 1, "est": 24, "spent": 17, "rem": 4, "risk": 18, "prob": 88,
            "reasons": ["On pace with estimate", "Low bug count"], "rec": "Continue as planned."
        },
        {
            "title": "Refactor payment webhook signer",
            "desc": "Move HMAC signing into shared crypto module.",
            "dev_idx": 1, "priority": "Critical", "points": 13, "status": "In Progress", "health": "warning",
            "bugs": 4, "est": 40, "spent": 30, "rem": 3, "risk": 62, "prob": 46,
            "reasons": ["Progress trailing estimate by 28%", "Bug count trending up"], "rec": "Pair with another engineer for the next 2 days."
        },
        {
            "title": "3DS 2.0 fallback flow",
            "desc": "Fallback UX when issuer challenges fail.",
            "dev_idx": 2, "priority": "Medium", "points": 5, "status": "In Review", "health": "healthy",
            "bugs": 0, "est": 16, "spent": 15, "rem": 4, "risk": 8, "prob": 96,
            "reasons": ["Ahead of schedule"], "rec": "Ship after review."
        },
        {
            "title": "iOS push notification pipeline",
            "desc": "APNs integration + retry queue.",
            "dev_idx": 3, "priority": "High", "points": 8, "status": "Blocked", "health": "critical",
            "bugs": 6, "est": 32, "spent": 28, "rem": 2, "risk": 87, "prob": 21,
            "reasons": ["Progress far below plan", "Critical bugs open", "Only 2 days remaining"], "rec": "Reassign or split. Notify Scrum Master."
        },
        {
            "title": "E2E regression: checkout suite",
            "desc": "Playwright coverage for checkout.",
            "dev_idx": 4, "priority": "Medium", "points": 5, "status": "In Progress", "health": "healthy",
            "bugs": 0, "est": 20, "spent": 15, "rem": 4, "risk": 12, "prob": 92,
            "reasons": ["Steady progress"], "rec": "Continue."
        },
        {
            "title": "K8s HPA for checkout API",
            "desc": "Autoscaling based on p95 latency.",
            "dev_idx": 5, "priority": "High", "points": 8, "status": "In Progress", "health": "warning",
            "bugs": 2, "est": 28, "spent": 20, "rem": 3, "risk": 48, "prob": 62,
            "reasons": ["Latency-based scaling needs tuning"], "rec": "Add load test day."
        },
        {
            "title": "Fraud rules v2",
            "desc": "Update rule engine thresholds.",
            "dev_idx": 2, "priority": "Low", "points": 3, "status": "Done", "health": "healthy",
            "bugs": 0, "est": 8, "spent": 7, "rem": 0, "risk": 2, "prob": 100,
            "reasons": ["Completed"], "rec": "Done."
        },
        {
            "title": "Refund flow analytics",
            "desc": "Segment events for refunds.",
            "dev_idx": 0, "priority": "Low", "points": 3, "status": "In Progress", "health": "healthy",
            "bugs": 0, "est": 10, "spent": 4, "rem": 4, "risk": 20, "prob": 85,
            "reasons": ["Nominal"], "rec": "Continue."
        }
    ]
    
    for st in stories_data:
        story = models.UserStory(
            project_id=p1.id,
            sprint_id=sprint1.id,
            title=st["title"],
            description=st["desc"],
            developer_id=developers[st["dev_idx"]].id,
            priority=st["priority"],
            points=st["points"],
            status=st["status"],
            health=st["health"],
            bugs=st["bugs"],
            hours_estimated=st["est"],
            hours_spent=st["spent"],
            days_remaining=st["rem"],
            risk_percent=st["risk"],
            completion_probability=st["prob"],
            reasons=st["reasons"],
            recommendation=st["rec"]
        )
        db.add(story)
        db.commit()
        db.refresh(story)
        
        # Also create a task counterpart on the Kanban board
        task = models.Task(
            project_id=p1.id,
            sprint_id=sprint1.id,
            title=st["title"],
            description=st["desc"],
            assigned_developer_id=developers[st["dev_idx"]].id,
            story_points=st["points"],
            priority=st["priority"],
            due_date=datetime.date.today() + datetime.timedelta(days=st["rem"]),
            # Map status (Kanban status columns differ slightly)
            # StoryStatus: "To Do" | "In Progress" | "In Review" | "Done" | "Blocked"
            # Kanban columns: "Backlog", "To Do", "In Progress", "Testing", "Review", "Done"
            status="Review" if st["status"] == "In Review" else ("Done" if st["status"] == "Done" else ("To Do" if st["status"] == "Blocked" else st["status"]))
        )
        db.add(task)
        db.commit()
        
    # Set completion metric for project 1
    p1.completion = 68.0
    p1.ai_health = 82.0
    
    # 6. Seed mock risk prediction log
    db_pred = models.RiskPrediction(
        sprint_id=sprint1.id,
        risk_percent=26.0,
        risk_category="Medium",
        confidence_score=85.0,
        explanation="High bug count on webhook refactor and iOS blocking tickets are dragging success probabilities down.",
        recommendations=["Pair Marcus on webhooks signer.", "Investigate Diego APNs certificates blocker."]
    )
    db.add(db_pred)
    
    # 7. Seed mock report
    db_report = models.Report(
        project_id=p1.id,
        sprint_id=sprint1.id,
        type="Risk",
        title="Sprint 24 AI Risk Assessment Report",
        content={
            "summary": "Sprint 24 is at moderate risk of delayed delivery due to bottlenecks in payment cryptography and notification pipelines.",
            "key_blockers": ["Diego Alvarez is blocked on Apple APNs signing certificates.", "Webhook security refactor is taking 28% longer than initially estimated."],
            "recommended_actions": ["Assign Marcus Reed to pair with Ava Chen on webhook encryption logic.", "Verify developer APNs certificate configuration."]
        }
    )
    db.add(db_report)
    
    # 8. Seed system notifications
    for d in developers:
        notif1 = models.Notification(
            user_id=d.id,
            title="Welcome to SprintSense",
            message="Please update your profile details and set a permanent password.",
            type="info"
        )
        db.add(notif1)
        
    # Seed AI Alerts matching pre-seeded story health warnings
    if scrum_master:
        db.add(models.Notification(
            user_id=scrum_master.id,
            title="Critical Health Alert: iOS push notification pipeline",
            message="User Story 'iOS push notification pipeline' was flagged as critical: APNs integration is blocked.",
            type="critical",
            read=False
        ))
        db.add(models.Notification(
            user_id=scrum_master.id,
            title="Story Health Warning: Refactor payment webhook signer",
            message="User Story 'Refactor payment webhook signer' was flagged as warning: hours spent exceeds estimate.",
            type="warning",
            read=False
        ))
        db.add(models.Notification(
            user_id=scrum_master.id,
            title="Story Health Warning: K8s HPA for checkout API",
            message="User Story 'K8s HPA for checkout API' was flagged as warning: scaling metrics need tuning.",
            type="warning",
            read=False
        ))
        
    db.commit()
    print("Database seeding completed successfully!")


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_database(db)
    except Exception as e:
        print(f"Error seeding database: {e}")
