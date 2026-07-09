// Safe to expose client-side by design — RLS policies protect the data.
const SUPABASE_URL = 'https://uqriwofgiaugarepjsek.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rcrdo8qgvDO6mf7i5kziJA_y99u5_qO';

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

// Swaps the "Sign In" button for a user chip once a session exists.
// The Sign In button + OAuth popover already exist in the page HTML
// and stay untouched when signed out — this only runs when signed in.
async function renderAuthUI() {
  const user = await getCurrentUser();
  if (!user) return;

  const signInBtn = document.getElementById('signInBtn');
  const signInPopover = document.getElementById('signInPopover');
  if (!signInBtn) return;

  const profile = await getProfile(user.id);
  const name = (profile && profile.name) || (user.email || '').split('@')[0];
  const avatar = (profile && profile.avatar_url) || '';

  signInBtn.innerHTML = avatar
    ? `<img src="${avatar}" alt="" class="user-avatar">${name}`
    : name;
  signInBtn.classList.add('btn-signed-in');

  signInPopover.innerHTML = `
    <p>Signed in as <strong>${name}</strong></p>
    <button class="btn-solid" id="signOutBtn" style="width:100%">Sign out</button>
  `;
  document.getElementById('signOutBtn').addEventListener('click', signOut);
}

document.addEventListener('DOMContentLoaded', renderAuthUI);
