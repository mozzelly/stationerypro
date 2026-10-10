import { supabase } from "../lib/supabase.js";

export async function renderUsers(root, user, profile) {
  if (profile.role !== "owner") {
    root.innerHTML = `<div class="notice">Huna ruhusa ya kusimamia watumiaji.</div>`;
    return;
  }

  root.innerHTML = `
    <section class="panel">
      <div class="panel-heading"><h3>Watumiaji wa StationeryPro</h3>
        <button id="refresh-users" class="btn btn-secondary">Refresh</button></div>
      <p class="muted">Kutengeneza akaunti mpya kunafanywa kupitia Supabase Authentication.</p>
      <div id="users-table"><p class="muted">Inapakia...</p></div>
    </section>
  `;

  const table = root.querySelector("#users-table");

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,role,active,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    table.innerHTML = data?.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Jina</th><th>Role</th><th>Status</th><th>Tarehe</th><th>Kitendo</th></tr></thead>
        <tbody>${data.map(person => `
          <tr>
            <td>${window.escapeHTML(person.full_name || "Bila jina")}
              ${person.id === user.id ? '<small class="table-subtext">Akaunti yako</small>' : ""}
            </td>
            <td>${window.escapeHTML(person.role)}</td>
            <td>${person.active ? "Active" : "Disabled"}</td>
            <td>${new Date(person.created_at).toLocaleDateString()}</td>
            <td>${person.id !== user.id ? `
              <button class="btn ${person.active ? "btn-danger" : "btn-primary"}"
                data-user-id="${person.id}"
                data-active="${person.active}">
                ${person.active ? "Zima akaunti" : "Washa akaunti"}
              </button>` : "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table></div>` : `<p class="empty-state">Hakuna profiles zilizopatikana.</p>`;

    table.querySelectorAll("[data-user-id]").forEach(button => {
      button.addEventListener("click", async () => {
        const targetId = button.dataset.userId;
        const currentActive = button.dataset.active === "true";
        const nextActive = !currentActive;

        if (!confirm(`${nextActive ? "Washa" : "Zima"} akaunti hii?`)) return;

        button.disabled = true;

        try {
          const { error } = await supabase
            .from("profiles")
            .update({ active: nextActive })
            .eq("id", targetId);

          if (error) throw error;

          await loadUsers();
        } catch (error) {
          alert(error.message);
          button.disabled = false;
        }
      });
    });
  }

  root.querySelector("#refresh-users").addEventListener("click", () => {
    loadUsers().catch(e => alert(e.message));
  });

  await loadUsers();
}