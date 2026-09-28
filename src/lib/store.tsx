import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  attendees as initialAttendees,
  blogPosts as initialBlogPosts,
  events as initialEvents,
  playlists as initialPlaylists,
  type Attendee,
  type BlogPost,
  type EventItem,
  type MyEvent,
  type Playlist,
} from "./mock-data";
import { isSupabaseConfigured } from "./supabase";
import { eventsApi, registrationsApi, blogsApi } from "./supabase-services";

type AppContextType = {
  events: EventItem[];
  playlists: Playlist[];
  myEvents: MyEvent[];
  attendees: Attendee[];
  blogPosts: BlogPost[];
  currentUser: { name: string; email: string; role: string } | null;
  isSuperAdmin: boolean;
  isCloudConnected: boolean;
  loginUser: (user: { name: string; email: string; role: "Peserta" | "Speaker / Host" | "Super Admin" | string }) => void;
  logoutUser: () => void;
  registerEvent: (eventId: string, paid?: boolean) => void;
  payEvent: (eventId: string) => void;
  checkInAttendance: (eventId: string, code?: string) => {
    success: boolean;
    certificateId?: string;
    message?: string;
  };
  createEvent: (data: Omit<EventItem, "id" | "registered" | "attended">) => Promise<EventItem>;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  deleteAllEvents: () => void;
  resetAllEvents: () => void;
  createPlaylist: (data: Omit<Playlist, "id" | "eventCount">) => void;
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, "id">>) => void;
  deletePlaylist: (id: string) => void;
  createBlogPost: (data: Omit<BlogPost, "id">) => Promise<BlogPost>;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  deleteAllBlogPosts: () => void;
  resetAllBlogPosts: () => void;
  resetAllSystemData: () => void;
  toggleAttendeeCheckIn: (attendeeId: string) => void;
  toggleAttendeePaid: (attendeeId: string) => void;
  isRegistered: (eventId: string) => boolean;
  isPaid: (eventId: string) => boolean;
  hasAttended: (eventId: string) => boolean;
};

const AppContext = createContext<AppContextType | null>(null);

export const STORAGE_KEYS = {
  EVENTS: "aether_events_v1",
  EVENTS_CLEARED: "aether_events_cleared_v1",
  PLAYLISTS: "aether_playlists_v1",
  MY_EVENTS: "aether_my_events_v1",
  ATTENDEES: "aether_attendees_v1",
  BLOGS: "aether_blogs_v1",
  BLOGS_CLEARED: "aether_blogs_cleared_v1",
  USER: "aether_current_user_v1",
};

