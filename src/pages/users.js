import { supabase } from '../lib/supabase.js';

export async function renderUsers(root, user, profile) {
  // Check if user is owner
  if (profile.role !== 'owner') {
    root.innerHTML = `
      <div class="notice error">
        <h3>Hauruhusiwi</h3>
        <p>Ukurasa huu unapatikana kwa wamiliki (owners) pekee.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h1>Watumiaji wa Mfumo</h1>
      <button id="add-user-btn" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Ongeza Mfanyakazi
      </button>
    </div>

    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div class="stat-content">
          <p class="stat-label">Jumla ya Wafanyakazi</p>
          <h3 class="stat-value" id="total-employees">0</h3>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #dcfce7; color: #166534;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-content">
          <p class="stat-label">Wanayofanya Kazi</p>
          <h3 class="stat-value" id="active-employees">0</h3>
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table id="users-table">
        <thead>
          <tr>
            <th>Jina</th>
            <th>Email</th>
            <th>Namba ya Simu</th>
            <th>Role</th>
            <th>Hali</th>
            <th>Tarehe ya Kujiunga</th>
            <th>Vitendo</th>
          </tr>
        </thead>
        <tbody id="users-body">
          <tr><td colspan="7" class="empty-state">Inapakia...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Add User Modal -->
    <div id="user-modal" class="modal-overlay" style="display: none;">
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Ongeza Mfanyakazi</h3>
          <button class="modal-close" id="close-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="user-form">
            <div class="form-group">
              <label>Jina kamili *</label>
              <input type="text" name="full_name" required maxlength="100" placeholder="Mfano: Juma Mwalimu" />
            </div>
            <div class="form-group">
              <label>Barua pepe *</label>
              <input type="email" name="email" required placeholder="juma@biashara.com" />
            </div>
            <div class="form-group">
              <label>Nenosiri (angalau herufi 6) *</label>
              <input type="password" name="password" required minlength="6" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>Namba ya simu</label>
              <input type="tel" name="phone" placeholder="0712345678" pattern="[0-9]{10}" />
            </div>
            <div class="form-group">
              <label>Aina ya akaunti *</label>
              <select name="role" required>
                <option value="employee">Mfanyakazi (Employee)</option>
                <option value="cashier">Mhasibu (Cashier)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ruhusa Maalum</label>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                  <input type="checkbox" name="can_view_reports" />
                  <span>Aweze kuona ripoti</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                  <input type="checkbox" name="can_manage_stock" checked />
                  <span>Aweze kusimamia stock</span>
                </label>
              </div>
            </div>
            <div id="form-message" class="form-message" style="display: none;"></div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" id="cancel-btn">Ghairi</button>
              <button type="submit" class="btn btn-primary">Ongeza Mfanyakazi</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  await loadUsers();

  document.getElementById('add-user-btn').addEventListener('click', () => {
    openModal();
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addUser();
  });
}

async function loadUsers() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading users:', error);
    return;
  }

  const tbody = document.getElementById('users-body');
  const totalEmployees = users?.filter(u => u.role !== 'owner').length || 0;
  const activeEmployees = users?.filter(u => u.role !== 'owner' && u.active).length || 0;

  document.getElementById('total-employees').textContent = totalEmployees;
  document.getElementById('active-employees').textContent = activeEmployees;

  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Hakuna watumiaji</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.full_name || 'Hakuna jina'}</strong></td>
      <td>${u.email || '-'}</td>
      <td>${u.phone || '-'}</td>
      <td><span class="badge ${u.role === 'owner' ? 'badge-danger' : 'badge-primary'}">${u.role === 'owner' ? 'Mmiliki' : u.role === 'cashier' ? 'Mhasibu' : 'Mfanyakazi'}</span></td>
      <td>${u.active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-warning">Inactive</span>'}</td>
      <td>${new Date(u.created_at).toLocaleDateString('sw-TZ')}</td>
      <td>
        ${u.role !== 'owner' ? `
          <button class="btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'}" onclick="toggleUserStatus('${u.id}', ${!u.active})">
            ${u.active ? 'Funga' : 'Fungua'}
          </button>
          <button class="btn btn-sm btn-secondary" onclick="resetUserPassword('${u.id}')">Reset Password</button>
        ` : '-'}
      </td>
    </tr>
  `).join('');
}

function openModal() {
  document.getElementById('user-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('user-modal').style.display = 'none';
  document.getElementById('user-form').reset();
  document.getElementById('form-message').style.display = 'none';
}

async function addUser() {
  const form = document.getElementById('user-form');
  const message = document.getElementById('form-message');

  const formData = new FormData(form);
  const email = formData.get('email');
  const password = formData.get('password');
  const fullName = formData.get('full_name');
  const phone = formData.get('phone');
  const role = formData.get('role');

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role
      }
    });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        phone,
        role,
        active: true
      });

    if (profileError) throw profileError;

    message.textContent = 'Mfanyakazi ameongezwa kwa mafanikio!';
    message.className = 'form-message success';
    message.style.display = 'block';

    setTimeout(() => {
      closeModal();
      loadUsers();
    }, 2000);

  } catch (error) {
    message.textContent = error.message || 'Imeshindikana kuongeza mfanyakazi';
    message.className = 'form-message error';
    message.style.display = 'block';
  }
}

window.toggleUserStatus = async (userId, newStatus) => {
  const action = newStatus ? 'kumfungulia' : 'kumfungia';
  if (!confirm(`Je, una uhakika unataka ${action} mfanyakazi huyu?`)) return;

  const { error } = await supabase
    .from('profiles')
    .update({ active: newStatus })
    .eq('id', userId);

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  loadUsers();
};

window.resetUserPassword = async (userId) => {
  const newPassword = prompt('Weka nenosiri jipya kwa mfanyakazi huyu:');
  if (!newPassword || newPassword.length < 6) {
    alert('Nenosiri lazima liwe na angalau herufi 6');
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  alert('Nenosiri limebadilishwa kwa mafanikio!');
};