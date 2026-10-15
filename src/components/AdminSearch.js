import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/axios';
import { Avatar, LOCATION_STATUS, PUNCH_STATUS, agoText, handOff } from './monitoringShared';

const CACHE_MS = 30000;

/**
 * Admin header search: find an employee by name, ID, department or phone and jump
 * straight to their live position, activity or the monitor. Ctrl+K focuses it.
 * onNavigate(tab) opens an admin tab; canOpen(tab) hides what the user may not open.
 */
const AdminSearch = ({ onNavigate, canOpen }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const loadedAt = useRef(0);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    if (Date.now() - loadedAt.current < CACHE_MS) return;
    setLoading(true);
    try {
      const res = await api.get('/monitoring/employees', { headers: { 'x-silent': '1' } });
      setRows(res.data?.data || []);
      loadedAt.current = Date.now();
    } catch (error) {
      // Search simply shows no results when the list cannot be loaded.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (inputRef.current) inputRef.current.focus();
      }
    };
    const onClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return rows
      .filter((row) => [row.name, row.employeeId, row.department, row.position, row.phone].some((v) => String(v || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        const starts = (row) => (String(row.name).toLowerCase().startsWith(q) || String(row.employeeId).toLowerCase().startsWith(q) ? 0 : 1);
        return starts(a) - starts(b) || a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [rows, query]);

  useEffect(() => { setActive(0); }, [query]);

  const go = (row, tab) => {
    if (canOpen && !canOpen(tab)) return;
    if (tab === 'tracking') handOff.set('track-employee', String(row._id));
    if (tab === 'activity-log') handOff.set('activity-employee', String(row._id));
    if (tab === 'employee-monitor') handOff.set('monitor-search', row.employeeId || row.name);
    setOpen(false);
    setQuery('');
    onNavigate(tab);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') { setOpen(false); event.currentTarget.blur(); }
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => (i + 1) % results.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
    if (event.key === 'Enter') { event.preventDefault(); go(results[active], canOpen && !canOpen('tracking') ? 'activity-log' : 'tracking'); }
  };

  return (
    <div ref={boxRef} className="adm-search">
      <style>{`
        .adm-search { position: relative; flex: 1 1 280px; max-width: 420px; min-width: 0; }
        .adm-search input { width: 100%; border: 1px solid #dbe3ef; border-radius: 12px; padding: 8px 64px 8px 36px; font-size: .86rem; background: #f8fafc; color: #0f172a; }
        .adm-search input:focus { outline: none; background: #fff; border-color: #0a1f8f; box-shadow: 0 0 0 3px rgba(10,31,143,.12); }
        .adm-search .icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #64748b; }
        .adm-search kbd { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: .66rem; color: #64748b; background: #eef2f7; border: 1px solid #dbe3ef; border-radius: 6px; padding: 1px 6px; }
        .adm-search-pop { position: absolute; top: calc(100% + 6px); left: 0; right: 0; min-width: 320px; background: #fff; border: 1px solid #e6e9f2; border-radius: 14px; box-shadow: 0 18px 40px rgba(15,23,42,.16); z-index: 3000; overflow: hidden; }
        .adm-search-row { display: grid; grid-template-columns: auto 1fr; gap: 10px; padding: 10px 12px; border-bottom: 1px solid #f3f4f8; cursor: pointer; }
        .adm-search-row.on, .adm-search-row:hover { background: #f5f7ff; }
        .adm-search-row strong { font-size: .86rem; display: block; }
        .adm-search-row small { display: block; color: #64748b; font-size: .74rem; }
        .adm-search-actions { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
        .adm-search-actions button { border: 1px solid #dbe3ef; background: #fff; border-radius: 8px; padding: 2px 9px; font-size: .72rem; font-weight: 700; color: #0a1f8f; }
        .adm-search-actions button:hover { background: #0a1f8f; color: #fff; border-color: #0a1f8f; }
        .adm-search-tag { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; font-size: .66rem; font-weight: 800; color: var(--c); background: var(--s); margin-right: 4px; }
        .adm-search-empty { padding: 14px; color: #64748b; font-size: .84rem; text-align: center; }
      `}</style>
      <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" /></svg>
      <input
        ref={inputRef}
        type="search"
        placeholder="Search employee to track…"
        value={query}
        onFocus={() => { setOpen(true); load(); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
        aria-label="Search employees"
      />
      <kbd>Ctrl K</kbd>
      {open && query.trim() && (
        <div className="adm-search-pop" role="listbox">
          {loading && !rows.length && <div className="adm-search-empty">Loading employees…</div>}
          {!loading && !results.length && <div className="adm-search-empty">No employee matches “{query}”.</div>}
          {results.map((row, index) => {
            const punch = PUNCH_STATUS[row.punch?.status];
            const loc = LOCATION_STATUS[row.location?.status];
            return (
              <div key={row._id} className={`adm-search-row ${index === active ? 'on' : ''}`} role="option" aria-selected={index === active} onMouseEnter={() => setActive(index)}>
                <Avatar person={row} size={34} />
                <div style={{ minWidth: 0 }}>
                  <strong>{row.name} <span style={{ color: '#94a3b8', fontWeight: 600 }}>· {row.employeeId}</span></strong>
                  <small>
                    {punch && <span className="adm-search-tag" style={{ '--c': punch.color, '--s': punch.soft }}>{punch.label}</span>}
                    {loc && <span className="adm-search-tag" style={{ '--c': loc.color, '--s': loc.soft }}>{loc.short}</span>}
                    {row.online?.app && <span className="adm-search-tag" style={{ '--c': '#15803d', '--s': '#dcfce7' }}>App open</span>}
                  </small>
                  <small className="text-truncate">
                    {row.location?.latest ? `${row.location.latest.address ? row.location.latest.address.split(',').slice(0, 2).join(',') : 'Location'} · ${agoText(row.location.latest.at)}` : 'No location yet'}
                  </small>
                  <div className="adm-search-actions">
                    {(!canOpen || canOpen('tracking')) && <button type="button" onClick={() => go(row, 'tracking')}>Track on map</button>}
                    {(!canOpen || canOpen('activity-log')) && <button type="button" onClick={() => go(row, 'activity-log')}>Activity</button>}
                    {(!canOpen || canOpen('employee-monitor')) && <button type="button" onClick={() => go(row, 'employee-monitor')}>Monitor</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSearch;
