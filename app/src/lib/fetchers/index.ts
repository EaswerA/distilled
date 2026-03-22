import { fetchHackerNews } from "./hackernews";
import { fetchDevTo } from "./devto";
import { fetchReddit } from "./reddit";
import { FetchedItem } from "./hackernews";

const TOPIC_SOURCE_MAP: Record<string, () => Promise<FetchedItem[]>> = {
  technology: async () => {
    const [hn, devto, reddit] = await Promise.all([
      fetchHackerNews(20),
      fetchDevTo("technology", 15),
      fetchReddit("technology", 15),
    ]);
    return [...hn, ...devto, ...reddit];
  },
  "artificial-intelligence": async () => {
    const [hn, devto, reddit] = await Promise.all([
      fetchHackerNews(20),
      fetchDevTo("ai", 15),
      fetchReddit("artificial", 15),
    ]);
    return [...hn, ...devto, ...reddit];
  },
  "web-development": async () => {
    const [devto, reddit] = await Promise.all([
      fetchDevTo("webdev", 20),
      fetchReddit("webdev", 15),
    ]);
    return [...devto, ...reddit];
  },
  finance: async () => fetchReddit("investing", 20),
  science: async () => fetchReddit("science", 20),
  design: async () => fetchDevTo("design", 20),
  startups: async () => fetchReddit("startups", 20),
  cybersecurity: async () => fetchReddit("netsec", 20),
  health: async () => fetchReddit("health", 20),
  climate: async () => fetchReddit("climate", 20),
  crypto: async () => fetchReddit("cryptocurrency", 20),
  space: async () => fetchReddit("space", 20),
  politics: async () => fetchReddit("politics", 20),
  gaming: async () => fetchReddit("gaming", 20),
  culture: async () => fetchReddit("TrueOffMyChest", 15),
};

export async function fetchContentForTopic(
  topicSlug: string
): Promise<FetchedItem[]> {
  const fetcher = TOPIC_SOURCE_MAP[topicSlug];
  if (!fetcher) return [];
  return fetcher();
}

export type { FetchedItem };