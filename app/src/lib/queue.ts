import { Queue } from "bullmq";

const connection = {
  host: "localhost",
  port: 6379,
};

export const contentQueue = new Queue("content-ingestion", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

export async function scheduleIngestion() {
  await contentQueue.add(
    "ingest-all",
    {},
    {
      repeat: {
        every: 1000 * 60 * 60 * 6,
      },
    }
  );
  console.log("✅ Ingestion job scheduled every 6 hours");
}