import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/axios';
import { ALERT_EVENTS, Avatar, agoText, monitoringStyles } from './monitoringShared';

const DEFAULT_EVENTS = ['punch_in', 'punch_out', 'late_punch_in', 'outside_area', 'location_off', 'location_on', 'signal_lost', 'logged_out'];
const EVENT_LABEL = Object.fromEntries(ALERT_EVENTS.map(([key, label]) => [key, label]));

const emptyForm = () => ({
  _id: null,
  name: '',
  email: '',
  whatsapp: '',
  channels: { email: true, whatsapp: false },
  scope: 'all',
  employees: [],
  events: [...DEFAULT_EVENTS],
  dailySummary: true,
  active: true,
});

const Field = ({ label, hint, children }) => (
  <label className="d-block mb-3">
    <span className="d-block mn-strong" style={{ fontSize: '.82rem', marginBottom: 4 }}>{label}</span>
    {children}
    {hint && <span className="d-block mn-muted mt-1">{hint}</span>}
  </label>
);

/**
 * Admin -> Activity Alerts: who receives employee activity (punch in / out,
 * location off, phone silent, sign in / out ...) by email and WhatsApp, for all
 * employees or only the ones allowed, plus the WhatsApp API connection.
 */
const ActivityAlerts = () => {
  const [recipients, setRecipients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [config, setConfig] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [form, setForm] = useState(null);
  const [cfgForm, setCfgForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null); // { type, text }
  const [loading, setLoading] = useState(true);
  const [pickSearch, setPickSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [recRes, empRes, cfgRes] = await Promise.all([
        api.get('/monitoring/recipients'),
        api.get('/monitoring/employees'),
        api.get('/monitoring/config'),
      ]);
      setRecipients(recRes.data?.data || []);
      setEmployees((empRes.data?.data || []).map((e) => ({ _id: String(e._id), name: e.name, employeeId: e.employeeId, department: e.department, profilePhoto: e.profilePhoto })));
      setConfig(cfgRes.data?.data || null);
      setCanEdit(Boolean(cfgRes.data?.canEdit));
    } catch (err) {
      setNotice({ type: 'err', text: err.response?.data?.message || 'Could not load activity alerts' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), 7000);
  };

  const startNew = () => { setForm(emptyForm()); setPickSearch(''); };
  const startEdit = (r) => {
    setForm({
      _id: r._id,
      name: r.name || '',
      email: r.email || '',
      whatsapp: r.whatsapp || '',
      channels: { email: r.channels?.email !== false, whatsapp: Boolean(r.channels?.whatsapp) },
      scope: r.scope || 'all',
      employees: (r.employees || []).map((e) => String(e._id || e)),
      events: r.events || [],
      dailySummary: r.dailySummary !== false,
      active: r.active !== false,
    });
    setPickSearch('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload._id;
      const res = form._id
        ? await api.put(`/monitoring/recipients/${form._id}`, payload)
        : await api.post('/monitoring/recipients', payload);
      flash('ok', res.data?.message || 'Saved');
      setForm(null);
      load();
    } catch (err) {
      flash('err', err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Stop sending employee activity to ${r.name || r.email || r.whatsapp}?`)) return;
    setBusy(r._id);
    try {
      await api.delete(`/monitoring/recipients/${r._id}`);
      flash('ok', 'Recipient removed');
      load();
    } catch (err) {
      flash('err', err.response?.data?.message || 'Could not remove');
    } finally {
      setBusy('');
    }
  };

  const toggleActive = async (r) => {
    setBusy(r._id);
    try {
      await api.put(`/monitoring/recipients/${r._id}`, { ...r, employees: (r.employees || []).map((e) => String(e._id || e)), active: !r.active });
      load();
    } catch (err) {
      flash('err', err.response?.data?.message || 'Could not update');
    } finally {
      setBusy('');
    }
  };

  const test = async (r) => {
    setBusy(r._id);
    try {
      const res = await api.post(`/monitoring/recipients/${r._id}/test`, {});
      flash(res.data?.success ? 'ok' : 'warn', res.data?.message || 'Test sent');
      load();
    } catch (err) {
      flash('err', err.response?.data?.message || 'Test failed');
    } finally {
      setBusy('');
    }
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/monitoring/config', cfgForm);
      setConfig(res.data?.data);
      setCfgForm(null);
      flash('ok', 'Delivery settings saved');
    } catch (err) {
      flash('err', err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const pickList = useMemo(() => {
    const q = pickSearch.trim().toLowerCase();
    return employees.filter((e) => !q || [e.name, e.employeeId, e.department].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [employees, pickSearch]);

  const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const whatsappReady = Boolean(config?.whatsapp?.enabled && config?.whatsapp?.hasToken && config?.whatsapp?.phoneNumberId);

  return (
    <div className="mn">
      <style>{monitoringStyles}</style>
      <section className="mn-hero">
        <div>
          <div className="mn-eyebrow">Activity alerts</div>
          <h3>Send employee activity to email & WhatsApp</h3>
          <p>Add the people who should receive activity, choose which employees and which events. Updates arrive within a couple of minutes.</p>
        </div>
        <button type="button" className="mn-btn ghost" onClick={startNew}>+ Add recipient</button>
      </section>

      {notice && <div className={`mn-alert ${notice.type}`}>{notice.text}</div>}
      {config && !config.emailConfigured && (
        <div className="mn-alert warn">Email (SMTP) is not configured on the server, so activity emails cannot be sent. Set EMAIL_HOST / EMAIL_USER / EMAIL_PASS in the backend .env.</div>
      )}

      {form && (
        <form className="mn-card" onSubmit={save}>
          <div className="mn-card-head">
            <div><h4>{form._id ? 'Edit recipient' : 'New recipient'}</h4><p>Who receives activity, and what they receive</p></div>
            <button type="button" className="mn-btn sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
          <div className="mn-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 18px' }}>
              <Field label="Name"><input className="mn-input w-100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. HR Manager" maxLength={80} /></Field>
              <Field label="Email address" hint="Activity emails go here">
                <input className="mn-input w-100" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value, channels: { ...form.channels, email: Boolean(e.target.value) || form.channels.email } })} placeholder="name@company.com" />
              </Field>
              <Field label="WhatsApp number" hint={whatsappReady ? 'With country code, e.g. 919876543210' : 'Saved now; messages start once WhatsApp is connected below'}>
                <input className="mn-input w-100" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value, channels: { ...form.channels, whatsapp: Boolean(e.target.value) } })} placeholder="919876543210" inputMode="tel" />
              </Field>
            </div>

            <div className="d-flex flex-wrap gap-3 mb-3">
              <label className="d-flex gap-2 align-items-center"><input type="checkbox" checked={form.channels.email} onChange={(e) => setForm({ ...form, channels: { ...form.channels, email: e.target.checked } })} /> Send by email</label>
              <label className="d-flex gap-2 align-items-center"><input type="checkbox" checked={form.channels.whatsapp} onChange={(e) => setForm({ ...form, channels: { ...form.channels, whatsapp: e.target.checked } })} /> Send on WhatsApp</label>
              <label className="d-flex gap-2 align-items-center"><input type="checkbox" checked={form.dailySummary} onChange={(e) => setForm({ ...form, dailySummary: e.target.checked })} /> Daily summary at 9 PM</label>
              <label className="d-flex gap-2 align-items-center"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            </div>

            <div className="mn-strong mb-2" style={{ fontSize: '.82rem' }}>Which employees</div>
            <div className="d-flex flex-wrap gap-3 mb-2">
              <label className="d-flex gap-2 align-items-center"><input type="radio" name="scope" checked={form.scope === 'all'} onChange={() => setForm({ ...form, scope: 'all' })} /> All employees (including new ones)</label>
              <label className="d-flex gap-2 align-items-center"><input type="radio" name="scope" checked={form.scope === 'selected'} onChange={() => setForm({ ...form, scope: 'selected' })} /> Only selected employees</label>
            </div>
            {form.scope === 'selected' && (
              <div className="mb-3" style={{ border: '1px solid #e6e9f2', borderRadius: 12 }}>
                <div className="d-flex flex-wrap gap-2 align-items-center p-2" style={{ borderBottom: '1px solid #f0f2f7' }}>
                  <input className="mn-input" placeholder="Search employees…" value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
                  <button type="button" className="mn-btn sm" onClick={() => setForm({ ...form, employees: [...new Set([...form.employees, ...pickList.map((e) => e._id)])] })}>Select shown</button>
                  <button type="button" className="mn-btn sm" onClick={() => setForm({ ...form, employees: [] })}>Clear</button>
                  <span className="mn-muted">{form.employees.length} selected</span>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                  {pickList.map((e) => (
                    <label key={e._id} className="d-flex gap-2 align-items-center" style={{ padding: '7px 10px', borderBottom: '1px solid #f5f6fa', cursor: 'pointer', background: form.employees.includes(e._id) ? '#eef1fc' : 'transparent' }}>
                      <input type="checkbox" checked={form.employees.includes(e._id)} onChange={() => setForm({ ...form, employees: toggleIn(form.employees, e._id) })} />
                      <Avatar person={e} size={26} />
                      <span style={{ minWidth: 0 }}>
                        <span className="d-block mn-strong text-truncate" style={{ fontSize: '.82rem' }}>{e.name}</span>
                        <span className="d-block mn-muted text-truncate">{e.employeeId}{e.department ? ` · ${e.department}` : ''}</span>
                      </span>
                    </label>
                  ))}
                  {!pickList.length && <div className="mn-empty">No employees found.</div>}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="mn-strong" style={{ fontSize: '.82rem' }}>Which activity</span>
              <span className="d-flex gap-2">
                <button type="button" className="mn-btn sm" onClick={() => setForm({ ...form, events: ALERT_EVENTS.map(([k]) => k) })}>All</button>
                <button type="button" className="mn-btn sm" onClick={() => setForm({ ...form, events: [...DEFAULT_EVENTS] })}>Recommended</button>
                <button type="button" className="mn-btn sm" onClick={() => setForm({ ...form, events: [] })}>None</button>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }} className="mb-3">
              {ALERT_EVENTS.map(([key, label, hint]) => (
                <label key={key} className="d-flex gap-2" style={{ padding: '8px 10px', border: '1px solid #e6e9f2', borderRadius: 10, cursor: 'pointer', background: form.events.includes(key) ? '#f0fdf4' : '#fff' }}>
                  <input type="checkbox" checked={form.events.includes(key)} onChange={() => setForm({ ...form, events: toggleIn(form.events, key) })} style={{ marginTop: 3 }} />
                  <span><span className="d-block mn-strong" style={{ fontSize: '.82rem' }}>{label}</span><span className="d-block mn-muted">{hint}</span></span>
                </label>
              ))}
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="mn-btn" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="mn-btn primary" disabled={saving}>{saving ? 'Saving…' : form._id ? 'Save changes' : 'Add recipient'}</button>
            </div>
          </div>
        </form>
      )}

      <div className="mn-card">
        <div className="mn-card-head">
          <div><h4>Recipients</h4><p>{recipients.length} set up · activity is grouped into one message every few minutes</p></div>
          {!form && <button type="button" className="mn-btn primary sm" onClick={startNew}>+ Add recipient</button>}
        </div>
        {loading && <div className="mn-empty">Loading…</div>}
        {!loading && !recipients.length && (
          <div className="mn-empty">No recipients yet. Add an email address or WhatsApp number to start receiving employee activity.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 12, padding: recipients.length ? 14 : 0 }}>
          {recipients.map((r) => (
            <div key={r._id} style={{ border: '1px solid #e6e9f2', borderRadius: 14, padding: 14, opacity: r.active ? 1 : 0.6, display: 'grid', gap: 8 }}>
              <div className="d-flex justify-content-between gap-2">
                <div style={{ minWidth: 0 }}>
                  <div className="mn-strong">{r.name || r.email || r.whatsapp}</div>
                  {r.email && <div className="mn-muted text-truncate">✉ {r.email}{r.channels?.email ? '' : ' (off)'}</div>}
                  {r.whatsapp && <div className="mn-muted">☏ +{r.whatsapp}{r.channels?.whatsapp ? (whatsappReady ? '' : ' (WhatsApp not connected)') : ' (off)'}</div>}
                </div>
                <span className="mn-chip" style={{ '--c': r.active ? '#15803d' : '#64748b', '--s': r.active ? '#dcfce7' : '#f1f5f9', height: 'fit-content' }}><i />{r.active ? 'Active' : 'Paused'}</span>
              </div>
              <div className="mn-muted">
                <strong>Employees:</strong> {r.scope === 'all' ? 'All employees' : `${(r.employees || []).length} selected — ${(r.employees || []).slice(0, 4).map((e) => e.name).join(', ')}${(r.employees || []).length > 4 ? '…' : ''}`}
              </div>
              <div className="d-flex flex-wrap gap-1">
                {(r.events || []).map((e) => <span key={e} className="mn-src" style={{ '--c': '#0a1f8f', '--s': '#eef2ff', marginLeft: 0 }}>{EVENT_LABEL[e] || e}</span>)}
                {r.dailySummary && <span className="mn-src" style={{ '--c': '#7c3aed', '--s': '#ede9fe', marginLeft: 0 }}>Daily summary 9 PM</span>}
              </div>
              <div className="mn-muted">Last sent: {r.lastSentAt ? agoText(r.lastSentAt) : 'not yet'}</div>
              {r.lastError && <div className="mn-alert err" style={{ padding: '6px 9px', fontSize: '.76rem' }}>{r.lastError}</div>}
              <div className="d-flex flex-wrap gap-2">
                <button type="button" className="mn-btn sm" onClick={() => startEdit(r)} disabled={busy === r._id}>Edit</button>
                <button type="button" className="mn-btn sm" onClick={() => test(r)} disabled={busy === r._id}>{busy === r._id ? 'Working…' : 'Send test'}</button>
                <button type="button" className="mn-btn sm" onClick={() => toggleActive(r)} disabled={busy === r._id}>{r.active ? 'Pause' : 'Resume'}</button>
                <button type="button" className="mn-btn sm danger" onClick={() => remove(r)} disabled={busy === r._id}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mn-card">
        <div className="mn-card-head">
          <div><h4>Delivery settings</h4><p>Email uses the server's SMTP account. WhatsApp uses the WhatsApp Business Cloud API (Meta).</p></div>
          {canEdit && !cfgForm && config && (
            <button type="button" className="mn-btn sm" onClick={() => setCfgForm({
              whatsapp: { enabled: config.whatsapp.enabled, phoneNumberId: config.whatsapp.phoneNumberId, templateName: config.whatsapp.templateName, templateLanguage: config.whatsapp.templateLanguage, accessToken: '' },
              batchMinutes: config.batchMinutes,
              signalLostMinutes: config.signalLostMinutes,
            })}>Edit</button>
          )}
        </div>
        <div className="mn-card-body">
          {config && !cfgForm && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div className={`mn-alert ${config.emailConfigured ? 'ok' : 'warn'}`}><strong>Email:</strong> {config.emailConfigured ? 'ready' : 'SMTP not configured'}</div>
              <div className={`mn-alert ${whatsappReady ? 'ok' : 'warn'}`}><strong>WhatsApp:</strong> {whatsappReady ? `connected${config.whatsapp.templateName ? ` (template ${config.whatsapp.templateName})` : ''}` : 'not connected'}</div>
              <div className="mn-alert info"><strong>Grouping:</strong> one message every {config.batchMinutes} min</div>
              <div className="mn-alert info"><strong>Phone silent after:</strong> {config.signalLostMinutes} min without location</div>
            </div>
          )}
          {!canEdit && <div className="mn-muted mt-2">Only the admin can change delivery settings.</div>}
          {cfgForm && (
            <form onSubmit={saveConfig}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 18px' }}>
                <Field label="WhatsApp messages">
                  <label className="d-flex gap-2 align-items-center"><input type="checkbox" checked={cfgForm.whatsapp.enabled} onChange={(e) => setCfgForm({ ...cfgForm, whatsapp: { ...cfgForm.whatsapp, enabled: e.target.checked } })} /> Enabled</label>
                </Field>
                <Field label="Phone number ID" hint="Meta Business → WhatsApp → API setup">
                  <input className="mn-input w-100" value={cfgForm.whatsapp.phoneNumberId} onChange={(e) => setCfgForm({ ...cfgForm, whatsapp: { ...cfgForm.whatsapp, phoneNumberId: e.target.value } })} placeholder="123456789012345" />
                </Field>
                <Field label="Access token" hint={config?.whatsapp?.hasToken ? `Saved (${config.whatsapp.tokenHint}). Leave empty to keep it.` : 'Permanent token of a system user'}>
                  <input className="mn-input w-100" type="password" autoComplete="new-password" value={cfgForm.whatsapp.accessToken} onChange={(e) => setCfgForm({ ...cfgForm, whatsapp: { ...cfgForm.whatsapp, accessToken: e.target.value } })} placeholder={config?.whatsapp?.hasToken ? '••••••••' : 'EAAG…'} />
                </Field>
                <Field label="Message template name" hint="Approved template with one body variable {{1}}. Needed to message people who have not chatted with you in 24 h.">
                  <input className="mn-input w-100" value={cfgForm.whatsapp.templateName} onChange={(e) => setCfgForm({ ...cfgForm, whatsapp: { ...cfgForm.whatsapp, templateName: e.target.value } })} placeholder="employee_activity_update" />
                </Field>
                <Field label="Template language">
                  <input className="mn-input w-100" value={cfgForm.whatsapp.templateLanguage} onChange={(e) => setCfgForm({ ...cfgForm, whatsapp: { ...cfgForm.whatsapp, templateLanguage: e.target.value } })} placeholder="en" />
                </Field>
                <Field label="Group activity every (minutes)">
                  <input className="mn-input w-100" type="number" min="1" max="60" value={cfgForm.batchMinutes} onChange={(e) => setCfgForm({ ...cfgForm, batchMinutes: e.target.value })} />
                </Field>
                <Field label="Phone silent after (minutes without location)">
                  <input className="mn-input w-100" type="number" min="5" max="240" value={cfgForm.signalLostMinutes} onChange={(e) => setCfgForm({ ...cfgForm, signalLostMinutes: e.target.value })} />
                </Field>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="mn-btn" onClick={() => setCfgForm(null)}>Cancel</button>
                <button type="submit" className="mn-btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityAlerts;
