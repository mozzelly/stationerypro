import { supabase } from '../lib/supabase.js';

// Email yako ya developer - BADILISHA hii iwe email yako halisi
const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';

export async function renderDeveloper(root, user, profile) {
  // Check if current user is the developer
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
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fef3c7; color: #92400e;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Wanasubiri Uthibitisho</p>
            <h3 class="stat-value" id="pending-count">0</h3>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #dcfce7; color: #166534;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Wamepitishwa</p>
            <h3 class="stat-value" id="approved-count">0</h3>
          </div>
        </div>
      </div>

      <div class="section-title">
        <h2>Ombi Mpya za Owners</h2>
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
              <th>Cashiers</th>
              <th>Hali</th>
              <th>Vitendo</th>
            </tr>
          </thead>
          <tbody id="approved-body">
            <tr><td colspan="6" class="empty-state">Inapakia...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  await loadPendingOwners();
  await loadApprovedOwners();
}

async function loadPendingOwners() {
  const { data: pending, error } = await supabase
    .from('profiles')
    .select(`
      *,
      business_settings!inner(business_name, business_address)
    `)
    .eq('role', 'owner')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading pending:', error);
    return;
  }

  const tbody = document.getElementById('pending-body');
  document.getElementById('pending-count').textContent = pending?.length || 0;

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
    .select(`
      *,
      business_settings!inner(business_name),
      cashiers:profiles(owner_id)
    `)
    .eq('role', 'owner')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading approved:', error);
    return;
  }

  const tbody = document.getElementById('approved-body');
  document.getElementById('approved-count').textContent = approved?.length || 0;

  if (!approved || approved.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Hakuna owners waliopitishwa</td></tr>';
    return;
  }

  tbody.innerHTML = approved.map(p => `
    <tr>
      <td><strong>${p.full_name || '-'}</strong></td>
      <td>${p.email || '-'}</td>
      <td>${p.business_settings?.business_name || '-'}</td>
      <td>${p.cashiers?.length || 0} wafanyakazi</td>
      <td>${p.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
      <td>
        <button class="btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}" 
                onclick="toggleOwner('${p.id}', ${!p.active})">
          ${p.active ? 'Funga' : 'Fungua'}
        </button>
      </td>
    </tr>
  `).join('');
}

window.approveOwner = async (ownerId, approve) => {
  const action = approve ? 'kupitisha' : 'kukataa';
  if (!confirm(`Je, una uhakika unataka ${action} akaunti hii?`)) return;

  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_approved: approve,
      active: approve  // active=true if approved
    })
    .eq('id', ownerId);

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  // If rejected, delete their business settings
  if (!approve) {
    await supabase.from('business_settings').delete().eq('owner_id', ownerId);
  }

  loadPendingOwners();
  loadApprovedOwners();
};

window.toggleOwner = async (ownerId, newStatus) => {
  const action = newStatus ? 'kumfungulia' : 'kumfungia';
  if (!confirm(`Je, una uhakika unataka ${action} owner huyu?`)) return;

  const { error } = await supabase
    .from('profiles')
    .update({ active: newStatus })
    .eq('id', ownerId);

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  loadApprovedOwners();
};