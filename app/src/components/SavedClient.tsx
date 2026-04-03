"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Article = {
  id: string;
  title: string;
  url: string;
  sourceUrl: string | null;
  summary: string | null;
  imageUrl: string | null;
  source: string;
  author: string | null;
  publishedAt: string | null;
  savedAt: string;
  topic: { name: string; emoji: string | null } | null;
};

const SOURCE_COLORS: Record<string, string> = {
  reddit: "#FF4500",
  hackernews: "#FF6600",
  devto: "#3B49DF",
  rss: "#FFA500",
};

const SOURCE_LABELS: Record<string, string> = {
  reddit: "Reddit",
  hackernews: "Hacker News",
  devto: "Dev.to",
  rss: "RSS",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SavedClient() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saved")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function unsave(articleId: string) {
    await fetch("/api/interactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: articleId, type: "SAVE" }),
    });
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f2f8; font-family: 'DM Sans', sans-serif; }
        .saved-container { max-width: 860px; margin: 0 auto; padding: 40px 24px 80px; }
        .saved-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .saved-logo { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; color: #0f1132; }
        .back-btn { padding: 8px 18px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: #4f52d3; cursor: pointer; }
        .saved-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #0f1132; margin-bottom: 24px; }
        .articles-grid { display: flex; flex-direction: column; gap: 16px; }
        .article-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06); display: flex; color: inherit; }
        .article-image { width: 180px; min-width: 180px; height: 140px; object-fit: cover; }
        .article-image-placeholder { width: 180px; min-width: 180px; height: 140px; display: flex; align-items: center; justify-content: center; font-size: 32px; background: linear-gradient(135deg, #f0f0fc, #e8f0fe); }
        .article-body { padding: 18px 20px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .article-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .source-badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; color: #fff; }
        .topic-badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; background: #ededf8; color: #4f52d3; }
        .article-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0f1132; line-height: 1.4; }
        .article-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .article-meta { font-size: 12px; color: #9ca3af; }
        .article-links { display: flex; gap: 12px; align-items: center; }
        .read-more { font-size: 13px; font-weight: 600; color: #4f52d3; text-decoration: none; }
        .unsave-btn { font-size: 13px; font-weight: 500; color: #ef4444; background: none; border: none; cursor: pointer; }
        .unsave-btn:hover { text-decoration: underline; }
        .loading { text-align: center; padding: 80px 0; color: #9ca3af; }
        .empty { text-align: center; padding: 80px 0; color: #9ca3af; }
        .empty h2 { font-family: 'Sora', sans-serif; font-size: 20px; color: #0f1132; margin-bottom: 8px; }
      `}</style>

      <div className="saved-container">
        <div className="saved-header">
          <span className="saved-logo">Distilled</span>
          <button className="back-btn" onClick={() => router.push("/feed")}>
            ← Back to Feed
          </button>
        </div>

        <h2 className="saved-title">🔖 Saved Articles ({articles.length})</h2>

        {loading ? (
          <div className="loading">Loading saved articles...</div>
        ) : articles.length === 0 ? (
          <div className="empty">
            <h2>Nothing saved yet</h2>
            <p>Bookmark articles from your feed to read them later.</p>
          </div>
        ) : (
          <div className="articles-grid">
            {articles.map((article) => (
              <div key={article.id} className="article-card">
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={article.title} className="article-image"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="article-image-placeholder">🔖</div>
                )}
                <div className="article-body">
                  <div className="article-badges">
                    <span className="source-badge" style={{ background: SOURCE_COLORS[article.source] ?? "#888" }}>
                      {SOURCE_LABELS[article.source] ?? article.source}
                    </span>
                    {article.topic && (
                      <span className="topic-badge">
                        {article.topic.emoji} {article.topic.name}
                      </span>
                    )}
                  </div>
                  <div className="article-title">{article.title}</div>
                  <div className="article-footer">
                    <span className="article-meta">
                      {article.author ? `By ${article.author} · ` : ""}
                      {timeAgo(article.publishedAt)}
                    </span>
                    <div className="article-links">
                      <button className="unsave-btn" onClick={() => unsave(article.id)}>
                        🗑 Remove
                      </button>
                      {article.sourceUrl && (
                        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="read-more">
                          💬 Discussion
                        </a>
                      )}
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">
                        Read more →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}