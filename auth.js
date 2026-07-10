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
    window.location.reload();
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

  // Swaps the "Sign In" button for a user chip once a session exists.
  // The Sign In button + OAuth popover already exist in the page HTML
  // and stay untouched when signed out — this only runs when signed in.
  window.renderAuthUI = async function () {
    const user = await window.getCurrentUser();
    if (!user) return;

    const signInBtn = document.getElementById('signInBtn');
    const signInPopover = document.getElementById('signInPopover');
    if (!signInBtn) return;

    const profile = await window.getProfile(user.id);
    const name = (profile && profile.name) || (user.email || '').split('@')[0];
    const avatar = (profile && profile.avatar_url) || '';

    signInBtn.innerHTML = avatar
      ? `<img src="${avatar}" alt="" class="user-avatar">${name}`
      : name;
    signInBtn.classList.add('btn-signed-in');

    const editingSince = (profile && profile.editing_since) || '';
    const company = (profile && profile.company) || '';

    signInPopover.innerHTML = `
      <p>Signed in as <strong>${name}</strong></p>
      <div class="popover-row" style="flex-direction:column;gap:8px;margin-bottom:10px">
        <input type="number" id="editingSinceInput" placeholder="Editing since (year)" min="1970" max="2026" value="${editingSince}">
        <input type="text" id="companyInput" placeholder="Company / studio (optional)" value="${company}">
      </div>
      <button class="btn-solid" id="saveProfileBtn" style="width:100%;margin-bottom:8px">Save profile</button>
      <p class="success" id="profileSaved">Saved.</p>
      <button class="btn-solid" id="signOutBtn" style="width:100%">Sign out</button>
    `;

    document.getElementById('signOutBtn').addEventListener('click', window.signOut);
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
      const year = document.getElementById('editingSinceInput').value;
      const companyVal = document.getElementById('companyInput').value;
      await window.saveProfile(user.id, {
        editing_since: year ? parseInt(year, 10) : null,
        company: companyVal || null
      });
      const saved = document.getElementById('profileSaved');
      saved.classList.add('show');
      setTimeout(() => saved.classList.remove('show'), 2000);
    });
  };

  document.addEventListener('DOMContentLoaded', window.renderAuthUI);
}
