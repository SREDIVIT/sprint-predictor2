import os
import joblib
import numpy as np

# Path to the saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")

_model_data = None

def get_model():
    global _model_data
    if _model_data is None:
        if not os.path.exists(MODEL_PATH):
            print("Model not found. Running training script...")
            from .train import train_and_evaluate
            train_and_evaluate()
            
        _model_data = joblib.load(MODEL_PATH)
    return _model_data

def predict_sprint_risk(
    sprint_duration: int,
    team_size: int,
    story_points: int,
    completed_stories: int,
    carry_forward_tasks: int,
    bugs: int,
    team_experience: float,
    blocked_tasks: int,
    requirement_changes: int,
    previous_velocity: int
) -> dict:
    model_data = get_model()
    rf_model = model_data["model"]
    
    # Format input as a 2D array for scikit-learn
    features = np.array([[
        sprint_duration,
        team_size,
        story_points,
        completed_stories,
        carry_forward_tasks,
        bugs,
        team_experience,
        blocked_tasks,
        requirement_changes,
        previous_velocity
    ]])
    
    # Predict high risk probability
    # rf_model.predict_proba returns probability for [class 0, class 1]
    probabilities = rf_model.predict_proba(features)[0]
    high_risk_prob = float(probabilities[1])
    
    # Risk percentage
    risk_percent = round(high_risk_prob * 100, 1)
    
    # Category definition
    if risk_percent >= 60:
        risk_category = "High"
    elif risk_percent >= 30:
        risk_category = "Medium"
    else:
        risk_category = "Low"
        
    # Confidence score: based on trees vote agreement/margin
    # For RF, margin from 0.5 can represent model confidence
    confidence_margin = abs(high_risk_prob - 0.5)
    # Scale margin [0, 0.5] to [60, 98]
    confidence_score = round(60 + (confidence_margin / 0.5) * 38, 1)
    
    # Generate structured AI rules-based explanations as fallback
    explanations = []
    recommendations = []
    
    if blocked_tasks > 2:
        explanations.append(f"{blocked_tasks} tasks are currently blocked. Blockages halt development flow and heavily impact delivery.")
        recommendations.append("Hold an emergency standup to unblock tasks or re-allocate resources to work around blockers.")
        
    if bugs > 5:
        explanations.append(f"High bug count ({bugs} active bugs) is consuming developer bandwidth and slowing feature progress.")
        recommendations.append("Declare a bug-bash afternoon to drive down high-priority issues and stabilise the build.")
        
    if story_points > previous_velocity * 1.3:
        explanations.append(f"Sprint scope of {story_points} points greatly exceeds the team's historical velocity of {previous_velocity} points (Overcommitment risk).")
        recommendations.append("Scope-cut non-critical user stories out of this sprint immediately to realign with team velocity.")
        
    if completed_stories < (story_points / 5) and sprint_duration <= 14:
        explanations.append("Progress tracking shows story completion rate is low relative to the elapsed timeline.")
        recommendations.append("Audit user story breakdowns and encourage sub-tasking for large deliverables.")
        
    if team_experience < 3.0:
        explanations.append("The average team experience is low. Tasks might require extra code review cycles or pairing.")
        recommendations.append("Set up senior-junior pairing sessions on critical and complex backend/infrastructure tasks.")

    if requirement_changes > 2:
        explanations.append(f"Scope volatility is high with {requirement_changes} requirement changes introduced mid-sprint.")
        recommendations.append("Enforce a freeze on sprint backlog requirements. Carry any new requests to the next sprint planning.")

    # Default if no anomalies detected
    if not explanations:
        explanations.append("The sprint features are within normal operational margins. Team load aligns with historic performance.")
        recommendations.append("Maintain the current sprint execution and monitor story updates daily.")
        
    return {
        "risk_percent": risk_percent,
        "risk_category": risk_category,
        "confidence_score": confidence_score,
        "explanation": " ".join(explanations),
        "recommendations": recommendations
    }
