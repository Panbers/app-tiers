const { createClient } = supabase;
const supabaseClient = createClient(
  "https://mqlhexjnvmjzxpyzmzur.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw"
);

async function loadDashboard() {
  // 🔒 Verifica se há usuário logado
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }

  // 🧾 Busca dados do perfil
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .single();

  if (profileError) {
    console.error("Erro ao carregar perfil:", profileError);
    alert("Erro ao carregar perfil. Faça login novamente.");
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
    return;
  }

  // 📋 Preenche os dados do perfil
  document.getElementById("username").textContent = profile.username;
  document.getElementById("role").textContent = profile.role;

  if (profile.birthdate) {
    const idade = new Date().getFullYear() - new Date(profile.birthdate).getFullYear();
    document.getElementById("idade").textContent = idade + " anos";
  } else {
    document.getElementById("idade").textContent = "—";
  }

  // 🎯 Exibe seção Tier 1 se o papel não for "tier2"
  if (profile.role !== "tier2") {
    document.getElementById("tier1Section").classList.remove("hidden");
    loadExtras(profile.id);
  }
}

async function loadExtras(userId) {
  const { data: classes } = await supabaseClient
    .from("classes")
    .select("*")
    .eq("user_id", userId);

  const { data: specs } = await supabaseClient
    .from("specialties")
    .select("*")
    .eq("user_id", userId);

  const cDiv = document.getElementById("classes");
  cDiv.innerHTML =
    "<h4>Classes:</h4>" + (classes?.map(c => `<p>${c.title}</p>`).join("") || "Nenhuma.");

  const sDiv = document.getElementById("specialties");
  sDiv.innerHTML =
    "<h4>Especialidades:</h4>" + (specs?.map(s => `<p>${s.name}</p>`).join("") || "Nenhuma.");
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// 🚀 Carrega tudo ao abrir a página
loadDashboard();
