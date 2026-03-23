"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Tab = "performances" | "video_candidates" | "watch_sources" | "pipeline_runs" | "suggestions";

const DATA_TABS: { key: Tab; label: string }[] = [
  { key: "performances", label: "Performances" },
  { key: "video_candidates", label: "Video Candidates" },
  { key: "watch_sources", label: "Watch Sources" },
  { key: "pipeline_runs", label: "Pipeline Runs" },
];

const STREAMING_PLATFORMS = [
  "", "Apple TV+", "Netflix", "Amazon Prime Video", "Disney+",
  "HBO Max", "Max", "Hulu", "Peacock", "Paramount+", "BBC iPlayer",
  "Qello Concerts by Stingray Amazon Channel", "YouTube Premium", "Spotify", "Apple Music",
  "Tubi", "Pluto TV", "Crackle", "Other",
];

type Suggestion = {
  id: number;
  performance_id: string;
  tmdb_id: number;
  tmdb_title: string;
  media_type: string;
  platform: string;
  access_type: string;
  tmdb_url: string;
  status: string;
  suggestion_type: string;  // "match" or "new_performance"
  matched_artist: string;
  created_at: string;
  // joined from performances
  artist_name?: string;
  event_name?: string;
};

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("performances");
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    performances: 0,
    video_candidates: 0,
    watch_sources: 0,
    pipeline_runs: 0,
    suggestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit paywall modal state
  const [editingPerf, setEditingPerf] = useState<Record<string, unknown> | null>(null);
  const [editPlatform, setEditPlatform] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [approveModal, setApproveModal] = useState<Suggestion | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [timestampStart, setTimestampStart] = useState("");
  const [timestampEnd, setTimestampEnd] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [sourceStatus, setSourceStatus] = useState("verified");

  // Quick-add performance
  const [showAddPerf, setShowAddPerf] = useState(false);
  const [addArtist, setAddArtist] = useState("");
  const [addEvent, setAddEvent] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addPlatform, setAddPlatform] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addSourceStatus, setAddSourceStatus] = useState("verified");

  // Fetch counts for all tables on mount
  useEffect(() => {
    async function fetchCounts() {
      const newCounts: Record<string, number> = {};
      for (const t of DATA_TABS) {
        const { count, error } = await supabase
          .from(t.key)
          .select("*", { count: "exact", head: true });
        newCounts[t.key] = !error && count !== null ? count : 0;
      }
      // Pending suggestions count
      const { count: sugCount } = await supabase
        .from("streaming_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      newCounts["suggestions"] = sugCount ?? 0;
      setCounts(newCounts);
    }
    fetchCounts();
  }, []);

  // Fetch data when a data tab changes
  useEffect(() => {
    if (tab === "suggestions") return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      const orderCol = tab === "pipeline_runs" ? "started_at" : "created_at";

      const { data: rows, error: err } = await supabase
        .from(tab)
        .select("*")
        .order(orderCol, { ascending: false })
        .limit(100)
        .returns<Record<string, unknown>[]>();

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData(rows || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [tab]);

  // Fetch suggestions when that tab is active
  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    const { data: rows } = await supabase
      .from("streaming_suggestions")
      .select("*, performances(artist_name, event_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);

    if (rows) {
      setSuggestions(
        rows.map((r: Record<string, unknown>) => {
          const perf = r.performances as Record<string, string> | null;
          return {
            ...r,
            artist_name: perf?.artist_name ?? "",
            event_name: perf?.event_name ?? "",
          } as Suggestion;
        })
      );
    }
    setSuggestionsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "suggestions") fetchSuggestions();
  }, [tab, fetchSuggestions]);

  // Open the approve modal to optionally provide a custom URL
  function openApproveModal(s: Suggestion) {
    setApproveModal(s);
    setCustomUrl("");
    setCustomTitle(s.tmdb_title);
    setIsEmbedded(false);
    setTimestampStart("");
    setTimestampEnd("");
    setContextNote("");
    setSourceStatus("verified");
  }

  // Approve a suggestion: either mark existing performance or create a new one
  async function approveSuggestion(s: Suggestion, overrideUrl?: string, title?: string) {
    setSaving(true);
    const watchUrl = overrideUrl || s.tmdb_url;
    const perfTitle = title || s.tmdb_title;

    if (s.suggestion_type === "new_performance") {
      // Create a new performance from this suggestion
      const newId = `tmdb-${s.tmdb_id}-${Date.now()}`;
      await supabase.from("performances").insert({
        id: newId,
        artist_name: s.matched_artist || s.artist_name || "",
        event_name: perfTitle,
        performance_type: "concert",
        has_watch_source: true,
        official_release_platform: s.platform,
        official_release_notes: `Added from TMDB: "${perfTitle}" on ${s.platform}`,
      });

      if (watchUrl) {
        await supabase.from("watch_sources").insert({
          performance_id: newId,
          platform: s.platform.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          url: watchUrl,
          is_official: true,
          requires_subscription: s.access_type === "flatrate",
          subscription_service: s.access_type === "flatrate" ? s.platform : "",
          is_embedded: isEmbedded,
          timestamp_start: timestampStart,
          timestamp_end: timestampEnd,
          context_note: contextNote,
          source_status: sourceStatus,
          added_by: "tmdb_suggestion",
        });
      }
    } else {
      // Match type: update existing performance
      const notes = `TMDB: "${s.tmdb_title}" on ${s.platform}`;
      await supabase
        .from("performances")
        .update({
          official_release_platform: s.platform,
          official_release_notes: notes,
        })
        .eq("id", s.performance_id);

      // Also add a watch source with the URL
      if (watchUrl) {
        await supabase.from("watch_sources").insert({
          performance_id: s.performance_id,
          platform: s.platform.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          url: watchUrl,
          is_official: true,
          requires_subscription: s.access_type === "flatrate",
          subscription_service: s.access_type === "flatrate" ? s.platform : "",
          is_embedded: isEmbedded,
          timestamp_start: timestampStart,
          timestamp_end: timestampEnd,
          context_note: contextNote,
          source_status: sourceStatus,
          added_by: "tmdb_suggestion",
        });
      }
    }

    // Mark suggestion as approved
    await supabase
      .from("streaming_suggestions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", s.id);

    setSaving(false);
    setApproveModal(null);
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    setCounts((prev) => ({ ...prev, suggestions: Math.max(0, prev.suggestions - 1) }));
  }

  // Reject a suggestion
  async function rejectSuggestion(s: Suggestion) {
    await supabase
      .from("streaming_suggestions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", s.id);

    setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    setCounts((prev) => ({ ...prev, suggestions: Math.max(0, prev.suggestions - 1) }));
  }

  // Save manual paywall edit
  async function saveOfficialRelease() {
    if (!editingPerf) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("performances")
      .update({
        official_release_platform: editPlatform,
        official_release_notes: editNotes,
      })
      .eq("id", editingPerf.id);
    setSaving(false);
    if (!err) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editingPerf.id
            ? { ...r, official_release_platform: editPlatform, official_release_notes: editNotes }
            : r
        )
      );
      setEditingPerf(null);
    }
  }

  function openEditRelease(row: Record<string, unknown>) {
    setEditingPerf(row);
    setEditPlatform((row.official_release_platform as string) || "");
    setEditNotes((row.official_release_notes as string) || "");
  }

  async function saveNewPerformance() {
    if (!addArtist.trim()) return;
    setAddSaving(true);
    const newId = `manual-${Date.now()}`;

    await supabase.from("performances").insert({
      id: newId,
      artist_name: addArtist.trim(),
      event_name: addEvent.trim() || null,
      performance_type: "concert",
      has_watch_source: !!addUrl,
      official_release_platform: addPlatform || "",
      official_release_notes: addNotes || "",
    });

    if (addUrl.trim()) {
      const platformSlug = addPlatform
        ? addPlatform.toLowerCase().replace(/[^a-z0-9]/g, "_")
        : "unknown";
      await supabase.from("watch_sources").insert({
        performance_id: newId,
        platform: platformSlug,
        url: addUrl.trim(),
        is_official: true,
        source_status: addSourceStatus,
        requires_subscription: !!addPlatform,
        subscription_service: addPlatform || "",
        added_by: "manual",
      });
    }

    setAddSaving(false);
    setShowAddPerf(false);
    setAddArtist("");
    setAddEvent("");
    setAddUrl("");
    setAddPlatform("");
    setAddNotes("");
    setAddSourceStatus("verified");

    // Refresh counts and data
    setCounts((prev) => ({
      ...prev,
      performances: prev.performances + 1,
      watch_sources: addUrl ? prev.watch_sources + 1 : prev.watch_sources,
    }));
    // Re-fetch current tab data
    const orderCol = tab === "pipeline_runs" ? "started_at" : "created_at";
    const { data: fresh } = await supabase
      .from(tab === "suggestions" ? "performances" : tab)
      .select("*")
      .order(orderCol, { ascending: false })
      .limit(100);
    if (fresh) setData(fresh);
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            LiveScore <span className="text-indigo-400">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Supabase data explorer &mdash; {Object.values(counts).reduce((a, b) => a + b, 0)} total rows
          </p>
        </div>
        <button
          onClick={() => setShowAddPerf(true)}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
        >
          + Add Performance
        </button>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 px-6 pt-4 flex-wrap">
        {DATA_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs text-gray-500">({counts[t.key]})</span>
          </button>
        ))}
        {/* Suggestions tab with highlight if pending */}
        <button
          onClick={() => setTab("suggestions")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            tab === "suggestions"
              ? "bg-gray-800 text-white"
              : counts.suggestions > 0
              ? "text-amber-300 hover:text-amber-200 hover:bg-gray-800/50"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
          }`}
        >
          Streaming Suggestions
          {counts.suggestions > 0 && (
            <span className="ml-2 text-xs bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">
              {counts.suggestions}
            </span>
          )}
          {counts.suggestions === 0 && (
            <span className="ml-2 text-xs text-gray-500">(0)</span>
          )}
        </button>
      </nav>

      {/* Content */}
      <main className="px-6 pb-6">
        <div className="bg-gray-800/50 rounded-b-lg rounded-tr-lg border border-gray-700 overflow-hidden">
          {tab === "suggestions" ? (
            // Suggestions review panel
            <SuggestionsPanel
              suggestions={suggestions}
              loading={suggestionsLoading}
              saving={saving}
              onApprove={openApproveModal}
              onReject={rejectSuggestion}
            />
          ) : loading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400 font-medium">Error connecting to Supabase</p>
              <p className="text-red-400/70 text-sm mt-2">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No data in <code className="text-gray-400">{tab}</code> table
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    {tab === "performances" && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    )}
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      {tab === "performances" && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openEditRelease(row)}
                            className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                          >
                            {row.official_release_platform ? "Edit" : "Mark"} Paywall
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-3 whitespace-nowrap max-w-xs truncate"
                        >
                          {renderCell(col, row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Approve with Custom URL Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold mb-1">
              {approveModal.suggestion_type === "new_performance" ? "Add Performance" : "Approve Match"}
            </h2>
            <p className="text-sm text-gray-400 mb-1">
              {approveModal.matched_artist || approveModal.artist_name} &mdash; &ldquo;{approveModal.tmdb_title}&rdquo;
            </p>
            <p className="text-sm text-purple-300 mb-4">
              {approveModal.platform} ({approveModal.access_type === "flatrate" ? "subscription" : approveModal.access_type})
            </p>

            <label className="block text-sm text-gray-400 mb-1">Performance Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-4 text-gray-100"
            />

            <label className="block text-sm text-gray-400 mb-1">Watch URL (optional)</label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Paste the direct link (e.g. Apple TV, Netflix, YouTube URL)"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-2 text-gray-100"
            />
            <p className="text-xs text-gray-500 mb-4">
              Leave blank to use the TMDB link. Paste a direct link to the actual content for best results.
            </p>

            <label className="block text-sm text-gray-400 mb-1">Source Status</label>
            <div className="flex gap-2 mb-4">
              {(["verified", "unverified", "unavailable"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSourceStatus(st)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    sourceStatus === st
                      ? st === "verified"
                        ? "bg-green-600 text-white"
                        : st === "unverified"
                        ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Embedded content toggle */}
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isEmbedded}
                onChange={(e) => setIsEmbedded(e.target.checked)}
                className="rounded border-gray-600 bg-gray-900 text-indigo-500"
              />
              <span className="text-sm text-gray-300">Performance is inside a movie/show (not standalone)</span>
            </label>

            {isEmbedded && (
              <div className="bg-gray-900/50 border border-gray-700 rounded p-3 mb-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Starts at</label>
                    <input
                      type="text"
                      value={timestampStart}
                      onChange={(e) => setTimestampStart(e.target.value)}
                      placeholder="e.g. 23:45"
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Ends at</label>
                    <input
                      type="text"
                      value={timestampEnd}
                      onChange={(e) => setTimestampEnd(e.target.value)}
                      placeholder="e.g. 31:20"
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Context note</label>
                  <input
                    type="text"
                    value={contextNote}
                    onChange={(e) => setContextNote(e.target.value)}
                    placeholder='e.g. "Lady Gaga live segment in A Carpool Karaoke Christmas"'
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-100"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => approveSuggestion(approveModal, customUrl || undefined, customTitle || undefined)}
                disabled={saving}
                className={`px-4 py-2 text-sm text-white rounded disabled:opacity-50 ${
                  approveModal.suggestion_type === "new_performance"
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "bg-green-600 hover:bg-green-500"
                }`}
              >
                {saving ? "Saving..." : approveModal.suggestion_type === "new_performance" ? "Add Performance" : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Performance Modal */}
      {showAddPerf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Add Performance</h2>

            <label className="block text-sm text-gray-400 mb-1">Artist *</label>
            <input
              type="text"
              value={addArtist}
              onChange={(e) => setAddArtist(e.target.value)}
              placeholder="e.g. Katy Perry"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-3 text-gray-100"
            />

            <label className="block text-sm text-gray-400 mb-1">Event / Title</label>
            <input
              type="text"
              value={addEvent}
              onChange={(e) => setAddEvent(e.target.value)}
              placeholder="e.g. Rock in Rio 2015"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-3 text-gray-100"
            />

            <label className="block text-sm text-gray-400 mb-1">Watch URL</label>
            <input
              type="text"
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-3 text-gray-100"
            />

            <label className="block text-sm text-gray-400 mb-1">Platform</label>
            <select
              value={addPlatform}
              onChange={(e) => setAddPlatform(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-3 text-gray-100"
            >
              {STREAMING_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p || "(none / free)"}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-400 mb-1">Source Status</label>
            <div className="flex gap-2 mb-3">
              {(["verified", "unverified"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAddSourceStatus(st)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    addSourceStatus === st
                      ? st === "verified"
                        ? "bg-green-600 text-white"
                        : "bg-yellow-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Any extra context"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-4 text-gray-100"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddPerf(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveNewPerformance}
                disabled={addSaving || !addArtist.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded disabled:opacity-50"
              >
                {addSaving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Official Release Modal */}
      {editingPerf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-1">Mark Official Release</h2>
            <p className="text-sm text-gray-400 mb-4">
              {String(editingPerf.artist_name)} &mdash; {String(editingPerf.event_name)}
            </p>

            <label className="block text-sm text-gray-400 mb-1">Platform</label>
            <select
              value={editPlatform}
              onChange={(e) => setEditPlatform(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-4 text-gray-100"
            >
              {STREAMING_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p || "(none \u2014 remove)"}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder='e.g. "Available as Homecoming on Netflix"'
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm mb-4 text-gray-100"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingPerf(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={saveOfficialRelease}
                disabled={saving}
                className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Suggestions Review Panel ──────────────────────────────────────────

function SuggestionsPanel({
  suggestions,
  loading,
  saving,
  onApprove,
  onReject,
}: {
  suggestions: Suggestion[];
  loading: boolean;
  saving: boolean;
  onApprove: (s: Suggestion) => void;
  onReject: (s: Suggestion) => void;
}) {
  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p>No pending suggestions.</p>
        <p className="text-sm mt-2 text-gray-600">
          Run <code className="text-gray-400">python check_streaming.py</code> to scan performances via TMDB.
        </p>
      </div>
    );
  }

  const matchSuggestions = suggestions.filter((s) => s.suggestion_type === "match");
  const newPerfSuggestions = suggestions.filter((s) => s.suggestion_type === "new_performance");

  return (
    <div>
      {/* Match suggestions */}
      {matchSuggestions.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-gray-800/80 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Event Matches ({matchSuggestions.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">These match an existing performance in your database</p>
          </div>
          <div className="divide-y divide-gray-700">
            {matchSuggestions.map((s) => (
              <SuggestionRow key={s.id} s={s} saving={saving} onApprove={onApprove} onReject={onReject} />
            ))}
          </div>
        </div>
      )}

      {/* New performance suggestions */}
      {newPerfSuggestions.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-indigo-900/30 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
              New Performances ({newPerfSuggestions.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Different events by the same artist &mdash; approving adds them to your database
            </p>
          </div>
          <div className="divide-y divide-gray-700">
            {newPerfSuggestions.map((s) => (
              <SuggestionRow key={s.id} s={s} saving={saving} onApprove={onApprove} onReject={onReject} isNew />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function SuggestionRow({
  s,
  saving,
  onApprove,
  onReject,
  isNew = false,
}: {
  s: Suggestion;
  saving: boolean;
  onApprove: (s: Suggestion) => void;
  onReject: (s: Suggestion) => void;
  isNew?: boolean;
}) {
  return (
    <div className="px-6 py-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        {isNew ? (
          <p className="font-medium text-gray-100">
            {s.matched_artist || s.artist_name}
            <span className="text-indigo-400 ml-2 text-xs font-normal">new performance</span>
          </p>
        ) : (
          <p className="font-medium text-gray-100">
            {s.artist_name} &mdash; {s.event_name}
          </p>
        )}
        <p className="text-sm text-gray-400 mt-1">
          {isNew ? "Found: " : "TMDB match: "}
          <span className="text-gray-200">&ldquo;{s.tmdb_title}&rdquo;</span>
          <span className="text-gray-500 ml-1">({s.media_type})</span>
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded ${
            s.access_type === "flatrate"
              ? "bg-amber-500/20 text-amber-300"
              : "bg-gray-700 text-gray-300"
          }`}>
            {s.access_type === "flatrate" ? "Subscription" : s.access_type}
          </span>
          <span className="text-sm text-purple-300">{s.platform}</span>
          {s.tmdb_url && (
            <a
              href={s.tmdb_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:underline"
            >
              View on TMDB
            </a>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0 pt-1">
        <button
          onClick={() => onApprove(s)}
          disabled={saving}
          className={`px-3 py-1.5 text-sm text-white rounded disabled:opacity-50 transition-colors ${
            isNew
              ? "bg-indigo-600 hover:bg-indigo-500"
              : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {isNew ? "Add Performance" : "Approve"}
        </button>
        <button
          onClick={() => onReject(s)}
          disabled={saving}
          className="px-3 py-1.5 text-sm bg-red-600/80 hover:bg-red-500 text-white rounded disabled:opacity-50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}


// ── Cell Renderer ─────────────────────────────────────────────────────

function renderCell(col: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-600">null</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-green-400" : "text-red-400"}>
        {value ? "true" : "false"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-600">[]</span>;
    return (
      <span className="flex gap-1 flex-wrap">
        {value.map((v, i) => (
          <span key={i} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
            {String(v)}
          </span>
        ))}
      </span>
    );
  }

  if (typeof value === "object") {
    return (
      <span className="text-yellow-400/70 font-mono text-xs">
        {JSON.stringify(value).slice(0, 80)}
      </span>
    );
  }

  if (typeof value === "string" && value.startsWith("https://")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-400 hover:underline"
      >
        {value.length > 50 ? value.slice(0, 50) + "..." : value}
      </a>
    );
  }

  if (col === "triage_action" || col === "review_decision") {
    const str = String(value);
    const color =
      str.includes("approve") ? "text-green-400" :
      str.includes("reject") ? "text-red-400" :
      str.includes("review") ? "text-yellow-400" :
      "text-gray-300";
    return <span className={color}>{str || "-"}</span>;
  }

  if (col === "performance_type") {
    return (
      <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded">
        {String(value)}
      </span>
    );
  }

  if (col === "official_release_platform" && value) {
    return (
      <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded inline-flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        {String(value)}
      </span>
    );
  }

  if (col === "subscription_service" && value) {
    return (
      <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded">
        {String(value)}
      </span>
    );
  }

  if (col === "requires_subscription") {
    return value ? (
      <span className="text-amber-400 inline-flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        paid
      </span>
    ) : (
      <span className="text-green-400">free</span>
    );
  }

  if (col === "source_status") {
    const st = String(value);
    const color =
      st === "verified" ? "bg-green-500/20 text-green-300" :
      st === "unverified" ? "bg-yellow-500/20 text-yellow-300" :
      st === "unavailable" ? "bg-red-500/20 text-red-300" :
      "bg-gray-700 text-gray-300";
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
        {st}
      </span>
    );
  }

  if (col === "is_embedded") {
    return value ? (
      <span className="text-amber-400 text-xs">embedded</span>
    ) : null;
  }

  if ((col === "context_note" || col === "timestamp_start" || col === "timestamp_end") && value) {
    return <span className="text-gray-300 text-xs">{String(value)}</span>;
  }

  const str = String(value);
  return str.length > 60 ? str.slice(0, 60) + "..." : str;
}
