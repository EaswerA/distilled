import { NextResponse } from "next/server";
import { ingestAllTopics } from "@/lib/ingest";
import { scheduleIngestion } from "@/lib/queue";

export async function POST() {
  try {
    await ingestAllTopics();
    return NextResponse.json({ success: true, message: "Ingestion complete" });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await scheduleIngestion();
    return NextResponse.json({ success: true, message: "Ingestion scheduled" });
  } catch (error) {
    console.error("Schedule error:", error);
    return NextResponse.json({ error: "Scheduling failed" }, { status: 500 });
  }
}