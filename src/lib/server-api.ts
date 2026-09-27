import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
  const serviceKey = process.env["SUPABASE_SECRET_KEY"] || "";

  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export const deleteEventServerFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    try {
      const adminSb = getAdminSupabase();
      if (!adminSb) return { success: false, message: "Service key not configured" };

      const { error } = await adminSb.from("events").delete().eq("id", id);
      if (error) {
        console.error("[deleteEventServerFn] Error:", error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error("[deleteEventServerFn] Exception:", err);
      return { success: false, message: err?.message };
    }
  });

export const deleteAllEventsServerFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const adminSb = getAdminSupabase();
    if (!adminSb) return { success: false, message: "Service key not configured" };

    const { error } = await adminSb.from("events").delete().neq("id", "");
    if (error) {
      console.error("[deleteAllEventsServerFn] Error:", error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[deleteAllEventsServerFn] Exception:", err);
    return { success: false, message: err?.message };
  }
});
