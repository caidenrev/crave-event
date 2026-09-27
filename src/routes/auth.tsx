import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Crown, Lock, Mail, Presentation, ShieldAlert, ShieldCheck, Sparkles, User } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useApp } from "../lib/store";
import { isSupabaseConfigured } from "../lib/supabase";
import { authApi } from "../lib/supabase-services";

type AuthSearch = {
  mode?: "login" | "register";
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    return {
      mode: search["mode"] === "register" ? "register" : "login",
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

        if (isSpeaker || isSuper) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
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

        if (isSpeaker) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsUser = () => {
    loginUser({
      name: "Rani Maheswari",
      email: "rani@mail.com",
      role: "Peserta",
    });
    toast.success("Masuk sebagai Peserta", {
      description: "Selamat datang di Dashboard Peserta (Rani Maheswari)",
    });
    navigate({ to: "/dashboard" });
  };

  const loginAsAdmin = () => {
    loginUser({
      name: "Eka Revandi",
      email: "ekarevandi@crave.id",
      role: "Speaker / Host",
    });
    toast.success("Masuk sebagai Speaker / Host", {
      description: "Selamat datang di Panel Speaker (Eka Revandi)",
    });
    navigate({ to: "/admin" });
  };

  const loginAsSuperAdmin = () => {
    loginUser({
      name: "Super Admin",
      email: "superadmin@craveevent.id",
      role: "Super Admin",
    });
    toast.success("Masuk sebagai Super Admin (Root)", {
      description: "Hak akses penuh untuk mengelola, menghapus event/blog siapa saja, dan mereset data.",
    });
    navigate({ to: "/admin" });
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
              className="neu-capsule-thumb absolute top-1 bottom-1 rounded-pill transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                left: mode === "login" ? "4px" : "calc(50% + 2px)",
                width: "calc(50% - 6px)",
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

                {/* Role Selector: Peserta vs Speaker */}
                <div>
                  <label className="aether-meta block text-[11px] font-semibold text-ink-tertiary mb-2 ml-1">
                    Pilih Peran Akun (Menentukan Akses Dashboard)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("user")}
                      className={`relative flex flex-col items-start rounded-2xl p-3 text-left transition-all duration-200 border cursor-pointer ${
                        selectedRole === "user"
                          ? "border-accent bg-accent-tint/50 shadow-[0_4px_16px_rgba(10,132,255,0.18)] ring-2 ring-accent"
                          : "border-hairline/80 bg-white/70 hover:bg-white/95 hover:border-hairline"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 w-full">
                        <div
                          className={`size-7 rounded-xl flex items-center justify-center transition-colors ${
                            selectedRole === "user"
                              ? "bg-accent text-white shadow-xs"
                              : "bg-white text-ink-secondary border border-hairline/70"
                          }`}
                        >
                          <User className="size-4" strokeWidth={2.2} />
                        </div>
                        <span
                          className={`text-[12.5px] font-bold ${
                            selectedRole === "user" ? "text-accent-strong" : "text-ink"
                          }`}
                        >
                          Peserta
                        </span>
                      </div>
                      <p className="text-[10.5px] leading-tight text-ink-secondary">
                        Ikuti webinar, presensi QR, dan klaim sertifikat belajar.
                      </p>
                      <span className="mt-2 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-accent-strong border border-accent/20">
                        → Dashboard Peserta
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole("speaker")}
                      className={`relative flex flex-col items-start rounded-2xl p-3 text-left transition-all duration-200 border cursor-pointer ${
                        selectedRole === "speaker"
                          ? "border-accent bg-accent-tint/50 shadow-[0_4px_16px_rgba(10,132,255,0.18)] ring-2 ring-accent"
                          : "border-hairline/80 bg-white/70 hover:bg-white/95 hover:border-hairline"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 w-full">
                        <div
                          className={`size-7 rounded-xl flex items-center justify-center transition-colors ${
                            selectedRole === "speaker"
                              ? "bg-accent text-white shadow-xs"
                              : "bg-white text-ink-secondary border border-hairline/70"
                          }`}
                        >
                          <Presentation className="size-4" strokeWidth={2.2} />
                        </div>
                        <span
                          className={`text-[12.5px] font-bold ${
                            selectedRole === "speaker" ? "text-accent-strong" : "text-ink"
                          }`}
                        >
                          Speaker
                        </span>
                      </div>
                      <p className="text-[10.5px] leading-tight text-ink-secondary">
                        Kelola event, buat rundown, dan tayangkan QR presensi.
                      </p>
                      <span className="mt-2 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-accent-strong border border-accent/20">
                        → Panel Speaker
                      </span>
                    </button>
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
              <Sparkles className="size-4 text-white" />
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

          {/* Quick Demo Login Switch */}
          <div className="mt-7 border-t border-hairline/80 pt-5">
            <p className="aether-meta text-center text-ink-tertiary text-[10px] tracking-wider uppercase mb-3">
              Akses Demo Cepat
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={loginAsUser}
                className="neu-btn-glass rounded-2xl p-3 flex items-center gap-2.5 text-left transition-all hover:scale-[1.02] shadow-xs group"
              >
                <div className="neu-icon-sphere size-8 shrink-0">
                  <User className="size-4 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[12px] font-semibold text-ink leading-tight group-hover:text-accent">
                    Peserta
                  </span>
                  <span className="block text-[10px] text-ink-tertiary truncate">
                    Rani Maheswari
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={loginAsAdmin}
                className="neu-btn-glass rounded-2xl p-3 flex items-center gap-2.5 text-left transition-all hover:scale-[1.02] shadow-xs group"
              >
                <div className="neu-icon-sphere size-8 shrink-0">
                  <ShieldCheck className="size-4 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[12px] font-semibold text-accent-strong leading-tight">
                    Host / Speaker
                  </span>
                  <span className="block text-[10px] text-ink-tertiary truncate">
                    Eka Revandi
                  </span>
                </div>
              </button>
            </div>

            {/* Super Admin Quick Demo Login */}
            <button
              type="button"
              onClick={loginAsSuperAdmin}
              className="mt-2.5 w-full neu-btn-glass rounded-2xl p-3 flex items-center justify-between transition-all hover:scale-[1.01] shadow-xs group border border-purple-200/80 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/15 hover:border-purple-300"
            >
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="size-8.5 shrink-0 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-xs text-white">
                  <Crown className="size-4.5" strokeWidth={2.3} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-bold text-purple-700 leading-tight">
                      Super Admin (Root)
                    </span>
                    <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9.5px] font-extrabold text-purple-700 uppercase tracking-wider">
                      Reset Data
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-ink-tertiary truncate">
                    superadmin@craveevent.id &bull; Hak delete &amp; reset data semua orang
                  </span>
                </div>
              </div>
              <ShieldAlert className="size-4 text-purple-600 shrink-0 ml-2 group-hover:scale-110 transition-transform" />
            </button>
          </div>
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
