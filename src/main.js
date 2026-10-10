console.log("[StationeryPro] Main.js imefika mwisho.");

window.addEventListener("error", (event) => {
  console.error("[StationeryPro] JavaScript error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("[StationeryPro] Promise error:", event.reason);
});

start().catch((error) => {
  console.error("[StationeryPro] Start imeshindwa:", error);

  if (root) {
    root.innerHTML = `
      <main class="login-screen">
        <div class="login-card">
          <h1>StationeryPro haijafunguka</h1>
          <p>Hitilafu imetokea wakati wa kuanzisha mfumo.</p>
          <pre style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>
          <button id="retry-app" class="btn btn-primary">Jaribu tena</button>
        </div>
      </main>
    `;

    root.querySelector("pre").textContent =
      error?.message || String(error);

    root.querySelector("#retry-app").addEventListener("click", () => {
      location.reload();
    });
  }
});

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .catch((error) => {
        console.error("[StationeryPro] Service worker:", error);
      });
  });
}