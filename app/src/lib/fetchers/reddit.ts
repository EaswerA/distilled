import axios from "axios";
import { FetchedItem } from "./hackernews";

export async function fetchReddit(
  subreddit: string,
  limit = 20
): Promise<FetchedItem[]> {
  try {
    const { data } = await axios.get(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          "User-Agent": "distilled-app/1.0",
        },
      }
    );

    return data.data.children
      .filter((post: any) => !post.data.is_self && post.data.url)
      .map((post: any) => ({
        title: post.data.title,
        url: post.data.url,
        author: post.data.author,
        publishedAt: new Date(post.data.created_utc * 1000),
        source: "reddit",
      }));
  } catch (error) {
    console.error(`Reddit fetch error (r/${subreddit}):`, error);
    return [];
  }
}