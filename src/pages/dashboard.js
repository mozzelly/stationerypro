import { supabase } from '../lib/supabase.js';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide';

export async function renderDashboard(root, user, profile) {
  root.innerHTML = `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Karibu, ${profile.full_name || 'Mmiliki'} 👋</h1>
          <p class="dashboard-subtitle">Hapa kuna muhtasari wa biashara yako leo</p>
        </div>
        <div class="dashboard-date">
          <span id="current-date"></span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #dbeafe; color: #1e40af;">
            <i data-lucide="dollar-sign"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Mauzo ya Leo</p>
            <h3 class="stat-value" id="today-sales">TSh 0</h3>
            <span class="stat-change positive">
              <i data-lucide="arrow-up-right" style="width: 14px;"></i>
              <span id="sales-change">+0%</span>
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #dcfce7; color: #166534;">
            <i data-lucide="shopping-cart"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Idadi ya Mauzo</p>
            <h3 class="stat-value" id="today-transactions">0</h3>
            <span class="stat-change positive">
              <i data-lucide="arrow-up-right" style="width: 14px;"></i>
              <span>Leo</span>
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #fef3c7; color: #92400e;">
            <i data-lucide="package"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Bidhaa Zote</p>
            <h3 class="stat-value" id="total-products">0</h3>
            <span class="stat-change">
              <span>Jumla ya stock</span>
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #fee2e2; color: #991b1b;">
            <i data-lucide="alert-triangle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Stock Chini</p>
            <h3 class="stat-value" id="low-stock-count">0</h3>
            <span class="stat-change negative">
              <i data-lucide="arrow-down-right" style="width: 14px;"></i>
              <span>Inahitaji kuagizwa</span>
            </span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-panel">
          <div class="panel-header">
            <h3><i data-lucide="trending-up" style="width: 18px;"></i> Mauzo ya Hivi Karibuni</h3>
            <a href="#sales" class="btn-link">Tazama Zote →</a>
          </div>
          <div id="recent-sales">
            <div class="empty-state">Inapakia...</div>
          </div>
        </div>

        <div class="dashboard-panel">
          <div class="panel-header">
            <h3><i data-lucide="alert-triangle" style="width: 18px;"></i> Bidhaa zenye Stock Chini</h3>
            <a href="#products" class="btn-link">Tazama Zote →</a>
          </div>
          <div id="low-stock-products">
            <div class="empty-state">Inapakia...</div>
          </div>
        </div>
      </div>

      <div class="quick-actions-panel">
        <h3><i data-lucide="zap" style="width: 18px;"></i> Vitendo vya Haraka</h3>
        <div class="quick-actions-grid">
          <a href="#pos" class="quick-action">
            <i data-lucide="shopping-cart"></i>
            <span>Fanya Mauzo</span>
          </a>
          <a href="#products" class="quick-action">
            <i data-lucide="plus"></i>
            <span>Ongeza Bidhaa</span>
          </a>
          <a href="#reports" class="quick-action">
            <i data-lucide="file-text"></i>
            <span>Ripoti</span>
          </a>
          <a href="#users" class="quick-action">
            <i data-lucide="users"></i>
            <span>Watumiaji</span>
          </a>
        </div>
      </div>
    </div>
  `;

  // Set current date
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('sw-TZ', options);

  // Load data
  await loadDashboardData();
  
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function loadDashboardData() {
  try {
    // Today's sales
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySales, error: salesError } = await supabase
      .from('sales')
      .select('total, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .eq('status', 'completed');

    if (!salesError && todaySales) {
      const totalSales = todaySales.reduce((sum, s) => sum + parseFloat(s.total), 0);
      document.getElementById('today-sales').textContent = window.money(totalSales);
      document.getElementById('today-transactions').textContent = todaySales.length;
    }

    // Total products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, stock_quantity, reorder_level')
      .eq('is_active', true);

    if (!productsError && products) {
      document.getElementById('total-products').textContent = products.length;
      
      const lowStock = products.filter(p => p.stock_quantity <= p.reorder_level);
      document.getElementById('low-stock-count').textContent = lowStock.length;

      // Show low stock products
      const lowStockContainer = document.getElementById('low-stock-products');
      if (lowStock.length === 0) {
        lowStockContainer.innerHTML = '<div class="empty-state">Hakuna bidhaa zenye stock chini ✅</div>';
      } else {
        lowStockContainer.innerHTML = lowStock.slice(0, 5).map(p => `
          <div class="low-stock-item">
            <div class="low-stock-info">
              <strong>${p.name || 'Bidhaa'}</strong>
              <small>Stock: ${p.stock_quantity} / Min: ${p.reorder_level}</small>
            </div>
            <span class="badge badge-warning">Chini</span>
          </div>
        `).join('');
      }
    }

    // Recent sales
    const { data: recentSales, error: recentError } = await supabase
      .from('sales')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentContainer = document.getElementById('recent-sales');
    if (!recentError && recentSales && recentSales.length > 0) {
      recentContainer.innerHTML = recentSales.map(s => `
        <div class="recent-sale-item">
          <div class="recent-sale-info">
            <strong>${s.receipt_number}</strong>
            <small>${new Date(s.created_at).toLocaleString('sw-TZ')}</small>
          </div>
          <div class="recent-sale-amount">
            <strong>${window.money(s.total)}</strong>
            <span class="badge ${s.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}">
              ${s.payment_status === 'paid' ? 'Imelipwa' : 'Inasubiri'}
            </span>
          </div>
        </div>
      `).join('');
    } else {
      recentContainer.innerHTML = '<div class="empty-state">Hakuna mauzo ya hivi karibuni</div>';
    }

  } catch (error) {
    console.error('Dashboard error:', error);
  }
}