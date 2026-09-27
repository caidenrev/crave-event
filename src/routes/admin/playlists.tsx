import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, ListMusic, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/aether/dashboard-shell";
import { Badge, Button, ButtonLink } from "../../components/aether/primitives";
import { useApp } from "../../lib/store";

export const Route = createFileRoute("/admin/playlists")({
  component: AdminPlaylistsPage,
});

function AdminPlaylistsPage() {
  const { playlists, events, createPlaylist } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTag = tag.startsWith("#") ? tag : `#${tag}`;

    createPlaylist({
      tag: formattedTag,
      title,
      description,
    });

    toast.success("Playlist Berhasil Dibuat!", {
      description: `Playlist ${formattedTag} siap digunakan saat membuat event baru.`,
    });

    setTag("");
    setTitle("");
    setDescription("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Playlist Event"
        description="Kelompokkan sesi webinar ke dalam playlist topik agar peserta mudah memilih bidang belajar."
        action={
          <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm">
            <Plus className="size-4" />
            Tambah Playlist Baru
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((pl) => {
          const count = events.filter((e) => e.playlist === pl.tag).length;

          return (
            <div
              key={pl.id}
              className="glass rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="aether-meta rounded-pill bg-accent-tint px-3 py-1 font-semibold text-accent-strong">
                    {pl.tag}
                  </span>
                  <span className="text-[12px] font-semibold text-ink-tertiary">
                    {count} Event Terhubung
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-ink">{pl.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
                  {pl.description}
                </p>
              </div>

              <div className="pt-4 border-t border-hairline flex items-center justify-between">
                <Link
                  to="/events"
                  search={{ playlist: pl.tag }}
                  className="text-[13px] font-medium text-accent hover:underline"
                >
                  Lihat di Katalog Publik &rarr;
                </Link>
                <Link
                  to="/admin/events"
                  className="text-[12px] text-ink-tertiary hover:text-ink"
                >
                  Kelola Event
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Playlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="glass relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2">
                <ListMusic className="size-5 text-accent" />
                <h3 className="text-lg font-bold text-ink">Buat Playlist Baru</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-pill p-1 text-ink-tertiary hover:bg-neutral-100 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="aether-meta block text-ink-tertiary">Tag Playlist</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: #DesignSprint atau #PublicSpeaking"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-surface/90 px-4 py-2.5 text-[14px] text-ink focus:shadow-[var(--focus-ring)] focus:outline-none"
                />
              </div>

              <div>
                <label className="aether-meta block text-ink-tertiary">Nama Playlist</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Design Sprint & Prototyping"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-surface/90 px-4 py-2.5 text-[14px] text-ink focus:shadow-[var(--focus-ring)] focus:outline-none"
                />
              </div>

              <div>
                <label className="aether-meta block text-ink-tertiary">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Penjelasan fokus kurasi materi dalam playlist ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-surface/90 p-3 text-[14px] text-ink focus:shadow-[var(--focus-ring)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button onClick={() => setIsModalOpen(false)} type="button" variant="glass" size="sm">
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Playlist
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
