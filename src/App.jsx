import { useState, useEffect, useRef } from "react";
import "./App.css";

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: "sr_scotia_bank", label: "SR Scotia Bank",                   type: "bank" },
  { id: "nr_scotia_bank", label: "NR Scotia Bank",                   type: "bank" },
  { id: "sr_scotia_visa", label: "SR Scotia Momentum Infinite Visa", type: "cc"   },
  { id: "sr_cibc_mc",     label: "SR CIBC Costco Mastercard",        type: "cc"   },
  { id: "sr_tangerine",   label: "SR Tangerine",                     type: "cc"   },
];

const INVEST_ACCOUNTS = [
  { id: "sr_fhsa",       label: "SR FHSA"         },
  { id: "sr_tfsa",       label: "SR TFSA"         },
  { id: "resp_gurshaan", label: "RESP — Gurshaan" },
  { id: "resp_gurnadar", label: "RESP — Gurnadar" },
  { id: "nr_fhsa",       label: "NR FHSA"         },
  { id: "nr_rrsp",       label: "NR RRSP"         },
];

const CC_ACCOUNT_IDS   = ["sr_scotia_visa", "sr_cibc_mc", "sr_tangerine"];
const SR_SAVINGS_HEADS = ["SR FHSA", "SR TFSA"];
const NR_SAVINGS_HEADS = ["NR FHSA", "NR RRSP", "Gurshaan RESP", "Gurnadar RESP"];

// ─── DEFAULT CATEGORIES (structure + standard budget) ─────────────────────────

const DEFAULT_CATEGORIES = {
  income: [
    { head: "Simranvir Rathore", subs: ["SR Salary","Car Reimbursement","Other Income"], budget: { "SR Salary":8000,"Car Reimbursement":250,"Other Income":0 } },
    { head: "Navneet Rathore",   subs: ["NR DS Paycheck","Canada Child Benefit","Other Income"], budget: { "NR DS Paycheck":6700,"Canada Child Benefit":967,"Other Income":0 } },
  ],
  expenses: [
    { head: "Home",           subs: ["Rent","Utilities"],                                                                                                                   budget: { Rent:3000, Utilities:350 } },
    { head: "Transportation", subs: ["Tesla Loan","Tesla ICBC","Van ICBC","ICBC Annual Renewal","Gas","Tesla App","Rideshare","Car Maintenance","Parking"],                 budget: { "Tesla Loan":644,"Tesla ICBC":289,"Van ICBC":180,"ICBC Annual Renewal":0,Gas:250,"Tesla App":16,Rideshare:0,"Car Maintenance":0,Parking:0 } },
    { head: "Family",         subs: ["Gurshaan School Fees","Gurnadar Daycare","Baby Supplies","Kids Activities"],                                                          budget: { "Gurshaan School Fees":450,"Gurnadar Daycare":850,"Baby Supplies":100,"Kids Activities":50 } },
    { head: "Debt & Banking", subs: ["Student Loan","Bank Fees"],                                                                                                           budget: { "Student Loan":153,"Bank Fees":17 } },
    { head: "Food & Dining",  subs: ["Groceries","Dining Out"],                                                                                                             budget: { Groceries:1150,"Dining Out":300 } },
    { head: "Health",         subs: ["Pharmacy & Medical","Wellness & Beauty","YMCA"],                                                                                      budget: { "Pharmacy & Medical":100,"Wellness & Beauty":60,YMCA:54 } },
    { head: "Shopping",       subs: ["Amazon Purchases","Clothing","Household / Dollarama"],                                                                                budget: { "Amazon Purchases":150,Clothing:150,"Household / Dollarama":150 } },
    { head: "Digital",        subs: ["Fido Mobile","Telus Internet","Apple / iCloud","ChatGPT","Amazon Prime","Netflix","Gmail"],                                           budget: { "Fido Mobile":104,"Telus Internet":65,"Apple / iCloud":35,ChatGPT:25,"Amazon Prime":10,Netflix:9,Gmail:2 } },
    { head: "Charity",        subs: ["Charity / Donations"],                                                                                                                budget: { "Charity / Donations":50 } },
    { head: "Custom / Misc",  subs: ["Miscellaneous"],                                                                                                                      budget: { Miscellaneous:60 } },
  ],
  savings: [
    { head:"SR FHSA",budget:650 },{ head:"SR TFSA",budget:500 },
    { head:"NR FHSA",budget:0  },{ head:"NR RRSP",budget:0   },
    { head:"Gurshaan RESP",budget:300 },{ head:"Gurnadar RESP",budget:220 },
  ],
};

// ─── BUDGET HELPERS ───────────────────────────────────────────────────────────

// Build a flat map of subKey → budget amount from categories (used for auto-lock on import)
function buildStandardBudgetMap(categories) {
  const map = {};
  for (const h of categories.income)   { for (const [k,v] of Object.entries(h.budget)) map[k]=v; }
  for (const h of categories.expenses) { for (const [k,v] of Object.entries(h.budget)) map[k]=v; }
  for (const h of categories.savings)  { map[h.head]=h.budget; }
  return map;
}

// Read budget for a subKey directly from a categories object (no fallback needed)
function getEffectiveBudgetFromCats(subKey, cats) {
  for (const h of cats.income)   { if (h.budget?.[subKey] !== undefined) return h.budget[subKey]; }
  for (const h of cats.expenses) { if (h.budget?.[subKey] !== undefined) return h.budget[subKey]; }
  for (const h of cats.savings)  { if (h.head === subKey) return h.budget; }
  return 0;
}

// ─── AUTO-CATEGORIZATION ─────────────────────────────────────────────────────

