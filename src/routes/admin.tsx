import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "../components/aether/dashboard-shell";
import { useApp } from "../lib/store";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { currentUser } = useApp();
  const speakerUser = {
    name: currentUser?.name || "Eka Revandi",
    email: currentUser?.email || "host@crave.id",
    role:
      currentUser?.role?.toLowerCase().includes("super")
        ? "Super Admin"
        : currentUser?.role?.toLowerCase().includes("speaker") ||
          currentUser?.role?.toLowerCase().includes("host")
          ? currentUser.role
          : "Speaker / Host",
  };

  return (
    <DashboardShell role="admin" user={speakerUser}>
      <Outlet />
    </DashboardShell>
  );
}

