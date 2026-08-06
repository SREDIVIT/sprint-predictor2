import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib

def generate_historical_sprints(n_samples=250):
    np.random.seed(42)
    
    # Features
    duration = np.random.choice([10, 14, 21], size=n_samples)
    team_size = np.random.randint(3, 10, size=n_samples)
    team_experience = np.round(np.random.uniform(1.0, 8.0, size=n_samples), 1)
    prev_velocity = np.random.randint(20, 60, size=n_samples)
    
    # Story points planned relative to team size and velocity
    story_points = np.round((team_size * np.random.uniform(6, 12, size=n_samples)) + np.random.normal(0, 3, size=n_samples)).astype(int)
    story_points = np.maximum(story_points, 10)
    
    # Blocked tasks during sprint
    blocked_tasks = np.random.poisson(lam=1.5, size=n_samples)
    
    # Requirement changes
    requirement_changes = np.random.poisson(lam=1.0, size=n_samples)
    
    # Bugs found
    bugs = np.random.poisson(lam=3.0, size=n_samples)
    
    # Carry forward tasks
    carry_forward_tasks = np.random.poisson(lam=1.2, size=n_samples)
    
    # Stories completed
    completed_stories_ratio = np.random.uniform(0.5, 1.0, size=n_samples)
    # Deduct completed stories based on bugs, blocked tasks and requirement changes
    completed_stories_ratio -= (blocked_tasks * 0.05 + bugs * 0.02 + requirement_changes * 0.04)
    completed_stories_ratio = np.clip(completed_stories_ratio, 0.1, 1.0)
    completed_stories = np.round(story_points * completed_stories_ratio / 5).astype(int)
    completed_stories = np.minimum(completed_stories, np.round(story_points / 3).astype(int))
    
    # Risk factor calculation
    risk_factor = (
        (story_points / prev_velocity) * 0.3 + 
        (blocked_tasks * 0.15) + 
        (bugs * 0.08) + 
        (requirement_changes * 0.12) + 
        (carry_forward_tasks * 0.1) - 
        (team_experience * 0.05) - 
        (completed_stories * 0.02)
    )
    
    # Add noise
    risk_factor += np.random.normal(0, 0.15, size=n_samples)
    
    # Risk category label
    # Define binary high_risk label based on risk_factor threshold
    # 0 = Low/Medium risk, 1 = High risk
    high_risk = (risk_factor > 0.6).astype(int)
    
    df = pd.DataFrame({
        "sprint_duration": duration,
        "team_size": team_size,
        "story_points": story_points,
        "completed_stories": completed_stories,
        "carry_forward_tasks": carry_forward_tasks,
        "bugs": bugs,
        "team_experience": team_experience,
        "blocked_tasks": blocked_tasks,
        "requirement_changes": requirement_changes,
        "previous_velocity": prev_velocity,
        "high_risk": high_risk
    })
    
    return df

def train_and_evaluate():
    print("Generating synthetic sprint data...")
    df = generate_historical_sprints(300)
    
    X = df.drop(columns=["high_risk"])
    y = df["high_risk"]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 1. Logistic Regression
    lr = LogisticRegression(random_state=42)
    lr.fit(X_train_scaled, y_train)
    lr_pred = lr.predict(X_test_scaled)
    lr_prob = lr.predict_proba(X_test_scaled)[:, 1]
    
    lr_metrics = {
        "accuracy": float(accuracy_score(y_test, lr_pred)),
        "precision": float(precision_score(y_test, lr_pred)),
        "recall": float(recall_score(y_test, lr_pred)),
        "f1": float(f1_score(y_test, lr_pred)),
        "roc_auc": float(roc_auc_score(y_test, lr_prob))
    }
    
    # 2. Random Forest
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)  # RF doesn't require scaling, makes prediction easier
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1]
    
    rf_metrics = {
        "accuracy": float(accuracy_score(y_test, rf_pred)),
        "precision": float(precision_score(y_test, rf_pred)),
        "recall": float(recall_score(y_test, rf_pred)),
        "f1": float(f1_score(y_test, rf_pred)),
        "roc_auc": float(roc_auc_score(y_test, rf_prob))
    }
    
    print("\nLogistic Regression Evaluation:")
    for k, v in lr_metrics.items():
        print(f"  {k.capitalize()}: {v:.4f}")
        
    print("\nRandom Forest Evaluation:")
    for k, v in rf_metrics.items():
        print(f"  {k.capitalize()}: {v:.4f}")
        
    # Determine the best model (comparing by F1 or Accuracy)
    best_model_name = "Random Forest" if rf_metrics["f1"] >= lr_metrics["f1"] else "Logistic Regression"
    print(f"\nBest Model: {best_model_name}")
    
    # Ensure save directory exists
    os.makedirs("backend/ml", exist_ok=True)
    
    # Save the Random Forest model as primary (RF handles non-linearities and doesn't require scaling)
    # We will also save the scaler and LR model in case we need comparison in UI
    model_data = {
        "model": rf,
        "scaler": scaler,
        "lr_model": lr,
        "features": list(X.columns),
        "best_model_name": best_model_name
    }
    joblib.dump(model_data, "backend/ml/model.joblib")
    print("Model saved to backend/ml/model.joblib")
    
    # Save metrics JSON for the reports/analytics endpoints
    metrics = {
        "logistic_regression": lr_metrics,
        "random_forest": rf_metrics,
        "best_model": best_model_name
    }
    with open("backend/ml/metrics.json", "w") as f:
        json.dump(metrics, f, indent=4)
        
if __name__ == "__main__":
    train_and_evaluate()
