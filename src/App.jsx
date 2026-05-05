import React, { useState, useEffect } from 'react'

const ACCOUNTS = [
  { id: 'SR_BANK', label: 'SR — Scotia Bank Account', person: 'SR', type: 'bank' },
  { id: 'NR_BANK', label: 'NR — Scotia Bank Account', person: 'NR', type: 'bank' },
  { id: 'SR_CC',   label: 'SR — Scotia Momentum Visa', person: 'SR', type: 'cc' },
  { id: 'SR_CIBC', label: 'SR — CIBC (Costco)', person: 'SR', type: 'cc' },
]

const CATEGORIES = {
  'SR Paycheck':          { group: 'Income',      person: 'SR'   },
  'Car Reimbursement':    { group: 'Income',      person: 'SR'   },
  'NR DS Paycheck':       { group: 'Income',      person: 'NR'   },
  'NR CK Income':         { group: 'Income',      person: 'NR'   },
  'Canada Child Benefit': { group: 'Income',      person: 'NR'   },
  'Other Income':         { group: 'Income',      person: 'BOTH' },
  'Housing':              { group: 'Housing',     person: 'NR'   },
  'Vehicle Loan':         { group: 'Fixed',       person: 'SR'   },
  'Auto Insurance':       { group: 'Fixed',       person: 'SR'   },
  'Student Loan':         { group: 'Fixed',       person: 'NR'   },
  'Bank Fees':            { group: 'Fixed',       person: 'BOTH' },
  'Kids - Daycare':       { group: 'Fixed',       person: 'NR'   },
  'Kids - School':        { group: 'Fixed',       person: 'NR'   },
  'Scotia CC Payment':    { group: 'CC Payments', person: 'SR'   },
  'CIBC CC Payment':      { group: 'CC Payments', person: 'SR'   },
  'FHSA':                 { group: 'Savings',     person: 'SR'   },
  'RRSP':                 { group: 'Savings',     person: 'SR'   },
  'TFSA':                 { group: 'Savings',     person: 'SR'   },
  'RESP':                 { group: 'Savings',     person: 'BOTH' },
  'Groceries':            { group: 'Food',        person: 'BOTH' },
  'Dining & Takeout':     { group: 'Food',        person: 'BOTH' },
  'Coffee & Snacks':      { group: 'Food',        person: 'BOTH' },
  'Shopping':             { group: 'Shopping',    person: 'BOTH' },
  'Clothing':             { group: 'Shopping',    person: 'BOTH' },
  'Pharmacy & Medical':   { group: 'Health',      person: 'BOTH' },
  'Wellness & Massage':   { group: 'Health',      person: 'BOTH' },
  'Auto Maintenance':     { group: 'Transport',   person: 'SR'   },
  'Parking':              { group: 'Transport',   person: 'BOTH' },
  'Rideshare':            { group: 'Transport',   person: 'BOTH' },
  'Subscriptions':        { group: 'Digital',     person: 'BOTH' },
  'Personal Care':        { group: 'Lifestyle',   person: 'BOTH' },
  'Entertainment':        { group: 'Lifestyle',   person: 'BOTH' },
  'Charity':              { group: 'Lifestyle',   person: 'BOTH' },
  'Transfers':            { group: 'Other',       person: 'BOTH' },
  'Uncategorized':        { group: 'Other',       person: 'BOTH' },
}

const INCOME_CATS  = ['SR Paycheck','Car Reimbursement','NR DS Paycheck','NR CK Income','Canada Child Benefit','Other Income']
const SAVINGS_CATS = ['FHSA','RRSP','TFSA','RESP']
const CC_PAY_CATS  = ['Scotia CC Payment','CIBC CC Payment']
const FIXED_CATS   = ['Housing','Vehicle Loan','Auto Insurance','Student Loan','Bank Fees','Kids - Daycare','Kids - School']

const DEFAULT_BUDGET = {
  'SR Paycheck':8000,'Car Reimbursement':250,'NR DS Paycheck':6700,
  'NR CK Income':500,'Canada Child Benefit':300,
  'Housing':3500,'Vehicle Loan':644,'Auto Insurance':290,
  'Student Loan':153,'Bank Fees':35,'Kids - Daycare':850,'Kids - School':400,
  'Groceries':1000,'Dining & Takeout':400,'Coffee & Snacks':100,
  'Shopping':400,'Clothing':200,'Pharmacy & Medical':100,'Wellness & Massage':150,
  'Auto Maintenance':100,'Parking':50,'Rideshare':50,'Subscriptions':50,
  'Personal Care':80,'Entertainment':100,'Charity':100,
  'FHSA':650,'RRSP':650,'TFSA':500,'RESP':520,
}

// ── Categorization engine ────────────────────────────────────────────────────

