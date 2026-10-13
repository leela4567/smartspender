import dns from 'dns'
dns.setServers(['8.8.8.8','1.1.1.1'])
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import path from 'path'
import { fileURLToPath } from 'url'

const { MONGODB_URI, JWT_SECRET, PORT = 5000 } = process.env
if (!MONGODB_URI || !JWT_SECRET || JWT_SECRET.length < 16) { console.error('Set MONGODB_URI and a JWT_SECRET (16+ chars) in backend/.env'); process.exit(1) }
const CATS = ['Food','Transport','Shopping','Bills','Health','Entertainment','Education','Other']
const PAY = ['UPI','Card','Cash','Netbanking']

const User = mongoose.model('User', new mongoose.Schema({ name: String, email: { type: String, unique: true }, hash: String }, { timestamps: true }))
const eS = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, index: true }, amount: Number, category: String, description: String, date: String, payment: String }, { timestamps: true })
eS.index({ user: 1, date: -1 })
const Expense = mongoose.model('Expense', eS)
const bS = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, cat: String, month: String, limit: Number, th: Number })
bS.index({ user: 1, cat: 1, month: 1 }, { unique: true })
const Budget = mongoose.model('Budget', bS)

const ES = z.object({ amount: z.number().positive().max(1e8), category: z.enum(CATS), description: z.string().trim().min(1).max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), payment: z.enum(PAY) })
const BS = z.object({ cat: z.enum(['ALL', ...CATS]), month: z.string().regex(/^\d{4}-\d{2}$/), limit: z.number().positive().max(1e9), th: z.number().int().min(1).max(100) })
const RS = z.object({ name: z.string().trim().min(1).max(60), email: z.email().toLowerCase(), password: z.string().min(8).max(100) })
const LS = z.object({ email: z.string().toLowerCase(), password: z.string() })

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(express.json({ limit: '50kb' }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600 }))
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 })
const oid = (s) => new mongoose.Types.ObjectId(s)
const sign = (u) => jwt.sign({ id: u._id }, JWT_SECRET, { expiresIn: '7d' })
const pub = (u) => ({ id: u._id, name: u.name, email: u.email })
const need = (req, res, next) => {
  try { req.uid = oid(jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET).id); next() }
  catch { res.status(401).json({ error: 'Please log in again.' }) }
}

app.get('/api/health', async (_q, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }))

app.post('/api/auth/register', authLimit, async (req, res) => {
  const d = RS.parse(req.body)
  if (await User.exists({ email: d.email })) return res.status(409).json({ error: 'That email is already registered.' })
  const u = await User.create({ name: d.name, email: d.email, hash: await bcrypt.hash(d.password, 12) })
  res.status(201).json({ token: sign(u), user: pub(u) })
})
app.post('/api/auth/login', authLimit, async (req, res) => {
  const d = LS.parse(req.body)
  const u = await User.findOne({ email: { $eq: d.email } })
  if (!u || !(await bcrypt.compare(d.password, u.hash))) return res.status(401).json({ error: 'Email or password is incorrect.' })
  res.json({ token: sign(u), user: pub(u) })
})
app.get('/api/me', need, async (req, res) => {
  const u = await User.findById(req.uid)
  u ? res.json(pub(u)) : res.status(401).json({ error: 'Please log in again.' })
})

