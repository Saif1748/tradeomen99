import { request } from "../core";
import type { NewsResult } from "../types";

export const newsApi = {
  search: (query: string) =>
    request<NewsResult>("/news/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
};