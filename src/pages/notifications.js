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
      // ARIFA ZA DEVELOPER (System Level ONLY)
      // Hakuna mauzo wala stock za duka lolote
      // ==========================================
      const { data: pendingOwners } = await supabase
        .from('profiles')
        .select('full_name, email, created_at')
        .eq('role', 'owner')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      let html = '';
      
      if (pendingOwners && pendingOwners.length > 0) {
        html += `
          <div class="notice warning" style="border-left: 4px solid #f59e0b; padding: 16px; background: #fffbeb;">
            <h4>⚠️ Wamiliki ${pendingOwners.length} Wanasubiri Uthibitisho</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${pendingOwners.map(p => `<li><strong>${p.full_name}</strong> (${p.email}) - ${new Date(p.created_at).toLocaleDateString('sw-TZ')}</li>`).join('')}
            </ul>
            <a href="#developer" class="btn btn-sm btn-primary" style="margin-top: 10px; display:inline-block;">Nenda Developer Dashboard</a>
          </div>
        `;
      } else {
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
      // ARIFA ZA OWNER (Business Level - ZAKE TU)
      // ==========================================
      
      // 1. Low Stock Alert (Bidhaa za duka lake tu)
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, stock_quantity, reorder_level')
        .eq('owner_id', user.id) // MUHIMU: Filter kwa owner huyu tu
        .lte('stock_quantity', 'reorder_level')
        .order('stock_quantity', { ascending: true })
        .limit(5);

      // 2. Mauzo ya Leo (Kama table ina owner_id)
      let todaySalesHtml = '';
      try {
        const { data: recentSales, count: todaySalesCount } = await supabase
          .from('sales')
          .select('id, total_amount, created_at', { count: 'exact' })
          .eq('owner_id', user.id)
          .gte('created_at', new Date().toISOString().split('T')[0]) // Mauzo ya leo tu
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentSales && recentSales.length > 0) {
          const formatter = new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS' });
          todaySalesHtml = `
            <div class="notice success" style="border-left: 4px solid #22c55e; padding: 16px; background: #f0fdf4;">
              <h4>💰 Mauzo ya Leo</h4>
              <p>Umefanya mauzo <strong>${todaySalesCount || 0}</strong> leo.</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${recentSales.map(s => `<li>Mauzo: ${formatter.format(s.total_amount)} - ${new Date(s.created_at).toLocaleTimeString('sw-TZ')}</li>`).join('')}
              </ul>
              <a href="#sales" class="btn btn-sm btn-primary" style="margin-top: 10px; display:inline-block;">Angalia Mauzo Yote</a>
            </div>
          `;
        }
      } catch (e) {
        // Ikiwa column 'owner_id' bado haipo kwenye sales, itapita hapa bila kuvunja mfumo
        console.log('Sales notification skipped:', e);
      }

      let html = '';

      if (lowStockProducts && lowStockProducts.length > 0) {
        html += `
          <div class="notice error" style="border-left: 4px solid #ef4444; padding: 16px; background: #fef2f2;">
            <h4>🚨 Bidhaa ${lowStockProducts.length} Zina Stock Chini!</h4>
            <p>Tafadhali ziangalie na kuagiza tena haraka.</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${lowStockProducts.map(p => `<li><strong>${p.name}</strong>: Stock sasa ni <strong>${p.stock_quantity}</strong></li>`).join('')}
            </ul>
            <a href="#products" class="btn btn-sm btn-primary" style="margin-top: 10px; display:inline-block;">Angalia Stock</a>
          </div>
        `;
      }

      html += todaySalesHtml;

      if ((!lowStockProducts || lowStockProducts.length === 0) && !todaySalesHtml) {
        html += `
          <div class="empty-state" style="padding: 40px 20px; text-align: center;">
            <h3>Hakuna arifa mpya za duka</h3>
            <p>Kila kitu kiko sawa. Stock zote ziko vizuri.</p>
          </div>
        `;
      }

      list.innerHTML = html;

    } else {
      // ==========================================
      // ARIFA ZA CASHIER (Operational Level)
      // ==========================================
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, stock_quantity')
        .eq('owner_id', profile.owner_id || user.id)
        .lte('stock_quantity', 5) // Alert rahisi ya stock chini
        .limit(3);

      let html = '';
      if (lowStockProducts && lowStockProducts.length > 0) {
        html += `
          <div class="notice warning" style="border-left: 4px solid #f59e0b; padding: 16px; background: #fffbeb;">
            <h4>⚠️ Tahadhari ya Stock</h4>
            <p>Bidhaa zifuatazo zina stock chini, zielekeze mmiliki:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${lowStockProducts.map(p => `<li><strong>${p.name}</strong> (Stock: ${p.stock_quantity})</li>`).join('')}
            </ul>
          </div>
        `;
      } else {
        html = `
          <div class="empty-state" style="padding: 60px 20px; text-align: center;">
            <h3>Hakuna arifa mpya</h3>
            <p>Endelea na kazi nzuri! Mfumo uko sawa.</p>
          </div>
        `;
      }
      list.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
    list.innerHTML = `<div class="notice error">Hitilafu: ${error.message}</div>`;
  }
}