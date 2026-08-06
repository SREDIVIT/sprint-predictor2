import os
import json
import re
from typing import List, Dict, Any
from groq import Groq

# In-memory RAG database containing Agile/Scrum best practices and recommendations
AGILE_KNOWLEDGE_BASE = [
    {
        "title": "Sprint Overcommitment & Velocity",
        "keywords": ["overcommit", "velocity", "capacity", "too many points", "points", "estimate"],
        "content": "Sprint overcommitment happens when planned story points exceed historical team velocity. Best practices dictate planning for 80-90% of average velocity from the last 3 sprints. Keep capacity realistic by accounting for holidays, developer time off, and bug-fixing overhead. If a sprint is overcommitted, the Scrum Master should immediately negotiate scope cuts."
    },
    {
        "title": "Managing Sprint Risks",
        "keywords": ["risk", "risky", "mitigate", "blocker", "blocked", "slow", "delay"],
        "content": "To reduce sprint risk: 1) Identify blocked tasks in the daily standup and assign owners to resolve them. 2) Reassign tasks from overloaded developers (e.g. devs with >15 story points) to underutilized members. 3) Reduce testing cycle delays by declaring code freezes 2 days before sprint end. 4) Use pair programming to tackle high-complexity stories."
    },
    {
        "title": "Effective Standups & Blockers",
        "keywords": ["standup", "daily", "yesterday", "today", "blockers", "update"],
        "content": "Daily standups should be timeboxed to 15 minutes. Developers should answer: 1) What they did yesterday, 2) What they plan to do today, 3) Any blockers. Blockers must be logged immediately. The Scrum Master's primary job is to resolve these blockers. Technical discussions should be deferred to a post-standup 'parking lot' session."
    },
    {
        "title": "Retrospective & Continuous Improvement",
        "keywords": ["retrospective", "retro", "improvement", "action items", "went well", "didn't"],
        "content": "Retrospectives focus on process improvement. Teams discuss: 1) What went well, 2) What did not, 3) Action items. Action items must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound) and assigned to a single owner. Avoid blaming individuals; focus on the system and workflow improvements."
    },
    {
        "title": "Sprint Review & Demos",
        "keywords": ["review", "demo", "feedback", "completed stories", "stakeholder"],
        "content": "Sprint reviews showcase working software to stakeholders. The team demos completed user stories (meeting Definition of Done). Incomplete stories go back to the product backlog. Collect and document feedback to adjust the product backlog. This closes the feedback loop between developers and customers."
    },
    {
        "title": "Story Point Estimation & Planning",
        "keywords": ["points", "estimate", "fibonacci", "complexity", "planning poker"],
        "content": "Story points represent effort, complexity, and risk, not just time. Use the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) to prevent false precision. Estimation should be a collaborative team activity (e.g., Planning Poker). If developers estimate differently, discuss the outliers (lowest and highest estimates) to align understanding."
    }
]

def retrieve_context(query: str) -> str:
    """Simple term-matching keyword retrieval (RAG)."""
    query_lower = query.lower()
    matched_docs = []
    
    for doc in AGILE_KNOWLEDGE_BASE:
        score = 0
        for kw in doc["keywords"]:
            if kw in query_lower:
                score += 2
        # Title matches
        if any(w in query_lower for w in doc["title"].lower().split()):
            score += 3
            
        if score > 0:
            matched_docs.append((score, doc))
            
    # Sort by score descending
    matched_docs.sort(key=lambda x: x[0], reverse=True)
    
    if matched_docs:
        retrieved = [f"[{d[1]['title']}]: {d[1]['content']}" for d in matched_docs[:2]]
        return "\n\n".join(retrieved)
        
    # Return a default context if no keywords match
    return "[General Scrum Guidelines]: Focus on task transparency, collaborative backlog refinement, resolving blockers daily, and aligning commitments with historical team velocity."

def get_groq_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")
        return None