const getUserRegistrationsKey = (email?: string | null) => {
  if (!email) return null;
  return `${STORAGE_KEYS.MY_EVENTS}_${email.trim().toLowerCase()}`;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === "undefined") return initialEvents;
    const isCleared = localStorage.getItem(STORAGE_KEYS.EVENTS_CLEARED) === "true";
    if (isCleared) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Jika Supabase terkonfigurasi, default ke empty sampai fetch selesai agar tidak memunculkan data dummy lama
    if (isSupabaseConfigured) return [];
    return initialEvents;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (typeof window === "undefined") return initialPlaylists;
    const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    return saved ? JSON.parse(saved) : initialPlaylists;
  });

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [myEvents, setMyEvents] = useState<MyEvent[]>(() => {
    if (typeof window === "undefined") return [];
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    try {
      localStorage.removeItem(STORAGE_KEYS.MY_EVENTS);
    } catch {}

    if (!savedUser) {
      return [];
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      const userKey = getUserRegistrationsKey(parsedUser?.email);
      if (userKey) {
        const savedUserEvents = localStorage.getItem(userKey);
        if (savedUserEvents) return JSON.parse(savedUserEvents);
      }
    } catch {}

    return [];
  });

  const [attendees, setAttendees] = useState<Attendee[]>(() => {
    if (typeof window === "undefined") return initialAttendees;
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDEES);
    return saved ? JSON.parse(saved) : initialAttendees;
  });

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    if (typeof window === "undefined") return initialBlogPosts;
    const isCleared = localStorage.getItem(STORAGE_KEYS.BLOGS_CLEARED) === "true";
    if (isCleared) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.BLOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Jika Supabase terkonfigurasi, default ke empty sampai fetch selesai agar tidak memunculkan data dummy lama
    if (isSupabaseConfigured) return [];
    return initialBlogPosts;
  });

  const loginUser = (user: { name: string; email: string; role: "Peserta" | "Speaker / Host" | "Super Admin" | string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      const userKey = getUserRegistrationsKey(user.email);
      if (userKey) {
        const savedUserEvents = localStorage.getItem(userKey);
        setMyEvents(savedUserEvents ? JSON.parse(savedUserEvents) : []);
      }
    } catch {}
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setMyEvents([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.MY_EVENTS);
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      if (events.length === 0) {
        localStorage.setItem(STORAGE_KEYS.EVENTS_CLEARED, "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.EVENTS_CLEARED);
      }
    } catch {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch {}
  }, [playlists]);

  useEffect(() => {
    try {
      if (currentUser?.email) {
        const userKey = getUserRegistrationsKey(currentUser.email);
        if (userKey) {
          localStorage.setItem(userKey, JSON.stringify(myEvents));
        }
      }
    } catch {}
  }, [myEvents, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(attendees));
    } catch {}
  }, [attendees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(blogPosts));
      if (blogPosts.length === 0) {
        localStorage.setItem(STORAGE_KEYS.BLOGS_CLEARED, "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.BLOGS_CLEARED);
      }
    } catch {}
  }, [blogPosts]);

  // Initial Sync from Supabase Cloud Database (for Events, Blogs & Registrations)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    // 1. Fetch Events from Supabase Cloud
    eventsApi.fetchAll().then((remoteEvents) => {
      if (isMounted && remoteEvents !== null) {
        setEvents(remoteEvents);
        try {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(remoteEvents));
          if (remoteEvents.length === 0) {
            localStorage.setItem(STORAGE_KEYS.EVENTS_CLEARED, "true");
          } else {
            localStorage.removeItem(STORAGE_KEYS.EVENTS_CLEARED);
          }
        } catch {}
      }
    });

    // 2. Fetch Blogs from Supabase Cloud
    blogsApi.fetchAll().then((remoteBlogs) => {
      if (isMounted && remoteBlogs !== null) {
        setBlogPosts(remoteBlogs);
        try {
          localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(remoteBlogs));
          if (remoteBlogs.length === 0) {
            localStorage.setItem(STORAGE_KEYS.BLOGS_CLEARED, "true");
          } else {
            localStorage.removeItem(STORAGE_KEYS.BLOGS_CLEARED);
          }
        } catch {}
      }
    });

    // 3. Fetch User Registrations if logged in
    registrationsApi.getMyRegistrations().then((remoteRegs) => {
      if (isMounted && remoteRegs && remoteRegs.length > 0) {
        setMyEvents(remoteRegs);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const isRegistered = (eventId: string) => {
    if (!currentUser) return false;
    return myEvents.some((me) => me.eventId === eventId);
  };

  const isPaid = (eventId: string) => {
    if (!currentUser) return false;
    const reg = myEvents.find((me) => me.eventId === eventId);
    return !!reg?.paid;
  };

  const hasAttended = (eventId: string) => {
    if (!currentUser) return false;
    const reg = myEvents.find((me) => me.eventId === eventId);
    return !!reg?.attended;
  };

  const registerEvent = (eventId: string, paid = false) => {
    if (!currentUser) return;
    if (isRegistered(eventId)) return;

    const newMyEvent: MyEvent = {
      eventId,
      registeredAt: new Date().toISOString().split("T")[0]!,
      paid,
      attended: false,
      certificateId: null,
    };

    setMyEvents((prev) => [newMyEvent, ...prev]);

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, registered: e.registered + 1 } : e)),
    );

    const newAttendee: Attendee = {
      id: `at-user-${Date.now()}`,
      name: currentUser?.name || "Peserta",
      email: currentUser?.email || "peserta@mail.com",
      eventId,
      paid,
      attended: false,
      checkInAt: null,
    };

    setAttendees((prev) => [newAttendee, ...prev]);

    if (isSupabaseConfigured) {
      registrationsApi.register(eventId, paid).catch((err) => {
        console.warn("[Supabase Sync] Gagal mendaftarkan event:", err);
      });
    }
  };

  const payEvent = (eventId: string) => {
    if (!currentUser) return;
    setMyEvents((prev) =>
      prev.map((me) => (me.eventId === eventId ? { ...me, paid: true } : me)),
    );
    setAttendees((prev) =>
      prev.map((att) =>
        att.eventId === eventId && (!currentUser || att.email === currentUser.email)
          ? { ...att, paid: true }
          : att,
      ),
    );
    if (isSupabaseConfigured) {
      registrationsApi.register(eventId, true).catch(console.error);
    }
  };

  const checkInAttendance = (eventId: string, code?: string) => {
    if (!currentUser) {
      return { success: false, message: "Silakan masuk terlebih dahulu untuk melakukan presensi." };
    }
    const targetEvent = events.find((e) => e.id === eventId || e.slug === eventId);
    if (!targetEvent) {
      return { success: false, message: "Event tidak ditemukan." };
    }

    const resolvedEventId = targetEvent.id;

    if (targetEvent.attendanceCode && code) {
      const inputCode = code.trim().toUpperCase();
      const expectedCode = targetEvent.attendanceCode.trim().toUpperCase();
      if (inputCode !== expectedCode) {
        return {
          success: false,
          message: `Kode presensi "${code}" salah. Mohon periksa kembali QR code atau kode dari host.`,
        };
      }
    }

    const existingRegistration = myEvents.find((me) => me.eventId === resolvedEventId);
    if (existingRegistration?.attended && existingRegistration.certificateId) {
      return {
        success: true,
        certificateId: existingRegistration.certificateId,
        message: "Kehadiran Anda sudah diverifikasi sebelumnya.",
      };
    }

    const certNumber =
      existingRegistration?.certificateId ||
      `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowTime = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMyEvents((prev) => {
      const exists = prev.some((me) => me.eventId === resolvedEventId);
      if (!exists) {
        return [
          {
            eventId: resolvedEventId,
            registeredAt: new Date().toISOString().split("T")[0]!,
            paid: true,
            attended: true,
            certificateId: certNumber,
          },
          ...prev,
        ];
      }
      return prev.map((me) =>
        me.eventId === resolvedEventId
          ? { ...me, attended: true, certificateId: me.certificateId || certNumber }
          : me,
      );
    });

    setAttendees((prev) =>
      prev.map((att) =>
        att.eventId === resolvedEventId && (!currentUser || att.email === currentUser.email)
          ? { ...att, attended: true, checkInAt: nowTime }
          : att,
      ),
    );

    setEvents((prev) =>
      prev.map((e) => (e.id === resolvedEventId ? { ...e, attended: e.attended + 1 } : e)),
    );

    if (isSupabaseConfigured && (code || targetEvent.attendanceCode)) {
      registrationsApi
        .recordAttendanceWithCode(resolvedEventId, code || targetEvent.attendanceCode || "")
        .catch(console.error);
    }

    return {
      success: true,
      certificateId: certNumber,
      message: "Kehadiran berhasil diverifikasi!",
    };
  };

  const createEvent = async (data: Omit<EventItem, "id" | "registered" | "attended">) => {
    const tempId = `ev-${Date.now()}`;
    let newEvent: EventItem = {
      ...data,
      id: tempId,
      registered: 0,
      attended: 0,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.tag === newEvent.playlist ? { ...p, eventCount: p.eventCount + 1 } : p,
      ),
    );

    try {
      localStorage.removeItem(STORAGE_KEYS.EVENTS_CLEARED);
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const created = await eventsApi.create(data);
        if (created) {
          newEvent = created;
          setEvents((prev) => prev.map((e) => (e.id === tempId ? created : e)));
        }
      } catch (err) {
        console.error("[createEvent] Cloud create error:", err);
      }
    }

    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<EventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    if (isSupabaseConfigured) {
      eventsApi.update(id, updates).catch(console.error);
    }
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      if (updated.length === 0) {
        try {
          localStorage.setItem(STORAGE_KEYS.EVENTS_CLEARED, "true");
        } catch {}
      }
      return updated;
    });
    if (isSupabaseConfigured) {
      eventsApi.delete(id).catch(console.error);
    }
  };

  const isSuperAdmin = Boolean(
    currentUser?.role?.toLowerCase().includes("super") ||
    currentUser?.email?.toLowerCase().includes("superadmin") ||
    currentUser?.email?.toLowerCase().includes("root")
  );

  const deleteAllEvents = () => {
    setEvents([]);
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EVENTS_CLEARED, "true");
    } catch {}
    if (isSupabaseConfigured) {
      eventsApi.deleteAll().catch(console.error);
    }
  };

  const resetAllEvents = () => {
    setEvents(initialEvents);
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(initialEvents));
      localStorage.removeItem(STORAGE_KEYS.EVENTS_CLEARED);
    } catch {}
  };

  const createPlaylist = (data: Omit<Playlist, "id" | "eventCount">) => {
    const newPl: Playlist = {
      ...data,
      id: `pl-${Date.now()}`,
      eventCount: 0,
    };
    setPlaylists((prev) => [...prev, newPl]);
  };

  const updatePlaylist = (id: string, updates: Partial<Omit<Playlist, "id">>) => {
    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, ...updates } : pl)),
    );
  };

  const deletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== id));
  };

  const createBlogPost = async (data: Omit<BlogPost, "id">) => {
    const tempId = `bp-${Date.now()}`;
    let newPost: BlogPost = {
      ...data,
      id: tempId,
    };

    setBlogPosts((prev) => [newPost, ...prev]);

    try {
      localStorage.removeItem(STORAGE_KEYS.BLOGS_CLEARED);
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const created = await blogsApi.create(data);
        if (created) {
          newPost = created;
          setBlogPosts((prev) => prev.map((p) => (p.id === tempId ? created : p)));
        }
      } catch (err) {
        console.error("[createBlogPost] Cloud create error:", err);
      }
    }

    return newPost;
  };

  const updateBlogPost = (id: string, updates: Partial<BlogPost>) => {
    setBlogPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (isSupabaseConfigured) {
      blogsApi.update(id, updates).catch(console.error);
    }
  };

  const deleteBlogPost = (id: string) => {
    setBlogPosts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (updated.length === 0) {
        try {
          localStorage.setItem(STORAGE_KEYS.BLOGS_CLEARED, "true");
        } catch {}
      }
      return updated;
    });
    if (isSupabaseConfigured) {
      blogsApi.delete(id).catch(console.error);
    }
  };

  const deleteAllBlogPosts = () => {
    setBlogPosts([]);
    try {
      localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.BLOGS_CLEARED, "true");
    } catch {}
    if (isSupabaseConfigured) {
      blogsApi.deleteAll().catch(console.error);
    }
  };

  const resetAllBlogPosts = () => {
    setBlogPosts(initialBlogPosts);
    try {
      localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(initialBlogPosts));
      localStorage.removeItem(STORAGE_KEYS.BLOGS_CLEARED);
    } catch {}
  };

  const resetAllSystemData = () => {
    setEvents(initialEvents);
    setBlogPosts(initialBlogPosts);
    setAttendees(initialAttendees);
    setMyEvents([]);
    setPlaylists(initialPlaylists);
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(initialEvents));
      localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(initialBlogPosts));
      localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(initialAttendees));
      localStorage.removeItem(STORAGE_KEYS.EVENTS_CLEARED);
      localStorage.removeItem(STORAGE_KEYS.BLOGS_CLEARED);
      localStorage.removeItem(STORAGE_KEYS.MY_EVENTS);
      if (currentUser?.email) {
        const userKey = getUserRegistrationsKey(currentUser.email);
        if (userKey) localStorage.removeItem(userKey);
      }
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(initialPlaylists));
    } catch {}
  };

  const toggleAttendeeCheckIn = (attendeeId: string) => {
    setAttendees((prev) =>
      prev.map((att) => {
        if (att.id === attendeeId) {
          const newAttended = !att.attended;
          return {
            ...att,
            attended: newAttended,
            checkInAt: newAttended
              ? new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              : null,
          };
        }
        return att;
      }),
    );
  };

  const toggleAttendeePaid = (attendeeId: string) => {
    setAttendees((prev) =>
      prev.map((att) => (att.id === attendeeId ? { ...att, paid: !att.paid } : att)),
    );
  };

  return (
    <AppContext.Provider
      value={{
        events,
        playlists,
        myEvents,
        attendees,
        blogPosts,
        currentUser,
        isSuperAdmin,
        isCloudConnected: isSupabaseConfigured,
        loginUser,
        logoutUser,
        registerEvent,
        payEvent,
        checkInAttendance,
        createEvent,
        updateEvent,
        deleteEvent,
        deleteAllEvents,
        resetAllEvents,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        createBlogPost,
        updateBlogPost,
        deleteBlogPost,
        deleteAllBlogPosts,
        resetAllBlogPosts,
        resetAllSystemData,
        toggleAttendeeCheckIn,
        toggleAttendeePaid,
        isRegistered,
        isPaid,
        hasAttended,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
