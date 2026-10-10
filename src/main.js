import { supabase } from "./lib/supabase.js";
import { getSession, getProfile, signOut } from "./auth/auth.js";
import { renderLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderProducts } from "./pages/products.js";
import { renderPOS } from "./pages/pos.js";
import { renderSales } from "./pages/sales.js";
import { renderExpenses } from "./pages/expenses.js";
import { renderReports } from "./pages/reports.js";
import { renderUsers } from "./pages/users.js";
import "./styles/style.css";

const root = document.querySelector("#app");

const pages = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  products: { title: "Bidhaa na Stock", render: renderProducts },
  pos: { title: "Mauzo Mapya (POS)", render: renderPOS },
  sales: { title: "Historia ya Mauzo", render: renderSales },
  expenses: { title: "Matumizi", render: renderExpenses },
  reports: { title: "Ripoti", render: renderReports },
  users: { title: "Watumiaji", render: renderUsers }
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
  if (!supabase) {
    root.innerHTML = `
      <main class="login-screen">
        <div class="login-card">
          <h1>Supabase haijaunganishwa</h1>
          <p>Angalia VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY
          ndani ya .env.local.</p>
        </div>
      </main>`;
    return;
  }

  let session;

  try {
    session = await getSession();
  } catch (error) {
    root.innerHTML = `<div class="notice error">${escapeHTML(error.message)}</div>`;
    return;
  }

  if (!session) {
    renderLogin(root);
    return;
  }

  let profile;

  try {
    profile = await getProfile(session.user.id);
  } catch {
    await signOut();
    renderLogin(root);
    return;
  }

  if (!profile.active) {
    await signOut();
    renderLogin(root);
    return;
  }

  const allowedPages = profile.role === "owner"
    ? Object.keys(pages)
    : ["pos", "sales", "expenses"];

  async function renderRoute() {
    const requested = (location.hash.replace("#", "") || "dashboard");
    const route = allowedPages.includes(requested)
      ? requested
      : allowedPages[0];

    const page = pages[route];

    root.innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand">
            <div class="brand-mark small-mark">SP</div>
            <div><strong>StationeryPro</strong>
              <small>Powered by Mozz Elly</small></div>
          </div>

          <div class="user-mini">
            <div class="avatar">${escapeHTML((profile.full_name || "U").charAt(0).toUpperCase())}</div>
            <div><strong>${escapeHTML(profile.full_name || session.user.email)}</strong>
              <small>${escapeHTML(profile.role)}</small></div>
          </div>

          <nav class="nav-menu">
            ${allowedPages.map(key => `
              <a href="#${key}" class="nav-link ${key === route ? "active" : ""}">
                <span>${({
                  dashboard: "▦",
                  products: "▤",
                  pos: "＋",
                  sales: "↗",
                  expenses: "−",
                  reports: "▥",
                  users: "♙"
                })[key]}</span>
                ${pages[key].title}
              </a>
            `).join("")}
          </nav>

          <button id="logout-button" class="btn btn-ghost logout-button">
            Toka kwenye mfumo
          </button>
        </aside>

        <main class="main-area">
          <header class="topbar">
            <button id="menu-button" class="btn btn-ghost mobile-menu">☰</button>
            <div><p class="eyebrow">STATIONERY MANAGEMENT</p>
              <h2>${page.title}</h2></div>
            <div class="topbar-user">${escapeHTML(profile.role)}</div>
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
        alert(error.message);
      }
    });

    root.querySelector("#menu-button").addEventListener("click", () => {
      root.querySelector("#sidebar").classList.toggle("sidebar-open");
    });

    const content = root.querySelector("#page-content");

    try {
      await page.render(content, session.user, profile);
    } catch (error) {
      content.innerHTML = `
        <div class="notice error">
          <strong>Imeshindikana kupakia ukurasa.</strong>
          <p>${escapeHTML(error.message || "Kuna hitilafu.")}</p>
        </div>`;
    }
  }

  window.addEventListener("hashchange", renderRoute);

  await renderRoute();
}

start();if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .catch(error => console.error("Service worker error:", error));
  });
}