import { supabase, isSupabaseConfigured, type DatabaseCertificate } from "./supabase";
import type { EventItem, MyEvent, Playlist, BlogPost, Attendee } from "./mock-data";

/**
 * ============================================================================
 * SUPABASE SERVICE LAYER — CRAVE EVENT
 * ============================================================================
 * Modul ini menyediakan fungsi asynchronous untuk interaksi langsung dengan
 * database PostgreSQL dan Auth di Supabase. Jika Supabase belum dikonfigurasi,
 * helper mengembalikan null/false dengan aman tanpa memicu crash.
 */

// Helper pemetaan dari record tabel 'events' ke interface frontend 'EventItem'
function mapDatabaseEventToApp(record: any): EventItem {
  return {
    id: record.id,
    slug: record.id,
    title: record.title,
    description: record.description,
    longDescription: record.description,
    playlist: record.playlist || "English Club",
    category: record.category || "Webinar",
    type: record.type as "free" | "paid",
    price: Number(record.price) || 0,
    startsAt: `${record.date}T${record.time.slice(0, 5) || "19:00"}:00Z`,
    durationMinutes: record.duration_minutes || 90,
    platform: "Zoom Meeting",
    location: record.location || "Online via Zoom",
    zoomLink: record.zoom_link || "https://zoom.us",
    quota: record.quota || 100,
    registered: record.registered_count || 0,
    attended: 0,
    thumbnail: record.banner_url || "/logo.png",
    status: record.status as "upcoming" | "live" | "past",
    speaker: record.speaker_name || "Eka Revandi",
    attendanceCode: record.attendance_code || "CRV-" + record.id.slice(-4).toUpperCase(),
  };
}

export const eventsApi = {
  async fetchAll(): Promise<EventItem[] | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("[eventsApi.fetchAll] Error:", error.message);
      return null;
    }
    return data ? data.map(mapDatabaseEventToApp) : [];
  },

  async getById(id: string): Promise<EventItem | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapDatabaseEventToApp(data);
  },

  async create(item: Omit<EventItem, "id" | "registered" | "attended">): Promise<EventItem | null> {
    if (!isSupabaseConfigured) return null;

    const payload = {
      title: item.title,
      description: item.description || item.longDescription,
      category: item.category,
      type: item.type,
      price: item.price,
      date: item.startsAt ? (item.startsAt.split("T")[0] ?? new Date().toISOString().split("T")[0]!) : new Date().toISOString().split("T")[0]!,
      time: "19:30 WIB",
      duration_minutes: item.durationMinutes || 90,
      location: item.location || "Online via Zoom",
      speaker_name: item.speaker || "Eka Revandi",
      speaker_role: "Host",
      quota: item.quota || 100,
      zoom_link: item.zoomLink,
      playlist: item.playlist,
      status: item.status || "upcoming",
      attendance_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    const { data, error } = await supabase.from("events").insert(payload).select().single();
    if (error || !data) {
      console.error("[eventsApi.create] Error:", error?.message);
      return null;
    }
    return mapDatabaseEventToApp(data);
  },

  async update(id: string, updates: Partial<EventItem>): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const payload: {
      title?: string;
      description?: string;
      category?: string;
      playlist?: string;
      type?: "free" | "paid";
      price?: number;
      date?: string;
      time?: string;
      location?: string;
      quota?: number;
      status?: "upcoming" | "live" | "past";
      zoom_link?: string;
      speaker_name?: string;
    } = {};

    if (updates.title) payload.title = updates.title;
    if (updates.description) payload.description = updates.description;
    if (updates.category) payload.category = updates.category;
    if (updates.playlist) payload.playlist = updates.playlist;
    if (updates.type) payload.type = updates.type;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.startsAt) {
      const parts = updates.startsAt.split("T");
      const datePart = parts[0];
      if (datePart) payload.date = datePart;
      const timePart = parts[1];
      payload.time = timePart ? timePart.slice(0, 5) : "19:00";
    }
    if (updates.location) payload.location = updates.location;
    if (updates.quota !== undefined) payload.quota = updates.quota;
    if (updates.status) payload.status = updates.status;
    if (updates.zoomLink) payload.zoom_link = updates.zoomLink;
    if (updates.speaker) payload.speaker_name = updates.speaker;

    const { error } = await supabase.from("events").update(payload).eq("id", id);
    return !error;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase.from("events").delete().eq("id", id);
    return !error;
  },
};