function categorize(merchant, type, account, amount) {
  const m = merchant.toLowerCase()
  const isCredit = type === 'credit'
  const isBank   = account === 'SR_BANK' || account === 'NR_BANK'

  if (isBank && isCredit) {
    if (m.includes('mb-dep') || m.includes('mb dep')) {
      if (account === 'NR_BANK') return 'NR DS Paycheck'
      return amount <= 300 ? 'Car Reimbursement' : 'SR Paycheck'
    }
    if (m.includes('ccb') || m.includes('canada child') || m.includes('fed grant')) return 'Canada Child Benefit'
    if (m.includes('creative kids') || m.includes('ck pay')) return 'NR CK Income'
    if (m.includes('interac') || m.includes('e-transfer')) return null
    return 'Other Income'
  }

  if (isBank && !isCredit) {
    if (m.includes('rbc loan')) return 'Vehicle Loan'
    if (m.includes('insurance corporation') || m.includes('icbc #')) return 'Auto Insurance'
    if (m.includes('monthly fees') || m.includes('service charge') || m.includes('bank fee')) return 'Bank Fees'
    if (m.includes('student loan') || m.includes('nslsc')) return 'Student Loan'
    if (m.includes('crd. card bill') || m.includes('crd card bill') || m.includes('scotiabank transit')) return 'Scotia CC Payment'
    if (m.includes('cibc card') || m.includes('cibc card products') || m.includes('cibc')) return 'CIBC CC Payment'
    if (m.includes('daycare') || m.includes('preschool')) return 'Kids - Daycare'
    if (m.includes('school fee') || m.includes('tuition')) return 'Kids - School'
    if (m.includes('fhsa')) return 'FHSA'
    if (m.includes('rrsp')) return 'RRSP'
    if (m.includes('tfsa')) return 'TFSA'
    if (m.includes('resp')) return 'RESP'
    if (m.includes('wealthsimple')) return 'TFSA'
    if (m.includes('gurdwara') || m.includes('guru nanak')) return 'Charity'
    if (m.includes('interac') || m.includes('e-transfer') || m.includes('abm withdrawal')) return null
    return null
  }

  // Credit card spending
  if (m.includes('costco') || m.includes('instacar') || m.includes('instacart')) return 'Groceries'
  if (['fruiticana','sabzi mandi','sunfarm','punjab flour','jeenkha','manohar','superstore','no frills','save-on','walmart','freshco','loblaws','food basics'].some(k => m.includes(k))) return 'Groceries'
  if (['subway','a&w','burgrill','super vege pizza','uber eat','doordash','skip','pizza','restaurant','tandoor','dhaba','kfc','mcdonald','burger king','popeyes'].some(k => m.includes(k))) return 'Dining & Takeout'
  if (['tim horton','7-eleven','starbucks','cafe','coffee','donut','bakery'].some(k => m.includes(k))) return 'Coffee & Snacks'
  if (['la vie en rose','h&m','zara','gap','old navy','uniqlo'].some(k => m.includes(k))) return 'Clothing'
  if (['sport chek','sportchek','winners','ikea','home depot','canadian tire','dollarama','marshalls','homesense'].some(k => m.includes(k))) return 'Shopping'
  if (m.includes('amazon')) return 'Shopping'
  if (['shoppers drug mart','pharmacy','rexall','london drugs','medical','clinic','dental','hospital'].some(k => m.includes(k))) return 'Pharmacy & Medical'
  if (['revere massage','massage','spa','yoga','gym','fitness','crossfit'].some(k => m.includes(k))) return 'Wellness & Massage'
  if (['abby tires','akal sales','auto repair','tire','oil change','car wash','midas','meineke'].some(k => m.includes(k))) return 'Auto Maintenance'
  if (['impark','parking','easypark','prkg'].some(k => m.includes(k))) return 'Parking'
  if (m.includes('uber') && !m.includes('eat')) return 'Rideshare'
  if (['apple.com','apple bill','icloud','netflix','chatgpt','spotify','disney','microsoft','adobe','google one'].some(k => m.includes(k))) return 'Subscriptions'
  if (['fade factory','haircut','barber','salon','beauty'].some(k => m.includes(k))) return 'Personal Care'
  if (['library','cinema','movie','recreation','newton','theatre'].some(k => m.includes(k))) return 'Entertainment'
  if (['gurdwara','guru nanak food bank','charity','donation'].some(k => m.includes(k))) return 'Charity'
  return 'Uncategorized'
}

