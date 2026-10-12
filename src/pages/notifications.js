import { supabase } from '../lib/supabase.js';

const DEVELOPER_EMAIL = 'mussaelly1235@gmail.com';

export async function renderNotifications(root, user, profile) {
  const isDeveloper = user.email === DEVELOPER_EMAIL;

  root.innerHTML = `
    <div class="page-header">
      <h1>Arifa (Notifications)</h1>
    </div>
    <div id="notifications-list" style="display: flex; flex-direction: column; gap: 16px;">
      <p class="muted">Inapakia arifa...</p>
    </div>
  `;

  const list = document.getElementById('notifications-list');

  try {
    if (isDeveloper) {
      // ==========================================
      // ARIFA ZA DEVELOPER (System Level)
      // ==========================================
      const { data: pendingOwners } = await supabase
        .from('profiles')
        .select('full_name, email, created_at')
        .eq('role', 'owner')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      const { count: totalOwners } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner').eq('is_approved', true);

      let html = '';
      
      if (pendingOwners && pendingOwners.length > 0) {
        html += `
          <div class="notice warning" style="border-left: 4px solid #f59e0b;">
            <h4>⚠️ Wamiliki ${pendingOwners.length} Wanasubiri Uthibitisho</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${pendingOwners.map(p => `<li><strong>${p.full_name}</strong> (${p.email}) - ${new Date(p.created_at).toLocaleDateString('sw-TZ')}</li>`).join('')}
            </ul>
            <a href="#developer" class="btn btn-sm btn-primary" style="margin-top: 10px;">Nenda Developer Dashboard</a>
          </div>
        `;
      }

      html += `
        <div class="notice info" style="border-left: 4px solid #3b82f6;">
          <h4>ℹ️ Hali ya Mfumo</h4>
          <p>Mfumo unafanya kazi vizuri. Jumla ya Wamiliki walioidhinishwa: <strong>${totalOwners || 0}</strong>.</p>
        </div>
      `;

      if (!pendingOwners || pendingOwners.length === 0) {
        html += `
          <div class="empty-state" style="padding: 40px 20px; text-align: center;">
            <h3>Hakuna arifa mpya za mfumo</h3>
            <p>Kila kitu kiko sawa. Hakuna maombi mapya ya wamiliki.</p>
          </div>
        `;
      }

      list.innerHTML = html;

    } else if (profile.role === 'owner') {
      // ==========================================
      // ARIFA ZA OWNER (Business Level)
      // ==========================================
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, stock_quantity, reorder_level')
        .lte('stock_quantity', 'reorder_level')
        .order('stock_quantity', { ascending: true })
        .limit(10);

      let html = '';

      if (lowStockProducts && lowStockProducts.length > 0) {
        html += `
          <div class="notice error" style="border-left: 4px solid #ef4444;">
            <h4>🚨 Bidhaa ${lowStockProducts.length} Zina Stock Chini Sana!</h4>
            <p>Tafadhali ziangalie na kuagiza tena haraka ili usipoteze mauzo.</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${lowStockProducts.map(p => `<li><strong>${p.name}</strong>: Stock sasa ni <strong>${p.stock_quantity}</strong> (Alert: ${p.reorder_level})</li>`).join('')}
            </ul>
            <a href="#products" class="btn btn-sm btn-primary" style="margin-top: 10px;">Nenda Bidhaa na Stock</a>
          </div>
        `;
      }

      html += `
        <div class="notice success" style="border-left: 4px solid #22c55e;">
          <h4>✅ Mfumo wa Biashara</h4>
          <p>Rekodi zote zimehifadhiwa vizuri. Endelea kufuatilia mauzo na matumizi.</p>
        </div>
      `;

      if (!lowStockProducts || lowStockProducts.length === 0) {
        html += `
          <div class="empty-state" style="padding: 40px 20px; text-align: center;">
            <h3>Hakuna arifa za duka</h3>
            <p>Stock zote ziko vizuri. Hakuna bidhaa zilizoisha.</p>
          </div>
        `;
      }

      list.innerHTML = html;

    } else {
      // ==========================================
      // ARIFA ZA CASHIER (Operational Level - Simple)
      // ==========================================
      list.innerHTML = `
        <div class="empty-state" style="padding: 60px 20px; text-align: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--muted); margin-bottom: 16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h3>Hakuna arifa mpya</h3>
          <p>Endelea na kazi nzuri! Utaarifiwa hapa ikiwa kuna maelekezo maalum kutoka kwa mmiliki.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    list.innerHTML = `<div class="notice error">Hitilafu: ${error.message}</div>`;
  }
}