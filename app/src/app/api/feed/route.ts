import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { scoreArticle, diversifyFeed, applyWeightDecay } from "@/lib/algorithm";

function frequencyToPostCount(frequency: string, userPostCount: number): number {
  switch (frequency) {
    case "WEEKLY":  return Math.max(userPostCount, 60);
    case "MONTHLY": return Math.max(userPostCount, 100);
    default:        return userPostCount;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Apply weight decay
    await applyWeightDecay(userId);

    const [userPreference, userTopics] = await Promise.all([
      prisma.userPreference.findUnique({ where: { userId } }),
      prisma.userTopic.findMany({
        where: { userId, status: "ACTIVE" },
        include: { topic: true },
      }),
    ]);

    const frequency = userPreference?.frequency ?? "DAILY";
    const postCount = frequencyToPostCount(
      frequency,
      userPreference?.postCount ?? 20
    );
    const topicIds = userTopics.map((ut) => ut.topicId);

    if (topicIds.length === 0) {
      return NextResponse.json({ articles: [], preferences: {} });
    }

    // Build topic weight map
    const topicWeightMap = new Map(
      userTopics.map((ut) => [ut.topicId, ut.weight])
    );

    // Fetch more than needed so we can score + trim
    const rawArticles = await prisma.content.findMany({
      where: { topicId: { in: topicIds } },
      orderBy: { publishedAt: "desc" },
      take: postCount * 3,
      include: { topic: true },
    });

    // Score each article
    const scored = rawArticles
      .map((article) => ({
        ...article,
        _score: scoreArticle(article, topicWeightMap),
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, postCount * 1.5);

    // Diversity pass
    const diversified = diversifyFeed(scored).slice(0, postCount);

    // Fetch user's saved/liked interactions for these articles
    const articleIds = diversified.map((a) => a.id);
    const interactions = await prisma.interaction.findMany({
      where: {
        userId,
        contentId: { in: articleIds },
        type: { in: ["LIKE", "SAVE"] },
      },
    });

    const likedSet = new Set(
      interactions.filter((i) => i.type === "LIKE").map((i) => i.contentId)
    );
    const savedSet = new Set(
      interactions.filter((i) => i.type === "SAVE").map((i) => i.contentId)
    );

    // Attach interaction state to articles
    const articles = diversified.map((a) => ({
      ...a,
      isLiked: likedSet.has(a.id),
      isSaved: savedSet.has(a.id),
    }));

    return NextResponse.json({
      articles,
      preferences: {
        postCount,
        frequency,
        topics: userTopics.map((ut) => ut.topic.name),
      },
    });
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}