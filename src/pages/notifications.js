import { supabase } from '../lib/supabase.js';

export async function renderNotifications(root, user, profile) {
  root.innerHTML = `
    <div class="notifications-container">
      <div class="page-header">
        <h1>Arifa (Notifications)</h1>
        <button id="mark-all-read" class="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Weka Zote Zimesomwa
        </button>
      </div>

      <div id="notifications-list">
        <div class="empty-state">Inapakia arifa...</div>
      </div>
    </div>
  `;

  await loadNotifications();

  document.getElementById('mark-all-read').addEventListener('click', markAllAsRead);
}

async function loadNotifications() {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error loading notifications:', error);
    return;
  }

  const list = document.getElementById('notifications-list');

  if (!notifications || notifications.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 60px 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--muted); margin-bottom: 16px;"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        <h3>Hakuna arifa mpya</h3>
        <p>Utapokea arifa hapa wakati stock inapokuwa chini.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = notifications.map(notif => {
    const icon = notif.type === 'warning' ? '⚠️' : notif.type === 'success' ? '✅' : notif.type === 'error' ? '❌' : 'ℹ️';
    const bgColor = notif.type === 'warning' ? '#fef3c7' : notif.type === 'success' ? '#dcfce7' : notif.type === 'error' ? '#fee2e2' : '#dbeafe';
    const borderColor = notif.type === 'warning' ? '#f59e0b' : notif.type === 'success' ? '#10b981' : notif.type === 'error' ? '#ef4444' : '#3b82f6';

    return `
      <div class="notification-item ${!notif.is_read ? 'unread' : ''}" style="background: ${bgColor}; border-left: 4px solid ${borderColor};">
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <h4>${notif.title}</h4>
          <p>${notif.message}</p>
          <small class="text-muted">${new Date(notif.created_at).toLocaleString('sw-TZ')}</small>
        </div>
        ${!notif.is_read ? `
          <button class="btn btn-sm btn-secondary" onclick="markAsRead('${notif.id}')">
            Weka Imesomwa
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

window.markAsRead = async (id) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  loadNotifications();
};

async function markAllAsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  loadNotifications();
}