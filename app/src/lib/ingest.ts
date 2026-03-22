import { prisma } from "@/lib/prisma";
import { fetchContentForTopic, FetchedItem } from "@/lib/fetchers";

export async function ingestContentForTopic(
  topicId: string,
  topicSlug: string
): Promise<number> {
  const items: FetchedItem[] = await fetchContentForTopic(topicSlug);

  let saved = 0;

  for (const item of items) {
    try {
      await prisma.content.upsert({
        where: { url: item.url },
        update: {},
        create: {
          title: item.title,
          url: item.url,
          source: item.source,
          author: item.author,
          publishedAt: item.publishedAt,
          topicId,
        },
      });
      saved++;
    } catch {
      // skip duplicates or bad URLs
    }
  }

  return saved;
}

export async function ingestAllTopics(): Promise<void> {
  const topics = await prisma.topic.findMany();

  console.log(`Starting ingestion for ${topics.length} topics...`);

  for (const topic of topics) {
    const count = await ingestContentForTopic(topic.id, topic.slug);
    console.log(`✅ ${topic.name}: ${count} items saved`);
  }

  console.log("Ingestion complete!");
}