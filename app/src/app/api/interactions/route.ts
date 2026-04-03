import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

const WEIGHT_DELTA: Record<string, number> = {
  LIKE:  0.15,
  CLICK: 0.05,
  SAVE:  0.20,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { contentId, type } = await req.json();

    if (!contentId || !["LIKE", "CLICK", "SAVE"].includes(type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Record the interaction (ignore if already exists)
    await prisma.interaction.upsert({
      where: { userId_contentId_type: { userId, contentId, type } },
      update: {},
      create: { userId, contentId, type },
    });

    // Find the content's topic
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { topicId: true },
    });

    if (content?.topicId) {
      // Update topic weight
      const userTopic = await prisma.userTopic.findUnique({
        where: { userId_topicId: { userId, topicId: content.topicId } },
      });

      if (userTopic) {
        const newWeight = Math.min(userTopic.weight + WEIGHT_DELTA[type], 5.0);
        await prisma.userTopic.update({
          where: { id: userTopic.id },
          data: {
            weight: newWeight,
            lastEngagedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interaction error:", error);
    return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 });
  }
}

// Toggle like/save off
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { contentId, type } = await req.json();

    await prisma.interaction.deleteMany({
      where: { userId, contentId, type },
    });

    // Decrease topic weight slightly on unlike
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { topicId: true },
    });

    if (content?.topicId) {
      const userTopic = await prisma.userTopic.findUnique({
        where: { userId_topicId: { userId, topicId: content.topicId } },
      });

      if (userTopic) {
        const newWeight = Math.max(userTopic.weight - WEIGHT_DELTA[type], 0.1);
        await prisma.userTopic.update({
          where: { id: userTopic.id },
          data: { weight: newWeight },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Interaction delete error:", error);
    return NextResponse.json({ error: "Failed to remove interaction" }, { status: 500 });
  }
}