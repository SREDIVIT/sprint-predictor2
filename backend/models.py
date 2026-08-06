from sqlalchemy import Table, Column, Integer, String, Boolean, Float, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from .database import Base

# Many-to-many link table between projects and developers (users)
project_members = Table(
    'project_members',
    Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True),
    Column('developer_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "scrum" or "developer"
    is_disabled = Column(Boolean, default=False)
    first_login = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    projects = relationship("Project", secondary=project_members, back_populates="members")
    assigned_stories = relationship("UserStory", back_populates="developer")
    assigned_tasks = relationship("Task", back_populates="assigned_developer")
    daily_standups = relationship("DailyStandup", back_populates="developer")
    notifications = relationship("Notification", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    current_sprint_id = Column(Integer, nullable=True)
    color = Column(String, default="from-violet-500 to-fuchsia-500")
    completion = Column(Float, default=0.0)
    ai_health = Column(Float, default=100.0)

    # Relationships
    members = relationship("User", secondary=project_members, back_populates="projects")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan")
    stories = relationship("UserStory", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    goal = Column(Text, nullable=True)
    capacity = Column(Integer, default=50)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    days_total = Column(Integer, default=14)
    days_elapsed = Column(Integer, default=0)
    success_probability = Column(Float, default=100.0)

    # Relationships
    project = relationship("Project", back_populates="sprints")
    stories = relationship("UserStory", back_populates="sprint")
    tasks = relationship("Task", back_populates="sprint")
    predictions = relationship("RiskPrediction", back_populates="sprint", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="sprint", cascade="all, delete-orphan")


class UserStory(Base):
    __tablename__ = "user_stories"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    developer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    priority = Column(String, default="Medium")  # "Low", "Medium", "High", "Critical"
    points = Column(Integer, default=1)
    status = Column(String, default="To Do")  # "To Do", "In Progress", "In Review", "Done", "Blocked"
    health = Column(String, default="healthy")  # "healthy", "warning", "critical"
    bugs = Column(Integer, default=0)
    hours_estimated = Column(Float, default=0.0)
    hours_spent = Column(Float, default=0.0)
    days_remaining = Column(Integer, default=5)
    risk_percent = Column(Float, default=0.0)
    completion_probability = Column(Float, default=100.0)
    reasons = Column(JSON, default=list)  # Stored as JSON list of strings
    recommendation = Column(Text, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="stories")
    sprint = relationship("Sprint", back_populates="stories")
    developer = relationship("User", back_populates="assigned_stories")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assigned_developer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    story_points = Column(Integer, default=1)
    priority = Column(String, default="Medium")  # "Low", "Medium", "High", "Critical"
    due_date = Column(Date, nullable=True)
    status = Column(String, default="Backlog")  # "Backlog", "To Do", "In Progress", "Testing", "Review", "Done"

    # Relationships
    project = relationship("Project", back_populates="tasks")
    sprint = relationship("Sprint", back_populates="tasks")
    assigned_developer = relationship("User", back_populates="assigned_tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")


class TaskComment(Base):
    __tablename__ = "task_comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("Task", back_populates="comments")


class DailyStandup(Base):
    __tablename__ = "daily_standups"

    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=datetime.date.today)
    yesterday_work = Column(Text, nullable=False)
    today_plan = Column(Text, nullable=False)
    blockers = Column(Text, nullable=True)

    developer = relationship("User", back_populates="daily_standups")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    date = Column(Date, default=datetime.date.today)
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    blockers = Column(JSON, default=list)  # JSON list of blocker strings
    action_items = Column(JSON, default=list)  # JSON list of action item strings
    responsible_developers = Column(JSON, default=list)  # JSON list of developer name strings

    project = relationship("Project", back_populates="meetings")


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="CASCADE"), nullable=False)
    risk_percent = Column(Float, nullable=False)
    risk_category = Column(String, nullable=False)  # "Low", "Medium", "High"
    confidence_score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)
    recommendations = Column(JSON, default=list)  # JSON list of recommendation strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sprint = relationship("Sprint", back_populates="predictions")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True)
    type = Column(String, nullable=False)  # "Sprint", "Project Status", "Sprint Review", "Retrospective", "Risk"
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=False)  # Stored content structured as JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="reports")
    sprint = relationship("Sprint", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    type = Column(String, default="info")  # "info", "warning", "critical", "success"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
