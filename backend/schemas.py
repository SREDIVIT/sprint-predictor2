from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import date, datetime

# --- User & Auth ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_disabled: Optional[bool] = None

class UserOut(UserBase):
    id: int
    is_disabled: bool
    first_login: bool
    is_active: bool
    assigned_count: Optional[int] = 0
    completed_count: Optional[int] = 0
    current_story: Optional[str] = "No active story assigned"
    performance: Optional[int] = 100
    health: Optional[str] = "healthy"

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


# --- Developer Management ---
class DeveloperCreate(BaseModel):
    name: str
    email: EmailStr
    temporary_password: str

class DeveloperUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_disabled: Optional[bool] = None

class DeveloperResetPassword(BaseModel):
    email: EmailStr
    temporary_password: str


# --- Project ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "from-violet-500 to-fuchsia-500"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    current_sprint_id: Optional[int] = None
    completion: Optional[float] = None
    ai_health: Optional[float] = None

class ProjectOut(ProjectBase):
    id: int
    current_sprint_id: Optional[int] = None
    completion: float
    ai_health: float
    developer_count: Optional[int] = 0
    developer_ids: List[int] = []

    class Config:
        from_attributes = True


# --- Sprint ---
class SprintBase(BaseModel):
    name: str
    goal: Optional[str] = None
    capacity: Optional[int] = 50
    start_date: date
    end_date: date

class SprintCreate(SprintBase):
    project_id: int

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    capacity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    days_elapsed: Optional[int] = None
    success_probability: Optional[float] = None

class SprintOut(SprintBase):
    id: int
    project_id: int
    is_active: bool
    days_total: int
    days_elapsed: int
    success_probability: float

    class Config:
        from_attributes = True


# --- User Story ---
class UserStoryBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "Medium"
    points: Optional[int] = 1
    status: Optional[str] = "To Do"
    project_id: int
    sprint_id: Optional[int] = None
    developer_id: Optional[int] = None
    bugs: Optional[int] = 0
    hours_estimated: Optional[float] = 0.0
    hours_spent: Optional[float] = 0.0
    days_remaining: Optional[int] = 5

class UserStoryCreate(UserStoryBase):
    pass

class UserStoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    points: Optional[int] = None
    status: Optional[str] = None
    sprint_id: Optional[int] = None
    developer_id: Optional[int] = None
    bugs: Optional[int] = None
    hours_estimated: Optional[float] = None
    hours_spent: Optional[float] = None
    days_remaining: Optional[int] = None
    health: Optional[str] = None
    risk_percent: Optional[float] = None
    completion_probability: Optional[float] = None
    reasons: Optional[List[str]] = None
    recommendation: Optional[str] = None

class UserStoryOut(UserStoryBase):
    id: int
    health: str
    risk_percent: float
    completion_probability: float
    reasons: List[str]
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True


# --- Task & Comments ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_developer_id: Optional[int] = None
    story_points: Optional[int] = 1
    priority: Optional[str] = "Medium"
    due_date: Optional[date] = None
    status: Optional[str] = "Backlog"
    project_id: int
    sprint_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_developer_id: Optional[int] = None
    story_points: Optional[int] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    sprint_id: Optional[int] = None

class CommentBase(BaseModel):
    comment: str

class CommentCreate(CommentBase):
    pass

class CommentOut(CommentBase):
    id: int
    task_id: int
    user_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class TaskOut(TaskBase):
    id: int
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True


# --- Daily Standup ---
class DailyStandupBase(BaseModel):
    yesterday_work: str
    today_plan: str
    blockers: Optional[str] = None

class DailyStandupCreate(DailyStandupBase):
    pass

class DailyStandupOut(DailyStandupBase):
    id: int
    developer_id: int
    date: date

    class Config:
        from_attributes = True


# --- Meeting Intelligence ---
class MeetingBase(BaseModel):
    project_id: int
    title: str
    transcript: str

class MeetingCreate(MeetingBase):
    pass

class MeetingOut(MeetingBase):
    id: int
    date: date
    summary: Optional[str] = None
    blockers: List[str] = []
    action_items: List[str] = []
    responsible_developers: List[str] = []

    class Config:
        from_attributes = True


# --- Risk Prediction ---
class RiskPredictionOut(BaseModel):
    id: int
    sprint_id: int
    risk_percent: float
    risk_category: str
    confidence_score: float
    explanation: Optional[str] = None
    recommendations: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class PredictRiskRequest(BaseModel):
    sprint_duration: int = 14
    team_size: int = 5
    story_points: int = 40
    completed_stories: int = 0
    carry_forward_tasks: int = 0
    bugs: int = 0
    team_experience: float = 3.5
    blocked_tasks: int = 0
    requirement_changes: int = 0
    previous_velocity: int = 35


# --- Report ---
class ReportBase(BaseModel):
    project_id: int
    sprint_id: Optional[int] = None
    type: str
    title: str
    content: Any

class ReportCreate(ReportBase):
    pass

class ReportOut(ReportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Notification ---
class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    read: bool
    type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- AI Assistant ---
class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None
