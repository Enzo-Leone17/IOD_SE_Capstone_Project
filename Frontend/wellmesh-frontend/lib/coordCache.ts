// lib/coordCache.ts
import Cookies from "js-cookie";
import LZString from "lz-string";

type Coord = [number, number];

type CoordCache = {
  [address: string]: {
    coords: Coord;
    timestamp: number;
  };
};

const CACHE_KEY = "coordCache";
const MAX_CACHE_ENTRIES = 50;

let cache: CoordCache = loadCache();

function loadCache(): CoordCache {
  try {
    const compressed = Cookies.get(CACHE_KEY);
    if (!compressed) return {};
    const json = LZString.decompressFromUTF16(compressed);
    return json ? JSON.parse(json) : {};
  } catch (err) {
    console.error("❌ Failed to load coordCache cookie:", err);
    return {};
  }
}

function saveCache() {
  try {
    let entries = Object.entries(cache);

    // ✅ Evict oldest if over limit
    if (entries.length > MAX_CACHE_ENTRIES) {
      entries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(entries.length - MAX_CACHE_ENTRIES);
      cache = Object.fromEntries(entries);
    }

    const compressed = LZString.compressToUTF16(JSON.stringify(cache));
    Cookies.set(CACHE_KEY, compressed, { expires: 7 });
  } catch (err) {
    console.error("❌ Failed to save coordCache cookie:", err);
  }
}

export function getCachedCoord(address: string): Coord | null {
  if (cache[address]) {
    cache[address].timestamp = Date.now(); // update recency
    saveCache();
    return cache[address].coords;
  }
  return null;
}

export function setCachedCoord(address: string, coords: Coord) {
  cache[address] = { coords, timestamp: Date.now() };
  saveCache();
}