export const registrationsApi = {
  async getMyRegistrations(): Promise<MyEvent[] | null> {
    if (!isSupabaseConfigured) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("user_id", user.id);

    if (error || !data) return null;
    return data.map((r: any) => ({
      eventId: r.event_id,
      registeredAt: r.created_at,
      paid: r.payment_status === "paid" || r.payment_status === "free",
      attended: r.status === "attended",
      certificateId: r.certificate_id,
    }));
  },

  async register(eventId: string, isPaid: boolean = false): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("registrations").upsert({
      user_id: user.id,
      event_id: eventId,
      status: "registered",
      payment_status: isPaid ? "paid" : "free",
    });

    return !error;
  },

  async recordAttendanceWithCode(
    eventId: string,
    attendanceCode: string,
  ): Promise<{ success: boolean; message: string; certificateId?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, message: "Supabase belum terkonfigurasi." };
    }

    try {
      const { data, error } = await supabase.rpc("record_attendance_and_claim_cert", {
        p_event_id: eventId,
        p_attendance_code: attendanceCode,
      });

      if (!error && data?.success) {
        return {
          success: true,
          message: data?.message ?? "Presensi berhasil dicatat!",
          certificateId: data?.certificate_id,
        };
      }
    } catch {
      // RPC error, fall through to direct tables
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, message: "Pengguna belum login ke Supabase." };

      // Check event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (eventData?.attendance_code) {
        if (eventData.attendance_code.trim().toUpperCase() !== attendanceCode.trim().toUpperCase()) {
          return { success: false, message: "Kode presensi tidak sesuai." };
        }
      }

      const certNum = `CRV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const certId = `cert_${Date.now()}`;

      // Upsert registration
      await supabase.from("registrations").upsert({
        user_id: user.id,
        event_id: eventId,
        status: "attended",
        payment_status: "free",
        certificate_id: certId,
      });

      // Insert certificate
      await supabase.from("certificates").upsert({
        id: certId,
        certificate_number: certNum,
        user_id: user.id,
        event_id: eventId,
        user_name: (user.user_metadata?.["full_name"] as string) || "Peserta Crave Event",
        event_title: eventData?.title || "Webinar Crave Event",
        event_date: eventData?.date || new Date().toISOString(),
        verification_url: `/verify/${certNum}`,
      });

      return {
        success: true,
        message: "Presensi berhasil dicatat! Sertifikat telah diterbitkan.",
        certificateId: certId,
      };
    } catch (err: any) {
      console.warn("Direct Supabase attendance fallback warning:", err);
      return { success: false, message: err?.message || "Gagal mencatat presensi." };
    }
  },
};

export const certificatesApi = {
  async getMyCertificates(): Promise<DatabaseCertificate[]> {
    if (!isSupabaseConfigured) return [];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (error || !data) return [];
    return data as DatabaseCertificate[];
  },

  async verify(certNumber: string): Promise<DatabaseCertificate | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("certificate_number", certNumber)
      .maybeSingle();

    if (error || !data) return null;
    return data as DatabaseCertificate;
  },
};

export const authApi = {
  async signUp(email: string, password: string, fullName: string, role: "user" | "speaker" = "user") {
    if (!isSupabaseConfigured) throw new Error("Supabase credentials belum dimasukkan.");
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) throw new Error("Supabase credentials belum dimasukkan.");
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signInWithOAuth(provider: "google" | "github") {
    if (!isSupabaseConfigured) throw new Error("Supabase credentials belum dimasukkan.");
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    return await supabase.auth.signOut();
  },

  async getCurrentSession() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};
