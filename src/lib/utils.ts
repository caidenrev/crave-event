import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Menghasilkan base domain publik yang bersih untuk di-share.
 * Jika pengguna sedang mengakses Vercel Preview Deployment URL (misal: crave-event-leoz9pkqa-eka-revandis-projects.vercel.app),
 * helper ini otomatis menormalkan ke domain production utama (https://crave-event.vercel.app)
 * agar penerima tautan / publik tidak dicegat oleh prompt login Vercel Authentication.
 */
export function getCanonicalSiteUrl(): string {
  if (typeof window === "undefined") return "https://crave-event.vercel.app";

  const envUrl =
    (import.meta.env["VITE_PUBLIC_SITE_URL"] as string | undefined) ||
    (import.meta.env["VITE_APP_URL"] as string | undefined);
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, "");

  const origin = window.location.origin;
  const hostname = window.location.hostname;

  // Jika di localhost / staging internal IP
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }

  // Deteksi Vercel Preview Deployment URL: e.g. crave-event-leoz9pkqa-eka-revandis-projects.vercel.app
  if (hostname.includes(".vercel.app") && hostname.includes("-")) {
    const projectName = hostname.split("-")[0] || "crave-event";
    return `https://${projectName}.vercel.app`;
  }

  return origin;
}

/**
 * Menghasilkan tautan lengkap yang aman dibagikan ke publik.
 */
export function getShareUrl(path: string): string {
  const base = getCanonicalSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Menjalankan Web Share API bawaan (WhatsApp, Telegram, sosmed) jika didukung,
 * atau otomatis menyalin link publik ke clipboard sebagai fallback.
 */
export async function shareContent(data: {
  title: string;
  text?: string;
  path: string;
}): Promise<{ shared: boolean; copied: boolean }> {
  const url = getShareUrl(data.path);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: data.title,
        text: data.text || data.title,
        url: url,
      });
      return { shared: true, copied: false };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { shared: false, copied: false };
      }
      // Jika share dibatalkan/gagal, fallback ke clipboard
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    return { shared: false, copied: true };
  }

  return { shared: false, copied: false };
}
