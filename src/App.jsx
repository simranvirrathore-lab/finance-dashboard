import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: "sr_scotia_bank",  label: "SR Scotia Bank",                      type: "bank" },
  { id: "nr_scotia_bank",  label: "NR Scotia Bank",                      type: "bank" },
  { id: "sr_scotia_visa",  label: "SR Scotia Momentum Infinite Visa",    type: "cc"   },
  { id: "sr_cibc_mc",      label: "SR CIBC Costco Mastercard",           type: "cc"   },
  { id: "sr_tangerine",    label: "SR Tangerine",                        type: "cc"   },
];

const INVEST_ACCOUNTS = [
  { id: "sr_fhsa",         label: "SR FHSA"           },
  { id: "sr_tfsa",         label: "SR TFSA"           },
  { id: "resp_gurshaan",   label: "RESP — Gurshaan"   },
  { id: "resp_gurnadar",   label: "RESP — Gurnadar"   },
  { id: "nr_fhsa",         label: "NR FHSA"           },
  { id: "nr_rrsp",         label: "NR RRSP"           },
];

// ─── DEFAULT CATEGORIES ──────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = {
  income: [
    {
      head: "Simranvir Rathore",
      subs: ["SR Salary", "Car Reimbursement", "Other Income"],
      budget: { "SR Salary": 8000, "Car Reimbursement": 250, "Other Income": 0 },
    },
    {
      head: "Navneet Rathore",
      subs: ["NR DS Paycheck", "Canada Child Benefit", "Other Income"],
      budget: { "NR DS Paycheck": 6700, "Canada Child Benefit": 967, "Other Income": 0 },
    },
  ],
  expenses: [
    { head: "Home",           subs: ["Rent", "Utilities"],                                                                                  budget: { Rent: 3000, Utilities: 0 } },
    { head: "Transportation", subs: ["Tesla Loan", "Tesla ICBC", "Van ICBC", "Gas", "Tesla App"],                                          budget: { "Tesla Loan": 644, "Tesla ICBC": 289, "Van ICBC": 180, Gas: 250, "Tesla App": 16 } },
    { head: "Family",         subs: ["Gurshaan School Fees", "Gurnadar Daycare", "Baby Supplies", "Kids Activities"],                      budget: { "Gurshaan School Fees": 450, "Gurnadar Daycare": 850, "Baby Supplies": 100, "Kids Activities": 50 } },
    { head: "Debt & Banking", subs: ["Student Loan", "Bank Fees"],                                                                         budget: { "Student Loan": 153, "Bank Fees": 17 } },
    { head: "Food & Dining",  subs: ["Groceries", "Dining Out"],                                                                           budget: { Groceries: 1150, "Dining Out": 300 } },
    { head: "Health",         subs: ["Pharmacy & Medical", "Wellness & Beauty", "YMCA"],                                                   budget: { "Pharmacy & Medical": 100, "Wellness & Beauty": 60, YMCA: 54 } },
    { head: "Shopping",       subs: ["Amazon Purchases", "Clothing", "Household / Dollarama"],                                             budget: { "Amazon Purchases": 150, Clothing: 150, "Household / Dollarama": 150 } },
    { head: "Digital",        subs: ["Fido Mobile", "Telus Internet", "Apple / iCloud", "ChatGPT", "Amazon Prime", "Netflix", "Gmail"],    budget: { "Fido Mobile": 104, "Telus Internet": 65, "Apple / iCloud": 35, ChatGPT: 25, "Amazon Prime": 10, Netflix: 9, Gmail: 2 } },
    { head: "Charity",        subs: ["Charity / Donations"],                                                                               budget: { "Charity / Donations": 50 } },
    { head: "Custom / Misc",  subs: ["Miscellaneous"],                                                                                     budget: { Miscellaneous: 60 } },
  ],
  savings: [
    { head: "SR FHSA",        budget: 650 },
    { head: "SR TFSA",        budget: 500 },
    { head: "NR FHSA",        budget: 0   },
    { head: "NR RRSP",        budget: 0   },
    { head: "Gurshaan RESP",  budget: 300 },
    { head: "Gurnadar RESP",  budget: 220 },
  ],
};

// ─── AUTO-CATEGORIZATION ─────────────────────────────────────────────────────

const AUTO_RULES = [
  { match: /gobind.marg|gobind marg/i,                         main: "Family",             sub: "Gurshaan School Fees",   section: "expenses" },
  { match: /slc.pad|slc student|student loan canada/i,         main: "Debt & Banking",     sub: "Student Loan",           section: "expenses" },
  { match: /rbc.loan|rbc.*auto/i,                              main: "Transportation",     sub: "Tesla Loan",             section: "expenses" },
  { match: /savreentoor/i,                                     main: "Home",               sub: "Rent",                   section: "expenses" },
  { match: /canada.*child|ccb.*benefit/i,                      main: "Navneet Rathore",    sub: "Canada Child Benefit",   section: "income"   },
  { match: /pacific.blue.cross/i,                              main: "Navneet Rathore",    sub: "Other Income",           section: "income"   },
  { match: /fido/i,                                            main: "Digital",            sub: "Fido Mobile",            section: "expenses" },
  { match: /telus/i,                                           main: "Digital",            sub: "Telus Internet",         section: "expenses" },
  { match: /apple\.com|icloud/i,                               main: "Digital",            sub: "Apple / iCloud",         section: "expenses" },
  { match: /chatgpt|openai/i,                                  main: "Digital",            sub: "ChatGPT",                section: "expenses" },
  { match: /amazon prime|amznprime/i,                          main: "Digital",            sub: "Amazon Prime",           section: "expenses" },
  { match: /netflix/i,                                         main: "Digital",            sub: "Netflix",                section: "expenses" },
  { match: /google.*storage|gmail.*storage/i,                  main: "Digital",            sub: "Gmail",                  section: "expenses" },
  { match: /ymca/i,                                            main: "Health",             sub: "YMCA",                   section: "expenses" },
  { match: /shoppers|pharma|drug mart/i,                       main: "Health",             sub: "Pharmacy & Medical",     section: "expenses" },
  { match: /costco.gas|gas.stn|gas.station/i,                  main: "Transportation",     sub: "Gas",                    section: "expenses" },
  { match: /remitly/i,                                         main: "Custom / Misc",      sub: "Miscellaneous",          section: "expenses" },
  { match: /daycare|ecds|child.care/i,                         main: "Family",             sub: "Gurnadar Daycare",       section: "expenses" },
  { match: /amazon(?!.prime)/i,                                main: "Shopping",           sub: "Amazon Purchases",       section: "expenses" },
  { match: /dollarama/i,                                       main: "Shopping",           sub: "Household / Dollarama",  section: "expenses" },
  { match: /crd\.card|credit.card.pay|card.payment|card bill/i,main: "TRANSFER",           sub: "CC Payment",             section: "transfer" },
  { match: /scotiabank.*transit|interac.*e-trans|abm.*interac/i,main: "TRANSFER",          sub: "Transfer — Exclude",     section: "transfer" },
  { match: /cibc.*card|card.*cibc/i,                           main: "TRANSFER",           sub: "CC Payment",             section: "transfer" },
  { match: /delta.sd|delta school dist/i,                      main: "Navneet Rathore",    sub: "NR DS Paycheck",         section: "income"   },
];

