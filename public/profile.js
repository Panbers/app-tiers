const { createClient } = supabase;
const supabaseClient = createClient("https://mlghexjnyjmjzpxymzur.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGhleGpudm1qenhweXptenVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjI3NjcsImV4cCI6MjA3ODAzODc2N30.CGI5Sizgbi5egZkEyMpeNQvLOcV_hLsJyBNc9J10vEw");

async function loadPublicProfile() {
  const params = new URLSearchParams(window.location.search);
  const username = params.get("u");
  if (!username) return document.body.innerHTML = "<p>Perfil não encontrado.</p>";

  const { data, error } = await supabaseClient.from("profiles").select("*").eq("username", username).eq("share_enabled", true).single();
  if (error || !data) return document.body.innerHTML = "<p>Perfil privado ou inexistente.</p>";

  document.getElementById("profile").innerHTML = `
    <p><b>Usuário:</b> ${data.username}</p>
    <p><b>Tier:</b> ${data.role}</p>
    <p><b>Clube:</b> ${data.club_id || "—"}</p>
  `;
}
loadPublicProfile();
