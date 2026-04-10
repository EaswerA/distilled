import { prisma } from "@/lib/prisma";
import { fetchContentForTopic, FetchedItem, TimeFilter } from "@/lib/fetchers";
import { summarizeContent } from "@/lib/summarize";

export async function ingestContentForTopic(
  topicId: string,
  topicSlug: string,
  timeFilter: TimeFilter = "day"
): Promise<number> {
  const items: FetchedItem[] = await fetchContentForTopic(topicSlug, timeFilter);

  let saved = 0;
  let summarizeCount = 0;

  for (const item of items) {
    try {
      const result = await prisma.content.upsert({
        where: { url: item.url },
        update: {
          sourceUrl: item.sourceUrl ?? null,
        },
        create: {
          title: item.title,
          url: item.url,
          sourceUrl: item.sourceUrl ?? null,
          source: item.source,
          author: item.author,
          publishedAt: item.publishedAt,
          imageUrl: item.imageUrl ?? null,
          topicId,
        },
      });

      // Summarize if this article has no summary yet (new articles + backfill).
      // Capped at 10 per ingest run to avoid burning the free-tier daily quota (1500 RPD).
      // 5-second delay = 12 RPM, safely under the 15 RPM limit.
      if (!result.summary && summarizeCount < 10) {
        summarizeCount++;
        await new Promise((r) => setTimeout(r, 5000));
        const ai = await summarizeContent(item.title, item.url);
        if (ai) {
          await prisma.content.update({
            where: { id: result.id },
            data: { summary: ai.summary, impact: ai.impact },
          });
        }
      }

      saved++;
    } catch {
      // skip duplicates or bad URLs
    }
  }

  return saved;
}

export async function ingestAllTopics(
  timeFilter: TimeFilter = "day"
): Promise<void> {
  const topics = await prisma.topic.findMany();
  console.log(`Starting ingestion for ${topics.length} topics...`);
  for (const topic of topics) {
    const count = await ingestContentForTopic(topic.id, topic.slug, timeFilter);
    console.log(`✅ ${topic.name}: ${count} items saved`);
  }
  console.log("Ingestion complete!");
}
