"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { canPreviewImport } from "@/modules/profile-imports/import-ui";

type List = { id: string; name: string; memberCount: number };
type Preview = {
  list: { name: string };
  summary: { newProfiles: number; existingProfiles: number; duplicateInputRows: number; invalidRows: number; membershipsAlreadyPresent: number };
  invalidRows: Array<{ row: number; reason: string }>;
  duplicateInputRows: Array<{ row: number; duplicateOfRow: number; profileUrl: string }>;
  records: Array<{ row: number; fullName: string; profileUrl?: string }>;
};

export default function ImportPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [listId, setListId] = useState("");
  const [mode, setMode] = useState<"urls" | "csv">("urls");
  const [content, setContent] = useState("");
  const [sourceSearchUrl, setSourceSearchUrl] = useState("");
  const [newListName, setNewListName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/lists").then(async (response) => {
      if (!response.ok) throw new Error("Unable to load lists");
      const result = await response.json();
      setLists(result.lists);
      if (result.lists[0]) setListId(result.lists[0].id);
    }).catch((error: Error) => setMessage(error.message));
  }, []);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 900_000) {
      setMessage("CSV files must be smaller than 900 KB.");
      return;
    }
    setMode("csv");
    file.text().then(setContent).catch(() => setMessage("The CSV file could not be read."));
  }

  async function createList() {
    const name = newListName.trim();
    if (!name) {
      setMessage("Enter a name for the destination list.");
      return;
    }

    setMessage("");
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to create list");
      const createdList: List = { ...result.list, memberCount: 0 };
      setLists((current) => [...current, createdList].sort((a, b) => a.name.localeCompare(b.name)));
      setListId(createdList.id);
      setNewListName("");
      setMessage(`Destination list “${createdList.name}” is ready.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create list");
    }
  }

  async function submit(action: "preview" | "import") {
    setMessage("");
    if (!content.trim()) {
      setMessage("Paste at least one profile URL or provide CSV content.");
      return;
    }
    if (!listId) {
      setMessage("Select a destination list before previewing this import.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(action === "preview" ? "/api/imports/preview" : "/api/imports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listId, mode, content, sourceSearchUrl: sourceSearchUrl || undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Import request failed");
      if (action === "preview") setPreview(result);
      else {
        setMessage(`Import complete: ${result.summary.profilesCreated} new profiles and ${result.summary.membershipsAdded} memberships added.`);
        setPreview(null);
        setContent("");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import request failed");
    } finally {
      setBusy(false);
    }
  }

  return <main className="shell import-shell">
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark">lw</div><div><p className="eyebrow">Personal operations</p><h1>Import profiles</h1></div></div><Link className="text-link" href="/">Back to workspace</Link></header>
    <section className="import-header"><div><p className="eyebrow accent">Phase 2</p><h2>Bring approved profiles into a list.</h2><p className="hero-copy">Paste individual profile URLs or upload an export. Nothing here visits LinkedIn or retrieves search results.</p></div><div className="privacy-note"><span>⌁</span><div><strong>Human-in-the-loop</strong><p>Search URLs are saved only as source metadata.</p></div></div></section>
    <section className="import-grid"><form className="panel import-form" onSubmit={(event) => { event.preventDefault(); void submit("preview"); }}>
      <div className="panel-heading"><div><p className="eyebrow">Import source</p><h3>Prepare records</h3></div></div>
      <label>Destination list<select value={listId} onChange={(event) => setListId(event.target.value)}><option value="">Select a list</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.name} · {list.memberCount} members</option>)}</select></label>
      <div className="create-list-form"><input aria-label="New destination list name" value={newListName} onChange={(event) => setNewListName(event.target.value)} placeholder="New list name" /><button type="button" onClick={() => void createList()}>Create list</button></div>
      <div className="mode-tabs" role="tablist"><button type="button" className={mode === "urls" ? "selected" : ""} onClick={() => setMode("urls")}>Pasted URLs</button><button type="button" className={mode === "csv" ? "selected" : ""} onClick={() => setMode("csv")}>CSV upload</button></div>
      {mode === "urls" ? <label>Profile URLs<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="https://www.linkedin.com/in/alex-example/&#10;https://www.linkedin.com/in/sam-example/" rows={8} required /></label> : <><label>CSV file<input type="file" accept=".csv,text/csv" onChange={selectFile} /></label><label>CSV preview content<textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="fullName,profileUrl,company" rows={8} required /></label></>}
      <label>LinkedIn people-search URL <span className="optional">optional metadata</span><input value={sourceSearchUrl} onChange={(event) => setSourceSearchUrl(event.target.value)} placeholder="https://www.linkedin.com/search/results/people/?keywords=design" /></label>
      <p className="field-hint">This URL is stored with the import run only. It is never fetched.</p>
      <button className="primary-button" type="submit" disabled={!canPreviewImport(content, busy)}>{busy ? "Working…" : "Preview import →"}</button>
      {!lists.length && <p className="field-hint">Create a profile list before importing. No list creation is performed automatically.</p>}
    </form><section className="panel preview-panel"><div className="panel-heading"><div><p className="eyebrow">Review first</p><h3>Import preview</h3></div>{preview && <span className="subtle-pill">{preview.list.name}</span>}</div>{!preview ? <div className="empty-preview"><span>◎</span><p>Your normalized records and duplicate checks will appear here.</p></div> : <><div className="summary-grid">{[["New profiles", preview.summary.newProfiles], ["Existing profiles", preview.summary.existingProfiles], ["Duplicate rows", preview.summary.duplicateInputRows], ["Invalid rows", preview.summary.invalidRows], ["Already in list", preview.summary.membershipsAlreadyPresent]].map(([label, value]) => <div className="summary-item" key={String(label)}><strong>{value}</strong><span>{label}</span></div>)}</div><div className="record-table">{preview.records.slice(0, 12).map((record) => <div className="record-row" key={`${record.row}-${record.profileUrl}`}><span>{record.row}</span><div><strong>{record.fullName}</strong><small>{record.profileUrl}</small></div></div>)}{preview.records.length > 12 && <p className="field-hint">Showing the first 12 records.</p>}</div>{(preview.invalidRows.length || preview.duplicateInputRows.length) ? <div className="issue-box"><strong>Review issues before importing</strong><p>{preview.invalidRows.length} invalid rows and {preview.duplicateInputRows.length} duplicate input rows will not be imported twice.</p></div> : null}<button className="primary-button" type="button" disabled={busy || !preview.records.length} onClick={() => void submit("import")}>Import reviewed records →</button></>}</section></section>
    {message && <p className="form-message" role="alert">{message}</p>}
  </main>;
}
