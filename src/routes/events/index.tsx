import { createFileRoute } from "@tanstack/react-router";
import { Filter, X } from "lucide-react";
import { useState, useEffect } from "react";
import { EventCard } from "../../components/aether/event-card";
import { Badge, Button, FilterTabs, SearchInput } from "../../components/aether/primitives";
import { SiteFooter, SiteHeader } from "../../components/aether/site-header";
import { useApp } from "../../lib/store";
import { isPlaylistMatch } from "../../lib/mock-data";

type SearchParams = {
  playlist?: string | undefined;
};

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const p = search["playlist"];
    return {
      playlist: typeof p === "string" ? p : undefined,
    };
  },
  component: EventsCatalogPage,
});

function EventsCatalogPage() {
  const { playlist: initialPlaylist } = Route.useSearch();
  const { events, playlists } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>(initialPlaylist || "all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sync selected playlist if initialPlaylist search param changes
  useEffect(() => {
    if (initialPlaylist) {
      setSelectedPlaylist(initialPlaylist);
    }
  }, [initialPlaylist]);

  const filteredEvents = events.filter((ev) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.speaker.toLowerCase().includes(q) ||
        ev.playlist.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedPlaylist !== "all" && !isPlaylistMatch(ev.playlist, selectedPlaylist)) {
      return false;
    }

    if (typeFilter !== "all" && ev.type !== typeFilter) {
      return false;
    }

    if (statusFilter !== "all" && ev.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedPlaylist("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery || selectedPlaylist !== "all" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="max-w-2xl">
          <Badge tone="accent">Katalog Lengkap</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Jelajahi Event &amp; Webinar
          </h1>
          <p className="mt-2 text-[15px] text-ink-secondary">
            Ikuti sesi belajar interaktif bersama host terpercaya. Akses webinar gratis atau berbayar
            dengan sertifikasi instan.
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari judul, topik, materi, atau speaker..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <FilterTabs
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { value: "all", label: "Semua Tipe" },
                  { value: "free", label: "Gratis" },
                  { value: "paid", label: "Berbayar" },
                ]}
              />

              {/* Status Filter */}
              <FilterTabs
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Semua Waktu" },
                  { value: "upcoming", label: "Mendatang" },
                  { value: "past", label: "Selesai" },
                ]}
              />
            </div>
          </div>

          {/* Playlist Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[13px] font-medium text-ink-secondary">Playlist:</span>
            <button
              onClick={() => setSelectedPlaylist("all")}
              className={`rounded-pill px-3.5 py-1.5 text-[12px] font-semibold transition-all ${selectedPlaylist === "all"
                  ? "neu-btn-blue text-white shadow-sm"
                  : "neu-badge-glass text-ink-secondary hover:text-accent"
                }`}
            >
              Semua Playlist
            </button>
            {playlists.map((pl) => {
              const isSelected = isPlaylistMatch(selectedPlaylist, pl.tag);
              return (
                <button
                  key={pl.id}
                  onClick={() => setSelectedPlaylist(isSelected ? "all" : pl.tag)}
                  className={`rounded-pill px-3.5 py-1.5 text-[12px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "neu-btn-blue text-white shadow-sm"
                      : "neu-badge-glass text-ink-secondary hover:text-accent"
                  }`}
                >
                  {pl.tag}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="neu-btn-danger-glass ml-auto shadow-xs"
              >
                <X className="size-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="mt-8 flex items-center justify-between border-b border-hairline pb-4 text-[13px] text-ink-secondary">
          <span>Menampilkan {filteredEvents.length} event</span>
          {selectedPlaylist !== "all" && (
            <Badge tone="accent">Filter: {selectedPlaylist}</Badge>
          )}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="my-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-surface/50 p-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-pill bg-accent-tint text-accent-strong">
              <Filter className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-semibold text-ink">Tidak ada event ditemukan</h3>
            <p className="mt-1 max-w-sm text-[14px] text-ink-secondary">
              Tidak ada event yang sesuai dengan kata kunci atau filter yang kamu pilih.
            </p>
            <Button onClick={resetFilters} variant="primary" className="mt-5" size="sm">
              Tampilkan Semua Event
            </Button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
