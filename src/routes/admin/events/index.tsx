import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Edit3,
  ExternalLink,
  Plus,
  QrCode,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../../components/aether/dashboard-shell";
import { Badge, Button, ButtonLink, FilterTabs, SearchInput } from "../../../components/aether/primitives";
import { QrMatrix } from "../../../components/aether/qr-code";
import { formatDate, formatPrice, formatTime, type EventItem } from "../../../lib/mock-data";
import { useApp } from "../../../lib/store";

export const Route = createFileRoute("/admin/events/")({
  component: AdminEventsPage,
});

function AdminEventsPage() {
  const { events, deleteEvent } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveQrEvent, setLiveQrEvent] = useState<EventItem | null>(null);

  const filtered = events.filter((ev) => {
    if (statusFilter !== "all" && ev.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.playlist.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Yakin ingin menghapus event "${title}"?`)) {
      deleteEvent(id);
      toast.success("Event Berhasil Dihapus", {
        description: `Event "${title}" telah dihapus dari sistem.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Event"
        description="Kelola jadwal webinar, harga tiket, kuota peserta, dan tayangkan kode QR absensi."
        action={
          <ButtonLink to="/admin/events/new" variant="primary" size="sm">
            <Plus className="size-4" />
            Buat Event Baru
          </ButtonLink>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari judul atau playlist..."
          />
        </div>

        <div className="w-full sm:w-64">
          <FilterTabs
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Semua" },
              { value: "upcoming", label: "Mendatang" },
              { value: "past", label: "Selesai" },
            ]}
          />
        </div>
      </div>

      {/* Events Table Container */}
      <div className="glass overflow-hidden rounded-2xl border border-hairline">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-hairline bg-surface/80 text-[12px] uppercase text-ink-tertiary">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Event</th>
                <th className="px-4 py-3.5 font-semibold">Playlist</th>
                <th className="px-4 py-3.5 font-semibold">Tipe &amp; Harga</th>
                <th className="px-4 py-3.5 font-semibold">Waktu Pelaksanaan</th>
                <th className="px-4 py-3.5 font-semibold">Pendaftar / Kuota</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-11 shrink-0 rounded-lg shadow-xs overflow-hidden"
                        style={
                          item.thumbnail.startsWith("http://") ||
                          item.thumbnail.startsWith("https://") ||
                          item.thumbnail.startsWith("data:image/") ||
                          item.thumbnail.startsWith("/")
                            ? {
                                backgroundImage: `url("${item.thumbnail}")`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : { background: item.thumbnail }
                        }
                      />
                      <div className="min-w-0 max-w-xs">
                        <Link
                          to="/events/$slug"
                          params={{ slug: item.slug }}
                          className="font-semibold text-ink hover:text-accent truncate block"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[12px] text-ink-tertiary">{item.category}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge tone="accent">{item.playlist}</Badge>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-ink">{formatPrice(item.price)}</span>
                      <span className="text-[11px] text-ink-tertiary">
                        {item.type === "free" ? "Gratis" : "Berbayar"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-[13px]">
                      <p className="font-medium text-ink">{formatDate(item.startsAt).split(",")[0]}</p>
                      <p className="text-[11px] text-ink-tertiary">{formatTime(item.startsAt)}</p>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col text-[13px]">
                      <span className="font-semibold text-ink">
                        {item.registered} / {item.quota}
                      </span>
                      <span className="text-[11px] text-ink-tertiary">
                        {item.attended} Hadir Terdata
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge tone={item.status === "upcoming" ? "accent" : "neutral"}>
                      {item.status === "upcoming" ? "Mendatang" : "Selesai"}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLiveQrEvent(item)}
                        title="Tayangkan QR Absensi"
                        className="rounded-pill p-2 text-accent-strong hover:bg-accent-tint transition-colors"
                      >
                        <QrCode className="size-4" />
                      </button>
                      <Link
                        to="/admin/events/$id"
                        params={{ id: item.id }}
                        title="Ubah Event"
                        className="rounded-pill p-2 text-ink-secondary hover:bg-white hover:text-ink transition-colors"
                      >
                        <Edit3 className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.title)}
                        title="Hapus Event"
                        className="rounded-pill p-2 text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Host Live Presentation QR Modal */}
      {liveQrEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="glass relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <Badge tone="accent">Host Live Presentation Screen</Badge>
            <h3 className="mt-2 text-xl font-bold text-ink">{liveQrEvent.title}</h3>
            <p className="mt-1 text-[13px] text-ink-secondary">
              Bagikan layar (share screen) ini ke peserta webinar di Zoom untuk absensi &amp; klaim
              sertifikat instan.
            </p>

            {(() => {
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const activeCode = liveQrEvent.attendanceCode || `ATTEND-${liveQrEvent.id.toUpperCase()}`;
              const qrPayload = `${origin}/dashboard/scan?event=${liveQrEvent.id}&code=${activeCode}`;

              return (
                <>
                  <div className="my-6 flex flex-col items-center justify-center gap-2">
                    <div className="rounded-2xl border-4 border-accent p-2.5 bg-white shadow-xl">
                      <QrMatrix value={qrPayload} size={220} />
                    </div>
                    <span className="text-[11.5px] font-medium text-ink-tertiary">
                      Scan dengan kamera ponsel untuk presensi kilat &lt; 5 detik
                    </span>
                  </div>

                  <div className="rounded-xl bg-accent-tint/60 p-3 text-center border border-accent/20">
                    <span className="aether-meta block text-accent-strong">Kode Absensi Manual Cadangan</span>
                    <span className="mt-1 block font-mono text-2xl font-bold tracking-widest text-ink select-all">
                      {activeCode}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-tertiary">
                      Bisa dibacakan jika kamera peserta mengalami kendala
                    </span>
                  </div>
                </>
              );
            })()}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => {
                  toast.success("Token QR diperbarui!", {
                    description: "Jendela waktu absensi aktif 15 menit ke depan.",
                  });
                }}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                Refresh Token QR
              </Button>
              <Button onClick={() => setLiveQrEvent(null)} variant="glass" size="sm" className="flex-1">
                Tutup Layar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
