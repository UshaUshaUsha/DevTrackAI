
import { useState, useEffect } from "react";
import api from "./api";
import "./App.css";

function App() {
  // AUTHENTICATION
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  // GENERAL
  const [activePage, setActivePage] = useState("Dashboard");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // DASHBOARD
  const [dashboard, setDashboard] = useState(null);

  // PROJECTS
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // ISSUES
  const [issues, setIssues] = useState([]);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issuePriority, setIssuePriority] = useState("Medium");
  const [issueProject, setIssueProject] = useState("");
  const [editingIssueId, setEditingIssueId] = useState(null);

  // AI ANALYSIS
  const [issueAnalyses, setIssueAnalyses] = useState({});
  const [analyzingIssueId, setAnalyzingIssueId] = useState(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState(null);
  const [analysisMessages, setAnalysisMessages] = useState({});

  // TASKS
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskProject, setTaskProject] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  // LOAD DASHBOARD
  const loadDashboard = async () => {
    try {
      const response = await api.get("/dashboard/summary");
      setDashboard(response.data);
      setError("");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        setLoggedIn(false);
      }

      setError(
        err.response?.data?.detail ||
        "Could not load dashboard data."
      );
    }
  };

  // LOAD PROJECTS
  const loadProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not load projects."
      );
    }
  };

  // CREATE PROJECT
  const createProject = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/projects", {
        name: projectName,
        description: projectDescription,
      });

      setProjectName("");
      setProjectDescription("");

      await loadProjects();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Project creation failed."
      );
    }
  };

  // DELETE PROJECT
  const deleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setError("");

    try {
      await api.delete(`/projects/${projectId}`);
      await loadProjects();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not delete project."
      );
    }
  };

  // LOAD ISSUES
  const loadIssues = async () => {
    try {
      const response = await api.get("/issues");
      setIssues(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not load issues."
      );
    }
  };

  // RESET ISSUE FORM
  const resetIssueForm = () => {
    setIssueTitle("");
    setIssueDescription("");
    setIssuePriority("Medium");
    setIssueProject("");
    setEditingIssueId(null);
  };

  // CREATE OR UPDATE ISSUE
  const saveIssue = async (e) => {
    e.preventDefault();
    setError("");

    const issueData = {
      title: issueTitle,
      description: issueDescription,
      priority: issuePriority,
      project_id: issueProject
        ? Number(issueProject)
        : null,
    };

    try {
      if (editingIssueId !== null) {
        await api.put(
          `/issues/${editingIssueId}`,
          issueData
        );
      } else {
        await api.post("/issues", issueData);
      }

      resetIssueForm();
      await loadIssues();
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not save issue."
      );
    }
  };

  // EDIT ISSUE
  const editIssue = (issue) => {
    setEditingIssueId(issue.id);
    setIssueTitle(issue.title);
    setIssueDescription(issue.description || "");
    setIssuePriority(issue.priority);
    setIssueProject(
      issue.project_id
        ? String(issue.project_id)
        : ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE ISSUE
  const deleteIssue = async (issueId) => {
    if (!window.confirm("Delete this issue?")) {
      return;
    }

    setError("");

    try {
      await api.delete(`/issues/${issueId}`);

      setIssueAnalyses((previous) => {
        const updated = { ...previous };
        delete updated[issueId];
        return updated;
      });

      await loadIssues();
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not delete issue."
      );
    }
  };

  // ANALYZE ISSUE USING AI
  const analyzeIssue = async (issueId) => {
    setAnalyzingIssueId(issueId);
    setError("");

    setAnalysisMessages((previous) => ({
      ...previous,
      [issueId]: "",
    }));

    try {
      const response = await api.post(
        `/issues/${issueId}/analyze`
      );

      const aiResult = response.data.ai_analysis;

      const savedResult = {
        analysis_id: response.data.analysis_id,
        category: aiResult.category,
        suggested_priority: aiResult.suggested_priority,
        root_cause: aiResult.root_cause,
        troubleshooting_steps: aiResult.troubleshooting_steps,
      };

      setIssueAnalyses((previous) => ({
        ...previous,
        [issueId]: [savedResult],
      }));

      setExpandedAnalysisId(issueId);

      setIssues((previous) =>
        previous.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                priority: response.data.updated_priority,
              }
            : issue
        )
      );

      setAnalysisMessages((previous) => ({
        ...previous,
        [issueId]: response.data.priority_updated
          ? "AI analysis completed. Issue priority was automatically updated."
          : "AI analysis completed. The existing priority was retained.",
      }));

      await loadIssues();
      await loadDashboard();
    } catch (err) {
      setAnalysisMessages((previous) => ({
        ...previous,
        [issueId]:
          err.response?.data?.detail ||
          "AI analysis failed. Please try again.",
      }));
    } finally {
      setAnalyzingIssueId(null);
    }
  };

  // GET SAVED AI ANALYSIS
  const viewSavedAnalysis = async (issueId) => {
    setError("");

    if (expandedAnalysisId === issueId) {
      setExpandedAnalysisId(null);
      return;
    }

    try {
      const response = await api.get(
        `/issues/${issueId}/analysis`
      );

      setIssueAnalyses((previous) => ({
        ...previous,
        [issueId]: response.data.analyses,
      }));

      setExpandedAnalysisId(issueId);

      setAnalysisMessages((previous) => ({
        ...previous,
        [issueId]: "",
      }));
    } catch (err) {
      setAnalysisMessages((previous) => ({
        ...previous,
        [issueId]:
          err.response?.data?.detail ||
          "Could not retrieve saved AI analysis.",
      }));
    }
  };

  // LOAD TASKS
  const loadTasks = async () => {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not load tasks."
      );
    }
  };

  // RESET TASK FORM
  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("Medium");
    setTaskProject("");
    setTaskAssignee("");
  };

  // CREATE TASK
  const createTask = async (e) => {
    e.preventDefault();
    setError("");

    if (!taskProject) {
      setError("Please select a project.");
      return;
    }

    const taskData = {
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      project_id: Number(taskProject),
      assigned_to: taskAssignee
        ? Number(taskAssignee)
        : null,
    };

    try {
      await api.post("/tasks", taskData);

      resetTaskForm();
      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Task creation failed."
      );
    }
  };

  // UPDATE TASK STATUS
  const updateTaskStatus = async (taskId, status) => {
    setError("");

    try {
      await api.put(`/tasks/${taskId}`, {
        status: status,
      });

      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not update task."
      );
    }
  };

  // DELETE TASK
  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setError("");

    try {
      await api.delete(`/tasks/${taskId}`);
      await loadTasks();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Could not delete task."
      );
    }
  };

  // NAVIGATION
  const openPage = (page) => {
    setActivePage(page);
    setError("");

    if (page === "Dashboard") {
      loadDashboard();
    }

    if (page === "Projects") {
      loadProjects();
    }

    if (page === "Issues") {
      loadProjects();
      loadIssues();
      resetIssueForm();
    }

    if (page === "Tasks") {
      loadProjects();
      loadTasks();
      resetTaskForm();
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    if (loggedIn) {
      loadDashboard();
    }
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      setLoggedIn(true);
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("access_token");

    setLoggedIn(false);
    setDashboard(null);
    setProjects([]);
    setIssues([]);
    setTasks([]);
    setIssueAnalyses({});
    setAnalysisMessages({});
    setExpandedAnalysisId(null);
    setPassword("");
    setActivePage("Dashboard");
    setError("");

    resetIssueForm();
    resetTaskForm();
  };

  // LOGIN PAGE
  if (!loggedIn) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>✦ DevTrack AI</h1>
          <p>Sign in to your development workspace</p>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className="error-message">{error}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // MAIN APPLICATION
  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>✦ DevTrack AI</h1>
          <p>Development Management Workspace</p>
        </div>

        <button onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* NAVIGATION */}
      <nav className="app-navigation">
        {["Dashboard", "Projects", "Issues", "Tasks"].map(
          (page) => (
            <button
              key={page}
              className={
                activePage === page ? "nav-active" : ""
              }
              onClick={() => openPage(page)}
            >
              {page}
            </button>
          )
        )}
      </nav>

      <main className="dashboard-main">

        {error && (
          <p className="error-message">{error}</p>
        )}

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <>
            <h2>Welcome back 👋</h2>
            <p>Your development overview</p>

            {!dashboard ? (
              <p>Loading dashboard...</p>
            ) : (
              <>
                <div className="stats-grid">

                  <div className="stat-card">
                    <span>Total Issues</span>
                    <h2>{dashboard.total_issues}</h2>
                  </div>

                  <div className="stat-card">
                    <span>Open Issues</span>
                    <h2>
                      {dashboard.issues_by_status?.Open || 0}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <span>High Priority</span>
                    <h2>
                      {dashboard.issues_by_priority?.High || 0}
                    </h2>
                  </div>

                  <div className="stat-card">
                    <span>AI Analyses</span>
                    <h2>
                      {dashboard.ai_insights?.total_analyzed || 0}
                    </h2>
                  </div>

                </div>

                <section className="content-card">
                  <h3>Issues by Status</h3>

                  {Object.entries(
                    dashboard.issues_by_status || {}
                  ).map(([status, count]) => (
                    <p key={status}>
                      {status}: {count}
                    </p>
                  ))}
                </section>

                <section className="content-card">
                  <h3>AI Insights</h3>

                  <p>
                    Most common category:{" "}
                    {dashboard.ai_insights?.most_common_category ||
                      "None yet"}
                  </p>

                  <h4>Recommendations</h4>

                  {dashboard.ai_insights?.recommendations?.map(
                    (item, index) => (
                      <p key={index}>• {item}</p>
                    )
                  )}
                </section>
              </>
            )}
          </>
        )}

        {/* PROJECTS */}
        {activePage === "Projects" && (
          <>
            <h2>Project Management</h2>
            <p>Create and manage your development projects.</p>

            <section className="content-card">
              <h3>Create New Project</h3>

              <form
                className="project-form"
                onSubmit={createProject}
              >
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectName}
                  onChange={(e) =>
                    setProjectName(e.target.value)
                  }
                  minLength={3}
                  maxLength={150}
                  required
                />

                <textarea
                  placeholder="Project description"
                  value={projectDescription}
                  onChange={(e) =>
                    setProjectDescription(e.target.value)
                  }
                />

                <button type="submit">
                  + Create Project
                </button>
              </form>
            </section>

            <section className="content-card">
              <h3>Your Projects ({projects.length})</h3>

              {projects.length === 0 ? (
                <p>No projects found. Create your first project!</p>
              ) : (
                <div className="project-list">
                  {projects.map((project) => (
                    <div
                      className="project-item"
                      key={project.id}
                    >
                      <div>
                        <h3>{project.name}</h3>

                        <p>
                          {project.description ||
                            "No description provided"}
                        </p>

                        <span>
                          Status: {project.status}
                        </span>

                        <p>Project ID: {project.id}</p>
                      </div>

                      <button
                        className="delete-button"
                        onClick={() => deleteProject(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ISSUES */}
        {activePage === "Issues" && (
          <>
            <h2>Issue Management</h2>
            <p>Create, edit, analyze and track development issues.</p>

            <section className="content-card">
              <h3>
                {editingIssueId !== null
                  ? "Edit Issue"
                  : "Create New Issue"}
              </h3>

              <form
                className="project-form"
                onSubmit={saveIssue}
              >
                <input
                  type="text"
                  placeholder="Issue title"
                  value={issueTitle}
                  onChange={(e) =>
                    setIssueTitle(e.target.value)
                  }
                  minLength={3}
                  maxLength={200}
                  required
                />

                <textarea
                  placeholder="Describe the issue"
                  value={issueDescription}
                  onChange={(e) =>
                    setIssueDescription(e.target.value)
                  }
                  required
                />

                <label>Priority</label>
                <select
                  value={issuePriority}
                  onChange={(e) =>
                    setIssuePriority(e.target.value)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <label>Associated Project</label>
                <select
                  value={issueProject}
                  onChange={(e) =>
                    setIssueProject(e.target.value)
                  }
                >
                  <option value="">No project</option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>

                <button type="submit">
                  {editingIssueId !== null
                    ? "Update Issue"
                    : "+ Create Issue"}
                </button>

                {editingIssueId !== null && (
                  <button
                    type="button"
                    onClick={resetIssueForm}
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </section>

            <section className="content-card">
              <h3>Your Issues ({issues.length})</h3>

              {issues.length === 0 ? (
                <p>No issues found. Create your first issue!</p>
              ) : (
                <div className="project-list">
                  {issues.map((issue) => {
                    const analyses = issueAnalyses[issue.id] || [];
                    const isExpanded =
                      expandedAnalysisId === issue.id;

                    return (
                      <div
                        className="project-item"
                        key={issue.id}
                      >
                        <div style={{ flex: 1 }}>
                          <h3>{issue.title}</h3>
                          <p>{issue.description}</p>
                          <p>
                            <strong>Priority:</strong>{" "}
                            {issue.priority}
                          </p>
                          <p>
                            <strong>Status:</strong> {issue.status}
                          </p>
                          <p>
                            Project ID: {issue.project_id ?? "None"}
                          </p>
                          <p>Issue ID: {issue.id}</p>

                          {/* AI ANALYSIS MESSAGE */}
                          {analysisMessages[issue.id] && (
                            <p
                              style={{
                                color: "#2563eb",
                                marginTop: "10px",
                              }}
                            >
                              {analysisMessages[issue.id]}
                            </p>
                          )}

                          {/* AI ANALYSIS DETAILS */}
                          {isExpanded && analyses.length > 0 && (
                            <div
                              style={{
                                marginTop: "15px",
                                padding: "15px",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                background: "#f8fafc",
                              }}
                            >
                              <h3>AI Analysis Results</h3>

                              {analyses.map((analysis, index) => (
                                <div
                                  key={
                                    analysis.analysis_id ||
                                    `${issue.id}-${index}`
                                  }
                                  style={{
                                    marginBottom: "18px",
                                    paddingBottom: "12px",
                                    borderBottom:
                                      index !== analyses.length - 1
                                        ? "1px solid #d1d5db"
                                        : "none",
                                  }}
                                >
                                  <p>
                                    <strong>Analysis:</strong>{" "}
                                    {index + 1}
                                  </p>

                                  <p>
                                    <strong>Category:</strong>{" "}
                                    {analysis.category}
                                  </p>

                                  <p>
                                    <strong>Suggested Priority:</strong>{" "}
                                    {analysis.suggested_priority}
                                  </p>

                                  <p>
                                    <strong>Root Cause:</strong>
                                  </p>

                                  <p>{analysis.root_cause}</p>

                                  <p>
                                    <strong>
                                      Troubleshooting Steps:
                                    </strong>
                                  </p>

                                  {Array.isArray(
                                    analysis.troubleshooting_steps
                                  ) ? (
                                    <ol>
                                      {analysis.troubleshooting_steps.map(
                                        (step, stepIndex) => (
                                          <li key={stepIndex}>
                                            {typeof step === "string"
                                              ? step
                                              : JSON.stringify(step)}
                                          </li>
                                        )
                                      )}
                                    </ol>
                                  ) : (
                                    <p>
                                      {analysis.troubleshooting_steps}
                                    </p>
                                  )}

                                  {analysis.created_at && (
                                    <p>
                                      <small>
                                        Analyzed:{" "}
                                        {new Date(
                                          analysis.created_at
                                        ).toLocaleString()}
                                      </small>
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ISSUE ACTIONS */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            minWidth: "140px",
                          }}
                        >
                          <button
                            onClick={() => analyzeIssue(issue.id)}
                            disabled={
                              analyzingIssueId === issue.id
                            }
                          >
                            {analyzingIssueId === issue.id
                              ? "Analyzing..."
                              : "Analyze with AI"}
                          </button>

                          <button
                            onClick={() =>
                              viewSavedAnalysis(issue.id)
                            }
                          >
                            {isExpanded
                              ? "Hide AI Analysis"
                              : "View Saved Analysis"}
                          </button>

                          <button
                            onClick={() => editIssue(issue)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => deleteIssue(issue.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* TASKS */}
        {activePage === "Tasks" && (
          <>
            <h2>Task Management</h2>
            <p>Create, assign and track development tasks.</p>

            <section className="content-card">
              <h3>Create New Task</h3>

              <form
                className="project-form"
                onSubmit={createTask}
              >
                <input
                  type="text"
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) =>
                    setTaskTitle(e.target.value)
                  }
                  minLength={3}
                  maxLength={200}
                  required
                />

                <textarea
                  placeholder="Task description"
                  value={taskDescription}
                  onChange={(e) =>
                    setTaskDescription(e.target.value)
                  }
                />

                <label>Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <label>Project</label>
                <select
                  value={taskProject}
                  onChange={(e) =>
                    setTaskProject(e.target.value)
                  }
                  required
                >
                  <option value="">Select Project</option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>

                <label>Assign To (User ID)</label>
                <input
                  type="number"
                  placeholder="Enter user ID (optional)"
                  min="1"
                  value={taskAssignee}
                  onChange={(e) =>
                    setTaskAssignee(e.target.value)
                  }
                />

                <button type="submit">
                  + Create Task
                </button>
              </form>
            </section>

            <section className="content-card">
              <h3>Your Tasks ({tasks.length})</h3>

              {tasks.length === 0 ? (
                <p>No tasks found. Create your first task!</p>
              ) : (
                <div className="project-list">
                  {tasks.map((task) => (
                    <div
                      className="project-item"
                      key={task.id}
                    >
                      <div>
                        <h3>{task.title}</h3>

                        <p>
                          {task.description || "No description"}
                        </p>

                        <p>Priority: {task.priority}</p>
                        <p>Project ID: {task.project_id}</p>

                        <p>
                          Assigned To:{" "}
                          {task.assigned_to ?? "Unassigned"}
                        </p>

                        <p>Task ID: {task.id}</p>
                      </div>

                      <div>
                        <label>Status</label>

                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTaskStatus(
                              task.id,
                              e.target.value
                            )
                          }
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">
                            In Progress
                          </option>
                          <option value="Completed">Completed</option>
                        </select>

                        <button
                          className="delete-button"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default App;

