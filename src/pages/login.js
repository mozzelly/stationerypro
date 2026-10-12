import { supabase } from '../lib/supabase.js';

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
            <input type="email" id="login-email" name="email" autocomplete="username" placeholder="jina@biashara.com" required>
          </div>

          <div class="form-group">
            <label for="login-password">Nenosiri</label>
            <input type="password" id="login-password" name="password" autocomplete="current-password" placeholder="••••••••" required>
          </div>

          <div id="login-error" class="error-message" style="display: none;"></div>

          <button class="btn btn-primary btn-block" type="submit" id="login-button">Ingia</button>
        </form>

        <div class="signup-link">
          <p><a href="#" id="show-forgot">Umesahau nenosiri?</a></p>
          <p>Huna akaunti? <a href="#" id="show-signup">Jisajili kama Mmiliki</a></p>
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
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if user is approved
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved, active, role')
        .eq('id', data.user.id)
        .single();

      if (!profile || !profile.is_approved) {
        await supabase.auth.signOut();
        errorBox.textContent = 'Akaunti yako bado haijakubaliwa na Developer. Subiri uthibitisho.';
        errorBox.style.display = 'block';
        button.disabled = false;
        button.textContent = 'Ingia';
        return;
      }

      if (!profile.active) {
        await supabase.auth.signOut();
        errorBox.textContent = 'Akaunti yako imefungwa. Wasiliana na mmiliki.';
        errorBox.style.display = 'block';
        button.disabled = false;
        button.textContent = 'Ingia';
        return;
      }

      window.location.reload();
      
    } catch (error) {
      console.error('Login error:', error);
      errorBox.textContent = error.message || 'Imeshindikana kuingia.';
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Ingia';
    }
  });

  root.querySelector('#show-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderSignup(root);
  });

  root.querySelector('#show-forgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderForgotPassword(root);
  });
}

function renderSignup(root) {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card" style="max-width: 520px;">
        <div class="login-header">
          <div class="logo">SP</div>
          <h1>Jisajili - StationeryPro</h1>
          <p>Jaza taarifa za biashara yako</p>
        </div>

        <form id="signup-form" class="login-form">
          <div class="form-section-title">Taarifa za Mmiliki</div>
          
          <div class="form-group">
            <label>Jina kamili *</label>
            <input type="text" name="fullName" placeholder="Mfano: Ahmed Ali" required>
          </div>

          <div class="form-group">
            <label>Barua pepe *</label>
            <input type="email" name="email" autocomplete="username" placeholder="jina@biashara.com" required>
          </div>

          <div class="form-group">
            <label>Namba ya simu *</label>
            <input type="tel" name="phone" placeholder="0712345678" required pattern="[0-9]{10}">
          </div>

          <div class="form-group">
            <label>Nenosiri (angalau herufi 6) *</label>
            <input type="password" name="password" autocomplete="new-password" placeholder="••••••••" minlength="6" required>
          </div>

          <div class="form-section-title">Taarifa za Biashara</div>

          <div class="form-group">
            <label>Jina la duka/biashara *</label>
            <input type="text" name="businessName" placeholder="Mfano: Stationery Center" required>
          </div>

          <div class="form-group">
            <label>Eneo/Mahali ilipo *</label>
            <input type="text" name="businessLocation" placeholder="Mfano: Mwanza, Kenya Street" required>
          </div>

          <div class="form-group">
            <label>Namba ya simu ya biashara</label>
            <input type="tel" name="businessPhone" placeholder="0282501234">
          </div>

          <div id="signup-error" class="error-message" style="display: none;"></div>
          <div id="signup-success" class="success-message" style="display: none;"></div>

          <button class="btn btn-primary btn-block" type="submit" id="signup-button">Tuma Ombi la Usajili</button>
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
    successBox.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Inatuma ombi...';

    try {
      const fullName = form.fullName.value;
      const email = form.email.value;
      const password = form.password.value;
      const phone = form.phone.value;
      const businessName = form.businessName.value;
      const businessLocation = form.businessLocation.value;
      const businessPhone = form.businessPhone.value;

      // 1. Sign up - create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: 'owner'
          }
        }
      });

      if (authError) throw authError;

      // 2. Create profile na business settings explicitly
      if (authData.user) {
        // HAKIKISHA: role ni 'owner' na is_approved ni 'false'
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            phone: phone,
            role: 'owner',
            is_approved: false,
            active: true
          }, {
            onConflict: 'id'
          });

        if (profileError) console.error('Profile error:', profileError);

        // Create business settings
        const { error: businessError } = await supabase
          .from('business_settings')
          .insert({
            owner_id: authData.user.id,
            business_name: businessName,
            business_address: businessLocation,
            business_phone: businessPhone || phone,
            business_email: email
          });

        if (businessError) console.error('Business settings error:', businessError);
      }

      successBox.textContent = 'Ombi lako limetumwa! Subiri Developer akubali akaunti yako.';
      successBox.style.display = 'block';
      form.reset();
      
      setTimeout(() => renderLogin(root), 4000);
      
    } catch (error) {
      console.error('Signup error:', error);
      errorBox.textContent = error.message || 'Imeshindikana kujisajili.';
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Tuma Ombi la Usajili';
    }
  });

  root.querySelector('#show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderLogin(root);
  });
}

function renderForgotPassword(root) {
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">SP</div>
          <h1>Rejesha Nenosiri</h1>
          <p>Tutakutumia link ya kubadilisha nenosiri</p>
        </div>

        <form id="forgot-form" class="login-form">
          <div class="form-group">
            <label>Barua pepe</label>
            <input type="email" name="email" autocomplete="email" placeholder="jina@biashara.com" required>
          </div>

          <div id="forgot-error" class="error-message" style="display: none;"></div>
          <div id="forgot-success" class="success-message" style="display: none;"></div>

          <button class="btn btn-primary btn-block" type="submit" id="forgot-button">Tuma Link</button>
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
    successBox.style.display = 'none';
    button.disabled = true;
    button.textContent = 'Inatuma...';

    try {
      const email = form.email.value;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;

      successBox.textContent = 'Link imekutumwa! Angalia email yako.';
      successBox.style.display = 'block';
      form.reset();
    } catch (error) {
      errorBox.textContent = error.message || 'Imeshindikana kutuma link.';
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Tuma Link';
    }
  });

  root.querySelector('#back-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    renderLogin(root);
  });
}