import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Clock, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "../../components/aether/markdown-renderer";
import { Badge, ButtonLink } from "../../components/aether/primitives";
import { SiteFooter, SiteHeader } from "../../components/aether/site-header";
import { formatDate, host } from "../../lib/mock-data";
import { useApp } from "../../lib/store";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostDetailPage,
});

function BlogPostDetailPage() {
  const { slug } = Route.useParams();
  const { blogPosts, events } = useApp();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-canvas text-ink">
        <SiteHeader />
        <main className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">Artikel Tidak Ditemukan</h1>
          <p className="mt-2 text-ink-secondary">
            Artikel yang kamu cari tidak tersedia atau URL telah dipindahkan.
          </p>
          <ButtonLink to="/blog" className="mt-6">
            Kembali ke Blog
          </ButtonLink>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan artikel berhasil disalin!");
    }
  };

  const relatedEvents = events.filter((e) => e.playlist === post.tag).slice(0, 2);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Back and Share navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/blog"
            className="neu-btn-glass inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-ink-secondary hover:text-accent shadow-xs"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Blog
          </Link>
          <button
            onClick={handleShare}
            className="neu-btn-glass inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-ink-secondary hover:text-accent shadow-xs"
          >
            <Share2 className="size-3.5 text-accent" />
            Bagikan
          </button>
        </div>

        {/* Article Header */}
        <div className="mt-8 text-center sm:text-left">
          <Badge tone="neutral">{post.tag}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl sm:leading-tight">
            {post.title}
          </h1>

          {/* Author & Meta bar - Responsive Mobile & Desktop Layout */}
          <div className="mt-6 border-y border-hairline py-3.5 text-[13px] text-ink-secondary">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap text-left">
              {/* Author */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="neu-icon-sphere size-8.5 shrink-0">
                  <span className="text-xs font-bold text-white">ER</span>
                </span>
                <div>
                  <p className="font-semibold text-ink leading-tight">{host.name}</p>
                  <p className="text-[11px] text-ink-tertiary">Host &amp; Speaker Utama</p>
                </div>
              </div>

              <span className="hidden sm:inline text-hairline">|</span>

              {/* Meta info chips */}
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[12px] sm:text-[13px] text-ink-secondary">
                <span>{formatDate(post.publishedAt)}</span>
                <span className="text-hairline">·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="size-3.5 text-accent" />
                  <span>{post.readMinutes} menit membaca</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banner / Cover */}
        <div
          className="mt-8 h-64 sm:h-80 w-full rounded-2xl shadow-md overflow-hidden relative"
          style={
            post.cover.startsWith("http") ||
            post.cover.startsWith("data:") ||
            post.cover.startsWith("/")
              ? {
                  backgroundImage: `url("${post.cover}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: post.cover }
          }
        />

        {/* Article Body */}
        <article className="mt-10 space-y-6 text-[16px] leading-[1.8] text-ink-secondary">
          {/* Excerpt callout */}
          <div className="glass rounded-xl border-l-4 border-accent p-5 text-[17px] font-medium italic text-ink shadow-xs">
            "{post.excerpt}"
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <MarkdownRenderer content={post.body.join("\n\n")} />
          </div>
        </article>

        {/* Author Bio Box */}
        <div className="neu mt-12 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-pill bg-accent-strong text-2xl font-bold text-white">
            ER
          </div>
          <div>
            <h4 className="text-[18px] font-bold text-ink">{host.name}</h4>
            <p className="text-[13px] text-accent font-medium">Native Speaker &amp; Webinar Host</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
              Membawakan sesi terpandu seputar public speaking, pronunciation, dan strategi
              komunikasi profesional. Semua webinar diselenggarakan langsung melalui Crave Event.
            </p>
          </div>
        </div>

        {/* Related Webinar CTA */}
        {relatedEvents.length > 0 && (
          <div className="glass mt-12 rounded-2xl p-6 text-center sm:text-left sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <Badge tone="accent">Webinar Terkait</Badge>
              <h3 className="mt-2 text-xl font-bold text-ink">
                Ingin Berlatih Langsung dengan Topik Ini?
              </h3>
              <p className="mt-1 text-[14px] text-ink-secondary">
                Daftar ke sesi {post.tag} terdekat dan dapatkan feedback interaktif.
              </p>
            </div>
            <ButtonLink to="/events" search={{ playlist: post.tag }} className="shrink-0">
              Lihat Webinar {post.tag}
            </ButtonLink>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
