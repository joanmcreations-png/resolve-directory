// Fill these in once the Supabase project exists — Settings → API.
// The anon key is safe to expose client-side by design (RLS protects the data).
const SUPABASE_URL = 'REPLACE_ME';
const SUPABASE_ANON_KEY = 'REPLACE_ME';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
}

async function signInWithGitHub() {
  await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.href } });
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.reload();
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function saveProfile(userId, fields) {
  return supabase.from('profiles').update(fields).eq('id', userId);
}

// Renders the header auth area: Sign In button when signed out,
// avatar + name when signed in. Call this once the DOM is ready.
async function renderAuthUI(containerEl) {
  const user = await getCurrentUser();

  if (!user) {
    containerEl.innerHTML = '<button class="btn-solid" id="signInBtn">Sign In</button>';
    document.getElementById('signInBtn').addEventListener('click', () => {
      document.getElementById('signInPopover').classList.toggle('open');
    });
    return;
  }

  const profile = await getProfile(user.id);
  const name = (profile && profile.name) || user.email;
  const avatar = (profile && profile.avatar_url) || '';

  containerEl.innerHTML = `
    <div class="user-chip" id="userChip">
      ${avatar ? `<img src="${avatar}" alt="" class="user-avatar">` : ''}
      <span>${name}</span>
    </div>
  `;
}
