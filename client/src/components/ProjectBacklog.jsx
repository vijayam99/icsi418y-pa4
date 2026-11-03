
import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5000";

const emptyForm = {
  title: "",
  description: "",
  priority: "Medium",
  status: "To Do",
  assigned_user_id: "",
};

function ProjectBacklog({ selectedProject }) {
  const projectId = selectedProject?._id;

  const [stories, setStories] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [storyToDelete, setStoryToDelete] = useState(null);

  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const modalRef = useRef(null);

  // Load stories and project members.
  useEffect(() => {
    if (!projectId) return;

    const controller = new AbortController();
    let active = true;

    async function loadData() {
      setLoading(true);
      setStories([]);
      setMembers([]);
      setForm({ ...emptyForm });
      setEditingId(null);
      setStoryToDelete(null);
      setError("");

      try {
        const [storiesResponse, membersResponse] = await Promise.all([
          fetch(`${API_URL}/projects/${projectId}/stories`, {
            signal: controller.signal,
          }),
          fetch(`${API_URL}/projects/${projectId}/members`, {
            signal: controller.signal,
          }),
        ]);

        const storiesData = await storiesResponse.json();
        const membersData = await membersResponse.json();

        if (!storiesResponse.ok) {
          throw new Error(
            storiesData.message || "Could not load user stories."
          );
        }

        if (!membersResponse.ok) {
          throw new Error(
            membersData.message || "Could not load project members."
          );
        }

        if (!active) return;

        const storyList = Array.isArray(storiesData)
          ? storiesData
          : storiesData.stories || [];

        setStories(storyList);

        const memberList = Array.isArray(membersData)
          ? membersData
          : membersData.members || [];

        const normalizedMembers = memberList
          .map((member) => member.user_id || member.user || member)
          .filter((member) => member && member._id);

        const lead = selectedProject.project_lead_id;

        if (lead && typeof lead === "object" && lead._id) {
          const leadExists = normalizedMembers.some(
            (member) => member._id === lead._id
          );

          if (!leadExists) {
            normalizedMembers.unshift(lead);
          }
        }

        setMembers(normalizedMembers);
      } catch (err) {
        if (err.name !== "AbortError" && active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [projectId, refreshKey, selectedProject]);

  // Focus the Cancel button when the modal opens.
  // Escape closes it, and Tab stays inside the modal.
  useEffect(() => {
    if (!storyToDelete) return;

    previousFocusRef.current = document.activeElement;
    cancelButtonRef.current?.focus();

    function handleModalKeyDown(event) {
      if (event.key === "Escape") {
        if (!deleting) {
          setStoryToDelete(null);
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleModalKeyDown);

    return () => {
      document.removeEventListener("keydown", handleModalKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [storyToDelete, deleting]);

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  function refreshBacklog() {
    setRefreshKey((previous) => previous + 1);
  }

  // Create or update a user story.
  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSaving(true);
    setError("");

    const isEditing = Boolean(editingId);

    const url = isEditing
      ? `${API_URL}/projects/${projectId}/stories/${editingId}`
      : `${API_URL}/projects/${projectId}/stories`;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      assigned_user_id: form.assigned_user_id || null,
    };

    if (isEditing) {
      payload.status = form.status;
    }

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save user story.");
      }

      resetForm();
      refreshBacklog();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Fill the form with the selected story.
  function handleEdit(story) {
    setEditingId(story._id);

    setForm({
      title: story.title || "",
      description: story.description || "",
      priority: story.priority || "Medium",
      status: story.status || "To Do",
      assigned_user_id:
        typeof story.assigned_user_id === "object"
          ? story.assigned_user_id?._id || ""
          : story.assigned_user_id || "",
    });

    setError("");

    document
      .getElementById("backlog-story-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  // Open custom confirmation popup.
  function openDeleteModal(story) {
    setError("");
    setStoryToDelete(story);
  }

  // Delete only after confirmation.
  async function handleDelete() {
    if (!storyToDelete || deleting) return;

    const storyId = storyToDelete._id;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/stories/${storyId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete user story.");
      }

      if (editingId === storyId) {
        resetForm();
      }

      setStoryToDelete(null);
      refreshBacklog();
    } catch (err) {
      setError(err.message);
      setStoryToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function getMemberName(member) {
    if (!member) return "Unassigned";

    const fullName = `${member.f_name || ""} ${
      member.l_name || ""
    }`.trim();

    return fullName || member.username || "Unknown Member";
  }

  function getAssignedName(story) {
    const assigned = story.assigned_user_id;

    if (!assigned) return "Unassigned";

    if (typeof assigned === "object") {
      return getMemberName(assigned);
    }

    const member = members.find(
      (item) => item._id === assigned
    );

    return member
      ? getMemberName(member)
      : "Assigned Member";
  }

  function getStatusClass(status) {
    if (status === "In Progress") return "in-progress";
    if (status === "Done") return "done";
    return "todo";
  }

  if (!projectId) return null;

  return (
    <section className="section-card project-backlog">
      {/* Backlog Header */}
      <div className="backlog-header">
        <div>
          <h2>Project Backlog</h2>
          <p>{selectedProject.name}</p>
        </div>

        <span className="backlog-count">
          {stories.length}{" "}
          {stories.length === 1 ? "Story" : "Stories"}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}

      {/* Create / Edit Form */}
      <form
        id="backlog-story-form"
        className="backlog-form"
        onSubmit={handleSubmit}
      >
        <h3>
          {editingId
            ? "Edit User Story"
            : "Create User Story"}
        </h3>

        <div className="backlog-field">
          <label htmlFor="story-title">
            Story Title
          </label>

          <input
            id="story-title"
            type="text"
            placeholder="Enter a short story title"
            value={form.title}
            onChange={(event) =>
              updateForm("title", event.target.value)
            }
            required
          />
        </div>

        <div className="backlog-field">
          <label htmlFor="story-description">
            Description
          </label>

          <textarea
            id="story-description"
            placeholder="As a user, I want..., so that..."
            value={form.description}
            onChange={(event) =>
              updateForm("description", event.target.value)
            }
            required
          />

          <span className="backlog-hint">
            Describe who needs the feature, what they
            want, and why.
          </span>
        </div>

        <div className="backlog-form-grid">
          <div className="backlog-field">
            <label htmlFor="story-priority">
              Priority
            </label>

            <select
              id="story-priority"
              value={form.priority}
              onChange={(event) =>
                updateForm(
                  "priority",
                  event.target.value
                )
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="backlog-field">
            <label htmlFor="story-assignee">
              Assigned Member
            </label>

            <select
              id="story-assignee"
              value={form.assigned_user_id}
              onChange={(event) =>
                updateForm(
                  "assigned_user_id",
                  event.target.value
                )
              }
            >
              <option value="">Unassigned</option>

              {members.map((member) => (
                <option
                  key={member._id}
                  value={member._id}
                >
                  {getMemberName(member)}
                </option>
              ))}
            </select>
          </div>

          {editingId && (
            <div className="backlog-field">
              <label htmlFor="story-status">
                Status
              </label>

              <select
                id="story-status"
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    "status",
                    event.target.value
                  )
                }
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">
                  In Progress
                </option>
                <option value="Done">Done</option>
              </select>
            </div>
          )}
        </div>

        <div className="backlog-actions">
          {editingId && (
            <button
              type="button"
              className="backlog-secondary-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Save Changes"
              : "+ Create Story"}
          </button>
        </div>
      </form>

      {/* Story List Toolbar */}
      <div className="backlog-toolbar">
        <div>
          <h3>All User Stories</h3>

          <p className="backlog-toolbar-subtitle">
            Manage and track your project requirements
          </p>
        </div>

        <button
          type="button"
          className="backlog-secondary-button"
          onClick={refreshBacklog}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Story List */}
      {loading ? (
        <div className="backlog-empty">
          <p>Loading user stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="backlog-empty">
          <div className="backlog-empty-icon">
            📋
          </div>

          <h4>No user stories yet</h4>

          <p>
            Create your first story to start
            building the backlog.
          </p>
        </div>
      ) : (
        <div className="story-list">
          {stories.map((story) => (
            <article
              className="story-card"
              key={story._id}
            >
              <div className="story-header">
                <h4>{story.title}</h4>

                <span
                  className={`story-status ${getStatusClass(
                    story.status
                  )}`}
                >
                  {story.status}
                </span>
              </div>

              <p className="story-description">
                {story.description}
              </p>

              <div className="story-meta">
                <span
                  className={`story-priority ${(
                    story.priority || "Medium"
                  ).toLowerCase()}`}
                >
                  {story.priority} Priority
                </span>

                <span className="story-assignee">
                  Assigned to:{" "}
                  {getAssignedName(story)}
                </span>
              </div>

              <div className="story-actions">
                <button
                  type="button"
                  className="backlog-secondary-button"
                  onClick={() =>
                    handleEdit(story)
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="backlog-danger-button"
                  onClick={() =>
                    openDeleteModal(story)
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {storyToDelete && (
        <div
          className="delete-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setStoryToDelete(null);
            }
          }}
        >
          <div
            ref={modalRef}
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
            <div className="delete-modal-icon">
              ✕
            </div>

            <h3 id="delete-modal-title">
              Delete User Story?
            </h3>

            <p id="delete-modal-description">
              Are you sure you want to delete{" "}
              <strong>
                {storyToDelete.title}
              </strong>
              ?
            </p>

            <p className="delete-modal-warning">
              This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="backlog-secondary-button"
                onClick={() =>
                  setStoryToDelete(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Story"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProjectBacklog;