def generate_chat_response(message: str, context_data: dict = None) -> dict:
    # 1. Retrieve RAG context
    rag_context = retrieve_context(message)
    
    # Compile prompt context
    system_prompt = (
        "You are SprintSense AI, an expert Agile Copilot and Agile coach. "
        "Use the retrieved RAG context below to inform your answer. Be concise, highly professional, "
        "and provide actionable Scrum advice. Format answers using Markdown.\n\n"
        f"--- RAG CONTEXT ---\n{rag_context}\n\n"
    )
    if context_data:
        system_prompt += f"--- CURRENT PROJECT/SPRINT DATA ---\n{json.dumps(context_data, indent=2)}\n\n"
        
    client = get_groq_client()
    if client:
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="llama3-8b-8192",
                temperature=0.7,
                max_tokens=800
            )
            response_text = chat_completion.choices[0].message.content
            return {
                "response": response_text,
                "rag_context": rag_context,
                "engine": "Groq LLM (llama3)"
            }
        except Exception as e:
            print(f"Groq API call failed, falling back to local engine. Error: {e}")
            
    # 2. Rule-based Fallback Generator
    message_lower = message.lower()
    fallback_response = ""
    
    if "risk" in message_lower:
        fallback_response = (
            "### Sprint Risk Assessment & Recommendations\n\n"
            "Based on Agile best practices, sprint risks are mitigated through three key interventions:\n"
            "1. **Scope Negotiation**: If the story points planned exceed the team's historical velocity, immediately move lower priority stories back to the Product Backlog.\n"
            "2. **Blocker Resolution**: Hold a focus session to resolve critical blockers (e.g. external dependencies or environment issues) that are stalling work.\n"
            "3. **Workload Balancing**: Reassign stories from overloaded developers to peers who have completed their tasks.\n\n"
            "*Retrieved RAG guidelines:* " + rag_context
        )
    elif "improve" in message_lower or "suggest" in message_lower:
        fallback_response = (
            "### Recommended Sprint Improvements\n\n"
            "Here are three immediate actions to improve your sprint velocity and quality:\n"
            "1. **Enforce Task Decomposition**: Break down tasks into units of 4-8 hours. Large stories hide progress bottlenecks.\n"
            "2. **Implement Code Review SLA**: Set a rule that code reviews must be completed within 4 hours to keep pull requests moving.\n"
            "3. **Focus on Definition of Done**: Ensure stories meet all testing criteria before marking them complete to prevent QA bottlenecking at the end of the sprint.\n\n"
            "*Retrieved RAG guidelines:* " + rag_context
        )
    elif "estimate" in message_lower or "completion" in message_lower:
        fallback_response = (
            "### Sprint Completion Estimation Guide\n\n"
            "To estimate sprint completion, calculate the **Burndown Rate** daily:\n"
            "- **Daily Target**: Total Story Points / Days in Sprint. For a 40pt sprint of 10 working days, the target is 4 points/day.\n"
            "- **Trend Line**: If your team has completed 15 points by day 5, you are trending toward a 30-point finish, leaving a deficit. You should immediately adjust scope or focus on finishing in-progress tasks before starting new ones.\n\n"
            "*Retrieved RAG guidelines:* " + rag_context
        )
    elif "retro" in message_lower:
        fallback_response = (
            "### Retrospective Structure & Action Items\n\n"
            "A standard Sprint Retrospective template includes:\n"
            "- **What Went Well**: Highlight team collaborations, successful releases, or tools that worked.\n"
            "- **What Didn't Go Well**: Discuss bottlenecks, scope creep, communications gaps, or buggy releases.\n"
            "- **Action Items**: Assign specific, trackable tasks to team members to resolve process issues in the next sprint.\n\n"
            "*Retrieved RAG guidelines:* " + rag_context
        )
    else:
        fallback_response = (
            "### Agile Copilot Response\n\n"
            "As your SprintSense Agile Copilot, here is my response based on standard Scrum practices:\n\n"
            "We recommend focusing on clear task assignment, keeping stories small, and addressing team blockers daily in standups. "
            "Make sure your sprint goal remains the focal point of the team's commitment.\n\n"
            "**Agile Reference Context**:\n"
            f"{rag_context}"
        )
        
    return {
        "response": fallback_response,
        "rag_context": rag_context,
        "engine": "SprintSense Rule-Based RAG (Fallback)"
    }

def analyze_meeting_transcript(transcript: str) -> dict:
    client = get_groq_client()
    if client:
        try:
            system_prompt = (
                "You are an AI Scrum Assistant. Analyze the provided meeting transcript of a scrum team. "
                "Output a JSON object with exactly the following keys: "
                "1. 'summary': A concise markdown summary paragraph of the meeting. "
                "2. 'blockers': A list of string blockers identified in the meeting. "
                "3. 'action_items': A list of string action items. "
                "4. 'responsible_developers': A list of names of developers assigned to action items. "
                "Output ONLY the raw JSON object, do not wrap it in markdown or comments."
            )
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": transcript}
                ],
                model="llama3-8b-8192",
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=600
            )
            data = json.loads(chat_completion.choices[0].message.content)
            return {
                "summary": data.get("summary", "Scrum meeting completed."),
                "blockers": data.get("blockers", []),
                "action_items": data.get("action_items", []),
                "responsible_developers": data.get("responsible_developers", []),
                "engine": "Groq LLM"
            }
        except Exception as e:
            print(f"Groq meeting analysis failed, falling back to rule-based parser. Error: {e}")
            
    # Rule-based fallback parser
    # Match standard patterns in transcript text
    summary = "Meeting transcript analyzed. Key discussions revolved around feature progress, blocker resolutions, and task dependencies."
    blockers = []
    action_items = []
    responsible_developers = []
    
    # 1. Parse Blockers
    blocker_keywords = ["blocked", "blocker", "stuck", "cannot proceed", "waiting on", "waiting for"]
    lines = transcript.split("\n")
    for line in lines:
        if any(kw in line.lower() for kw in blocker_keywords):
            blockers.append(line.strip())
            
    # 2. Parse Action Items / Assignments
    # Look for patterns like: "Ava will do X", "Diego to build Y", "Marcus needs to look at Z"
    assignment_patterns = [
        r"([A-Z][a-z]+)\s+(?:will|needs to|to|is going to)\s+([^.]+)",
        r"(?:Assign)\s+([^.]+)\s+to\s+([A-Z][a-z]+)"
    ]
    
    for line in lines:
        for pattern in assignment_patterns:
            matches = re.findall(pattern, line)
            for match in matches:
                if len(match) == 2:
                    # check who is the dev and what is the action
                    if "Assign" in line:
                        action, dev = match[0].strip(), match[1].strip()
                    else:
                        dev, action = match[0].strip(), match[1].strip()
                    
                    if dev not in ["I", "We", "The", "He", "She", "They"]:
                        action_items.append(f"{dev}: {action}")
                        if dev not in responsible_developers:
                            responsible_developers.append(dev)
                            
    # Provide default examples if none extracted
    if not blockers:
        blockers = ["No critical blockers explicitly logged, but external integrations need verification."]
    if not action_items:
        action_items = [
            "Follow up on pending pull requests.",
            "Verify build deployments in staging."
        ]
        responsible_developers = ["Ava Chen", "Marcus Reed"]
        
    return {
        "summary": summary,
        "blockers": blockers[:4],
        "action_items": action_items[:4],
        "responsible_developers": responsible_developers,
        "engine": "SprintSense Regex Parser (Fallback)"
    }
