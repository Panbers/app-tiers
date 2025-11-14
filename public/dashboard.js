// ==============================
//  CONFIG SUPABASE
// ==============================
const { createClient } = supabase;

const SUPABASE_URL = "https://mqlhexjnvmjzxpyzmzur.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw";

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// ELEMENTOS
// ==============================
const els = {
  me: document.getElementById("me"),
  myInfo: document.getElementById("myInfo"),
  clubMembers: document.getElementById("clubMembers"),

  // minhas classes
  classSelect: document.getElementById("classSelect"),
  btnAddMyClass: document.getElementById("btnAddMyClass"),
  newClass: document.getElementById("newClass"),
  btnCreateClass: document.getElementById("btnCreateClass"),
  myClasses: document.getElementById("myClasses"),

  // minhas especialidades
  specSelect: document.getElementById("specSelect"),
  btnAddMySpec: document.getElementById("btnAddMySpec"),
  newSpec: document.getElementById("newSpec"),
  btnCreateSpec: document.getElementById("btnCreateSpec"),
  mySpecs: document.getElementById("mySpecs"),

  // atribuir a tier2
  targetUser: document.getElementById("targetUser"),
  classSelect2: document.getElementById("classSelect2"),
  btnAddClassToUser: document.getElementById("btnAddClassToUser"),
  specSelect2: document.getElementById("specSelect2"),
  btnAddSpecToUser: document.getElementById("btnAddSpecToUser"),
  targetAssignments: document.getElementById("targetAssignments"),
};

// ==============================
// FUNÇÕES AUXILIARES
// ==============================
function ageFrom(dateStr) {
  if (!dateStr) return "—";
  const b = new Date(dateStr);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return `${a} anos`;
}

// ==============================
// AUTENTICAÇÃO E PERFIL
// ==============================
let currentUser = null;

