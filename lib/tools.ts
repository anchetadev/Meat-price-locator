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
    const storeFragment = stores ?? 'Walmart Kroger Aldi Safeway Costco Target Trader Joe\'s Whole Foods';
    const searchQuery = `${query} price per pound near ${location} ${storeFragment} grocery store 2025`;

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

export const searchArtist = tool({
  description:
    'Look up an artist or band on Last.fm — returns bio, listener count, top albums, top tracks, and similar artists. ' +
    'Use this when the user mentions any emo, scene, screamo, or metal band.',
  inputSchema: z.object({
    artist: z.string().describe('The artist or band name, e.g. "Pierce the Veil", "Paramore", "My Chemical Romance"'),
  }),
  execute: async ({ artist }) => {
    const key = process.env.LAST_FM_API_KEY!;
    const base = 'https://ws.audioscrobbler.com/2.0/';
    const params = (method: string, extra = '') =>
      `${base}?method=${method}&artist=${encodeURIComponent(artist)}&api_key=${key}&format=json${extra}`;

    try {
      const [infoRes, albumsRes, tracksRes, similarRes] = await Promise.all([
        fetch(params('artist.getInfo')),
        fetch(params('artist.getTopAlbums', '&limit=8')),
        fetch(params('artist.getTopTracks', '&limit=5')),
        fetch(params('artist.getSimilar', '&limit=5')),
      ]);

      const [info, albums, tracks, similar] = await Promise.all([
        infoRes.json(),
        albumsRes.json(),
        tracksRes.json(),
        similarRes.json(),
      ]);

      const rawBio: string = info.artist?.bio?.summary ?? '';
      const bio = rawBio.replace(/<a\b[^>]*>.*?<\/a>/gi, '').replace(/<[^>]+>/g, '').trim();

      return {
        artist,
        listeners: info.artist?.stats?.listeners ?? null,
        playcount: info.artist?.stats?.playcount ?? null,
        tags: (info.artist?.tags?.tag ?? []).map((t: { name: string }) => t.name),
        bio: bio.slice(0, 600) || null,
        topAlbums: (albums.topalbums?.album ?? []).map((a: { name: string; playcount: number }) => ({
          name: a.name,
          playcount: a.playcount,
        })),
        topTracks: (tracks.toptracks?.track ?? []).map((t: { name: string; playcount: number; listeners: number }) => ({
          name: t.name,
          playcount: t.playcount,
          listeners: t.listeners,
        })),
        similarArtists: (similar.similarartists?.artist ?? []).map((a: { name: string }) => a.name),
      };
    } catch {
      return { artist, error: 'Last.fm lookup failed.', listeners: null, topAlbums: [], topTracks: [], similarArtists: [] };
    }
  },
});

export const searchBandOpinion = tool({
  description:
    'Search the web for fan reception, critical reviews, cultural impact, and public opinion on a band or artist. ' +
    'Use alongside searchArtist for a fuller picture — especially for favorite bands.',
  inputSchema: z.object({
    artist: z.string().describe('The artist or band name'),
    angle: z
      .string()
      .optional()
      .describe('Specific angle to search, e.g. "fan reception", "critical acclaim", "legacy impact", "controversy"'),
  }),
  execute: async ({ artist, angle }) => {
    const searchQuery = `${artist} ${angle ?? 'fan reception legacy cultural impact review'} band`;

    try {
      const response = await getTvly().search(searchQuery, {
        searchDepth: 'advanced',
        maxResults: 5,
        topic: 'general',
      });

      return {
        artist,
        searchQuery,
        results: response.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        })),
      };
    } catch {
      return { artist, searchQuery, results: [], error: 'Search failed.' };
    }
  },
});
