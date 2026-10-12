import { supabase } from '../lib/supabase.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';

export async function renderDeveloper(root, user, profile) {
  if (user.email !== DEVELOPER_EMAIL) {
    root.innerHTML = `
      <div class="notice error">
        <h3>Hauruhusiwi</h3>
        <p>Ukurasa huu unapatikana kwa Developer pekee.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="developer-container">
      <div class="page-header">
        <h1>Developer Dashboard</h1>
        <p class="text-muted">Takwimu za jumla za mfumo wa StationeryPro</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('all_owners')">
          <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Jumla ya Owners</p>
            <h3 class="stat-value" id="total-owners">...</h3>
          </div>
        </div>
        
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('pending')">
          <div class="stat-icon" style="background: #fef3c7; color: #92400e;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Wanasubiri Uthibitisho</p>
            <h3 class="stat-value" id="pending-count">...</h3>
          </div>
        </div>
        
        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('approved')">
          <div class="stat-icon" style="background: #dcfce7; color: #166534;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Wamepitishwa (Active)</p>
            <h3 class="stat-value" id="approved-count">...</h3>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="showUsersList('cashiers')">
          <div class="stat-icon" style="background: #fce7f3; color: #9d174d;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Jumla ya Cashiers</p>
            <h3 class="stat-value" id="total-cashiers">...</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #f3e8ff; color: #7c3aed;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Jumla ya Bidhaa</p>
            <h3 class="stat-value" id="total-products">...</h3>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #fee2e2; color: #991b1b;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Jumla ya Mauzo</p>
            <h3 class="stat-value" id="total-sales">...</h3>
          </div>
        </div>
      </div>

      <!-- Modal ya kuonyesha orodha ya users -->
      <div id="users-modal" class="modal-overlay" style="display: none;">
        <div class="modal" style="max-width: 800px;">
          <div class="modal-header">
            <h3 id="modal-title">Orodha ya Watumiaji</h3>
            <button class="modal-close" onclick="closeUsersModal()">×</button>
          </div>
          <div class="modal-body">
            <div id="users-list-content">Inapakia...</div>
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 32px;">
        <h2>Ombi Mpya za Owners (Zinasubiri Uthibitisho)</h2>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Jina</th>
              <th>Email</th>
              <th>Simu</th>
              <th>Jina la Duka</th>
              <th>Eneo</th>
              <th>Tarehe</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody id="pending-body">
            <tr><td colspan="7" class="empty-state">Inapakia...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="section-title" style="margin-top: 32px;">
        <h2>Owners Waliopitishwa</h2>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Jina</th>
              <th>Email</th>
              <th>Jina la Duka</th>
              <th>Wafanyakazi</th>
              <th>Bidhaa</th>
              <th>Hali</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody id="approved-body">
            <tr><td colspan="7" class="empty-state">Inapakia...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  await loadSystemStats();
  await loadPendingOwners();
  await loadApprovedOwners();
}

async function loadSystemStats() {
  // Total owners (approved + pending)
  const { count: totalOwners } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner');
  
  // Pending owners
  const { count: pendingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner').eq('is_approved', false);
  
  // Approved owners
  const { count: approvedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner').eq('is_approved', true).eq('active', true);
  
  // Total cashiers
  const { count: totalCashiers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cashier');
  
  // Total products (across all businesses)
  const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
  
  // Total sales
  const { count: totalSales } = await supabase.from('sales').select('*', { count: 'exact', head: true });

  document.getElementById('total-owners').textContent = totalOwners || 0;
  document.getElementById('pending-count').textContent = pendingCount || 0;
  document.getElementById('approved-count').textContent = approvedCount || 0;
  document.getElementById('total-cashiers').textContent = totalCashiers || 0;
  document.getElementById('total-products').textContent = totalProducts || 0;
  document.getElementById('total-sales').textContent = totalSales || 0;
}

async function loadPendingOwners() {
  const { data: pending, error } = await supabase
    .from('profiles')
    .select(`*, business_settings(business_name, business_address)`)
    .eq('role', 'owner')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading pending:', error);
    return;
  }

  const tbody = document.getElementById('pending-body');
  
  if (!pending || pending.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Hakuna ombi mpya</td></tr>';
    return;
  }

  tbody.innerHTML = pending.map(p => `
    <tr>
      <td><strong>${p.full_name || '-'}</strong></td>
      <td>${p.email || '-'}</td>
      <td>${p.phone || '-'}</td>
      <td>${p.business_settings?.business_name || '-'}</td>
      <td>${p.business_settings?.business_address || '-'}</td>
      <td>${new Date(p.created_at).toLocaleDateString('sw-TZ')}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="approveOwner('${p.id}', true)">Pitisha</button>
        <button class="btn btn-sm btn-danger" onclick="approveOwner('${p.id}', false)">Kataa</button>
      </td>
    </tr>
  `).join('');
}

async function loadApprovedOwners() {
  const { data: approved, error } = await supabase
    .from('profiles')
    .select(`*, business_settings(business_name)`)
    .eq('role', 'owner')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading approved:', error);
    return;
  }

  const tbody = document.getElementById('approved-body');
  
  if (!approved || approved.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Hakuna owners waliopitishwa</td></tr>';
    return;
  }

  // Get cashier and product counts for each owner
  const approvedWithCounts = await Promise.all(approved.map(async (owner) => {
    const { count: cashierCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('owner_id', owner.id);
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('owner_id', owner.id);
    return { ...owner, cashier_count: cashierCount || 0, product_count: productCount || 0 };
  }));

  tbody.innerHTML = approvedWithCounts.map(p => `
    <tr>
      <td><strong>${p.full_name || '-'}</strong></td>
      <td>${p.email || '-'}</td>
      <td>${p.business_settings?.business_name || '-'}</td>
      <td>${p.cashier_count} wafanyakazi</td>
      <td>${p.product_count} bidhaa</td>
      <td>${p.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
      <td>
        <button class="btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}" onclick="toggleOwner('${p.id}', ${!p.active})">
          ${p.active ? 'Funga' : 'Fungua'}
        </button>
      </td>
    </tr>
  `).join('');
}

// Function to show users list in modal
window.showUsersList = async (type) => {
  const modal = document.getElementById('users-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('users-list-content');
  
  modal.style.display = 'flex';
  content.innerHTML = 'Inapakia...';

  let query = supabase.from('profiles').select('*');
  let labelText = '';

  if (type === 'all_owners') {
    query = query.eq('role', 'owner');
    labelText = 'Wamiliki Wote';
  } else if (type === 'pending') {
    query = query.eq('role', 'owner').eq('is_approved', false);
    labelText = 'Wanasubiri Uthibitisho';
  } else if (type === 'approved') {
    query = query.eq('role', 'owner').eq('is_approved', true);
    labelText = 'Wamepitishwa';
  } else if (type === 'cashiers') {
    query = query.eq('role', 'cashier');
    labelText = 'Wafanyakazi/Cashiers';
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    content.innerHTML = '<p class="empty-state">Hakuna watumiaji wa aina hii.</p>';
    return;
  }

  title.textContent = labelText;
  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Jina</th>
            <th>Email</th>
            <th>Role</th>
            <th>Hali</th>
            <th>Tarehe</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(u => `
            <tr>
              <td>${u.full_name || '-'}</td>
              <td>${u.email || '-'}</td>
              <td>${u.role || '-'}</td>
              <td>${u.is_approved ? '<span class="badge badge-success">Imepitishwa</span>' : '<span class="badge badge-warning">Inasubiri</span>'}</td>
              <td>${new Date(u.created_at).toLocaleDateString('sw-TZ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

window.closeUsersModal = () => {
  document.getElementById('users-modal').style.display = 'none';
};

window.approveOwner = async (ownerId, approve) => {
  if (!confirm(`Je, una uhakika unataka ${approve ? 'kupitisha' : 'kukataa'} akaunti hii?`)) return;

  const { error } = await supabase.from('profiles').update({ is_approved: approve, active: approve }).eq('id', ownerId);
  if (error) { alert('Hitilafu: ' + error.message); return; }

  if (!approve) {
    await supabase.from('business_settings').delete().eq('owner_id', ownerId);
  }

  loadSystemStats();
  loadPendingOwners();
  loadApprovedOwners();
};

window.toggleOwner = async (ownerId, newStatus) => {
  if (!confirm(`Je, una uhakika unataka ${newStatus ? 'kumfungulia' : 'kumfungia'} owner huyu?`)) return;

  const { error } = await supabase.from('profiles').update({ active: newStatus }).eq('id', ownerId);
  if (error) { alert('Hitilafu: ' + error.message); return; }

  loadApprovedOwners();
};