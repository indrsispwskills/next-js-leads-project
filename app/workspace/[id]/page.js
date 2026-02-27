"use client";

import { useEffect, useMemo, useState } from "react";

const STATUSES = ["To Do", "In Progress", "Done"];
const ROLES = ["Admin", "Member", "Viewer"];

export default function WorkspacePage({ params }) {
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", assignedTo: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [error, setError] = useState("");

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
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to create task.");
      return;
    }

    setForm({ title: "", description: "", priority: "Medium", assignedTo: "" });
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

  return (
    <main className="container">
      <div className="card">
        <h2>{workspace?.name || "Workspace"}</h2>
        <input placeholder="Search task by title" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {error ? <div className="card"><p>{error}</p></div> : null}

      <form className="card" onSubmit={createTask}>
        <h3>Create Task</h3>
        <input value={form.title} placeholder="Task title" onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea value={form.description} placeholder="Description" onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {workspace?.members?.map((member) => (
            <option key={member.userId._id} value={member.userId._id}>
              {member.userId.name} ({member.role})
            </option>
          ))}
        </select>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <button type="submit">Create Task</button>
      </form>

      <div className="card">
        <h3>Workspace Members</h3>
        <form onSubmit={addMember}>
          <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} type="email" placeholder="Member email" required />
          <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
            {ROLES.map((role) => <option key={role}>{role}</option>)}
          </select>
          <button type="submit">Add Member</button>
        </form>

        {workspace?.members?.map((member) => (
          <div className="row" key={member.userId._id} style={{ justifyContent: "space-between" }}>
            <span>{member.userId.name} ({member.userId.email})</span>
            <div className="row">
              <select value={member.role} onChange={(e) => changeRole(member.userId._id, e.target.value)}>
                {ROLES.map((role) => <option key={role}>{role}</option>)}
              </select>
              <button type="button" className="secondary" onClick={() => removeMember(member.userId._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid">
        {filtered.map((task) => (
          <div key={task._id} className="card">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p><span className="badge">{task.priority}</span></p>
            <p>Assigned: {task.assignedTo?.name || "Unassigned"}</p>
            <select value={task.status} onChange={(e) => updateStatus(task._id, e.target.value)}>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        ))}
      </div>
    </main>
  );
}
