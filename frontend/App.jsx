import { useState, useEffect, useCallback } from 'react'
import AwsConsole from './AwsConsole.jsx'
const CATS = ['Food','Transport','Shopping','Bills','Health','Entertainment','Education','Other'], PAY = ['UPI','Card','Cash','Netbanking']
const COL = { Food:'#ffd93d', Transport:'#4d96ff', Shopping:'#ff6b9d', Bills:'#ff5c4d', Health:'#6bcb77', Entertainment:'#b28dff', Education:'#ff9f45', Other:'#cfcfcf' }
const api = (p, o = {}) => fetch('/api' + p, { ...o, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.token || '') }, body: o.body ? JSON.stringify(o.body) : undefined })
  .then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Request failed'); return d })
const inr = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
const today = () => new Date().toLocaleDateString('en-CA'), cm = () => today().slice(0, 7)
const col = s => s === 'over' ? 'var(--r)' : s === 'warn' ? 'var(--y)' : 'var(--g)'
const Opts = ({ a }) => a.map(x => <option key={x}>{x}</option>)
const Panel = ({ t, c = 'y', children }) => <section className="panel"><h3 className={c}>{t}</h3><div>{children}</div></section>
const Bars = ({ items }) => { const m = Math.max(1, ...items.map(i => i.v)); return items.length ? items.map(i => <div className="hb" key={i.l}><span>{i.l}</span><div className="tr"><i style={{ width: i.v / m * 100 + '%', background: i.c }} /></div><b>{inr(i.v)}</b></div>) : <p className="empty">No data yet. Add an expense to see this chart.</p> }
const Alerts = ({ list }) => list.filter(b => b.status !== 'ok').map(b => <div key={b._id} className="alert" style={{ background: col(b.status) }}>{b.status === 'over' ? 'Exceeded' : 'Warning'}: {b.cat === 'ALL' ? 'Monthly' : b.cat} budget ({b.month}) is at {b.pct.toFixed(0)}%, {inr(b.spent)} of {inr(b.limit)}.</div>)

export default function App() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [tab, setTab] = useState('dash'), [toast, setToast] = useState(''), [pub, setPub] = useState(false)
  const say = m => { setToast(m); setTimeout(() => setToast(''), 3000) }
  useEffect(() => { (localStorage.token ? api('/me').then(setUser).catch(() => localStorage.removeItem('token')) : Promise.resolve()).finally(() => setReady(true)) }, [])
  if (!ready) return null
  if (!user) return pub ? <main style={{ padding: 24, maxWidth: 1100, margin: 'auto' }}><button className="p" style={{ marginBottom: 20 }} onClick={() => setPub(false)}>← Back to Smart Spender</button><AwsConsole /></main> : <Auth onAuth={setUser} onAws={() => setPub(true)} />
  const N = ({ k, t }) => <button className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
  return <div className="shell">
    <nav><h2>Smart Spender<small>Hi, {user.name}</small></h2><N k="dash" t="Dashboard" /><N k="exp" t="Expenses" /><N k="bud" t="Budgets" /><N k="ana" t="Analytics" /><N k="aws" t="AWS Setup" />
      <button className="out p" style={{ marginTop: 'auto' }} onClick={() => { localStorage.removeItem('token'); setUser(null) }}>Log out</button></nav>
    <main>{tab === 'dash' && <Dash />}{tab === 'exp' && <Expenses say={say} />}{tab === 'bud' && <Budgets say={say} />}{tab === 'ana' && <Analytics />}{tab === 'aws' && <AwsConsole />}</main>
    {toast && <div className="toast" role="status">{toast}</div>}</div>
}

function Auth({ onAuth, onAws }) {
  const [reg, setReg] = useState(false), [err, setErr] = useState('')
  const go = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); try { const d = await api(reg ? '/auth/register' : '/auth/login', { method: 'POST', body: f }); localStorage.token = d.token; onAuth(d.user) } catch (x) { setErr(x.message) } }
  return <div className="hero"><div><h1>Smart<span>Spender</span></h1><p className="line">Track. Understand. Control.</p><p>Log expenses, set budgets, and get warned before you cross the line.</p><button className="y" onClick={onAws}>View AWS cloud setup</button></div>
    <form className="panel" onSubmit={go}><h3 className={reg ? 'p' : 'y'}>{reg ? 'Create your account' : 'Welcome back'}</h3>
      <div className="grid">{err && <div className="err" role="alert">{err}</div>}
        {reg && <label>Name<input name="name" required maxLength={60} /></label>}
        <label>Email<input name="email" type="email" required /></label>
        <label>Password{reg && ' (min 8 characters)'}<input name="password" type="password" required minLength={reg ? 8 : 1} /></label>
        <button className="b">{reg ? 'Create account' : 'Log in'}</button>
        <button type="button" onClick={() => { setReg(!reg); setErr('') }}>{reg ? 'I already have an account' : 'I need an account'}</button></div></form></div>
}

