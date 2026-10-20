import { supabase } from '../lib/supabase.js';

export async function renderCategories(root, user, profile) {
  root.innerHTML = `
    <section class="categories-page">
      <header class="cat-heading">
        <div>
          <span class="cat-eyebrow">STATIONERYPRO / BIDHAA</span>
          <h1>Kategoria za Bidhaa</h1>
          <p>Simamia na panga bidhaa zako kwa urahisi.</p>
        </div>
        <button id="add-category-btn" class="cat-btn cat-btn-primary" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Ongeza Kategoria
        </button>
      </header>

      <div class="cat-summary">
        <div class="cat-summary-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 10h16"/></svg>
        </div>
        <div>
          <span class="cat-summary-label">Jumla ya kategoria</span>
          <strong id="category-total">0</strong>
        </div>
        <span class="cat-summary-caption">Kategoria zilizosajiliwa kwenye mfumo</span>
      </div>

      <div class="cat-panel">
        <div class="cat-panel-header">
          <div>
            <h2>Kategoria zote</h2>
            <p>Orodha ya kategoria za bidhaa zako.</p>
          </div>
          <label class="cat-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
            <input id="category-search" type="search" placeholder="Tafuta kategoria..." />
          </label>
        </div>

        <div id="categories-feedback" class="cat-feedback" hidden></div>

        <div class="cat-table-wrap">
          <table class="cat-table">
            <thead>
              <tr>
                <th>Kategoria</th>
                <th>Maelezo</th>
                <th>Bidhaa</th>
                <th>Aliyeongeza</th>
                <th>Tarehe</th>
                <th>Vitendo</th>
              </tr>
            </thead>
            <tbody id="categories-body">
              <tr><td colspan="6"><div class="cat-loading">Inapakia kategoria...</div></td></tr>
            </tbody>
          </table>
        </div>
        <div class="cat-mobile-hint">Telezesha jedwali pembeni kuona taarifa zote.</div>
      </div>

      <div id="category-modal" class="cat-overlay" style="display:none" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <div class="cat-modal">
          <div class="cat-modal-header">
            <div>
              <span class="cat-modal-eyebrow">TAARIFA ZA BIDHAA</span>
              <h2 id="category-modal-title">Ongeza Kategoria</h2>
              <p>Jaza taarifa za kategoria hapa chini.</p>
            </div>
            <button id="close-modal" class="cat-close" type="button" aria-label="Funga">&times;</button>
          </div>

          <form id="category-form">
            <div class="cat-modal-body">
              <div class="cat-field">
                <label for="category-name">Jina la kategoria <span>*</span></label>
                <input id="category-name" type="text" name="name" required maxlength="100" placeholder="Mfano: Madaftari" />
              </div>
              <div class="cat-field">
                <label for="category-description">Maelezo <small>(Hiari)</small></label>
                <textarea id="category-description" name="description" rows="4" maxlength="500" placeholder="Andika maelezo mafupi ya kategoria..."></textarea>
              </div>
              <div id="form-message" class="cat-form-message" hidden></div>
            </div>
            <div class="cat-modal-footer">
              <button type="button" id="cancel-btn" class="cat-btn cat-btn-light">Ghairi</button>
              <button type="submit" id="save-category-btn" class="cat-btn cat-btn-primary">Hifadhi Kategoria</button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <style>
      .categories-page {
        --cat-blue: #2455a4;
        --cat-blue-dark: #183f80;
        --cat-blue-light: #edf4ff;
        --cat-ink: #18263d;
        --cat-muted: #78869a;
        --cat-border: #e5eaf2;
        color: var(--cat-ink);
        width: 100%;
        min-width: 0;
        font-family: inherit;
      }

      .categories-page * { box-sizing: border-box; }

      .cat-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin-bottom: 25px;
      }

      .cat-eyebrow {
        display: block;
        color: var(--cat-blue);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
        margin-bottom: 8px;
      }

      .cat-heading h1 {
        margin: 0;
        font-size: clamp(24px, 3vw, 31px);
        font-weight: 750;
        letter-spacing: -.8px;
        line-height: 1.25;
      }

      .cat-heading p {
        margin: 9px 0 0;
        color: var(--cat-muted);
        font-size: 13px;
        line-height: 1.6;
      }

      .cat-btn {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 9px;
        min-height: 42px;
        padding: 10px 16px;
        border: 1px solid transparent;
        border-radius: 9px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: background .18s, box-shadow .18s, transform .18s;
      }

      .cat-btn svg {
        width: 18px;
        height: 18px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
      }

      .cat-btn-primary {
        color: #fff;
        background: var(--cat-blue);
        box-shadow: 0 4px 12px #2455a420;
      }

      .cat-btn-primary:hover {
        background: var(--cat-blue-dark);
        box-shadow: 0 6px 16px #2455a433;
        transform: translateY(-1px);
      }

      .cat-btn-primary:disabled {
        opacity: .65;
        cursor: wait;
        transform: none;
      }

      .cat-btn-light {
        background: #fff;
        color: #526177;
        border-color: #dce3ed;
      }

      .cat-btn-light:hover { background: #f5f7fb; }

      .cat-summary {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 19px 22px;
        margin-bottom: 22px;
        background: linear-gradient(110deg, #fff, #f4f7ff);
        border: 1px solid #e3eaf6;
        border-radius: 14px;
      }

      .cat-summary-icon {
        display: grid;
        place-items: center;
        flex: 0 0 47px;
        width: 47px;
        height: 47px;
        color: var(--cat-blue);
        background: #e8f0ff;
        border: 1px solid #dce8ff;
        border-radius: 12px;
      }

      .cat-summary-icon svg,
      .cat-search svg {
        width: 21px;
        height: 21px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .cat-summary-label {
        display: block;
        margin-bottom: 4px;
        color: var(--cat-muted);
        font-size: 12px;
      }

      .cat-summary strong {
        font-size: 25px;
        font-weight: 800;
      }

      .cat-summary-caption {
        margin-left: auto;
        color: #8793a5;
        font-size: 12px;
      }

      .cat-panel {
        overflow: hidden;
        background: #fff;
        border: 1px solid var(--cat-border);
        border-radius: 14px;
        box-shadow: 0 5px 22px #182b4607;
      }

      .cat-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
        padding: 21px 22px;
        border-bottom: 1px solid var(--cat-border);
      }

      .cat-panel-header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 750;
      }

      .cat-panel-header p {
        margin: 6px 0 0;
        color: var(--cat-muted);
        font-size: 12px;
      }

      .cat-search {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 250px;
        max-width: 100%;
        min-height: 39px;
        padding: 0 12px;
        color: #8793a5;
        background: #fff;
        border: 1px solid #dfe5ee;
        border-radius: 9px;
      }

      .cat-search:focus-within {
        border-color: #8aafe9;
        box-shadow: 0 0 0 3px #2455a410;
      }

      .cat-search svg { flex: 0 0 17px; width: 17px; height: 17px; }

      .cat-search input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--cat-ink);
        font: inherit;
        font-size: 12px;
      }

      .cat-search input::placeholder { color: #9aa5b5; }

      .cat-table-wrap { width: 100%; overflow-x: auto; }

      .cat-table {
        width: 100%;
        min-width: 790px;
        border-collapse: separate;
        border-spacing: 0;
        text-align: left;
      }

      .cat-table th {
        padding: 14px 16px;
        color: #758399;
        background: #f8faff;
        border-bottom: 1px solid var(--cat-border);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .5px;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .cat-table td {
        padding: 15px 16px;
        color: #59677b;
        border-bottom: 1px solid #edf0f5;
        font-size: 12px;
        vertical-align: middle;
      }

      .cat-table tbody tr:last-child td { border-bottom: 0; }
      .cat-table tbody tr { transition: background .15s; }
      .cat-table tbody tr:hover { background: #f9fbff; }

      .cat-name-cell {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 145px;
      }

      .cat-name-icon {
        display: grid;
        place-items: center;
        flex: 0 0 34px;
        width: 34px;
        height: 34px;
        color: var(--cat-blue);
        background: var(--cat-blue-light);
        border-radius: 9px;
      }

      .cat-name-icon svg {
        width: 17px;
        height: 17px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .cat-name-text {
        color: #293950;
        font-size: 12px;
        font-weight: 750;
        overflow-wrap: anywhere;
      }

      .cat-description {
        display: block;
        max-width: 205px;
        overflow: hidden;
        color: #78869a;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cat-count {
        display: inline-flex;
        justify-content: center;
        min-width: 68px;
        padding: 6px 9px;
        color: #2455a4;
        background: #edf4ff;
        border: 1px solid #e0ebff;
        border-radius: 7px;
        font-size: 11px;
        font-weight: 750;
        white-space: nowrap;
      }

      .cat-date { white-space: nowrap; }

      .cat-actions { display: flex; align-items: center; gap: 7px; }

      .cat-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 31px;
        padding: 6px 9px;
        color: #526177;
        background: #fff;
        border: 1px solid #dfe5ee;
        border-radius: 7px;
        font: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        transition: background .15s, border-color .15s, color .15s;
      }

      .cat-action-btn svg {
        width: 14px;
        height: 14px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .cat-action-btn:hover {
        color: var(--cat-blue);
        background: #f0f5ff;
        border-color: #c9dcff;
      }

      .cat-action-btn.cat-delete:hover {
        color: #c43d3d;
        background: #fff1f1;
        border-color: #ffd5d5;
      }

      .cat-loading, .cat-empty {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 135px;
        color: #7b8799;
        font-size: 12px;
      }

      .cat-empty { flex-direction: column; gap: 8px; text-align: center; padding: 20px; }
      .cat-empty strong { color: #40516a; font-size: 13px; }
      .cat-empty span { color: #8793a5; }

      .cat-feedback {
        margin: 14px 18px 0;
        padding: 11px 13px;
        border-radius: 8px;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .cat-feedback.error, .cat-form-message.error {
        color: #a42f35;
        background: #fff0f0;
        border: 1px solid #ffd9d9;
      }

      .cat-overlay {
        position: fixed;
        z-index: 1000;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgb(16 28 48 / 54%);
        backdrop-filter: blur(4px);
      }

      .cat-modal {
        width: min(100%, 480px);
        max-height: 90vh;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #e7ebf2;
        border-radius: 16px;
        box-shadow: 0 24px 75px #0c19353b;
        animation: cat-modal-in .18s ease-out;
      }

      @keyframes cat-modal-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .cat-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 15px;
        padding: 22px 23px;
        border-bottom: 1px solid #edf0f5;
      }

      .cat-modal-eyebrow {
        display: block;
        margin-bottom: 6px;
        color: var(--cat-blue);
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.2px;
      }

      .cat-modal-header h2 { margin: 0; font-size: 18px; font-weight: 750; }
      .cat-modal-header p { margin: 6px 0 0; color: #8190a4; font-size: 12px; }

      .cat-close {
        display: grid;
        place-items: center;
        flex: 0 0 33px;
        width: 33px;
        height: 33px;
        border: 0;
        border-radius: 8px;
        background: #f3f6fa;
        color: #738095;
        font-size: 24px;
        cursor: pointer;
      }

      .cat-close:hover { background: #e8eef7; color: #293b55; }

      .cat-modal-body { padding: 22px 23px 7px; }

      .cat-field { margin-bottom: 19px; }

      .cat-field label {
        display: block;
        margin-bottom: 8px;
        color: #35445b;
        font-size: 12px;
        font-weight: 750;
      }

      .cat-field label span { color: #d14343; }
      .cat-field label small { color: #8a96a8; font-weight: 500; }

      .cat-field input, .cat-field textarea {
        display: block;
        width: 100%;
        padding: 11px 12px;
        color: #1b2a41;
        background: #fff;
        border: 1px solid #dce3ed;
        border-radius: 9px;
        font: inherit;
        font-size: 13px;
        outline: 0;
        transition: border-color .16s, box-shadow .16s;
      }

      .cat-field input { height: 43px; }
      .cat-field textarea { min-height: 100px; resize: vertical; line-height: 1.6; }

      .cat-field input:focus, .cat-field textarea:focus {
        border-color: #7fa7e8;
        box-shadow: 0 0 0 3px #2455a412;
      }

      .cat-field input::placeholder, .cat-field textarea::placeholder { color: #a1abba; }

      .cat-form-message {
        margin-bottom: 13px;
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .cat-form-message.success {
        color: #176b48;
        background: #eaf8f0;
        border: 1px solid #c9efd9;
      }

      .cat-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        padding: 16px 23px 22px;
        border-top: 1px solid #edf0f5;
      }

      .categories-page button:focus-visible,
      .categories-page input:focus-visible,
      .categories-page textarea:focus-visible {
        outline: 3px solid #8db8ff;
        outline-offset: 2px;
      }

      .cat-mobile-hint {
        display: none;
        padding: 10px 15px;
        color: #8793a5;
        background: #fafbfe;
        border-top: 1px solid #edf0f5;
        font-size: 11px;
      }

      @media (max-width: 760px) {
        .cat-heading { align-items: flex-start; flex-direction: column; }
        .cat-heading .cat-btn { width: 100%; }
        .cat-summary { padding: 16px; }
        .cat-summary-caption { display: none; }
        .cat-panel-header { align-items: flex-start; flex-direction: column; padding: 17px; }
        .cat-search { width: 100%; }
        .cat-table { min-width: 790px; }
        .cat-mobile-hint { display: block; }
      }

      @media (max-width: 420px) {
        .cat-heading h1 { font-size: 24px; }
        .cat-heading p { font-size: 12px; }
        .cat-overlay { align-items: flex-end; padding: 0; }
        .cat-modal { width: 100%; max-height: 92vh; border-radius: 17px 17px 0 0; }
        .cat-modal-header { padding: 18px; }
        .cat-modal-body { padding: 19px 18px 5px; }
        .cat-modal-footer { padding: 14px 18px 20px; }
        .cat-modal-footer .cat-btn { flex: 1; }
      }

      @media (prefers-reduced-motion: reduce) {
        .categories-page *, .cat-modal { animation: none !important; transition: none !important; }
      }
    </style>
  `;

  const page = root.querySelector('.categories-page');
  const form = page.querySelector('#category-form');
  const searchInput = page.querySelector('#category-search');
  const modal = page.querySelector('#category-modal');
  let categoriesCache = [];

  page.querySelector('#add-category-btn').addEventListener('click', () => openModal());
  page.querySelector('#close-modal').addEventListener('click', closeModal);
  page.querySelector('#cancel-btn').addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && modal.style.display !== 'none') closeModal();
  };
  document.addEventListener('keydown', onKeyDown);

  searchInput.addEventListener('input', () => {
    renderCategoryRows(filterCategories(searchInput.value));
  });

  page.querySelector('#categories-body').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    if (button.dataset.action === 'edit') {
      await editCategory(button.dataset.id);
    } else if (button.dataset.action === 'delete') {
      await deleteCategory(button.dataset.id, button);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveCategory();
  });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function showFeedback(text, type = 'error') {
    const el = page.querySelector('#categories-feedback');
    el.textContent = text;
    el.className = `cat-feedback ${type}`;
    el.hidden = false;
  }

  function hideFeedback() {
    const el = page.querySelector('#categories-feedback');
    el.hidden = true;
    el.textContent = '';
  }

  function filterCategories(query) {
    const term = query.trim().toLocaleLowerCase('sw-TZ');
    if (!term) return categoriesCache;

    return categoriesCache.filter((category) => [
      category.name,
      category.description,
      category.profiles?.full_name
    ].some((value) => String(value || '').toLocaleLowerCase('sw-TZ').includes(term)));
  }

  function renderCategoryRows(categories) {
    const tbody = page.querySelector('#categories-body');

    if (!categories.length) {
      const searching = searchInput.value.trim().length > 0;
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="cat-empty">
            <strong>${searching ? 'Hakuna matokeo yaliyopatikana' : 'Bado hakuna kategoria'}</strong>
            <span>${searching ? 'Jaribu neno jingine la kutafuta.' : 'Bonyeza “Ongeza Kategoria” kuanza.'}</span>
          </div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = categories.map((category) => {
      const count = Number(category.products?.[0]?.count || 0);
      const date = category.created_at ? new Date(category.created_at) : null;
      const dateText = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

      return `
        <tr>
          <td>
            <div class="cat-name-cell">
              <span class="cat-name-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>
              </span>
              <span class="cat-name-text">${escapeHtml(category.name || 'Bila jina')}</span>
            </div>
          </td>
          <td><span class="cat-description" title="${escapeHtml(category.description || '')}">${escapeHtml(category.description || 'Hakuna maelezo')}</span></td>
          <td><span class="cat-count">${count} bidhaa</span></td>
          <td>${escapeHtml(category.profiles?.full_name || 'Mfanyakazi')}</td>
          <td class="cat-date">${dateText}</td>
          <td>
            <div class="cat-actions">
              <button class="cat-action-btn" type="button" data-action="edit" data-id="${escapeHtml(category.id)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4z"/></svg>
                Hariri
              </button>
              <button class="cat-action-btn cat-delete" type="button" data-action="delete" data-id="${escapeHtml(category.id)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg>
                Futa
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function openModal(category = null) {
    form.reset();

    const message = page.querySelector('#form-message');
    message.hidden = true;
    message.textContent = '';
    message.className = 'cat-form-message';

    if (category) {
      form.elements.name.value = category.name || '';
      form.elements.description.value = category.description || '';
      form.dataset.categoryId = category.id;
      page.querySelector('#category-modal-title').textContent = 'Hariri Kategoria';
      page.querySelector('#save-category-btn').textContent = 'Hifadhi Mabadiliko';
    } else {
      delete form.dataset.categoryId;
      page.querySelector('#category-modal-title').textContent = 'Ongeza Kategoria';
      page.querySelector('#save-category-btn').textContent = 'Hifadhi Kategoria';
    }

    modal.style.display = 'flex';
    window.setTimeout(() => form.elements.name.focus(), 50);
  }

  function closeModal() {
    modal.style.display = 'none';
    const message = page.querySelector('#form-message');
    message.hidden = true;
    message.textContent = '';
  }

  function showFormMessage(text, type) {
    const message = page.querySelector('#form-message');
    message.textContent = text;
    message.className = `cat-form-message ${type}`;
    message.hidden = false;
  }

  async function loadCategories() {
    hideFeedback();

    const tbody = page.querySelector('#categories-body');
    tbody.innerHTML = '<tr><td colspan="6"><div class="cat-loading">Inapakia kategoria...</div></td></tr>';

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, profiles(full_name), products(count)')
        .order('name');

      if (error) throw error;

      categoriesCache = Array.isArray(data) ? data : [];
      page.querySelector('#category-total').textContent = categoriesCache.length;
      renderCategoryRows(filterCategories(searchInput.value));
    } catch (error) {
      console.error('Error loading categories:', error);
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="cat-empty">
            <strong>Imeshindikana kupakia kategoria</strong>
            <span>Angalia muunganisho wa Supabase au ruhusa za akaunti yako.</span>
          </div>
        </td></tr>`;
      showFeedback(`Hitilafu ya kupakia kategoria: ${error?.message || 'Hitilafu isiyojulikana.'}`);
    }
  }

  async function saveCategory() {
    const button = page.querySelector('#save-category-btn');
    const categoryId = form.dataset.categoryId;
    const name = form.elements.name.value.trim();
    const description = form.elements.description.value.trim() || null;

    if (!name) {
      showFormMessage('Tafadhali ingiza jina la kategoria.', 'error');
      form.elements.name.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Inahifadhi...';

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!userData?.user?.id) {
        throw new Error('Akaunti yako haijaingia. Tafadhali ingia tena.');
      }

      let result;

      if (categoryId) {
        result = await supabase
          .from('categories')
          .update({ name, description })
          .eq('id', categoryId);
      } else {
        result = await supabase
          .from('categories')
          .insert([{ name, description, created_by: userData.user.id }]);
      }

      if (result.error) throw result.error;

      showFormMessage(
        categoryId ? 'Kategoria imesasishwa kikamilifu.' : 'Kategoria imeongezwa kikamilifu.',
        'success'
      );

      await loadCategories();
      window.setTimeout(closeModal, 700);
    } catch (error) {
      console.error('Error saving category:', error);
      showFormMessage(error?.message || 'Imeshindikana kuhifadhi kategoria.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = categoryId ? 'Hifadhi Mabadiliko' : 'Hifadhi Kategoria';
    }
  }

  async function editCategory(id) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      openModal(data);
    } catch (error) {
      console.error('Error fetching category:', error);
      showFeedback(`Imeshindikana kufungua kategoria: ${error?.message || 'Hitilafu isiyojulikana.'}`);
    }
  }

  async function deleteCategory(id, button) {
    const category = categoriesCache.find((item) => String(item.id) === String(id));
    const name = category?.name ? ` "${category.name}"` : '';

    if (!window.confirm(`Una uhakika unataka kufuta kategoria${name}?`)) return;

    button.disabled = true;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showFeedback(`Imeshindikana kufuta kategoria: ${error?.message || 'Hitilafu isiyojulikana.'}`);
    } finally {
      button.disabled = false;
    }
  }

  await loadCategories();
}