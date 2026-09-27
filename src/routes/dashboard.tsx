import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "../components/aether/dashboard-shell";
import { useApp } from "../lib/store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { currentUser } = useApp();

  return (
    <DashboardShell role="user" user={currentUser}>
      <Outlet />
    </DashboardShell>
  );
}