function autoCategorize(description, subDescription, amount, accountId, merchantMemory={}) {
  const desc=( description    ||"").toLowerCase().trim();
  const sub =(subDescription  ||"").toLowerCase().trim();
  const abs =Math.abs(amount);
  const isCCAcct=ACCOUNTS.find(a=>a.id===accountId)?.type==="cc";

  if (merchantMemory[desc]) return merchantMemory[desc];

  if (/mb-dep|mb dep/.test(desc)) {
    if (accountId==="sr_scotia_bank") return abs>300?{main:"Simranvir Rathore",sub:"SR Salary",section:"income"}:{main:"Simranvir Rathore",sub:"Car Reimbursement",section:"income"};
    if (accountId==="nr_scotia_bank") return {main:"Navneet Rathore",sub:"NR DS Paycheck",section:"income"};
  }

  if (/delta.sd/i.test(sub))                                   return{main:"Navneet Rathore",sub:"NR DS Paycheck",section:"income"};
  if (/pacific.blue.cross/i.test(sub))                         return{main:"Navneet Rathore",sub:"Other Income",section:"income"};
  if (/\bcanada\b/i.test(sub)&&/fed-prov|terr/i.test(desc))   return{main:"Navneet Rathore",sub:"Canada Child Benefit",section:"income"};
  if (/slc.pad/i.test(sub))                                    return{main:"Debt & Banking",sub:"Student Loan",section:"expenses"};
  if (/rbc.loan/i.test(sub))                                   return{main:"Transportation",sub:"Tesla Loan",section:"expenses"};
  if (/gobind.marg/i.test(sub))                                return{main:"Family",sub:"Gurshaan School Fees",section:"expenses"};
  if (/gurdwara/i.test(sub))                                   return{main:"Charity",sub:"Charity / Donations",section:"expenses"};
  if (/cibc.card/i.test(sub))                                  return{main:"TRANSFER",sub:"CC Payment",section:"transfer"};
  if (/monthly.fees/i.test(sub))                               return{main:"Debt & Banking",sub:"Bank Fees",section:"expenses"};
  if (/interac.e-transfer.rtn/i.test(sub))                     return{main:"TRANSFER",sub:"Transfer — Exclude",section:"transfer"};

  if (/free.interac.e-transfer/i.test(sub)) {
    if (accountId==="nr_scotia_bank") {
      if (abs===3000) return{main:"Home",sub:"Rent",section:"expenses"};
      if (abs===850)  return{main:"Family",sub:"Gurnadar Daycare",section:"expenses"};
      if (abs===450)  return{main:"Family",sub:"Gurshaan School Fees",section:"expenses"};
    }
    return{main:"TRANSFER",sub:"Transfer — Exclude",section:"transfer"};
  }

  if ((/insurance.corporation|icbc/i.test(sub)||/^insurance$/i.test(desc))&&!isCCAcct)
    return abs>=220?{main:"Transportation",sub:"Tesla ICBC",section:"expenses"}:{main:"Transportation",sub:"Van ICBC",section:"expenses"};

  if (/wealthsimple/i.test(sub)||/wealthsimple/i.test(desc)) {
    if (abs>=640&&abs<=660) return{main:"SR FHSA",sub:"SR FHSA",section:"savings"};
    if (abs>=490&&abs<=510) return{main:"SR TFSA",sub:"SR TFSA",section:"savings"};
    if (abs>=290&&abs<=310) return{main:"Gurshaan RESP",sub:"Gurshaan RESP",section:"savings"};
    if (abs>=210&&abs<=230) return{main:"Gurnadar RESP",sub:"Gurnadar RESP",section:"savings"};
    return{main:"SR TFSA",sub:"SR TFSA",section:"savings"};
  }

  if (/credit.card.*loc.payment|crd\.card.bill|credit.card.pay/i.test(desc)) return{main:"TRANSFER",sub:"CC Payment",section:"transfer"};
  if (/panorama.place/i.test(desc)||/panorama.place/i.test(sub))             return{main:"TRANSFER",sub:"CC Payment",section:"transfer"};
  if (/scotiabank.transit/i.test(desc)||/scotiabank.transit/i.test(sub))     return{main:"TRANSFER",sub:"Transfer — Exclude",section:"transfer"};
  if (/scotiabank.*transit|abm.*interac/i.test(desc))                         return{main:"TRANSFER",sub:"Transfer — Exclude",section:"transfer"};
  if (/service.charge/i.test(desc))                                           return{main:"Debt & Banking",sub:"Bank Fees",section:"expenses"};
  if (/costco/i.test(sub)&&!isCCAcct&&amount>0)                              return{main:"TRANSFER",sub:"Transfer — Exclude",section:"transfer"};

  const m=`${desc} ${sub}`;

  if (/canada.child|ccb.federal/i.test(m)) return{main:"Navneet Rathore",sub:"Canada Child Benefit",section:"income"};
  if (/\bicbc\b/i.test(m)&&isCCAcct)  return{main:"Transportation",sub:"ICBC Annual Renewal",section:"expenses"};
  if (/\bicbc\b/i.test(m)&&!isCCAcct) return abs>=220?{main:"Transportation",sub:"Tesla ICBC",section:"expenses"}:{main:"Transportation",sub:"Van ICBC",section:"expenses"};

  if (/fruiticana|fruiticna|store.fruiticana/i.test(m)) return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/no.frills/i.test(m))           return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/instacart|ic\*.insta|ic\*.costco/i.test(m)) return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/jeenkha.farms/i.test(m))       return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/sabzi.mandi/i.test(m))         return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/akal.sales/i.test(m))          return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/sunfarm.produce/i.test(m))     return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/freshco/i.test(m))             return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/walmart|wal-mart/i.test(m))    return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/superstore|real cdn|real canadian/i.test(m)) return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/save.on.foods/i.test(m))       return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/t&t.supermarket/i.test(m))     return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/manohar.vegetarian/i.test(m))  return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/punjab.flour.mill/i.test(m))   return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/day.to.day/i.test(m))          return{main:"Food & Dining",sub:"Groceries",section:"expenses"};
  if (/costco/i.test(m)&&isCCAcct)    return{main:"Food & Dining",sub:"Groceries",section:"expenses"};

  if (/uber.eats|ubereats/i.test(m))  return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/super.vege.pizza|\bpizza\b/i.test(m)) return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/udupi.adda/i.test(m))          return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/calgary.sweets/i.test(m))      return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/chimney.hill/i.test(m))        return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/tim.horton/i.test(m))          return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/\bsubway\b/i.test(m))          return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/\ba&w\b|a.and.w/i.test(m))     return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/mcdonald|burger.king|starbucks/i.test(m)) return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/burgrill/i.test(m))            return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/shudh.vaishnu/i.test(m))       return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/purdy.*chocolat/i.test(m))     return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};
  if (/7.eleven|7eleven/i.test(m))    return{main:"Food & Dining",sub:"Dining Out",section:"expenses"};

  if (/\buber\b/i.test(m)&&amount>0)  return{main:"Transportation",sub:"Rideshare",section:"expenses"};
  if (/uber.canada\/ubertrip|uber.holdings|uber \*trip|ubereats/i.test(m)) return{main:"Transportation",sub:"Rideshare",section:"expenses"};
  if (/^uber$/i.test(desc)||/\buber\b/i.test(desc)) return{main:"Transportation",sub:"Rideshare",section:"expenses"};
  if (/^lyft$/i.test(desc)||/\blyft\b/i.test(desc)) return{main:"Transportation",sub:"Rideshare",section:"expenses"};
  if (/impark/i.test(m))              return{main:"Transportation",sub:"Parking",section:"expenses"};
  if (/abby.tires/i.test(m))          return{main:"Transportation",sub:"Car Maintenance",section:"expenses"};
  if (/costco.gas|gas.stn(?!\w)/i.test(m)) return{main:"Transportation",sub:"Gas",section:"expenses"};
  if (/tesla/i.test(m)&&abs<50)       return{main:"Transportation",sub:"Tesla App",section:"expenses"};

  if (/shoppers.drug|shoppers drug/i.test(m)) return{main:"Health",sub:"Pharmacy & Medical",section:"expenses"};
  if (/guildford.drugs/i.test(m))     return{main:"Health",sub:"Pharmacy & Medical",section:"expenses"};
  if (/lifelabs/i.test(m))            return{main:"Health",sub:"Pharmacy & Medical",section:"expenses"};
  if (/physiofirst|physiother/i.test(m)) return{main:"Health",sub:"Pharmacy & Medical",section:"expenses"};
  if (/\bymca\b/i.test(m))            return{main:"Health",sub:"YMCA",section:"expenses"};
  if (/fade.factory|hv.fade|barbershop/i.test(m)) return{main:"Health",sub:"Wellness & Beauty",section:"expenses"};
  if (/sq \*revere|revere.massage/i.test(m)) return{main:"Health",sub:"Wellness & Beauty",section:"expenses"};

  if (/amazon.prime|amznprime/i.test(m)) return{main:"Digital",sub:"Amazon Prime",section:"expenses"};
  if (/\bamazon\b/i.test(m))          return{main:"Shopping",sub:"Amazon Purchases",section:"expenses"};
  if (/dollarama/i.test(m))           return{main:"Shopping",sub:"Household / Dollarama",section:"expenses"};
  if (/elegant.housewares/i.test(m))  return{main:"Shopping",sub:"Household / Dollarama",section:"expenses"};
  if (/\bikea\b/i.test(m))            return{main:"Shopping",sub:"Household / Dollarama",section:"expenses"};
  if (/\bwinners\b/i.test(m))         return{main:"Shopping",sub:"Clothing",section:"expenses"};
  if (/\btemu\b/i.test(m))            return{main:"Shopping",sub:"Clothing",section:"expenses"};
  if (/gap.outlet/i.test(m))          return{main:"Shopping",sub:"Clothing",section:"expenses"};
  if (/la.vie.en.rose/i.test(m))      return{main:"Shopping",sub:"Clothing",section:"expenses"};
  if (/pastime.sports/i.test(m))      return{main:"Shopping",sub:"Clothing",section:"expenses"};
  if (/sport.chek|sportchek/i.test(m)) return{main:"Shopping",sub:"Clothing",section:"expenses"};

  if (/\bfido\b/i.test(m))            return{main:"Digital",sub:"Fido Mobile",section:"expenses"};
  if (/\btelus\b/i.test(m))           return{main:"Digital",sub:"Telus Internet",section:"expenses"};
  if (/apple.bill|apple\.com|icloud/i.test(m)) return{main:"Digital",sub:"Apple / iCloud",section:"expenses"};
  if (/chatgpt|openai/i.test(m))      return{main:"Digital",sub:"ChatGPT",section:"expenses"};
  if (/\bnetflix\b/i.test(m))         return{main:"Digital",sub:"Netflix",section:"expenses"};
  if (/google.*storage|gmail.*storage/i.test(m)) return{main:"Digital",sub:"Gmail",section:"expenses"};

  if (/gobind.marg/i.test(m))         return{main:"Family",sub:"Gurshaan School Fees",section:"expenses"};
  if (/daycare|ecds|child.care/i.test(m)) return{main:"Family",sub:"Gurnadar Daycare",section:"expenses"};
  if (/gurdwara/i.test(m))            return{main:"Charity",sub:"Charity / Donations",section:"expenses"};
  if (/guru.nanak.food.bank/i.test(m)) return{main:"Charity",sub:"Charity / Donations",section:"expenses"};
  if (/newton.library|\blibrary\b/i.test(m)) return{main:"Custom / Misc",sub:"Miscellaneous",section:"expenses"};
  if (/ups.store/i.test(m))           return{main:"Custom / Misc",sub:"Miscellaneous",section:"expenses"};
  if (/bear.creek.train/i.test(m))    return{main:"Custom / Misc",sub:"Miscellaneous",section:"expenses"};
  if (/\bremitly\b/i.test(m))         return{main:"Custom / Misc",sub:"Miscellaneous",section:"expenses"};
  if (/\bnintendo\b/i.test(m))        return{main:"Custom / Misc",sub:"Miscellaneous",section:"expenses"};

  return null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const clean=s=>(s||"").replace(/"/g,"").trim();
function fmt(n){if(n===null||n===undefined||isNaN(n))return"—";return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.abs(n));}
function fmtFull(n){return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
function toMonthKey(dateStr){if(!dateStr)return"";const d=new Date(dateStr+"T00:00:00");if(isNaN(d))return"";return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function monthLabel(key){if(!key)return"";const[y,m]=key.split("-");return new Date(parseInt(y),parseInt(m)-1,1).toLocaleDateString("en-CA",{month:"long",year:"numeric"});}
function shortDate(s){if(!s)return"";const d=new Date(s+"T00:00:00");if(isNaN(d))return s;return d.toLocaleDateString("en-CA",{month:"short",day:"numeric"});}
function getActualColor(actual,budget,type){if(!actual||actual===0)return"neutral";if(!budget||budget===0)return"neutral";const r=actual/budget;if(type==="expense"){if(r<=1.0)return"green";if(r<=1.2)return"amber";return"red";}if(r>=1.0)return"green";if(r>=0.8)return"amber";return"red";}
function colorCls(c){return{green:"c-green",amber:"c-amber",red:"c-red",neutral:"c-muted"}[c]||"c-muted";}
function accountLabel(id){return ACCOUNTS.find(a=>a.id===id)?.label||id;}

// ─── CSV PARSING ─────────────────────────────────────────────────────────────

function parseCSVLine(line){const result=[];let cur="",inQ=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){inQ=!inQ;}else if(ch===","&&!inQ){result.push(cur);cur="";}else{cur+=ch;}}result.push(cur);return result;}

