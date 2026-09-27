import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Lock, Mail, Presentation, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useApp } from "../lib/store";
import { isSupabaseConfigured } from "../lib/supabase";
import { authApi } from "../lib/supabase-services";

type AuthSearch = {
  mode?: "login" | "register" | undefined;
  redirect?: string | undefined;
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    return {
      mode: search["mode"] === "register" ? "register" : "login",
      ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {}),
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { loginUser } = useApp();
  const [mode, setMode] = useState<"login" | "register">(
    search?.mode === "register" ? "register" : "login",
  );
  const [selectedRole, setSelectedRole] = useState<"user" | "speaker">("user");

  useEffect(() => {
    if (search?.mode) {
      setMode(search.mode);
    }
  }, [search?.mode]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const isSuper =
          email.toLowerCase().includes("superadmin") ||
          email.toLowerCase().includes("root");
        const isSpeaker =
          isSuper ||
          email.toLowerCase().includes("speaker") ||
          email.toLowerCase().includes("admin") ||
          email.toLowerCase().includes("host");
        const roleName = isSuper
          ? "Super Admin"
          : isSpeaker
            ? "Speaker / Host"
            : "Peserta";
        const userName = isSuper
          ? "Super Admin"
          : email.split("@")[0] || (isSpeaker ? "Speaker" : "Peserta");

        loginUser({
          name: userName,
          email,
          role: roleName,
        });

        if (isSupabaseConfigured) {
          try {
            await authApi.signIn(email, password);
          } catch (err: any) {
            console.warn("[Auth Supabase Sync]:", err.message);
          }
        }

        toast.success(
          isSuper ? "Akses Root Super Admin Aktif!" : "Berhasil masuk!",
          {
            description: isSuper
              ? "Hak akses penuh: Anda dapat mengedit, menghapus event & artikel blog siapa saja, serta mereset data."
              : `Selamat datang kembali, ${userName}! Masuk ke ${isSpeaker ? "Panel Speaker" : "Dashboard Peserta"}.`,
          },
        );

        const performNavigation = (speakerOrSuper: boolean) => {
          if (search.redirect && search.redirect.startsWith("/")) {
            // Guard redirect destination against role
            if (search.redirect.startsWith("/admin") && !speakerOrSuper) {
              navigate({ to: "/dashboard" });
              return;
            }
            if (search.redirect.startsWith("/dashboard") && speakerOrSuper) {
              navigate({ to: "/admin" });
              return;
            }
            navigate({ to: search.redirect as any });
            return;
          }

          if (speakerOrSuper) {
            navigate({ to: "/admin" });
          } else {
            navigate({ to: "/dashboard" });
          }
        };

        performNavigation(isSpeaker || isSuper);
      } else {
        // Register Mode
        const isSpeaker = selectedRole === "speaker";
        const roleName = isSpeaker ? "Speaker / Host" : "Peserta";
        const userName = name || (isSpeaker ? "Speaker Baru" : "Peserta Baru");

        loginUser({
          name: userName,
          email,
          role: roleName,
        });

        if (isSupabaseConfigured) {
          try {
            await authApi.signUp(email, password, userName, selectedRole);
          } catch (err: any) {
            console.warn("[Auth Supabase Sync]:", err.message);
          }
        }

        toast.success("Pendaftaran akun berhasil!", {
          description: `Akun ${userName} (${roleName}) aktif! Mengalihkan ke ${isSpeaker ? "Panel Speaker" : "Dashboard Peserta"}...`,
        });

        if (search.redirect && search.redirect.startsWith("/")) {
          if (search.redirect.startsWith("/admin") && !isSpeaker) {
            navigate({ to: "/dashboard" });
          } else if (search.redirect.startsWith("/dashboard") && isSpeaker) {
            navigate({ to: "/admin" });
          } else {
            navigate({ to: search.redirect as any });
          }
        } else {
          if (isSpeaker) {
            navigate({ to: "/admin" });
          } else {
            navigate({ to: "/dashboard" });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      {/* Background ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-accent-tint/70 via-accent-soft/20 to-transparent blur-3xl"
      />

      <div className="w-full max-w-md">
        {/* Top Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Crave Event Logo"
              className="size-11 object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_8px_16px_rgba(10,132,255,0.25)]"
            />
            <span className="text-2xl font-bold tracking-tight text-ink">Crave Event</span>
          </Link>
          <p className="mt-2.5 text-[14px] text-ink-secondary">
            {mode === "login"
              ? "Masuk untuk mengakses event, scan absensi, dan sertifikat"
              : "Buat akun baru untuk mulai mengikuti webinar"}
          </p>
        </div>

        {/* Auth Solid Glass Card */}
        <div className="frosted-glass-card rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white/90 bg-white/85 backdrop-blur-2xl">
          {/* Mode Switcher Tabs with Sliding Glider */}
          <div className="neu-capsule-track relative flex w-full p-1 border border-hairline/80">
            <span
              className="neu-capsule-thumb absolute top-1 bottom-1 left-1 rounded-pill pointer-events-none"
              style={{
                width: "calc(50% - 4px)",
                transform: mode === "login" ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
                transition: "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
            <button
              type="button"
              onClick={() => {
                setMode("login");
                window.history.replaceState(null, "", "/auth?mode=login");
              }}
              className={`relative z-10 flex-1 py-2 text-center text-[13px] font-semibold transition-colors duration-200 select-none ${
                mode === "login" ? "text-white" : "text-ink-secondary hover:text-ink"
              }`}
            >
              Masuk ke Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                window.history.replaceState(null, "", "/auth?mode=register");
              }}
              className={`relative z-10 flex-1 py-2 text-center text-[13px] font-semibold transition-colors duration-200 select-none ${
                mode === "register" ? "text-white" : "text-ink-secondary hover:text-ink"
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="aether-meta block text-[11px] font-semibold text-ink-tertiary mb-1.5 ml-1">
                    Nama Lengkap
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-hairline/80 bg-white/70 px-3.5 py-2.5 shadow-[inset_2px_2px_5px_rgba(165,175,190,0.18),inset_-2px_-2px_5px_#ffffff] focus-within:bg-white focus-within:border-accent focus-within:shadow-[0_0_0_3.5px_rgba(10,132,255,0.15)] transition-all">
                    <div className="neu-icon-sphere size-8 shrink-0">
                      <User className="size-4 text-white" strokeWidth={2.2} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Lengkap Kamu"
                      className="w-full bg-transparent text-[14px] text-ink focus:outline-none placeholder:text-ink-tertiary"
                    />
                  </div>
                </div>

                {/* Role Selector: Peserta vs Speaker (Capsule Glider Switch) */}
                <div>
                  <label className="aether-meta block text-[11px] font-semibold text-ink-tertiary mb-1.5 ml-1">
                    Pilih Peran Akun (Menentukan Akses Dashboard)
                  </label>
                  <div className="neu-capsule-track relative flex w-full p-1 border border-hairline/80">
                    <span
                      className="neu-capsule-thumb absolute top-1 bottom-1 left-1 rounded-pill pointer-events-none"
                      style={{
                        width: "calc(50% - 4px)",
                        transform: selectedRole === "user" ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)",
                        transition: "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedRole("user")}
                      className={`relative z-10 flex-1 py-2 text-center text-[13px] font-semibold transition-colors duration-200 select-none flex items-center justify-center gap-2 cursor-pointer ${
                        selectedRole === "user" ? "text-white" : "text-ink-secondary hover:text-ink"
                      }`}
                    >
                      <User className="size-4" strokeWidth={2.2} />
                      <span>Peserta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("speaker")}
                      className={`relative z-10 flex-1 py-2 text-center text-[13px] font-semibold transition-colors duration-200 select-none flex items-center justify-center gap-2 cursor-pointer ${
                        selectedRole === "speaker" ? "text-white" : "text-ink-secondary hover:text-ink"
                      }`}
                    >
                      <Presentation className="size-4" strokeWidth={2.2} />
                      <span>Speaker</span>
                    </button>
                  </div>

                  {/* Contextual description of selected role */}
                  <div className="mt-2 px-3.5 py-2.5 rounded-2xl bg-white/70 border border-hairline/80 flex items-center justify-between text-[11px] text-ink-secondary shadow-xs transition-all">
                    <span>
                      {selectedRole === "user"
                        ? "Ikuti webinar, presensi QR, dan klaim sertifikat belajar."
                        : "Kelola event, buat rundown, dan tayangkan QR presensi."}
                    </span>
                    <span className="font-semibold text-accent shrink-0 ml-2">
                      {selectedRole === "user" ? "→ Dashboard Peserta" : "→ Panel Speaker"}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="aether-meta block text-[11px] font-semibold text-ink-tertiary mb-1.5 ml-1">
                Alamat Email
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-hairline/80 bg-white/70 px-3.5 py-2.5 shadow-[inset_2px_2px_5px_rgba(165,175,190,0.18),inset_-2px_-2px_5px_#ffffff] focus-within:bg-white focus-within:border-accent focus-within:shadow-[0_0_0_3.5px_rgba(10,132,255,0.15)] transition-all">
                <div className="neu-icon-sphere size-8 shrink-0">
                  <Mail className="size-4 text-white" strokeWidth={2.2} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-transparent text-[14px] text-ink focus:outline-none placeholder:text-ink-tertiary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="aether-meta text-[11px] font-semibold text-ink-tertiary">
                  Kata Sandi
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => toast.info("Gunakan demo login di bawah untuk langsung mencoba!")}
                    className="text-[11px] font-semibold text-accent hover:underline"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-hairline/80 bg-white/70 px-3.5 py-2.5 shadow-[inset_2px_2px_5px_rgba(165,175,190,0.18),inset_-2px_-2px_5px_#ffffff] focus-within:bg-white focus-within:border-accent focus-within:shadow-[0_0_0_3.5px_rgba(10,132,255,0.15)] transition-all">
                <div className="neu-icon-sphere size-8 shrink-0">
                  <Lock className="size-4 text-white" strokeWidth={2.2} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-[14px] text-ink focus:outline-none placeholder:text-ink-tertiary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neu-btn-blue w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-75 transition-all"
            >
              <ArrowRight className="size-4 text-white" />
              <span>
                {loading
                  ? "Menyiapkan Akun..."
                  : mode === "login"
                    ? "Masuk ke Akun"
                    : selectedRole === "speaker"
                      ? "Daftar sebagai Speaker (Akses Panel)"
                      : "Daftar sebagai Peserta (Akses Dashboard)"}
              </span>
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="neu-btn-glass inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-ink-secondary hover:text-accent shadow-xs"
          >
            <ArrowLeft className="size-3.5 text-accent" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
