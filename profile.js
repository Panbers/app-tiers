(async function () {
  const params = new URLSearchParams(location.search);
  const u = params.get("u");
  const card = document.getElementById("card");
  if (!u) { card.textContent = "Usuário não informado."; return; }

  // Leitura anônima só funciona quando share_enabled = true (política RLS)
  const { data: prof, error } = await supabase.from("profiles")
    .select("id, username, club, age, role, share_enabled")
    .eq("username", u)
    .maybeSingle();

  if (error) { card.textContent = error.message; return; }
  if (!prof || !prof.share_enabled) { card.textContent = "Perfil não compartilhado."; return; }

  // Carrega listas públicas (apenas leitura se desejar – aqui deixaremos fechado por padrão)
  card.innerHTML = `
    <h2>@${prof.username} <span class="badge">${prof.role.toUpperCase()}</span></h2>
    <div>Clube: <b>${prof.club}</b> · Idade: <b>${prof.age ?? "-"}</b></div>
    <div style="margin-top:8px;font-size:12px;">Este perfil está compartilhado publicamente.</div>
  `;
})();