// ── CSV parsers ──────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const parts = []; let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { parts.push(cur.trim()); cur = '' }
    else cur += ch
  }
  parts.push(cur.trim())
  return parts.map(p => p.replace(/"/g, '').trim())
}

function parseScotiaBankCSV(text, accountId) {
  const lines = text.trim().split('\n')
  const header = lines[0].toLowerCase()
  const isBankFile = header.includes('balance') && !header.includes('status')
  const isCCFile   = header.includes('status') && !header.includes('balance')
  if (!isBankFile && !isCCFile) return { transactions: [], month: null, corrected: false, finalAccount: accountId }

  // Auto-correct account ID based on actual file type detected from header
  let finalAccount = accountId
  if (isBankFile && accountId !== 'SR_BANK' && accountId !== 'NR_BANK') {
    finalAccount = 'SR_BANK'
  }
  if (isCCFile && (accountId === 'SR_BANK' || accountId === 'NR_BANK')) {
    finalAccount = 'SR_CC'
  }
  const corrected = finalAccount !== accountId

  const txns = []; let month = null

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const p = parseCSVLine(lines[i])

    if (isBankFile && p.length >= 6) {
      const date = p[1]
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue
      const desc    = p[2]
      const sub     = p[3]
      const type    = p[4].toLowerCase() === 'credit' ? 'credit' : 'debit'
      const amount  = Math.abs(parseFloat(p[5]) || 0)
      if (amount === 0) continue
      if (!month) month = date.slice(0, 7)
      const merchant = (sub && sub.trim()) ? sub.trim() : desc.trim()
      const cat = categorize(merchant, type, finalAccount, amount)
      txns.push({
        id: Date.now() + Math.random(), date, merchant, amount, type,
        category: cat, account: finalAccount,
        month: date.slice(0, 7), needsLabel: !cat
      })
    }

    if (isCCFile && p.length >= 7) {
      const date     = p[1]
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue
      const merchant = p[2].trim()
      const type     = p[5].toLowerCase() === 'credit' ? 'credit' : 'debit'
      const amount   = Math.abs(parseFloat(p[6]) || 0)
      if (amount === 0 || !merchant) continue
      if (!month) month = date.slice(0, 7)
      const cat = categorize(merchant, type, finalAccount, amount)
      txns.push({
        id: Date.now() + Math.random(), date, merchant, amount, type,
        category: cat, account: finalAccount,
        month: date.slice(0, 7), needsLabel: false
      })
    }
  }
  return { transactions: txns, month, corrected, finalAccount }
}

