import { supabase } from "./lib/supabase.js";
import { getSession, getProfile, signOut } from "./auth/auth.js";
import { renderLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderProducts } from "./pages/products.js";
import { renderCategories } from "./pages/categories.js";
import { renderPOS } from "./pages/pos.js";
import { renderSales } from "./pages/sales.js";
import { renderExpenses } from "./pages/expenses.js";
import { renderReports } from "./pages/reports.js";
import { renderUsers } from "./pages/users.js";
import { renderNotifications } from "./pages/notifications.js";
import { renderSettings } from "./pages/settings.js";
import { renderDeveloper } from "./pages/developer.js"; // <-- Mpya: Developer Page
import "./styles/style.css";

const root = document.querySelector("#app");

// Email yako ya Developer (Badilisha hapa kama inahitajika)
const DEVELOPER_EMAIL = "mussaelly1235@gmail.com";

// SVG Icons inline
const icons = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  products: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  categories: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
  pos: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  sales: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  expenses: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
  reports: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  notifications: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  developer: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`, // <-- Mpya: Developer Icon
  logout: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`
};

// HAPA NDIO MAHALI PA const pages
const pages = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  products: { title: "Bidhaa na Stock", render: renderProducts },
  categories: { title: "Kategoria", render: renderCategories },
  pos: { title: "Mauzo Mapya (POS)", render: renderPOS },
  sales: { title: "Historia ya Mauzo", render: renderSales },
  expenses: { title: "Matumizi", render: renderExpenses },
  reports: { title: "Ripoti", render: renderReports },
  users: { title: "Watumiaji", render: renderUsers },
  notifications: { title: "Arifa", render: renderNotifications },
  settings: { title: "Settings", render: renderSettings },
  developer: { title: "Developer", render: renderDeveloper } // <-- Mpya: Developer Page
};

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

window.escapeHTML = escapeHTML;

function money(value) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

window.money = money;

async function start() {
  if (!root) {
    throw new Error('HTML haina element yenye id="app". Kagua index.html.');
  }

  if (!supabase) {
    root.innerHTML = `
      <main class="login-screen">
        <div class="login-card">
          <h1>Supabase haijaunganishwa</h1>
          <p>Kagua VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY ndani ya .env.</p>
        </div>
      </main>`;
    return;
  }

  let session;

  try {
    session = await getSession();
  } catch (error) {
    root.innerHTML = `
      <main class="login-screen">
        <div class="login-card">
          <h1>Imeshindikana kuunganisha Supabase</h1>
          <p class="notice error">${error?.message || "Hitilafu ya kuunganisha."}</p>
          <button id="retry-app" class="btn btn-primary">Jaribu tena</button>
        </div>
      </main>`;
    root.querySelector("#retry-app").addEventListener("click", () => location.reload());
    return;
  }

  if (!session) {
    renderLogin(root);
    return;
  }

  let profile;

  try {
    profile = await getProfile(session.user.id);
  } catch (error) {
    console.error("Profile imeshindwa kupakiwa:", error);
    root.innerHTML = `
      <main class="login-screen">
        <div class="login-card">
          <h1>Imeshindikana kupakia akaunti</h1>
          <p class="notice error">${error?.message || "Kagua taarifa za profile."}</p>
          <button id="retry-app" class="btn btn-primary">Jaribu tena</button>
        </div>
      </main>`;
    root.querySelector("#retry-app").addEventListener("click", () => location.reload());
    return;
  }

  if (!profile || !profile.active) {
    await signOut();
    renderLogin(root);
    return;
  }

  // LOGIC MPYA YA RUHUSA (PERMISSIONS)
  const isDeveloper = session.user.email === DEVELOPER_EMAIL;
  
  let allowedPages;
  if (isDeveloper) {
    // Wewe Developer unaona hizi pekee
    allowedPages = ["developer", "dashboard", "settings", "notifications"];
  } else if (profile.role === "owner") {
    // Owner anaona pages zote za biashara (isipokuwa developer)
    allowedPages = ["dashboard", "products", "categories", "pos", "sales", "expenses", "reports", "users", "notifications", "settings"];
  } else {
    // Cashier / Mfanyakazi anaona hizi pekee
    allowedPages = ["pos", "sales", "expenses"];
  }

  async function renderRoute() {
    const requested = location.hash.replace("#", "") || "dashboard";
    const route = allowedPages.includes(requested) ? requested : allowedPages[0];
    const page = pages[route];

    root.innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand">
            <div class="brand-mark small-mark">SP</div>
            <div>
              <strong>StationeryPro</strong>
              <small>Powered by Mozz Elly</small>
            </div>
          </div>

          <div class="user-mini">
            <div class="avatar">${escapeHTML((profile.full_name || "U").charAt(0).toUpperCase())}</div>
            <div>
              <strong>${escapeHTML(profile.full_name || session.user.email)}</strong>
              <small>${escapeHTML(profile.role || "")}</small>
            </div>
          </div>

          <nav class="nav-menu">
            ${allowedPages.map(key => `
              <a href="#${key}" class="nav-link ${key === route ? "active" : ""}">
                <span class="nav-icon">${icons[key]}</span>
                ${pages[key].title}
              </a>
            `).join("")}
          </nav>

          <button id="logout-button" class="logout-button">
            <span class="nav-icon">${icons.logout}</span>
            Toka kwenye mfumo
          </button>
        </aside>

        <main class="main-area">
          <header class="topbar">
            <button id="menu-button" class="mobile-menu">
              ${icons.menu}
            </button>
            <div>
              <p class="eyebrow">STATIONERY MANAGEMENT</p>
              <h2>${page.title}</h2>
            </div>
            <div class="topbar-user">
              ${escapeHTML(profile.role || "")}
            </div>
          </header>

          <section id="page-content" class="page-content">
            <p class="muted">Inapakia...</p>
          </section>
        </main>
      </div>
    `;

    root.querySelector("#logout-button").addEventListener("click", async () => {
      try {
        await signOut();
        location.hash = "";
        location.reload();
      } catch (error) {
        alert(error?.message || "Imeshindikana kutoka.");
      }
    });

    root.querySelector("#menu-button").addEventListener("click", () => {
      root.querySelector("#sidebar").classList.toggle("sidebar-open");
    });

    const content = root.querySelector("#page-content");

    try {
      await page.render(content, session.user, profile);
    } catch (error) {
      console.error("Ukurasa umeshindwa kupakia:", error);
      content.innerHTML = `
        <div class="notice error">
          <strong>Imeshindikana kupakia ukurasa.</strong>
          <p>${error?.message || "Kuna hitilafu isiyojulikana."}</p>
        </div>`;
    }
  }

  window.addEventListener("hashchange", renderRoute);
  await renderRoute();
}

window.addEventListener("error", event => {
  console.error("[StationeryPro] JavaScript error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", event => {
  console.error("[StationeryPro] Promise error:", event.reason);
});

start().catch(error => {
  console.error("[StationeryPro] Start imeshindwa:", error);
  if (!root) return;
  root.innerHTML = `
    <main class="login-screen">
      <div class="login-card">
        <h1>StationeryPro haijafunguka</h1>
        <p class="startup-error">${error?.message || String(error)}</p>
        <button id="retry-app" class="btn btn-primary">Jaribu tena</button>
      </div>
    </main>`;
  root.querySelector("#retry-app").addEventListener("click", () => location.reload());
});