async function loadMe() {
  const { data: auth } = await db.auth.getUser();
  if (!auth?.user) {
    location.href = "./login.html";
    return;
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  if (error || !profile) {
    alert("Erro ao carregar perfil");
    location.href = "./login.html";
    return;
  }

  if (profile.role !== "tier1") {
    alert("Apenas Tier 1 pode acessar este painel.");
    location.href = "./dashboard2.html";
    return;
  }

  currentUser = profile;

  els.me.textContent = `${profile.username} (${profile.role})`;

  els.myInfo.innerHTML = `
    <div>Nome: <b>${profile.username}</b></div>
    <div>Email: ${profile.email}</div>
    <div>Clube: ${profile.club_id || "—"}</div>
    <div>Idade: ${ageFrom(profile.birthdate)}</div>
  `;
}

// ==============================
// MEMBROS DO CLUBE
// ==============================
async function loadClubMembers() {
  if (!currentUser?.club_id) {
    els.clubMembers.innerHTML = "<div class='small'>Você não tem clube.</div>";
    return;
  }

  const { data, error } = await db
    .from("profiles")
    .select("id, username, role, birthdate")
    .eq("club_id", currentUser.club_id)
    .order("role", { ascending: true });

  if (error) {
    els.clubMembers.innerHTML = "Erro ao carregar.";
    return;
  }

  els.clubMembers.innerHTML = data
    .map(
      (u) => `
      <div class="item">
        <div class="grow">
          <div><b>${u.username}</b> <span class="pill">${u.role}</span></div>
          <div class="small">Idade: ${ageFrom(u.birthdate)}</div>
        </div>
      </div>
    `
    )
    .join("");

  // popular select para atribuir classes/especialidades a tier2
  els.targetUser.innerHTML = data
    .filter((u) => u.role === "tier2")
    .map((u) => `<option value="${u.id}">${u.username}</option>`)
    .join("");
}

// ==============================
// CLASSES GLOBAIS
// ==============================
async function loadClasses() {
  const { data } = await db.from("classes").select("*").order("name", { ascending: true });

  els.classSelect.innerHTML = data.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  els.classSelect2.innerHTML = els.classSelect.innerHTML; // copiar
}

// criar classe manual
async function createClass() {
  const name = els.newClass.value.trim();
  if (!name) return;

  const { error } = await db.from("classes").insert({ name });
  if (error) return alert(error.message);

  els.newClass.value = "";
  loadClasses();
  loadMyClasses();
}

async function addMyClass() {
  const classId = els.classSelect.value;
  await db.from("user_classes").insert({
    user_id: currentUser.id,
    class_id: classId,
  });
  loadMyClasses();
}

async function loadMyClasses() {
  const { data } = await db
    .from("user_classes")
    .select("id, class_id, classes(name)")
    .eq("user_id", currentUser.id);

  els.myClasses.innerHTML = data
    .map(
      (c) => `
    <div class="item">
      <div class="grow">${c.classes.name}</div>
      <button class="danger small" onclick="removeMyClass('${c.id}')">Remover</button>
    </div>`
    )
    .join("");
}

async function removeMyClass(id) {
  await db.from("user_classes").delete().eq("id", id);
  loadMyClasses();
}

// ==============================
// ESPECIALIDADES
// ==============================
async function loadSpecs() {
  const { data } = await db.from("specialties").select("*").order("name", { ascending: true });

  els.specSelect.innerHTML = data.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
  els.specSelect2.innerHTML = els.specSelect.innerHTML;
}

// criar especialidade manual
async function createSpec() {
  const name = els.newSpec.value.trim();
  if (!name) return;

  await db.from("specialties").insert({ name });
  els.newSpec.value = "";
  loadSpecs();
  loadMySpecs();
}

async function addMySpec() {
  const id = els.specSelect.value;
  await db.from("user_specialties").insert({
    user_id: currentUser.id,
    specialty_id: id,
  });
  loadMySpecs();
}

async function loadMySpecs() {
  const { data } = await db
    .from("user_specialties")
    .select("id, specialty_id, specialties(name)")
    .eq("user_id", currentUser.id);

  els.mySpecs.innerHTML = data
    .map(
      (s) => `
    <div class="item">
      <div class="grow">${s.specialties.name}</div>
      <button class="danger small" onclick="removeMySpec('${s.id}')">Remover</button>
    </div>`
    )
    .join("");
}

async function removeMySpec(id) {
  await db.from("user_specialties").delete().eq("id", id);
  loadMySpecs();
}

// ==============================
// ATRIBUIR AO TIER 2
// ==============================

async function loadTargetAssignments() {
  const uid = els.targetUser.value;

  if (!uid) {
    els.targetAssignments.innerHTML = "<div class='small'>Nenhum Tier 2 selecionado.</div>";
    return;
  }

  const { data: cls } = await db
    .from("user_classes")
    .select("id, classes(name)")
    .eq("user_id", uid);

  const { data: spc } = await db
    .from("user_specialties")
    .select("id, specialties(name)")
    .eq("user_id", uid);

  let html = "";

  if (cls.length)
    html += cls
      .map(
        (c) =>
          `<div class="item">${c.classes.name} <button class="danger small" onclick="removeClassUser('${c.id}')">X</button></div>`
      )
      .join("");

  if (spc.length)
    html += spc
      .map(
        (s) =>
          `<div class="item">${s.specialties.name} <button class="danger small" onclick="removeSpecUser('${s.id}')">X</button></div>`
      )
      .join("");

  if (!html) html = "<div class='small'>Nada atribuído ainda.</div>";

  els.targetAssignments.innerHTML = html;
}

async function addClassToUser() {
  const uid = els.targetUser.value;
  const cid = els.classSelect2.value;

  await db.from("user_classes").insert({ user_id: uid, class_id: cid });

  loadTargetAssignments();
}

async function addSpecToUser() {
  const uid = els.targetUser.value;
  const sid = els.specSelect2.value;

  await db.from("user_specialties").insert({ user_id: uid, specialty_id: sid });

  loadTargetAssignments();
}

async function removeClassUser(id) {
  await db.from("user_classes").delete().eq("id", id);
  loadTargetAssignments();
}

async function removeSpecUser(id) {
  await db.from("user_specialties").delete().eq("id", id);
  loadTargetAssignments();
}

// ==============================
// EVENTOS
// ==============================
els.btnCreateClass.addEventListener("click", createClass);
els.btnAddMyClass.addEventListener("click", addMyClass);

els.btnCreateSpec.addEventListener("click", createSpec);
els.btnAddMySpec.addEventListener("click", addMySpec);

els.targetUser.addEventListener("change", loadTargetAssignments);

els.btnAddClassToUser.addEventListener("click", addClassToUser);
els.btnAddSpecToUser.addEventListener("click", addSpecToUser);

// ==============================
// BOOT
// ==============================
(async function start() {
  await loadMe();
  await loadClasses();
  await loadSpecs();
  await loadMyClasses();
  await loadMySpecs();
  await loadClubMembers();
  loadTargetAssignments();
})();
