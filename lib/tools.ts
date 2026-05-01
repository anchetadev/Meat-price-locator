import { tool } from 'ai';
import { z } from 'zod';
import { tavily } from '@tavily/core';

let _tvly: ReturnType<typeof tavily> | null = null;
function getTvly() {
  if (!_tvly) _tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! });
  return _tvly;
}

export const searchMeatPrices = tool({
  description:
    'Search the web for current grocery store meat prices near a specific location. ' +
    'Always call this tool before answering any question about prices — never guess.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('Meat product to search for, e.g. "ground beef 80/20", "boneless chicken breast", "ribeye steak"'),
    location: z
      .string()
      .describe('User location, e.g. "90210", "Austin TX", "Chicago Illinois"'),
    stores: z
      .string()
      .optional()
      .describe('Optional specific stores to target, e.g. "Walmart Kroger Aldi"'),
  }),
  execute: async ({ query, location, stores }) => {
    const storeFragment = stores ?? 'Walmart Kroger Aldi Publix HEB Safeway Costco Target';
    const searchQuery = `${query} price per pound ${location} ${storeFragment} grocery store 2025`;

    try {
      const response = await getTvly().search(searchQuery, {
        searchDepth: 'advanced',
        maxResults: 8,
        topic: 'general',
      });

      return {
        query: searchQuery,
        location,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          score: r.score,
        })),
        resultCount: response.results.length,
        searchedAt: new Date().toISOString(),
      };
    } catch {
      return {
        query: searchQuery,
        location,
        results: [],
        error: 'Search failed — Tavily may be unavailable.',
        resultCount: 0,
        searchedAt: new Date().toISOString(),
      };
    }
  },
});
