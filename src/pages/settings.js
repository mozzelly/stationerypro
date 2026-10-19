import { supabase } from '../lib/supabase.js';
import { esc, fmtDate, ensureSharedStyles, table, downloadCsv, fetchAll, fetchByIds } from '../lib/shared.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';
const PLAN_LABELS = { trial: 'Majaribio', monthly: 'Kila Mwezi', yearly: 'Kila Mwaka', lifetime: 'Kudumu' };
const DAY = 86400000;

const byId = (id) => document.getElementById(id);

function flash(id, text, ok = false) {
  const el = byId(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + (ok ? 'success' : 'error');
  el.style.display = 'block';
}

function avatarFor(me) {
  if (me.avatar_url) return me.avatar_url;
  const letter = esc(String(me.full_name || 'U').charAt(0).toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="#64748b" font-family="Arial">${letter}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const section = (title, inner, desc = '') => `
  <div class="settings-section">
    <h3>${title}</h3>
    ${desc ? `<p class="muted" style="margin: -4px 0 14px;">${desc}</p>` : ''}
    ${inner}
  </div>`;

const accountSection = (me, user, roleLabel) => section('Akaunti na Picha', `
  <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
    <img id="profile-preview" src="${avatarFor(me)}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" />
    <div>
      <input type="file" id="avatar-input" accept="image/*" style="display: none;" />
      <button type="button" class="btn btn-secondary" id="avatar-btn">Badilisha Picha</button>
      <div class="muted" style="font-size: 12px; margin-top: 6px;">JPG au PNG, isizidi 2MB</div>
      <div id="avatar-message" class="form-message" style="display: none; margin-top: 8px;"></div>
    </div>
  </div>
  <form id="profile-form">
    <div class="form-grid">
      <div class="form-group"><label>Jina Kamili</label><input type="text" name="full_name" value="${esc(me.full_name || '')}" required /></div>
      <div class="form-group"><label>Simu</label><input type="tel" name="phone" value="${esc(me.phone || '')}" /></div>
      <div class="form-group"><label>Email</label><input type="email" value="${esc(user.email || '')}" disabled /></div>
      <div class="form-group"><label>Nafasi</label><input type="text" value="${esc(roleLabel)}" disabled /></div>
    </div>
    <div id="profile-message" class="form-message" style="display: none;"></div>
    <button type="submit" class="btn btn-primary">Hifadhi Taarifa</button>
  </form>`);

const passwordSection = () => section('Usalama', `
  <form id="password-form">
    <h4 style="margin-top: 0;">Badilisha Nenosiri</h4>
    <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
      <div class="form-group"><label>Nenosiri Jipya</label><input type="password" name="new_password" minlength="6" required /></div>
      <div class="form-group"><label>Thibitisha</label><input type="password" name="confirm_password" minlength="6" required /></div>
    </div>
    <div id="password-message" class="form-message" style="display: none;"></div>
    <button type="submit" class="btn btn-primary">Sasisha Nenosiri</button>
  </form>`);

const darkSection = (me) => section('Muonekano', `
  <div class="setting-item">
    <div><strong>Dark Mode</strong></div>
    <label class="toggle-switch">
      <input type="checkbox" id="dark-mode-toggle" ${me.dark_mode ? 'checked' : ''} />
      <span class="toggle-slider"></span>
    </label>
  </div>`);

function planSection(me, sys, shopName) {
  const exp = me.plan_expires_at ? new Date(me.plan_expires_at) : null;
  const left = exp ? Math.ceil((exp - Date.now()) / DAY) : null;
  let status = '<span class="badge badge-success">Active</span>';
  if (left !== null && left < 0) status = '<span class="badge badge-danger">Imeisha</span>';
  else if (left !== null && left <= 14) status = `<span class="badge badge-warning">Inaisha siku ${left}</span>`;

  const wa = String(sys.support_whatsapp || sys.support_phone || '').replace(/\D/g, '');
  const waNum = wa.startsWith('0') ? '255' + wa.slice(1) : wa;
  const msg = encodeURIComponent(`Habari, nahitaji msaada kuhusu mpango wa StationeryPro${shopName ? ' (' + shopName + ')' : ''}.`);
  const links = [
    waNum ? `<a class="btn btn-secondary btn-sm" target="_blank" rel="noopener" href="https://wa.me/${waNum}?text=${msg}">WhatsApp</a>` : '',
    sys.support_email ? `<a class="btn btn-secondary btn-sm" href="mailto:${esc(sys.support_email)}?subject=${encodeURIComponent('Msaada wa StationeryPro')}">Email</a>` : ''
  ].join(' ');

  return section('Mpango na Usajili', `
    <div class="ui-summary">
      <div class="ui-summary-row"><span>Mpango</span><strong>${esc(PLAN_LABELS[me.plan] || me.plan || '-')}</strong></div>
      <div class="ui-summary-row"><span>Hali</span><strong>${status}</strong></div>
      <div class="ui-summary-row"><span>Tarehe ya mwisho</span><strong>${exp ? fmtDate(exp) : 'Hakuna (bila mwisho)'}</strong></div>
    </div>
    ${links ? `<p class="muted">Kuongeza muda au kupata msaada:</p><div class="ui-toolbar">${links}</div>` : ''}`);
}

export async function renderSettings(root, user, profile) {
  ensureSharedStyles();
  const isDeveloper = user.email === DEVELOPER_EMAIL;
  const kind = isDeveloper ? 'developer' : profile.role === 'owner' ? 'owner' : 'staff';
  const roleLabel = { developer: 'Developer', owner: 'Mmiliki (Owner)', staff: 'Mfanyakazi' }[kind];

  const { data: fresh } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const me = { ...profile, ...(fresh || {}) };

  let business = null;
  let shop = null;
  const sys = {};
  try {
    const r = await supabase.from('system_settings').select('key, value');
    (r.data || []).forEach((x) => { sys[x.key] = x.value; });
  } catch (e) { /* si lazima */ }

  if (kind === 'owner') {
    const r = await supabase.from('business_settings').select('*').eq('owner_id', user.id).maybeSingle();
    business = r.data;
  } else if (kind === 'staff' && me.owner_id) {
    try {
      const r = await supabase.from('business_settings').select('business_name, business_phone, business_address').eq('owner_id', me.owner_id).maybeSingle();
      shop = r.data;
    } catch (e) { /* inaweza kuzuiwa na ruhusa */ }
  }

  let html = '';

  if (kind === 'owner') {
    html += accountSection(me, user, roleLabel);
    html += section('Taarifa za Biashara', `
      <form id="business-form">
        <div class="form-grid">
          <div class="form-group"><label>Jina la Biashara</label><input type="text" name="business_name" value="${esc(business?.business_name || '')}" /></div>
          <div class="form-group"><label>Simu ya Biashara</label><input type="tel" name="business_phone" value="${esc(business?.business_phone || '')}" /></div>
          <div class="form-group"><label>Anuani</label><input type="text" name="business_address" value="${esc(business?.business_address || '')}" /></div>
          <div class="form-group"><label>Currency</label><input type="text" name="currency" value="${esc(business?.currency || 'TZS')}" /></div>
          <div class="form-group"><label>VAT chaguo-msingi (%)</label><input type="number" name="vat_percent" min="0" max="100" step="0.1" value="${Number(business?.vat_percent) || 0}" /></div>
          <div class="form-group"><label>Maandishi ya chini ya risiti</label><input type="text" name="receipt_footer" value="${esc(business?.receipt_footer || '')}" placeholder="Mfano: Asante, karibu tena" /></div>
        </div>
        <div id="business-message" class="form-message" style="display: none;"></div>
        <button type="submit" class="btn btn-primary">Hifadhi</button>
      </form>`, 'Taarifa hizi zinatumika kwenye risiti za POS. VAT chaguo-msingi inajaa yenyewe kwenye mauzo mapya.');
    html += planSection(me, sys, business?.business_name || '');
    html += passwordSection();
    html += darkSection(me);
    html += section('Backup', `
      <div class="ui-toolbar">
        <button id="export-data" class="btn btn-primary">Export Data Yote (JSON)</button>
        <button id="export-products" class="btn btn-secondary">Export Bidhaa (CSV)</button>
      </div>
      <div id="backup-message" class="form-message" style="display: none;"></div>`, 'Nakala ya bidhaa, mauzo, malipo na matumizi ya duka lako. Ihifadhi mahali salama.');
  } else if (kind === 'staff') {
    html += accountSection(me, user, roleLabel);
    html += section('Duka Lako', `
      <div class="ui-summary">
        <div class="ui-summary-row"><span>Jina la duka</span><strong>${esc(shop?.business_name || '-')}</strong></div>
        <div class="ui-summary-row"><span>Simu</span><strong>${esc(shop?.business_phone || '-')}</strong></div>
        <div class="ui-summary-row"><span>Anuani</span><strong>${esc(shop?.business_address || '-')}</strong></div>
      </div>
      <p class="muted">Taarifa za duka zinabadilishwa na mmiliki pekee.</p>`);
    html += passwordSection();
    html += darkSection(me);
  } else {
    html += accountSection(me, user, roleLabel);
    html += section('Mipangilio ya Mfumo', `
      <form id="system-form">
        <div class="form-grid">
          <div class="form-group"><label>Siku za majaribio (mpango wa Majaribio)</label><input type="number" name="trial_days" min="1" value="${esc(sys.trial_days || '14')}" /></div>
          <div class="form-group"><label>WhatsApp ya msaada</label><input type="tel" name="support_whatsapp" value="${esc(sys.support_whatsapp || '')}" placeholder="0712345678" /></div>
          <div class="form-group"><label>Simu ya msaada</label><input type="tel" name="support_phone" value="${esc(sys.support_phone || '')}" /></div>
          <div class="form-group"><label>Email ya msaada</label><input type="email" name="support_email" value="${esc(sys.support_email || '')}" /></div>
        </div>
        <div id="system-message" class="form-message" style="display: none;"></div>
        <button type="submit" class="btn btn-primary">Hifadhi Mipangilio</button>
      </form>`, 'Mawasiliano ya msaada yanaonekana kwa owners kwenye Settings zao. Siku za majaribio zinajaa wakati wa kupitisha ombi.');
    html += section('Ukaguzi wa Mfumo', `
      <button id="run-checks" class="btn btn-secondary">Endesha Ukaguzi</button>
      <div id="checks-result" style="margin-top: 14px;"></div>`, 'Unaonyesha kama kila hatua ya SQL imefanyika kwenye database.');
    html += passwordSection();
    html += darkSection(me);
    html += section('Backup ya Mfumo', `
      <div class="ui-toolbar">
        <button id="export-owners-json" class="btn btn-primary">Export Wateja (JSON)</button>
      </div>
      <div id="backup-message" class="form-message" style="display: none;"></div>`, 'Orodha ya akaunti zote na taarifa za maduka yao.');
  }

  root.innerHTML = `<div class="settings-container"><div class="page-header"><h1>Settings</h1></div>${html}</div>`;
  document.body.classList.toggle('dark-mode', !!me.dark_mode);

  /* ---------- Picha ---------- */
  byId('avatar-btn')?.addEventListener('click', () => byId('avatar-input').click());
  byId('avatar-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2097152) return flash('avatar-message', 'Picha ni kubwa sana (zaidi ya 2MB).');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const name = `${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(name, file);
    if (error) return flash('avatar-message', error.message);
    const { data } = supabase.storage.from('avatars').getPublicUrl(name);
    const { error: upErr } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    if (upErr) return flash('avatar-message', upErr.message);
    byId('profile-preview').src = data.publicUrl;
    flash('avatar-message', 'Picha imesasishwa.', true);
  });

  /* ---------- Taarifa binafsi ---------- */
  byId('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const { error } = await supabase.from('profiles')
      .update({ full_name: form.full_name.value.trim(), phone: form.phone.value.trim() })
      .eq('id', user.id);
    if (error) return flash('profile-message', error.message);
    flash('profile-message', 'Taarifa zimehifadhiwa.', true);
  });

  /* ---------- Nenosiri ---------- */
  byId('password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.new_password.value !== form.confirm_password.value) return flash('password-message', 'Nenosiri hazilingani.');
    if (form.new_password.value.length < 6) return flash('password-message', 'Nenosiri liwe na angalau herufi 6.');
    const { error } = await supabase.auth.updateUser({ password: form.new_password.value });
    if (error) return flash('password-message', error.message);
    flash('password-message', 'Nenosiri limebadilishwa.', true);
    form.reset();
  });

  /* ---------- Dark mode ---------- */
  byId('dark-mode-toggle')?.addEventListener('change', async (e) => {
    document.body.classList.toggle('dark-mode', e.target.checked);
    await supabase.from('profiles').update({ dark_mode: e.target.checked }).eq('id', user.id);
  });

  /* ---------- Taarifa za biashara ---------- */
  byId('business-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const core = {
      owner_id: user.id,
      business_name: form.business_name.value.trim(),
      business_phone: form.business_phone.value.trim(),
      business_address: form.business_address.value.trim(),
      currency: form.currency.value.trim() || 'TZS'
    };
    const extra = {
      vat_percent: Math.min(Math.max(parseFloat(form.vat_percent.value) || 0, 0), 100),
      receipt_footer: form.receipt_footer.value.trim() || null
    };
    let { error } = await supabase.from('business_settings').upsert({ ...core, ...extra }, { onConflict: 'owner_id' });
    if (error && /column|schema cache/i.test(error.message)) {
      ({ error } = await supabase.from('business_settings').upsert(core, { onConflict: 'owner_id' }));
      if (!error) return flash('business-message', 'Imehifadhiwa, lakini VAT na maandishi ya risiti hayakuhifadhiwa. Endesha SQL ya Hatua 1.');
    }
    if (error) return flash('business-message', error.message);
    flash('business-message', 'Imehifadhiwa.', true);
  });

  /* ---------- Backup ya owner ---------- */
  byId('export-data')?.addEventListener('click', async () => {
    const btn = byId('export-data');
    btn.disabled = true;
    flash('backup-message', 'Inakusanya data...', true);
    try {
      const [products, sales, expenses, biz] = await Promise.all([
        fetchAll((a, b) => supabase.from('products').select('*').order('created_at').range(a, b)),
        fetchAll((a, b) => supabase.from('sales').select('*').order('created_at', { ascending: false }).range(a, b)),
        fetchAll((a, b) => supabase.from('expenses').select('*').order('created_at').range(a, b)),
        supabase.from('business_settings').select('*').eq('owner_id', user.id)
      ]);
      const ids = sales.map((s) => s.id);
      const [items, payments] = await Promise.all([
        fetchByIds('sale_items', 'sale_id', ids),
        fetchByIds('payments', 'sale_id', ids)
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        business_settings: biz.data || [],
        products, sales, sale_items: items, payments, expenses
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flash('backup-message', `Imekamilika: bidhaa ${products.length}, mauzo ${sales.length}, matumizi ${expenses.length}.`, true);
    } catch (error) {
      flash('backup-message', 'Imeshindikana: ' + error.message);
    } finally {
      btn.disabled = false;
    }
  });

  byId('export-products')?.addEventListener('click', async () => {
    try {
      const products = await fetchAll((a, b) => supabase.from('products').select('*').order('created_at').range(a, b));
      downloadCsv(
        `bidhaa_${new Date().toISOString().split('T')[0]}.csv`,
        ['Jina', 'SKU', 'Aina', 'Bei ya Kununua', 'Bei ya Kuuza', 'Stock', 'Jumla Iliyopokelewa'],
        products.map((p) => [p.name, p.sku || '', p.is_service ? 'Huduma' : 'Bidhaa', p.cost_price, p.selling_price, p.stock_quantity, p.initial_stock || 0])
      );
    } catch (error) {
      flash('backup-message', 'Imeshindikana: ' + error.message);
    }
  });

  /* ---------- Developer: mipangilio ya mfumo ---------- */
  byId('system-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const rows = ['trial_days', 'support_whatsapp', 'support_phone', 'support_email'].map((key) => ({
      key, value: String(f[key].value || '').trim(), updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('system_settings').upsert(rows, { onConflict: 'key' });
    if (error) return flash('system-message', /relation|schema cache/i.test(error.message) ? 'Endesha SQL ya Hatua 1 kwanza.' : error.message);
    flash('system-message', 'Mipangilio imehifadhiwa.', true);
  });

  /* ---------- Developer: ukaguzi wa mfumo ---------- */
  byId('run-checks')?.addEventListener('click', async () => {
    const out = byId('checks-result');
    out.innerHTML = '<p class="muted">Inakagua...</p>';
    const checks = [
      ['Mpango na usajili (profiles)', () => supabase.from('profiles').select('plan, plan_expires_at, rejected_at, developer_note').limit(1)],
      ['Arifa (notifications)', () => supabase.from('notifications').select('id').limit(1)],
      ['Mipangilio ya mfumo (system_settings)', () => supabase.from('system_settings').select('key').limit(1)],
      ['Takwimu za developer (developer_owner_stats)', () => supabase.rpc('developer_owner_stats')],
      ['Kufuta akaunti kwa usalama (developer_delete_user)', async () => {
        const r = await supabase.rpc('developer_delete_user', { p_user_id: '00000000-0000-0000-0000-000000000000' });
        return r.error && r.error.code === 'PGRST202' ? r : { error: null };
      }],
      ['VAT kwenye mauzo (sales)', () => supabase.from('sales').select('vat_percent, vat_amount').limit(1)],
      ['VAT na maandishi ya risiti (business_settings)', () => supabase.from('business_settings').select('vat_percent, receipt_footer').limit(1)],
      ['Huduma kwenye bidhaa (is_service)', () => supabase.from('products').select('is_service').limit(1)],
      ['Kujumlisha stock (add_product_stock)', async () => {
        const r = await supabase.rpc('add_product_stock', { p_product_id: '00000000-0000-0000-0000-000000000000', p_qty: 0 });
        return r.error && r.error.code === 'PGRST202' ? r : { error: null };
      }]
    ];
    const rows = [];
    for (const [name, run] of checks) {
      let ok = false;
      let detail = '';
      try {
        const r = await run();
        ok = !r.error;
        detail = r.error ? r.error.message : '';
      } catch (err) {
        detail = err.message;
      }
      rows.push([esc(name), ok ? '<span class="badge badge-success">Sawa</span>' : '<span class="badge badge-danger">Haipo</span>', esc(detail)]);
    }
    out.innerHTML = table(['Kipengele', 'Hali', 'Maelezo'], rows);
  });

  /* ---------- Developer: backup ya wateja ---------- */
  byId('export-owners-json')?.addEventListener('click', async () => {
    try {
      const [profiles, shops] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('business_settings').select('*')
      ]);
      if (profiles.error) throw profiles.error;
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), profiles: profiles.data, business_settings: shops.data || [] }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wateja_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flash('backup-message', 'Imekamilika.', true);
    } catch (error) {
      flash('backup-message', 'Imeshindikana: ' + error.message);
    }
  });
}