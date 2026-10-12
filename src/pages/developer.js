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

      <!-- Modal ya kuonyesha orodha ya users na kitufe cha kufuta -->
      <div id="users-modal" class="modal-overlay" style="display: none;">
        <div class="modal" style="max-width: 900px;">
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
  // Tunatumia .select().then(data => data.length) badala ya count: 'exact' ili kuepuka matatizo ya RLS
  const { data: owners } = await supabase.from('profiles').select('id').eq('role', 'owner');
  const { data: pending } = await supabase.from('profiles').select('id').eq('role', 'owner').eq('is_approved', false);
  const { data: approved } = await supabase.from('profiles').select('id').eq('role', 'owner').eq('is_approved', true).eq('active', true);
  const { data: cashiers } = await supabase.from('profiles').select('id').eq('role', 'cashier');
  const { data: products } = await supabase.from('products').select('id');
  const { data: sales } = await supabase.from('sales').select('id');

  document.getElementById('total-owners').textContent = owners ? owners.length : 0;
  document.getElementById('pending-count').textContent = pending ? pending.length : 0;
  document.getElementById('approved-count').textContent = approved ? approved.length : 0;
  document.getElementById('total-cashiers').textContent = cashiers ? cashiers.length : 0;
  document.getElementById('total-products').textContent = products ? products.length : 0;
  document.getElementById('total-sales').textContent = sales ? sales.length : 0;
}

async function loadPendingOwners() {
  const { data: pending, error } = await supabase
    .from('profiles')
    .select(`*, business_settings(business_name, business_address)`)
    .eq('role', 'owner')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });

  if (error) { console.error('Error loading pending:', error); return; }

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
      <td style="display: flex; gap: 5px;">
        <button class="btn btn-sm btn-success" onclick="approveOwner('${p.id}', true)">Pitisha</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${p.id}')">Futa</button>
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

  if (error) { console.error('Error loading approved:', error); return; }

  const tbody = document.getElementById('approved-body');
  if (!approved || approved.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Hakuna owners waliopitishwa</td></tr>';
    return;
  }

  const approvedWithCounts = await Promise.all(approved.map(async (owner) => {
    const { data: c } = await supabase.from('profiles').select('id').eq('owner_id', owner.id);
    const { data: p } = await supabase.from('products').select('id').eq('owner_id', owner.id);
    return { ...owner, cashier_count: c ? c.length : 0, product_count: p ? p.length : 0 };
  }));

  tbody.innerHTML = approvedWithCounts.map(p => `
    <tr>
      <td><strong>${p.full_name || '-'}</strong></td>
      <td>${p.email || '-'}</td>
      <td>${p.business_settings?.business_name || '-'}</td>
      <td>${p.cashier_count} wafanyakazi</td>
      <td>${p.product_count} bidhaa</td>
      <td>${p.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
      <td style="display: flex; gap: 5px;">
        <button class="btn btn-sm ${p.active ? 'btn-warning' : 'btn-success'}" onclick="toggleOwner('${p.id}', ${!p.active})">
          ${p.active ? 'Funga' : 'Fungua'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${p.id}')">Futa</button>
      </td>
    </tr>
  `).join('');
}

// Function to show users list in modal (with Delete button)
window.showUsersList = async (type) => {
  const modal = document.getElementById('users-modal');
  const title = document.getElementById('modal-title');
  const content = document.getElementById('users-list-content');
  
  modal.style.display = 'flex';
  content.innerHTML = '<p class="muted">Inapakia...</p>';

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
    labelText = 'Wafanyakazi / Cashiers';
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    content.innerHTML = '<p class="empty-state">Hakuna watumiaji wa aina hii.</p>';
    return;
  }

  title.textContent = `${labelText} (${data.length})`;
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
            <th>Vitendo</th>
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
              <td>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Futa Kabisa</button>
              </td>
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

// =========================================================
// FUNCTION MPYA YA KUFUTA MTUMIAJI (OWNER / CASHIER)
// =========================================================
window.deleteUser = async (userId) => {
  if (!confirm('TAHADHARI: Una uhakika unataka kufuta akaunti hii KABISA? Data zake zote (profiles, business settings) zitaondolewa na hatua hii haiwezi kurudishwa.')) {
    return;
  }

  try {
    // 1. Futa business settings zake
    await supabase.from('business_settings').delete().eq('owner_id', userId);
    
    // 2. Futa bidhaa zake (kama zipo)
    await supabase.from('products').delete().eq('owner_id', userId);
    
    // 3. Futa profile yake (Hii ndiyo inamfuta kwenye mfumo)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    
    if (error) {
      alert('Hitilafu: ' + error.message);
    } else {
      alert('Akaunti imefutwa kwa mafanikio!');
      // Refresh data zote ili namba zibadilike mara moja
      await loadSystemStats();
      await loadPendingOwners();
      await loadApprovedOwners();
      closeUsersModal(); // Funga modal kama imefunguka
    }
  } catch (err) {
    alert('Hitilafu isiyojulikana: ' + err.message);
  }
};

window.approveOwner = async (ownerId, approve) => {
  if (!confirm(`Je, una uhakika unataka ${approve ? 'kupitisha' : 'kukataa'} akaunti hii?`)) return;

  const { error } = await supabase.from('profiles').update({ is_approved: approve, active: approve }).eq('id', ownerId);
  if (error) { alert('Hitilafu: ' + error.message); return; }

  if (!approve) {
    await supabase.from('business_settings').delete().eq('owner_id', ownerId);
  }

  await loadSystemStats();
  await loadPendingOwners();
  await loadApprovedOwners();
};

window.toggleOwner = async (ownerId, newStatus) => {
  if (!confirm(`Je, una uhakika unataka ${newStatus ? 'kumfungulia' : 'kumfungia'} owner huyu?`)) return;

  const { error } = await supabase.from('profiles').update({ active: newStatus }).eq('id', ownerId);
  if (error) { alert('Hitilafu: ' + error.message); return; }

  await loadApprovedOwners();
};