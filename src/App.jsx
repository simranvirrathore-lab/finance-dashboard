import React, { useState, useEffect } from 'react'

const CATEGORY_GROUPS = {
  'Income':         { color:'#22c55e', cats:['SR Paycheck','Car Reimbursement','NR DS Paycheck','Canada Child Benefit','Other Income'] },
  'Home':           { color:'#f97316', cats:['Rent'] },
  'Transportation': { color:'#f97316', cats:['Vehicle Loan','Auto Insurance','Auto Maintenance','Parking','Rideshare'] },
  'Family':         { color:'#f97316', cats:['Gurshaan School Fees','Gurnadar Daycare','Baby Supplies'] },
  'Debt & Banking': { color:'#f97316', cats:['Student Loan','Bank Fees','Accountant Fee'] },
  'CC Payments':    { color:'#94a3b8', cats:['Scotia CC Payment','CIBC CC Payment'] },
  'Food & Dining':  { color:'#eab308', cats:['Groceries','Dining & Takeout','Coffee & Snacks'] },
  'Shopping':       { color:'#eab308', cats:['Shopping','Clothing'] },
  'Health':         { color:'#ec4899', cats:['Pharmacy & Medical','Wellness & Beauty'] },
  'Lifestyle':      { color:'#eab308', cats:['Entertainment','Mobile Bill','Charity / Donation'] },
  'Digital':        { color:'#a855f7', cats:['Subscriptions'] },
  'Family Support': { color:'#a855f7', cats:['Remitly'] },
  'Savings':        { color:'#3b82f6', cats:['SR FHSA','SR TFSA','NR FHSA','NR RRSP','Gurshaan RESP','Gurnadar RESP'] },
  'Transfers':      { color:'#64748b', cats:['Transfer — Exclude'] },
}

const INCOME_CATS    = CATEGORY_GROUPS['Income'].cats
const SAVINGS_CATS   = CATEGORY_GROUPS['Savings'].cats
const CC_PAY_CATS    = CATEGORY_GROUPS['CC Payments'].cats
const EXCLUDE_CATS   = CATEGORY_GROUPS['Transfers'].cats
const FIXED_GROUPS   = ['Home','Transportation','Family','Debt & Banking','Family Support']
const FIXED_CATS     = FIXED_GROUPS.flatMap(g => CATEGORY_GROUPS[g].cats)
const CC_SPEND_GROUPS= ['Food & Dining','Shopping','Health','Lifestyle','Digital']
const HH_GROUPS      = ['Income','Home','Transportation','Family','Debt & Banking','CC Payments','Family Support','Savings']

const DEFAULT_BUDGET = {
  'SR Paycheck':8000,'Car Reimbursement':250,'NR DS Paycheck':6700,'Canada Child Benefit':300,
  'Rent':3500,
  'Vehicle Loan':644,'Auto Insurance':290,'Auto Maintenance':100,'Parking':50,'Rideshare':50,
  'Gurshaan School Fees':400,'Gurnadar Daycare':850,'Baby Supplies':100,
  'Student Loan':153,'Bank Fees':35,'Accountant Fee':0,
  'Groceries':1000,'Dining & Takeout':400,'Coffee & Snacks':100,
  'Shopping':400,'Clothing':200,
  'Pharmacy & Medical':100,'Wellness & Beauty':150,
  'Entertainment':100,'Mobile Bill':100,'Charity / Donation':100,
  'Subscriptions':50,'Remitly':200,
  'SR FHSA':650,'SR TFSA':500,'NR FHSA':0,'NR RRSP':0,'Gurshaan RESP':300,'Gurnadar RESP':220,
}

const ACCOUNTS = [
  {id:'SR_BANK',    label:'SR — Scotia Bank'},
  {id:'NR_BANK',    label:'NR — Scotia Bank'},
  {id:'SR_CC',      label:'SR — Scotia Momentum Visa'},
  {id:'SR_CIBC',    label:'SR — CIBC (Costco)'},
  {id:'WEALTHSIMPLE',label:'Wealthsimple Holdings'},
]

const fmt  = n => '$'+Math.abs(n||0).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtK = n => Math.abs(n||0)>=1000?'$'+(Math.abs(n||0)/1000).toFixed(1)+'k':fmt(n)

function getPeriodProgress(month){
  const now=new Date(), [y,m]=month.split('-').map(Number)
  const dim=new Date(y,m,0).getDate()
  if(now.getFullYear()===y&&now.getMonth()+1===m) return Math.round((now.getDate()/dim)*100)
  return new Date(y,m-1,1)<new Date(now.getFullYear(),now.getMonth(),1)?100:0
}

function categorize(merchant,type,account,amount){
  const m=merchant.toLowerCase()
  const isCredit=type==='credit', isSR=account==='SR_BANK', isNR=account==='NR_BANK', isBank=isSR||isNR
  const has=(...kw)=>kw.some(k=>m.includes(k))
  if(isBank&&isCredit){
    if(has('mb-dep','mb dep')){return isNR?'NR DS Paycheck':amount<=300?'Car Reimbursement':'SR Paycheck'}
    if(has('ccb','canada child','fed grant','federal grant')) return 'Canada Child Benefit'
    if(has('interac','e-transfer','etransfer')) return null
    return 'Other Income'
  }
  if(isBank&&!isCredit){
    if(has('savreentoor','savreet toor','savreet')) return 'Rent'
    if(has('rbc loan','rbc mort')) return 'Vehicle Loan'
    if(has('insurance corporation','icbc #')) return 'Auto Insurance'
    if(has('monthly fees','service charge','bank fee')) return 'Bank Fees'
    if(has('student loan','nslsc')) return 'Student Loan'
    if(has('crd. card bill','crd card bill','scotiabank transit')) return 'Scotia CC Payment'
    if(has('cibc card','cibc card products')) return 'CIBC CC Payment'
    if(has('fhsa')) return isSR?'SR FHSA':'NR FHSA'
    if(has('rrsp')) return isNR?'NR RRSP':null
    if(has('tfsa')) return isSR?'SR TFSA':null
    if(has('resp')) return 'Gurshaan RESP'
    if(has('remitly')) return 'Remitly'
    if(has('gurdwara','guru nanak')) return 'Charity / Donation'
    if(has('interac','e-transfer','abm withdrawal','etransfer')) return null
    return null
  }
  if(has('costco','superstore','save-on','walmart','freshco','no frills','loblaws','food basics','fruiticana','sabzi mandi','instacart','punjab flour')) return 'Groceries'
  if(has('uber eat','doordash','skip the dishes','subway','a&w','burgrill','pizza','restaurant','kfc','mcdonald','burger king','popeyes','tandoor','dhaba','manohar')) return 'Dining & Takeout'
  if(has('tim horton','starbucks','cafe','coffee','7-eleven','donut','bakery')) return 'Coffee & Snacks'
  if(has("h&m",'zara','gap ','old navy','la vie en rose','uniqlo','sport chek','sportchek','myntra')) return 'Clothing'
  if(has('amazon','winners','ikea','home depot','canadian tire','dollarama','marshalls','homesense')) return 'Shopping'
  if(has('shoppers drug mart','pharmacy','rexall','london drugs','medical','clinic','dental','hospital')) return 'Pharmacy & Medical'
  if(has('massage','spa','salon','beautician','facial','barber','fade factory','revere','beauty supply')) return 'Wellness & Beauty'
  if(has('abby tires','akal','auto repair','tire','oil change','car wash','midas','meineke')) return 'Auto Maintenance'
  if(has('impark','parking','easypark','prkg')) return 'Parking'
  if(m.includes('uber')&&!m.includes('eat')) return 'Rideshare'
  if(has('koodo','fido','telus','rogers','bell ','chatr','freedom mobile','virgin plus','public mobile')) return 'Mobile Bill'
  if(has('netflix','spotify','disney','apple.com','apple bill','icloud','chatgpt','google one','microsoft','adobe')) return 'Subscriptions'
  if(has('cinema','movie','theatre','recreation','library','newton')) return 'Entertainment'
  if(has('gurdwara','guru nanak','charity','donation')) return 'Charity / Donation'
  return 'Uncategorized'
}

