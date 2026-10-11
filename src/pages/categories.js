import { supabase } from '../lib/supabase.js';

export async function renderCategories(root, user, profile) {
  root.innerHTML = `
    <div class="page-header">
      <h1>Kategoria za Bidhaa</h1>
      <button id="add-category-btn" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Ongeza Kategoria
      </button>
    </div>

    <div class="table-wrap">
      <table id="categories-table">
        <thead>
          <tr>
            <th>Jina</th>
            <th>Maelezo</th>
            <th>Idadi ya Bidhaa</th>
            <th>Aliyeongeza</th>
            <th>Tarehe</th>
            <th>Vitendo</th>
          </tr>
        </thead>
        <tbody id="categories-body">
          <tr><td colspan="6" class="empty-state">Inapakia...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div id="category-modal" class="modal-overlay" style="display: none;">
      <div class="modal">
        <div class="modal-header">
          <h3>Ongeza Kategoria</h3>
          <button class="modal-close" id="close-modal">×</button>
        </div>
        <div class="modal-body">
          <form id="category-form">
            <div class="form-group">
              <label>Jina la kategoria *</label>
              <input type="text" name="name" required maxlength="100" placeholder="Mfano: Madaftari" />
            </div>
            <div class="form-group">
              <label>Maelezo</label>
              <textarea name="description" rows="3" maxlength="500" placeholder="Maelezo ya kategoria (hiari)"></textarea>
            </div>
            <div id="form-message" class="form-message" style="display: none;"></div>
            <div class="form-buttons">
              <button type="button" class="btn btn-secondary" id="cancel-btn">Ghairi</button>
              <button type="submit" class="btn btn-primary">Hifadhi</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  await loadCategories();

  document.getElementById('add-category-btn').addEventListener('click', () => {
    openModal();
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCategory();
  });
}

async function loadCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*, profiles(full_name), products(count)')
    .order('name');

  if (error) {
    console.error('Error loading categories:', error);
    return;
  }

  const tbody = document.getElementById('categories-body');
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Hakuna kategoria zilizopatikana</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.description || '-'}</td>
      <td><span class="badge badge-primary">${c.products?.[0]?.count || 0} bidhaa</span></td>
      <td>${c.profiles?.full_name || 'Mfanyakazi'}</td>
      <td>${new Date(c.created_at).toLocaleDateString('sw-TZ')}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editCategory('${c.id}')">Hariri</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${c.id}')">Futa</button>
      </td>
    </tr>
  `).join('');
}

function openModal(category = null) {
  const modal = document.getElementById('category-modal');
  const form = document.getElementById('category-form');
  
  if (category) {
    form.name.value = category.name;
    form.description.value = category.description || '';
    form.dataset.categoryId = category.id;
  } else {
    form.reset();
    delete form.dataset.categoryId;
  }
  
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('category-modal');
  modal.style.display = 'none';
  document.getElementById('form-message').style.display = 'none';
}

async function saveCategory() {
  const form = document.getElementById('category-form');
  const message = document.getElementById('form-message');
  const categoryId = form.dataset.categoryId;
  const { data: userData } = await supabase.auth.getUser();

  const data = {
    name: form.name.value.trim(),
    description: form.description.value.trim() || null,
    created_by: userData.user.id
  };

  let result;
  if (categoryId) {
    result = await supabase
      .from('categories')
      .update(data)
      .eq('id', categoryId);
  } else {
    result = await supabase
      .from('categories')
      .insert([data]);
  }

  if (result.error) {
    message.textContent = result.error.message;
    message.className = 'form-message error';
    message.style.display = 'block';
    return;
  }

  message.textContent = categoryId ? 'Kategoria imesasishwa!' : 'Kategoria imeongezwa!';
  message.className = 'form-message success';
  message.style.display = 'block';

  setTimeout(() => {
    closeModal();
    loadCategories();
  }, 1500);
}

window.editCategory = async (id) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  openModal(data);
};

window.deleteCategory = async (id) => {
  if (!confirm('Je, una uhakika unataka kufuta kategoria hii? Bidhaa zilizomo hazitaathirika.')) return;

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Hitilafu: ' + error.message);
    return;
  }

  loadCategories();
};