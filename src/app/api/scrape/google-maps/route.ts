import { NextRequest, NextResponse } from 'next/server';

interface GoogleMapsResult {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  types: string[];
  place_id: string;
}

// Mock data for when no API key is configured
function getMockResults(query: string, location: string): GoogleMapsResult[] {
  const companies = [
    { name: 'TechVenture Solutions', address: '123 Innovation Blvd, San Francisco, CA 94105', phone: '(415) 555-0123', website: 'https://techventure.io', rating: 4.5, types: ['software_company', 'technology'] },
    { name: 'DataFlow Analytics', address: '456 Data Drive, Austin, TX 78701', phone: '(512) 555-0456', website: 'https://dataflowanalytics.com', rating: 4.2, types: ['fintech', 'software_company'] },
    { name: 'CloudScale Systems', address: '789 Cloud Way, Seattle, WA 98101', phone: '(206) 555-0789', website: 'https://cloudscale.io', rating: 4.7, types: ['saas', 'cloud_computing'] },
    { name: 'FinanceHub Pro', address: '321 Wall Street, New York, NY 10005', phone: '(212) 555-0321', website: 'https://financehubpro.com', rating: 4.0, types: ['fintech', 'finance'] },
    { name: 'HealthTech Innovations', address: '654 Medical Center Dr, Boston, MA 02101', phone: '(617) 555-0654', website: 'https://healthtechinnovations.com', rating: 4.3, types: ['healthcare', 'technology'] },
    { name: 'RetailEdge Digital', address: '987 Commerce Blvd, Chicago, IL 60601', phone: '(312) 555-0987', website: 'https://retailedgedigital.com', rating: 3.9, types: ['ecommerce', 'retail'] },
    { name: 'ManufactureAI Corp', address: '147 Industrial Park, Detroit, MI 48201', phone: '(313) 555-0147', website: 'https://manufactureai.com', rating: 4.1, types: ['manufacturing', 'ai'] },
    { name: 'SupplyChain Dynamics', address: '258 Logistics Ave, Memphis, TN 38101', phone: '(901) 555-0258', website: 'https://supplychaindynamics.com', rating: 4.4, types: ['logistics', 'supply_chain'] },
    { name: 'EuroTech GmbH', address: 'Friedrichstraße 123, 10117 Berlin, Germany', phone: '+49 30 1234 567', website: 'https://eurotech.de', rating: 4.6, types: ['software_company', 'technology'] },
    { name: 'LondonFintech Ltd', address: '25 Canary Wharf, London E14 5AB, UK', phone: '+44 20 7946 0958', website: 'https://londonfintech.co.uk', rating: 4.3, types: ['fintech', 'finance'] },
    { name: 'ParisAI Solutions', address: '15 Rue de la Paix, 75002 Paris, France', phone: '+33 1 42 60 00 00', website: 'https://parisai.fr', rating: 4.1, types: ['ai', 'saas'] },
    { name: 'AmsterdamData BV', address: 'Herengracht 420, 1017 Amsterdam, Netherlands', phone: '+31 20 555 0123', website: 'https://amsterdamdata.nl', rating: 4.5, types: ['data_analytics', 'saas'] },
  ];

  // Filter based on query keywords for realistic results
  const q = query.toLowerCase();
  let filtered = companies;
  if (q.includes('fintech') || q.includes('finance')) {
    filtered = companies.filter((c) => c.types.some((t) => t.includes('fintech') || t.includes('finance')));
  } else if (q.includes('health') || q.includes('medical')) {
    filtered = companies.filter((c) => c.types.some((t) => t.includes('health')));
  } else if (q.includes('saas') || q.includes('software')) {
    filtered = companies.filter((c) => c.types.some((t) => t.includes('saas') || t.includes('software')));
  }

  // Filter by location
  const loc = location.toLowerCase();
  if (loc.includes('europe') || loc.includes('uk') || loc.includes('germany') || loc.includes('france') || loc.includes('netherlands') || loc.includes('london') || loc.includes('berlin') || loc.includes('paris') || loc.includes('amsterdam')) {
    filtered = filtered.filter((c) => c.address.includes('Germany') || c.address.includes('UK') || c.address.includes('France') || c.address.includes('Netherlands'));
  } else if (loc.includes('united states') || loc.includes('usa') || loc.includes('us')) {
    filtered = filtered.filter((c) => !c.address.includes('Germany') && !c.address.includes('UK') && !c.address.includes('France') && !c.address.includes('Netherlands'));
  }

  return filtered.map((c, i) => ({
    ...c,
    place_id: `mock-${i}-${Date.now()}`,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location } = body;

    if (!query || !location) {
      return NextResponse.json({ success: false, error: 'Query and location are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      // Real Google Places API call
      const searchQuery = `${query} in ${location}`;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return NextResponse.json({ success: false, error: `Google API error: ${data.status} - ${data.error_message || ''}` }, { status: 502 });
      }

      const results: GoogleMapsResult[] = (data.results || []).map((place: Record<string, unknown>) => ({
        name: String(place.name || ''),
        address: String(place.formatted_address || ''),
        phone: String(place.formatted_phone_number || ''),
        website: String(place.website || ''),
        rating: Number(place.rating) || 0,
        types: Array.isArray(place.types) ? place.types.map(String) : [],
        place_id: String(place.place_id || ''),
      }));

      return NextResponse.json({ success: true, results, count: results.length });
    }

    // No API key — use mock data
    const results = getMockResults(query, location);
    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      mock: true,
      notice: 'Using sample data. Add GOOGLE_PLACES_API_KEY to .env.local for real results.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
