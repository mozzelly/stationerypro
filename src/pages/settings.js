import { supabase } from '../lib/supabase.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';

export async function renderSettings(root, user, profile) {
  const isDeveloper = user.email === DEVELOPER_EMAIL;

  // CASHIER - Dark Mode tu
  if (profile.role === 'cashier' || profile.role === 'employee') {
    root.innerHTML = `
      <div class="settings-container">
        <div class="page-header"><h1>Settings</h1></div>
        <div class="settings-section">
          <h3>Muonekano</h3>
          <div class="setting-item">
            <div><strong>Dark Mode</strong></div>
            <label class="toggle-switch">
              <input type="checkbox" id="dark-mode-toggle" ${profile.dark_mode ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;

    document.getElementById('dark-mode-toggle').addEventListener('change', async (e) => {
      const isDark = e.target.checked;
      await supabase.from('profiles').update({ dark_mode: isDark }).eq('id', user.id);
      document.body.classList.toggle('dark-mode', isDark);
    });

    if (profile.dark_mode) document.body.classList.add('dark-mode');
    return;
  }

  // OWNER & DEVELOPER
  let businessSettings = null;
  if (profile.role === 'owner') {
    const result = await supabase.from('business_settings').select('*').eq('owner_id', user.id).single();
    businessSettings = result.data;
  }

  const avatarUrl = profile.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e2e8f0"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="%2364748b">' + (profile.full_name || 'U').charAt(0).toUpperCase() + '</text></svg>';

  root.innerHTML = `
    <div class="settings-container">
      <div class="page-header"><h1>Settings</h1></div>

      <div class="settings-section">
        <h3>Akaunti na Picha</h3>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
          <img id="profile-preview" src="${avatarUrl}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
          <div>
            <input type="file" id="avatar-input" accept="image/*" style="display: none;" />
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('avatar-input').click()">Badilisha Picha</button>
          </div>
        </div>
        
        <form id="password-form">
          <h4>Badilisha Nenosiri</h4>
          <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="form-group"><label>Nenosiri Jipya</label><input type="password" name="new_password" minlength="6" /></div>
            <div class="form-group"><label>Thibitisha</label><input type="password" name="confirm_password" minlength="6" /></div>
          </div>
          <div id="password-message" class="form-message" style="display: none;"></div>
          <button type="submit" class="btn btn-primary">Sasisha Nenosiri</button>
        </form>
      </div>

      ${profile.role === 'owner' ? `
      <div class="settings-section">
        <h3>Taarifa za Biashara</h3>
        <form id="business-form">
          <div class="form-grid">
            <div class="form-group"><label>Jina la Biashara</label><input type="text" name="business_name" value="${businessSettings?.business_name || ''}" /></div>
            <div class="form-group"><label>Simu</label><input type="tel" name="business_phone" value="${businessSettings?.business_phone || ''}" /></div>
            <div class="form-group"><label>Anuani</label><input type="text" name="business_address" value="${businessSettings?.business_address || ''}" /></div>
            <div class="form-group"><label>Currency</label><input type="text" name="currency" value="${businessSettings?.currency || 'TZS'}" /></div>
          </div>
          <div id="business-message" class="form-message" style="display: none;"></div>
          <button type="submit" class="btn btn-primary">Hifadhi</button>
        </form>
      </div>
      ` : ''}

      <div class="settings-section">
        <h3>Muonekano</h3>
        <div class="setting-item">
          <div><strong>Dark Mode</strong></div>
          <label class="toggle-switch">
            <input type="checkbox" id="dark-mode-toggle" ${profile.dark_mode ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      ${profile.role === 'owner' ? `
      <div class="settings-section">
        <h3>Backup</h3>
        <button id="export-data" class="btn btn-primary">Export Data (JSON)</button>
        <div id="backup-message" class="form-message" style="display: none;"></div>
      </div>
      ` : ''}
    </div>
  `;

  // Event Listeners
  document.getElementById('avatar-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 2097152) return alert('Picha kubwa sana!');
    
    const ext = file.name.split('.').pop();
    const name = `${user.id}-${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage.from('avatars').upload(name, file);
    if (error) return alert(error.message);
    
    const { data } = supabase.storage.from('avatars').getPublicUrl(name);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    document.getElementById('profile-preview').src = data.publicUrl;
    alert('Picha imesasishwa!');
  });

  document.getElementById('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.new_password.value !== form.confirm_password.value) {
      const msg = document.getElementById('password-message');
      msg.textContent = 'Nenosiri hazilingani!';
      msg.className = 'form-message error';
      msg.style.display = 'block';
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: form.new_password.value });
    if (error) return alert(error.message);
    alert('Nenosiri limebadilishwa!');
    form.reset();
  });

  document.getElementById('business-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      owner_id: user.id,
      business_name: form.business_name.value,
      business_phone: form.business_phone.value,
      business_address: form.business_address.value,
      currency: form.currency.value
    };
    const { error } = await supabase.from('business_settings').upsert(data, { onConflict: 'owner_id' });
    if (error) return alert(error.message);
    alert('Imehifadhiwa!');
  });

  document.getElementById('dark-mode-toggle')?.addEventListener('change', async (e) => {
    await supabase.from('profiles').update({ dark_mode: e.target.checked }).eq('id', user.id);
    document.body.classList.toggle('dark-mode', e.target.checked);
  });

  document.getElementById('export-data')?.addEventListener('click', async () => {
    const [products, sales] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales').select('*')
    ]);
    const blob = new Blob([JSON.stringify({ products: products.data, sales: sales.data })], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    alert('Data imeexport!');
  });
}