function Dash() {
  const [s, setS] = useState(null), [bs, setBs] = useState([])
  useEffect(() => { api('/summary?month=' + cm()).then(setS); api('/budgets?month=' + cm()).then(setBs) }, [])
  if (!s) return <p>Loading…</p>
  const all = bs.find(b => b.cat === 'ALL')
  return <><h1>Dashboard</h1><Alerts list={bs} />
    <div className="grid cols">
      <div className="stat y"><span>This month</span><b>{inr(s.monthTotal)}</b></div>
      <div className="stat b"><span>Total spending</span><b>{inr(s.total)}</b></div>
      <div className="stat g"><span>Remaining budget</span><b>{all ? inr(all.remaining) : 'No budget'}</b></div>
      <div className="stat p"><span>Budget used</span><b>{all ? all.pct.toFixed(0) + '%' : '-'}</b></div>
      <div className="stat"><span>Transactions this month</span><b>{s.monthCount}</b></div></div>
    <div className="grid two">
      <Panel t="Spending by category (this month)"><Bars items={s.byCat.map(c => ({ l: c.l, v: c.v, c: COL[c.l] }))} /></Panel>
      <Panel t="Budget vs actual" c="b">{bs.length ? bs.map(b => <div key={b._id}><b>{b.cat === 'ALL' ? 'All categories' : b.cat}</b>
        <Bars items={[{ l: 'Budget', v: b.limit, c: 'var(--b)' }, { l: 'Spent', v: b.spent, c: col(b.status) }]} /></div>) : <p className="empty">No budgets for this month. Create one on the Budgets page.</p>}</Panel></div>
    <Panel t="Recent transactions" c="g">{s.recent.length ? <div className="scroll"><table><tbody><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
      {s.recent.map(e => <tr key={e._id}><td>{e.date}</td><td>{e.description}</td><td>{e.category}</td><td>{inr(e.amount)}</td></tr>)}</tbody></table></div> : <p className="empty">No expenses yet. Add your first one on the Expenses page.</p>}</Panel></>
}

function Expenses({ say }) {
  const [F, setF] = useState({ q: '', cat: '', from: '', to: '', min: '', max: '', sort: 'date-desc' }), [L, setL] = useState([]), [ed, setEd] = useState(null)
  const load = useCallback(() => api('/expenses?' + new URLSearchParams(Object.entries(F).filter(([, v]) => v !== ''))).then(d => setL(d.items)), [F])
  useEffect(() => { load() }, [load])
  const save = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); try { await api('/expenses' + (ed ? '/' + ed._id : ''), { method: ed ? 'PUT' : 'POST', body: { ...f, amount: +f.amount } }); say(ed ? 'Expense updated.' : 'Expense added.'); setEd(null); load() } catch (x) { say(x.message) } }
  const del = async id => { if (!confirm('Delete this expense? This cannot be undone.')) return; await api('/expenses/' + id, { method: 'DELETE' }); say('Expense deleted.'); load() }
  const x = ed || { amount: '', category: 'Food', description: '', date: today(), payment: 'UPI' }
  const fl = (k, p = {}) => ({ value: F[k], onChange: e => setF({ ...F, [k]: e.target.value }), ...p })
  return <><h1>Expenses</h1>
    <Panel t={ed ? 'Edit expense' : 'Add expense'} c={ed ? 'p' : 'y'}><form key={ed?._id || L.length} className="grid f" onSubmit={save}>
      <label>Amount (₹)<input name="amount" type="number" step="0.01" min="0.01" required defaultValue={x.amount} /></label>
      <label>Category<select name="category" defaultValue={x.category}><Opts a={CATS} /></select></label>
      <label>Description<input name="description" required maxLength={100} defaultValue={x.description} /></label>
      <label>Date<input name="date" type="date" required defaultValue={x.date} /></label>
      <label>Payment<select name="payment" defaultValue={x.payment}><Opts a={PAY} /></select></label>
      <div className="row"><button className="y">{ed ? 'Save changes' : 'Add expense'}</button>{ed && <button type="button" onClick={() => setEd(null)}>Cancel</button>}</div></form></Panel>
    <Panel t="Search and filter" c="b"><div className="grid f">
      <label>Search<input {...fl('q', { placeholder: 'Description' })} /></label>
      <label>Category<select {...fl('cat')}><option value="">All</option><Opts a={CATS} /></select></label>
      <label>From<input type="date" {...fl('from')} /></label><label>To<input type="date" {...fl('to')} /></label>
      <label>Min ₹<input type="number" min="0" {...fl('min')} /></label><label>Max ₹<input type="number" min="0" {...fl('max')} /></label>
      <label>Sort<select {...fl('sort')}><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="amt-desc">Highest amount</option><option value="amt-asc">Lowest amount</option></select></label></div></Panel>
    <Panel t="All expenses" c="g">{L.length ? <div className="scroll"><p><b>{L.length}</b> expenses, total <b>{inr(L.reduce((a, e) => a + e.amount, 0))}</b></p><table><tbody>
      <tr><th>Date</th><th>Description</th><th>Category</th><th>Payment</th><th>Amount</th><th></th></tr>
      {L.map(e => <tr key={e._id}><td>{e.date}</td><td>{e.description}</td><td><span className="tag" style={{ background: COL[e.category] }}>{e.category}</span></td><td>{e.payment}</td><td>{inr(e.amount)}</td>
        <td><button className="sm b" onClick={() => { setEd(e); scrollTo(0, 0) }}>Edit</button> <button className="sm r" onClick={() => del(e._id)}>Delete</button></td></tr>)}</tbody></table></div>
      : <p className="empty">No expenses match. Change the filters or add a new expense.</p>}</Panel></>
}

