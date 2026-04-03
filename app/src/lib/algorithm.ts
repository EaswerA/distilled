import { prisma } from "@/lib/prisma";

// Exponential decay — reduces topic weights over time if not engaged
export async function applyWeightDecay(userId: string) {
  const userTopics = await prisma.userTopic.findMany({
    where: { userId, status: "ACTIVE" },
  });

  for (const ut of userTopics) {
    if (!ut.lastEngagedAt) continue;

    const daysSinceEngaged =
      (Date.now() - ut.lastEngagedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceEngaged > 3) {
      const decayFactor = Math.exp(-0.05 * daysSinceEngaged);
      const newWeight = Math.max(ut.weight * decayFactor, 0.1);
      await prisma.userTopic.update({
        where: { id: ut.id },
        data: { weight: newWeight },
      });
    }
  }
}

// Score an article based on recency + topic weight
export function scoreArticle(
  article: any,
  topicWeightMap: Map<string, number>
): number {
  const weight = article.topicId
    ? (topicWeightMap.get(article.topicId) ?? 1.0)
    : 1.0;

  const ageMs = Date.now() - new Date(article.publishedAt ?? article.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Recency score: decays over 72 hours
  const recencyScore = Math.exp(-ageHours / 72);

  return weight * recencyScore;
}

// Diversity pass — interleave topics so feed isn't clustered
export function diversifyFeed(articles: any[]): any[] {
  const byTopic = new Map<string, any[]>();

  for (const article of articles) {
    const key = article.topicId ?? "unknown";
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key)!.push(article);
  }

  const result: any[] = [];
  const queues = Array.from(byTopic.values());

  let i = 0;
  while (result.length < articles.length) {
    const queue = queues[i % queues.length];
    if (queue && queue.length > 0) {
      result.push(queue.shift());
    }
    i++;
    if (queues.every((q) => q.length === 0)) break;
  }

  return result;
}