function parseCSV(text,accountId,merchantMemory={}){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return{transactions:[],balanceInfo:null};
  const header=parseCSVLine(lines[0]).map(h=>clean(h).toLowerCase());
  const idx=terms=>header.findIndex(h=>terms.some(t=>h.includes(t)));
  const dateIdx=idx(["date"]),descIdx=idx(["description"]),subIdx=idx(["sub-description","subdescription","sub description","narrative"]);
  const typeIdx=idx(["type of transaction","type","transaction type"]),amtIdx=idx(["amount"]),balIdx=idx(["balance"]),statIdx=idx(["status"]);
  const ccMode=statIdx>=0||balIdx<0;
  const rows=[];
  for(let i=1;i<lines.length;i++){
    const cells=parseCSVLine(lines[i]);if(cells.length<3)continue;
    const rawDate=clean(cells[dateIdx>=0?dateIdx:0]);if(!rawDate||rawDate.toLowerCase().includes("filter"))continue;
    const description=clean(cells[descIdx>=0?descIdx:1]);
    const subDesc=subIdx>=0?clean(cells[subIdx]):"";
    const txType=typeIdx>=0?clean(cells[typeIdx]).toLowerCase():"";
    const rawBalance=(!ccMode&&balIdx>=0)?parseFloat(clean(cells[balIdx]).replace(/[,\s]/g,""))||null:null;
    let amount=parseFloat(clean(cells[amtIdx>=0?amtIdx:2]).replace(/[,\s]/g,""))||0;
    if(ccMode){amount=Math.abs(amount);if(txType.includes("debit"))amount=-amount;}
    let d=new Date(rawDate+"T00:00:00");
    if(isNaN(d)){const p=rawDate.split(/[\/\-\.]/);if(p.length===3){d=new Date(`${p[2]}-${p[0].padStart(2,"0")}-${p[1].padStart(2,"0")}`);if(isNaN(d))d=new Date(`${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`);}}
    if(isNaN(d))continue;
    const dateStr=d.toISOString().split("T")[0],monthKey=toMonthKey(dateStr);if(!monthKey)continue;
    const cat=autoCategorize(description,subDesc,amount,accountId,merchantMemory);
    rows.push({id:`tx-${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`,date:dateStr,month:monthKey,account:accountId,description,subDescription:subDesc,amount,mainCategory:cat?.main||"",subCategory:cat?.sub||"",section:cat?.section||"",remarks:"",isTransfer:cat?.section==="transfer",autoDetected:!!cat,balance:rawBalance});
  }
  let balanceInfo=null;
  if(!ccMode&&rows.some(r=>r.balance!==null)){
    const sorted=[...rows].filter(r=>r.balance!==null).sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(sorted.length>0){const first=sorted[0],last=sorted[sorted.length-1];balanceInfo={opening:first.balance-first.amount,closing:last.balance};}
  }
  return{transactions:rows,balanceInfo};
}

