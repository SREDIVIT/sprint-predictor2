# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

# Agile Sprint Risk Predictor (SprintSense AI)

SprintSense AI is a production-ready, AI-powered Agile Project Management web application following the Scrum framework. It helps software development teams manage projects, plan sprints, assign tasks on Kanban boards, log daily standups, and predict sprint delivery risks using a Scikit-learn Machine Learning classifier and Groq LLM + Retrieval-Augmented Generation (RAG) assistant.

---

## Tech Stack & Architecture

### Frontend
- **React.js & TypeScript**: Core UI and rendering.
- **TanStack Start & Router**: Modern routing, server entries, and CSRF protection.
- **Tailwind CSS**: Sleek glassmorphism and gradient layout tokens.
- **ShadCN UI**: Accessible interface components.
- **Recharts**: Burndown, burn-up, workload, velocity, and risk trend metrics.
- **Axios**: Network requests intercepting JWT headers.

### Backend
- **FastAPI (Python)**: High-performance async endpoints.
- **SQLAlchemy ORM**: Clean Pythonic SQLite3 interface.
- **SQLite3**: Embeddable relational database.
- **JWT & Passlib (bcrypt)**: Hashed authorization scopes.

### Machine Learning & AI
- **Scikit-learn (Random Forest & Logistic Regression)**: Dynamically trained classifiers comparing accuracy, precision, recall, F1, and ROC AUC metrics.
- **Joblib**: Persistent model serialization.
- **Groq LLM + RAG (Llama3)**: Keyword-matching vector retrieval with LLM completion (includes robust rule-based fallbacks if no Groq API key is present).

---

## Directory Structure

```text
├── backend/
│   ├── ml/
│   │   ├── train.py          # ML comparison, training, and metrics serialization
│   │   ├── predictor.py      # Joblib loader and risk categorization
│   ├── rag/
│   │   └── rag_service.py    # TERM-matching RAG vector database & Groq client
│   ├── routers/
│   │   ├── auth.py           # Registration & Universal Login
│   │   ├── developers.py     # Developer CRUD & standups
│   │   ├── projects.py       # Projects, memberships (Many-to-Many)
│   │   ├── sprints.py        # Sprints & risk calculation triggers
│   │   ├── tasks.py          # Kanban tasks & comments
│   │   ├── reports.py        # Compile reports & stream PDF exports (FPDF)
│   │   └── analytics.py      # Aggregates charts metrics
│   ├── database.py           # SQLAlchemy setup
│   ├── models.py             # SQLite schemas & relations
│   ├── schemas.py            # Pydantic schemas
│   ├── auth.py               # JWT scopes & encryption
│   └── main.py               # Main app entry, CORS, and database seed
```

---

## Running the Application Locally

### 1. Set Up and Run the Backend
Navigate to the backend directory, activate the virtual environment, install requirements, and run the FastAPI server:

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Train the ML models
python ml/train.py

# Start the FastAPI server (runs on port 8000)
uvicorn main:app --port 8000 --reload
```

### 2. Set Up and Run the Frontend
From the root workspace directory, install package dependencies and start the Vite/TanStack Start development server:

```sh
npm install
npm run dev
```

The React frontend will start on [http://localhost:3000](http://localhost:3000) or [http://localhost:5173](http://localhost:5173).

---

## Seeding & Test Accounts
On startup, if the SQLite database is empty, the application automatically seeds the workspace database:

- **Scrum Master Account**:
  - Email: `riley@sprintsense.ai`
  - Password: `Password123`
- **Developer Account**:
  - Email: `ava@sprintsense.ai`
  - Password: `Password123` (requires forced password change on first sign-in)
- **Sample Workspace**:
  - Contains 4 preloaded projects (Atlas Payments, Nimbus Analytics, Helio Mobile, Orbit Platform) with member associations and an active sprint board containing 8 task stories on the Kanban board.
