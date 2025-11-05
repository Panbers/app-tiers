(async function () {
  const sess = await supabase.auth.getSession();
  if (!sess.data.session) { location.href = "index.html"; return; }

  const userId = sess.data.session.user.id;

  // Carrega meu perfil
  async function loadMe() {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) { alert(error.message); return; }
    const me = data;

    document.getElementById("hello").innerText = `Dashboard – ${me.username}`;
    document.getElementById("role-badge").innerText = me.role.toUpperCase();
    document.getElementById("f-username").value = me.username;
    document.getElementById("f-club").value = me.club;
    document.getElementById("f-age").value = me.age ?? "";

    document.getElementById("btn-share").innerText = `Compartilhar: ${me.share_enabled ? "ON" : "OFF"}`;
    const link = `${location.origin}/profile.html?u=${encodeURIComponent(me.username)}`;
    document.getElementById("share-link").innerText = me.share_enabled ? `Link público: ${link}` : "";

    // Exibe painel de gerente (Tier1)
    document.getElementById("manager-panel").style.display = (me.role === "tier1") ? "block" : "none";
    return me;
  }

  const me = await loadMe();

  // Logout
  document.getElementById("btn-logout").onclick = async () => {
    await supabase.auth.signOut();
    location.href = "index.html";
  };

  // Alterna compartilhamento
  document.getElementById("btn-share").onclick = async () => {
    const { data: curr } = await supabase.from("profiles").select("share_enabled").eq("id", userId).single();
    const { error } = await supabase.from("profiles").update({ share_enabled: !curr.share_enabled }).eq("id", userId);
    if (error) return alert(error.message);
    await loadMe();
  };

  // Salvar meus dados
  document.getElementById("btn-save-self").onclick = async () => {
    const username = document.getElementById("f-username").value.trim();
    const club     = document.getElementById("f-club").value.trim();
    const age      = parseInt(document.getElementById("f-age").value || "0", 10);
    const { error } = await supabase.from("profiles").update({ username, club, age }).eq("id", userId);
    if (error) return alert(error.message);
    alert("Salvo!");
    await loadMe();
  };

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(t => t.onclick = () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    renderTab(t.dataset.tab);
  });

  async function renderTab(which) {
    const el = document.getElementById("tab-content");
    if (which === "classes") {
      const { data } = await supabase.from("classes").select("*").eq("user_id", userId).order("id", { ascending: false });
      el.innerHTML = `
        <div class="row">
          <input id="c-title" placeholder="Nome da classe" />
          <input id="c-date" type="date" />
          <button id="c-add">Adicionar</button>
        </div>
        <div class="list" id="c-list"></div>
      `;
      const list = document.getElementById("c-list");
      list.innerHTML = (data||[]).map(c => `
        <div class="item">
          <div>${c.title} <small class="badge">${c.finished_at || "-"}</small></div>
          <div>
            <button data-id="${c.id}" class="c-del">Excluir</button>
          </div>
        </div>
      `).join("");

      document.getElementById("c-add").onclick = async () => {
        const title = document.getElementById("c-title").value.trim();
        const date  = document.getElementById("c-date").value || null;
        if (!title) return alert("Informe o nome da classe.");
        const { error } = await supabase.from("classes").insert({ user_id: userId, title, finished_at: date });
        if (error) return alert(error.message);
        renderTab("classes");
      };
      list.querySelectorAll(".c-del").forEach(btn => btn.onclick = async () => {
        const id = btn.getAttribute("data-id");
        await supabase.from("classes").delete().eq("id", id);
        renderTab("classes");
      });

    } else {
      const { data } = await supabase.from("specialties").select("*").eq("user_id", userId).order("id", { ascending: false });
      el.innerHTML = `
        <div class="row">
          <input id="s-name" placeholder="Nome da especialidade" />
          <input id="s-date" type="date" />
          <button id="s-add">Adicionar</button>
        </div>
        <div class="list" id="s-list"></div>
      `;
      const list = document.getElementById("s-list");
      list.innerHTML = (data||[]).map(s => `
        <div class="item">
          <div>${s.name} <small class="badge">${s.concluded_at || "-"}</small></div>
          <div>
            <button data-id="${s.id}" class="s-del">Excluir</button>
          </div>
        </div>
      `).join("");

      document.getElementById("s-add").onclick = async () => {
        const name = document.getElementById("s-name").value.trim();
        const date  = document.getElementById("s-date").value || null;
        if (!name) return alert("Informe o nome da especialidade.");
        const { error } = await supabase.from("specialties").insert({ user_id: userId, name, concluded_at: date });
        if (error) return alert(error.message);
        renderTab("specialties");
      };
      list.querySelectorAll(".s-del").forEach(btn => btn.onclick = async () => {
        const id = btn.getAttribute("data-id");
        await supabase.from("specialties").delete().eq("id", id);
        renderTab("specialties");
      });
    }
  }

  renderTab("classes");

  // Painel do gerente (Tier1): buscar usuários (Tier2) do mesmo clube e editar
  document.getElementById("btn-search").onclick = async () => {
    // pega meu clube
    const { data: meData } = await supabase.from("profiles").select("club, role").eq("id", userId).single();
    if (!meData || meData.role !== "tier1") return alert("Acesso negado.");

    const q = document.getElementById("search-user").value.trim();
    let query = supabase.from("profiles").select("id,username,club,age,role,share_enabled").eq("club", meData.club).eq("role", "tier2");
    if (q) query = query.ilike("username", `%${q}%`);
    const { data, error } = await query.limit(20);
    if (error) return alert(error.message);

    const box = document.getElementById("manage-list");
    box.innerHTML = (data||[]).map(u => `
      <div class="item">
        <div>
          <b>${u.username}</b> <span class="badge">Tier: ${u.role}</span>
          <div style="font-size:12px;">Clube: ${u.club} · Idade: ${u.age ?? "-"}</div>
        </div>
        <div class="row" style="max-width:420px;">
          <input data-id="${u.id}" class="m-age" type="number" placeholder="Nova idade" />
          <button data-id="${u.id}" class="m-save">Salvar</button>
        </div>
      </div>
    `).join("");

    box.querySelectorAll(".m-save").forEach(btn => btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      const ageInput = box.querySelector(`.m-age[data-id="${id}"]`);
      const age = parseInt(ageInput.value || "0", 10);
      const { error: upErr } = await supabase.from("profiles").update({ age }).eq("id", id);
      if (upErr) return alert(upErr.message);
      alert("Atualizado!");
      document.getElementById("btn-search").click();
    });
  };
})();
