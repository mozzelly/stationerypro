import { signIn } from "../auth/auth.js";

export function renderLogin(root) {
  root.innerHTML = `
    <main class="login-screen">
      <form id="login-form" class="login-card">
        <div class="brand-mark">SP</div>
        <p class="eyebrow">POWERED BY MOZZ ELLY</p>
        <h1>StationeryPro</h1>
        <p class="muted">Ingia kusimamia biashara yako.</p>

        <label for="email">Email</label>
        <input id="email" type="email" required
          autocomplete="username" placeholder="name@example.com">

        <label for="password">Password</label>
        <input id="password" type="password" required
          autocomplete="current-password" placeholder="Password yako">

        <button class="btn btn-primary full-width" type="submit">
          Ingia kwenye mfumo
        </button>

        <p id="login-message" class="form-message"></p>
        <p class="muted small">StationeryPro — Powered by Mozz Elly</p>
      </form>
    </main>
  `;

  const form = root.querySelector("#login-form");
  const message = root.querySelector("#login-message");

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Inaingia...";
    message.textContent = "";

    try {
      await signIn(
        root.querySelector("#email").value.trim(),
        root.querySelector("#password").value
      );

      location.hash = "#dashboard";
      location.reload();
    } catch (error) {
      message.textContent = error.message || "Imeshindikana kuingia.";
      message.className = "form-message error";
    } finally {
      button.disabled = false;
      button.textContent = "Ingia kwenye mfumo";
    }
  });
}