'use client';
import { useState } from 'react';
import { useMarketingStore } from '@/store/useMarketingStore';
import type { Lead } from '@/types/marketing';

type Tab = 'google-maps' | 'csv' | 'manual';

interface GoogleMapsResult {
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  types: string[];
  place_id: string;
}

export default function FindLeadsView() {
  const { addLeads, leads, projects } = useMarketingStore();
  const [activeTab, setActiveTab] = useState<Tab>('google-maps');

  // Google Maps state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleMapsResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [addingToPipeline, setAddingToPipeline] = useState(false);
  const [bulkContactName, setBulkContactName] = useState('');
  const [bulkContactTitle, setBulkContactTitle] = useState('');
  const [removedResults, setRemovedResults] = useState<Set<string>>(new Set());

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvColumnMap, setCsvColumnMap] = useState<Record<string, string>>({});
  const [csvStep, setCsvStep] = useState<'upload' | 'map' | 'confirm'>('upload');
  const [csvError, setCsvError] = useState('');

  // Manual state
  const [manualForm, setManualForm] = useState({
    name: '', title: '', company: '', email: '', phone: '', website: '',
    domain: '', industry: '', location: '', country: '', employeeCount: '',
  });
  const [selectedProduct, setSelectedProduct] = useState(projects[0]?.id || '');
  const [selectedChannel, setSelectedChannel] = useState<Lead['channel']>('email');

  // Google Maps search
  const handleGoogleSearch = async () => {
    if (!searchQuery || !searchLocation) return;
    setSearching(true);
    setSearchError('');
    setRemovedResults(new Set());
    try {
      const res = await fetch('/api/scrape/google-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, location: searchLocation }),
      });
      const data = await res.json();
      if (data.success && data.results) {
        setSearchResults(data.results);
      } else {
        setSearchError(data.error || 'Search failed');
      }
    } catch {
      setSearchError('Network error — could not reach search API');
    } finally {
      setSearching(false);
    }
  };

  const toggleResult = (placeId: string) => {
    const next = new Set(selectedResults);
    if (next.has(placeId)) next.delete(placeId);
    else next.add(placeId);
    setSelectedResults(next);
  };

  const addSelectedToPipeline = () => {
    setAddingToPipeline(true);
    const newLeads: Lead[] = searchResults
      .filter((r) => selectedResults.has(r.place_id))
      .map((r) => {
        const domain = r.website ? (() => {
          try { return new URL(r.website.startsWith('http') ? r.website : `https://${r.website}`).hostname; }
          catch { return r.website; }
        })() : '';
        return {
          id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: bulkContactName.trim() || '',
          title: bulkContactTitle.trim() || 'Decision Maker',
          company: r.name,
          email: '', phone: r.phone || '', website: r.website || '',
          domain, industry: (r.types || [])[0] || '', location: r.address || '',
          country: '', employeeCount: '', source: 'google_maps' as const,
          channel: 'email' as const, status: 'new' as const,
          productId: selectedProduct || null, nextAction: bulkContactName.trim() ? 'enrich' : 'add_name' as const,
          nextActionDate: new Date().toISOString(), emailSequenceStep: 0,
          linkedinStatus: 'none' as const, notes: `Found via Google Maps. Rating: ${r.rating}`,
          tags: ['google-maps'], createdAt: new Date().toISOString().split('T')[0],
          lastContactedAt: null, messageHistory: [],
        };
      });
    addLeads(newLeads);
    setAddingToPipeline(false);
    setSelectedResults(new Set());
    setSearchResults([]);
    setBulkContactName('');
    setBulkContactTitle('');
  };

  // CSV handling
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError('');
    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('file', file);
          return fd;
        })(),
      });
      const data = await res.json();
      if (data.success) {
        setCsvHeaders(data.headers);
        setCsvPreview(data.rows);
        setCsvFile(file);
        setCsvStep('map');
        // Auto-map common headers
        const autoMap: Record<string, string> = {};
        const headerLower = data.headers.map((h: string) => h.toLowerCase());
        const mappings: Record<string, string[]> = {
          name: ['name', 'full name', 'contact name', 'first name'],
          title: ['title', 'job title', 'position', 'role', 'job title'],
          company: ['company', 'company name', 'organization', 'org', 'account'],
          email: ['email', 'email address', 'e-mail', 'work email'],
          phone: ['phone', 'phone number', 'telephone', 'tel', 'mobile'],
          website: ['website', 'url', 'web', 'company website'],
          industry: ['industry', 'sector', 'vertical'],
          location: ['location', 'city', 'address', 'country', 'region'],
          employeeCount: ['employees', 'employee count', 'company size', 'size', 'headcount'],
        };
        for (const [field, aliases] of Object.entries(mappings)) {
          const idx = headerLower.findIndex((h) => aliases.some((a) => h.includes(a)));
          if (idx >= 0) autoMap[field] = data.headers[idx];
        }
        setCsvColumnMap(autoMap);
      } else {
        setCsvError(data.error || 'Failed to parse CSV');
      }
    } catch {
      setCsvError('Failed to upload CSV');
    }
  };

  const importCsv = () => {
    const newLeads: Lead[] = csvPreview.map((row) => {
      const getValue = (field: string) => {
        const header = csvColumnMap[field];
        if (!header) return '';
        const idx = csvHeaders.indexOf(header);
        return idx >= 0 ? (row[idx] || '').trim() : '';
      };
      const company = getValue('company');
      const domain = getValue('website') ? (() => {
        try { return new URL(getValue('website').startsWith('http') ? getValue('website') : `https://${getValue('website')}`).hostname; }
        catch { return getValue('website'); }
      })() : company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      return {
        id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: getValue('name'), title: getValue('title'), company,
        email: getValue('email'), phone: getValue('phone'), website: getValue('website'),
        domain, industry: getValue('industry'), location: getValue('location'),
        country: '', employeeCount: getValue('employeeCount'),
        source: 'csv_import' as const, channel: 'email' as const, status: 'new' as const,
        productId: selectedProduct || null, nextAction: 'enrich' as const,
        nextActionDate: new Date().toISOString(), emailSequenceStep: 0,
        linkedinStatus: 'none' as const, notes: 'Imported from CSV',
        tags: ['csv-import'], createdAt: new Date().toISOString().split('T')[0],
        lastContactedAt: null, messageHistory: [],
      };
    }).filter((l) => l.company);
    addLeads(newLeads);
    setCsvStep('upload');
    setCsvPreview([]);
    setCsvFile(null);
  };

  // Manual add
  const addManualLead = () => {
    if (!manualForm.name || !manualForm.company) return;
    addLeads([{
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...manualForm,
      country: manualForm.country || '',
      employeeCount: manualForm.employeeCount || '',
      source: 'manual', channel: selectedChannel, status: 'new',
      productId: selectedProduct || null, nextAction: manualForm.email ? 'email1' : 'enrich',
      nextActionDate: new Date().toISOString(), emailSequenceStep: 0,
      linkedinStatus: 'none', notes: '', tags: ['manual'],
      createdAt: new Date().toISOString().split('T')[0],
      lastContactedAt: null, messageHistory: [],
    }]);
    setManualForm({ name: '', title: '', company: '', email: '', phone: '', website: '', domain: '', industry: '', location: '', country: '', employeeCount: '' });
  };

  const removeResult = (placeId: string) => {
    const next = new Set(removedResults);
    next.add(placeId);
    setRemovedResults(next);
    const selNext = new Set(selectedResults);
    selNext.delete(placeId);
    setSelectedResults(selNext);
  };

  const visibleResults = searchResults.filter((r) => !removedResults.has(r.place_id));
  const existingDomains = new Set(leads.map((l) => l.domain));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-white">Find Leads</h1>
        <p className="text-xs text-zinc-500 mt-1">Search Google Maps, import CSV, or add leads manually.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['google-maps', '🔍 Google Maps'], ['csv', '📁 CSV Import'], ['manual', '✏️ Manual Add']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#141414] text-zinc-500 border border-[#1f1f1f] hover:text-zinc-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Google Maps Tab */}
      {activeTab === 'google-maps' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Search Companies on Google Maps</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='Category (e.g. "software company", "fintech startup")'
                className="col-span-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
              <input value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder='Location (e.g. "New York, USA")'
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleGoogleSearch} disabled={searching || !searchQuery || !searchLocation}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
                {searching ? '⏳ Searching...' : '🔍 Search'}
              </button>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
                <option value="">No product</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
              </select>
            </div>
            {searchError && <p className="text-xs text-red-400 mt-2">{searchError}</p>}
          </div>

          {/* Results */}
          {visibleResults.length > 0 && (
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{visibleResults.length} results found</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Select companies and optionally set a contact name</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedResults(new Set(visibleResults.map((r) => r.place_id)))}
                    className="px-3 py-1 rounded-lg bg-[#0f0f0f] text-[10px] text-zinc-500 hover:text-white border border-[#2a2a2a] transition-colors">
                    Select All
                  </button>
                </div>
              </div>

              {/* Bulk contact name + title */}
              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                <div>
                  <p className="text-[10px] font-bold text-amber-400 mb-1">Contact Name (applies to all)</p>
                  <input value={bulkContactName} onChange={(e) => setBulkContactName(e.target.value)} placeholder='e.g. "Sarah Chen" (leave blank if different per company)'
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/40" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-400 mb-1">Title / Role</p>
                  <input value={bulkContactTitle} onChange={(e) => setBulkContactTitle(e.target.value)} placeholder='e.g. "CFO" or "VP Operations"'
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/40" />
                </div>
                <div className="flex items-end">
                  <button onClick={addSelectedToPipeline} disabled={addingToPipeline || selectedResults.size === 0}
                    className="w-full px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
                    {addingToPipeline ? '⏳ Adding...' : `+ Add ${selectedResults.size} to Pipeline`}
                  </button>
                </div>
              </div>
              {!bulkContactName && (
                <p className="text-[9px] text-amber-400/70 mb-3 -mt-2">Tip: Set a contact name now so emails can be generated. You can also add names later in Enrich.</p>
              )}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {visibleResults.map((result) => {
                  const isSelected = selectedResults.has(result.place_id);
                  const domain = result.website ? (() => {
                    try { return new URL(result.website.startsWith('http') ? result.website : `https://${result.website}`).hostname; }
                    catch { return ''; }
                  })() : '';
                  const exists = domain ? existingDomains.has(domain) : false;
                  return (
                    <div key={result.place_id}
                      className={`flex items-center gap-3 bg-[#0f0f0f] border rounded-lg p-3 transition-all ${
                        exists ? 'border-zinc-800 opacity-50 cursor-not-allowed' : isSelected ? 'border-emerald-500/30 bg-emerald-500/5 cursor-pointer' : 'border-[#1f1f1f] hover:border-[#2a2a2a] cursor-pointer'
                      }`}>
                      {!exists && (
                        <div onClick={() => toggleResult(result.place_id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`}>
                          {isSelected && <span className="text-[10px] text-black font-bold">✓</span>}
                        </div>
                      )}
                      <div className="flex-1 min-w-0" onClick={() => !exists && toggleResult(result.place_id)}>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{result.name}</p>
                          {result.rating > 0 && <span className="text-[9px] text-amber-400">★ {result.rating}</span>}
                          {exists && <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">Already added</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{result.address}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {result.phone && <span className="text-[10px] text-zinc-500">{result.phone}</span>}
                        {domain && <span className="text-[10px] text-emerald-400">{domain}</span>}
                        {result.website && (
                          <a href={result.website.startsWith('http') ? result.website : `https://${result.website}`} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors">🔗</a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeResult(result.place_id); }}
                          className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors px-1" title="Remove this result">
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Import Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
            {csvStep === 'upload' && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Upload CSV File</h3>
                <p className="text-xs text-zinc-500 mb-4">Import leads from Expleo or other CRM exports. Supports columns: Name, Title, Company, Email, Phone, Website, Industry, Location.</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#2a2a2a] rounded-xl p-10 cursor-pointer hover:border-emerald-500/30 transition-colors">
                  <span className="text-2xl mb-2">📁</span>
                  <span className="text-sm text-zinc-400 font-medium">Click to upload CSV</span>
                  <span className="text-[10px] text-zinc-600 mt-1">.csv, .tsv files supported</span>
                  <input type="file" accept=".csv,.tsv,.txt" onChange={handleCsvUpload} className="hidden" />
                </label>
                {csvError && <p className="text-xs text-red-400 mt-3">{csvError}</p>}
              </div>
            )}

            {csvStep === 'map' && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Map CSV Columns</h3>
                <p className="text-xs text-zinc-500 mb-4">{csvPreview.length} rows found. Map CSV columns to lead fields.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {['name', 'title', 'company', 'email', 'phone', 'website', 'industry', 'location', 'employeeCount'].map((field) => (
                    <div key={field} className="flex items-center gap-3">
                      <label className="w-28 text-[11px] text-zinc-400 font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <select value={csvColumnMap[field] || ''} onChange={(e) => setCsvColumnMap({ ...csvColumnMap, [field]: e.target.value })}
                        className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
                        <option value="">— Skip —</option>
                        {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {/* Preview */}
                <div className="mb-4">
                  <p className="text-[10px] text-zinc-600 mb-2">Preview (first 3 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="text-zinc-500 border-b border-[#1f1f1f]">
                          {csvHeaders.map((h) => <th key={h} className="text-left px-2 py-1 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 3).map((row, i) => (
                          <tr key={i} className="text-zinc-400 border-b border-[#0f0f0f]">
                            {row.map((cell, j) => <td key={j} className="px-2 py-1 truncate max-w-[150px]">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCsvStep('upload'); setCsvPreview([]); setCsvFile(null); }}
                    className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors">
                    Back
                  </button>
                  <button onClick={importCsv}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-black hover:bg-emerald-400 transition-colors">
                    + Import {csvPreview.length} Leads
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Add Tab */}
      {activeTab === 'manual' && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Add Lead Manually</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { key: 'name', placeholder: 'Name *', span: 1 },
              { key: 'title', placeholder: 'Title (e.g. CFO, VP Operations)', span: 1 },
              { key: 'company', placeholder: 'Company *', span: 1 },
              { key: 'email', placeholder: 'Email address', span: 1 },
              { key: 'phone', placeholder: 'Phone number', span: 1 },
              { key: 'website', placeholder: 'Website URL', span: 1 },
              { key: 'industry', placeholder: 'Industry', span: 1 },
              { key: 'location', placeholder: 'Location (City, Country)', span: 1 },
              { key: 'employeeCount', placeholder: 'Employee count (e.g. 200-500)', span: 1 },
            ].map((f) => (
              <input key={f.key} value={(manualForm as Record<string, string>)[f.key]} onChange={(e) => setManualForm({ ...manualForm, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className={`bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 ${f.span === 2 ? 'col-span-2' : ''}`} />
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value as Lead['channel'])}
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
              <option value="email">📧 Email</option>
              <option value="linkedin">💼 LinkedIn</option>
              <option value="phone">📞 Phone</option>
            </select>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40">
              <option value="">No product</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
            </select>
          </div>
          <button onClick={addManualLead} disabled={!manualForm.name || !manualForm.company}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50">
            + Add Lead
          </button>
        </div>
      )}
    </div>
  );
}
