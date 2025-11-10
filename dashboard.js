const { createClient } = supabase;
const supabaseClient = createClient("https://mlghexjnyjmjzpxymzur.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw");

async function loadDashboard() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return (window.location.href = "login.html");

  const { data: profile } = await supabaseClient.from("profiles").select("*").eq("email", user.email).single();

  document.getElementById("username").textContent = profile.username;
  document.getElementById("role").textContent = profile.role;

  if (profile.birthdate) {
    const idade = new Date().getFullYear() - new Date(profile.birthdate).getFullYear();
    document.getElementById("idade").textContent = idade + " anos";
  } else {
    document.getElementById("idade").textContent = "—";
  }

  if (profile.role !== "tier2") {
    document.getElementById("tier1Section").classList.remove("hidden");
    loadExtras(profile.id);
  }
}

async function loadExtras(userId) {
  const { data: classes } = await supabaseClient.from("classes").select("*").eq("user_id", userId);
  const { data: specs } = await supabaseClient.from("specialties").select("*").eq("user_id", userId);

  const cDiv = document.getElementById("classes");
  cDiv.innerHTML = "<h4>Classes:</h4>" + (classes?.map(c => `<p>${c.title}</p>`).join("") || "Nenhuma.");

  const sDiv = document.getElementById("specialties");
  sDiv.innerHTML = "<h4>Especialidades:</h4>" + (specs?.map(s => `<p>${s.name}</p>`).join("") || "Nenhuma.");
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

loadDashboard();
