
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function ProjectMembers({ project, users, onMembersChanged }) {
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const projectId = project?._id;
  const leadId = project?.project_lead_id?._id;

  async function loadMembers(id) {
    const response = await fetch(
      `${API_URL}/projects/${id}/members`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error loading members");
    }

    return data;
  }

  useEffect(() => {
    let active = true;

    async function fetchMembers() {
      setMembers([]);
      setMessage("");
      setSelectedUserId("");

      if (!projectId) return;

      setLoading(true);

      try {
        const data = await loadMembers(projectId);

        if (active) {
          setMembers(data);
        }
      } catch (error) {
        if (active) {
          setMessage(error.message);
          setMessageType("error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchMembers();

    return () => {
      active = false;
    };
  }, [projectId]);

  async function handleAddMember(event) {
    event.preventDefault();

    if (!selectedUserId || !projectId) {
      setMessage("Please select a user");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: selectedUserId
          })
        }
      );

      const data = await response.json();

      setMessage(data.message);
      setMessageType(response.ok ? "success" : "error");

      if (response.ok) {
        const updatedMembers = await loadMembers(projectId);

        setMembers(updatedMembers);
        setSelectedUserId("");

        // PA4: Update the backlog assignee dropdown
        onMembersChanged?.();
      }
    } catch (error) {
      setMessage(error.message || "Could not connect to server");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(userId) {
    if (userId === leadId) {
      setMessage("Project Lead cannot be removed");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/members/${userId}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      setMessage(data.message);
      setMessageType(response.ok ? "success" : "error");

      if (response.ok) {
        const updatedMembers = await loadMembers(projectId);

        setMembers(updatedMembers);

        // PA4: Update the backlog after member removal
        onMembersChanged?.();
      }
    } catch (error) {
      setMessage(error.message || "Could not connect to server");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  if (!project) {
    return (
      <div className="section-card">
        <h2>Project Members</h2>

        <p className="empty-message">
          Select a project to manage its members.
        </p>
      </div>
    );
  }

  return (
    <div className="section-card">
      <h2>Project Members</h2>

      <p className="section-subtitle">
        Managing members for: <strong>{project.name}</strong>
      </p>

      <form onSubmit={handleAddMember}>
        <div className="input-group">
          <label htmlFor="member-select">
            Select User
          </label>

          <select
            id="member-select"
            value={selectedUserId}
            onChange={(event) =>
              setSelectedUserId(event.target.value)
            }
            required
          >
            <option value="">
              Select a registered user
            </option>

            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.f_name} {user.l_name} ({user.username})
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Add Member"}
        </button>
      </form>

      {message && (
        <p className={`message ${messageType}`}>
          {message}
        </p>
      )}

      <h3 className="members-heading">
        Current Members
      </h3>

      {loading && <p>Updating members...</p>}

      {members.length === 0 ? (
        <p className="empty-message">
          No members to display.
        </p>
      ) : (
        <div className="member-list">
          {members.map((membership) => {
            const user = membership.user_id;

            if (!user) return null;

            const isLead = user._id === leadId;

            return (
              <div
                className="member-item"
                key={membership._id}
              >
                <div className="member-info">
                  <strong>
                    {user.f_name} {user.l_name}
                  </strong>

                  <span>@{user.username}</span>
                </div>

                {isLead ? (
                  <span className="lead-badge">
                    Project Lead
                  </span>
                ) : (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() =>
                      handleRemoveMember(user._id)
                    }
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProjectMembers;