// Expenses (every query is scoped to req.uid)
app.get('/api/expenses', need, async (req, res) => {
  const { q, cat, from, to, min, max, sort = 'date-desc' } = req.query
  const f = { user: req.uid }
  if (typeof q === 'string' && q) f.description = { $regex: q.slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  if (typeof cat === 'string' && CATS.includes(cat)) f.category = cat
  if (from || to) f.date = { ...(from && { $gte: String(from) }), ...(to && { $lte: String(to) }) }
  if (min || max) f.amount = { ...(min && { $gte: Number(min) }), ...(max && { $lte: Number(max) }) }
  const S = { 'date-desc': { date: -1, _id: -1 }, 'date-asc': { date: 1, _id: 1 }, 'amt-desc': { amount: -1 }, 'amt-asc': { amount: 1 } }
  res.json({ items: await Expense.find(f).sort(S[sort] || S['date-desc']).limit(500).lean() })
})
app.post('/api/expenses', need, async (req, res) => res.status(201).json(await Expense.create({ ...ES.parse(req.body), user: req.uid })))
app.put('/api/expenses/:id', need, async (req, res) => {
  const e = await Expense.findOneAndUpdate({ _id: req.params.id, user: req.uid }, ES.parse(req.body), { new: true })
  e ? res.json(e) : res.status(404).json({ error: 'Expense not found.' })
})
app.delete('/api/expenses/:id', need, async (req, res) => {
  const e = await Expense.findOneAndDelete({ _id: req.params.id, user: req.uid })
  e ? res.json({ ok: true }) : res.status(404).json({ error: 'Expense not found.' })
})

// Budgets: spent / remaining / status are always computed on the server
const range = (m) => ({ $gte: m + '-01', $lte: m + '-31' })
async function withStatus(uid, list) {
  return Promise.all(list.map(async (b) => {
    const m = { user: uid, date: range(b.month) }
    if (b.cat !== 'ALL') m.category = b.cat
    const [r] = await Expense.aggregate([{ $match: m }, { $group: { _id: null, t: { $sum: '$amount' } } }])
    const spent = Math.round((r?.t || 0) * 100) / 100
    const pct = (spent / b.limit) * 100
    return { ...b, spent, pct, remaining: b.limit - spent, status: spent >= b.limit ? 'over' : pct >= b.th ? 'warn' : 'ok' }
  }))
}
app.get('/api/budgets', need, async (req, res) => {
  const f = { user: req.uid }
  if (typeof req.query.month === 'string') f.month = req.query.month
  res.json(await withStatus(req.uid, await Budget.find(f).sort({ month: -1 }).lean()))
})
const dup = (e, res) => e.code === 11000 ? res.status(409).json({ error: 'A budget for that category and month already exists.' }) : null
app.post('/api/budgets', need, async (req, res) => {
  try { res.status(201).json(await Budget.create({ ...BS.parse(req.body), user: req.uid })) } catch (e) { if (!dup(e, res)) throw e }
})
app.put('/api/budgets/:id', need, async (req, res) => {
  try {
    const b = await Budget.findOneAndUpdate({ _id: req.params.id, user: req.uid }, BS.parse(req.body), { new: true })
    b ? res.json(b) : res.status(404).json({ error: 'Budget not found.' })
  } catch (e) { if (!dup(e, res)) throw e }
})
app.delete('/api/budgets/:id', need, async (req, res) => {
  const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.uid })
  b ? res.json({ ok: true }) : res.status(404).json({ error: 'Budget not found.' })
})

app.get('/api/summary', need, async (req, res) => {
  const now = new Date(), cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : cm
  const first = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const from = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`
  const [[tot], byCat, tr, recent] = await Promise.all([
    Expense.aggregate([{ $match: { user: req.uid } }, { $group: { _id: null, t: { $sum: '$amount' }, n: { $sum: 1 } } }]),
    Expense.aggregate([{ $match: { user: req.uid, date: range(month) } }, { $group: { _id: '$category', v: { $sum: '$amount' }, n: { $sum: 1 } } }, { $sort: { v: -1 } }]),
    Expense.aggregate([{ $match: { user: req.uid, date: { $gte: from } } }, { $group: { _id: { $substr: ['$date', 0, 7] }, v: { $sum: '$amount' } } }]),
    Expense.find({ user: req.uid }).sort({ date: -1, _id: -1 }).limit(5).lean()
  ])
  const trend = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; return { m, v: tr.find((x) => x._id === m)?.v || 0 } })
  res.json({ total: tot?.t || 0, count: tot?.n || 0, monthTotal: byCat.reduce((a, c) => a + c.v, 0), monthCount: byCat.reduce((a, c) => a + c.n, 0), byCat: byCat.map((c) => ({ l: c._id, v: c.v })), trend, recent })
})

app.use('/api', (_q, res) => res.status(404).json({ error: 'Not found.' }))
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/dist')
app.use(express.static(dist))
app.get('/{*any}', (_q, res) => res.sendFile(path.join(dist, 'index.html')))
app.use((err, _q, res, _n) => {
  if (err?.issues) return res.status(400).json({ error: err.issues[0].path.join('.') + ': ' + err.issues[0].message })
  if (err?.name === 'CastError') return res.status(400).json({ error: 'Invalid id.' })
  console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' })
})
await mongoose.connect(MONGODB_URI)
app.listen(PORT, () => console.log('Smart Spender API on :' + PORT))


