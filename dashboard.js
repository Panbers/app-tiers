document.addEventListener('DOMContentLoaded', init);

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Você precisa estar logado.');
    location.href = 'auth.html';
    return;
  }

  // refs
  const usernameEl   = document.getElementById('username');
  const clubNameEl   = document.getElementById('clubName');
  const clubIdEl     = document.getElementById('clubId');
  const clubsListEl  = document.getElementById('clubsList');
  const birthdateEl  = document.getElementById('birthdate');
  const ageDisplayEl = document.getElementById('ageDisplay');
  const extras       = document.getElementById('extras');

  // 1) Carrega usuário e perfil
  usernameEl.value = user.email.split('@')[0];

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, role, club_id, birthdate')
    .eq('id', user.id)
    .single();

  if (pErr) console.warn('profile error', pErr);

  // 2) Carrega TODOS os clubs (para autocomplete)
  const clubsMap = await loadClubs(clubsListEl);

  // 3) Preenche perfil (se tiver valores)
  if (profile) {
    // clube
    if (profile.club_id && clubsMap.has(profile.club_id)) {
      const club = clubsMap.get(profile.club_id);
      clubIdEl.value   = club.id;
      clubNameEl.value = club.name;
    }
    // nascimento/idade
    if (profile.birthdate) {
      birthdateEl.value = profile.birthdate;
      ageDisplayEl.textContent = calcAge(profile.birthdate);
    }

    // Habilita seção extra somente para tier1/tiers
    if (profile.role === 'tier1' || profile.role === 'tiers') {
      extras.style.opacity = '1';
      extras.style.pointerEvents = 'auto';
    } else {
      extras.style.opacity = '.4';
      extras.style.pointerEvents = 'none';
    }
  }

  // 4) Autocomplete: quando digitar, sugerimos por nome
  clubNameEl.addEventListener('input', () => {
    // se valor bate com uma opção, setamos clubId; senão limpamos
    const val = clubNameEl.value.trim().toLowerCase();
    let matched = null;
    for (const [, club] of clubsMap) {
      if (club.name.toLowerCase() === val) { matched = club; break; }
    }
    clubIdEl.value = matched ? matched.id : '';
  });

  // 5) Recalcula idade ao trocar data
  birthdateEl.addEventListener('change', () => {
    ageDisplayEl.textContent = birthdateEl.value ? calcAge(birthdateEl.value) : '–';
  });

  // 6) Recalcula idade diariamente (se página permanecer aberta)
  setInterval(() => {
    if (birthdateEl.value) ageDisplayEl.textContent = calcAge(birthdateEl.value);
  }, 1000 * 60 * 60 * 24);

  // 7) Salvar
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const club_id = clubIdEl.value || null;
  const birthdate = birthdateEl.value || null;

  // Upsert apenas nos campos que podem ser alterados
  const { error } = await supabase
    .from('profiles')
    .update({ club_id, birthdate })
    .eq('id', user.id);

  if (error) {
    alert('Erro ao salvar: ' + error.message);
  } else {
    alert('Dados salvos com sucesso!');
  }
});


  // 8) Logout
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      location.href = 'auth.html';
    });
  }
}

/** Busca todos os clubes e preenche o datalist. Retorna Map<id, {id,name}> */
async function loadClubs(datalistEl) {
  const map = new Map();
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    console.warn('clubs error', error);
    return map;
  }

  datalistEl.innerHTML = '';
  data.forEach(c => {
    map.set(c.id, c);
    const opt = document.createElement('option');
    opt.value = c.name;
    datalistEl.appendChild(opt);
  });

  return map;
}

/** Calcula idade a partir de AAAA-MM-DD */
function calcAge(isoDate) {
  const today = new Date();
  const dob   = new Date(isoDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
