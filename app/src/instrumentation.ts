export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWorker } = await import("./lib/worker");
    const { scheduleIngestion } = await import("./lib/queue");
    
    startWorker();
    await scheduleIngestion();
    
    console.log("✅ Worker started and ingestion scheduled");
  }
}