function Budgets({ say }) {
  const [L, setL] = useState([]), [ed, setEd] = useState(null)
  const load = () => api('/budgets').then(setL)
  useEffect(() => { load() }, [])
  const save = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); try { await api('/budgets' + (ed ? '/' + ed._id : ''), { method: ed ? 'PUT' : 'POST', body: { ...f, limit: +f.limit, th: +f.th } }); say('Budget saved.'); setEd(null); load() } catch (x) { say(x.message) } }
  const del = async id => { if (!confirm('Delete this budget?')) return; await api('/budgets/' + id, { method: 'DELETE' }); say('Budget deleted.'); load() }
  const x = ed || { cat: 'ALL', month: cm(), limit: '', th: 80 }
  return <><h1>Budgets</h1><Alerts list={L.filter(b => b.month === cm())} />
    <Panel t={ed ? 'Edit budget' : 'New budget'} c={ed ? 'p' : 'y'}><form key={ed?._id || L.length} className="grid f" onSubmit={save}>
      <label>Category<select name="cat" defaultValue={x.cat}><option value="ALL">All categories (monthly)</option><Opts a={CATS} /></select></label>
      <label>Month<input name="month" type="month" required defaultValue={x.month} /></label>
      <label>Budget (₹)<input name="limit" type="number" min="1" step="0.01" required defaultValue={x.limit} /></label>
      <label>Warn at (%)<input name="th" type="number" min="1" max="100" required defaultValue={x.th} /></label>
      <div className="row"><button className="y">{ed ? 'Save changes' : 'Set budget'}</button>{ed && <button type="button" onClick={() => setEd(null)}>Cancel</button>}</div></form></Panel>
    <div className="grid two">{L.length ? L.map(b => <section className="panel" key={b._id}><h3 style={{ background: col(b.status) }}>{b.cat === 'ALL' ? 'All categories' : b.cat} · {b.month}</h3><div>
      <span className="tag" style={{ background: col(b.status) }}>{b.status === 'over' ? 'Budget exceeded' : b.status === 'warn' ? 'Near limit' : 'On track'}</span>
      <div className="tr" style={{ margin: '12px 0' }}><i style={{ width: Math.min(100, b.pct) + '%', background: col(b.status) }} /></div>
      <p>{inr(b.spent)} of {inr(b.limit)} ({b.pct.toFixed(0)}%). {b.remaining >= 0 ? inr(b.remaining) + ' remaining' : inr(-b.remaining) + ' over budget'}. Warns at {b.th}%.</p>
      <div className="row"><button className="sm b" onClick={() => { setEd(b); scrollTo(0, 0) }}>Edit</button><button className="sm r" onClick={() => del(b._id)}>Delete</button></div></div></section>)
      : <p className="empty">No budgets yet. Set one above to start getting alerts.</p>}</div></>
}

function Analytics() {
  const [s, setS] = useState(null)
  useEffect(() => { api('/summary').then(setS) }, [])
  if (!s) return <p>Loading…</p>
  const mx = Math.max(1, ...s.trend.map(t => t.v))
  return <><h1>Analytics</h1><div className="grid cols">
    <div className="stat y"><span>Average per transaction</span><b>{s.count ? inr(s.total / s.count) : '-'}</b></div>
    <div className="stat b"><span>Total transactions</span><b>{s.count}</b></div>
    <div className="stat p"><span>Top category this month</span><b>{s.byCat[0]?.l || '-'}</b></div></div>
    <Panel t="Monthly trend (last 6 months)" c="b"><div className="vb">{s.trend.map(t => <div key={t.m}><small>{t.v ? inr(t.v) : ''}</small><i style={{ height: t.v / mx * 85 + '%' }} /><span>{t.m.slice(5)}/{t.m.slice(2, 4)}</span></div>)}</div></Panel>
    <Panel t="This month by category"><Bars items={s.byCat.map(c => ({ l: c.l, v: c.v, c: COL[c.l] }))} /></Panel></>
}
