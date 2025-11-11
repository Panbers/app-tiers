const { createClient } = supabase;
const supabaseClient = createClient(
  "https://mqlhexjnvmjzxpyzmzur.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw"
);

async function loadDashboard() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  if (!user) return (window.location.href = "login.html");

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!profile) return alert("Perfil não encontrado.");

  document.getElementById("username").textContent = profile.username;
  document.getElementById("role").textContent = profile.role;

  // Idade
  if (profile.birthdate) {
    const nasc = new Date(profile.birthdate);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    if (
      hoje.getMonth() < nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
    )
      idade--;
    document.getElementById("idade").textContent = `${idade} anos`;
  }

  // Nome do clube
  if (profile.club_id) {
    const { data: club } = await supabaseClient
      .from("clubs")
      .select("name")
      .eq("id", profile.club_id)
      .single();
    if (club) {
      document.getElementById("clubName").textContent = club.name;
      document.getElementById("clubInfo").classList.remove("hidden");
    }
  }

  // Painel Tier 1
  if (profile.role === "tier1") {
    document.getElementById("tier1Panel").classList.remove("hidden");
    carregarMembrosDoClube(profile.club_id);
  }

  // Painel Tier S
  if (profile.role === "tiers") {
    document.getElementById("tierSPanel").classList.remove("hidden");
    carregarTodosClubes();
  }
}

async function carregarMembrosDoClube(clubId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, role, birthdate")
    .eq("club_id", clubId)
    .eq("role", "tier2");

  const div = document.getElementById("clubMembers");
  if (error || !data) return (div.textContent = "Erro ao carregar membros.");

  div.innerHTML = data
    .map(
      (u) => `
      <div style="margin-bottom:8px;border-bottom:1px solid #333;padding:5px;">
        <b>${u.username}</b> — ${u.role}<br>
        Nascimento: ${u.birthdate || "—"}<br>
        <button onclick="promover('${u.id}')">Promover a Tier 1</button>
      </div>`
    )
    .join("");
}

async function promover(userId) {
  const { error } = await supabaseClient
    .from("profiles")
    .update({ role: "tier1" })
    .eq("id", userId);
  if (error) alert("Erro: " + error.message);
  else alert("Usuário promovido com sucesso!");
}

async function carregarTodosClubes() {
  const { data, error } = await supabaseClient.from("clubs").select("*");
  const div = document.getElementById("allClubs");

  if (error) return (div.textContent = "Erro ao carregar clubes.");
  if (!data.length) return (div.textContent = "Nenhum clube cadastrado.");

  div.innerHTML = data
    .map(
      (c) => `
      <div style="margin-bottom:10px;border-bottom:1px solid #333;padding:5px;">
        <b>${c.name}</b>
        <button onclick="excluirClube('${c.id}')">Excluir</button>
      </div>`
    )
    .join("");
}

async function criarClube() {
  const nome = document.getElementById("newClubName").value.trim();
  if (!nome) return alert("Digite o nome do clube.");
  const { error } = await supabaseClient.from("clubs").insert([{ name: nome }]);
  if (error) alert("Erro ao criar clube: " + error.message);
  else {
    alert("Clube criado!");
    carregarTodosClubes();
  }
}

async function excluirClube(id) {
  if (!confirm("Tem certeza que deseja excluir este clube?")) return;
  const { error } = await supabaseClient.from("clubs").delete().eq("id", id);
  if (error) alert("Erro: " + error.message);
  else carregarTodosClubes();
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

loadDashboard();
// Se for Tier S, mostra link de atalho para o painel global
if (profile.role === "tiers") {
  const link = document.createElement("a");
  link.href = "./tiers-dashboard.html";
  link.textContent = "👑 Abrir Painel Tier S";
  link.className = "pill";
  link.style.display = "inline-block";
  link.style.marginTop = "12px";
  link.style.textDecoration = "none";
  link.style.color = "#fff";
  document.getElementById("profile").appendChild(link);
}
// === BUSCAR USUÁRIOS (TIER S) ===
const btnSearchUser = document.getElementById('btnSearchUser');
const searchUser = document.getElementById('searchUser');
const usersList = document.getElementById('usersList');

if (btnSearchUser) {
  btnSearchUser.addEventListener('click', async () => {
    const query = searchUser.value.trim();
    if (!query) return alert('Digite algo para buscar.');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, birthdate, club')
      .or(`username.ilike.%${query}%, email.ilike.%${query}%, club.ilike.%${query}%`)
      .order('username');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return alert('Erro ao buscar usuários.');
    }

    if (!data || data.length === 0) {
      usersList.innerHTML = '<p>Nenhum usuário encontrado.</p>';
      return;
    }

    usersList.innerHTML = data.map(u => `
      <div class="flex justify-between items-center p-2 border-b border-gray-700">
        <div>
          <p><strong>${u.username}</strong> (${u.role})</p>
          <p class="text-sm text-gray-400">${u.club || 'Sem clube'}</p>
        </div>
        <div class="flex gap-2">
          <button class="bg-green-600 px-2 py-1 rounded" onclick="promoteUser('${u.id}', '${u.role}')">
            ${u.role === 'tier2' ? 'Promover' : 'Rebaixar'}
          </button>
          <button class="bg-red-600 px-2 py-1 rounded" onclick="deleteUser('${u.id}')">Excluir</button>
        </div>
      </div>
    `).join('');
  });
}

// === PROMOVER OU REBAIXAR ===
async function promoteUser(id, role) {
  const newRole = role === 'tier2' ? 'tier1' : 'tier2';

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Erro ao atualizar função.');
  } else {
    alert(`Usuário agora é ${newRole}!`);
    btnSearchUser.click(); // recarrega lista
  }
}

// === EXCLUIR USUÁRIO ===
async function deleteUser(id) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

  const { error } = await supabase.from('profiles').delete().eq('id', id);

  if (error) {
    console.error(error);
    alert('Erro ao excluir.');
  } else {
    alert('Usuário excluído!');
    btnSearchUser.click();
  }
}
