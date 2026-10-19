import { supabase } from '../lib/supabase.js';

// Global variables za kurahisisha
let currentUser = null;
let currentProfile = null;

export async function renderExpenses(root, user, profile) {
  // Hifadhi user na profile kwenye variables za nje
  currentUser = user;
  currentProfile = profile;
  
  root.innerHTML = `
    <div class="expenses-container">
      <!-- Summary Cards (Zinazobofeka) -->
      <div class="stats-grid">
        <div class="stat-card" style="cursor: pointer;" onclick="showExpenseDetails('today')">
          <div class="stat-icon" style="background: #fee2e2; color: #991b1b;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Matumizi ya Leo</p>
            <h3 class="stat-value" id="today-expenses">TSh 0</h3>
            <small style="color: #64748b; margin-top: 4px; display: block;">Bofya kwa maelezo</small>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="showExpenseDetails('week')">
          <div class="stat-icon" style="background: #fef3c7; color: #92400e;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Wiki Hii</p>
            <h3 class="stat-value" id="week-expenses">TSh 0</h3>
            <small style="color: #64748b; margin-top: 4px; display: block;">Bofya kwa maelezo</small>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="showExpenseDetails('month')">
          <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11"/><path d="M6.5 12h11"/><path d="M6.5 17.5h11"/><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Mwezi Huu</p>
            <h3 class="stat-value" id="month-expenses">TSh 0</h3>
            <small style="color: #64748b; margin-top: 4px; display: block;">Bofya kwa maelezo</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #dcfce7; color: #166534;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Jumla ya Rekodi</p>
            <h3 class="stat-value" id="total-count">0</h3>
          </div>
        </div>
      </div>

      <!-- Page Header -->
      <div class="page-header">
        <h1>Matumizi</h1>
        <button id="add-expense-btn" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Ongeza Matumizi
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input type="text" id="search-expense" placeholder="Tafuta matumizi..." />
        <select id="filter-category">
          <option value="">Kategoria zote</option>
          <option value="Rent">Kodi</option>
          <option value="Transport">Usafiri</option>
          <option value="Electricity">Umeme</option>
          <option value="Internet">Internet</option>
          <option value="Salary">Mishahara</option>
          <option value="Supplies">Vifaa</option>
          <option value="Maintenance">Matengenezo</option>
          <option value="Other">Nyingine</option>
        </select>
        <input type="date" id="filter-date-from" />
        <input type="date" id="filter-date-to" />
        <button id="clear-filters" class="btn btn-secondary btn-sm">Ondoa Filters</button>
      </div>

      <!-- Expenses Table -->
      <div class="table-wrap">
        <table id="expenses-table">
          <thead>
            <tr>
              <th>Tarehe</th>
              <th>Maelezo</th>
              <th>Kategoria</th>
              <th>Kiasi</th>
              <th>Njia ya Malipo</th>
              <th>Aliyeingiza</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody id="expenses-body">
            <tr><td colspan="7" class="empty-state">Inapakia...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Add Expense Modal -->
      <div id="expense-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h3>Ongeza Matumizi</h3>
            <button class="modal-close" id="close-modal">×</button>
          </div>
          <div class="modal-body">
            <form id="expense-form">
              <div class="form-grid">
                <div class="form-group span-all">
                  <label>Maelezo ya matumizi *</label>
                  <input type="text" name="title" required maxlength="200" placeholder="Mfano: Kodi ya duka" />
                </div>
                <div class="form-group">
                  <label>Kategoria *</label>
                  <select name="category" required>
                    <option value="">Chagua kategoria</option>
                    <option value="Rent">Kodi</option>
                    <option value="Transport">Usafiri</option>
                    <option value="Electricity">Umeme</option>
                    <option value="Internet">Internet</option>
                    <option value="Salary">Mishahara</option>
                    <option value="Supplies">Vifaa</option>
                    <option value="Maintenance">Matengenezo</option>
                    <option value="Other">Nyingine</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Kiasi (TSh) *</label>
                  <input type="number" name="amount" min="1" step="1" required placeholder="0" />
                </div>
                <div class="form-group">
                  <label>Njia ya malipo</label>
                  <select name="payment_method">
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Tarehe</label>
                  <input type="date" name="expense_date" />
                </div>
                <div class="form-group span-all">
                  <label>Maelezo ya ziada</label>
                  <textarea name="notes" rows="3" maxlength="500" placeholder="Maelezo ya ziada (hiari)"></textarea>
                </div>
              </div>
              <div id="form-message" class="form-message" style="display: none;"></div>
              <div class="form-buttons">
                <button type="button" class="btn btn-secondary" id="cancel-btn">Ghairi</button>
                <button type="submit" class="btn btn-primary">Hifadhi</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal ya Maelezo -->
      <div id="details-modal" class="modal-overlay" style="display: none;">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3 id="details-title">Maelezo</h3>
            <button class="modal-close" onclick="closeDetailsModal()">×</button>
          </div>
          <div class="modal-body" id="details-content">
            <p class="empty-state">Inapakia...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load data
  await loadExpenses();
  await loadSummary();

  // Event listeners
  document.getElementById('add-expense-btn').addEventListener('click', () => {
    openModal();
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveExpense();
  });

  // Filters
  document.getElementById('search-expense').addEventListener('input', () => {
    loadExpenses();
  });

  document.getElementById('filter-category').addEventListener('change', () => {
    loadExpenses();
  });

  document.getElementById('filter-date-from').addEventListener('change', () => {
    loadExpenses();
  });

  document.getElementById('filter-date-to').addEventListener('change', () => {
    loadExpenses();
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('search-expense').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    loadExpenses();
  });
}

async function loadSummary() {
  if (!currentUser) return;
  
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  const owner_id = currentUser.id;

  try {
    // Today
    const { data: todayData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('owner_id', owner_id)
      .gte('expense_date', today)
      .lte('expense_date', today + ' 23:59:59');

    const todayTotal = todayData?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
    document.getElementById('today-expenses').textContent = window.money(todayTotal);

    // Week
    const { data: weekData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('owner_id', owner_id)
      .gte('expense_date', weekAgo);

    const weekTotal = weekData?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
    document.getElementById('week-expenses').textContent = window.money(weekTotal);

    // Month
    const { data: monthData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('owner_id', owner_id)
      .gte('expense_date', monthStart);

    const monthTotal = monthData?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;
    document.getElementById('month-expenses').textContent = window.money(monthTotal);

    // Total count
    const { count } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', owner_id);

    document.getElementById('total-count').textContent = count || 0;
  } catch (error) {
    console.error('Error loading summary:', error);
  }
}

async function loadExpenses() {
  if (!currentUser) return;
  
  const search = document.getElementById('search-expense')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const dateFrom = document.getElementById('filter-date-from')?.value || '';
  const dateTo = document.getElementById('filter-date-to')?.value || '';
  const tbody = document.getElementById('expenses-body');
  const owner_id = currentUser.id;

  try {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        recorded_by_user:profiles!expenses_recorded_by_fkey (
          full_name
        )
      `)
      .eq('owner_id', owner_id)
      .order('expense_date', { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (dateFrom) {
      query = query.gte('expense_date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('expense_date', dateTo + ' 23:59:59');
    }

    const { data, error } = await query.limit(100);

    if (error) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hitilafu: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hakuna matumizi yaliyopatikana</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(e => {
      const categoryLabels = {
        Rent: 'Kodi',
        Transport: 'Usafiri',
        Electricity: 'Umeme',
        Internet: 'Internet',
        Salary: 'Mishahara',
        Supplies: 'Vifaa',
        Maintenance: 'Matengenezo',
        Other: 'Nyingine'
      };

      const paymentLabels = {
        cash: 'Cash',
        mobile_money: 'Mobile Money',
        bank: 'Bank',
        card: 'Card'
      };

      return `
        <tr>
          <td>${new Date(e.expense_date).toLocaleDateString('sw-TZ')}</td>
          <td>
            <strong>${e.title}</strong>
            ${e.notes ? `<small class="table-subtext">${e.notes}</small>` : ''}
          </td>
          <td><span class="badge badge-primary">${categoryLabels[e.category] || e.category}</span></td>
          <td><strong>${window.money(e.amount)}</strong></td>
          <td>${paymentLabels[e.payment_method] || e.payment_method}</td>
          <td>${e.recorded_by_user?.full_name || 'Mfanyakazi'}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteExpense('${e.id}')">Futa</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading expenses:', error);
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Hitilafu: ${error.message}</td></tr>`;
  }
}

// Function ya kuonyesha maelezo ya stats
window.showExpenseDetails = async (period) => {
  if (!currentUser) return;
  
  const modal = document.getElementById('details-modal');
  const content = document.getElementById('details-content');
  const title = document.getElementById('details-title');
  const owner_id = currentUser.id;
  
  modal.style.display = 'flex';
  content.innerHTML = '<p class="empty-state">Inapakia...</p>';

  let startDate, endDate, label;
  const now = new Date();

  if (period === 'today') {
    title.textContent = 'Matumizi ya Leo';
    startDate = now.toISOString().split('T')[0];
    endDate = startDate + ' 23:59:59';
    label = 'Leo';
  } else if (period === 'week') {
    title.textContent = 'Matumizi ya Wiki Hii';
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate = weekAgo.toISOString().split('T')[0];
    endDate = now.toISOString().split('T')[0] + ' 23:59:59';
    label = 'Wiki Hii';
  } else if (period === 'month') {
    title.textContent = 'Matumizi ya Mwezi Huu';
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    endDate = now.toISOString().split('T')[0] + ' 23:59:59';
    label = 'Mwezi Huu';
  }

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        recorded_by_user:profiles!expenses_recorded_by_fkey (full_name)
      `)
      .eq('owner_id', owner_id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      content.innerHTML = '<div class="empty-state">Hakuna matumizi kwa kipindi hiki.</div>';
      return;
    }

    let total = 0;
    const categoryLabels = {
      Rent: 'Kodi',
      Transport: 'Usafiri',
      Electricity: 'Umeme',
      Internet: 'Internet',
      Salary: 'Mishahara',
      Supplies: 'Vifaa',
      Maintenance: 'Matengenezo',
      Other: 'Nyingine'
    };

    content.innerHTML = `
      <div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 8px;">
        <strong>Kipindi:</strong> ${label}
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="position: sticky; top: 0; background: white;">
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px; text-align: left;">Tarehe</th>
              <th style="padding: 12px; text-align: left;">Maelezo</th>
              <th style="padding: 12px; text-align: left;">Kategoria</th>
              <th style="padding: 12px; text-align: right;">Kiasi</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(e => {
              total += parseFloat(e.amount || 0);
              return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px;">${new Date(e.expense_date).toLocaleDateString('sw-TZ')}</td>
                  <td style="padding: 12px;">${e.title}</td>
                  <td style="padding: 12px;">${categoryLabels[e.category] || e.category}</td>
                  <td style="padding: 12px; text-align: right; font-weight: 600;">${window.money(e.amount)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot style="background: #f0f9ff; font-weight: 700;">
            <tr>
              <td colspan="3" style="padding: 12px; text-align: right;">JUMLA:</td>
              <td style="padding: 12px; text-align: right; color: #0369a1;">${window.money(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading details:', error);
    content.innerHTML = `<div class="empty-state" style="color: red;">Hitilafu: ${error.message}</div>`;
  }
};

window.closeDetailsModal = () => {
  document.getElementById('details-modal').style.display = 'none';
};

function openModal() {
  const modal = document.getElementById('expense-modal');
  const form = document.getElementById('expense-form');
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  form.expense_date.value = today;
  
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('expense-modal');
  modal.style.display = 'none';
  document.getElementById('expense-form').reset();
  document.getElementById('form-message').style.display = 'none';
}

async function saveExpense() {
  if (!currentUser) {
    alert('Tafadhali login tena');
    return;
  }
  
  const form = document.getElementById('expense-form');
  const message = document.getElementById('form-message');
  const { data: userData } = await supabase.auth.getUser();
  const owner_id = currentUser.id;

  const data = {
    title: form.title.value.trim(),
    category: form.category.value,
    amount: parseFloat(form.amount.value),
    payment_method: form.payment_method.value,
    expense_date: form.expense_date.value || new Date().toISOString().split('T')[0],
    notes: form.notes.value.trim() || null,
    recorded_by: userData.user.id,
    owner_id: owner_id
  };

  try {
    const { error } = await supabase
      .from('expenses')
      .insert([data]);

    if (error) {
      message.textContent = error.message;
      message.className = 'form-message error';
      message.style.display = 'block';
      return;
    }

    message.textContent = 'Matumizi yamehifadhiwa!';
    message.className = 'form-message success';
    message.style.display = 'block';

    setTimeout(() => {
      closeModal();
      loadExpenses();
      loadSummary();
    }, 1500);
  } catch (error) {
    console.error('Error saving expense:', error);
    message.textContent = 'Imeshindikana kuhifadhi matumizi: ' + error.message;
    message.className = 'form-message error';
    message.style.display = 'block';
  }
}

window.deleteExpense = async (id) => {
  if (!confirm('Je, una uhakika unataka kufuta matumizi haya?')) return;

  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Hitilafu: ' + error.message);
      return;
    }

    loadExpenses();
    loadSummary();
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Imeshindikana kufuta: ' + error.message);
  }
};