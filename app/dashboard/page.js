"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceName, setWorkspaceName] = useState("");

  async function loadDashboard() {
    const [statsRes, wsRes] = await Promise.all([
      fetch("/api/dashboard/stats"),
      fetch("/api/workspace/list"),
    ]);

    if (statsRes.ok) setStats(await statsRes.json());
    if (wsRes.ok) {
      const data = await wsRes.json();
      setWorkspaces(data.workspaces || []);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function createWorkspace(e) {
    e.preventDefault();
    await fetch("/api/workspace/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workspaceName }),
    });
    setWorkspaceName("");
    loadDashboard();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Dashboard Analytics</h2>
          <button className="secondary" style={{ width: 120 }} onClick={logout}>Logout</button>
        </div>
        <div className="grid">
          <div className="card"><strong>Total Tasks</strong><p>{stats?.totalTasks ?? 0}</p></div>
          <div className="card"><strong>Completed</strong><p>{stats?.completedTasks ?? 0}</p></div>
          <div className="card"><strong>Pending</strong><p>{stats?.pendingTasks ?? 0}</p></div>
          <div className="card"><strong>Overdue</strong><p>{stats?.overdueTasks ?? 0}</p></div>
          <div className="card"><strong>Completion Rate</strong><p>{stats?.completionRate ?? 0}%</p></div>
        </div>
      </div>

      <form className="card" onSubmit={createWorkspace}>
        <h3>Create Workspace</h3>
        <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Workspace name" required />
        <button type="submit">Create</button>
      </form>

      <div className="card">
        <h3>Your Workspaces</h3>
        {workspaces.length === 0 ? <p>No workspaces yet.</p> : null}
        {workspaces.map((workspace) => (
          <div className="row" key={workspace._id} style={{ justifyContent: "space-between" }}>
            <div>
              <p><strong>{workspace.name}</strong></p>
              <span className="badge">Members: {workspace.members.length}</span>
            </div>
            <Link href={`/workspace/${workspace._id}`}>Open</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
