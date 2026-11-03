
import { useEffect, useState } from "react";
import "./App.css";

import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
import ProjectBacklog from "./components/ProjectBacklog";

const API_URL = "http://localhost:5000";

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [page, setPage] = useState("auth");

  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    username: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dashboardError, setDashboardError] = useState("");

  // HANDLE FORM INPUT

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });
  }

  // LOGIN AND SIGNUP

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const endpoint = isLogin ? "/login" : "/signup";

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      setMessage(data.message);
      setMessageType(response.ok ? "success" : "error");

      if (response.ok) {
        setFormData({
          f_name: "",
          l_name: "",
          username: "",
          password: ""
        });

        if (isLogin) {
          setPage("dashboard");
        }
      }
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to server");
      setMessageType("error");
    }
  }

  // SWITCH BETWEEN LOGIN AND SIGNUP

  function switchForm() {
    setIsLogin(!isLogin);
    setMessage("");
    setMessageType("");

    setFormData({
      f_name: "",
      l_name: "",
      username: "",
      password: ""
    });
  }

  // LOAD USERS

  async function loadUsers() {
    const response = await fetch(`${API_URL}/users`);

    if (!response.ok) {
      throw new Error("Could not load registered users");
    }

    const data = await response.json();
    setUsers(data);
  }

  // LOAD PROJECTS

  async function loadProjects() {
    const response = await fetch(`${API_URL}/projects`);

    if (!response.ok) {
      throw new Error("Could not load projects");
    }

    const data = await response.json();
    setProjects(data);

    setSelectedProject((current) => {
      if (!current) return null;

      return (
        data.find((project) => project._id === current._id) ||
        null
      );
    });
  }

  // LOAD DASHBOARD DATA

  useEffect(() => {
    if (page !== "dashboard") return;

    async function loadDashboard() {
      try {
        setDashboardError("");

        await Promise.all([
          loadUsers(),
          loadProjects()
        ]);
      } catch (error) {
        setDashboardError(error.message);
      }
    }

    loadDashboard();
  }, [page]);

  // REFRESH PROJECTS AFTER CREATING ONE

  async function handleProjectCreated() {
    try {
      await loadProjects();
      setDashboardError("");
    } catch (error) {
      setDashboardError(error.message);
    }
  }

  // LOGOUT

  function handleLogout() {
    setPage("auth");
    setIsLogin(true);
    setSelectedProject(null);
    setMessage("");
    setMessageType("");
  }

  // DASHBOARD

  if (page === "dashboard") {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">

          <header className="dashboard-header">
            <div>
              <h1>Project Management</h1>
              <p>
                Manage your software projects,
                team members, and user stories.
              </p>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </header>

          {dashboardError && (
            <p className="message error">
              {dashboardError}
            </p>
          )}

          {/* CREATE AND VIEW PROJECTS */}

          <div className="dashboard-grid">
            <CreateProject
              users={users}
              onProjectCreated={handleProjectCreated}
            />

            <ProjectList
              projects={projects}
              selectedProjectId={selectedProject?._id}
              onSelectProject={setSelectedProject}
            />
          </div>

          {/* MANAGE PROJECT MEMBERS */}

          <ProjectMembers
            project={selectedProject}
            users={users}
          />

          {/* PA4 - PROJECT BACKLOG */}

          {selectedProject && (
            <ProjectBacklog
              selectedProject={selectedProject}
            />
          )}

        </div>
      </div>
    );
  }

  // LOGIN AND SIGNUP PAGE

  return (
    <div className="page">
      <div className="card">

        <h1>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        <p className="subtitle">
          {isLogin
            ? "Log in to continue"
            : "Sign up to get started"}
        </p>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <div className="name-row">

              <div className="input-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="f_name"
                  value={formData.f_name}
                  onChange={handleChange}
                  placeholder="First name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="l_name"
                  value={formData.l_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  required
                />
              </div>

            </div>
          )}

          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={
                isLogin
                  ? "Enter your username"
                  : "Choose your username"
              }
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={
                isLogin
                  ? "Enter your password"
                  : "Choose your password"
              }
              required
            />
          </div>

          <button type="submit">
            {isLogin ? "Log In" : "Sign Up"}
          </button>

          <p className="switch-text">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              className="link-button"
              onClick={switchForm}
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>

          {message && (
            <p className={`message ${messageType}`}>
              {message}
            </p>
          )}

        </form>
      </div>
    </div>
  );
}

export default App;