function parseCSVLine(line){
  const parts=[]; let cur='', inQ=false
  for(const ch of line){
    if(ch==='"') inQ=!inQ
    else if(ch===','&&!inQ){parts.push(cur.trim());cur=''}
    else cur+=ch
  }
  parts.push(cur.trim())
  return parts.map(p=>p.replace(/"/g,'').trim())
}

function parseScotiaBankCSV(text,accountId){
  const lines=text.trim().split('\n'), header=lines[0].toLowerCase()
  const isBankFile=header.includes('balance')&&!header.includes('status')
  const isCCFile=header.includes('status')&&!header.includes('balance')
  if(!isBankFile&&!isCCFile) return {transactions:[],month:null,corrected:false,finalAccount:accountId}
  let finalAccount=accountId
  if(isBankFile&&accountId!=='SR_BANK'&&accountId!=='NR_BANK') finalAccount='SR_BANK'
  if(isCCFile&&(accountId==='SR_BANK'||accountId==='NR_BANK')) finalAccount='SR_CC'
  const corrected=finalAccount!==accountId, txns=[]
  let month=null
  for(let i=1;i<lines.length;i++){
    if(!lines[i].trim()) continue
    const p=parseCSVLine(lines[i])
    if(isBankFile&&p.length>=6){
      const date=p[1]; if(!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue
      const type=p[4].toLowerCase()==='credit'?'credit':'debit'
      const amount=Math.abs(parseFloat(p[5])||0); if(amount===0) continue
      if(!month) month=date.slice(0,7)
      const merchant=(p[3]&&p[3].trim())?p[3].trim():p[2].trim()
      const cat=categorize(merchant,type,finalAccount,amount)
      txns.push({id:Date.now()+Math.random(),date,merchant,amount,type,category:cat,account:finalAccount,month:date.slice(0,7),needsLabel:!cat,remark:null,customLabel:null})
    }
    if(isCCFile&&p.length>=7){
      const date=p[1]; if(!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue
      const merchant=p[2].trim()
      const type=p[5].toLowerCase()==='credit'?'credit':'debit'
      const amount=Math.abs(parseFloat(p[6])||0); if(amount===0||!merchant) continue
      if(!month) month=date.slice(0,7)
      const cat=categorize(merchant,type,finalAccount,amount)
      txns.push({id:Date.now()+Math.random(),date,merchant,amount,type,category:cat,account:finalAccount,month:date.slice(0,7),needsLabel:false,remark:null,customLabel:null})
    }
  }
  return {transactions:txns,month,corrected,finalAccount}
}

function parseWealthsimpleCSV(text){
  const lines=text.trim().split('\n'), p2={FHSA:0,RRSP:0,TFSA:0,'Non-Registered':0}
  for(let i=1;i<lines.length;i++){
    const p=parseCSVLine(lines[i]); if(p.length<19||!p[0]) continue
    const val=parseFloat(p[17])||0, valCAD=p[18]==='USD'?val*1.38:val
    if(p[0]==='FHSA') p2.FHSA+=valCAD
    else if(p[0]==='RRSP') p2.RRSP+=valCAD
    else if(p[0]==='TFSA') p2.TFSA+=valCAD
    else if(p[0]==='Non-registered') p2['Non-Registered']+=valCAD
  }
  return p2
}
const Bar=({actual,budget:b,color='#3b82f6',height=6})=>{
  const pct=b>0?Math.min((actual/b)*100,100):0, over=b>0&&actual>b
  return <div style={{width:'100%',height,background:'#1e293b',borderRadius:height/2,overflow:'hidden'}}><div style={{height:'100%',width:pct+'%',background:over?'#ef4444':color,borderRadius:height/2,transition:'width 0.3s'}}/></div>
}

export default function App(){
  const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}}
  const [transactions,setTransactions]=useState(()=>load('rh_tx',[]))
  const [budget,setBudget]=useState(()=>load('rh_budget',DEFAULT_BUDGET))
  const [openingBal,setOpeningBal]=useState(()=>load('rh_ob',{}))
  const [investments,setInvestments]=useState(()=>load('rh_invest',null))
  const [selectedMonth,setSelectedMonth]=useState(()=>new Date().toISOString().slice(0,7))
  const [activeTab,setActiveTab]=useState('dashboard')
  const [showUpload,setShowUpload]=useState(false)
  const [showBudget,setShowBudget]=useState(false)
  const [uploadAccount,setUploadAccount]=useState('SR_BANK')
  const [labelQueue,setLabelQueue]=useState([])
  const [notification,setNotification]=useState(null)
  const [bulkPrompt,setBulkPrompt]=useState(null)
  const [labelSel,setLabelSel]=useState({})
  const [labelCust,setLabelCust]=useState({})
  const [labelRmk,setLabelRmk]=useState({})

  useEffect(()=>localStorage.setItem('rh_tx',JSON.stringify(transactions)),[transactions])
  useEffect(()=>localStorage.setItem('rh_budget',JSON.stringify(budget)),[budget])
  useEffect(()=>localStorage.setItem('rh_ob',JSON.stringify(openingBal)),[openingBal])
  useEffect(()=>localStorage.setItem('rh_invest',JSON.stringify(investments)),[investments])

  const notify=(msg,type='success')=>{setNotification({msg,type});setTimeout(()=>setNotification(null),4500)}

  const handleUpload=e=>{
    const file=e.target.files[0]; if(!file) return
    const reader=new FileReader()
    reader.onload=ev=>{
      const text=ev.target.result
      if(uploadAccount==='WEALTHSIMPLE'){
        const p=parseWealthsimpleCSV(text), total=Object.values(p).reduce((s,v)=>s+v,0)
        if(total>0){setInvestments({...p,lastUpdated:new Date().toLocaleDateString('en-CA')});notify('Wealthsimple updated — '+fmtK(total))}
        else notify('Could not read Wealthsimple file','error')
      } else {
        const {transactions:parsed,month,corrected,finalAccount}=parseScotiaBankCSV(text,uploadAccount)
        if(!parsed.length) notify('No transactions found — check file format','error')
        else {
          setTransactions(prev=>[...prev.filter(t=>!(t.account===finalAccount&&t.month===month)),...parsed])
          const ul=parsed.filter(t=>t.needsLabel)
          if(ul.length) setLabelQueue(prev=>[...prev,...ul])
          // auto-detect internal transfers: same amount, same day, opposite accounts
          notify(corrected?`Auto-corrected to ${finalAccount} — ${parsed.length} tx for ${month}`:`Imported ${parsed.length} transactions for ${month}`)
          setSelectedMonth(month)
        }
      }
      e.target.value=''; setShowUpload(false)
    }
    reader.readAsText(file)
  }

  const updateCat=(id,cat,remark=null,customLabel=null)=>{
    setTransactions(prev=>{
      const tx=prev.find(t=>t.id===id)
      const updated=prev.map(t=>t.id===id?{...t,category:cat,needsLabel:false,remark,customLabel}:t)
      if(tx&&cat&&!EXCLUDE_CATS.includes(cat)&&cat!=='Custom / Misc'){
        const similar=updated.filter(t=>t.id!==id&&t.merchant===tx.merchant&&(t.needsLabel||t.category==='Uncategorized'||!t.category))
        if(similar.length>0) setBulkPrompt({merchant:tx.merchant,category:cat,ids:similar.map(t=>t.id),count:similar.length})
      }
      return updated
    })
    setLabelQueue(prev=>prev.filter(t=>t.id!==id))
  }

  const applyBulk=()=>{
    if(!bulkPrompt) return
    setTransactions(prev=>prev.map(t=>bulkPrompt.ids.includes(t.id)?{...t,category:bulkPrompt.category,needsLabel:false}:t))
    setLabelQueue(prev=>prev.filter(t=>!bulkPrompt.ids.includes(t.id)))
    notify(`Applied "${bulkPrompt.category}" to ${bulkPrompt.count} similar transactions`)
    setBulkPrompt(null)
  }

  const recategorizeAll=()=>{
    setTransactions(prev=>prev.map(t=>{
      if(EXCLUDE_CATS.includes(t.category)||t.customLabel) return t
      const cat=categorize(t.merchant,t.type,t.account,t.amount)
      return {...t,category:cat||t.category,needsLabel:!cat&&!t.category}
    }))
    notify('Re-categorized all transactions')
  }

  const getTx=(mo,ac=null)=>transactions.filter(t=>t.month===mo&&(ac===null||t.account===ac)&&!EXCLUDE_CATS.includes(t.category))
  const getAllTx=(mo,ac=null)=>transactions.filter(t=>t.month===mo&&(ac===null||t.account===ac))
  const sumOf=(list,cats,type=null)=>list.filter(t=>cats.includes(t.category)&&(type===null||t.type===type)).reduce((s,t)=>s+t.amount,0)
  const getOB=(ac,mo)=>openingBal[ac+'_'+mo]||0
  const setOBVal=(ac,mo,v)=>setOpeningBal(p=>({...p,[ac+'_'+mo]:parseFloat(v)||0}))
  const getClose=(ac,mo)=>{
    const list=getAllTx(mo,ac)
    return getOB(ac,mo)+list.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount,0)-list.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0)
  }
  const catColor=cat=>Object.values(CATEGORY_GROUPS).find(g=>g.cats.includes(cat))?.color||'#64748b'

  const moOpts=[...new Set(transactions.map(t=>t.month))].sort()
  const moList=moOpts.length?moOpts:[selectedMonth]
  const moLabel=m=>new Date(m+'-15').toLocaleString('en-CA',{month:'long',year:'numeric'})

  const srBk=getTx(selectedMonth,'SR_BANK'), nrBk=getTx(selectedMonth,'NR_BANK')
  const srCc=getTx(selectedMonth,'SR_CC'),   cibc=getTx(selectedMonth,'SR_CIBC')
  const allBk=[...srBk,...nrBk], allCc=[...srCc,...cibc]

  const totalIncome  =sumOf(allBk,INCOME_CATS,'credit')
  const totalFixed   =sumOf(allBk,FIXED_CATS,'debit')
  const totalSavings =sumOf(allBk,SAVINGS_CATS,'debit')
  const totalCcPay   =sumOf(allBk,CC_PAY_CATS,'debit')
  const totalCcSpend =allCc.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0)
  const unallocated  =totalIncome-totalFixed-totalCcPay-totalSavings
  const savingsRate  =totalIncome>0?(totalSavings/totalIncome*100).toFixed(1):0
  const periodProg   =getPeriodProgress(selectedMonth)

  const grocCC=allCc.filter(t=>t.category==='Groceries'&&t.type==='debit').reduce((s,t)=>s+t.amount,0)
  const needsAmt=totalFixed+grocCC, wantsAmt=totalCcSpend-grocCC
  const needsPct=totalIncome>0?Math.round(needsAmt/totalIncome*100):0
  const wantsPct=totalIncome>0?Math.round(wantsAmt/totalIncome*100):0
  const savPct  =totalIncome>0?Math.round(totalSavings/totalIncome*100):0

  const srBal=getClose('SR_BANK',selectedMonth), nrBal=getClose('NR_BANK',selectedMonth)
  const invTotal=investments?Object.entries(investments).filter(([k])=>k!=='lastUpdated').reduce((s,[,v])=>s+v,0):0
  const netWorth=srBal+nrBal+invTotal
  const bgtIncome=INCOME_CATS.reduce((s,c)=>s+(budget[c]||0),0)
  const bgtSavings=SAVINGS_CATS.reduce((s,c)=>s+(budget[c]||0),0)

  const CatSelect=({value,onChange})=>(
    <select value={value||''} onChange={onChange} className="tx-cat-sel">
      <option value="">— Uncategorized —</option>
      <option value="Transfer — Exclude">Transfer — Exclude (internal)</option>
      <option value="Custom / Misc">✏ Custom / Misc...</option>
      <optgroup label="──────────"/>
      {Object.entries(CATEGORY_GROUPS).filter(([g])=>g!=='Transfers').flatMap(([,{cats}])=>cats.map(c=><option key={c} value={c}>{c}</option>))}
    </select>
  )

  const handleCatChange=(txId,newCat)=>{
    if(newCat==='Custom / Misc'){
      const label=window.prompt('Label for this transaction (e.g. "Birthday gift for Gurshaan"):')
      if(label) updateCat(txId,'Custom / Misc',null,label)
    } else updateCat(txId,newCat)
  }

  const TxRow=({t})=>(
    <div className={`tx-row ${t.needsLabel||t.category==='Uncategorized'?'tx-unlabeled':''}`}>
      <span className="tx-date">{t.date.slice(5)}</span>
      <span className="tx-tag">{t.account==='SR_CIBC'?'CIBC':t.account==='SR_CC'?'Visa':t.account==='SR_BANK'?'SR':t.account==='NR_BANK'?'NR':''}</span>
      <span className="tx-merchant">{t.customLabel||t.merchant}</span>
      {t.remark&&<span style={{fontSize:11,color:'#475569',fontStyle:'italic',marginLeft:4}}>({t.remark})</span>}
      <span className={`tx-amt ${t.type==='credit'?'green':'red'}`}>{t.type==='credit'?'+':'-'}{fmt(t.amount)}</span>
      <CatSelect value={t.customLabel?'Custom / Misc':t.category} onChange={e=>handleCatChange(t.id,e.target.value)}/>
    </div>
  )
  return (
    <div className="app">
      {notification&&<div className={`notif notif-${notification.type}`}>{notification.msg}</div>}

      {bulkPrompt&&(
        <div className="overlay" onClick={()=>setBulkPrompt(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
            <h3>Apply to Similar Transactions?</h3>
            <p style={{color:'#94a3b8',margin:'8px 0'}}>Found <strong style={{color:'#e2e8f0'}}>{bulkPrompt.count}</strong> other uncategorized transactions from:</p>
            <p style={{color:'#f97316',fontWeight:700,margin:'4px 0 12px'}}>"{bulkPrompt.merchant}"</p>
            <p style={{color:'#94a3b8',margin:'0 0 16px'}}>Apply <strong style={{color:'#22c55e'}}>"{bulkPrompt.category}"</strong> to all of them?</p>
            <div style={{display:'flex',gap:12}}>
              <button className="btn-primary" onClick={applyBulk}>Yes, apply to all</button>
              <button className="btn-ghost" onClick={()=>setBulkPrompt(null)}>No, keep individual</button>
            </div>
          </div>
        </div>
      )}

      {showUpload&&(
        <div className="overlay" onClick={()=>setShowUpload(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Upload CSV File</h3>
            <div className="field"><label>Account</label>
              <select value={uploadAccount} onChange={e=>setUploadAccount(e.target.value)}>
                {ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div style={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:6,padding:'10px 14px',margin:'8px 0',fontSize:13,color:'#64748b'}}>
              💡 Bank vs CC is auto-detected. Account type auto-corrects if mismatched.
            </div>
            <div className="field"><label>CSV File</label><input type="file" accept=".csv" onChange={handleUpload}/></div>
            <p className="hint">Re-uploading the same month replaces that account's data.</p>
            <button className="btn-ghost" onClick={()=>setShowUpload(false)}>Cancel</button>
          </div>
        </div>
      )}

      {labelQueue.length>0&&(
        <div className="overlay">
          <div className="modal" style={{maxWidth:580}}>
            <h3>Label Transactions <span style={{color:'#64748b',fontSize:14,fontWeight:400}}>({labelQueue.length} remaining)</span></h3>
            <p className="hint">E-transfers and ATM withdrawals need your input. Use "Transfer — Exclude" for internal household transfers (e.g. SR↔NR account moves).</p>
            {labelQueue.slice(0,5).map(t=>(
              <div key={t.id} style={{borderBottom:'1px solid #1e293b',padding:'12px 0'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div><span style={{fontSize:11,color:'#475569'}}>{t.date} · {t.account}</span><div style={{fontWeight:600,color:'#e2e8f0'}}>{t.merchant}</div></div>
                  <span style={{fontWeight:700,fontSize:16,color:t.type==='credit'?'#22c55e':'#f87171'}}>{t.type==='credit'?'+':'-'}{fmt(t.amount)}</span>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <select value={labelSel[t.id]||''} onChange={e=>{setLabelSel(p=>({...p,[t.id]:e.target.value}));setLabelCust(p=>({...p,[t.id]:''}))}} className="tx-cat-sel" style={{flex:2,minWidth:180}}>
                    <option value="">Select category...</option>
                    <option value="Transfer — Exclude">Transfer — Exclude (internal)</option>
                    <option value="Custom / Misc">✏ Custom / Misc...</option>
                    <optgroup label="──────────"/>
                    {Object.entries(CATEGORY_GROUPS).filter(([g])=>g!=='Transfers').flatMap(([,{cats}])=>cats.map(c=><option key={c} value={c}>{c}</option>))}
                  </select>
                  {labelSel[t.id]==='Custom / Misc'&&<input placeholder="Label (e.g. Gurshaan hockey)" value={labelCust[t.id]||''} onChange={e=>setLabelCust(p=>({...p,[t.id]:e.target.value}))} style={{flex:2,minWidth:130}}/>}
                  <input placeholder="Remark (optional)" value={labelRmk[t.id]||''} onChange={e=>setLabelRmk(p=>({...p,[t.id]:e.target.value}))} style={{flex:1,minWidth:100}}/>
                  <button className="btn-sm" onClick={()=>{
                    const sel=labelSel[t.id]; if(!sel) return
                    const cl=sel==='Custom / Misc'?(labelCust[t.id]||null):null
                    updateCat(t.id,cl?'Custom / Misc':sel,labelRmk[t.id]||null,cl)
                  }}>Apply</button>
                </div>
              </div>
            ))}
            <div style={{display:'flex',gap:12,marginTop:12}}>
              <button className="btn-secondary" onClick={()=>setLabelQueue([])}>Done for now</button>
              {labelQueue.length>5&&<span className="hint">+{labelQueue.length-5} more visible in transaction lists</span>}
            </div>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">R</div>
          <div><div className="brand-name">Rathore Finances</div><div className="brand-sub">Household Dashboard · 2026</div></div>
        </div>
        <div className="header-controls">
          <select className="month-picker" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>
            {moList.map(m=><option key={m} value={m}>{moLabel(m)}</option>)}
          </select>
          <button className="btn-primary" onClick={()=>setShowUpload(true)}>↑ Upload CSV</button>
          <button className="btn-outline" onClick={recategorizeAll}>↻ Re-categorize</button>
          <button className="btn-outline" onClick={()=>setShowBudget(b=>!b)}>⚙ Budget</button>
        </div>
      </header>

      <div className="nw-strip">
        {[
          {label:'SR Bank',value:srBal,empty:!getAllTx(selectedMonth,'SR_BANK').length},
          {label:'NR Bank',value:nrBal,empty:!getAllTx(selectedMonth,'NR_BANK').length},
          {label:'Invested',value:invTotal,empty:!investments},
          {label:'Net Worth',value:netWorth,hl:true},
        ].map(({label,value,empty,hl})=>(
          <div key={label} className={`nw-chip ${hl?'nw-highlight':''}`}>
            <span className="nw-label">{label}</span>
            <span className={`nw-val ${hl?'nw-accent':''}`}>{(empty&&!hl)?'—':fmtK(value)}</span>
          </div>
        ))}
      </div>

      <nav className="tabs">
        {[{id:'dashboard',icon:'⌂',label:'Dashboard'},{id:'household',icon:'⇄',label:'Household'},{id:'spending',icon:'◈',label:'Spending'},{id:'investments',icon:'↗',label:'Investments'},{id:'annual',icon:'≡',label:'Annual'}].map(({id,icon,label})=>(
          <button key={id} className={`tab-btn ${activeTab===id?'tab-active':''}`} onClick={()=>setActiveTab(id)}>
            <span className="tab-icon">{icon}</span>{label}
          </button>
        ))}
      </nav>

      {showBudget&&(
        <div className="budget-panel">
          <div className="bp-header">
            <h3>Monthly Budget Targets</h3>
            <div><button className="btn-ghost" onClick={()=>setBudget(DEFAULT_BUDGET)}>Reset Defaults</button><button className="btn-primary" onClick={()=>setShowBudget(false)}>Save & Close</button></div>
          </div>
          <div className="bp-grid">
            {Object.entries(DEFAULT_BUDGET).map(([cat])=>(
              <div key={cat} className="bp-item"><label style={{color:catColor(cat)}}>{cat}</label><input type="number" value={budget[cat]??0} onChange={e=>setBudget(p=>({...p,[cat]:parseFloat(e.target.value)||0}))}/></div>
            ))}
          </div>
        </div>
      )}
      <main className="main">
        {activeTab==='dashboard'&&(
          <div className="view">
            <h2 className="view-title">{moLabel(selectedMonth)}</h2>
            <div className="kpi-row">
              {[
                {l:'Total Income',v:fmt(totalIncome),cls:'kpi-green',sub:`Budget: ${fmtK(bgtIncome)}`},
                {l:'Fixed Expenses',v:fmt(totalFixed),cls:'kpi-red',sub:'Bank account outflows'},
                {l:'CC Spending',v:fmt(totalCcSpend),cls:'kpi-red',sub:`${allCc.filter(t=>t.type==='debit').length} transactions`},
                {l:'Savings',v:fmt(totalSavings),cls:'kpi-blue',sub:`Rate: ${savingsRate}%`},
                {l:'Period Progress',v:periodProg+'%',cls:periodProg>75?'kpi-green':periodProg>40?'kpi-accent':'kpi-red',sub:moLabel(selectedMonth).split(' ')[0]+' is '+periodProg+'% complete'},
                {l:'Unallocated',v:fmt(unallocated),cls:unallocated>=0?'kpi-green':'kpi-red',sub:'Income − Fixed − CCPay − Savings'},
              ].map(({l,v,cls,sub})=>(
                <div key={l} className="kpi-card"><div className="kpi-label">{l}</div><div className={`kpi-value ${cls}`}>{v}</div><div className="kpi-sub">{sub}</div></div>
              ))}
            </div>

            <div style={{background:'#0a0f1e',border:'1px solid #1e293b',borderRadius:10,padding:'16px 20px',marginBottom:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
                <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',color:'#475569',textTransform:'uppercase'}}>Zero-Based Budget — Every Dollar Has a Job</span>
                <span style={{fontSize:13,color:unallocated>=0?'#22c55e':'#ef4444',fontWeight:600}}>{unallocated>=0?fmt(unallocated)+' still unallocated':fmt(Math.abs(unallocated))+' over-allocated'}</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:2}}>
                {[
                  {l:'Income',v:totalIncome,c:'#22c55e'},
                  {l:'− Fixed',v:totalFixed,c:'#f97316'},
                  {l:'− CC Pay',v:totalCcPay,c:'#94a3b8'},
                  {l:'− Savings',v:totalSavings,c:'#3b82f6'},
                  {l:'= Balance',v:unallocated,c:unallocated>=0?'#22c55e':'#ef4444'},
                ].map(({l,v,c})=>(
                  <div key={l} style={{flex:1,minWidth:100,padding:'10px 14px',background:'#0f172a',borderRadius:6,margin:2}}>
                    <div style={{fontSize:11,color:'#475569',marginBottom:4}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:c}}>{fmt(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section">
              <div className="section-head"><h3>50 / 30 / 20 Benchmark</h3><span className="hint">Actual % of income · {periodProg}% of month elapsed</span></div>
              {[
                {l:'Needs (50%)',amt:needsAmt,pct:needsPct,target:50,c:'#f97316',sub:'Fixed bank expenses + Groceries'},
                {l:'Wants (30%)',amt:wantsAmt,pct:wantsPct,target:30,c:'#eab308',sub:'CC spending excl. groceries'},
                {l:'Savings (20%)',amt:totalSavings,pct:savPct,target:20,c:'#3b82f6',sub:'FHSA, TFSA, RESP, RRSP'},
              ].map(({l,amt,pct,target,c,sub})=>(
                <div key={l} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                    <div><span style={{fontSize:13,fontWeight:600,color:'#94a3b8'}}>{l}</span><span style={{fontSize:11,color:'#475569',marginLeft:8}}>{sub}</span></div>
                    <span style={{fontSize:14,fontWeight:700,color:pct<=target?c:'#ef4444'}}>{pct}% <span style={{fontSize:12,color:'#475569',fontWeight:400}}>({fmt(amt)})</span></span>
                  </div>
                  <div style={{position:'relative',width:'100%',height:8,background:'#1e293b',borderRadius:4,overflow:'hidden'}}>
                    <div style={{position:'absolute',left:target+'%',top:0,width:2,height:'100%',background:'#334155',zIndex:2}}/>
                    <div style={{height:'100%',width:Math.min(pct,100)+'%',background:pct<=target?c:'#ef4444',borderRadius:4,transition:'width 0.3s'}}/>
                  </div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="section-head"><h3>Spending by Group</h3></div>
              <table className="data-table">
                <thead><tr><th>Group</th><th>Actual</th><th>Budget</th><th style={{width:200}}>vs Budget</th><th>Status</th></tr></thead>
                <tbody>
                  {Object.entries(CATEGORY_GROUPS).filter(([g])=>!['Income','Transfers'].includes(g)).map(([gName,{color,cats}])=>{
                    const src=CC_SPEND_GROUPS.includes(gName)?allCc:allBk
                    const actual=src.filter(t=>cats.includes(t.category)&&t.type==='debit').reduce((s,t)=>s+t.amount,0)
                    const bgt=cats.reduce((s,c)=>s+(budget[c]||0),0)
                    if(!actual&&!bgt) return null
                    const pct=bgt>0?Math.round(actual/bgt*100):null, over=bgt>0&&actual>bgt
                    return(
                      <tr key={gName}>
                        <td><span style={{color,fontWeight:600}}>{gName}</span></td>
                        <td className="num">{fmt(actual)}</td>
                        <td className="num muted">{bgt?fmt(bgt):'—'}</td>
                        <td>{pct!==null&&<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{flex:1}}><Bar actual={actual} budget={bgt} color={color}/></div><span style={{fontSize:12,color:over?'#ef4444':'#64748b',minWidth:34}}>{pct}%</span></div>}</td>
                        <td>{over?<span className="badge-warn">Over</span>:bgt?<span className="badge-ok">OK</span>:<span className="muted">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="section">
              <div className="section-head"><h3>Savings</h3><span style={{color:'#3b82f6',fontWeight:700}}>Rate: {savingsRate}% <span style={{color:'#475569',fontWeight:400,fontSize:12}}>/ 20% target</span></span></div>
              <table className="data-table">
                <thead><tr><th>Account</th><th>Contributed</th><th>Budget</th><th style={{width:160}}>Progress</th><th>Note</th></tr></thead>
                <tbody>
                  {SAVINGS_CATS.map(cat=>{
                    const actual=allBk.filter(t=>t.category===cat&&t.type==='debit').reduce((s,t)=>s+t.amount,0)
                    const bgt=budget[cat]||0; if(!actual&&!bgt) return null
                    return(
                      <tr key={cat}>
                        <td style={{paddingLeft:20}}>{cat}</td>
                        <td className="num blue">{fmt(actual)}</td>
                        <td className="num muted">{bgt?fmt(bgt):'—'}</td>
                        <td>{bgt?<Bar actual={actual} budget={bgt} color="#3b82f6"/>:null}</td>
                        <td>{bgt&&actual>=bgt?<span className="badge-ok">✓</span>:bgt===0?<span style={{fontSize:11,color:'#ef4444'}}>No target set</span>:null}</td>
                      </tr>
                    )
                  })}
                  <tr className="total-row"><td>Total</td><td className="num blue">{fmt(totalSavings)}</td><td className="num muted">{fmt(bgtSavings)}</td><td><Bar actual={totalSavings} budget={bgtSavings} color="#3b82f6" height={8}/></td><td/></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab==='household'&&(()=>{
          const srGet=(cat,tp)=>srBk.filter(t=>t.category===cat&&t.type===tp).reduce((s,t)=>s+t.amount,0)
          const nrGet=(cat,tp)=>nrBk.filter(t=>t.category===cat&&t.type===tp).reduce((s,t)=>s+t.amount,0)
          const allBkAll=[...getAllTx(selectedMonth,'SR_BANK'),...getAllTx(selectedMonth,'NR_BANK')]
          const needsLabel=allBkAll.filter(t=>t.needsLabel||(!t.category&&!t.customLabel)||t.category==='Uncategorized').length
          return(
            <div className="view">
              <h2 className="view-title">Household Bank Accounts — {moLabel(selectedMonth)}</h2>
              <p className="hint" style={{marginBottom:16}}>SR and NR columns show which bank account each transaction came from. The same expense may appear in either column depending on who paid that month — the Combined column is always the household total.</p>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
                {[{id:'SR_BANK',name:'Simran — Scotia Bank',color:'#22c55e'},{id:'NR_BANK',name:'Navneet — Scotia Bank',color:'#3b82f6'}].map(({id,name,color})=>(
                  <div key={id} style={{background:'#0a0f1e',border:'1px solid #1e293b',borderRadius:10,padding:16}}>
                    <div style={{fontWeight:700,color,marginBottom:10}}>{name}</div>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <label style={{fontSize:12,color:'#64748b',minWidth:130}}>Opening Balance:</label>
                      <input type="number" placeholder="0.00" value={getOB(id,selectedMonth)||''} onChange={e=>setOBVal(id,selectedMonth,e.target.value)} style={{width:130}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid #1e293b'}}>
                      <span style={{fontSize:12,color:'#64748b'}}>Closing Balance:</span>
                      <span style={{fontWeight:700,color:getClose(id,selectedMonth)>=0?'#22c55e':'#ef4444'}}>{fmt(getClose(id,selectedMonth))}</span>
                    </div>
                  </div>
                ))}
              </div>

              {needsLabel>0&&<div style={{background:'#1c0a00',border:'1px solid #f97316',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#f97316'}}>⚠ {needsLabel} bank transaction{needsLabel>1?'s':''} need{needsLabel===1?'s':''} labels — scroll to transaction list below or use the label prompt.</div>}

              <div className="section">
                <div className="section-head"><h3>Planned vs Actual — Bank Accounts</h3></div>
                <div style={{overflowX:'auto'}}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{minWidth:180}}>Category</th>
                        <th className="num" style={{color:'#22c55e'}}>SR Bank</th>
                        <th className="num" style={{color:'#3b82f6'}}>NR Bank</th>
                        <th className="num">Combined</th>
                        <th className="num">Budget</th>
                        <th className="num">Diff</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HH_GROUPS.map(gName=>{
                        const {color,cats}=CATEGORY_GROUPS[gName]
                        const isIncome=gName==='Income'
                        const type=isIncome?'credit':'debit'
                        const groupSR=cats.reduce((s,c)=>s+srGet(c,type),0)
                        const groupNR=cats.reduce((s,c)=>s+nrGet(c,type),0)
                        const groupComb=groupSR+groupNR
                        const groupBgt=cats.reduce((s,c)=>s+(budget[c]||0),0)
                        const diff=isIncome?groupComb-groupBgt:groupBgt-groupComb
                        return(
                          <React.Fragment key={gName}>
                            <tr style={{background:'#0a0f1e'}}>
                              <td colSpan={7} style={{padding:'8px 16px 4px',fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color,borderTop:'1px solid #1e293b'}}>{gName}</td>
                            </tr>
                            {cats.map(cat=>{
                              const sr=srGet(cat,type), nr=nrGet(cat,type), comb=sr+nr, bgt=budget[cat]||0
                              if(!sr&&!nr&&!bgt) return null
                              const d=isIncome?comb-bgt:bgt-comb
                              return(
                                <tr key={cat}>
                                  <td style={{paddingLeft:24,color:'#94a3b8'}}>{cat}</td>
                                  <td className="num" style={{color:sr?'#22c55e':'#1e293b'}}>{sr?fmt(sr):'—'}</td>
                                  <td className="num" style={{color:nr?'#3b82f6':'#1e293b'}}>{nr?fmt(nr):'—'}</td>
                                  <td className="num">{comb?fmt(comb):'—'}</td>
                                  <td className="num muted">{bgt?fmt(bgt):'—'}</td>
                                  <td className={`num ${d>=0?'green':'red'}`}>{bgt?(d>=0?'+':'')+fmt(d):'—'}</td>
                                  <td>{bgt&&d<0?<span className="badge-warn">Off</span>:bgt&&d>=0?<span className="badge-ok">✓</span>:<span className="muted">—</span>}</td>
                                </tr>
                              )
                            })}
                            <tr className="total-row">
                              <td style={{paddingLeft:16,fontWeight:700}}>Total {gName}</td>
                              <td className="num" style={{color:'#22c55e'}}>{groupSR?fmt(groupSR):'—'}</td>
                              <td className="num" style={{color:'#3b82f6'}}>{groupNR?fmt(groupNR):'—'}</td>
                              <td className="num bold">{fmt(groupComb)}</td>
                              <td className="num muted">{groupBgt?fmt(groupBgt):'—'}</td>
                              <td className={`num ${diff>=0?'green':'red'}`}>{groupBgt?(diff>=0?'+':'')+fmt(diff):'—'}</td>
                              <td/>
                            </tr>
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="section">
                <div className="section-head">
                  <h3>All Bank Transactions ({allBkAll.length})</h3>
                  {needsLabel>0&&<span className="badge-warn">{needsLabel} need labels</span>}
                </div>
                {allBkAll.length===0?<p className="empty-msg">No bank transactions for {selectedMonth}. Upload SR or NR Scotia Bank CSV.</p>:(
                  <div className="tx-list">
                    {allBkAll.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>(
                      <div key={t.id} className={`tx-row ${t.needsLabel||t.category==='Uncategorized'||!t.category?'tx-unlabeled':''}`}>
                        <span className="tx-date">{t.date.slice(5)}</span>
                        <span className="tx-tag" style={{background:t.account==='SR_BANK'?'#052e16':'#001236',color:t.account==='SR_BANK'?'#22c55e':'#60a5fa'}}>{t.account==='SR_BANK'?'SR':'NR'}</span>
                        <span className="tx-merchant">{t.customLabel||t.merchant}</span>
                        {t.remark&&<span style={{fontSize:11,color:'#475569',fontStyle:'italic',marginLeft:4}}>({t.remark})</span>}
                        {EXCLUDE_CATS.includes(t.category)&&<span style={{fontSize:11,color:'#64748b',marginLeft:4,background:'#1e293b',borderRadius:4,padding:'2px 6px'}}>excluded</span>}
                        <span className={`tx-amt ${t.type==='credit'?'green':'red'}`}>{t.type==='credit'?'+':'-'}{fmt(t.amount)}</span>
                        <select value={t.customLabel?'Custom / Misc':t.category||''} onChange={e=>handleCatChange(t.id,e.target.value)} className="tx-cat-sel">
                          <option value="">— Uncategorized —</option>
                          <option value="Transfer — Exclude">Transfer — Exclude (internal)</option>
                          <option value="Custom / Misc">✏ Custom / Misc...</option>
                          <optgroup label="──────────"/>
                          {Object.entries(CATEGORY_GROUPS).filter(([g])=>g!=='Transfers').flatMap(([,{cats}])=>cats.map(c=><option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
        {activeTab==='spending'&&(
          <div className="view">
            <h2 className="view-title">CC Spending — {moLabel(selectedMonth)}</h2>
            <p className="hint" style={{marginBottom:16}}>Day-to-day spending on Scotia Visa and CIBC Costco card. Kept separate from bank numbers to avoid double-counting.</p>

            <div className="kpi-row" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              <div className="kpi-card"><div className="kpi-label">Scotia Visa</div><div className="kpi-value kpi-red">{fmt(srCc.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0))}</div><div className="kpi-sub">{srCc.length} transactions</div></div>
              <div className="kpi-card"><div className="kpi-label">CIBC (Costco)</div><div className="kpi-value kpi-red">{fmt(cibc.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0))}</div><div className="kpi-sub">{cibc.length} transactions</div></div>
              <div className="kpi-card"><div className="kpi-label">Total CC Spend</div><div className="kpi-value kpi-red">{fmt(totalCcSpend)}</div><div className="kpi-sub">Both cards</div></div>
            </div>

            {CC_SPEND_GROUPS.map(gName=>{
              const {color,cats}=CATEGORY_GROUPS[gName]
              const groupTx=allCc.filter(t=>cats.includes(t.category)&&t.type==='debit')
              const groupAmt=groupTx.reduce((s,t)=>s+t.amount,0)
              const groupBgt=cats.reduce((s,c)=>s+(budget[c]||0),0)
              if(!groupTx.length&&!groupBgt) return null
              return(
                <div key={gName} className="section">
                  <div className="section-head">
                    <h3 style={{color}}>{gName}</h3>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:13}}>{fmt(groupAmt)} {groupBgt?<span className="muted">/ {fmt(groupBgt)}</span>:null}</span>
                      {groupBgt&&<div style={{width:120}}><Bar actual={groupAmt} budget={groupBgt} color={color} height={8}/></div>}
                      {groupBgt&&groupAmt>groupBgt&&<span className="badge-warn">Over</span>}
                    </div>
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Category</th><th>Actual</th><th>Budget</th><th style={{width:180}}>Progress</th><th>Status</th></tr></thead>
                    <tbody>
                      {cats.map(cat=>{
                        const actual=allCc.filter(t=>t.category===cat&&t.type==='debit').reduce((s,t)=>s+t.amount,0)
                        const bgt=budget[cat]||0; if(!actual&&!bgt) return null
                        const over=bgt>0&&actual>bgt
                        return(
                          <tr key={cat}>
                            <td style={{paddingLeft:20}}>{cat}</td>
                            <td className="num">{fmt(actual)}</td>
                            <td className="num muted">{bgt?fmt(bgt):'—'}</td>
                            <td>{bgt?<div style={{display:'flex',alignItems:'center',gap:8}}><div style={{flex:1}}><Bar actual={actual} budget={bgt} color={color}/></div><span style={{fontSize:11,color:over?'#ef4444':'#64748b',minWidth:34}}>{bgt>0?Math.round(actual/bgt*100):0}%</span></div>:null}</td>
                            <td>{over?<span className="badge-warn">Over</span>:bgt?<span className="badge-ok">OK</span>:<span className="muted">—</span>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}

            <div className="section">
              <div className="section-head">
                <h3>All CC Transactions ({allCc.length})</h3>
                {allCc.filter(t=>t.category==='Uncategorized').length>0&&<span className="badge-warn">{allCc.filter(t=>t.category==='Uncategorized').length} uncategorized</span>}
              </div>
              {allCc.length===0?<p className="empty-msg">No CC transactions for {selectedMonth}. Upload Scotia Visa or CIBC CSV.</p>:(
                <div className="tx-list">
                  {allCc.sort((a,b)=>b.date.localeCompare(a.date)).map(t=>(
                    <div key={t.id} className={`tx-row ${t.category==='Uncategorized'||!t.category?'tx-unlabeled':''}`}>
                      <span className="tx-date">{t.date.slice(5)}</span>
                      <span className="tx-tag">{t.account==='SR_CIBC'?'CIBC':'Visa'}</span>
                      <span className="tx-merchant">{t.customLabel||t.merchant}</span>
                      {t.remark&&<span style={{fontSize:11,color:'#475569',fontStyle:'italic',marginLeft:4}}>({t.remark})</span>}
                      <span className={`tx-amt ${t.type==='credit'?'green':'red'}`}>{t.type==='credit'?'+':'-'}{fmt(t.amount)}</span>
                      <select value={t.customLabel?'Custom / Misc':t.category||''} onChange={e=>handleCatChange(t.id,e.target.value)} className="tx-cat-sel">
                        <option value="">— Uncategorized —</option>
                        <option value="Custom / Misc">✏ Custom / Misc...</option>
                        <optgroup label="──────────"/>
                        {CC_SPEND_GROUPS.flatMap(g=>CATEGORY_GROUPS[g].cats.map(c=><option key={c} value={c}>{c}</option>))}
                        <option value="Auto Maintenance">Auto Maintenance</option>
                        <option value="Parking">Parking</option>
                        <option value="Rideshare">Rideshare</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {allCc.filter(t=>t.customLabel).length>0&&(
              <div className="section">
                <div className="section-head"><h3 style={{color:'#94a3b8'}}>✏ Custom / Misc</h3></div>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Label</th><th>Merchant</th><th>Remark</th><th>Amount</th></tr></thead>
                  <tbody>
                    {allCc.filter(t=>t.customLabel).map(t=>(
                      <tr key={t.id}><td>{t.date}</td><td style={{color:'#e2e8f0',fontWeight:600}}>{t.customLabel}</td><td className="muted">{t.merchant}</td><td className="muted">{t.remark||'—'}</td><td className="num red">{fmt(t.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab==='investments'&&(
          <div className="view">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
              <h2 style={{margin:0}}>Wealthsimple Portfolio</h2>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                {investments?.lastUpdated&&<span className="hint">As of {investments.lastUpdated}</span>}
                <button className="btn-outline" onClick={()=>{setUploadAccount('WEALTHSIMPLE');setShowUpload(true)}}>↑ Update Holdings</button>
              </div>
            </div>
            {!investments?(
              <div className="empty-state">
                <p>Upload your Wealthsimple Holdings CSV to track your portfolio.</p>
                <button className="btn-primary" onClick={()=>{setUploadAccount('WEALTHSIMPLE');setShowUpload(true)}}>Upload Now</button>
              </div>
            ):(
              <>
                <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                  {[
                    {l:'FHSA',v:investments.FHSA,sub:'First Home Savings'},
                    {l:'TFSA',v:investments.TFSA,sub:'Tax-Free Savings'},
                    {l:'RRSP',v:investments.RRSP,sub:'Retirement Savings'},
                    {l:'Non-Registered',v:investments['Non-Registered'],sub:'NVDA · SOXL · KVYO'},
                  ].map(({l,v,sub})=>(
                    <div key={l} className="kpi-card"><div className="kpi-label">{l}</div><div className="kpi-value kpi-accent">{fmt(v)}</div><div className="kpi-sub">{sub}</div></div>
                  ))}
                </div>
                <div className="kpi-row" style={{gridTemplateColumns:'1fr',marginTop:0}}>
                  <div className="kpi-card" style={{gridColumn:'1/-1'}}>
                    <div className="kpi-label">Total Portfolio</div>
                    <div className="kpi-value nw-accent">{fmt(invTotal)}</div>
                    <div className="kpi-sub">Net Worth (incl. bank): {fmt(netWorth)}</div>
                  </div>
                </div>

                <div className="section">
                  <div className="section-head"><h3>Net Worth Breakdown</h3></div>
                  <div style={{background:'#0a0f1e',border:'1px solid #1e293b',borderRadius:10,padding:'4px 0'}}>
                    {[
                      {l:'SR Scotia Bank (est.)',v:srBal,c:'#22c55e'},
                      {l:'NR Scotia Bank (est.)',v:nrBal,c:'#3b82f6'},
                      {l:'SR FHSA',v:investments.FHSA,c:'#a855f7'},
                      {l:'SR TFSA',v:investments.TFSA,c:'#a855f7'},
                      {l:'NR RRSP',v:investments.RRSP,c:'#a855f7'},
                      {l:'Non-Registered (Wealthsimple)',v:investments['Non-Registered'],c:'#f97316'},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'12px 20px',borderBottom:'1px solid #1e293b'}}>
                        <span style={{color:'#94a3b8'}}>{l}</span>
                        <span style={{color:c,fontWeight:600}}>{fmt(v)}</span>
                      </div>
                    ))}
                    <div style={{display:'flex',justifyContent:'space-between',padding:'14px 20px',background:'#0f172a'}}>
                      <span style={{fontWeight:700,color:'#e2e8f0'}}>Total Net Worth</span>
                      <span style={{fontWeight:700,fontSize:18,color:'#22c55e'}}>{fmt(netWorth)}</span>
                    </div>
                  </div>
                </div>

                <div className="section">
                  <div className="section-head"><h3>Strategy Notes</h3></div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {[
                      {type:'warn',title:'⚠️ SOXL Risk Alert',body:'Your non-registered account holds SOXL — a 3× leveraged semiconductor ETF. It can drop 60–80% in a downturn due to daily rebalancing decay. Review whether this aligns with your family risk tolerance given the vehicle loan, daycare, and school fees.'},
                      {type:'tip',title:'💡 FHSA Priority — Both of You',body:'Navneet should also open her own FHSA. You each get $8,000/year room ($40,000 lifetime). Combined you can shelter $80,000 tax-free for your first home purchase. From your 2025 sheet, NR FHSA was planned but contributions were missed most months.'},
                      {type:'tip',title:'📈 RRSP Tax Advantage',body:'At ~$96K/year SR income, every RRSP dollar saves roughly 30–33 cents in tax. Priority order: FHSA first (double benefit — deduction + tax-free growth), then RRSP, then TFSA.'},
                      {type:'tip',title:'👨‍👧‍👦 RESP — Two Kids',body:'Gurshaan and Gurnadar each qualify for the Canada Education Savings Grant (CESG) — 20% on first $2,500/year = $500 free money per child. Maximizing both RESPs before other investments is often the best return.'},
                    ].map(({type,title,body})=>(
                      <div key={title} style={{background:type==='warn'?'#1c0700':'#051a36',border:`1px solid ${type==='warn'?'#f97316':'#1e3a5f'}`,borderRadius:10,padding:'14px 18px'}}>
                        <div style={{fontWeight:700,marginBottom:6,color:type==='warn'?'#f97316':'#60a5fa'}}>{title}</div>
                        <p style={{color:'#94a3b8',margin:0,fontSize:13,lineHeight:1.6}}>{body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab==='annual'&&(()=>{
          const months=['01','02','03','04','05','06','07','08','09','10','11','12'].map(m=>`2026-${m}`)
          const mNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
          const rows=[
            {label:'SR Income',    fn:mo=>sumOf(getTx(mo,'SR_BANK'),INCOME_CATS,'credit'), c:'#22c55e'},
            {label:'NR Income',    fn:mo=>sumOf(getTx(mo,'NR_BANK'),INCOME_CATS,'credit'), c:'#22c55e'},
            {label:'Total Income', fn:mo=>sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],INCOME_CATS,'credit'), c:'#22c55e', bold:true},
            {label:'Fixed Exp.',   fn:mo=>sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],FIXED_CATS,'debit'), c:'#f97316'},
            {label:'CC Spending',  fn:mo=>[...getTx(mo,'SR_CC'),...getTx(mo,'SR_CIBC')].filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0), c:'#ef4444'},
            {label:'Savings',      fn:mo=>sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],SAVINGS_CATS,'debit'), c:'#3b82f6', bold:true},
          ]
          const maxIncome=Math.max(...months.map(mo=>sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],INCOME_CATS,'credit')),1)
          return(
            <div className="view">
              <h2 className="view-title">2026 Annual Overview</h2>

              <div className="section">
                <div className="section-head"><h3>Monthly Income vs Spending</h3></div>
                <div style={{display:'flex',gap:4,alignItems:'flex-end',height:160,padding:'0 0 8px',overflowX:'auto'}}>
                  {months.map((mo,i)=>{
                    const inc=sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],INCOME_CATS,'credit')
                    const exp=sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],FIXED_CATS,'debit')
                    const cc=[...getTx(mo,'SR_CC'),...getTx(mo,'SR_CIBC')].filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0)
                    const sav=sumOf([...getTx(mo,'SR_BANK'),...getTx(mo,'NR_BANK')],SAVINGS_CATS,'debit')
                    const hasData=inc||exp||cc||sav
                    return(
                      <div key={mo} style={{flex:1,minWidth:36,display:'flex',flexDirection:'column',alignItems:'center',gap:2,opacity:hasData?1:0.3}}>
                        <div style={{width:'100%',display:'flex',flexDirection:'column',justifyContent:'flex-end',height:140,gap:1}}>
                          {[{v:inc,c:'#22c55e'},{v:exp+cc,c:'#f97316'},{v:sav,c:'#3b82f6'}].map(({v,c},j)=>(
                            <div key={j} style={{width:'100%',height:Math.max((v/maxIncome)*130,v>0?2:0),background:c,borderRadius:'2px 2px 0 0',minHeight:v>0?2:0}}/>
                          ))}
                        </div>
                        <span style={{fontSize:10,color:'#475569'}}>{mNames[i]}</span>
                      </div>
                    )
                  })}
                </div>
                <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:8,fontSize:12}}>
                  {[{c:'#22c55e',l:'Income'},{c:'#f97316',l:'Fixed+CC'},{c:'#3b82f6',l:'Savings'}].map(({c,l})=>(
                    <div key={l} style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:12,height:12,background:c,borderRadius:2}}/><span style={{color:'#64748b'}}>{l}</span></div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-head"><h3>Monthly Summary Table</h3></div>
                <div style={{overflowX:'auto'}}>
                  <table className="annual-table">
                    <thead><tr><th>Category</th>{mNames.map(m=><th key={m}>{m}</th>)}<th>Total</th></tr></thead>
                    <tbody>
                      {rows.map(({label,fn,c,bold})=>{
                        const vals=months.map(fn)
                        const total=vals.reduce((s,v)=>s+v,0)
                        return(
                          <tr key={label} className={bold?'bold-row':''}>
                            <td style={{color:c}}>{label}</td>
                            {vals.map((v,i)=><td key={i} className={`num ${c==='#22c55e'?'green':c==='#3b82f6'?'blue':'red'}`}>{v>0?'$'+Math.round(v).toLocaleString():'—'}</td>)}
                            <td className={`num bold ${c==='#22c55e'?'green':c==='#3b82f6'?'blue':'red'}`}>${Math.round(total).toLocaleString()}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })()}
      </main>

      <footer className="footer">
        <span className="muted">Rathore Household · {new Date().getFullYear()} · Built with ❤️</span>
        <button className="btn-danger" onClick={()=>{if(window.confirm('Clear ALL data? This cannot be undone.')){setTransactions([]);setInvestments(null);setOpeningBal({});setLabelQueue([])}}}>Clear All Data</button>
      </footer>
    </div>
  )
}
