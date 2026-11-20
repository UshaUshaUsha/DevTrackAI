# DevTrack AI – AI-Powered Project & Issue Management System

DevTrack AI is a full-stack project and issue management application that helps development teams organize projects, track tasks, manage software issues, and use Generative AI to analyze bugs and suggest troubleshooting steps.

## Key Features

- **User Authentication:** User registration and login using JWT authentication.
- **Project Management:** Create, view, update, and delete projects.
- **Issue Tracking:** Report, manage, filter, and track software issues.
- **Task Management:** Create tasks, assign users, and manage task priorities and statuses.
- **AI-Powered Issue Analysis:** Gemini AI analyzes reported issues and provides issue categories, suggested priorities, potential root causes, and troubleshooting steps.
- **Dashboard:** View project and issue-related summaries.
- **REST API:** Backend APIs built using FastAPI.
- **Database Integration:** MySQL database with SQLAlchemy.
- **Containerization:** Docker support for the backend.
- **CI Pipeline:** GitHub Actions workflow for automated testing and Docker image building.
- **Kubernetes:** Local Kubernetes deployment using Deployment and NodePort Service manifests.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Backend | Python, FastAPI |
| Database | MySQL, SQLAlchemy |
| AI Integration | Google Gemini API |
| Authentication | JWT |
| API Communication | Axios, REST APIs |
| Testing | Pytest |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Orchestration | Kubernetes |
| Version Control | Git, GitHub |

## Architecture

```text
              React Frontend
                    |
                 Axios
                    |
              FastAPI Backend
                    |
          -----------------------
          |          |          |
        MySQL    Gemini AI    JWT Auth
          |
      SQLAlchemy

      DevOps:
      Docker → GitHub Actions
             → Kubernetes
```

## Project Structure

```text
DevTrackAI/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── api.js
│   └── package.json
│
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
│
├── main.py
├── models.py
├── schemas.py
├── database.py
├── auth.py
├── security.py
├── ai_service.py
├── crud.py
├── project_crud.py
├── task_crud.py
├── Dockerfile
├── compose.yaml
├── requirements.txt
├── pytest.ini
└── .github/
    └── workflows/
        └── ci.yml
```

## Local Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/UshaUshaUsha/DevTrackAI.git
cd DevTrackAI
```

### 2. Set Up Python Environment

```bash
python -m venv venv
```

Activate on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=devtrack_ai
JWT_SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

Create the `devtrack_ai` database in MySQL before starting the backend.

Never commit your `.env` file or expose API keys.

### 4. Start the Backend

```bash
uvicorn main:app --reload --port 8001
```

Backend:

`http://127.0.0.1:8001`

API documentation:

`http://127.0.0.1:8001/docs`

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

## Docker

Build the backend image:

```bash
docker build -t devtrack-ai:v1 .
```

Run the container with your configured environment:

```bash
docker run --env-file .env -p 8001:8000 devtrack-ai:v1
```

## Kubernetes

The project includes Kubernetes Deployment and NodePort Service manifests.

Apply the configuration after creating the required Kubernetes ConfigMap and Secret:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Check deployment:

```bash
kubectl get pods
kubectl get services
```

Access the backend using port forwarding:

```bash
kubectl port-forward service/devtrack-service 18000:8000
```

Then visit:

`http://localhost:18000`

This demonstrates a local Kubernetes deployment, not a public cloud-hosted deployment.

## CI Pipeline

GitHub Actions automatically runs the configured workflow on pushes and pull requests to the `main` branch.

Pipeline stages:

1. Checkout source code.
2. Set up Python.
3. Install dependencies.
4. Run Pytest.
5. Build the Docker image.

## Future Enhancements

- Cloud deployment.
- Expanded automated test coverage.
- Advanced AI evaluation and monitoring.
- Additional team collaboration features.
- Enhanced dashboard analytics.

## Author

**Usha S Gowda**

B.E. Information Science & Engineering | MBA Business Analytics

GitHub: https://github.com/UshaUshaUsha

---

*DevTrack AI is an independent full-stack development project.*