function autoCategorize(description, amount, accountId) {
  const desc = (description || "").toLowerCase();

  // MB-DEP (direct deposit) rules
  if (/mb-dep|mb dep/.test(desc)) {
    if (accountId === "sr_scotia_bank") {
      return Math.abs(amount) > 300
        ? { main: "Simranvir Rathore", sub: "SR Salary",         section: "income" }
        : { main: "Simranvir Rathore", sub: "Car Reimbursement", section: "income" };
    }
    if (accountId === "nr_scotia_bank") {
      return { main: "Navneet Rathore", sub: "NR DS Paycheck", section: "income" };
    }
  }

  // ICBC — distinguish by amount
  if (/icbc|insurance corporation/i.test(desc)) {
    const abs = Math.abs(amount);
    return abs >= 200
      ? { main: "Transportation", sub: "Tesla ICBC", section: "expenses" }
      : { main: "Transportation", sub: "Van ICBC",   section: "expenses" };
  }

  // Tesla App (small CC charge)
  if (/tesla/i.test(desc) && Math.abs(amount) < 50) {
    return { main: "Transportation", sub: "Tesla App", section: "expenses" };
  }

  // Run general rules
  for (const rule of AUTO_RULES) {
    if (rule.match.test(desc)) {
      return { main: rule.main, sub: rule.sub, section: rule.section };
    }
  }

  return null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency", currency: "CAD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

function fmtFull(n) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency", currency: "CAD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function toMonthKey(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d)) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

function shortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function getActualColor(actual, budget, type) {
  if (!actual || actual === 0) return "neutral";
  if (!budget || budget === 0) return actual > 0 ? "neutral" : "neutral";
  const r = actual / budget;
  if (type === "expense") {
    if (r <= 1.0) return "green";
    if (r <= 1.2) return "amber";
    return "red";
  }
  // income or savings — more is better
  if (r >= 1.0) return "green";
  if (r >= 0.8) return "amber";
  return "red";
}

function colorCls(color) {
  return { green: "c-green", amber: "c-amber", red: "c-red", neutral: "c-muted" }[color] || "c-muted";
}

function accountLabel(id) {
  return ACCOUNTS.find(a => a.id === id)?.label || id;
}

