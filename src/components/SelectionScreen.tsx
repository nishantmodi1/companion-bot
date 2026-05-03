import React, { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, getRolesByCategory, ROLES } from '../role/roles';
import type { RoleConfig } from '../types/types';
import PageLayout from './PageLayout';

/* ── Category metadata ─────────────────────────────────────── */
const CAT_META: Record<string, { icon: string; color: string; desc: string }> = {
  Partner:      { icon: '💑', color: '#e91e8c', desc: 'Romantic companions' },
  Family:       { icon: '🏡', color: '#f59e0b', desc: 'Your loved ones'      },
  Social:       { icon: '🤝', color: '#10b981', desc: 'Friends & peers'      },
  Professional: { icon: '💼', color: '#6366f1', desc: 'Career & growth'      },
  Wellness:     { icon: '🌿', color: '#06b6d4', desc: 'Health & mind'        },
};

/* ── CSS var injection for dynamic role colors ─────────────── */
const rv = (r: RoleConfig) =>
  ({ '--rc': r.color, '--rc1': r.g1, '--rc2': r.g2 } as React.CSSProperties);

/* ── Recent chats helpers ──────────────────────────────────── */
interface RecentEntry { roleId: string; userName: string; ts: number; }

function getRecent(): RecentEntry[] {
  try { return JSON.parse(localStorage.getItem('ynaRecent') || '[]'); }
  catch { return []; }
}

export function saveRecent(roleId: string, userName: string): void {
  const prev = getRecent().filter(r => !(r.roleId === roleId && r.userName === userName));
  localStorage.setItem(
    'ynaRecent',
    JSON.stringify([{ roleId, userName, ts: Date.now() }, ...prev].slice(0, 5)),
  );
}

/** Remove a single recent entry */
function clearOneRecent(roleId: string, userName: string): void {
  const updated = getRecent().filter(r => !(r.roleId === roleId && r.userName === userName));
  localStorage.setItem('ynaRecent', JSON.stringify(updated));
}

/** Remove all recent entries */
function clearAllRecent(): void {
  localStorage.removeItem('ynaRecent');
}

