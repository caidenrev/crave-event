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
  myEvents as initialMyEvents,
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
  createEvent: (data: Omit<EventItem, "id" | "registered" | "attended">) => EventItem;
  updateEvent: (id: string, updates: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  deleteAllEvents: () => void;
  resetAllEvents: () => void;
  createPlaylist: (data: Omit<Playlist, "id" | "eventCount">) => void;
  createBlogPost: (data: Omit<BlogPost, "id">) => void;
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

const STORAGE_KEYS = {
  EVENTS: "aether_events_v1",
  PLAYLISTS: "aether_playlists_v1",
  MY_EVENTS: "aether_my_events_v1",
  ATTENDEES: "aether_attendees_v1",
  BLOGS: "aether_blogs_v1",
  USER: "aether_current_user_v1",
};

const getUserRegistrationsKey = (email?: string | null) => {
  if (!email) return null;
  return `${STORAGE_KEYS.MY_EVENTS}_${email.trim().toLowerCase()}`;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window === "undefined") return initialEvents;
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : initialEvents;
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
    // If no user is logged in, unauthenticated users have 0 registered events
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    // Clean up any legacy unauthenticated mock data stored under the global key
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
    const saved = localStorage.getItem(STORAGE_KEYS.BLOGS);
    return saved ? JSON.parse(saved) : initialBlogPosts;
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
    } catch {}
  }, [blogPosts]);

  // Initial Sync from Supabase Cloud Database (if configured)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    eventsApi.fetchAll().then((remoteEvents) => {
      if (isMounted && remoteEvents && remoteEvents.length > 0) {
        setEvents(remoteEvents);
      }
    });

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

    // Asynchronous background sync to Supabase if configured
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

    // Validate code if targetEvent has an attendanceCode and code is given
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

    // Check if already attended
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

  const createEvent = (data: Omit<EventItem, "id" | "registered" | "attended">) => {
    const newId = `ev-${Date.now()}`;
    const newEvent: EventItem = {
      ...data,
      id: newId,
      registered: 0,
      attended: 0,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.tag === newEvent.playlist ? { ...p, eventCount: p.eventCount + 1 } : p,
      ),
    );

    if (isSupabaseConfigured) {
      eventsApi.create(data).then((created) => {
        if (created) {
          setEvents((prev) => prev.map((e) => (e.id === newId ? created : e)));
        }
      });
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
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
    } catch {}
    if (isSupabaseConfigured) {
      eventsApi.deleteAll().catch(console.error);
    }
  };

  const resetAllEvents = () => {
    setEvents(initialEvents);
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(initialEvents));
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

  const createBlogPost = (data: Omit<BlogPost, "id">) => {
    const newPost: BlogPost = {
      ...data,
      id: `bp-${Date.now()}`,
    };
    setBlogPosts((prev) => [newPost, ...prev]);
    if (isSupabaseConfigured) {
      blogsApi.create(data).catch(console.error);
    }
  };

  const updateBlogPost = (id: string, updates: Partial<BlogPost>) => {
    setBlogPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (isSupabaseConfigured) {
      blogsApi.update(id, updates).catch(console.error);
    }
  };

  const deleteBlogPost = (id: string) => {
    setBlogPosts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured) {
      blogsApi.delete(id).catch(console.error);
    }
  };

  const deleteAllBlogPosts = () => {
    setBlogPosts([]);
    try {
      localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify([]));
    } catch {}
    if (isSupabaseConfigured) {
      blogsApi.deleteAll().catch(console.error);
    }
  };

  const resetAllBlogPosts = () => {
    setBlogPosts(initialBlogPosts);
    try {
      localStorage.setItem(STORAGE_KEYS.BLOGS, JSON.stringify(initialBlogPosts));
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
