import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1>🚀 Multi-User Workspace Task Management</h1>
        <p>Create workspaces, invite users, assign tasks, and track analytics.</p>
        <div className="row">
          <Link href="/register">Register</Link>
          <Link href="/login">Login</Link>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
