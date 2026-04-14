import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeoBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface GeoResult {
  lat: number;
  lon: number;
  bounds: GeoBounds;
  displayName: string;
}

interface BusinessResult {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  types: string[];
  lat: number | null;
  lon: number | null;
  source: string;
  place_id: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NOMINATIM_HEADERS = {
  'User-Agent': 'AriaAgent-BusinessScraper/1.0 (https://ariaagent.com)',
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const MAX_RESULTS = 20;
const OVERPASS_TIMEOUT = 25;

// ─── 1. Geocode location using Nominatim ────────────────────────────────────

async function geocodeLocation(location: string): Promise<GeoResult> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1&extratags=1`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(10000) });

  if (!res.ok) throw new Error(`Nominatim geocoding failed: ${res.status}`);
  const data = await res.json();

  if (!data || data.length === 0) throw new Error(`Location not found: "${location}". Try a more specific location like "London, UK" or "New York, USA".`);

  const r = data[0];
  const b = r.boundingbox; // [south, north, west, east]

  return {
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    bounds: {
      south: parseFloat(b[0]),
      north: parseFloat(b[1]),
      west: parseFloat(b[2]),
      east: parseFloat(b[3]),
    },
    displayName: r.display_name || location,
  };
}

// ─── 2. Map business query to OSM tags ──────────────────────────────────────

type OsmTag = [string, string];

function mapQueryToOsmTags(query: string): OsmTag[][] {
  const q = query.toLowerCase().trim();

  // Ordered from most specific to most general patterns
  const tagMappings: Array<{ keywords: string[]; tags: OsmTag[] }> = [
    {
      keywords: ['software', 'tech', 'saas', 'startup', 'it company', 'web development', 'app development'],
      tags: [['office', 'company'], ['office', 'it']],
    },
    {
      keywords: ['fintech', 'financial technology', 'finance company'],
      tags: [['office', 'financial'], ['office', 'company'], ['amenity', 'bank']],
    },
    {
      keywords: ['bank', 'banking'],
      tags: [['amenity', 'bank']],
    },
    {
      keywords: ['accounting', 'accountant', 'cfo', 'cpa', 'tax'],
      tags: [['office', 'accountant'], ['office', 'financial']],
    },
    {
      keywords: ['law', 'legal', 'lawyer', 'attorney', 'solicitor', 'barrister'],
      tags: [['office', 'lawyer'], ['office', 'legal']],
    },
    {
      keywords: ['health', 'medical', 'hospital', 'clinic', 'doctor', 'physician', 'dental', 'pharmacy'],
      tags: [['amenity', 'hospital'], ['amenity', 'clinic'], ['amenity', 'doctors'], ['office', 'physician']],
    },
    {
      keywords: ['restaurant', 'food', 'cafe', 'dining', 'bar', 'pub'],
      tags: [['amenity', 'restaurant'], ['amenity', 'cafe'], ['amenity', 'fast_food'], ['amenity', 'bar']],
    },
    {
      keywords: ['hotel', 'accommodation', 'hostel', 'lodging'],
      tags: [['tourism', 'hotel'], ['tourism', 'hostel']],
    },
    {
      keywords: ['retail', 'shop', 'store', 'ecommerce', 'e-commerce', 'shopping'],
      tags: [['shop', 'yes'], ['office', 'company']],
    },
    {
      keywords: ['real estate', 'property', 'estate agent', 'realtor'],
      tags: [['office', 'estate_agent']],
    },
    {
      keywords: ['insurance'],
      tags: [['office', 'insurance']],
    },
    {
      keywords: ['government', 'government agency', 'public office'],
      tags: [['office', 'government']],
    },
    {
      keywords: ['university', 'education', 'school', 'college'],
      tags: [['amenity', 'university'], ['amenity', 'college'], ['amenity', 'school']],
    },
    {
      keywords: ['manufacturing', 'factory', 'industrial', 'production', 'warehouse'],
      tags: [['industrial', 'factory'], ['man_made', 'works'], ['office', 'company']],
    },
    {
      keywords: ['architect', 'architecture'],
      tags: [['office', 'architect']],
    },
    {
      keywords: ['insurance'],
      tags: [['office', 'insurance']],
    },
    {
      keywords: ['advertising', 'marketing', 'agency', 'creative'],
      tags: [['office', 'advertising'], ['office', 'company']],
    },
    {
      keywords: ['engineering', 'engineer'],
      tags: [['office', 'engineer'], ['craft', 'engineering']],
    },
    {
      keywords: ['logistics', 'shipping', 'transport', 'freight', 'courier'],
      tags: [['office', 'logistics'], ['office', 'moving_company']],
    },
  ];

  // Find matching tags
  const matchedTags: OsmTag[] = [];
  const seenKeys = new Set<string>();

  for (const mapping of tagMappings) {
    if (mapping.keywords.some((kw) => q.includes(kw))) {
      for (const tag of mapping.tags) {
        const key = tag[0];
        if (!seenKeys.has(key)) {
          matchedTags.push(tag);
          seenKeys.add(key);
        }
      }
    }
  }

  // Default fallback: just look for companies/offices
  if (matchedTags.length === 0) {
    return [['office', 'company']];
  }

  return matchedTags;
}

// ─── 3. Build Overpass QL query ─────────────────────────────────────────────

function buildOverpassQuery(tags: OsmTag[][], bounds: GeoBounds, limit: number): string {
  const { south, west, north, east } = bounds;
  const statements: string[] = [];

  for (const [key, value] of tags) {
    // Search for nodes and ways
    statements.push(`node["${key}"="${value}"](${south},${west},${north},${east});`);
    statements.push(`way["${key}"="${value}"](${south},${west},${north},${east});`);
  }

  // Also search for nodes/ways with name that have relevant tags in the query
  return `[out:json][timeout:${OVERPASS_TIMEOUT}];
(
  ${statements.join('\n  ')}
);
out center ${limit};`;
}

// ─── 4. Execute Overpass query with failover ────────────────────────────────

async function executeOverpassQuery(query: string): Promise<OverpassElement[]> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: NOMINATIM_HEADERS,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        lastError = new Error(`Overpass API returned ${res.status}`);
        continue;
      }

      const data = await res.json();

      if (data.elements && Array.isArray(data.elements)) {
        return data.elements;
      }

      // Check for Overpass error remarks
      if (data.remark) {
        lastError = new Error(data.remark);
        continue;
      }

      return [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }

  throw lastError || new Error('All Overpass API endpoints failed');
}

// ─── 5. Parse Overpass results ──────────────────────────────────────────────

function parseOverpassResults(elements: OverpassElement[], query: string): BusinessResult[] {
  const results: BusinessResult[] = [];
  const q = query.toLowerCase();

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || '';
    if (!name) continue;

    // Skip generic entries without meaningful names
    if (name.length < 2) continue;

    // Get coordinates
    let lat: number | null = null;
    let lon: number | null = null;
    if (el.type === 'node' && el.lat != null && el.lon != null) {
      lat = el.lat;
      lon = el.lon;
    } else if (el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    }

    // Build address from OSM address tags
    const addrParts: string[] = [];
    const streetNumber = tags['addr:housenumber'] || '';
    const street = tags['addr:street'] || '';
    const city = tags['addr:city'] || tags['addr:town'] || tags['addr:suburb'] || '';
    const postcode = tags['addr:postcode'] || '';
    const state = tags['addr:state'] || '';
    const country = tags['addr:country'] || '';

    if (street) addrParts.push(`${streetNumber ? streetNumber + ' ' : ''}${street}`);
    if (city) addrParts.push(city);
    if (state) addrParts.push(state);
    if (postcode) addrParts.push(postcode);
    if (country) addrParts.push(country);

    const address = addrParts.length > 0 ? addrParts.join(', ') : '';

    // Get phone
    const phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || '';

    // Get website
    const website = tags.website || tags['contact:website'] || tags['url'] || '';

    // Build types from OSM tags
    const types: string[] = [];
    if (tags.office) types.push(tags.office);
    if (tags.amenity) types.push(tags.amenity);
    if (tags.shop) types.push(tags.shop);
    if (tags.industrial) types.push(tags.industrial);
    if (tags.tourism) types.push(tags.tourism);
    if (tags.craft) types.push(tags.craft);

    // Infer type from query
    if (types.length === 0) {
      types.push('business');
    }

    // Generate rating (OSM doesn't have ratings, but we can check for tags)
    let rating = 0;
    if (tags.stars) {
      const stars = parseFloat(tags.stars);
      if (!isNaN(stars) && stars > 0 && stars <= 5) {
        rating = stars;
      }
    }

    results.push({
      name,
      address,
      phone: phone || '',
      website: website || '',
      rating,
      types,
      lat,
      lon,
      source: 'openstreetmap',
      place_id: `osm-${el.type}-${el.id}`,
    });
  }

  return results;
}

// ─── 6. Filter results by query relevance ───────────────────────────────────

function filterByQueryRelevance(results: BusinessResult[], query: string): BusinessResult[] {
  const q = query.toLowerCase();
  const stopWords = new Set(['in', 'the', 'of', 'and', 'for', 'near', 'at', 'a', 'an']);
  const queryWords = q.split(/\s+/).filter((w) => !stopWords.has(w) && w.length > 1);

  if (queryWords.length === 0) return results;

  const scored = results.map((r) => {
    const nameLower = r.name.toLowerCase();
    const typesLower = r.types.join(' ').toLowerCase();
    let score = 0;

    // Check if name contains query words
    for (const word of queryWords) {
      if (nameLower.includes(word)) score += 2;
      if (typesLower.includes(word)) score += 3;
    }

    // Boost results that have websites (likely real businesses)
    if (r.website) score += 1;
    if (r.phone) score += 1;
    if (r.address) score += 0.5;

    return { result: r, score };
  });

  // Sort by relevance score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.result);
}

// ─── 7. Web search fallback using z-ai-web-dev-sdk ──────────────────────────

async function webSearchBusinesses(query: string, location: string): Promise<BusinessResult[]> {
  try {
    const ZAI = await import('z-ai-web-dev-sdk').then((m) => m.default || m.ZAI);
    const zai = await ZAI.create();

    const searchQuery = `${query} companies in ${location} directory list`;
    const searchResults = await zai.functions.invoke('web_search', {
      query: searchQuery,
      num: 20,
    });

    if (!searchResults || searchResults.length === 0) return [];

    return searchResults.map((r, i) => {
      // Try to extract company name from search result
      let name = r.name || '';
      // Clean up common suffixes from search result titles
      name = name.replace(/ - .*/, '').replace(/\|.*/, '').trim();

      // Extract domain as website
      const website = r.url || r.host_name ? `https://${r.host_name || r.url}` : '';

      return {
        name: name || `Company from search result ${i + 1}`,
        address: location,
        phone: '',
        website,
        rating: 0,
        types: [query.toLowerCase()],
        lat: null,
        lon: null,
        source: 'websearch' as const,
        place_id: `ws-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      };
    });
  } catch (err) {
    console.error('Web search fallback failed:', err);
    return [];
  }
}

// ─── 8. Deduplicate results by name ─────────────────────────────────────────

function deduplicateResults(results: BusinessResult[]): BusinessResult[] {
  const seen = new Map<string, BusinessResult>();

  for (const r of results) {
    const key = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) {
      // Merge data — prefer the entry with more data
      const existing = seen.get(key)!;
      if (r.address && !existing.address) existing.address = r.address;
      if (r.phone && !existing.phone) existing.phone = r.phone;
      if (r.website && !existing.website) existing.website = r.website;
      if (r.lat && !existing.lat) { existing.lat = r.lat; existing.lon = r.lon; }
      if (r.source === 'openstreetmap' && existing.source !== 'openstreetmap') {
        existing.source = 'openstreetmap';
        existing.place_id = r.place_id;
      }
    } else {
      seen.set(key, { ...r });
    }
  }

  return Array.from(seen.values());
}

// ─── Main API handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location } = body;

    if (!query || !location) {
      return NextResponse.json(
        { success: false, error: 'Query and location are required' },
        { status: 400 }
      );
    }

    const sourcesUsed: string[] = [];
    let allResults: BusinessResult[] = [];

    // ── Source 1: OpenStreetMap Overpass API (Primary) ────────────────────

    try {
      // Step 1: Geocode the location
      const geo = await geocodeLocation(location);

      // Step 2: Map query to OSM tags
      const tags = mapQueryToOsmTags(query);

      // Step 3: Build and execute Overpass query
      const overpassQuery = buildOverpassQuery(tags, geo.bounds, 50);
      const elements = await executeOverpassQuery(overpassQuery);

      // Step 4: Parse results
      const osmResults = parseOverpassResults(elements, query);

      // Step 5: Filter by relevance and sort
      const filtered = filterByQueryRelevance(osmResults, query);

      allResults.push(...filtered);
      sourcesUsed.push('openstreetmap');
    } catch (err) {
      console.error('OpenStreetMap search failed:', err);
      // Continue to web search fallback
    }

    // ── Source 2: Web Search (Fallback) ───────────────────────────────────

    // Always try web search to supplement results
    if (allResults.length < MAX_RESULTS) {
      try {
        const webResults = await webSearchBusinesses(query, location);
        if (webResults.length > 0) {
          allResults.push(...webResults);
          sourcesUsed.push('websearch');
        }
      } catch (err) {
        console.error('Web search fallback failed:', err);
      }
    }

    // ── Deduplicate and limit ─────────────────────────────────────────────

    const deduped = deduplicateResults(allResults);
    const finalResults = deduped.slice(0, MAX_RESULTS);

    if (finalResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No businesses found for "${query}" in "${location}". Try broadening your search or using a different location.`,
        sources_used: sourcesUsed,
      });
    }

    return NextResponse.json({
      success: true,
      results: finalResults.map((r) => ({
        name: r.name,
        address: r.address,
        phone: r.phone,
        website: r.website,
        rating: r.rating,
        types: r.types,
        lat: r.lat,
        lon: r.lon,
        source: r.source,
        place_id: r.place_id,
      })),
      count: finalResults.length,
      sources_used: sourcesUsed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Business search error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
