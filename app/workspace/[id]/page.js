"use client";

import { useEffect, useMemo, useState } from "react";

const STATUSES = ["To Do", "In Progress", "Done"];
const ROLES = ["Admin", "Member", "Viewer"];

function toDateInputValue(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toISOString().split("T")[0];
}

export default function WorkspacePage({ params }) {
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
    images: [],
  });
  const [selectedTask, setSelectedTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
    images: [],
  });
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const workspaceId = useMemo(() => params.id, [params.id]);

  async function load() {
    const [wsRes, taskRes] = await Promise.all([
      fetch("/api/workspace/list"),
      fetch(`/api/task/list?workspaceId=${workspaceId}`),
    ]);

    if (wsRes.ok) {
      const data = await wsRes.json();
      const current = data.workspaces.find((w) => w._id === workspaceId);
      setWorkspace(current || null);
    }

    if (taskRes.ok) {
      const data = await taskRes.json();
      setTasks(data.tasks || []);
    }
  }

  useEffect(() => {
    load();
  }, [workspaceId]);

  function openTaskEditor(task) {
    setSelectedTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "To Do",
      priority: task.priority || "Medium",
      assignedTo: task.assignedTo?._id || "",
      dueDate: toDateInputValue(task.dueDate),
      images: task.images || [],
    });
  }

  async function uploadTaskImage(file, forEdit = false) {
    setError("");
    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body,
    });

    setUploading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to upload image.");
      return;
    }

    const data = await response.json();
    const image = data.image;

    if (forEdit) {
      setEditForm((prev) => ({ ...prev, images: [...prev.images, image] }));
    } else {
      setForm((prev) => ({ ...prev, images: [...prev.images, image] }));
    }
  }

  function removeImage(index, forEdit = false) {
    if (forEdit) {
      setEditForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }));
      return;
    }

    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }));
  }

  async function createTask(e) {
    e.preventDefault();
    setError("");

    const response = await fetch("/api/task/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        workspaceId,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to create task.");
      return;
    }

    setForm({
      title: "",
      description: "",
      priority: "Medium",
      assignedTo: "",
      dueDate: "",
      images: [],
    });
    load();
  }

  async function saveTaskEdits() {
    if (!selectedTask) return;
    setError("");

    const response = await fetch(`/api/task/update/${selectedTask._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        assignedTo: editForm.assignedTo || null,
        dueDate: editForm.dueDate || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to update task.");
      return;
    }

    setSelectedTask(null);
    load();
  }

  async function updateStatus(taskId, status) {
    await fetch(`/api/task/update/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function addMember(e) {
    e.preventDefault();
    setError("");

    const response = await fetch(`/api/workspace/${workspaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail, role: memberRole }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to add member.");
      return;
    }

    setMemberEmail("");
    setMemberRole("Member");
    load();
  }

  async function changeRole(userId, role) {
    await fetch(`/api/workspace/${workspaceId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    load();
  }

  async function removeMember(userId) {
    await fetch(`/api/workspace/${workspaceId}/members?userId=${userId}`, {
      method: "DELETE",
    });
    load();
  }

  const filtered = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
  const groupedTasks = STATUSES.map((status) => ({
    status,
    items: filtered.filter((task) => task.status === status),
  }));

  return (
    <main className="container workspace-shell">
      <section className="card workspace-header">
        <div>
          <p className="badge">Workspace</p>
          <h2>{workspace?.name || "Workspace"}</h2>
        </div>
        <input
          placeholder="Search tasks by title"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </section>

      {error ? <div className="card error-card"><p>{error}</p></div> : null}

      <section className="workspace-grid">
        <div>
          <form className="card" onSubmit={createTask}>
            <h3>Create Task</h3>
            <input
              value={form.title}
              placeholder="Task title"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              value={form.description}
              placeholder="Description"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="row">
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {workspace?.members?.map((member) => (
                  <option key={member.userId._id} value={member.userId._id}>
                    {member.userId.name} ({member.role})
                  </option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div className="upload-row">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const [file] = e.target.files || [];
                  if (file) uploadTaskImage(file, false);
                  e.target.value = "";
                }}
              />
              {uploading ? <p className="empty-text">Uploading image...</p> : null}
            </div>
            <div className="image-grid">
              {form.images.map((image, index) => (
                <div key={`${image.url}-${index}`} className="image-pill">
                  <img src={image.url} alt={image.name} />
                  <button type="button" className="secondary" onClick={() => removeImage(index, false)}>Remove</button>
                </div>
              ))}
            </div>

            <button type="submit">Create Task</button>
          </form>

          <div className="card">
            <h3>Members & Roles</h3>
            <form className="row" onSubmit={addMember}>
              <input
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                type="email"
                placeholder="Member email"
                required
              />
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                {ROLES.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
              <button type="submit">Add Member</button>
            </form>

            {workspace?.members?.map((member) => (
              <div className="member-row" key={member.userId._id}>
                <span>
                  {member.userId.name} <small>({member.userId.email})</small>
                </span>
                <div className="row compact">
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.userId._id, e.target.value)}
                  >
                    {ROLES.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => removeMember(member.userId._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="board-layout">
          {groupedTasks.map((group) => (
            <section key={group.status} className="kanban-column">
              <header className="column-header">
                <h4>{group.status}</h4>
                <span className="badge">{group.items.length}</span>
              </header>

              {group.items.length === 0 ? <p className="empty-text">No tasks</p> : null}

              {group.items.map((task) => (
                <article key={task._id} className="task-card" onClick={() => openTaskEditor(task)}>
                  <h5>{task.title}</h5>
                  <p>{task.description || "No description"}</p>
                  {task.images?.length ? (
                    <img className="task-image" src={task.images[0].url} alt={task.images[0].name} />
                  ) : null}
                  <div className="task-meta">
                    <span className="badge">{task.priority}</span>
                    <span>{task.assignedTo?.name || "Unassigned"}</span>
                  </div>
                  <select
                    value={task.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateStatus(task._id, e.target.value)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </article>
              ))}
            </section>
          ))}
        </div>
      </section>

      {selectedTask ? (
        <section className="card editor-panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3>Edit Task</h3>
            <button type="button" className="secondary" onClick={() => setSelectedTask(null)}>
              Close
            </button>
          </div>

          <input
            value={editForm.title}
            placeholder="Task title"
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <textarea
            value={editForm.description}
            placeholder="Description"
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />
          <div className="row">
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <select
              value={editForm.assignedTo}
              onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {workspace?.members?.map((member) => (
                <option key={member.userId._id} value={member.userId._id}>
                  {member.userId.name} ({member.role})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={editForm.dueDate}
              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
            />
          </div>

          <div className="upload-row">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const [file] = e.target.files || [];
                if (file) uploadTaskImage(file, true);
                e.target.value = "";
              }}
            />
          </div>
          <div className="image-grid">
            {editForm.images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="image-pill">
                <img src={image.url} alt={image.name} />
                <button type="button" className="secondary" onClick={() => removeImage(index, true)}>Remove</button>
              </div>
            ))}
          </div>

          <button type="button" onClick={saveTaskEdits}>Save Changes</button>
        </section>
      ) : null}
    </main>
  );
}
