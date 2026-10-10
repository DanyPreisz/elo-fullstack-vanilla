import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const playerForm = document.querySelector("#player-form");
const matchForm = document.querySelector("#match-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/players");
  listEl.innerHTML = "";
  const aSel = document.querySelector("#a");
  const bSel = document.querySelector("#b");
  aSel.innerHTML = "";
  bSel.innerHTML = "";
  data.players.forEach((p) => {
    const li = document.createElement("li");
    li.className = "item";
    const text = document.createElement("span");
    text.innerHTML = `${p.name} <span class="elo">${p.elo}</span>`;
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/players/${p.id}`, { method: "DELETE" }); await refresh(); });
    li.append(text, del);
    listEl.append(li);
    const oa = document.createElement("option");
    oa.value = p.id;
    oa.textContent = p.name;
    aSel.append(oa.cloneNode(true));
    bSel.append(oa);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/players", { method: "POST", body: JSON.stringify({ name: document.querySelector("#name").value.trim() }) });
    playerForm.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
matchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/match", { method: "POST", body: JSON.stringify({ a: document.querySelector("#a").value, b: document.querySelector("#b").value, winner: document.querySelector("#winner").value }) });
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
