import "./globals.css";

export const metadata = {
  title: "Multi-User Workspace Task Management",
  description: "A task manager with workspaces, role-based access, and analytics dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
