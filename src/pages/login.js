import { supabase } from '../lib/supabase.js';
import { signIn, getProfile } from '../auth/auth.js';

export function renderLogin(root) {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">SP</div>
          <h1>StationeryPro</h1>
          <p>Ingia kwenye akaunti yako</p>
        </div>

        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="login-email">Barua pepe</label>
            <input 
              type="email" 
              id="login-email" 
              name="email"
              autocomplete="username"
              placeholder="jina@biashara.com" 
              required
            >
          </div>

          <div class="form-group">
            <label for="login-password">Nenosiri</label>
            <input 
              type="password" 
              id="login-password" 
              name="password"
              autocomplete="current-password"
              placeholder="••••••••" 
              required
            >
          </div>

          <div id="login-error" class="error-message" style="display: none;"></div>

          <button class="btn btn-primary btn-block" type="submit" id="login-button">
            Ingia
          </button>
        </form>

        <div class="signup-link">
          <p><a href="#" id="show-forgot">Umesahau nenosiri?</a></p>
          <p>Huna akaunti? <a href="#" id="show-signup">Jiunde akaunti</a></p>
        </div>
      </div>
    </main>
  `;

  const form = root.querySelector('#login-form');
  const errorBox = root.querySelector('#login-error');
  const button = root.querySelector('#login-button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    button.disabled = true;
    button.textContent = 'Inaingia...';

    try {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Reload page after successful login
      window.location.reload();
      
    } catch (error) {
      console.error('Login error:', error);
      errorBox.textContent = error.message || 'Imeshindikana kuingia. Angalia barua pepe na nenosiri.';
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Ingia';
    }
  });

  // Show signup form
  const showSignupBtn = root.querySelector('#show-signup');
  if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderSignup(root);
    });
  }

  // Show forgot password form
  const showForgotBtn = root.querySelector('#show-forgot');
  if (showForgotBtn) {
    showForgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderForgotPassword(root);
    });
  }
}

function renderSignup(root) {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">SP</div>
          <h1>Unda Akaunti</h1>
          <p>Jaza taarifa zako za kujisajili</p>
        </div>

        <form id="signup-form" class="login-form">
          <div class="form-group">
            <label for="signup-name">Jina kamili</label>
            <input 
              type="text" 
              id="signup-name" 
              name="fullName"
              placeholder="Jina lako kamili" 
              required
            >
          </div>

          <div class="form-group">
            <label for="signup-email">Barua pepe</label>
            <input 
              type="email" 
              id="signup-email" 
              name="email"
              autocomplete="username"
              placeholder="jina@biashara.com" 
              required
            >
          </div>

          <div class="form-group">
            <label for="signup-password">Nenosiri (angalau herufi 6)</label>
            <input 
              type="password" 
              id="signup-password" 
              name="password"
              autocomplete="new-password"
              placeholder="••••••••" 
              minlength="6"
              required
            >
          </div>

          <div class="form-group">
            <label for="signup-role">Aina ya akaunti</label>
            <select id="signup-role" name="role">
              <option value="employee">Mfanyakazi</option>
              <option value="owner">Mmiliki (Owner)</option>
            </select>
          </div>

          <div id="signup-error" class="error-message" style="display: none;"></div>
          <div id="signup-success" class="success-message" style="display: none;"></div>

          <button class="btn btn-primary btn-block" type="submit" id="signup-button">
            Unda Akaunti
          </button>
        </form>

        <div class="signup-link">
          <p>Tayari una akaunti? <a href="#" id="show-login">Ingia</a></p>
        </div>
      </div>
    </main>
  `;

  const form = root.querySelector('#signup-form');
  const errorBox = root.querySelector('#signup-error');
  const successBox = root.querySelector('#signup-success');
  const button = root.querySelector('#signup-button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    successBox.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Inaunda...';

    try {
      const fullName = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const role = document.getElementById('signup-role').value;

      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });

      if (authError) throw authError;

      // Profile itaundwa automatically na trigger
      // Hakuna haja ya kuinsert manually

      successBox.textContent = 'Akaunti imeundwa kwa mafanikio! Sasa unaweza kuingia.';
      successBox.style.display = 'block';
      
      // Clear form
      form.reset();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        renderLogin(root);
      }, 2000);
      
    } catch (error) {
      console.error('Signup error:', error);
      errorBox.textContent = error.message || 'Imeshindikana kuunda akaunti.';
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Unda Akaunti';
    }
  });

  // Back to login
  const showLoginBtn = root.querySelector('#show-login');
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderLogin(root);
    });
  }
}

function renderForgotPassword(root) {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">SP</div>
          <h1>Rejesha Nenosiri</h1>
          <p>Tutakutumia link ya kubadilisha nenosiri lako</p>
        </div>

        <form id="forgot-form" class="login-form">
          <div class="form-group">
            <label for="forgot-email">Barua pepe</label>
            <input 
              type="email" 
              id="forgot-email" 
              name="email"
              autocomplete="email"
              placeholder="jina@biashara.com" 
              required
            >
          </div>

          <div id="forgot-error" class="error-message" style="display: none;"></div>
          <div id="forgot-success" class="success-message" style="display: none;"></div>

          <button class="btn btn-primary btn-block" type="submit" id="forgot-button">
            Tuma Link
          </button>
        </form>

        <div class="signup-link">
          <p><a href="#" id="back-to-login">Rudi kwenye login</a></p>
        </div>
      </div>
    </main>
  `;

  const form = root.querySelector('#forgot-form');
  const errorBox = root.querySelector('#forgot-error');
  const successBox = root.querySelector('#forgot-success');
  const button = root.querySelector('#forgot-button');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    successBox.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Inatuma...';

    try {
      const email = document.getElementById('forgot-email').value;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      if (error) throw error;

      successBox.textContent = 'Link imekutumwa! Angalia email yako (pia angalia spam folder).';
      successBox.style.display = 'block';
      
      // Clear form
      form.reset();
      
    } catch (error) {
      console.error('Forgot password error:', error);
      errorBox.textContent = error.message || 'Imeshindikana kutuma link.';
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Tuma Link';
    }
  });

  // Back to login
  const backToLoginBtn = root.querySelector('#back-to-login');
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      renderLogin(root);
    });
  }
}