function parseInvestmentCSV(text,accountId){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)return[];
  const header=parseCSVLine(lines[0]).map(h=>clean(h).toLowerCase());
  const idx=terms=>header.findIndex(h=>terms.some(t=>h.includes(t)));
  return lines.slice(1).map((line,i)=>{const cells=parseCSVLine(line);return{id:`inv-${Date.now()}-${i}`,account:accountId,symbol:clean(cells[idx(["symbol","ticker"])]||"")||"—",name:clean(cells[idx(["name","description","security","holding"])]||"")||"—",qty:parseFloat(clean(cells[idx(["qty","quantity","shares","units"])]||"").replace(/,/g,""))||0,bookValue:parseFloat(clean(cells[idx(["book","cost","acb"])]||"").replace(/,/g,""))||0,marketValue:parseFloat(clean(cells[idx(["market","value","current"])]||"").replace(/,/g,""))||0};}).filter(r=>r.qty>0||r.bookValue>0||r.marketValue>0);
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab,setActiveTab]=useState("overview");
  const nowKey=(()=>{const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;})();
  const [selectedMonth,setSelectedMonth]=useState(nowKey);
  const [selectedYear, setSelectedYear] =useState(new Date().getFullYear());
  const load=(key,def)=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):def;}catch{return def;}};

  const [transactions,    setTransactions]    =useState(()=>load("rf_transactions",[]));
  const [categories,      setCategories]      =useState(()=>load("rf_categories",null)||DEFAULT_CATEGORIES);
  // monthlyBudgets: { "2026-04": { "Rent": 3500, "Groceries": 1200 } }
  // monthlyCategories: full categories snapshot per locked month
  const [monthlyCategories, setMonthlyCategories] = useState(()=>load("rf_monthly_categories",{}));
  const [investments,     setInvestments]     =useState(()=>load("rf_investments",[]));
  const [accountBalances, setAccountBalances] =useState(()=>load("rf_balances",{}));
  const [merchantMemory,  setMerchantMemory]  =useState(()=>load("rf_merchant_memory",{}));
  const [toast,setToast]=useState(null);
  const [dupPrompt,setDupPrompt]=useState(null);
  const importRef=useRef();

  useEffect(()=>{localStorage.setItem("rf_transactions",    JSON.stringify(transactions));   },[transactions]);
  useEffect(()=>{localStorage.setItem("rf_categories",      JSON.stringify(categories));     },[categories]);
  useEffect(()=>{localStorage.setItem("rf_monthly_categories", JSON.stringify(monthlyCategories)); },[monthlyCategories]);
  useEffect(()=>{localStorage.setItem("rf_investments",     JSON.stringify(investments));    },[investments]);
  useEffect(()=>{localStorage.setItem("rf_balances",        JSON.stringify(accountBalances));},[accountBalances]);
  useEffect(()=>{localStorage.setItem("rf_merchant_memory", JSON.stringify(merchantMemory)); },[merchantMemory]);

  function showToast(msg,type="info"){setToast({msg,type});setTimeout(()=>setToast(null),4000);}
  function prevMonth(){const[y,m]=selectedMonth.split("-").map(Number);setSelectedMonth(m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`);}
  function nextMonth(){const[y,m]=selectedMonth.split("-").map(Number);setSelectedMonth(m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,"0")}`);}

  // Save Transactions-context category changes:
  // Month is already locked — save budget amounts and structure to monthlyBudgets[selectedMonth] only
  // Standard template (global categories) is NEVER modified from here
  function handleTransactionsCategorySave(newCats) {
    // Save full budget map to this month's locked budget

    setMonthlyBudgets(prev => ({
      ...prev,
      [selectedMonth]: newBudgetMap,
    }));
    // Update global categories STRUCTURE only (new heads/subs added) — keep original standard budgets
    const structureCats = JSON.parse(JSON.stringify(newCats));
    for (const h of structureCats.income) {
      const orig = categories.income.find(o => o.head === h.head);
      h.budget = orig ? { ...Object.fromEntries(h.subs.map(s=>[s,0])), ...orig.budget } : Object.fromEntries(h.subs.map(s=>[s,0]));
    }
    for (const h of structureCats.expenses) {
      const orig = categories.expenses.find(o => o.head === h.head);
      h.budget = orig ? { ...Object.fromEntries(h.subs.map(s=>[s,0])), ...orig.budget } : Object.fromEntries(h.subs.map(s=>[s,0]));
    }
    for (const h of structureCats.savings) {
      const orig = categories.savings.find(o => o.head === h.head);
      h.budget = orig ? orig.budget : 0;
    }
    setCategories(structureCats);
  }

  // Save Annual Standard Template changes → global categories only
  function handleStandardTemplateSave(newCats) {
    setCategories(newCats);
    showToast("Standard template saved — applies to all months without a custom budget");
  }

  function handleExport(){
    const data={transactions,categories,monthlyCategories,balances:accountBalances,merchantMemory,investments,exportDate:new Date().toISOString(),version:"v9"};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`rathore-finance-${new Date().toISOString().split("T")[0]}.json`;a.click();URL.revokeObjectURL(url);
    showToast("Data exported successfully");
  }

  function handleImportFile(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!window.confirm("This will replace ALL existing data. Continue?"))return;
        if(data.transactions)   setTransactions(data.transactions);
        if(data.categories)     setCategories(data.categories);
        if(data.monthlyCategories) setMonthlyCategories(data.monthlyCategories);
        if(data.balances)       setAccountBalances(data.balances);
        if(data.merchantMemory) setMerchantMemory(data.merchantMemory);
        if(data.investments)    setInvestments(data.investments);
        showToast("Data imported successfully","success");
      }catch{showToast("Invalid file — could not import","error");}
    };
    reader.readAsText(file);e.target.value="";
  }

  function handlePDF(){
    const tabName=activeTab.charAt(0).toUpperCase()+activeTab.slice(1);
    const period=activeTab==="annual"?selectedYear:monthLabel(selectedMonth);
    document.title=`Rathore Finance — ${tabName} — ${period}`;window.print();
    setTimeout(()=>{document.title="Rathore Family Finance Dashboard";},2000);
  }

  function handleImport(text,accountId){
    const{transactions:newTxs,balanceInfo}=parseCSV(text,accountId,merchantMemory);
    if(!newTxs.length){showToast("No valid transactions found","error");return;}
    const months=[...new Set(newTxs.map(t=>t.month))];
    const hasExisting=months.some(m=>transactions.some(t=>t.account===accountId&&t.month===m));
    if(hasExisting){const existingCount=transactions.filter(t=>t.account===accountId&&months.includes(t.month)).length;setDupPrompt({newTxs,accountId,months,existingCount,balanceInfo});}
    else commitImport(newTxs,accountId,months,balanceInfo,false);
  }

  function commitImport(newTxs,accountId,months,balanceInfo,replace){
    setTransactions(prev=>{
      const base=replace?prev.filter(t=>!(t.account===accountId&&months.includes(t.month))):prev;
      const keys=new Set(base.map(t=>`${t.date}|${t.description}|${t.amount}|${t.account}`));
      const toAdd=newTxs.filter(t=>!keys.has(`${t.date}|${t.description}|${t.amount}|${t.account}`));
      const uncat=toAdd.filter(t=>!t.mainCategory&&!t.isTransfer).length;
      showToast(`${toAdd.length} imported · ${uncat} need review`);
      return[...base,...toAdd];
    });
    if(balanceInfo){setAccountBalances(prev=>{const u={...prev};months.forEach(m=>{u[`${accountId}-${m}`]=balanceInfo;});return u;});}
    // Auto-lock each month on FIRST import — copy standard template budget into monthlyBudgets
    // If month already has a budget (locked), do not overwrite
    setMonthlyBudgets(prev=>{
      const u={...prev};
      months.forEach(m=>{
        if(!u[m]){
          // First time data is imported for this month — lock it with current standard template
          u[m]=buildStandardBudgetMap(categories);
        }
      });
      return u;
    });
    setDupPrompt(null);
  }

  function updateTransaction(id,updates){setTransactions(prev=>prev.map(t=>{if(t.id!==id)return t;const u={...t,...updates};if(updates.date)u.month=toMonthKey(updates.date);return u;}));}
  function deleteTransaction(id){setTransactions(prev=>prev.filter(t=>t.id!==id));}
  function clearMonth(key){
    setTransactions(prev=>prev.filter(t=>t.month!==key));
    setAccountBalances(prev=>{const u={...prev};ACCOUNTS.forEach(a=>delete u[`${a.id}-${key}`]);return u;});
    // Unlock month — remove its locked budget so standard template applies again
    setMonthlyBudgets(prev=>{const u={...prev};delete u[key];return u;});
    showToast(`Cleared ${monthLabel(key)}`);
  }
  function updateMerchantMemory(descKey,rule){setMerchantMemory(prev=>({...prev,[descKey.toLowerCase().trim()]:rule}));}
  function bulkReCategorize(description,main,sub,section){
    const lower=description.toLowerCase().trim();let count=0;
    setTransactions(prev=>prev.map(t=>{if(t.description.toLowerCase().trim()===lower&&(t.mainCategory!==main||t.subCategory!==sub)){count++;return{...t,mainCategory:main,subCategory:sub,section,isTransfer:section==="transfer"};}return t;}));
    updateMerchantMemory(lower,{main,sub,section});
    if(count>0)showToast(`Applied to ${count} similar transaction${count!==1?"s":""}`);
  }

  const uncatCount=transactions.filter(t=>t.month===selectedMonth&&!t.mainCategory&&!t.isTransfer).length;

  return(
    <div className="app-root">
      {toast&&<div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      {dupPrompt&&(
        <div className="dup-overlay"><div className="dup-modal">
          <div className="dup-title">Duplicate data detected</div>
          <div className="dup-msg"><strong>{accountLabel(dupPrompt.accountId)}</strong> already has <strong>{dupPrompt.existingCount}</strong> transactions for {dupPrompt.months.map(monthLabel).join(", ")}.</div>
          <div className="dup-actions">
            <button className="btn-primary" onClick={()=>commitImport(dupPrompt.newTxs,dupPrompt.accountId,dupPrompt.months,dupPrompt.balanceInfo,true)}>Replace existing</button>
            <button className="btn-ghost"   onClick={()=>commitImport(dupPrompt.newTxs,dupPrompt.accountId,dupPrompt.months,dupPrompt.balanceInfo,false)}>Merge (skip duplicates)</button>
            <button className="btn-ghost"   onClick={()=>setDupPrompt(null)}>Cancel</button>
          </div>
        </div></div>
      )}

      <nav className="tab-bar no-print">
        {[{id:"overview",label:"Overview",icon:"⊞"},{id:"transactions",label:"Transactions",icon:"≡"},{id:"investments",label:"Investments",icon:"◈"},{id:"annual",label:"Annual",icon:"▦"}].map(tab=>(
          <button key={tab.id} className={`tab-btn${activeTab===tab.id?" active":""}`} onClick={()=>setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>{tab.label}
            {tab.id==="transactions"&&uncatCount>0&&<span className="tab-badge">{uncatCount}</span>}
          </button>
        ))}
        <div className="nav-actions">
          <button className="btn-ghost btn-sm" onClick={handleExport}>⬆ Export</button>
          <button className="btn-ghost btn-sm" onClick={()=>importRef.current.click()}>⬇ Import</button>
          <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImportFile}/>
          <button className="btn-ghost btn-sm" onClick={handlePDF}>⎙ PDF</button>
        </div>
      </nav>

      <div className="tab-content">
        {activeTab==="overview"     && <OverviewTab transactions={transactions} categories={categories} monthlyCategories={monthlyCategories} selectedMonth={selectedMonth} accountBalances={accountBalances} onPrevMonth={prevMonth} onNextMonth={nextMonth} onGoToTransactions={()=>setActiveTab("transactions")}/>}
        {activeTab==="transactions" && <TransactionsTab transactions={transactions} categories={categories} monthlyCategories={monthlyCategories} merchantMemory={merchantMemory} selectedMonth={selectedMonth} onPrevMonth={prevMonth} onNextMonth={nextMonth} onImport={handleImport} onUpdateTransaction={updateTransaction} onDeleteTransaction={deleteTransaction} onClearMonth={clearMonth} onBulkReCategorize={bulkReCategorize} onCategorySave={handleTransactionsCategorySave} onUpdateMerchantMemory={updateMerchantMemory} showToast={showToast}/>}
        {activeTab==="investments"  && <InvestmentsTab investments={investments} onInvestmentsChange={setInvestments} showToast={showToast}/>}
        {activeTab==="annual"       && <AnnualTab transactions={transactions} categories={categories} monthlyCategories={monthlyCategories} accountBalances={accountBalances} selectedYear={selectedYear} onPrevYear={()=>setSelectedYear(y=>y-1)} onNextYear={()=>setSelectedYear(y=>y+1)} onStandardTemplateSave={handleStandardTemplateSave}/>}
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB — READ ONLY ─────────────────────────────────────────────────

function OverviewTab({transactions,categories,monthlyCategories,selectedMonth,accountBalances,onPrevMonth,onNextMonth,onGoToTransactions}){
  const [headExp,setHeadExp]=useState({});
  const [savExp,setSavExp]=useState(false);
  const [tfExp,setTfExp]=useState(false);

  const monthTxs=transactions.filter(t=>t.month===selectedMonth);
  const counted =monthTxs.filter(t=>!t.isTransfer&&t.mainCategory&&t.section);
  const tfTxs   =monthTxs.filter(t=>t.isTransfer);

  const activeCats = monthlyCategories?.[selectedMonth] || categories;
  const isLocked = !!monthlyCategories?.[selectedMonth];
  function getBudget(subKey){return getEffectiveBudgetFromCats(subKey,activeCats);}
  function sumActual(section,mainCat,subCat){return counted.filter(t=>t.section===section&&(!mainCat||t.mainCategory===mainCat)&&(!subCat||t.subCategory===subCat)).reduce((s,t)=>s+Math.abs(t.amount),0);}

  const bIncome=activeCats.income.reduce((s,h)=>s+h.subs.reduce((a,sub)=>a+getBudget(sub),0),0);
  const bExp   =activeCats.expenses.reduce((s,h)=>s+h.subs.reduce((a,sub)=>a+getBudget(sub),0),0);
  const bSav   =activeCats.savings.reduce((s,h)=>s+getBudget(h.head),0);
  const aIncome=sumActual("income"),aExp=sumActual("expenses"),aSav=sumActual("savings");
  const netBal =aIncome-aExp-aSav;

  function getDisplayBalInfo(accountId){
    const stored=accountBalances[`${accountId}-${selectedMonth}`];if(!stored)return null;
    const[y,m]=selectedMonth.split("-").map(Number);
    const prevKey=m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`;
    const prevClose=accountBalances[`${accountId}-${prevKey}`]?.closing;
    return{opening:prevClose!==undefined?prevClose:stored.opening,closing:stored.closing};
  }

  // Check if selected month has a custom budget


  return(
    <div className="tab-pane">
      <div className="month-bar no-print">
        <div className="month-nav">
          <button className="btn-ghost" onClick={onPrevMonth}>◀</button>
          <span className="month-label">{monthLabel(selectedMonth)}</span>
          <button className="btn-ghost" onClick={onNextMonth}>▶</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isLocked&&<span className="monthly-budget-badge">🔒 {monthLabel(selectedMonth)} — independent budget</span>}
          <button className="btn-ghost btn-sm" onClick={onGoToTransactions}>⬆ Transactions</button>
        </div>
      </div>
      <div className="print-header">{monthLabel(selectedMonth)} — Overview</div>

      <div className="card">
        <div className="bank-header">
          <span className="col-name">🏦 Bank Accounts</span>
          <span className="col-hdr">Opening</span><span className="col-hdr">Credits</span><span className="col-hdr">Debits</span><span className="col-hdr">Closing</span>
        </div>
        <BankRow label="SR Scotia Bank" txs={monthTxs.filter(t=>t.account==="sr_scotia_bank")} balInfo={getDisplayBalInfo("sr_scotia_bank")}/>
        <BankRow label="NR Scotia Bank" txs={monthTxs.filter(t=>t.account==="nr_scotia_bank")} balInfo={getDisplayBalInfo("nr_scotia_bank")} isLast/>
      </div>

      <div className="tiles-row">
        <SummaryTile label="Total Income"   budget={bIncome} actual={aIncome} type="income"/>
        <SummaryTile label="Total Expenses" budget={bExp}    actual={aExp}    type="expense" showBar/>
        <SummaryTile label="Total Savings"  budget={bSav}    actual={aSav}    type="savings"/>
        <div className="tile">
          <div className="tile-label">Net Balance</div>
          <div className={`tile-value ${netBal>=0?"c-green":"c-red"}`}>{fmt(netBal)}</div>
          <div className="tile-sub">Income − Expenses − Savings</div>
        </div>
      </div>

      <div className="card acc-card">
        <div className="acc-col-header">
          <span className="acc-label-col">Category</span>
          <span className="acc-num-col hdr">Budgeted</span>
          <span className="acc-num-col hdr">Actual</span>
        </div>

        <div className="acc-section-row"><span className="acc-section-icon">↑</span><span className="acc-label-col acc-section-name">Income</span><span className="acc-num-col c-muted">{fmt(bIncome)}</span><span className={`acc-num-col ${colorCls(getActualColor(aIncome,bIncome,"income"))}`}>{aIncome>0?fmt(aIncome):"—"}</span></div>
        {activeCats.income.map(h=>{
          const hB=h.subs.reduce((a,sub)=>a+getBudget(sub),0),hA=sumActual("income",h.head),k=`inc-${h.head}`;
          return(<div key={h.head}>
            <div className="acc-head-row" onClick={()=>setHeadExp(p=>({...p,[k]:!p[k]}))}>
              <span className="acc-chev">{headExp[k]?"▾":"▸"}</span><span className="acc-label-col">{h.head}</span>
              <span className="acc-num-col c-muted">{fmt(hB)}</span><span className={`acc-num-col ${colorCls(getActualColor(hA,hB,"income"))}`}>{hA>0?fmt(hA):"—"}</span>
            </div>
            {headExp[k]&&h.subs.map(sub=>{const sB=getBudget(sub),sA=sumActual("income",h.head,sub);return(<div key={sub} className="acc-item-row"><span className="acc-label-col acc-item-name">{sub}</span><span className="acc-num-col c-muted">{sB>0?fmt(sB):"—"}</span><span className={`acc-num-col ${colorCls(getActualColor(sA,sB,"income"))}`}>{sA>0?fmt(sA):"—"}</span></div>);})}
          </div>);
        })}

        <div className="acc-section-row"><span className="acc-section-icon">↓</span><span className="acc-label-col acc-section-name">Expenses</span><span className="acc-num-col c-muted">{fmt(bExp)}</span><span className={`acc-num-col ${colorCls(getActualColor(aExp,bExp,"expense"))}`}>{aExp>0?fmt(aExp):"—"}</span></div>
        {activeCats.expenses.map(h=>{
          const hB=h.subs.reduce((a,sub)=>a+getBudget(sub),0),hA=counted.filter(t=>t.section==="expenses"&&t.mainCategory===h.head).reduce((s,t)=>s+Math.abs(t.amount),0),k=`exp-${h.head}`;
          return(<div key={h.head}>
            <div className="acc-head-row" onClick={()=>setHeadExp(p=>({...p,[k]:!p[k]}))}>
              <span className="acc-chev">{headExp[k]?"▾":"▸"}</span><span className="acc-label-col">{h.head}</span>
              <span className="acc-num-col c-muted">{fmt(hB)}</span><span className={`acc-num-col ${colorCls(getActualColor(hA,hB,"expense"))}`}>{hA>0?fmt(hA):"—"}</span>
            </div>
            {headExp[k]&&h.subs.map(sub=>{const sB=getBudget(sub),sA=counted.filter(t=>t.section==="expenses"&&t.mainCategory===h.head&&t.subCategory===sub).reduce((s,t)=>s+Math.abs(t.amount),0);return(<div key={sub} className="acc-item-row"><span className="acc-label-col acc-item-name">{sub}</span><span className="acc-num-col c-muted">{sB>0?fmt(sB):"—"}</span><span className={`acc-num-col ${colorCls(getActualColor(sA,sB,"expense"))}`}>{sA>0?fmt(sA):"—"}</span></div>);})}
          </div>);
        })}

        <div className="acc-section-row clickable" onClick={()=>setSavExp(s=>!s)}>
          <span className="acc-chev">{savExp?"▾":"▸"}</span><span className="acc-label-col acc-section-name">Savings</span>
          <span className="acc-num-col c-muted">{fmt(bSav)}</span><span className={`acc-num-col ${colorCls(getActualColor(aSav,bSav,"savings"))}`}>{aSav>0?fmt(aSav):"—"}</span>
        </div>
        {savExp&&activeCats.savings.map(s=>{const sB=getBudget(s.head),sA=sumActual("savings",s.head);return(<div key={s.head} className="acc-item-row"><span className="acc-label-col acc-item-name">{s.head}</span><span className="acc-num-col c-muted">{sB>0?fmt(sB):"—"}</span><span className={`acc-num-col ${colorCls(getActualColor(sA,sB,"savings"))}`}>{sA>0?fmt(sA):"—"}</span></div>);})}

        <div className="acc-section-row clickable dimmed" onClick={()=>setTfExp(s=>!s)}>
          <span className="acc-chev">{tfExp?"▾":"▸"}</span><span className="acc-label-col acc-section-name">Transfers — excluded from all calculations</span>
          <span className="acc-num-col">—</span><span className="acc-num-col">—</span>
        </div>
        {tfExp&&(tfTxs.length===0?<div className="acc-item-row"><span className="acc-label-col acc-item-name c-muted">No transfers this month</span><span className="acc-num-col">—</span><span className="acc-num-col">—</span></div>:tfTxs.map(t=><div key={t.id} className="acc-item-row"><span className="acc-label-col acc-item-name">{t.description}</span><span className="acc-num-col c-muted">—</span><span className="acc-num-col c-muted">{fmt(Math.abs(t.amount))}</span></div>))}
      </div>
    </div>
  );
}

function BankRow({label,txs,balInfo,isLast}){
  const credits=txs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const debits =txs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  return(<div className={`bank-row${isLast?" last":""}`}><span className="col-name bank-name">{label}</span><span className="bank-col c-muted">{balInfo?fmt(balInfo.opening):"—"}</span><span className="bank-col c-green">{credits>0?`+${fmt(credits)}`:"—"}</span><span className="bank-col c-red">{debits>0?`−${fmt(debits)}`:"—"}</span><span className="bank-col" style={{fontWeight:600}}>{balInfo?fmt(balInfo.closing):(credits>0||debits>0?fmt(credits-debits):"—")}</span></div>);
}

function SummaryTile({label,budget,actual,type,showBar}){
  const color=getActualColor(actual,budget,type),pct=budget>0?Math.min(Math.round((actual/budget)*100),100):0;
  return(<div className="tile"><div className="tile-label">{label}</div><div className={`tile-value ${colorCls(color)}`}>{actual>0?fmt(actual):"—"}</div><div className="tile-sub">Budget {fmt(budget)} · {pct}%</div>{showBar&&<div className="tile-bar"><div className={`tile-bar-fill bar-${color}`} style={{width:`${pct}%`}}/></div>}</div>);
}

// ─── TRANSACTIONS TAB ─────────────────────────────────────────────────────────

function TransactionsTab({transactions,categories,monthlyCategories,merchantMemory,selectedMonth,onPrevMonth,onNextMonth,onImport,onUpdateTransaction,onDeleteTransaction,onClearMonth,onBulkReCategorize,onCategorySave,onUpdateMerchantMemory,showToast}){
  const [uploadAccount,setUploadAccount]=useState("sr_scotia_bank");
  const [filterAccount,setFilterAccount]=useState("");
  const [filterSection,setFilterSection]=useState("");
  const [search,setSearch]=useState("");
  const [showCatMgr,setShowCatMgr]=useState(false);
  const [clearMonthSel,setClearMonthSel]=useState("");
  const [editingCell,setEditingCell]=useState(null);
  const [bulkPrompt,setBulkPrompt]=useState(null);
  const fileRef=useRef();

  const monthTxs=transactions.filter(t=>t.month===selectedMonth);
  const uncatCount=monthTxs.filter(t=>!t.mainCategory&&!t.isTransfer).length;
  const filtered=monthTxs.filter(t=>!filterAccount||t.account===filterAccount).filter(t=>!filterSection||t.section===filterSection).filter(t=>!search||t.description.toLowerCase().includes(search.toLowerCase())||(t.mainCategory||"").toLowerCase().includes(search.toLowerCase())||(t.subCategory||"").toLowerCase().includes(search.toLowerCase())||(t.remarks||"").toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.date)-new Date(a.date));

  const filteredAcct=ACCOUNTS.find(a=>a.id===filterAccount);
  const isFilteredByCC=filteredAcct?.type==="cc";
  const isFilteredByBank=filteredAcct?.type==="bank";
  const ccNonTransfer=isFilteredByCC?filtered.filter(t=>!t.isTransfer):[];
  const ccTotalSpent=ccNonTransfer.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const ccRefunds=ccNonTransfer.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const bankIncome=isFilteredByBank?filtered.filter(t=>t.section==="income").reduce((s,t)=>s+Math.abs(t.amount),0):0;
  const bankExpenses=isFilteredByBank?filtered.filter(t=>t.section==="expenses").reduce((s,t)=>s+Math.abs(t.amount),0):0;
  const bankSavings=isFilteredByBank?filtered.filter(t=>t.section==="savings").reduce((s,t)=>s+Math.abs(t.amount),0):0;

  const allMainCats=[...activeCats.income.map(h=>({main:h.head,section:"income"})),...activeCats.expenses.map(h=>({main:h.head,section:"expenses"})),...activeCats.savings.map(h=>({main:h.head,section:"savings"})),{main:"TRANSFER",section:"transfer"}];
  function getSubsFor(mainCat){const ih=activeCats.income.find(h=>h.head===mainCat);if(ih)return ih.subs;const eh=activeCats.expenses.find(h=>h.head===mainCat);if(eh)return eh.subs;const sh=activeCats.savings.find(h=>h.head===mainCat);if(sh)return[sh.head];if(mainCat==="TRANSFER")return["CC Payment","Transfer — Exclude"];return[];}

  function handleFileSelect(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{onImport(ev.target.result,uploadAccount);};reader.readAsText(file);e.target.value="";}

  function handleCellEdit(txId,field,value){
    const tx=transactions.find(t=>t.id===txId);if(!tx)return;
    const updates={[field]:value};
    if(field==="mainCategory"){const found=allMainCats.find(c=>c.main===value);updates.section=found?.section||"";updates.isTransfer=found?.section==="transfer";updates.subCategory="";}
    onUpdateTransaction(txId,updates);
    if(field==="subCategory"&&value&&tx.mainCategory){
      const found=allMainCats.find(c=>c.main===tx.mainCategory);const section=found?.section||tx.section;const descKey=tx.description.toLowerCase().trim();
      onUpdateMerchantMemory(descKey,{main:tx.mainCategory,sub:value,section});
      const similar=transactions.filter(t=>t.id!==txId&&t.description.toLowerCase().trim()===descKey&&(t.mainCategory!==tx.mainCategory||t.subCategory!==value)).length;
      if(similar>0)setBulkPrompt({description:tx.description,main:tx.mainCategory,sub:value,section,count:similar});
    }
  }

  const availableMonths=[...new Set(transactions.map(t=>t.month))].sort().reverse();

  return(
    <div className="tab-pane">
      {bulkPrompt&&(<div className="bulk-bar no-print"><span>Apply <strong>{bulkPrompt.main} / {bulkPrompt.sub}</strong> to {bulkPrompt.count} similar transaction{bulkPrompt.count!==1?"s":""}?</span><button className="btn-ghost btn-sm" onClick={()=>{onBulkReCategorize(bulkPrompt.description,bulkPrompt.main,bulkPrompt.sub,bulkPrompt.section);setBulkPrompt(null);}}>Apply All</button><button className="btn-ghost btn-sm" onClick={()=>setBulkPrompt(null)}>Dismiss</button></div>)}

      <div className="month-bar no-print">
        <div className="month-nav">
          <button className="btn-ghost" onClick={onPrevMonth}>◀</button>
          <span className="month-label">{monthLabel(selectedMonth)}</span>
          <button className="btn-ghost" onClick={onNextMonth}>▶</button>
        </div>
        <div className="top-actions">
          <select className="sel" value={uploadAccount} onChange={e=>setUploadAccount(e.target.value)}>{ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select>
          <button className="btn-ghost btn-sm" onClick={()=>fileRef.current.click()}>⬆ Upload CSV</button>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFileSelect}/>
          <button className={`btn-ghost btn-sm${showCatMgr?" active":""}`} onClick={()=>setShowCatMgr(s=>!s)}>
            ⚙ Categories {isLocked&&<span className="monthly-budget-dot" title="Month locked — independent budget">🔒</span>}
          </button>
        </div>
      </div>
      <div className="print-header">{monthLabel(selectedMonth)} — Transactions{filteredAcct?` — ${filteredAcct.label}`:""}</div>

      {showCatMgr&&(
        <CategoryManager
          categories={activeCats}
          onChange={onCategorySave}
          onClose={()=>setShowCatMgr(false)}
          context="transactions"
          monthLabel={monthLabel(selectedMonth)}
        />
      )}

      <div className="filter-bar no-print">
        <input className="inp" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="sel" value={filterAccount} onChange={e=>setFilterAccount(e.target.value)}><option value="">All accounts</option>{ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select>
        <select className="sel" value={filterSection} onChange={e=>setFilterSection(e.target.value)}><option value="">All sections</option><option value="income">Income</option><option value="expenses">Expenses</option><option value="savings">Savings</option><option value="transfer">Transfers</option></select>
        <div className="filter-right">{uncatCount>0&&<span className="badge-warn">⚠ {uncatCount} uncategorized</span>}<span className="count-lbl">{filtered.length} of {monthTxs.length}</span></div>
      </div>

      <div className="table-wrap card">
        <table className="tx-tbl">
          <thead><tr><th style={{width:82}}>Date</th><th style={{width:195}}>Account</th><th>Description</th><th style={{width:98,textAlign:"right"}}>Amount</th><th style={{width:145}}>Main Category</th><th style={{width:152}}>Sub Category</th><th style={{width:140}}>Remarks</th><th style={{width:30}} className="no-print"></th></tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={8} className="empty-cell">{monthTxs.length===0?"No transactions for this month.":"No transactions match filters."}</td></tr>}
            {filtered.map(tx=><TransactionRow key={tx.id} tx={tx} allMainCats={allMainCats} getSubsFor={getSubsFor} editingCell={editingCell} setEditingCell={setEditingCell} onCellEdit={handleCellEdit} onDelete={onDeleteTransaction}/>)}
          </tbody>
        </table>
      </div>

      {isFilteredByBank&&(<div className="acct-totals-bar"><div className="acct-totals-item"><span className="acct-totals-label">Net Income</span><span className="acct-totals-value c-green">{bankIncome>0?fmt(bankIncome):"—"}</span></div><div className="acct-totals-sep"/><div className="acct-totals-item"><span className="acct-totals-label">Net Expenses</span><span className="acct-totals-value c-red">{bankExpenses>0?fmt(bankExpenses):"—"}</span></div><div className="acct-totals-sep"/><div className="acct-totals-item"><span className="acct-totals-label">Net Savings</span><span className="acct-totals-value c-green">{bankSavings>0?fmt(bankSavings):"—"}</span></div></div>)}
      {isFilteredByCC&&(<div className="acct-totals-bar"><div className="acct-totals-item"><span className="acct-totals-label">Total Spent</span><span className="acct-totals-value c-red">{ccTotalSpent>0?fmt(ccTotalSpent):"—"}</span></div><div className="acct-totals-sep"/><div className="acct-totals-item"><span className="acct-totals-label">Refunds</span><span className="acct-totals-value c-green">{ccRefunds>0?`+${fmt(ccRefunds)}`:"—"}</span></div><div className="acct-totals-sep"/><div className="acct-totals-item"><span className="acct-totals-label">Net Spend</span><span className="acct-totals-value" style={{fontWeight:600}}>{fmt(ccTotalSpent-ccRefunds)}</span></div><div className="acct-totals-sep"/><div className="acct-totals-item"><span className="acct-totals-label">Transactions</span><span className="acct-totals-value c-muted">{ccNonTransfer.length}</span></div></div>)}

      <div className="card data-mgmt no-print">
        <div className="data-mgmt-title">Data Management</div>
        <div className="data-mgmt-sub">Clear transaction data by month only. Individual rows deletable via ✕.</div>
        <div className="data-mgmt-row">
          <select className="sel" value={clearMonthSel} onChange={e=>setClearMonthSel(e.target.value)}><option value="">Select month to clear...</option>{availableMonths.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select>
          <button className="btn-danger" disabled={!clearMonthSel} onClick={()=>{if(clearMonthSel&&window.confirm(`Clear ALL data for ${monthLabel(clearMonthSel)}?`)){onClearMonth(clearMonthSel);setClearMonthSel("");}}}> Clear {clearMonthSel?monthLabel(clearMonthSel):"selected month"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTION ROW ──────────────────────────────────────────────────────────

function TransactionRow({tx,allMainCats,getSubsFor,editingCell,setEditingCell,onCellEdit,onDelete}){
  const isUncat=!tx.mainCategory&&!tx.isTransfer;
  const isEdit=f=>editingCell?.txId===tx.id&&editingCell?.field===f;
  const start=f=>setEditingCell({txId:tx.id,field:f});
  const stop=()=>setEditingCell(null);
  function CellText({field,value,cls}){const[v,setV]=useState(value||"");useEffect(()=>setV(value||""),[value]);if(isEdit(field))return<input className="cell-inp" value={v} autoFocus onChange={e=>setV(e.target.value)} onBlur={()=>{onCellEdit(tx.id,field,v);stop();}} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();if(e.key==="Escape")stop();}}/>;return<span className={`cell-val${cls?" "+cls:""}`} onClick={()=>start(field)}>{value||<span className="cell-ph">—</span>}</span>;}
  function CellAmount(){const[v,setV]=useState(String(tx.amount));useEffect(()=>setV(String(tx.amount)),[tx.amount]);if(isEdit("amount"))return<input className="cell-inp right" value={v} autoFocus onChange={e=>setV(e.target.value)} onBlur={()=>{const n=parseFloat(v);if(!isNaN(n))onCellEdit(tx.id,"amount",n);stop();}} onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}/>;return<span className={`cell-val right ${tx.amount>=0?"c-green":"c-red"}`} onClick={()=>start("amount")}>{tx.amount>=0?"+":"−"}{fmt(Math.abs(tx.amount))}</span>;}
  function CellSelect({field,value,options,onSelect}){if(isEdit(field))return<select className="cell-sel" value={value||""} autoFocus onChange={e=>{onSelect(e.target.value);stop();}} onBlur={stop}><option value="">— select —</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;return<span className={`cell-val${!value?" cell-ph":""}`} onClick={()=>start(field)}>{value||"—"}</span>;}
  return(
    <tr className={`tx-row${isUncat?" uncat":""}`}>
      <td>{isEdit("date")?<input type="date" className="cell-inp" defaultValue={tx.date} autoFocus onBlur={e=>{onCellEdit(tx.id,"date",e.target.value);stop();}}/>:<span className="cell-val date-val" onClick={()=>start("date")}>{shortDate(tx.date)}</span>}</td>
      <td><CellSelect field="account" value={accountLabel(tx.account)} options={ACCOUNTS.map(a=>a.label)} onSelect={val=>{const a=ACCOUNTS.find(x=>x.label===val);if(a)onCellEdit(tx.id,"account",a.id);}}/></td>
      <td><CellText field="description" value={tx.description}/></td>
      <td><CellAmount/></td>
      <td>{isUncat&&!isEdit("mainCategory")?<span className="uncat-badge" onClick={()=>start("mainCategory")}>⚠ Uncategorized</span>:<CellSelect field="mainCategory" value={tx.mainCategory} options={allMainCats.map(c=>c.main)} onSelect={val=>onCellEdit(tx.id,"mainCategory",val)}/>}</td>
      <td><CellSelect field="subCategory" value={tx.subCategory} options={getSubsFor(tx.mainCategory)} onSelect={val=>onCellEdit(tx.id,"subCategory",val)}/></td>
      <td><CellText field="remarks" value={tx.remarks} cls="remarks-val"/></td>
      <td className="no-print"><button className="btn-del" onClick={()=>onDelete(tx.id)}>✕</button></td>
    </tr>
  );
}

// ─── CATEGORY MANAGER ─────────────────────────────────────────────────────────

function CategoryManager({categories,onChange,onClose,context,monthLabel:mLabel}){
  const [local,setLocal]=useState(JSON.parse(JSON.stringify(categories)));
  const [newHead,setNewHead]=useState({income:"",expenses:"",savings:""});
  const [newSub,setNewSub]=useState({});

  const addHead=section=>{const v=newHead[section].trim();if(!v)return;if(section==="savings")setLocal(c=>({...c,savings:[...c.savings,{head:v,budget:0}]}));else setLocal(c=>({...c,[section]:[...c[section],{head:v,subs:[],budget:{}}]}));setNewHead(n=>({...n,[section]:""}));};
  const addSub=(section,hi)=>{const k=`${section}-${hi}`,v=(newSub[k]||"").trim();if(!v)return;setLocal(c=>{const u=JSON.parse(JSON.stringify(c));u[section][hi].subs.push(v);u[section][hi].budget[v]=0;return u;});setNewSub(n=>({...n,[k]:""}));};
  const updateBudget=(section,hi,sub,val)=>{setLocal(c=>{const u=JSON.parse(JSON.stringify(c));if(section==="savings")u.savings[hi].budget=parseFloat(val)||0;else u[section][hi].budget[sub]=parseFloat(val)||0;return u;});};
  const removeHead=(section,hi)=>setLocal(c=>{const u=JSON.parse(JSON.stringify(c));u[section].splice(hi,1);return u;});
  const removeSub=(section,hi,si)=>setLocal(c=>{const u=JSON.parse(JSON.stringify(c));const sub=u[section][hi].subs[si];u[section][hi].subs.splice(si,1);delete u[section][hi].budget[sub];return u;});

  const isTransactions = context==="transactions";
  const title   = isTransactions ? `⚙ Categories & Budget — ${mLabel} only` : "⚙ Standard Budget Template — applies to all future months";
  const saveBtn = isTransactions ? `Save for ${mLabel}` : "Save Standard Template";

  return(
    <div className="cat-mgr card no-print">
      <div className="cat-mgr-hdr">
        <div><span className="cat-mgr-title">{title}</span>{isTransactions&&<div className="cat-mgr-subtitle">Budget amounts saved here apply to {mLabel} only. Structure changes (new categories) apply everywhere.</div>}</div>
        <button className="btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
      </div>
      {["income","expenses","savings"].map(section=>(
        <div key={section} className="cat-section">
          <div className="cat-section-lbl">{section.charAt(0).toUpperCase()+section.slice(1)}</div>
          {(section==="savings"?local.savings:local[section]).map((h,hi)=>(
            <div key={hi} className="cat-head-block">
              <div className="cat-head-row"><span className="cat-head-name">{h.head}</span>{section==="savings"&&<label className="cat-budget-pair"><span className="cat-budget-lbl">Budget $</span><input className="inp budget-inp" type="number" value={h.budget} onChange={e=>updateBudget(section,hi,null,e.target.value)}/></label>}<button className="btn-del" onClick={()=>removeHead(section,hi)}>✕</button></div>
              {section!=="savings"&&h.subs&&<div className="cat-subs">{h.subs.map((sub,si)=>(<div key={si} className="cat-sub-row"><span className="cat-sub-name">{sub}</span><label className="cat-budget-pair"><span className="cat-budget-lbl">$</span><input className="inp budget-inp" type="number" value={h.budget[sub]||0} onChange={e=>updateBudget(section,hi,sub,e.target.value)}/></label><button className="btn-del" onClick={()=>removeSub(section,hi,si)}>✕</button></div>))}<div className="cat-add-row"><input className="inp" placeholder="New sub-category..." value={newSub[`${section}-${hi}`]||""} onChange={e=>setNewSub(n=>({...n,[`${section}-${hi}`]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addSub(section,hi)}/><button className="btn-ghost btn-sm" onClick={()=>addSub(section,hi)}>+ Add Sub</button></div></div>}
            </div>
          ))}
          <div className="cat-add-row" style={{marginTop:8}}><input className="inp" placeholder={`New ${section} head...`} value={newHead[section]} onChange={e=>setNewHead(n=>({...n,[section]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addHead(section)}/><button className="btn-ghost btn-sm" onClick={()=>addHead(section)}>+ Add Head</button></div>
        </div>
      ))}
      <div className="cat-mgr-footer"><button className="btn-primary" onClick={()=>{onChange(local);onClose();}}>{saveBtn}</button><button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button></div>
    </div>
  );
}

// ─── INVESTMENTS TAB ──────────────────────────────────────────────────────────

function InvestmentsTab({investments,onInvestmentsChange,showToast}){
  const [uploadAccount,setUploadAccount]=useState("sr_fhsa");const fileRef=useRef();
  function handleFile(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{const rows=parseInvestmentCSV(ev.target.result,uploadAccount);onInvestmentsChange(prev=>[...prev.filter(r=>r.account!==uploadAccount),...rows]);showToast(`Imported ${rows.length} holdings for ${INVEST_ACCOUNTS.find(a=>a.id===uploadAccount)?.label}`);e.target.value="";};reader.readAsText(file);}
  const grouped={};investments.forEach(inv=>{if(!grouped[inv.account])grouped[inv.account]=[];grouped[inv.account].push(inv);});
  const totalBook=investments.reduce((s,i)=>s+i.bookValue,0),totalMkt=investments.reduce((s,i)=>s+i.marketValue,0),totalGain=totalMkt-totalBook;
  return(
    <div className="tab-pane">
      <div className="month-bar no-print"><span className="month-label">Wealthsimple Portfolio</span><div className="top-actions"><select className="sel" value={uploadAccount} onChange={e=>setUploadAccount(e.target.value)}>{INVEST_ACCOUNTS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select><button className="btn-ghost btn-sm" onClick={()=>fileRef.current.click()}>⬆ Upload CSV</button><input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={handleFile}/></div></div>
      <div className="print-header">Investments — Portfolio</div>
      <div className="inv-cards">{INVEST_ACCOUNTS.map(acc=>{const rows=grouped[acc.id]||[],book=rows.reduce((s,r)=>s+r.bookValue,0),mkt=rows.reduce((s,r)=>s+r.marketValue,0),gain=mkt-book,pct=book>0?((gain/book)*100).toFixed(1):"0.0";return(<div key={acc.id} className="inv-card"><div className="inv-card-lbl">{acc.label}</div><div className={`inv-card-val ${mkt>0?"c-green":"c-muted"}`}>{mkt>0?fmt(mkt):"—"}</div>{mkt>0&&<div className="inv-card-sub">Book {fmt(book)} · <span className={gain>=0?"c-green":"c-red"}>{gain>=0?"+":""}{fmt(gain)} ({pct}%)</span></div>}</div>);})}</div>
      {totalMkt>0&&<div className="tile inv-total-tile"><div className="tile-label">Total Portfolio</div><div className="tile-value c-green">{fmt(totalMkt)}</div><div className="tile-sub">Book {fmt(totalBook)} · <span className={totalGain>=0?"c-green":"c-red"}>{totalGain>=0?"+":""}{fmt(Math.abs(totalGain))}</span></div></div>}
      {investments.length>0?(<div className="table-wrap card"><table className="tx-tbl"><thead><tr><th>Account</th><th>Symbol</th><th>Holding</th><th style={{textAlign:"right",width:70}}>Qty</th><th style={{textAlign:"right",width:105}}>Book Value</th><th style={{textAlign:"right",width:110}}>Market Value</th><th style={{textAlign:"right",width:95}}>Gain / Loss</th></tr></thead><tbody>{investments.map(inv=>{const gain=inv.marketValue-inv.bookValue;return(<tr key={inv.id} className="tx-row"><td><span className="acc-chip">{INVEST_ACCOUNTS.find(a=>a.id===inv.account)?.label||inv.account}</span></td><td style={{fontWeight:500}}>{inv.symbol}</td><td>{inv.name}</td><td style={{textAlign:"right"}} className="c-muted">{inv.qty.toFixed(2)}</td><td style={{textAlign:"right"}}>{fmtFull(inv.bookValue)}</td><td style={{textAlign:"right",fontWeight:500}}>{fmtFull(inv.marketValue)}</td><td style={{textAlign:"right"}} className={gain>=0?"c-green":"c-red"}>{gain>=0?"+":""}{fmtFull(gain)}</td></tr>);})}<tr className="tx-row total-row"><td colSpan={4} style={{fontWeight:500}}>Total</td><td style={{textAlign:"right",fontWeight:500}}>{fmtFull(totalBook)}</td><td style={{textAlign:"right",fontWeight:500}}>{fmtFull(totalMkt)}</td><td style={{textAlign:"right",fontWeight:500}} className={totalGain>=0?"c-green":"c-red"}>{totalGain>=0?"+":""}{fmtFull(totalGain)}</td></tr></tbody></table></div>):<div className="empty-state">Upload your Wealthsimple CSV to view portfolio holdings</div>}
    </div>
  );
}

// ─── ANNUAL TAB ───────────────────────────────────────────────────────────────

const MONTH_NAMES=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function AnnualTab({transactions,categories,monthlyCategories,accountBalances,selectedYear,onPrevYear,onNextYear,onStandardTemplateSave}){
  const [showTmpl,setShowTmpl]=useState(false);
  const now=new Date(),curMK=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthKeys=Array.from({length:12},(_,i)=>`${selectedYear}-${String(i+1).padStart(2,"0")}`);

  function getBalInfo(accountId,key){
    const stored=accountBalances[`${accountId}-${key}`];if(!stored)return null;
    const[y,m]=key.split("-").map(Number);const prevKey=m===1?`${y-1}-12`:`${y}-${String(m-1).padStart(2,"0")}`;
    const prevClose=accountBalances[`${accountId}-${prevKey}`]?.closing;
    return{opening:prevClose!==undefined?prevClose:stored.opening,closing:stored.closing};
  }

  function monthData(key){
    const txs=transactions.filter(t=>t.month===key&&!t.isTransfer&&t.mainCategory&&t.section);
    const srIncome=txs.filter(t=>t.section==="income"&&t.mainCategory==="Simranvir Rathore").reduce((s,t)=>s+Math.abs(t.amount),0);
    const nrIncome=txs.filter(t=>t.section==="income"&&t.mainCategory==="Navneet Rathore").reduce((s,t)=>s+Math.abs(t.amount),0);
    const allExp=transactions.filter(t=>t.month===key&&!t.isTransfer&&t.mainCategory&&t.section==="expenses");
    const srBankExp=allExp.filter(t=>t.account==="sr_scotia_bank").reduce((s,t)=>s+Math.abs(t.amount),0);
    const nrBankExp=allExp.filter(t=>t.account==="nr_scotia_bank").reduce((s,t)=>s+Math.abs(t.amount),0);
    const ccExp=allExp.filter(t=>CC_ACCOUNT_IDS.includes(t.account)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const srSav=txs.filter(t=>t.section==="savings"&&SR_SAVINGS_HEADS.includes(t.mainCategory)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const nrSav=txs.filter(t=>t.section==="savings"&&NR_SAVINGS_HEADS.includes(t.mainCategory)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const srBal=getBalInfo("sr_scotia_bank",key),nrBal=getBalInfo("nr_scotia_bank",key);
    const hasTx=transactions.some(t=>t.month===key);
    return{srIncome,nrIncome,totIncome:srIncome+nrIncome,srBankExp,nrBankExp,ccExp,totExp:srBankExp+nrBankExp+ccExp,srSav,nrSav,totSav:srSav+nrSav,srBal,nrBal,hasTx};
  }

  const data=monthKeys.map(k=>({key:k,...monthData(k)}));
  const rows=[
    {label:"SR Income",section:"income",getValue:m=>m.srIncome,bold:false,showTotal:true,showAvg:true},
    {label:"NR Income",section:"income",getValue:m=>m.nrIncome,bold:false,showTotal:true,showAvg:true},
    {label:"Total Income",section:"income",getValue:m=>m.totIncome,bold:true,showTotal:true,showAvg:true},
    {label:"SR Bank Expenses",section:"expenses",getValue:m=>m.srBankExp,bold:false,showTotal:true,showAvg:true},
    {label:"NR Bank Expenses",section:"expenses",getValue:m=>m.nrBankExp,bold:false,showTotal:true,showAvg:true},
    {label:"CC Expenses",section:"expenses",getValue:m=>m.ccExp,bold:false,showTotal:true,showAvg:true},
    {label:"Total Expenses",section:"expenses",getValue:m=>m.totExp,bold:true,showTotal:true,showAvg:true},
    {label:"SR Savings",section:"savings",getValue:m=>m.srSav,bold:false,showTotal:true,showAvg:true},
    {label:"NR Savings",section:"savings",getValue:m=>m.nrSav,bold:false,showTotal:true,showAvg:true},
    {label:"Total Savings",section:"savings",getValue:m=>m.totSav,bold:true,showTotal:true,showAvg:true},
    {label:"SR Opening Balance",section:"balance",getValue:m=>m.srBal?.opening,bold:false,showTotal:false,showAvg:false},
    {label:"SR Closing Balance",section:"balance",getValue:m=>m.srBal?.closing,bold:false,showTotal:false,showAvg:false},
    {label:"NR Opening Balance",section:"balance",getValue:m=>m.nrBal?.opening,bold:false,showTotal:false,showAvg:false},
    {label:"NR Closing Balance",section:"balance",getValue:m=>m.nrBal?.closing,bold:false,showTotal:false,showAvg:false},
    {label:"Total Final Balance",section:"balance",getValue:m=>(m.srBal||m.nrBal)?(m.srBal?.closing||0)+(m.nrBal?.closing||0):null,bold:true,showTotal:false,showAvg:false},
  ];

  const balanceChanges=monthKeys.map((key,i)=>{
    const curr=data[i];if(!curr.srBal&&!curr.nrBal)return null;
    const currTotal=(curr.srBal?.closing||0)+(curr.nrBal?.closing||0);
    if(i===0)return null;
    let prev=null;for(let j=i-1;j>=0;j--){if(data[j].srBal||data[j].nrBal){prev=data[j];break;}}
    if(!prev)return null;
    return currTotal-((prev.srBal?.closing||0)+(prev.nrBal?.closing||0));
  });

  const ytd=data.filter(m=>m.hasTx&&m.key<=curMK);
  const ytdSRInc=ytd.reduce((s,m)=>s+m.srIncome,0),ytdNRInc=ytd.reduce((s,m)=>s+m.nrIncome,0);
  const ytdExp=ytd.reduce((s,m)=>s+m.totExp,0),ytdSRSav=ytd.reduce((s,m)=>s+m.srSav,0),ytdNRSav=ytd.reduce((s,m)=>s+m.nrSav,0);
  const latestWithBal=[...data].reverse().find(m=>m.srBal||m.nrBal);
  const latestClose=(latestWithBal?.srBal?.closing||0)+(latestWithBal?.nrBal?.closing||0);

  function rowStats(row){const vals=data.filter(m=>m.hasTx).map(m=>row.getValue(m)).filter(v=>v!==null&&v!==undefined&&!isNaN(v));const total=vals.reduce((s,v)=>s+v,0);return{total,avg:vals.length>0?Math.round(total/vals.length):null};}

  const sectionColors={income:"ann-income",expenses:"ann-expenses",savings:"ann-savings",balance:"ann-balance"};
  const sectionLabels={income:"Income",expenses:"Expenses",savings:"Saving",balance:"Net Balance"};
  let prevSection=null;

  return(
    <div className="tab-pane">
      <div className="month-bar no-print">
        <div className="month-nav"><button className="btn-ghost" onClick={onPrevYear}>◀</button><span className="month-label">{selectedYear}</span><button className="btn-ghost" onClick={onNextYear}>▶</button></div>
        <button className={`btn-ghost btn-sm${showTmpl?" active":""}`} onClick={()=>setShowTmpl(s=>!s)}>⚙ Standard Template</button>
      </div>
      <div className="print-header">{selectedYear} — Annual Summary</div>

      {showTmpl&&<CategoryManager categories={categories} onChange={onStandardTemplateSave} onClose={()=>setShowTmpl(false)} context="annual"/>}

      <div className="tiles-row">
        {[{label:"YTD SR Income",val:ytdSRInc,cls:"c-green"},{label:"YTD NR Income",val:ytdNRInc,cls:"c-green"},{label:"YTD Total Income",val:ytdSRInc+ytdNRInc,cls:"c-green"},{label:"YTD Expenses",val:ytdExp,cls:"c-red"},{label:"YTD SR Savings",val:ytdSRSav,cls:"c-green"},{label:"YTD NR Savings",val:ytdNRSav,cls:"c-green"},{label:"Latest Balance",val:latestClose,cls:"",sub:latestWithBal?`SR ${fmt(latestWithBal.srBal?.closing||0)} · NR ${fmt(latestWithBal.nrBal?.closing||0)}`:"—"}].map((t,i)=>(
          <div key={i} className="tile"><div className="tile-label">{t.label}</div><div className={`tile-value ${t.cls}`} style={{fontWeight:700}}>{fmt(t.val)}</div>{t.sub&&<div className="tile-sub">{t.sub}</div>}</div>
        ))}
      </div>

      <div className="table-wrap card annual-pivot-wrap">
        <table className="tx-tbl annual-pivot">
          <thead><tr>
            <th className="ann-sticky-col" style={{textAlign:"left",fontSize:11}}>Category</th>
            {MONTH_NAMES.map((mn,i)=>{const key=monthKeys[i],isCur=key===curMK,isFut=key>curMK&&!data[i].hasTx,hasMB=!!monthlyCategories?.[key];return<th key={mn} className={`ann-month-hdr${isCur?" ann-cur-col":isFut?" ann-fut-col":""}`} title={hasMB?"Locked — independent budget":""}>  {mn}{isCur&&<span className="current-dot"> ●</span>}{hasMB&&<span className="ann-mb-dot">🔒</span>}</th>;})}
            <th className="ann-total-hdr">Total</th><th className="ann-avg-hdr">Avg/mo</th>
          </tr></thead>
          <tbody>
            {rows.map((row,ri)=>{
              const showSec=row.section!==prevSection;prevSection=row.section;
              const secCls=sectionColors[row.section]||"";const{total,avg}=rowStats(row);
              return[
                showSec&&(<tr key={`sec-${row.section}`} className={`ann-section-hdr ${secCls}`}><td colSpan={16} className="ann-sticky-col ann-section-label">{sectionLabels[row.section]}</td></tr>),
                <tr key={ri} className={`tx-row ann-data-row ${secCls}`}>
                  <td className={`ann-sticky-col ann-row-label${row.bold?" ann-bold":""}`}>{row.label}</td>
                  {data.map((m,mi)=>{const val=row.getValue(m),isCur=m.key===curMK,isFut=m.key>curMK&&!m.hasTx,hasVal=val!==null&&val!==undefined&&!isNaN(val)&&(m.hasTx||row.section==="balance");return(<td key={mi} className={`ann-data-cell${isFut?" ann-fut-col":""}`}>{hasVal?<span className={`${row.bold?"ann-bold":""} ${isCur?"ann-cur-val":""}`}>{fmt(val)}</span>:<span className="c-muted">—</span>}</td>);})}
                  <td className="ann-total-cell">{row.showTotal&&total>0?<span className={row.bold?"ann-bold":"ann-total-val"}>{fmt(total)}</span>:<span className="c-muted">—</span>}</td>
                  <td className="ann-avg-cell">{row.showAvg&&avg!==null&&avg>0?<span className="ann-avg-val">{fmt(avg)}</span>:<span className="c-muted">—</span>}</td>
                </tr>
              ];
            })}
            <tr className="ann-section-hdr ann-balance"><td colSpan={16} className="ann-sticky-col ann-section-label">Change in Balance</td></tr>
            <tr className="tx-row ann-data-row ann-balance">
              <td className="ann-sticky-col ann-row-label ann-bold">Month-over-Month</td>
              {balanceChanges.map((change,i)=>{const isFut=monthKeys[i]>curMK&&!data[i].hasTx;return(<td key={i} className={`ann-data-cell${isFut?" ann-fut-col":""}`}>{change!==null?<span style={{fontWeight:700,color:change>=0?"var(--green)":"var(--red)"}}>{change>=0?"+":""}{fmt(Math.abs(change))}</span>:<span className="c-muted">—</span>}</td>);})}
              <td className="ann-total-cell"><span className="c-muted">—</span></td>
              <td className="ann-avg-cell">{(()=>{const valid=balanceChanges.filter(c=>c!==null);if(!valid.length)return<span className="c-muted">—</span>;const avg=Math.round(valid.reduce((s,c)=>s+c,0)/valid.length);return<span style={{color:avg>=0?"var(--green)":"var(--red)",fontWeight:500}}>{avg>=0?"+":""}{fmt(Math.abs(avg))}</span>;})()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