function parseWealthsimpleCSV(text) {
  const lines = text.trim().split('\n')
  const portfolio = { FHSA: 0, RRSP: 0, TFSA: 0, 'Non-Registered': 0 }
  for (let i = 1; i < lines.length; i++) {
    const p = parseCSVLine(lines[i])
    if (p.length < 19 || !p[0]) continue
    const val    = parseFloat(p[17]) || 0
    const curr   = p[18]
    const valCAD = curr === 'USD' ? val * 1.38 : val
    if (p[0] === 'FHSA') portfolio.FHSA += valCAD
    else if (p[0] === 'RRSP') portfolio.RRSP += valCAD
    else if (p[0] === 'TFSA') portfolio.TFSA += valCAD
    else if (p[0] === 'Non-registered') portfolio['Non-Registered'] += valCAD
  }
  return portfolio
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (n) => '$' + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (n) => Math.abs(n) >= 1000 ? '$' + (Math.abs(n) / 1000).toFixed(1) + 'k' : fmt(n)

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? def } catch { return def } }

  const [transactions,  setTransactions]  = useState(() => load('rh_tx', []))
  const [budget,        setBudget]        = useState(() => load('rh_budget', DEFAULT_BUDGET))
  const [openingBal,    setOpeningBal]    = useState(() => load('rh_ob', {}))
  const [investments,   setInvestments]   = useState(() => load('rh_invest', null))
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [activeTab,     setActiveTab]     = useState('dashboard')
  const [showUpload,    setShowUpload]    = useState(false)
  const [showBudget,    setShowBudget]    = useState(false)
  const [uploadAccount, setUploadAccount] = useState('SR_BANK')
  const [labelQueue,    setLabelQueue]    = useState([])
  const [notification,  setNotification]  = useState(null)
  const [labelSelect,   setLabelSelect]   = useState({})

  useEffect(() => { localStorage.setItem('rh_tx',     JSON.stringify(transactions))  }, [transactions])
  useEffect(() => { localStorage.setItem('rh_budget', JSON.stringify(budget))        }, [budget])
  useEffect(() => { localStorage.setItem('rh_ob',     JSON.stringify(openingBal))    }, [openingBal])
  useEffect(() => { localStorage.setItem('rh_invest', JSON.stringify(investments))   }, [investments])

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      if (uploadAccount === 'WEALTHSIMPLE') {
        const p = parseWealthsimpleCSV(text)
        const total = Object.values(p).reduce((s, v) => s + v, 0)
        if (total > 0) {
          setInvestments({ ...p, lastUpdated: new Date().toLocaleDateString('en-CA') })
          notify('Wealthsimple updated — ' + fmt(total))
        } else {
          notify('Could not read Wealthsimple file', 'error')
        }
      } else {
        const { transactions: parsed, month, corrected, finalAccount } = parseScotiaBankCSV(text, uploadAccount)
        if (!parsed.length) {
          notify('No transactions found — check file format', 'error')
        } else {
          setTransactions(prev => [
            ...prev.filter(t => !(t.account === finalAccount && t.month === month)),
            ...parsed
          ])
          const unlabeled = parsed.filter(t => t.needsLabel)
          if (unlabeled.length) setLabelQueue(prev => [...prev, ...unlabeled])
          if (corrected) {
            notify(`Auto-corrected to ${finalAccount} — ${parsed.length} transactions for ${month}`)
          } else {
            notify(`Imported ${parsed.length} transactions for ${month}`)
          }
          setSelectedMonth(month)
        }
      }
      e.target.value = ''
      setShowUpload(false)
    }
    reader.readAsText(file)
  }

  const recategorizeAll = () => {
    setTransactions(prev => prev.map(t => ({
      ...t,
      category: categorize(t.merchant, t.type, t.account, t.amount) || t.category,
      needsLabel: !categorize(t.merchant, t.type, t.account, t.amount)
    })))
    notify('Re-categorized all transactions')
  }

  const getTx      = (month, acct = null) => transactions.filter(t => t.month === month && (acct === null || t.account === acct))
  const sumCats    = (txList, cats) => txList.filter(t => cats.includes(t.category)).reduce((s, t) => s + t.amount, 0)
  const byCat      = (txList) => txList.reduce((acc, t) => { acc[t.category || 'Uncategorized'] = (acc[t.category || 'Uncategorized'] || 0) + t.amount; return acc }, {})
  const getOB      = (acct, month) => openingBal[acct + '_' + month] || 0
  const setOB      = (acct, month, val) => setOpeningBal(prev => ({ ...prev, [acct + '_' + month]: parseFloat(val) || 0 }))
  const getClosing = (acct, month) => {
    const txList = getTx(month, acct)
    return getOB(acct, month) + txList.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0) - txList.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  }
  const updateCat = (id, cat) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: cat, needsLabel: false } : t))

  const availableMonths = [...new Set(transactions.map(t => t.month))].sort()
  const monthOptions    = availableMonths.length ? availableMonths : [selectedMonth]
  const monthLabel      = (m) => { const d = new Date(m + '-15'); return d.toLocaleString('en-CA', { month: 'long', year: 'numeric' }) }

  const srBankTx  = getTx(selectedMonth, 'SR_BANK')
  const nrBankTx  = getTx(selectedMonth, 'NR_BANK')
  const srCcTx    = getTx(selectedMonth, 'SR_CC')
  const cibcTx    = getTx(selectedMonth, 'SR_CIBC')
  const allCcTx   = [...srCcTx, ...cibcTx]
  const allBankTx = [...srBankTx, ...nrBankTx]

  const totalIncome  = sumCats(allBankTx, INCOME_CATS)
  const totalSavings = sumCats(allBankTx, SAVINGS_CATS)
  const totalFixed   = sumCats(allBankTx, FIXED_CATS)
  const totalCcSpend = allCcTx.reduce((s, t) => s + t.amount, 0)
  const totalExp     = totalFixed + totalCcSpend
  const monthBalance = totalIncome - totalExp - totalSavings
  const savingsRate  = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0

  const investTotal = investments ? Object.entries(investments).filter(([k]) => k !== 'lastUpdated').reduce((s, [, v]) => s + v, 0) : 0
  const srBalance   = getClosing('SR_BANK', selectedMonth)
  const nrBalance   = getClosing('NR_BANK', selectedMonth)
  const netWorth    = srBalance + nrBalance + investTotal

  return (
    <div className="app">

      {notification && <div className={`notif notif-${notification.type}`}>{notification.msg}</div>}

      {/* Upload Modal */}
      {showUpload && (
        <div className="overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Upload CSV File</h3>
            <div className="field">
              <label>Select Account</label>
              <select value={uploadAccount} onChange={e => setUploadAccount(e.target.value)}>
                {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                <option value="WEALTHSIMPLE">Wealthsimple Holdings CSV</option>
              </select>
            </div>
            <div className="upload-note">
              <p>💡 <strong>Bank or CC is auto-detected from the file</strong> — even if you pick the wrong account type, the app will correct it automatically.</p>
            </div>
            <div className="field">
              <label>Select File</label>
              <input type="file" accept=".csv" onChange={handleUpload} />
            </div>
            <p className="hint">Uploading the same month again replaces existing data for that account.</p>
            <button className="btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Label Queue Modal */}
      {labelQueue.length > 0 && (
        <div className="overlay">
          <div className="modal">
            <h3>Categorize Transactions ({labelQueue.length} remaining)</h3>
            <p className="hint">These bank transactions need a category (e-transfers, ATM withdrawals etc.)</p>
            {labelQueue.slice(0, 5).map(t => (
              <div key={t.id} className="label-row">
                <div className="label-info">
                  <span className="label-date">{t.date}</span>
                  <span className="label-merchant">{t.merchant}</span>
                  <span className="label-amt">{fmt(t.amount)}</span>
                </div>
                <select value={labelSelect[t.id] || ''} onChange={e => setLabelSelect(prev => ({ ...prev, [t.id]: e.target.value }))}>
                  <option value="">Select category...</option>
                  {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn-sm" onClick={() => {
                  if (labelSelect[t.id]) {
                    updateCat(t.id, labelSelect[t.id])
                    setLabelQueue(prev => prev.filter(x => x.id !== t.id))
                  }
                }}>Apply</button>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setLabelQueue([])}>Done for now</button>
              {labelQueue.length > 5 && <span className="hint">+{labelQueue.length - 5} more in Simran / Navneet tabs</span>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">R</div>
          <div>
            <div className="brand-name">Rathore Finances</div>
            <div className="brand-sub">Household Dashboard</div>
          </div>
        </div>
        <div className="header-controls">
          <select className="month-picker" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {monthOptions.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setShowUpload(true)}>↑ Upload CSV</button>
          <button className="btn-outline" onClick={recategorizeAll}>↻ Re-categorize</button>
          <button className="btn-outline" onClick={() => setShowBudget(b => !b)}>⚙ Budget</button>
        </div>
      </header>

      {/* Net Worth Strip */}
      <div className="nw-strip">
        {[
          { label: 'SR Bank',      value: srBalance,   empty: !srBankTx.length },
          { label: 'NR Bank',      value: nrBalance,   empty: !nrBankTx.length },
          { label: 'Wealthsimple', value: investTotal, empty: !investments     },
          { label: 'Net Worth',    value: netWorth,    highlight: true         },
        ].map(({ label, value, empty, highlight }) => (
          <div key={label} className={`nw-chip ${highlight ? 'nw-highlight' : ''}`}>
            <span className="nw-label">{label}</span>
            <span className={`nw-val ${highlight ? 'nw-accent' : ''}`}>{empty && !highlight ? '—' : fmtK(value)}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav className="tabs">
        {[
          { id: 'dashboard',   icon: '⌂', label: 'Dashboard'   },
          { id: 'sr',          icon: 'S', label: 'Simran'       },
          { id: 'nr',          icon: 'N', label: 'Navneet'      },
          { id: 'cc',          icon: '◈', label: 'Credit Card'  },
          { id: 'investments', icon: '↗', label: 'Investments'  },
          { id: 'annual',      icon: '≡', label: 'Annual'       },
        ].map(({ id, icon, label }) => (
          <button key={id} className={`tab-btn ${activeTab === id ? 'tab-active' : ''}`} onClick={() => setActiveTab(id)}>
            <span className="tab-icon">{icon}</span>{label}
          </button>
        ))}
      </nav>

      {/* Budget Panel */}
      {showBudget && (
        <div className="budget-panel">
          <div className="bp-header">
            <h3>Monthly Budget Targets</h3>
            <div>
              <button className="btn-ghost" onClick={() => setBudget(DEFAULT_BUDGET)}>Reset</button>
              <button className="btn-primary" onClick={() => setShowBudget(false)}>Save & Close</button>
            </div>
          </div>
          <div className="bp-grid">
            {Object.entries(budget).map(([cat, val]) => (
              <div key={cat} className="bp-item">
                <label>{cat}</label>
                <input type="number" value={val} onChange={e => setBudget(prev => ({ ...prev, [cat]: parseFloat(e.target.value) || 0 }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="main">

        {/* ══════════ DASHBOARD ══════════ */}
        {activeTab === 'dashboard' && (
          <div className="view">
            <h2 className="view-title">{monthLabel(selectedMonth)}</h2>

            <div className="kpi-row">
              {[
                { label: 'Income',        value: totalIncome,  cls: 'kpi-green', sub: `Budget: ${fmtK(INCOME_CATS.reduce((s, c) => s + (budget[c] || 0), 0))}` },
                { label: 'Expenses',      value: totalExp,     cls: 'kpi-red',   sub: `Fixed: ${fmtK(totalFixed)} + CC: ${fmtK(totalCcSpend)}` },
                { label: 'Savings',       value: totalSavings, cls: 'kpi-blue',  sub: `Savings rate: ${savingsRate}%` },
                { label: 'Month Balance', value: monthBalance, cls: monthBalance >= 0 ? 'kpi-green' : 'kpi-red', sub: 'Income − Exp − Savings' },
              ].map(({ label, value, cls, sub }) => (
                <div key={label} className="kpi-card">
                  <div className="kpi-label">{label}</div>
                  <div className={`kpi-value ${cls}`}>{fmt(value)}</div>
                  <div className="kpi-sub">{sub}</div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="section-head"><h3>Income</h3></div>
              <table className="data-table">
                <thead><tr><th>Source</th><th>Actual</th><th>Budget</th><th>Diff</th></tr></thead>
                <tbody>
                  {INCOME_CATS.map(cat => {
                    const actual = sumCats(allBankTx, [cat]); const plan = budget[cat] || 0
                    if (!actual && !plan) return null
                    return (<tr key={cat}><td>{cat}</td><td className="num green">{fmt(actual)}</td><td className="num muted">{fmt(plan)}</td><td className={`num ${actual - plan >= 0 ? 'green' : 'red'}`}>{actual >= plan ? '+' : ''}{fmt(actual - plan)}</td></tr>)
                  })}
                  <tr className="total-row"><td>Total</td><td className="num green">{fmt(totalIncome)}</td><td className="num muted">{fmt(INCOME_CATS.reduce((s, c) => s + (budget[c] || 0), 0))}</td><td></td></tr>
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-head"><h3>Fixed Expenses (Bank Account)</h3></div>
              <table className="data-table">
                <thead><tr><th>Category</th><th>Actual</th><th>Budget</th><th>Status</th></tr></thead>
                <tbody>
                  {FIXED_CATS.map(cat => {
                    const actual = sumCats(allBankTx, [cat]); const plan = budget[cat] || 0
                    if (!actual && !plan) return null
                    return (<tr key={cat}><td>{cat}</td><td className="num">{fmt(actual)}</td><td className="num muted">{fmt(plan)}</td><td>{actual > plan * 1.05 ? <span className="badge-warn">Over</span> : <span className="badge-ok">OK</span>}</td></tr>)
                  })}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-head"><h3>Credit Card Spending</h3></div>
              <table className="data-table">
                <thead><tr><th>Category</th><th>Actual</th><th>Budget</th><th>Status</th></tr></thead>
                <tbody>
                  {Object.entries(byCat(allCcTx)).sort(([, a], [, b]) => b - a).map(([cat, actual]) => {
                    const plan = budget[cat] || 0
                    return (<tr key={cat}><td>{cat}</td><td className="num">{fmt(actual)}</td><td className="num muted">{plan ? fmt(plan) : '—'}</td><td>{plan && actual > plan ? <span className="badge-warn">Over</span> : <span className="badge-ok">OK</span>}</td></tr>)
                  })}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-head"><h3>CC Payments from Bank</h3></div>
              <table className="data-table">
                <thead><tr><th>Account</th><th>Amount Paid</th></tr></thead>
                <tbody>
                  {CC_PAY_CATS.map(cat => {
                    const actual = sumCats(allBankTx, [cat]); if (!actual) return null
                    return (<tr key={cat}><td>{cat}</td><td className="num red">{fmt(actual)}</td></tr>)
                  })}
                </tbody>
              </table>
              <p className="hint" style={{ padding: '8px 20px 16px' }}>These are last month's CC bills paid this month — tracked separately to avoid double-counting with CC spending above.</p>
            </div>

            <div className="section">
              <div className="section-head"><h3>Savings</h3></div>
              <table className="data-table">
                <thead><tr><th>Account</th><th>Contributed</th><th>Budget</th></tr></thead>
                <tbody>
                  {SAVINGS_CATS.map(cat => {
                    const actual = sumCats(allBankTx, [cat]); const plan = budget[cat] || 0
                    if (!actual && !plan) return null
                    return (<tr key={cat}><td>{cat}</td><td className="num blue">{fmt(actual)}</td><td className="num muted">{fmt(plan)}</td></tr>)
                  })}
                  <tr className="total-row"><td>Total Savings</td><td className="num blue">{fmt(totalSavings)}</td><td className="num muted">{fmt(SAVINGS_CATS.reduce((s, c) => s + (budget[c] || 0), 0))}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ SR / NR TAB ══════════ */}
        {(activeTab === 'sr' || activeTab === 'nr') && (() => {
          const isSR    = activeTab === 'sr'
          const acct    = isSR ? 'SR_BANK' : 'NR_BANK'
          const name    = isSR ? 'Simran' : 'Navneet'
          const txList  = isSR ? srBankTx : nrBankTx
          const income  = sumCats(txList, INCOME_CATS)
          const fixed   = sumCats(txList, FIXED_CATS)
          const ccPay   = sumCats(txList, CC_PAY_CATS)
          const sav     = sumCats(txList, SAVINGS_CATS)
          const closing = getClosing(acct, selectedMonth)
          return (
            <div className="view">
              <div className="person-header">
                <h2>{name} — Scotia Bank · {monthLabel(selectedMonth)}</h2>
                <div className="ob-input">
                  <label>Opening Balance (1st of month):</label>
                  <input type="number" placeholder="e.g. 9204" value={getOB(acct, selectedMonth) || ''} onChange={e => setOB(acct, selectedMonth, e.target.value)} />
                </div>
              </div>

              <div className="kpi-row">
                {[
                  { label: 'Income',          value: income,  cls: 'kpi-green' },
                  { label: 'Fixed Expenses',  value: fixed,   cls: 'kpi-red'   },
                  { label: 'CC Payments',     value: ccPay,   cls: 'kpi-red'   },
                  { label: 'Savings',         value: sav,     cls: 'kpi-blue'  },
                  { label: 'Closing Balance', value: closing, cls: closing >= 0 ? 'kpi-green' : 'kpi-red' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="kpi-card">
                    <div className="kpi-label">{label}</div>
                    <div className={`kpi-value ${cls}`}>{fmt(value)}</div>
                  </div>
                ))}
              </div>

              <div className="section">
                <div className="section-head"><h3>Planned vs Actual</h3></div>
                <table className="data-table">
                  <thead><tr><th>Category</th><th>Actual</th><th>Planned</th><th>Diff</th><th>Status</th></tr></thead>
                  <tbody>
                    {[...INCOME_CATS, ...FIXED_CATS, ...SAVINGS_CATS].map(cat => {
                      const actual = sumCats(txList, [cat]); const plan = budget[cat] || 0
                      if (!actual && !plan) return null
                      const isInc = INCOME_CATS.includes(cat)
                      const diff  = isInc ? actual - plan : plan - actual
                      return (<tr key={cat}><td>{cat}</td><td className="num">{fmt(actual)}</td><td className="num muted">{fmt(plan)}</td><td className={`num ${diff >= 0 ? 'green' : 'red'}`}>{diff >= 0 ? '+' : ''}{fmt(diff)}</td><td>{diff < 0 ? <span className="badge-warn">Off</span> : <span className="badge-ok">✓</span>}</td></tr>)
                    })}
                  </tbody>
                </table>
              </div>

              <div className="section">
                <div className="section-head">
                  <h3>All Transactions ({txList.length})</h3>
                  {txList.filter(t => !t.category || t.category === 'Uncategorized').length > 0 &&
                    <span className="badge-warn">{txList.filter(t => !t.category || t.category === 'Uncategorized').length} need labels</span>}
                </div>
                {txList.length === 0
                  ? <p className="empty-msg">No transactions for {selectedMonth}. Upload {name}'s Scotia bank CSV.</p>
                  : <div className="tx-list">
                      {txList.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                        <div key={t.id} className={`tx-row ${!t.category || t.category === 'Uncategorized' ? 'tx-unlabeled' : ''}`}>
                          <span className="tx-date">{t.date.slice(5)}</span>
                          <span className="tx-merchant">{t.merchant}</span>
                          <span className={`tx-amt ${t.type === 'credit' ? 'green' : 'red'}`}>{t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}</span>
                          <select className="tx-cat-sel" value={t.category || ''} onChange={e => updateCat(t.id, e.target.value)}>
                            <option value="">Uncategorized</option>
                            {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          )
        })()}

        {/* ══════════ CREDIT CARD TAB ══════════ */}
        {activeTab === 'cc' && (
          <div className="view">
            <h2 className="view-title">Credit Card Spending — {monthLabel(selectedMonth)}</h2>
            <p className="hint">Actual day-to-day spending on both cards. Kept separate from bank numbers to avoid double-counting.</p>

            <div className="kpi-row">
              <div className="kpi-card"><div className="kpi-label">Scotia Visa</div><div className="kpi-value kpi-red">{fmt(srCcTx.reduce((s, t) => s + t.amount, 0))}</div><div className="kpi-sub">{srCcTx.length} transactions</div></div>
              <div className="kpi-card"><div className="kpi-label">CIBC (Costco)</div><div className="kpi-value kpi-red">{fmt(cibcTx.reduce((s, t) => s + t.amount, 0))}</div><div className="kpi-sub">{cibcTx.length} transactions</div></div>
              <div className="kpi-card"><div className="kpi-label">Total CC Spend</div><div className="kpi-value kpi-red">{fmt(totalCcSpend)}</div><div className="kpi-sub">Both cards combined</div></div>
            </div>

            <div className="section">
              <div className="section-head"><h3>By Category</h3></div>
              <table className="data-table">
                <thead><tr><th>Category</th><th>Actual</th><th>Budget</th><th>Status</th></tr></thead>
                <tbody>
                  {Object.entries(byCat(allCcTx)).sort(([, a], [, b]) => b - a).map(([cat, actual]) => {
                    const plan = budget[cat] || 0
                    return (<tr key={cat}><td>{cat}</td><td className="num">{fmt(actual)}</td><td className="num muted">{plan ? fmt(plan) : '—'}</td><td>{plan && actual > plan ? <span className="badge-warn">Over</span> : plan ? <span className="badge-ok">OK</span> : <span className="muted">—</span>}</td></tr>)
                  })}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-head"><h3>All CC Transactions ({allCcTx.length})</h3></div>
              {allCcTx.length === 0
                ? <p className="empty-msg">No CC transactions for {selectedMonth}. Upload your Scotia Visa or CIBC CSV.</p>
                : <div className="tx-list">
                    {allCcTx.sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                      <div key={t.id} className="tx-row">
                        <span className="tx-date">{t.date.slice(5)}</span>
                        <span className="tx-merchant">{t.merchant}</span>
                        <span className="tx-tag">{t.account === 'SR_CIBC' ? 'CIBC' : 'Visa'}</span>
                        <span className="tx-amt red">{fmt(t.amount)}</span>
                        <select className="tx-cat-sel" value={t.category || ''} onChange={e => updateCat(t.id, e.target.value)}>
                          {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ══════════ INVESTMENTS TAB ══════════ */}
        {activeTab === 'investments' && (
          <div className="view">
            <div className="inv-head">
              <h2>Wealthsimple Portfolio</h2>
              {investments?.lastUpdated && <span className="hint">As of {investments.lastUpdated}</span>}
              <button className="btn-outline" onClick={() => { setUploadAccount('WEALTHSIMPLE'); setShowUpload(true) }}>↑ Update</button>
            </div>

            {!investments
              ? <div className="empty-state"><p>Upload your Wealthsimple holdings CSV to track your portfolio.</p><button className="btn-primary" onClick={() => { setUploadAccount('WEALTHSIMPLE'); setShowUpload(true) }}>Upload Now</button></div>
              : <>
                  <div className="kpi-row">
                    {[
                      { label: 'FHSA',           value: investments.FHSA,              sub: 'First Home Savings' },
                      { label: 'TFSA',           value: investments.TFSA,              sub: 'Tax-Free Savings'   },
                      { label: 'RRSP',           value: investments.RRSP,              sub: 'Retirement Savings' },
                      { label: 'Non-Registered', value: investments['Non-Registered'], sub: 'NVDA · SOXL · KVYO' },
                    ].map(({ label, value, sub }) => (
                      <div key={label} className="kpi-card"><div className="kpi-label">{label}</div><div className="kpi-value kpi-accent">{fmt(value)}</div><div className="kpi-sub">{sub}</div></div>
                    ))}
                  </div>
                  <div className="section">
                    <div className="section-head"><h3>Net Worth Breakdown</h3></div>
                    <div className="nw-breakdown">
                      {[
                        { label: 'SR Scotia Bank (est.)',         value: srBalance                   },
                        { label: 'NR Scotia Bank (est.)',         value: nrBalance                   },
                        { label: 'FHSA',                         value: investments.FHSA             },
                        { label: 'TFSA',                         value: investments.TFSA             },
                        { label: 'RRSP',                         value: investments.RRSP             },
                        { label: 'Non-Registered (Wealthsimple)',value: investments['Non-Registered']},
                      ].map(({ label, value }) => (
                        <div key={label} className="nw-line"><span>{label}</span><span className="green">{fmt(value)}</span></div>
                      ))}
                      <div className="nw-total"><span>Total Net Worth</span><span className="accent">{fmt(netWorth)}</span></div>
                    </div>
                  </div>
                  <div className="section">
                    <div className="section-head"><h3>Strategy Notes</h3></div>
                    <div className="strategy-cards">
                      <div className="strat-card strat-warn">
                        <div className="strat-title">⚠️ SOXL Risk Alert</div>
                        <p>Your non-registered account holds SOXL — a 3× leveraged semiconductor ETF. It can drop 60–80% in a downturn due to daily rebalancing decay. With two kids, a vehicle loan, and daycare costs, review whether this risk level suits your family situation.</p>
                      </div>
                      <div className="strat-card strat-tip">
                        <div className="strat-title">💡 FHSA Opportunity</div>
                        <p>Your FHSA is at {fmt(investments.FHSA)}. Annual room is $8,000 and lifetime is $40,000. Ensure Navneet also has her own FHSA — combined you can shelter $80,000 tax-free for your first home purchase.</p>
                      </div>
                      <div className="strat-card strat-tip">
                        <div className="strat-title">📈 RRSP Tax Savings</div>
                        <p>At your SR income of ~$96K/year, every RRSP dollar saves you roughly 30–33 cents in tax. Priority order: FHSA first (double benefit), then RRSP, then TFSA.</p>
                      </div>
                    </div>
                  </div>
                </>
            }
          </div>
        )}

        {/* ══════════ ANNUAL TAB ══════════ */}
        {activeTab === 'annual' && (() => {
          const months  = ['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => `2026-${m}`)
          const mNames  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          const rows = [
            { label: 'SR Income',    fn: m => sumCats(getTx(m,'SR_BANK'), INCOME_CATS), cls: 'green'      },
            { label: 'NR Income',    fn: m => sumCats(getTx(m,'NR_BANK'), INCOME_CATS), cls: 'green'      },
            { label: 'Total Income', fn: m => sumCats([...getTx(m,'SR_BANK'),...getTx(m,'NR_BANK')], INCOME_CATS), cls: 'green', bold: true },
            { label: 'Fixed Exp.',   fn: m => sumCats([...getTx(m,'SR_BANK'),...getTx(m,'NR_BANK')], FIXED_CATS),  cls: 'red'        },
            { label: 'CC Spend',     fn: m => [...getTx(m,'SR_CC'),...getTx(m,'SR_CIBC')].reduce((s,t)=>s+t.amount,0), cls: 'red'   },
            { label: 'Savings',      fn: m => sumCats([...getTx(m,'SR_BANK'),...getTx(m,'NR_BANK')], SAVINGS_CATS), cls: 'blue', bold: true },
          ]
          return (
            <div className="view">
              <h2 className="view-title">2026 Annual Summary</h2>
              <div className="annual-wrap">
                <table className="annual-table">
                  <thead>
                    <tr><th>Item</th>{mNames.map(m => <th key={m}>{m}</th>)}<th>Total</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(({ label, fn, cls, bold }) => {
                      const vals  = months.map(fn)
                      const total = vals.reduce((s, v) => s + v, 0)
                      return (
                        <tr key={label} className={bold ? 'bold-row' : ''}>
                          <td className={cls}>{label}</td>
                          {vals.map((v, i) => <td key={i} className={`num ${cls}`}>{v > 0 ? '$' + Math.round(v).toLocaleString() : '—'}</td>)}
                          <td className={`num ${cls} bold`}>${Math.round(total).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

      </main>

      <footer className="footer">
        <span className="muted">Rathore Household · {new Date().getFullYear()}</span>
        <button className="btn-danger" onClick={() => {
          if (window.confirm('Clear ALL data? This cannot be undone.')) {
            setTransactions([]); setInvestments(null); setOpeningBal({})
          }
        }}>Clear All Data</button>
      </footer>
    </div>
  )
}