import { createClient } from '@supabase/supabase-js';

// ─── CLIENT ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function dbLoadTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.error('Load transactions:', error); return null; }
  return data.map(row => ({
    id:             row.id,
    date:           row.date,
    month:          row.month,
    account:        row.account,
    description:    row.description,
    subDescription: row.sub_description,
    amount:         parseFloat(row.amount),
    mainCategory:   row.main_category,
    subCategory:    row.sub_category,
    section:        row.section,
    remarks:        row.remarks || '',
    isTransfer:     row.is_transfer,
    autoDetected:   row.auto_detected,
    balance:        row.balance ? parseFloat(row.balance) : null,
    source:         row.source || 'csv',
  }));
}

export async function dbUpsertTransactions(transactions) {
  if (!transactions.length) return;
  const rows = transactions.map(t => ({
    id:             t.id,
    date:           t.date,
    month:          t.month,
    account:        t.account,
    description:    t.description,
    sub_description:t.subDescription || '',
    amount:         t.amount,
    main_category:  t.mainCategory || '',
    sub_category:   t.subCategory || '',
    section:        t.section || '',
    remarks:        t.remarks || '',
    is_transfer:    t.isTransfer || false,
    auto_detected:  t.autoDetected || false,
    balance:        t.balance || null,
    source:         t.source || 'csv',
  }));
  const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Upsert transactions:', error);
}

export async function dbDeleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Delete transaction:', error);
}

export async function dbDeleteMonthTransactions(monthKey, accountId) {
  let query = supabase.from('transactions').delete().eq('month', monthKey);
  if (accountId) query = query.eq('account', accountId);
  const { error } = await query;
  if (error) console.error('Delete month transactions:', error);
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function dbLoadCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('data')
    .eq('id', 1)
    .single();
  if (error) { console.error('Load categories:', error); return null; }
  return data?.data || null;
}

export async function dbSaveCategories(categories) {
  const { error } = await supabase
    .from('categories')
    .upsert({ id: 1, data: categories, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) console.error('Save categories:', error);
}

// ─── MONTHLY CATEGORIES ───────────────────────────────────────────────────────

export async function dbLoadMonthlyCategories() {
  const { data, error } = await supabase
    .from('monthly_categories')
    .select('month_key, data');
  if (error) { console.error('Load monthly categories:', error); return null; }
  const result = {};
  data.forEach(row => { result[row.month_key] = row.data; });
  return result;
}

export async function dbSaveMonthlyCategory(monthKey, data) {
  const { error } = await supabase
    .from('monthly_categories')
    .upsert({ month_key: monthKey, data, updated_at: new Date().toISOString() }, { onConflict: 'month_key' });
  if (error) console.error('Save monthly category:', error);
}

export async function dbDeleteMonthlyCategory(monthKey) {
  const { error } = await supabase
    .from('monthly_categories')
    .delete()
    .eq('month_key', monthKey);
  if (error) console.error('Delete monthly category:', error);
}

// ─── BALANCES ─────────────────────────────────────────────────────────────────

export async function dbLoadBalances() {
  const { data, error } = await supabase
    .from('balances')
    .select('*');
  if (error) { console.error('Load balances:', error); return null; }
  const result = {};
  data.forEach(row => {
    result[row.account_month] = { opening: parseFloat(row.opening), closing: parseFloat(row.closing) };
  });
  return result;
}

export async function dbSaveBalance(accountId, monthKey, opening, closing) {
  const accountMonth = `${accountId}-${monthKey}`;
  const { error } = await supabase
    .from('balances')
    .upsert({
      account_month: accountMonth,
      account_id:    accountId,
      month_key:     monthKey,
      opening,
      closing,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'account_month' });
  if (error) console.error('Save balance:', error);
}

export async function dbDeleteBalances(monthKey) {
  const { error } = await supabase
    .from('balances')
    .delete()
    .eq('month_key', monthKey);
  if (error) console.error('Delete balances:', error);
}

// ─── MERCHANT MEMORY ──────────────────────────────────────────────────────────

export async function dbLoadMerchantMemory() {
  const { data, error } = await supabase
    .from('merchant_memory')
    .select('*');
  if (error) { console.error('Load merchant memory:', error); return null; }
  const result = {};
  data.forEach(row => {
    result[row.description_key] = {
      main:    row.main_category,
      sub:     row.sub_category,
      section: row.section,
    };
  });
  return result;
}

export async function dbSaveMerchantMemory(descKey, rule) {
  const { error } = await supabase
    .from('merchant_memory')
    .upsert({
      description_key: descKey,
      main_category:   rule.main,
      sub_category:    rule.sub,
      section:         rule.section,
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'description_key' });
  if (error) console.error('Save merchant memory:', error);
}

// ─── FULL SYNC ────────────────────────────────────────────────────────────────

// Pull everything from Supabase — used on app load
export async function dbPullAll() {
  const [transactions, categories, monthlyCategories, balances, merchantMemory] = await Promise.all([
    dbLoadTransactions(),
    dbLoadCategories(),
    dbLoadMonthlyCategories(),
    dbLoadBalances(),
    dbLoadMerchantMemory(),
  ]);
  return { transactions, categories, monthlyCategories, balances, merchantMemory };
}

// Push everything to Supabase — used on Export/backup
export async function dbPushAll(state) {
  await Promise.all([
    dbUpsertTransactions(state.transactions),
    dbSaveCategories(state.categories),
    state.categories && dbSaveCategories(state.categories),
    state.merchantMemory && Object.entries(state.merchantMemory).map(([k,v]) => dbSaveMerchantMemory(k,v)),
  ]);
  // Monthly categories
  if (state.monthlyCategories) {
    await Promise.all(
      Object.entries(state.monthlyCategories).map(([k,v]) => dbSaveMonthlyCategory(k,v))
    );
  }
  // Balances
  if (state.accountBalances) {
    await Promise.all(
      Object.entries(state.accountBalances).map(([key, val]) => {
        const [accountId, ...rest] = key.split('-');
        const monthKey = rest.join('-');
        return dbSaveBalance(accountId, monthKey, val.opening, val.closing);
      })
    );
  }
}
