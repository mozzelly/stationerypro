import { signIn, getProfile } from '../auth/auth.js';

export function renderLogin(root) {
  root.innerHTML = `
    <main class="login-page">
      <section class="login-brand">
        <div class="brand-logo">SP</div>
        <p class="eyebrow">STATIONERY MANAGEMENT SYSTEM</p>
        <h1>Simamia biashara yako kwa uhakika.</h1>
        <p>Mauzo, bidhaa, stock na ripoti zako sehemu moja.</p>
      </section>

      <section class="login-panel">
        <form id="login-form" class="login-form">
          <p class="eyebrow">KARIBU TENA</p>
          <h2>Ingia kwenye akaunti</h2>
          <p class="muted">Tumia barua pepe na nenosiri lako.</p>

          <label>Barua pepe
            <input name="email" type="email" autocomplete="username"
              placeholder="jina@biashara.com" required>
          </label>

          <label>Nenosiri
            <input name="password" type="password"
              autocomplete="current-password" required>
          </label>

          <p id="login-error" class="error-message"></p>
          <button class="btn btn-primary" type="submit">Ingia</button>
        </form>
      </section>
    </main>
  `;

  const form = root.querySelector('#login-form');
  const errorBox = root.querySelector('#login-error');
  const button = form.querySelector('button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    button.disabled = true;
    button.textContent = 'Inaingia...';

    try {
      const values = new FormData(form);
      await signIn(values.get('email'), values.get('password'));
      const profile = await getProfile();

      window.dispatchEvent(
        new CustomEvent('stationery:navigate', {
          detail: profile.role === 'cashier' ? 'pos' : 'dashboard',
        })
      );
    } catch (error) {
      errorBox.textContent = error.message || 'Imeshindikana kuingia.';
    } finally {
      button.disabled = false;
      button.textContent = 'Ingia';
    }
  });
}