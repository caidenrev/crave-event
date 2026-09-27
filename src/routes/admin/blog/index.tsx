import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Edit3, Eye, FileText, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../../components/aether/dashboard-shell";
import { Badge, Button, ButtonLink, FilterTabs, SearchInput } from "../../../components/aether/primitives";
import { formatShortDate, type BlogPost } from "../../../lib/mock-data";
import { useApp } from "../../../lib/store";

export const Route = createFileRoute("/admin/blog/")({
  component: AdminBlogListPage,
});

function AdminBlogListPage() {
  const { blogPosts, updateBlogPost, deleteBlogPost } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = blogPosts.filter((post) => {
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.tag.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleStatus = (post: BlogPost) => {
    const nextStatus = post.status === "published" ? "draft" : "published";
    updateBlogPost(post.id, { status: nextStatus });
    toast.success(
      nextStatus === "published" ? "Artikel Telah Dipublikasikan!" : "Artikel Disimpan ke Draf!",
      {
        description: `"${post.title}" kini ${
          nextStatus === "published" ? "dapat dibaca publik." : "hanya terlihat oleh host."
        }`,
      },
    );
  };

  const handleDeletePost = (id: string, postTitle: string) => {
    if (window.confirm(`Yakin ingin menghapus artikel "${postTitle}"?`)) {
      deleteBlogPost(id);
      toast.success("Artikel Dihapus", {
        description: `"${postTitle}" berhasil dihapus.`,
      });
    }
  };

  const filterTabs = [
    { value: "all", label: "Semua", count: blogPosts.length },
    {
      value: "published",
      label: "Dipublikasikan",
      count: blogPosts.filter((p) => p.status === "published").length,
    },
    {
      value: "draft",
      label: "Draf",
      count: blogPosts.filter((p) => p.status === "draft").length,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Blog & Materi"
        description="Tulis artikel edukasi teknis, tips karier, dan silabus webinar terstruktur."
        action={
          <ButtonLink to="/admin/blog/new" variant="primary">
            <Plus className="size-4" />
            Tulis Artikel Baru
          </ButtonLink>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs options={filterTabs} value={statusFilter} onChange={setStatusFilter} />
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Cari artikel, topik, atau kata kunci..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {/* Blog Posts Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-hairline bg-surface/70 text-[12px] text-ink-tertiary uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Artikel &amp; Sampul</th>
                <th className="px-4 py-3.5 font-semibold">Topik</th>
                <th className="px-4 py-3.5 font-semibold">Waktu Baca</th>
                <th className="px-4 py-3.5 font-semibold">Tanggal Rilis</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((post) => {
                const isImageSrc =
                  post.cover.startsWith("http://") ||
                  post.cover.startsWith("https://") ||
                  post.cover.startsWith("data:image/") ||
                  post.cover.startsWith("/");

                return (
                  <tr key={post.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="size-13 shrink-0 rounded-xl shadow-xs overflow-hidden"
                          style={
                            isImageSrc
                              ? {
                                  backgroundImage: `url("${post.cover}")`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }
                              : { background: post.cover }
                          }
                        />
                        <div className="min-w-0 max-w-md">
                          <Link
                            to="/admin/blog/$id"
                            params={{ id: post.id }}
                            className="font-semibold text-ink hover:text-accent truncate block text-[15px]"
                          >
                            {post.title}
                          </Link>
                          <p className="line-clamp-1 text-[12px] text-ink-secondary">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge tone="accent">{post.tag}</Badge>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-[13px] text-ink-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-ink-tertiary" />
                        {post.readMinutes} Menit
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-[13px] text-ink-secondary">
                      {formatShortDate(post.publishedAt)}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleStatus(post)}
                        title="Klik untuk ubah status"
                        className="cursor-pointer"
                      >
                        <Badge tone={post.status === "published" ? "success" : "neutral"}>
                          {post.status === "published" ? "Dipublikasikan" : "Draf"}
                        </Badge>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <ButtonLink
                          to="/admin/blog/$id"
                          params={{ id: post.id }}
                          variant="ghost"
                          size="sm"
                          title="Edit Artikel"
                          className="p-2"
                        >
                          <Edit3 className="size-4" />
                        </ButtonLink>
                        <Link
                          to="/blog/$slug"
                          params={{ slug: post.slug }}
                          title="Buka Halaman Baca"
                          className="rounded-pill p-2 text-ink-secondary hover:text-accent hover:bg-neutral-100 transition-colors inline-flex items-center justify-center"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id, post.title)}
                          title="Hapus Artikel"
                          className="rounded-pill p-2 text-ink-secondary hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-secondary">
                    <p className="text-[15px] font-medium">Tidak ada artikel yang sesuai.</p>
                    <p className="mt-1 text-[13px] text-ink-tertiary">
                      Coba ganti filter atau mulai dengan menulis artikel pertama.
                    </p>
                    <div className="mt-4">
                      <ButtonLink to="/admin/blog/new" variant="primary" size="sm">
                        <Plus className="size-4" /> Tulis Artikel Baru
                      </ButtonLink>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
