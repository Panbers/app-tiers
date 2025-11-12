// tiers-dashboard.js
const { createClient } = supabase;

// === SUAS CHAVES CONFIRMADAS ===
const SUPABASE_URL = "https://mqlhexjnvmjzxpyzmzur.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw";

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  q: document.getElementById("q"),
  btnSearch: document.getElementById("btnSearch"),
  usersList: document.getElementById("usersList"),
  clubName: document.getElementById("clubName"),
  btnCreateClub: document.getElementById("btnCreateClub"),
  clubsList: document.getElementById("clubsList"),
  me: document.getElementById("me"),
};

// ---------- UTILIDADES ----------
function ageFrom(dateStr) {
  if (!dateStr) return "—";
  const b = new Date(dateStr);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return `${a} anos`;
}

function setLoading(el, msg = "Carregando…") {
  el.innerHTML = `<div class='muted small'>${msg}</div>`;
}

// ---------- VERIFICAÇÃO DE TIER S ----------
async function ensureTiers() {
  const { data: ures } = await db.auth.getUser();
  if (!ures?.user) {
    location.href = "./login.html";
    return;
  }

  // pega seu próprio profile/role
  const { data: me, error } = await db
    .from("profiles")
    .select("id, username, role")
    .eq("id", ures.user.id)
    .single();

  if (error || !me) {
    alert("Erro ao carregar seu perfil.");
    location.href = "./login.html";
    return;
  }

  els.me.textContent = `logado como ${me.username} (${me.role})`;

  // redireciona tiers automaticamente para o painel correto
  if (me.role === "tiers" && !location.pathname.includes("tiers-dashboard.html")) {
    location.href = "./tiers-dashboard.html";
    return;
  }

  if (me.role !== "tiers") {
    alert("Acesso restrito ao Tier S.");
    location.href = "./dashboard.html";
    return;
  }
}

// ---------- CLUBES ----------
async function loadClubs() {
  setLoading(els.clubsList, "Carregando clubes…");
  const { data, error } = await db.from("clubs").select("id,name").order("created_at", { ascending: true });

  if (error) {
    els.clubsList.innerHTML = `<div class='small' style='color:#ff9a9a'>Erro: ${error.message}</div>`;
    return;
  }

  if (!data?.length) {
    els.clubsList.innerHTML = "<div class='muted small'>Nenhum clube encontrado.</div>";
    return;
  }

  els.clubsList.innerHTML = data.map(c => `
    <div class="item">
      <div class="grow"><b>${c.name}</b></div>
      <button class="danger small" onclick="deleteClub('${c.id}')">Excluir</button>
    </div>
  `).join("");
}

async function createClub() {
  const name = els.clubName.value.trim();
  if (!name) return alert("Digite o nome do clube.");

  document.body.style.cursor = "wait";
  els.btnCreateClub.disabled = true;

  const { error } = await db.from("clubs").insert({ name, active: true });

  document.body.style.cursor = "default";
  els.btnCreateClub.disabled = false;

  if (error) return alert("Erro ao criar clube: " + error.message);

  els.clubName.value = "";
  alert("✅ Clube criado com sucesso!");
  loadClubs();
}

async function deleteClub(id) {
  if (!confirm("Excluir este clube permanentemente?")) return;
  const { error } = await db.from("clubs").delete().eq("id", id);
  if (error) return alert("Erro ao excluir: " + error.message);
  loadClubs();
}

// ---------- USUÁRIOS ----------
async function searchUsers() {
  const q = els.q.value.trim();
  setLoading(els.usersList, "Buscando usuários…");

  // busca perfis (limit 20 se vazio)
  let query = db
    .from("profiles")
    .select("id, username, email, role, club_id, birthdate")
    .order("username", { ascending: true })
    .limit(q ? 100 : 20);

  if (q) query = query.or(`username.ilike.%${q}%,email.ilike.%${q}%`);

  const [{ data: users, error: e1 }, { data: clubs, error: e2 }] = await Promise.all([
    query,
    db.from("clubs").select("id,name"),
  ]);

  if (e1 || e2) {
    els.usersList.innerHTML = `<div class='small' style='color:#ff9a9a'>Erro: ${(e1 || e2).message}</div>`;
    return;
  }

  const clubMap = new Map(clubs.map(c => [c.id, c.name]));
  if (!users?.length) {
    els.usersList.innerHTML = "<div class='muted small'>Nenhum resultado encontrado.</div>";
    return;
  }

  els.usersList.innerHTML = users.map(u => {
    const clubName = clubMap.get(u.club_id) || "—";
    const canPromote = u.role === "tier2";
    const btnLabel = canPromote ? "Promover a Tier 1" : (u.role === "tier1" ? "Rebaixar p/ Tier 2" : "—");
    const actionBtn = (u.role === "tier1" || u.role === "tier2")
      ? `<button class="small" onclick="toggleRole('${u.id}','${u.role}')">${btnLabel}</button>`
      : "";

    return `
      <div class="item">
        <div class="grow">
          <div><b>${u.username}</b> <span class="pill">${u.role}</span></div>
          <div class="small muted">${u.email} • Clube: ${clubName} • Idade: ${ageFrom(u.birthdate)}</div>
        </div>
        ${actionBtn}
        <button class="danger small" title="Desativar perfil" onclick="softDelete('${u.id}')">Desativar</button>
      </div>
    `;
  }).join("");
}

async function toggleRole(userId, currentRole) {
  const next = currentRole === "tier2" ? "tier1" : "tier2";
  const { error } = await db.from("profiles").update({ role: next }).eq("id", userId);
  if (error) return alert("Erro: " + error.message);
  alert(`Usuário atualizado para ${next.toUpperCase()}`);
  searchUsers();
}

async function softDelete(userId) {
  if (!confirm("Desativar este perfil? (pode impedir o acesso futuro)")) return;
  const { error } = await db.from("profiles").update({ role: "deleted", share_enabled: false }).eq("id", userId);
  if (error) return alert("Erro: " + error.message);
  alert("Usuário desativado com sucesso.");
  searchUsers();
}

// ---------- BOOT ----------
window.deleteClub = deleteClub;
window.toggleRole = toggleRole;
window.softDelete = softDelete;

els.btnCreateClub.addEventListener("click", createClub);
els.btnSearch.addEventListener("click", searchUsers);
els.q.addEventListener("input", () => { if (!els.q.value) searchUsers(); });

(async function start() {
  await ensureTiers();
  await Promise.all([loadClubs(), searchUsers()]);
})();