/* ── Component ─────────────────────────────────────────────── */
const SelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const gridRef  = useRef<HTMLDivElement>(null);

  const [selected,  setSelected]  = useState<RoleConfig | null>(null);
  const [name,      setName]      = useState('');
  const [activeTab, setActiveTab] = useState(CATEGORIES[0] ?? 'Partner');
  const [nameErr,   setNameErr]   = useState(false);
  const [search,    setSearch]    = useState('');
  // local state so UI re-renders immediately on clear
  const [recent,    setRecent]    = useState<RecentEntry[]>(getRecent);

  const canStart = !!selected && name.trim().length > 0;

  const searchResults = search.trim()
    ? ROLES.filter(r =>
        r.label.toLowerCase().includes(search.toLowerCase())    ||
        r.tagline.toLowerCase().includes(search.toLowerCase())  ||
        r.category.toLowerCase().includes(search.toLowerCase()))
    : null;

  const displayRoles = searchResults ?? getRolesByCategory(activeTab);
  const catMeta      = CAT_META[activeTab] ?? { icon: '●', color: '#7c3aed', desc: '' };

  const start = () => {
    if (!name.trim()) { setNameErr(true); return; }
    if (!selected) return;
    saveRecent(selected.id, name.trim());
    navigate(`/chat/${selected.id}`, { state: { userName: name.trim(), roleId: selected.id } });
  };

  /* Wrappers that also update local state so UI refreshes instantly */
  const handleClearOne = (roleId: string, userName: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    clearOneRecent(roleId, userName);
    setRecent(getRecent());
  };

  const handleClearAll = () => {
    clearAllRecent();
    setRecent([]);
  };

  return (
    <PageLayout>
      <div className="flex flex-col" style={{ height: '99dvh', border: '1px solid rgba(120,40,220,0.3)', borderRadius:'12px', }}>

        {/* ══════════════════════════
            HERO
        ══════════════════════════ */}
        <header className="text-center px-6 pt-9 pb-6 relative">
          {/* Halo glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full"
            style={{ width: 200, height: 150,
              background: 'radial-gradient(circle,rgba(120,40,220,0.3) 0%,transparent 70%)',
              filter: 'blur(28px)' }}
          />

          {/* Logo */}
          <div
            className="anim-float relative inline-flex items-center justify-center rounded-2xl mb-2"
            style={{ width: 50, height: 50,
              background: 'linear-gradient(135deg,#7000eee 0%,#ec8e0 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.16) inset, 0 12px 48px rgba(124,58,237,0.55)'
             }}
          >
            <span style={{ fontSize: 25 }}>💞</span>
          </div>

          <h5
            className="text-white font-bold leading-tight mb-1"
            style={{ fontSize: 'clamp(20px,3vw,28px)',
              letterSpacing: '-0.02em',
              textShadow: '0 0 50px rgba(139,92,246,0.55)' }}
          >
            You're Not Alone
          </h5>
          <p className="mb-5 mx-auto text-center leading-relaxed"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
            Connect with the people who matter most — any time, any place
          </p>

          {/* Stats pill */}
          {/* <div className="inline-flex items-center rounded-full px-5 py-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            {[['13+', 'companions'], ['∞', 'chats'], ['0₹', 'cost']].map(([n, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <span className="mx-4 block" style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)' }} />}
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                  <span className="text-white font-bold">{n}</span> {l}
                </span>
              </React.Fragment>
            ))}
          </div> */}
        </header>

        {/* ══════════════════════════
            RECENT CHATS
        ══════════════════════════ */}
        {recent.length > 0 && !search && (
          <div className="px-5 pb-3">

            {/* Row header with Clear All */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="uppercase tracking-widest font-bold"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>
                Recent
              </p>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all"
                style={{
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.85)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248,113,113,0.25)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear all
              </button>
            </div>

            {/* Recent cards */}
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {recent.map(r => {
                const role = ROLES.find(ro => ro.id === r.roleId);
                if (!role) return null;
                return (
                  <div
                    key={`${r.roleId}-${r.userName}`}
                    className="relative group"
                    style={{ minWidth: 68 }}
                  >
                    {/* Main tap target */}
                    <button
                      onClick={() => navigate(`/chat/${role.id}`, {
                        state: { userName: r.userName, roleId: role.id },
                      })}
                      className="flex flex-col items-center gap-1.5 rounded-2xl w-full border-none"
                      style={{
                        padding: '10px 12px', cursor: 'pointer',
                        background: `linear-gradient(135deg,${role.g1}18,${role.g2}0d)`,
                        outline: `1px solid ${role.color}28`,
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                    >
                      {/* <div className="flex items-center justify-center rounded-2xl"
                        style={{ width: 42, height: 42, fontSize: 20,
                          background: `linear-gradient(135deg,${role.g1},${role.g2})`,
                          boxShadow: `0 4px 14px ${role.color}55` }}>
                        {role.emoji}
                      </div> */}
                      <span className="font-bold whitespace-nowrap"
                        style={{ fontSize: 10, color: role.color }}>{role.label}</span>
                      {/* <span className="whitespace-nowrap"
                        style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{r.userName}</span> */}
                    </button>

                    {/* ✕ per-item clear — appears on hover */}
                    <button
                      onClick={e => handleClearOne(r.roleId, r.userName, e)}
                      title="Remove"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                                 flex items-center justify-center
                                 opacity-0 group-hover:opacity-100
                                 transition-opacity duration-150"
                      style={{
                        fontSize: 9, fontWeight: 800, cursor: 'pointer',
                        background: 'rgba(248,113,113,0.92)',
                        color: '#fff',
                        border: '1.5px solid #07071a',
                        boxShadow: '0 2px 8px rgba(248,113,113,0.5)',
                        lineHeight: 1,
                        zIndex: 10,
                      }}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            SEARCH BAR
        ══════════════════════════ */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2.5 rounded-2xl px-4"
            style={{
              height: 44,
              background: 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${search ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'border-color 0.2s ease',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              placeholder="Search companions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-medium"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="border-none bg-transparent"
                style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, cursor: 'pointer', padding: 0 }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════
            CATEGORY TABS
        ══════════════════════════ */}
        {!search && (
          <nav className="px-5 pb-3 overflow-x-auto no-scrollbar"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-2" style={{ width: 'max-content' }}>
              {CATEGORIES.map(cat => {
                const m  = CAT_META[cat] ?? { icon: '●', color: '#7c3aed', desc: '' };
                const on = activeTab === cat;
                return (
                  <button key={cat}
                    className="tab-btn flex items-center gap-2 rounded-2xl font-semibold border-none"
                    style={{
                      padding: '9px 16px', fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer',
                      background: on ? `linear-gradient(135deg,${m.color}28,${m.color}14)` : 'rgba(255,255,255,0.045)',
                      color: on ? m.color : 'rgba(255,255,255,0.38)',
                      outline: `1.5px solid ${on ? m.color + '55' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: on ? `0 0 20px ${m.color}22, inset 0 1px 0 rgba(255,255,255,0.08)` : 'none',
                    }}
                    onClick={() => {
                      setActiveTab(cat);
                      setSearch('');
                      gridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{m.icon}</span>
                    <span>{cat}</span>
                    <span className="font-bold rounded-full px-1.5 py-0.5"
                      style={{
                        fontSize: 9,
                        background: on ? `${m.color}30` : 'rgba(255,255,255,0.08)',
                        color: on ? m.color : 'rgba(255,255,255,0.3)',
                      }}>
                      {getRolesByCategory(cat).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* ══════════════════════════
            ROLE GRID
        ══════════════════════════ */}
        <div ref={gridRef} className="flex-1 overflow-y-auto px-3 sm:px-5 pt-1 pb-1">

          {/* Section label */}
          {!search ? (
            <div className="anim-fade-up flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center rounded-xl"
                style={{ width: 34, height: 34, fontSize: 18,
                  background: `${catMeta.color}1e`,
                  border: `1px solid ${catMeta.color}2e` }}>
                {catMeta.icon}
              </div>
              <div>
                <p className="font-bold leading-tight"
                  style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>{activeTab}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                  {catMeta.desc} · {displayRoles.length} available
                </p>
              </div>
              {selected && (
                <button onClick={() => setSelected(null)} className="ml-auto rounded-xl font-semibold"
                  style={{
                    fontSize: 11, padding: '5px 12px', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}>
                  Clear ✕
                </button>
              )}
            </div>
          ) : (
            <p className="anim-fade-up mb-4 font-semibold"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              {displayRoles.length} result{displayRoles.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}

          {/* Empty state */}
          {displayRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4">
              <span style={{ fontSize: 32, marginBottom: 8 }}>🔍</span>
              <p className="font-semibold" style={{ fontSize: 18, color: 'rgba(255,255,255,0.38)' }}>
                No companions found
              </p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(138px,1fr))]
              gap-3
              sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]
              sm:gap-3.5
              md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]
              md:gap-4
            " style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(138px,1fr))', gap: '12px',           
            }}>
              {displayRoles.map((r, i) => {
                const on = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    className="role-card relative text-center rounded-3xl border-none transition-all duration-200 hover:scale-105"
                    style={{
                      padding: 'clamp(12px, 4vw, 20px) clamp(10px, 3vw, 14px)',
                      cursor: 'pointer',
                      background: on ? `linear-gradient(145deg,${r.g1}28,${r.g2}18)` : 'rgba(255,255,255,0.045)',
                      outline: `1.5px solid ${on ? r.color + 'bb' : 'rgba(255,255,255,0.09)'}`,
                      boxShadow: on ? `0 8px 36px ${r.color}30, 0 0 0 1px ${r.color}22 inset` : 'none',
                      animationDelay: `${i * 35}ms`,
                    }}
                    onClick={() => setSelected(on ? null : r)}
                  >
                    {on && (
                      <div className="anim-fade-up absolute flex items-center justify-center rounded-full font-black text-white"
                        style={{ top: 9, right: 9, width: 20, height: 20, fontSize: 9,
                          background: r.color, boxShadow: `0 2px 12px ${r.color}90` }}>
                        ✓
                      </div>
                    )}
                    {search && (
                      <div className="absolute font-bold rounded-full"
                        style={{ top: 9, left: 9, fontSize: 8, padding: '2px 6px',
                          background: `${CAT_META[r.category]?.color ?? '#7c3aed'}22`,
                          color: CAT_META[r.category]?.color ?? '#7c3aed',
                          border: `1px solid ${CAT_META[r.category]?.color ?? '#7c3aed'}33` }}>
                        {r.category}
                      </div>
                    )}
                    <div style={{
                      fontSize: 'clamp(28px, 6vw, 34px)', marginBottom: 10, display: 'inline-block',
                      filter: on ? `drop-shadow(0 0 14px ${r.color}90)` : 'none',
                      animation: on ? 'heartbeat 2.5s ease-in-out infinite' : 'none',
                    }}>
                      {r.emoji}
                    </div>
                    <p className="font-bold leading-tight mb-1"
                      style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: on ? r.color : 'rgba(255,255,255,0.88)' }}>
                      {r.label}
                    </p>
                    <p style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', lineHeight: 1.4,
                      color: on ? `${r.color}aa` : 'rgba(255,255,255,0.3)' }}>
                      {r.tagline}
                    </p>
                    {on && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-3xl"
                        style={{ background: `linear-gradient(90deg,transparent,${r.color},transparent)` }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════
            FOOTER — name input + CTA
        ══════════════════════════ */}
        <footer className=" px-3 sm:px-5 pt-4 pb-6 sticky bottom-0 z-10"
          style={{
            // background: 'rgba(7,7,26,0.94)',
            // backdropFilter: 'blur(28px)',
            // borderTop: '1px solid rgba(255,255,255,0.07)',
            borderRadius:'12px',
            // boxShadow: '0 -28px 60px rgba(0,0,0,0.55)',
            // background:'red'
          }}>

          {/* Selected preview / placeholder */}
          {selected ? (
            <div className="anim-fade-up flex items-center gap-2 sm:gap-3 rounded-2xl mb-4"
              style={{
                padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 14px)',
                background: `linear-gradient(135deg,${selected.g1}18,${selected.g2}0d)`,
                border: `1px solid ${selected.color}2e`,
              }}>
              <div className="flex items-center justify-center rounded-2xl"
                style={{
                  width: 'clamp(40px, 8vw, 46px)', 
                  height: 'clamp(40px, 8vw, 46px)', 
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  background: `linear-gradient(135deg,${selected.g1},${selected.g2})`,
                  boxShadow: `0 4px 18px ${selected.color}55` }}>
                {selected.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold leading-tight"
                  style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', color: selected.color }}>{selected.label}</p>
                <p style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>{selected.tagline}</p>
              </div>
              <span className="font-bold rounded-xl"
                style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', 
                  padding: '4px 8px sm:5px 10px',
                  background: `${selected.color}22`, color: selected.color,
                  border: `1px solid ${selected.color}33` }}>
                {selected.category}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-2xl mb-2 px-3 py-3 sm:p-3"
              style={{ padding: '8px 10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px dashed rgba(255,255,255,0.09)' }}>
              <div className="anim-shimmer rounded-2xl" style={{ width: 46, height: 46 }} />
              <p style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' }}>
                ↑ Select a companion above to continue
              </p>
            </div>
          )}

          {/* Name + CTA */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                placeholder="Your name..."
                value={name}
                maxLength={20}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setName(e.target.value);
                  setNameErr(false);
                }}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') start();
                }}
                className="w-full rounded-2xl font-medium outline-none"
                style={{
                  padding: 'clamp(11px, 3.5vw, 13px) 36px clamp(11px, 3.5vw, 13px) 16px',
          fontSize: 'clamp(13px, 3.5vw, 14px)',
                  background: 'rgba(255,255,255,0.07)',
                  border: `1.5px solid ${
                    nameErr ? 'rgba(248,113,113,0.7)'
                    : name && selected ? `${selected.color}80`
                    : 'rgba(255,255,255,0.1)'}`,
                  color: '#fff',
                  boxShadow: name && selected ? `0 0 0 3px ${selected.color}12` : 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              />
              {name && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 'clamp(8px, 2.5vw, 9px)', color: 'rgba(255,255,255,0.18)' }}>
                  {name.length}/20
                </span>
              )}
            </div>

            <button
              disabled={!canStart}
              onClick={start}
              className="rounded-2xl font-bold whitespace-nowrap btn-press"
              style={{
                padding: 'clamp(11px, 3.5vw, 13px) clamp(16px, 5vw, 26px)',
        fontSize: 'clamp(13px, 3.5vw, 14px)', border: 'none',
                background: canStart && selected
                  ? `linear-gradient(135deg,${selected.g1},${selected.g2})`
                  : 'rgba(255,255,255,0.07)',
                color: canStart ? '#fff' : 'rgba(255,255,255,0.2)',
                boxShadow: canStart && selected
                  ? `0 6px 26px ${selected.color}52, inset 0 1px 0 rgba(255,255,255,0.18)`
                  : 'none',
                outline: canStart && selected
                  ? `1px solid ${selected.color}66`
                  : '1px solid rgba(255,255,255,0.08)',
                cursor: canStart ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
            >
              Start →
            </button>
          </div>

          {nameErr && (
            <p className="anim-fade-up mt-2 ml-1"
              style={{ fontSize: 12, color: '#f87171' }}>
              Please enter your name to start 😊
            </p>
          )}
        </footer>
      </div>
    </PageLayout>
  );
};

export default SelectionScreen;