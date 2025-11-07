// auth.js

// Cria um e-mail sintético com base no username
function fakeEmail(username) {
  return `${username}@app.com`;
}

// Mostra mensagens simples
function showMsg(text, color = "black") {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.style.color = color;
}

// Registro de novo usuário
document.getElementById("btnRegister").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showMsg("Preencha usuário e senha.", "red");
    return;
  }

  const email = fakeEmail(username);

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    showMsg("Erro no cadastro: " + error.message, "red");
  } else {
    showMsg("Usuário cadastrado! Faça login.", "green");
  }
});

// Login de usuário existente
document.getElementById("btnLogin").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showMsg("Preencha usuário e senha.", "red");
    return;
  }

  const email = fakeEmail(username);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    showMsg("Erro no login: " + error.message, "red");
  } else {
    // Salva sessão e redireciona
    localStorage.setItem("sbSession", JSON.stringify(data.session));
    window.location.href = "dashboard.html";
  }
});
