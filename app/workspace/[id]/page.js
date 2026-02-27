"use client";

import { useEffect, useMemo, useState } from "react";

const STATUSES = ["To Do", "In Progress", "Done"];

export default function WorkspacePage({ params }) {
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium" });

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
    await fetch("/api/task/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, workspaceId }),
    });
    setForm({ title: "", description: "", priority: "Medium" });
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

  const filtered = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="container">
      <div className="card">
        <h2>{workspace?.name || "Workspace"}</h2>
        <input placeholder="Search task by title" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <form className="card" onSubmit={createTask}>
        <h3>Create Task</h3>
        <input value={form.title} placeholder="Task title" onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea value={form.description} placeholder="Description" onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <button type="submit">Create Task</button>
      </form>

      <div className="grid">
        {filtered.map((task) => (
          <div key={task._id} className="card">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p><span className="badge">{task.priority}</span></p>
            <select value={task.status} onChange={(e) => updateStatus(task._id, e.target.value)}>
              {STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        ))}
      </div>
    </main>
  );
}
