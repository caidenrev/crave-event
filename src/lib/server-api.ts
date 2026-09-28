import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "";
  const serviceKey =
    process.env["SUPABASE_SECRET_KEY"] ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    "";

  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ==========================================
// EVENTS SERVER FUNCTIONS (Admin Role Bypass)
// ==========================================

export const fetchAllEventsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const adminSb = getAdminSupabase();
    if (!adminSb) return { success: false, data: null, message: "Supabase not configured" };

    const { data, error } = await adminSb
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("[fetchAllEventsServerFn] Error:", error.message);
      return { success: false, data: null, message: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error("[fetchAllEventsServerFn] Exception:", err);
    return { success: false, data: null, message: err?.message };
  }
});

export const createEventServerFn = createServerFn({ method: "POST" })
  .validator((payload: any) => payload)
  .handler(async ({ data: payload }) => {
    try {
      const adminSb = getAdminSupabase();
      if (!adminSb) return { success: false, data: null, message: "Supabase not configured" };

      const { data, error } = await adminSb.from("events").insert(payload).select().single();
      if (error) {
        console.error("[createEventServerFn] Error:", error.message);
        return { success: false, data: null, message: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      console.error("[createEventServerFn] Exception:", err);
      return { success: false, data: null, message: err?.message };
    }
  });

export const updateEventServerFn = createServerFn({ method: "POST" })
  .validator((payload: { id: string; updates: any }) => payload)
  .handler(async ({ data: { id, updates } }) => {
    try {
      const adminSb = getAdminSupabase();
      if (!adminSb) return { success: false, message: "Supabase not configured" };

      const { error } = await adminSb.from("events").update(updates).eq("id", id);
      if (error) {
        console.error("[updateEventServerFn] Error:", error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error("[updateEventServerFn] Exception:", err);
      return { success: false, message: err?.message };
    }
  });

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

// ==========================================
// BLOGS SERVER FUNCTIONS (Admin Role Bypass)
// ==========================================

export const fetchAllBlogsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const adminSb = getAdminSupabase();
    if (!adminSb) return { success: false, data: null, message: "Supabase not configured" };

    const { data, error } = await adminSb
      .from("blogs")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("[fetchAllBlogsServerFn] Error:", error.message);
      return { success: false, data: null, message: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error("[fetchAllBlogsServerFn] Exception:", err);
    return { success: false, data: null, message: err?.message };
  }
});

export const createBlogServerFn = createServerFn({ method: "POST" })
  .validator((payload: any) => payload)
  .handler(async ({ data: payload }) => {
    try {
      const adminSb = getAdminSupabase();
      if (!adminSb) return { success: false, data: null, message: "Supabase not configured" };

      const { data, error } = await adminSb.from("blogs").insert(payload).select().single();
      if (error) {
        console.error("[createBlogServerFn] Error:", error.message);
        return { success: false, data: null, message: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      console.error("[createBlogServerFn] Exception:", err);
      return { success: false, data: null, message: err?.message };
    }
  });

export const updateBlogServerFn = createServerFn({ method: "POST" })
  .validator((payload: { id: string; updates: any }) => payload)
  .handler(async ({ data: { id, updates } }) => {
    try {
      const adminSb = getAdminSupabase();
      if (!adminSb) return { success: false, message: "Supabase not configured" };

      const { error } = await adminSb.from("blogs").update(updates).eq("id", id);
      if (error) {
        console.error("[updateBlogServerFn] Error:", error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error("[updateBlogServerFn] Exception:", err);
      return { success: false, message: err?.message };
    }
  });

export const deleteBlogServerFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    try {
      const adminSb = getAdminSupabase();
      if (!adminSb) return { success: false, message: "Service key not configured" };

      const { error } = await adminSb.from("blogs").delete().eq("id", id);
      if (error) {
        console.error("[deleteBlogServerFn] Error:", error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error("[deleteBlogServerFn] Exception:", err);
      return { success: false, message: err?.message };
    }
  });

export const deleteAllBlogsServerFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const adminSb = getAdminSupabase();
    if (!adminSb) return { success: false, message: "Service key not configured" };

    const { error } = await adminSb.from("blogs").delete().neq("id", "");
    if (error) {
      console.error("[deleteAllBlogsServerFn] Error:", error.message);
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[deleteAllBlogsServerFn] Exception:", err);
    return { success: false, message: err?.message };
  }
});
