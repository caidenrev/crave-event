import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ExternalLink,
  Folder,
  ListMusic,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/aether/dashboard-shell";
import { Badge, Button } from "../../components/aether/primitives";
import { useApp } from "../../lib/store";
import type { Playlist } from "../../lib/mock-data";

export const Route = createFileRoute("/admin/playlists")({
  component: AdminPlaylistsPage,
});

function AdminPlaylistsPage() {
  const { playlists, events, createPlaylist, updatePlaylist, deletePlaylist, isSuperAdmin } =
    useApp();

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null);

  // Form Fields
  const [tag, setTag] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const openCreateModal = () => {
    setEditingPlaylist(null);
    setTag("");
    setTitle("");
    setDescription("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (pl: Playlist) => {
    setEditingPlaylist(pl);
    setTag(pl.tag);
    setTitle(pl.title);
    setDescription(pl.description);
    setIsFormModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;

    if (editingPlaylist) {
      updatePlaylist(editingPlaylist.id, {
        tag: formattedTag,
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Playlist Berhasil Diperbarui!", {
        description: `Perubahan pada playlist ${formattedTag} telah tersimpan.`,
      });
    } else {
      createPlaylist({
        tag: formattedTag,
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Playlist Berhasil Dibuat!", {
        description: `Playlist ${formattedTag} siap digunakan saat membuat event baru.`,
      });
    }

    setIsFormModalOpen(false);
    setEditingPlaylist(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingPlaylist) return;

    deletePlaylist(deletingPlaylist.id);
    toast.success("Playlist Berhasil Dihapus", {
      description: `Playlist ${deletingPlaylist.tag} (${deletingPlaylist.title}) telah dihapus dari sistem.`,
    });
    setDeletingPlaylist(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Playlist Event"
        description="Kelompokkan sesi webinar ke dalam playlist topik agar peserta mudah memilih bidang belajar."
        action={
          <Button onClick={openCreateModal} variant="primary" size="sm">
            <Plus className="size-4" />
            Tambah Playlist Baru
          </Button>
        }
      />

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((pl) => {
          const connectedEvents = events.filter((e) => e.playlist === pl.tag);
          const count = connectedEvents.length;

          return (
            <div
              key={pl.id}
              className="glass rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all border border-white/80 group"
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

              <div className="pt-4 border-t border-hairline flex items-center justify-between gap-2">
                <Link
                  to="/events"
                  search={{ playlist: pl.tag }}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"
                >
                  <span>Katalog Publik</span>
                  <ExternalLink className="size-3" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(pl)}
                    title="Edit Playlist"
                    className="neu-btn-glass p-2 rounded-xl text-ink-secondary hover:text-accent transition-colors"
                  >
                    <Pencil className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingPlaylist(pl)}
                    title="Hapus Playlist"
                    className="neu-btn-glass p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50/80 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {playlists.length === 0 && (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface/40 p-12 text-center">
          <Folder className="mx-auto size-12 text-ink-tertiary" />
          <h3 className="mt-4 text-lg font-bold text-ink">Belum Ada Playlist</h3>
          <p className="mt-1 text-[13px] text-ink-secondary">
            Mulai kelompokkan event dengan membuat playlist topik pertama kamu.
          </p>
          <Button onClick={openCreateModal} variant="primary" size="sm" className="mt-5">
            <Plus className="size-4" />
            Buat Playlist Pertama
          </Button>
        </div>
      )}

      {/* Create / Edit Playlist Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="glass relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2">
                <ListMusic className="size-5 text-accent" />
                <h3 className="text-lg font-bold text-ink">
                  {editingPlaylist ? "Edit Playlist" : "Buat Playlist Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-pill p-1 text-ink-tertiary hover:bg-neutral-100 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
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
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  Tanda tagar (#) akan otomatis ditambahkan jika belum disertakan.
                </p>
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
                <Button onClick={() => setIsFormModalOpen(false)} type="button" variant="glass" size="sm">
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingPlaylist ? "Simpan Perubahan" : "Simpan Playlist"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="glass relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-hairline">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink">Hapus Playlist?</h3>
                <p className="text-[12px] text-ink-secondary">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-[13.5px] text-ink leading-relaxed">
                Apakah Anda yakin ingin menghapus playlist{" "}
                <span className="font-bold text-accent">{deletingPlaylist.tag}</span> (
                <span className="font-semibold text-ink">{deletingPlaylist.title}</span>)?
              </p>

              {events.filter((e) => e.playlist === deletingPlaylist.tag).length > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-[12px] text-amber-800 leading-relaxed">
                  ⚠️ <strong>Perhatian:</strong> Terdapat{" "}
                  <strong>
                    {events.filter((e) => e.playlist === deletingPlaylist.tag).length} event
                  </strong>{" "}
                  yang saat ini menggunakan tag playlist ini. Event tersebut tidak akan dihapus, tetapi
                  kategorinya tidak akan terhubung lagi ke playlist ini.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
              <Button onClick={() => setDeletingPlaylist(null)} variant="glass" size="sm">
                Batal
              </Button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="neu-btn-danger inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-pill shadow-xs transition-colors"
              >
                <Trash2 className="size-3.5" />
                Hapus Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
