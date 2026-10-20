import Link from "next/link";

const modules = [
  ["Profile imports", "CSV exports and provider adapters", "Foundation ready", "mint"],
  ["Lists", "Segment contacts for focused outreach", "Schema ready", "blue"],
  ["Workflow execution", "Human-in-the-loop steps and runs", "Planned", "purple"],
  ["Scheduling", "Time windows for manual tasks", "Planned", "amber"],
  ["LinkedIn integration", "Authorized APIs only", "Guardrailed", "rose"],
] as const;

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar"><div className="brand-lockup"><div className="brand-mark">lw</div><div><p className="eyebrow">Personal operations</p><h1>LinkedIn workflow</h1></div></div><div className="topbar-actions"><span className="status-dot"><span /> Single-user workspace</span><button className="avatar" aria-label="Open account menu">U</button></div></header>
      <section className="hero"><div><p className="eyebrow accent">Workspace overview</p><h2>Build a calmer, more intentional outreach system.</h2><p className="hero-copy">Bring your approved exports into one place, organize relationships into lists, and turn the next action into a clear manual task.</p></div><div className="hero-action"><span className="mini-label">Next up</span><strong>Import your first profile export</strong><Link className="primary-button" href="/import">Open imports <span>→</span></Link></div></section>
      <section className="metric-grid" aria-label="Workspace metrics"><article className="metric-card"><span className="metric-icon mint-icon">◎</span><div><p>Profiles</p><strong>0</strong><small>Ready to organize</small></div></article><article className="metric-card"><span className="metric-icon blue-icon">▤</span><div><p>Lists</p><strong>0</strong><small>Build your first segment</small></div></article><article className="metric-card"><span className="metric-icon amber-icon">◷</span><div><p>Manual tasks</p><strong>0</strong><small>Nothing waiting</small></div></article></section>
      <section className="content-grid"><div className="panel module-panel"><div className="panel-heading"><div><p className="eyebrow">System map</p><h3>Independent modules</h3></div><span className="subtle-pill">Phase 1</span></div><div className="module-list">{modules.map(([name, detail, status, tone]) => <div className="module-row" key={name}><span className={`module-icon ${tone}`} /><div><strong>{name}</strong><p>{detail}</p></div><span className="module-status">{status}</span><span className="chevron">›</span></div>)}</div></div><aside className="panel principle-panel"><p className="eyebrow accent">Operating principle</p><div className="quote-mark">“</div><blockquote>Automation should make the next human decision obvious—not pretend to be the person making it.</blockquote><div className="principle-footer"><span className="line" /><span>Human-in-the-loop by default</span></div></aside></section>
      <footer className="footer-note"><span className="lock">⌁</span> Provider access is opt-in and authorized. Unsupported LinkedIn actions become manual tasks.</footer>
    </main>
  );
}
