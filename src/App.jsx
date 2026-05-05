import React, { useState, useEffect } from 'react'

const GMAIL_CLIENT_ID = '703133412539-qisi29sk7cti0l5l70buf4ircgmnlhnb.apps.googleusercontent.com'

const categoryKeywords = {
  'SR Paycheck': ['monsoon', 'payroll', 'salary'],
  'NR DS Income': ['delta school', 'ds pay'],
  'NR CK Income': ['creative kids', 'ck pay'],
  'Child Benefit': ['ccb', 'canada child'],
  'Rent': ['rent', 'landlord'],
  'Groceries': ['costco', 'walmart', 'loblaws', 'save-on'],
  'Dining Out': ['doordash', 'skip', 'uber eats'],
  'Utilities': ['hydro', 'telus', 'shaw'],
  'Daycare': ['daycare', 'preschool'],
  'School Fees': ['school', 'tuition'],
  'Gas & Fuel': ['shell', 'petro', 'gas'],
  'Subscriptions': ['netflix', 'chatgpt', 'icloud'],
  'FHSA Savings': ['fhsa'],
  'TFSA Savings': ['tfsa'],
  'RRSP Savings': ['rrsp'],
  'RESP Savings': ['resp'],
}

const budgetTargets = {
  'Groceries': 1000,
  'Dining Out': 400,
  'Rent': 3200,
  'Daycare': 850,
  'School Fees': 400,
  'Utilities': 160,
  'Gas & Fuel': 350,
  'Subscriptions': 40,
}

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  const categorizeTransaction = (merchant, subject = '') => {
    const text = (merchant + ' ' + subject).toLowerCase()
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        return category
      }
    }
    return null
  }

  const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n')
  const parsed = []
  
  // Detect Scotiabank format by checking header
  const header = lines[0].toLowerCase()
  const isScotiabank = header.includes('description') && header.includes('type of transaction')
  
  for (let i = 1; i < lines.length; i++) {
    // Parse quoted CSV fields properly
    const parts = []
    let current = ''
    let inQuotes = false
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { parts.push(current.trim()); current = '' }
      else { current += char }
    }
    parts.push(current.trim())

    if (isScotiabank && parts.length >= 7) {
      const date = parts[1].replace(/"/g, '').trim()
      const merchant = parts[2].replace(/"/g, '').trim()
      const amount = parseFloat(parts[6].replace(/"/g, '').trim())
      if (date && merchant && !isNaN(amount)) {
        parsed.push({ id: Date.now() + Math.random(), date, merchant, amount, category: categorizeTransaction(merchant) })
      }
    } else if (!isScotiabank && parts.length >= 3) {
      const date = parts[0].trim()
      const merchant = parts[1].trim()
      const amount = parseFloat(parts[2].trim())
      if (!isNaN(amount)) {
        parsed.push({ id: Date.now() + Math.random(), date, merchant, amount, category: categorizeTransaction(merchant) })
      }
    }
  }
  return parsed
}
    }
    return parsed
  }

  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result)
        setTransactions([...transactions, ...parsed])
        alert(`Success! Imported ${parsed.length} transactions`)
        event.target.value = ''
      } catch (err) {
        alert('Error importing CSV: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const filterByMonth = (txns) => {
    return txns.filter(t => t.date.startsWith(month))
  }

  const monthTransactions = filterByMonth(transactions)
  const income = monthTransactions
    .filter(t => ['SR Paycheck', 'NR DS Income', 'NR CK Income', 'Child Benefit'].includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = monthTransactions
    .filter(t => t.category && !['SR Paycheck', 'NR DS Income', 'NR CK Income', 'Child Benefit', 'FHSA Savings', 'TFSA Savings', 'RRSP Savings', 'RESP Savings'].includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0)
  const savings = monthTransactions
    .filter(t => ['FHSA Savings', 'TFSA Savings', 'RRSP Savings', 'RESP Savings'].includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0)
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0

  const uncategorized = monthTransactions.filter(t => !t.category)

  const handleCategoryChange = (id, newCategory) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...t, category: newCategory } : t
    ))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Finance Dashboard</h1>
        <p>Household Budget Tracker</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="controls">
              <label>
                Month:
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </label>
            </div>

            <div className="metrics">
              <div className="metric">
                <div className="label">Income</div>
                <div className="value income">${income.toFixed(2)}</div>
              </div>
              <div className="metric">
                <div className="label">Expenses</div>
                <div className="value expense">${expenses.toFixed(2)}</div>
              </div>
              <div className="metric">
                <div className="label">Savings</div>
                <div className="value savings">${savings.toFixed(2)}</div>
              </div>
              <div className="metric">
                <div className="label">Savings Rate</div>
                <div className="value savings">{savingsRate}%</div>
              </div>
            </div>

            <div className="section">
              <h2>Budget vs Actual</h2>
              <table className="budget-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Actual</th>
                    <th>Budget</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(budgetTargets).map(([cat, budget]) => {
                    const actual = monthTransactions
                      .filter(t => t.category === cat)
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                    const status = actual > budget ? '⚠️ Over' : '✓ OK'
                    return (
                      <tr key={cat}>
                        <td>{cat}</td>
                        <td>${actual.toFixed(2)}</td>
                        <td>${budget}</td>
                        <td>{status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h2>Recent Transactions</h2>
              {monthTransactions.length === 0 ? (
                <p>No transactions this month. Upload CSV to get started.</p>
              ) : (
                <div className="transaction-list">
                  {monthTransactions.slice(0, 10).map(t => (
                    <div key={t.id} className="transaction-item">
                      <span className="date">{t.date}</span>
                      <span className="merchant">{t.merchant}</span>
                      <span className="category">{t.category || 'Uncategorized'}</span>
                      <span className="amount">${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="inbox">
            <h2>Categorization ({uncategorized.length} uncategorized)</h2>
            {uncategorized.length === 0 ? (
              <p>✓ All transactions categorized!</p>
            ) : (
              <div className="categorization-list">
                {uncategorized.map(t => (
                  <div key={t.id} className="categorization-item">
                    <div className="txn-info">
                      <span className="date">{t.date}</span>
                      <span className="merchant">{t.merchant}</span>
                      <span className="amount">${t.amount.toFixed(2)}</span>
                    </div>
                    <select
                      value=""
                      onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                    >
                      <option value="">Select category...</option>
                      {Object.keys(categoryKeywords).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings">
            <h2>CSV Upload</h2>
            <div className="csv-upload">
              <label>
                Upload CSV File:
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                />
              </label>
            </div>

            <h3>CSV Format Example:</h3>
            <pre className="csv-example">
{`Date,Merchant,Amount
2026-05-01,Costco,150.50
2026-05-02,DoorDash,45.99
2026-05-03,Rent Landlord,3200
2026-05-05,Monsoon Payroll,8000`}
            </pre>

            <h3>Statistics:</h3>
            <p>Total transactions: {transactions.length}</p>
            <p>This month: {monthTransactions.length}</p>
          </div>
        )}
      </main>
    </div>
  )
}