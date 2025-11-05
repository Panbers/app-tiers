(async function () {
  // Redireciona se já logado
  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.href = "dashboard.html";

  document.getElementById("btn-signup").onclick = async () => {
    const username = document.getElementById("su-username").value.trim();
    const club = document.getElementById("su-club").value.trim();
    const age = parseInt(document.getElementById("su-age").value || "0", 10);
    const email = document.getElementById("su-email").value.trim();
    const pass = document.getElementById("su-pass").value;

    if (!username || !club || !email || !pass) {
      alert("Preencha username, clube, email e senha.");
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return alert(error.message);

    // Cria o perfil (mesmo id do usuário auth)
    const userId = signUpData.user.id;
    const { error: insErr } = await supabase.from("profiles").insert({
      id: userId, username, club, age, role: "tier2", share_enabled: false
    });
    if (insErr) return alert(insErr.message);

    alert("Cadastro feito! Verifique seu email (se exigido) e faça login.");
  };

  document.getElementById("btn-login").onclick = async () => {
    const email = document.getElementById("li-email").value.trim();
    const pass = document.getElementById("li-pass").value;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return alert(error.message);
    location.href = "dashboard.html";
  };
})();
