import { supabase } from '../lib/supabase.js';

export async function renderSettings(root, user, profile) {
  if (profile.role !== 'owner') {
    root.innerHTML = `
      <div class="notice error">
        <h3>Hauruhusiwi</h3>
        <p>Settings zinapatikana kwa Wamiliki (Owners) pekee.</p>
      </div>
    `;
    return;
  }

  // Load current settings for this specific owner (Mabadiliko 1 hapa)
  const { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  root.innerHTML = `
    <div class="settings-container">
      <div class="page-header">
        <h1>Settings za Mfumo</h1>
      </div>

      <!-- Business Info -->
      <div class="settings-section">
        <h3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Taarifa za Biashara</h3>
        <form id="business-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Jina la Biashara *</label>
              <input type="text" name="business_name" value="${settings?.business_name || ''}" required />
            </div>
            <div class="form-group">
              <label>Barua Pepe</label>
              <input type="email" name="business_email" value="${settings?.business_email || ''}" />
            </div>
            <div class="form-group">
              <label>Namba ya Simu</label>
              <input type="tel" name="business_phone" value="${settings?.business_phone || ''}" />
            </div>
            <div class="form-group">
              <label>Anuani</label>
              <input type="text" name="business_address" value="${settings?.business_address || ''}" />
            </div>
            <div class="form-group">
              <label>Sarufi (Currency)</label>
              <input type="text" name="currency" value="${settings?.currency || 'TZS'}" />
            </div>
            <div class="form-group span-all">
              <label>Footer ya Risiti</label>
              <textarea name="receipt_footer" rows="3">${settings?.receipt_footer || ''}</textarea>
            </div>
          </div>
          <div id="business-message" class="form-message" style="display: none;"></div>
          <div class="form-buttons">
            <button type="submit" class="btn btn-primary">Hifadhi Mabadiliko</button>
          </div>
        </form>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <h3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Muonekano</h3>
        <div class="setting-item">
          <div>
            <strong>Dark Mode</strong>
            <p class="text-muted text-sm">Badilisha muonekano wa mfumo kuwa giza</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="dark-mode-toggle" ${settings?.dark_mode ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Backup & Restore -->
      <div class="settings-section">
        <h3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Backup & Restore</h3>
        <div class="backup-actions">
          <button id="create-backup" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Tengeneza Backup Sasa
          </button>
          <button id="export-data" class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export Data Yote (JSON)
          </button>
        </div>
        <div id="backup-message" class="form-message" style="display: none;"></div>
      </div>
    </div>
  `;

  // Business form submit
  document.getElementById('business-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const message = document.getElementById('business-message');

    const data = {
      business_name: form.business_name.value,
      business_email: form.business_email.value,
      business_phone: form.business_phone.value,
      business_address: form.business_address.value,
      currency: form.currency.value,
      receipt_footer: form.receipt_footer.value,
      updated_by: user.id
    };

    const { error } = await supabase
      .from('business_settings')
      .update(data)
      .eq('owner_id', user.id); // <-- Mabadiliko 2 hapa

    if (error) {
      message.textContent = error.message;
      message.className = 'form-message error';
      message.style.display = 'block';
      return;
    }

    message.textContent = 'Settings zimehifadhiwa kwa mafanikio!';
    message.className = 'form-message success';
    message.style.display = 'block';

    setTimeout(() => {
      message.style.display = 'none';
    }, 3000);
  });

  // Dark mode toggle
  document.getElementById('dark-mode-toggle').addEventListener('change', async (e) => {
    const isDark = e.target.checked;

    const { error } = await supabase
      .from('business_settings')
      .update({ dark_mode: isDark })
      .eq('owner_id', user.id); // <-- Mabadiliko 3 hapa

    if (error) {
      alert('Hitilafu: ' + error.message);
      return;
    }

    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  });

  // Create backup
  document.getElementById('create-backup').addEventListener('click', async () => {
    const message = document.getElementById('backup-message');
    const button = document.getElementById('create-backup');

    button.disabled = true;
    button.textContent = 'Inatengeneza backup...';

    try {
      // Export all data
      const [products, sales, customers, expenses] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('expenses').select('*')
      ]);

      const backupData = {
        products: products.data,
        sales: sales.data,
        customers: customers.data,
        expenses: expenses.data,
        backup_date: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      message.textContent = 'Backup imetengenezwa na kupakuliwa!';
      message.className = 'form-message success';
      message.style.display = 'block';

    } catch (error) {
      message.textContent = error.message;
      message.className = 'form-message error';
      message.style.display = 'block';
    } finally {
      button.disabled = false;
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Tengeneza Backup Sasa';
    }
  });

  // Export data
  document.getElementById('export-data').addEventListener('click', async () => {
    const message = document.getElementById('backup-message');

    try {
      const [products, sales, customers, expenses, categories] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('categories').select('*')
      ]);

      const exportData = {
        products: products.data,
        sales: sales.data,
        customers: customers.data,
        expenses: expenses.data,
        categories: categories.data,
        export_date: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stationerypro_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      message.textContent = 'Data imeexport kwa mafanikio!';
      message.className = 'form-message success';
      message.style.display = 'block';

    } catch (error) {
      message.textContent = error.message;
      message.className = 'form-message error';
      message.style.display = 'block';
    }
  });
}