// ─── CSV PARSING ─────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function parseCSV(text, accountId) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());

  const idx = (terms) => header.findIndex(h => terms.some(t => h.includes(t)));

  const dateIdx   = idx(["date"]);
  const descIdx   = idx(["description", "narrative", "merchant", "name", "payee"]);
  const amtIdx    = idx(["amount", "transaction amount"]);
  const debitIdx  = idx(["debit", "withdrawal"]);
  const creditIdx = idx(["credit", "deposit"]);

  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 2) continue;

    const rawDate = (cells[dateIdx >= 0 ? dateIdx : 0] || "").replace(/"/g, "").trim();
    const desc    = (cells[descIdx >= 0 ? descIdx : 1] || "").replace(/"/g, "").trim();
    let amount    = 0;

    if (debitIdx >= 0 && creditIdx >= 0) {
      const deb = parseFloat((cells[debitIdx]  || "").replace(/[",\s]/g, "")) || 0;
      const crd = parseFloat((cells[creditIdx] || "").replace(/[",\s]/g, "")) || 0;
      amount = crd - deb;
    } else {
      amount = parseFloat((cells[amtIdx >= 0 ? amtIdx : 2] || "").replace(/[",\s]/g, "")) || 0;
    }

    if (!rawDate || !desc) continue;

    // Parse date flexibly
    let d = new Date(rawDate);
    if (isNaN(d)) {
      const parts = rawDate.split(/[\/\-\.]/);
      if (parts.length === 3) {
        // Try MM/DD/YYYY and DD/MM/YYYY
        d = new Date(`${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`);
        if (isNaN(d)) d = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
      }
    }
    if (isNaN(d)) continue;

    const dateStr  = d.toISOString().split("T")[0];
    const monthKey = toMonthKey(dateStr);
    const cat      = autoCategorize(desc, amount, accountId);

    results.push({
      id:            `${Date.now()}-${i}-${Math.random().toString(36).slice(2,7)}`,
      date:          dateStr,
      month:         monthKey,
      account:       accountId,
      description:   desc,
      amount:        amount,
      mainCategory:  cat?.main  || "",
      subCategory:   cat?.sub   || "",
      section:       cat?.section || (amount >= 0 ? "income" : "expenses"),
      remarks:       "",
      isTransfer:    cat?.section === "transfer",
      autoDetected:  !!cat,
    });
  }

  return results;
}

function parseInvestmentCSV(text, accountId) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());

  const idx = (terms) => header.findIndex(h => terms.some(t => h.includes(t)));
  const symIdx  = idx(["symbol", "ticker"]);
  const nameIdx = idx(["name", "description", "security", "holding"]);
  const qtyIdx  = idx(["qty", "quantity", "shares", "units"]);
  const bookIdx = idx(["book", "cost", "acb"]);
  const mktIdx  = idx(["market", "value", "current"]);

  return lines.slice(1).map((line, i) => {
    const cells = parseCSVLine(line);
    const qty   = parseFloat((cells[qtyIdx]  || "").replace(/[",]/g, "")) || 0;
    const book  = parseFloat((cells[bookIdx] || "").replace(/[",]/g, "")) || 0;
    const mkt   = parseFloat((cells[mktIdx]  || "").replace(/[",]/g, "")) || 0;
    return {
      id:          `inv-${Date.now()}-${i}`,
      account:     accountId,
      symbol:      (cells[symIdx]  || "").replace(/"/g, "").trim() || "—",
      name:        (cells[nameIdx] || "").replace(/"/g, "").trim() || "—",
      qty, bookValue: book, marketValue: mkt,
    };
  }).filter(r => r.qty > 0 || r.bookValue > 0 || r.marketValue > 0);
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");

  const nowKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  })();

  const [selectedMonth, setSelectedMonth] = useState(nowKey);
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

  const load = (key, def) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  };

  const [transactions,  setTransactions]  = useState(() => load("rf_transactions", []));
  const [categories,    setCategories]    = useState(() => load("rf_categories", null) || DEFAULT_CATEGORIES);
  const [investments,   setInvestments]   = useState(() => load("rf_investments", []));
  const [toast,         setToast]         = useState(null);

  useEffect(() => { localStorage.setItem("rf_transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("rf_categories",   JSON.stringify(categories));   }, [categories]);
  useEffect(() => { localStorage.setItem("rf_investments",  JSON.stringify(investments));  }, [investments]);

  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function prevMonth() {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,"0")}`);
  }
  function nextMonth() {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(m === 12 ? `${y+1}-01` : `${y}-${String(m+1).padStart(2,"0")}`);
  }

  function addTransactions(newTxs) {
    setTransactions(prev => {
      const existing = new Set(prev.map(t => `${t.date}|${t.description}|${t.amount}`));
      const toAdd = newTxs.filter(t => !existing.has(`${t.date}|${t.description}|${t.amount}`));
      showToast(`${toAdd.length} new transaction${toAdd.length !== 1 ? "s" : ""} imported${newTxs.length - toAdd.length > 0 ? ` (${newTxs.length - toAdd.length} duplicates skipped)` : ""}`);
      return [...prev, ...toAdd];
    });
  }

  function updateTransaction(id, updates) {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      // Keep month in sync with date
      if (updates.date) updated.month = toMonthKey(updates.date);
      return updated;
    }));
  }

  function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  function clearMonth(key) {
    setTransactions(prev => prev.filter(t => t.month !== key));
    showToast(`Cleared all data for ${monthLabel(key)}`);
  }

  function bulkReCategorize(description, main, sub, section) {
    const lower = description.toLowerCase();
    let count = 0;
    setTransactions(prev => prev.map(t => {
      if (t.description.toLowerCase() === lower && (t.mainCategory !== main || t.subCategory !== sub)) {
        count++;
        return { ...t, mainCategory: main, subCategory: sub, section, isTransfer: section === "transfer" };
      }
      return t;
    }));
    showToast(`Applied to ${count} similar transaction${count !== 1 ? "s" : ""}`);
  }

  const uncategorizedCount = transactions
    .filter(t => t.month === selectedMonth && !t.mainCategory && !t.isTransfer).length;

  return (
    <div className="app-root">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <nav className="tab-bar">
        {[
          { id: "overview",     label: "Overview",     icon: "⊞" },
          { id: "transactions", label: "Transactions",  icon: "≡" },
          { id: "investments",  label: "Investments",   icon: "◈" },
          { id: "annual",       label: "Annual",        icon: "▦" },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
            {tab.id === "transactions" && uncategorizedCount > 0 && (
              <span className="tab-badge">{uncategorizedCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === "overview" && (
          <OverviewTab
            transactions={transactions}
            categories={categories}
            selectedMonth={selectedMonth}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onGoToTransactions={() => setActiveTab("transactions")}
          />
        )}
        {activeTab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            categories={categories}
            selectedMonth={selectedMonth}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onAddTransactions={addTransactions}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            onClearMonth={clearMonth}
            onBulkReCategorize={bulkReCategorize}
            onCategoriesChange={setCategories}
            showToast={showToast}
          />
        )}
        {activeTab === "investments" && (
          <InvestmentsTab
            investments={investments}
            onInvestmentsChange={setInvestments}
            showToast={showToast}
          />
        )}
        {activeTab === "annual" && (
          <AnnualTab
            transactions={transactions}
            categories={categories}
            selectedYear={selectedYear}
            onPrevYear={() => setSelectedYear(y => y - 1)}
            onNextYear={() => setSelectedYear(y => y + 1)}
          />
        )}
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ transactions, categories, selectedMonth, onPrevMonth, onNextMonth, onGoToTransactions }) {
  const [expanded, setExpanded] = useState({ savings: false, transfers: false });

  function toggle(key) { setExpanded(p => ({ ...p, [key]: !p[key] })); }

  const [headExp, setHeadExp] = useState({});
  function toggleHead(key) { setHeadExp(p => ({ ...p, [key]: !p[key] })); }

  const allTxs     = transactions.filter(t => t.month === selectedMonth);
  const nonTf      = allTxs.filter(t => !t.isTransfer);
  const tfTxs      = allTxs.filter(t => t.isTransfer);

  function sumActual(section, mainCat, subCat) {
    return nonTf
      .filter(t =>
        t.section === section &&
        (!mainCat || t.mainCategory === mainCat) &&
        (!subCat  || t.subCategory  === subCat)
      )
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }

  // Totals
  const totalIncomeBudget = categories.income.reduce((s, h) => s + Object.values(h.budget).reduce((a,b)=>a+b,0), 0);
  const totalIncomeActual = sumActual("income");
  const totalExpBudget    = categories.expenses.reduce((s, h) => s + Object.values(h.budget).reduce((a,b)=>a+b,0), 0);
  const totalExpActual    = sumActual("expenses");
  const totalSavBudget    = categories.savings.reduce((s, h) => s + h.budget, 0);
  const totalSavActual    = sumActual("savings");
  const unallocated       = totalIncomeActual - totalExpActual - totalSavActual;

  // Bank rows
  const srTxs = allTxs.filter(t => t.account === "sr_scotia_bank");
  const nrTxs = allTxs.filter(t => t.account === "nr_scotia_bank");

  return (
    <div className="tab-pane">
      {/* Month bar */}
      <div className="month-bar">
        <div className="month-nav">
          <button className="btn-ghost" onClick={onPrevMonth}>◀</button>
          <span className="month-label">{monthLabel(selectedMonth)}</span>
          <button className="btn-ghost" onClick={onNextMonth}>▶</button>
        </div>
        <button className="btn-ghost btn-sm" onClick={onGoToTransactions}>⬆ Upload CSV</button>
      </div>

      {/* Bank accounts */}
      <div className="card mb-3">
        <div className="acc-col-header">
          <span className="acc-label-col section-title">🏦 Bank Accounts</span>
          <span className="bank-col-hdr">Opening</span>
          <span className="bank-col-hdr">Credits</span>
          <span className="bank-col-hdr">Debits</span>
          <span className="bank-col-hdr">Closing</span>
        </div>
        <BankRow label="SR Scotia Bank" txs={srTxs} />
        <BankRow label="NR Scotia Bank" txs={nrTxs} isLast />
      </div>

      {/* Summary tiles */}
      <div className="tiles-row mb-3">
        <SummaryTile
          label="Total Income"
          budget={totalIncomeBudget}
          actual={totalIncomeActual}
          type="income"
        />
        <SummaryTile
          label="Total Expenses"
          budget={totalExpBudget}
          actual={totalExpActual}
          type="expense"
          showBar
        />
        <SummaryTile
          label="Total Savings"
          budget={totalSavBudget}
          actual={totalSavActual}
          type="savings"
        />
        <div className="tile">
          <div className="tile-label">Unallocated</div>
          <div className={`tile-value ${unallocated >= 0 ? "c-green" : "c-red"}`}>
            {unallocated < 0 ? "−" : ""}{fmt(Math.abs(unallocated))}
          </div>
          <div className="tile-sub">Income − Expenses − Savings</div>
        </div>
      </div>

      {/* Accordion */}
      <div className="card acc-card">
        {/* Column header row */}
        <div className="acc-col-header">
          <span className="acc-label-col">Category</span>
          <span className="acc-num-col hdr">Budgeted</span>
          <span className="acc-num-col hdr">Actual</span>
        </div>

        {/* ── INCOME ── */}
        <div className="acc-section-row">
          <span className="acc-section-icon">↑</span>
          <span className="acc-label-col acc-section-name">Income</span>
          <span className="acc-num-col c-muted">{fmt(totalIncomeBudget)}</span>
          <span className={`acc-num-col ${colorCls(getActualColor(totalIncomeActual, totalIncomeBudget, "income"))}`}>
            {totalIncomeActual > 0 ? fmt(totalIncomeActual) : "—"}
          </span>
        </div>

        {categories.income.map(h => {
          const hBudget = Object.values(h.budget).reduce((a,b)=>a+b,0);
          const hActual = sumActual("income", h.head);
          const color   = getActualColor(hActual, hBudget, "income");
          const key     = `inc-${h.head}`;
          return (
            <div key={h.head}>
              <div className="acc-head-row" onClick={() => toggleHead(key)}>
                <span className="acc-chev">{headExp[key] ? "▾" : "▸"}</span>
                <span className="acc-label-col">{h.head}</span>
                <span className="acc-num-col c-muted">{fmt(hBudget)}</span>
                <span className={`acc-num-col ${colorCls(color)}`}>{hActual > 0 ? fmt(hActual) : "—"}</span>
              </div>
              {headExp[key] && h.subs.map(sub => {
                const sBudget = h.budget[sub] || 0;
                const sActual = sumActual("income", h.head, sub);
                return (
                  <div key={sub} className="acc-item-row">
                    <span className="acc-label-col acc-item-name">{sub}</span>
                    <span className="acc-num-col c-muted">{sBudget > 0 ? fmt(sBudget) : "—"}</span>
                    <span className={`acc-num-col ${colorCls(getActualColor(sActual, sBudget, "income"))}`}>
                      {sActual > 0 ? fmt(sActual) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── EXPENSES ── */}
        <div className="acc-section-row">
          <span className="acc-section-icon">↓</span>
          <span className="acc-label-col acc-section-name">Expenses</span>
          <span className="acc-num-col c-muted">{fmt(totalExpBudget)}</span>
          <span className={`acc-num-col ${colorCls(getActualColor(totalExpActual, totalExpBudget, "expense"))}`}>
            {totalExpActual > 0 ? fmt(totalExpActual) : "—"}
          </span>
        </div>

        {categories.expenses.map(h => {
          const hBudget = Object.values(h.budget).reduce((a,b)=>a+b,0);
          const hActual = nonTf.filter(t => t.section === "expenses" && t.mainCategory === h.head)
            .reduce((s,t) => s + Math.abs(t.amount), 0);
          const color = getActualColor(hActual, hBudget, "expense");
          const key   = `exp-${h.head}`;
          return (
            <div key={h.head}>
              <div className="acc-head-row" onClick={() => toggleHead(key)}>
                <span className="acc-chev">{headExp[key] ? "▾" : "▸"}</span>
                <span className="acc-label-col">{h.head}</span>
                <span className="acc-num-col c-muted">{fmt(hBudget)}</span>
                <span className={`acc-num-col ${colorCls(color)}`}>{hActual > 0 ? fmt(hActual) : "—"}</span>
              </div>
              {headExp[key] && h.subs.map(sub => {
                const sBudget = h.budget[sub] || 0;
                const sActual = nonTf.filter(t => t.section === "expenses" && t.mainCategory === h.head && t.subCategory === sub)
                  .reduce((s,t) => s + Math.abs(t.amount), 0);
                return (
                  <div key={sub} className="acc-item-row">
                    <span className="acc-label-col acc-item-name">{sub}</span>
                    <span className="acc-num-col c-muted">{sBudget > 0 ? fmt(sBudget) : "—"}</span>
                    <span className={`acc-num-col ${colorCls(getActualColor(sActual, sBudget, "expense"))}`}>
                      {sActual > 0 ? fmt(sActual) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── SAVINGS ── */}
        <div className="acc-section-row clickable" onClick={() => toggle("savings")}>
          <span className="acc-chev">{expanded.savings ? "▾" : "▸"}</span>
          <span className="acc-label-col acc-section-name">Savings</span>
          <span className="acc-num-col c-muted">{fmt(totalSavBudget)}</span>
          <span className={`acc-num-col ${colorCls(getActualColor(totalSavActual, totalSavBudget, "savings"))}`}>
            {totalSavActual > 0 ? fmt(totalSavActual) : "—"}
          </span>
        </div>
        {expanded.savings && categories.savings.map(s => {
          const sActual = sumActual("savings", s.head);
          return (
            <div key={s.head} className="acc-item-row">
              <span className="acc-label-col acc-item-name">{s.head}</span>
              <span className="acc-num-col c-muted">{s.budget > 0 ? fmt(s.budget) : "—"}</span>
              <span className={`acc-num-col ${colorCls(getActualColor(sActual, s.budget, "savings"))}`}>
                {sActual > 0 ? fmt(sActual) : "—"}
              </span>
            </div>
          );
        })}

        {/* ── TRANSFERS ── */}
        <div className="acc-section-row clickable dimmed" onClick={() => toggle("transfers")}>
          <span className="acc-chev">{expanded.transfers ? "▾" : "▸"}</span>
          <span className="acc-label-col acc-section-name">Transfers — excluded from calculations</span>
          <span className="acc-num-col">—</span>
          <span className="acc-num-col">—</span>
        </div>
        {expanded.transfers && (
          tfTxs.length === 0
            ? <div className="acc-item-row"><span className="acc-label-col acc-item-name c-muted">No transfers this month</span><span className="acc-num-col">—</span><span className="acc-num-col">—</span></div>
            : tfTxs.map(t => (
              <div key={t.id} className="acc-item-row">
                <span className="acc-label-col acc-item-name">{t.description}</span>
                <span className="acc-num-col c-muted">—</span>
                <span className="acc-num-col c-muted">{fmt(Math.abs(t.amount))}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function BankRow({ label, txs, isLast }) {
  const credits = txs.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const debits  = txs.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
  return (
    <div className={`bank-row${isLast ? " last" : ""}`}>
      <span className="acc-label-col bank-name">{label}</span>
      <span className="bank-col c-muted">—</span>
      <span className="bank-col c-green">+{fmt(credits)}</span>
      <span className="bank-col c-red">−{fmt(debits)}</span>
      <span className="bank-col" style={{ fontWeight: 500 }}>{fmt(credits - debits)}</span>
    </div>
  );
}

function SummaryTile({ label, budget, actual, type, showBar }) {
  const color = getActualColor(actual, budget, type);
  const pct   = budget > 0 ? Math.min(Math.round((actual / budget) * 100), 100) : 0;
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className={`tile-value ${colorCls(color)}`}>{fmt(actual)}</div>
      <div className="tile-sub">Budget {fmt(budget)} · {pct}%</div>
      {showBar && (
        <div className="tile-bar">
          <div className={`tile-bar-fill bar-${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── TRANSACTIONS TAB ────────────────────────────────────────────────────────

function TransactionsTab({
  transactions, categories, selectedMonth,
  onPrevMonth, onNextMonth,
  onAddTransactions, onUpdateTransaction, onDeleteTransaction,
  onClearMonth, onBulkReCategorize, onCategoriesChange, showToast,
}) {
  const [uploadAccount, setUploadAccount] = useState("sr_scotia_bank");
  const [filterAccount, setFilterAccount] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [search,        setSearch]        = useState("");
  const [showCatMgr,    setShowCatMgr]    = useState(false);
  const [clearMonthSel, setClearMonthSel] = useState("");
  const [editingCell,   setEditingCell]   = useState(null);
  const [bulkPrompt,    setBulkPrompt]    = useState(null);
  const fileRef = useRef();

  const monthTxs   = transactions.filter(t => t.month === selectedMonth);
  const uncatCount = monthTxs.filter(t => !t.mainCategory && !t.isTransfer).length;

  const filtered = monthTxs
    .filter(t => !filterAccount || t.account === filterAccount)
    .filter(t => !filterSection || t.section === filterSection)
    .filter(t => !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.mainCategory.toLowerCase().includes(search.toLowerCase()) ||
      (t.remarks || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const allMainCats = [
    ...categories.income.map(h   => ({ main: h.head,  section: "income"   })),
    ...categories.expenses.map(h => ({ main: h.head,  section: "expenses" })),
    ...categories.savings.map(h  => ({ main: h.head,  section: "savings"  })),
    { main: "TRANSFER", section: "transfer" },
  ];

  function getSubsFor(mainCat) {
    const ih = categories.income.find(h  => h.head === mainCat);   if (ih) return ih.subs;
    const eh = categories.expenses.find(h => h.head === mainCat);  if (eh) return eh.subs;
    const sh = categories.savings.find(h  => h.head === mainCat);  if (sh) return [sh.head];
    if (mainCat === "TRANSFER") return ["CC Payment", "Transfer — Exclude"];
    return [];
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const txs = parseCSV(ev.target.result, uploadAccount);
      onAddTransactions(txs);
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  function handleCellEdit(txId, field, value) {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const updates = { [field]: value };

    if (field === "mainCategory") {
      const found = allMainCats.find(c => c.main === value);
      updates.section    = found?.section || tx.section;
      updates.isTransfer = found?.section === "transfer";
      updates.subCategory = "";
    }

    onUpdateTransaction(txId, updates);

    // Offer bulk apply when category changes
    if (field === "mainCategory" || field === "subCategory") {
      const newMain = field === "mainCategory" ? value : tx.mainCategory;
      const newSub  = field === "subCategory"  ? value : tx.subCategory;
      const found   = allMainCats.find(c => c.main === newMain);
      const section = found?.section || tx.section;

      const similar = transactions.filter(t =>
        t.id !== txId &&
        t.description.toLowerCase() === tx.description.toLowerCase() &&
        (t.mainCategory !== newMain || t.subCategory !== newSub)
      ).length;

      if (similar > 0) {
        setBulkPrompt({ description: tx.description, main: newMain, sub: newSub, section, count: similar });
      }
    }
  }

  function applyBulk() {
    if (!bulkPrompt) return;
    onBulkReCategorize(bulkPrompt.description, bulkPrompt.main, bulkPrompt.sub, bulkPrompt.section);
    setBulkPrompt(null);
  }

  function addManual() {
    const now = new Date();
    onAddTransactions([{
      id:           `manual-${Date.now()}`,
      date:         now.toISOString().split("T")[0],
      month:        selectedMonth,
      account:      uploadAccount,
      description:  "",
      amount:       0,
      mainCategory: "",
      subCategory:  "",
      section:      "expenses",
      remarks:      "",
      isTransfer:   false,
      autoDetected: false,
    }]);
  }

  const availableMonths = [...new Set(transactions.map(t => t.month))].sort().reverse();

  return (
    <div className="tab-pane">
      {/* Bulk apply bar */}
      {bulkPrompt && (
        <div className="bulk-bar">
          <span>Apply <strong>{bulkPrompt.main} / {bulkPrompt.sub}</strong> to {bulkPrompt.count} similar transaction{bulkPrompt.count !== 1 ? "s" : ""}?</span>
          <button className="btn-ghost btn-sm" onClick={applyBulk}>Apply All</button>
          <button className="btn-ghost btn-sm" onClick={() => setBulkPrompt(null)}>Dismiss</button>
        </div>
      )}

      {/* Top bar */}
      <div className="month-bar">
        <div className="month-nav">
          <button className="btn-ghost" onClick={onPrevMonth}>◀</button>
          <span className="month-label">{monthLabel(selectedMonth)}</span>
          <button className="btn-ghost" onClick={onNextMonth}>▶</button>
        </div>
        <div className="top-actions">
          <select className="sel" value={uploadAccount} onChange={e => setUploadAccount(e.target.value)}>
            {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <button className="btn-ghost btn-sm" onClick={() => fileRef.current.click()}>⬆ Upload CSV</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileUpload} />
          <button className="btn-ghost btn-sm" onClick={addManual}>+ Add</button>
          <button className={`btn-ghost btn-sm${showCatMgr ? " active" : ""}`} onClick={() => setShowCatMgr(s => !s)}>⚙ Categories</button>
        </div>
      </div>

      {/* Category manager */}
      {showCatMgr && (
        <CategoryManager
          categories={categories}
          onChange={onCategoriesChange}
          onClose={() => setShowCatMgr(false)}
        />
      )}

      {/* Filter row */}
      <div className="filter-bar">
        <input
          className="inp"
          placeholder="Search transactions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="sel" value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
          <option value="">All accounts</option>
          {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
        <select className="sel" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">All sections</option>
          <option value="income">Income</option>
          <option value="expenses">Expenses</option>
          <option value="savings">Savings</option>
          <option value="transfer">Transfers</option>
        </select>
        <div className="filter-right">
          {uncatCount > 0 && <span className="badge-warn">⚠ {uncatCount} uncategorized</span>}
          <span className="count-lbl">{filtered.length} of {monthTxs.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap card">
        <table className="tx-tbl">
          <thead>
            <tr>
              <th style={{ width: 82 }}>Date</th>
              <th style={{ width: 190 }}>Account</th>
              <th>Description</th>
              <th style={{ width: 95,  textAlign: "right" }}>Amount</th>
              <th style={{ width: 140 }}>Main Category</th>
              <th style={{ width: 145 }}>Sub Category</th>
              <th style={{ width: 145 }}>Remarks</th>
              <th style={{ width: 32  }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  {monthTxs.length === 0
                    ? "No transactions for this month. Upload a CSV or add manually."
                    : "No transactions match the current filters."}
                </td>
              </tr>
            )}
            {filtered.map(tx => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                allMainCats={allMainCats}
                getSubsFor={getSubsFor}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                onCellEdit={handleCellEdit}
                onDelete={onDeleteTransaction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Data management */}
      <div className="card data-mgmt">
        <div className="data-mgmt-title">Data Management</div>
        <div className="data-mgmt-sub">Clear transaction data by month. Individual rows can be deleted inline. No bulk delete available.</div>
        <div className="data-mgmt-row">
          <select className="sel" value={clearMonthSel} onChange={e => setClearMonthSel(e.target.value)}>
            <option value="">Select month to clear...</option>
            {availableMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button
            className="btn-danger"
            disabled={!clearMonthSel}
            onClick={() => { if (clearMonthSel) { onClearMonth(clearMonthSel); setClearMonthSel(""); } }}
          >
            Clear {clearMonthSel ? monthLabel(clearMonthSel) : "selected month"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTION ROW ─────────────────────────────────────────────────────────

function TransactionRow({ tx, allMainCats, getSubsFor, editingCell, setEditingCell, onCellEdit, onDelete }) {
  const isUncat = !tx.mainCategory && !tx.isTransfer;

  const isEdit = (field) => editingCell?.txId === tx.id && editingCell?.field === field;
  const startEdit = (field) => setEditingCell({ txId: tx.id, field });
  const stopEdit  = () => setEditingCell(null);

  function CellText({ field, value, className }) {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);

    if (isEdit(field)) {
      return (
        <input
          className="cell-inp"
          value={local}
          autoFocus
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { onCellEdit(tx.id, field, local); stopEdit(); }}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
        />
      );
    }
    return (
      <span className={`cell-val${className ? " " + className : ""}`} onClick={() => startEdit(field)}>
        {value || <span className="cell-ph">—</span>}
      </span>
    );
  }

  function CellAmount() {
    const [local, setLocal] = useState(String(tx.amount));
    useEffect(() => setLocal(String(tx.amount)), [tx.amount]);

    if (isEdit("amount")) {
      return (
        <input
          className="cell-inp right"
          value={local}
          autoFocus
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { const n = parseFloat(local); if (!isNaN(n)) onCellEdit(tx.id, "amount", n); stopEdit(); }}
          onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
        />
      );
    }
    return (
      <span
        className={`cell-val right ${tx.amount >= 0 ? "c-green" : "c-red"}`}
        onClick={() => startEdit("amount")}
      >
        {tx.amount >= 0 ? "+" : "−"}{fmt(Math.abs(tx.amount))}
      </span>
    );
  }

  function CellSelect({ field, value, options, onSelect }) {
    if (isEdit(field)) {
      return (
        <select
          className="cell-sel"
          value={value}
          autoFocus
          onChange={e => { onSelect(e.target.value); stopEdit(); }}
          onBlur={stopEdit}
        >
          <option value="">— select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <span
        className={`cell-val${!value ? " cell-ph" : ""}`}
        onClick={() => startEdit(field)}
      >
        {value || "—"}
      </span>
    );
  }

  const subs = getSubsFor(tx.mainCategory);

  return (
    <tr className={`tx-row${isUncat ? " uncat" : ""}`}>
      {/* Date */}
      <td onClick={() => startEdit("date")}>
        {isEdit("date")
          ? <input type="date" className="cell-inp" defaultValue={tx.date} autoFocus
              onBlur={e => { onCellEdit(tx.id, "date", e.target.value); stopEdit(); }} />
          : <span className="cell-val date-val">{shortDate(tx.date)}</span>
        }
      </td>

      {/* Account */}
      <td>
        <CellSelect
          field="account"
          value={accountLabel(tx.account)}
          options={ACCOUNTS.map(a => a.label)}
          onSelect={val => {
            const acc = ACCOUNTS.find(a => a.label === val);
            if (acc) onCellEdit(tx.id, "account", acc.id);
          }}
        />
      </td>

      {/* Description */}
      <td><CellText field="description" value={tx.description} /></td>

      {/* Amount */}
      <td><CellAmount /></td>

      {/* Main Category */}
      <td>
        {isUncat && !isEdit("mainCategory") && (
          <span className="uncat-badge" onClick={() => startEdit("mainCategory")}>⚠ Uncategorized</span>
        )}
        {(!isUncat || isEdit("mainCategory")) && (
          <CellSelect
            field="mainCategory"
            value={tx.mainCategory}
            options={allMainCats.map(c => c.main)}
            onSelect={val => onCellEdit(tx.id, "mainCategory", val)}
          />
        )}
      </td>

      {/* Sub Category */}
      <td>
        <CellSelect
          field="subCategory"
          value={tx.subCategory}
          options={subs}
          onSelect={val => onCellEdit(tx.id, "subCategory", val)}
        />
      </td>

      {/* Remarks */}
      <td><CellText field="remarks" value={tx.remarks} className="remarks-val" /></td>

      {/* Delete */}
      <td>
        <button className="btn-del" onClick={() => onDelete(tx.id)} title="Delete transaction">✕</button>
      </td>
    </tr>
  );
}

// ─── CATEGORY MANAGER ────────────────────────────────────────────────────────

function CategoryManager({ categories, onChange, onClose }) {
  const [local, setLocal] = useState(JSON.parse(JSON.stringify(categories)));
  const [newHead, setNewHead] = useState({ income: "", expenses: "", savings: "" });
  const [newSub,  setNewSub]  = useState({});

  function addHead(section) {
    const v = newHead[section].trim();
    if (!v) return;
    if (section === "savings") {
      setLocal(c => ({ ...c, savings: [...c.savings, { head: v, budget: 0 }] }));
    } else {
      setLocal(c => ({ ...c, [section]: [...c[section], { head: v, subs: [], budget: {} }] }));
    }
    setNewHead(n => ({ ...n, [section]: "" }));
  }

  function addSub(section, hi) {
    const k = `${section}-${hi}`;
    const v = (newSub[k] || "").trim();
    if (!v) return;
    setLocal(c => {
      const u = JSON.parse(JSON.stringify(c));
      u[section][hi].subs.push(v);
      u[section][hi].budget[v] = 0;
      return u;
    });
    setNewSub(n => ({ ...n, [k]: "" }));
  }

  function updateBudget(section, hi, sub, val) {
    setLocal(c => {
      const u = JSON.parse(JSON.stringify(c));
      if (section === "savings") { u.savings[hi].budget = parseFloat(val) || 0; }
      else { u[section][hi].budget[sub] = parseFloat(val) || 0; }
      return u;
    });
  }

  function removeHead(section, hi) {
    setLocal(c => {
      const u = JSON.parse(JSON.stringify(c));
      u[section].splice(hi, 1);
      return u;
    });
  }

  function removeSub(section, hi, si) {
    setLocal(c => {
      const u = JSON.parse(JSON.stringify(c));
      const sub = u[section][hi].subs[si];
      u[section][hi].subs.splice(si, 1);
      delete u[section][hi].budget[sub];
      return u;
    });
  }

  return (
    <div className="cat-mgr card">
      <div className="cat-mgr-hdr">
        <span className="cat-mgr-title">⚙ Manage Categories — changes propagate to all pages</span>
        <button className="btn-ghost btn-sm" onClick={onClose}>✕ Close without saving</button>
      </div>

      {["income", "expenses", "savings"].map(section => (
        <div key={section} className="cat-section">
          <div className="cat-section-lbl">{section.charAt(0).toUpperCase() + section.slice(1)}</div>
          {(section === "savings" ? local.savings : local[section]).map((h, hi) => (
            <div key={hi} className="cat-head-block">
              <div className="cat-head-row">
                <span className="cat-head-name">{h.head}</span>
                {section === "savings" && (
                  <label className="cat-budget-pair">
                    <span className="cat-budget-lbl">Budget $</span>
                    <input className="inp budget-inp" type="number" value={h.budget}
                      onChange={e => updateBudget(section, hi, null, e.target.value)} />
                  </label>
                )}
                <button className="btn-del" onClick={() => removeHead(section, hi)}>✕</button>
              </div>
              {section !== "savings" && h.subs && (
                <div className="cat-subs">
                  {h.subs.map((sub, si) => (
                    <div key={si} className="cat-sub-row">
                      <span className="cat-sub-name">{sub}</span>
                      <label className="cat-budget-pair">
                        <span className="cat-budget-lbl">$</span>
                        <input className="inp budget-inp" type="number" value={h.budget[sub] || 0}
                          onChange={e => updateBudget(section, hi, sub, e.target.value)} />
                      </label>
                      <button className="btn-del" onClick={() => removeSub(section, hi, si)}>✕</button>
                    </div>
                  ))}
                  <div className="cat-add-row">
                    <input className="inp" placeholder="New sub-category..."
                      value={newSub[`${section}-${hi}`] || ""}
                      onChange={e => setNewSub(n => ({ ...n, [`${section}-${hi}`]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addSub(section, hi)} />
                    <button className="btn-ghost btn-sm" onClick={() => addSub(section, hi)}>+ Add Sub</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="cat-add-row" style={{ marginTop: 8 }}>
            <input className="inp" placeholder={`New ${section} head...`}
              value={newHead[section]}
              onChange={e => setNewHead(n => ({ ...n, [section]: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addHead(section)} />
            <button className="btn-ghost btn-sm" onClick={() => addHead(section)}>+ Add Head</button>
          </div>
        </div>
      ))}

      <div className="cat-mgr-footer">
        <button className="btn-primary" onClick={() => { onChange(local); onClose(); }}>Save Changes</button>
        <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─── INVESTMENTS TAB ─────────────────────────────────────────────────────────

function InvestmentsTab({ investments, onInvestmentsChange, showToast }) {
  const [uploadAccount, setUploadAccount] = useState("sr_fhsa");
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rows = parseInvestmentCSV(ev.target.result, uploadAccount);
      onInvestmentsChange(prev => [...prev.filter(r => r.account !== uploadAccount), ...rows]);
      showToast(`Imported ${rows.length} holdings for ${INVEST_ACCOUNTS.find(a => a.id === uploadAccount)?.label}`);
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  // Group by account
  const grouped = {};
  investments.forEach(inv => { if (!grouped[inv.account]) grouped[inv.account] = []; grouped[inv.account].push(inv); });

  const totalBook = investments.reduce((s,i) => s + i.bookValue,   0);
  const totalMkt  = investments.reduce((s,i) => s + i.marketValue, 0);
  const totalGain = totalMkt - totalBook;

  return (
    <div className="tab-pane">
      <div className="month-bar">
        <span className="month-label">Wealthsimple Portfolio</span>
        <div className="top-actions">
          <select className="sel" value={uploadAccount} onChange={e => setUploadAccount(e.target.value)}>
            {INVEST_ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <button className="btn-ghost btn-sm" onClick={() => fileRef.current.click()}>⬆ Upload CSV</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        </div>
      </div>

      {/* Account cards */}
      <div className="inv-cards">
        {INVEST_ACCOUNTS.map(acc => {
          const rows = grouped[acc.id] || [];
          const book = rows.reduce((s,r) => s + r.bookValue,   0);
          const mkt  = rows.reduce((s,r) => s + r.marketValue, 0);
          const gain = mkt - book;
          const pct  = book > 0 ? ((gain / book) * 100).toFixed(1) : "0.0";
          return (
            <div key={acc.id} className="inv-card">
              <div className="inv-card-lbl">{acc.label}</div>
              <div className={`inv-card-val ${mkt > 0 ? "c-green" : "c-muted"}`}>
                {mkt > 0 ? fmt(mkt) : "—"}
              </div>
              {mkt > 0 && (
                <div className="inv-card-sub">
                  Book {fmt(book)} · <span className={gain >= 0 ? "c-green" : "c-red"}>
                    {gain >= 0 ? "+" : ""}{fmt(gain)} ({pct}%)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Portfolio total tile */}
      {totalMkt > 0 && (
        <div className="tile inv-total-tile">
          <div className="tile-label">Total Portfolio</div>
          <div className="tile-value c-green">{fmt(totalMkt)}</div>
          <div className="tile-sub">
            Book {fmt(totalBook)} · gain&nbsp;
            <span className={totalGain >= 0 ? "c-green" : "c-red"}>
              {totalGain >= 0 ? "+" : ""}{fmt(Math.abs(totalGain))}&nbsp;
              ({totalBook > 0 ? ((totalGain / totalBook) * 100).toFixed(1) : "0.0"}%)
            </span>
          </div>
        </div>
      )}

      {/* Holdings table */}
      {investments.length > 0 ? (
        <div className="table-wrap card">
          <table className="tx-tbl">
            <thead>
              <tr>
                <th>Account</th>
                <th>Symbol</th>
                <th>Holding</th>
                <th style={{ textAlign: "right", width: 70 }}>Qty</th>
                <th style={{ textAlign: "right", width: 105 }}>Book Value</th>
                <th style={{ textAlign: "right", width: 110 }}>Market Value</th>
                <th style={{ textAlign: "right", width: 95 }}>Gain / Loss</th>
              </tr>
            </thead>
            <tbody>
              {investments.map(inv => {
                const gain     = inv.marketValue - inv.bookValue;
                const accLabel = INVEST_ACCOUNTS.find(a => a.id === inv.account)?.label || inv.account;
                return (
                  <tr key={inv.id} className="tx-row">
                    <td><span className="acc-chip">{accLabel}</span></td>
                    <td style={{ fontWeight: 500 }}>{inv.symbol}</td>
                    <td>{inv.name}</td>
                    <td style={{ textAlign: "right" }} className="c-muted">{inv.qty.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>{fmtFull(inv.bookValue)}</td>
                    <td style={{ textAlign: "right", fontWeight: 500 }}>{fmtFull(inv.marketValue)}</td>
                    <td style={{ textAlign: "right" }} className={gain >= 0 ? "c-green" : "c-red"}>
                      {gain >= 0 ? "+" : ""}{fmtFull(gain)}
                    </td>
                  </tr>
                );
              })}
              <tr className="tx-row total-row">
                <td colSpan={4} style={{ fontWeight: 500 }}>Total</td>
                <td style={{ textAlign: "right", fontWeight: 500 }}>{fmtFull(totalBook)}</td>
                <td style={{ textAlign: "right", fontWeight: 500 }}>{fmtFull(totalMkt)}</td>
                <td style={{ textAlign: "right", fontWeight: 500 }} className={totalGain >= 0 ? "c-green" : "c-red"}>
                  {totalGain >= 0 ? "+" : ""}{fmtFull(totalGain)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">Upload your Wealthsimple CSV to view your portfolio holdings</div>
      )}
    </div>
  );
}

// ─── ANNUAL TAB ──────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function AnnualTab({ transactions, categories, selectedYear, onPrevYear, onNextYear }) {
  const now           = new Date();
  const currentMKey   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  const budgetIncome  = categories.income.reduce((s,h)   => s + Object.values(h.budget).reduce((a,b)=>a+b,0), 0);
  const budgetExp     = categories.expenses.reduce((s,h)  => s + Object.values(h.budget).reduce((a,b)=>a+b,0), 0);
  const budgetSav     = categories.savings.reduce((s,h)   => s + h.budget, 0);

  const monthData = Array.from({ length: 12 }, (_, i) => {
    const key  = `${selectedYear}-${String(i+1).padStart(2,"0")}`;
    const txs  = transactions.filter(t => t.month === key && !t.isTransfer);
    const inc  = txs.filter(t => t.section === "income").reduce((s,t)   => s + Math.abs(t.amount), 0);
    const exp  = txs.filter(t => t.section === "expenses").reduce((s,t) => s + Math.abs(t.amount), 0);
    const sav  = txs.filter(t => t.section === "savings").reduce((s,t)  => s + Math.abs(t.amount), 0);
    return { key, name: MONTH_NAMES[i], income: inc, expenses: exp, savings: sav, surplus: inc - exp - sav, hasTx: txs.length > 0 };
  });

  const completed  = monthData.filter(m => m.hasTx && m.key <= currentMKey);
  const ytdIncome  = completed.reduce((s,m) => s + m.income,   0);
  const ytdExp     = completed.reduce((s,m) => s + m.expenses, 0);
  const ytdSav     = completed.reduce((s,m) => s + m.savings,  0);
  const ytdSurplus = ytdIncome - ytdExp - ytdSav;
  const n          = completed.length || 1;

  return (
    <div className="tab-pane">
      <div className="month-bar">
        <div className="month-nav">
          <button className="btn-ghost" onClick={onPrevYear}>◀</button>
          <span className="month-label">{selectedYear}</span>
          <button className="btn-ghost" onClick={onNextYear}>▶</button>
        </div>
      </div>

      {/* YTD tiles */}
      <div className="tiles-row mb-3">
        <div className="tile"><div className="tile-label">YTD Income</div>    <div className="tile-value c-green">{fmt(ytdIncome)}</div>  <div className="tile-sub">{completed.length} months · avg {fmt(Math.round(ytdIncome/n))}/mo</div></div>
        <div className="tile"><div className="tile-label">YTD Expenses</div>  <div className="tile-value c-red">{fmt(ytdExp)}</div>      <div className="tile-sub">avg {fmt(Math.round(ytdExp/n))}/mo</div></div>
        <div className="tile"><div className="tile-label">YTD Savings</div>   <div className="tile-value c-green">{fmt(ytdSav)}</div>    <div className="tile-sub">avg {fmt(Math.round(ytdSav/n))}/mo</div></div>
        <div className="tile"><div className="tile-label">YTD Surplus</div>   <div className={`tile-value ${ytdSurplus >= 0 ? "c-green" : "c-red"}`}>{fmt(ytdSurplus)}</div><div className="tile-sub">avg {fmt(Math.round(ytdSurplus/n))}/mo</div></div>
      </div>

      <div className="table-wrap card">
        <table className="tx-tbl annual-tbl">
          <thead>
            <tr>
              <th style={{ textAlign: "left", width: 110 }}>Month</th>
              <th style={{ textAlign: "right" }}>Budget Income</th>
              <th style={{ textAlign: "right" }}>Actual Income</th>
              <th style={{ textAlign: "right" }}>Budget Expense</th>
              <th style={{ textAlign: "right" }}>Actual Expense</th>
              <th style={{ textAlign: "right" }}>Budget Savings</th>
              <th style={{ textAlign: "right" }}>Actual Savings</th>
              <th style={{ textAlign: "right" }}>Surplus</th>
            </tr>
          </thead>
          <tbody>
            {monthData.map(m => {
              const isCurrent = m.key === currentMKey;
              const isFuture  = m.key > currentMKey && !m.hasTx;
              return (
                <tr key={m.key} className={`tx-row${isCurrent ? " current-month" : ""}${isFuture ? " future-month" : ""}`}>
                  <td style={{ fontWeight: isCurrent ? 600 : 400 }}>
                    {m.name.slice(0,3)}
                    {isCurrent && <span className="current-dot"> ●</span>}
                  </td>
                  <td style={{ textAlign: "right" }} className="c-muted">{fmt(budgetIncome)}</td>
                  <td style={{ textAlign: "right" }} className={m.hasTx ? colorCls(getActualColor(m.income, budgetIncome, "income")) : "c-muted"}>
                    {m.hasTx ? fmt(m.income) : "—"}
                  </td>
                  <td style={{ textAlign: "right" }} className="c-muted">{fmt(budgetExp)}</td>
                  <td style={{ textAlign: "right" }} className={m.hasTx ? colorCls(getActualColor(m.expenses, budgetExp, "expense")) : "c-muted"}>
                    {m.hasTx ? fmt(m.expenses) : "—"}
                  </td>
                  <td style={{ textAlign: "right" }} className="c-muted">{fmt(budgetSav)}</td>
                  <td style={{ textAlign: "right" }} className={m.hasTx ? colorCls(getActualColor(m.savings, budgetSav, "savings")) : "c-muted"}>
                    {m.hasTx ? fmt(m.savings) : "—"}
                  </td>
                  <td style={{ textAlign: "right" }} className={m.hasTx ? (m.surplus >= 0 ? "c-green" : "c-red") : "c-muted"}>
                    {m.hasTx ? (m.surplus >= 0 ? fmt(m.surplus) : "−" + fmt(Math.abs(m.surplus))) : "—"}
                  </td>
                </tr>
              );
            })}
            <tr className="tx-row total-row">
              <td style={{ fontWeight: 600 }}>YTD</td>
              <td style={{ textAlign: "right" }} className="c-muted">{fmt(budgetIncome * completed.length)}</td>
              <td style={{ textAlign: "right", fontWeight: 500 }} className="c-green">{fmt(ytdIncome)}</td>
              <td style={{ textAlign: "right" }} className="c-muted">{fmt(budgetExp * completed.length)}</td>
              <td style={{ textAlign: "right", fontWeight: 500 }} className={ytdExp <= budgetExp * completed.length ? "c-green" : "c-red"}>{fmt(ytdExp)}</td>
              <td style={{ textAlign: "right" }} className="c-muted">{fmt(budgetSav * completed.length)}</td>
              <td style={{ textAlign: "right", fontWeight: 500 }} className="c-green">{fmt(ytdSav)}</td>
              <td style={{ textAlign: "right", fontWeight: 500 }} className={ytdSurplus >= 0 ? "c-green" : "c-red"}>{fmt(ytdSurplus)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
