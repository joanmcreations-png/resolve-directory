// Guards against this file being included/executed twice on the same
// page (was causing "Identifier 'supabase' has already been declared"
// and silently breaking every auth function).
if (!window.__resolveAuthLoaded) {
  window.__resolveAuthLoaded = true;

  // Safe to expose client-side by design — RLS policies protect the data.
  const SUPABASE_URL = 'https://uqriwofgiaugarepjsek.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_rcrdo8qgvDO6mf7i5kziJA_y99u5_qO';

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.signInWithGoogle = async function () {
    await window.supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  };

  window.signOut = async function () {
    await window.supabaseClient.auth.signOut();
    window.location.href = '/index.html';
  };

  window.getCurrentUser = async function () {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
  };

  window.getProfile = async function (userId) {
    const { data } = await window.supabaseClient.from('profiles').select('*').eq('id', userId).single();
    return data;
  };

  window.saveProfile = async function (userId, fields) {
    return window.supabaseClient.from('profiles').update(fields).eq('id', userId);
  };

  // Swaps the "Sign In" button for an avatar + dropdown once a session
  // exists. The Sign In button + OAuth popover stay in the page HTML
  // untouched when signed out — this only runs when signed in.
  window.renderAuthUI = async function () {
    const user = await window.getCurrentUser();
    const authArea = document.getElementById('authArea');
    if (!user || !authArea) return;

    const profile = await window.getProfile(user.id);
    const name = (profile && profile.name) || (user.email || '').split('@')[0];
    const avatar = (profile && profile.avatar_url) || '';
    const initial = name.charAt(0).toUpperCase();

    authArea.innerHTML = `
      <button class="avatar-btn" id="avatarBtn" aria-label="Account menu">
        ${avatar ? `<img src="${avatar}" alt="">` : `<span class="avatar-fallback">${initial}</span>`}
      </button>
      <div class="popover dropdown-menu" id="accountMenu">
        <a href="/profile/" class="dropdown-item">Profile</a>
        <button class="dropdown-item" id="signOutBtn">Sign out</button>
      </div>
    `;

    const avatarBtn = document.getElementById('avatarBtn');
    const accountMenu = document.getElementById('accountMenu');
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      accountMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!accountMenu.contains(e.target) && e.target !== avatarBtn) {
        accountMenu.classList.remove('open');
      }
    });
    document.getElementById('signOutBtn').addEventListener('click', window.signOut);
  };

  document.addEventListener('DOMContentLoaded', window.renderAuthUI);

  // The Google redirect lands with #access_token=... in the URL. Supabase
  // parses it asynchronously, so the initial renderAuthUI() call above can
  // fire before the session exists. This listener re-renders once the SDK
  // actually finishes processing it, and strips the token from the URL.
  window.supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      window.renderAuthUI();
      if (window.location.hash.includes('access_token')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  });
}
