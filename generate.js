const fs = require('fs');
const path = require('path');
const { grades, categoryIcons, categoryColors, defaultIcon, categoryInstall } = require('./data.js');

const ROOT = __dirname;
const outDir = path.join(ROOT, 'grade');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Optional per-resource preview images (og:image of each target site).
// Refresh with: node fetch-previews.js
const previewsPath = path.join(ROOT, 'previews.json');
const previews = fs.existsSync(previewsPath) ? JSON.parse(fs.readFileSync(previewsPath, 'utf8')) : {};

// Cache-busting version for styles.css: changes every build so browsers and
// the GitHub Pages CDN never serve a stale stylesheet with fresh HTML.
const CSS_V = Date.now().toString(36);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function writePage(relDir, html) {
  const dir = path.join(ROOT, relDir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

/* ---------- shared HTML chunks (identical across pages) ---------- */

const GTAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-1P06PPE9EV"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-1P06PPE9EV');
</script>`;

const HEADER = `<header>
  <a class="logo" href="/index.html">
    <svg class="mark" width="18" height="18" viewBox="0 0 24 24">
      <path d="M12 2.5 20.5 7.5 12 12.5 3.5 7.5Z" fill="#f7d9c6"/>
      <path d="M3.5 7.5 12 12.5V21.5L3.5 16.5Z" fill="var(--accent)"/>
      <path d="M20.5 7.5 12 12.5V21.5L20.5 16.5Z" fill="#a8451f"/>
    </svg>
    RESOLVE<span class="name"> Directory</span>
  </a>
  <nav class="top">
    <a class="link" href="/index.html#list">Grades</a>
    <div class="notify-wrap">
      <button class="btn-solid" id="submitBtn"><span class="full-label">Submit a Resource</span><span class="short-label">Submit</span></button>
      <div class="popover" id="submitPopover">
        <p>Share a link to a free LUT or PowerGrade you found.</p>
        <div class="popover-row" id="submitForm">
          <input type="url" id="submitInput" placeholder="https://..." required>
          <button class="btn-solid" id="submitSubmit">Send</button>
        </div>
        <p class="success" id="submitSuccess">Thanks — we'll take a look and add it.</p>
      </div>
    </div>
    <div class="notify-wrap">
      <button class="btn-solid" id="notifyBtn"><span class="full-label">Get notified</span><span class="short-label">Notify</span></button>
      <div class="popover" id="popover">
        <p>Get an email when new grades are added.</p>
        <div class="popover-row" id="popoverForm">
          <input type="email" id="emailInput" placeholder="you@email.com" required>
          <button class="btn-solid" id="popoverSubmit">Notify me</button>
        </div>
        <p class="success" id="popoverSuccess">You're in. We'll email you about new grades.</p>
      </div>
    </div>
    <div class="notify-wrap" id="authArea">
      <button class="btn-outline" id="signInBtn">Sign In</button>
      <div class="popover" id="signInPopover">
        <p>Sign in to submit resources under your name and get a profile.</p>
        <div class="oauth-row">
          <button class="btn-oauth" id="googleSignIn">
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  </nav>
</header>`;

const FOOTER = `<footer>
  <div class="footer-cols">
    <div class="footer-col">
      <h3>Explore</h3>
      <a href="/index.html#list">Grades</a>
      <a href="#" id="footerSubmit">Submit a Resource</a>
    </div>
    <div class="footer-col">
      <h3>Browse</h3>
      <a href="/luts/">Free LUTs</a>
      <a href="/powergrades/">PowerGrades</a>
      <a href="/official-luts/">Official log LUTs</a>
      <a href="/guides/">Guides</a>
    </div>
    <div class="footer-col">
      <h3>Account</h3>
      <a href="#" id="footerSignIn">Sign In</a>
      <a href="#" id="footerNotify">Get notified</a>
    </div>
    <div class="footer-col">
      <h3>Legal</h3>
      <a href="/privacy/">Privacy Policy</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="footer-brand">
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M12 2.5 20.5 7.5 12 12.5 3.5 7.5Z" fill="#f7d9c6"/>
        <path d="M3.5 7.5 12 12.5V21.5L3.5 16.5Z" fill="var(--accent)"/>
        <path d="M20.5 7.5 12 12.5V21.5L20.5 16.5Z" fill="#a8451f"/>
      </svg>
      resolve.directory
    </div>
  </div>
  <p class="footer-disclaimer">Not affiliated with Blackmagic Design.</p>
</footer>`;

const SCRIPTS = `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="/auth.js"></script>
<script>
  const notifyBtn = document.getElementById('notifyBtn');
  const popover = document.getElementById('popover');
  const popoverForm = document.getElementById('popoverForm');
  const popoverSuccess = document.getElementById('popoverSuccess');

  const submitBtn = document.getElementById('submitBtn');
  const submitPopover = document.getElementById('submitPopover');
  const submitForm = document.getElementById('submitForm');
  const submitSuccess = document.getElementById('submitSuccess');

  const signInPopover = document.getElementById('signInPopover');

  notifyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    submitPopover.classList.remove('open');
    signInPopover.classList.remove('open');
    popover.classList.toggle('open');
  });

  submitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.remove('open');
    signInPopover.classList.remove('open');
    submitPopover.classList.toggle('open');
  });

  document.getElementById('signInBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.remove('open');
    submitPopover.classList.remove('open');
    signInPopover.classList.toggle('open');
  });

  document.getElementById('googleSignIn').addEventListener('click', () => signInWithGoogle());

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== notifyBtn) {
      popover.classList.remove('open');
    }
    if (!submitPopover.contains(e.target) && e.target !== submitBtn) {
      submitPopover.classList.remove('open');
    }
    if (!signInPopover.contains(e.target) && e.target.id !== 'signInBtn') {
      signInPopover.classList.remove('open');
    }
  });

  document.getElementById('popoverSubmit').addEventListener('click', () => {
    const email = document.getElementById('emailInput').value;
    if (!email || !email.includes('@')) return;
    fetch('https://formspree.io/f/maqggjqp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email, source: 'resolve.directory detail page' })
    }).catch(() => {});
    window.supabaseClient.from('subscribers').insert({ email: email, source: 'resolve.directory detail page' }).then(() => {});
    popoverForm.style.display = 'none';
    popoverSuccess.classList.add('show');
  });

  document.getElementById('submitSubmit').addEventListener('click', () => {
    const url = document.getElementById('submitInput').value;
    if (!url || !url.includes('.')) return;
    fetch('https://formspree.io/f/maqggjqp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ resource_url: url, source: 'resolve.directory detail submission' })
    }).catch(() => {});
    submitForm.style.display = 'none';
    submitSuccess.classList.add('show');
  });

  function footerLinkTo(headerBtn) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => headerBtn.click(), 350);
  }
  document.getElementById('footerSubmit').addEventListener('click', (e) => { e.preventDefault(); footerLinkTo(submitBtn); });
  document.getElementById('footerSignIn').addEventListener('click', (e) => { e.preventDefault(); footerLinkTo(document.getElementById('signInBtn')); });
  document.getElementById('footerNotify').addEventListener('click', (e) => { e.preventDefault(); footerLinkTo(notifyBtn); });
</script>`;

function head({ title, desc, canonical, ogTitle, jsonld }) {
  const blocks = (jsonld || []).map(function (obj) {
    return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
  }).join('\n');
  return `<head>
${GTAG}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0b0b0b">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@500;600&display=swap" rel="stylesheet">

<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(ogTitle || title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="https://resolve.directory/og.png">
<meta property="og:site_name" content="resolve.directory">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(ogTitle || title)}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="https://resolve.directory/og.png">

${blocks}
<link rel="stylesheet" href="/styles.css?v=${CSS_V}">
</head>`;
}

function rowHtml(g, i) {
  const catColor = categoryColors[g.cat] || '#59564f';
  const icon = categoryIcons[g.cat] || defaultIcon;
  return `      <a class="row" href="/grade/${g.slug}/">
        <span class="rank">${i + 1}</span>
        <span class="icon">${icon}</span>
        <span class="row-main">
          <div class="name">${escapeHtml(g.name)}</div>
          <div class="desc">${escapeHtml(g.desc)}</div>
        </span>
        <span class="cat"><span class="cat-dot" style="background:${catColor}"></span>${escapeHtml(g.cat)}</span>
        <span class="tag free">FREE</span>
      </a>`;
}

/* ---------- individual resource pages ---------- */

function catHubPathFor(cat) {
  return CAT_HUBS_BY_CAT[cat] || null;
}

function pageHtml(g) {
  const catColor = categoryColors[g.cat] || '#59564f';
  const icon = categoryIcons[g.cat] || '';
  const install = categoryInstall[g.cat] || categoryInstall['LUT Pack'];
  const title = `${g.name} — Free ${g.cat} for DaVinci Resolve | resolve.directory`;
  const canonical = `https://resolve.directory/grade/${g.slug}/`;
  const catHub = catHubPathFor(g.cat);
  const camHub = g.cam && g.cam !== 'Any' && CAM_HUB_SLUGS[g.cam] ? `/camera/${CAM_HUB_SLUGS[g.cam]}/` : null;

  const breadcrumbCat = catHub
    ? `<a href="${catHub}">${escapeHtml(g.cat)}</a>`
    : `<span>${escapeHtml(g.cat)}</span>`;

  const related = [];
  if (catHub) related.push(`<a href="${catHub}">More free ${escapeHtml(g.cat.toLowerCase())}s for DaVinci Resolve</a>`);
  if (camHub) related.push(`<a href="${camHub}">All free ${escapeHtml(g.cam)} LUTs &amp; grades</a>`);
  related.push(`<a href="/guides/how-to-install-luts-in-davinci-resolve/">How to install a LUT in DaVinci Resolve</a>`);
  const relatedHtml = related.length
    ? `\n  <nav class="hub-related">\n    <h2>Keep exploring</h2>\n    ${related.join('\n    ')}\n  </nav>`
    : '';

  const jsonld = [{
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: g.name,
    description: g.desc,
    url: canonical,
    isAccessibleForFree: true,
    keywords: g.cat + ', DaVinci Resolve, color grading'
  }, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'resolve.directory', item: 'https://resolve.directory/' },
      catHub
        ? { '@type': 'ListItem', position: 2, name: g.cat, item: `https://resolve.directory${catHub}` }
        : { '@type': 'ListItem', position: 2, name: g.cat },
      { '@type': 'ListItem', position: 3, name: g.name, item: canonical }
    ]
  }];

  return `<!DOCTYPE html>
<html lang="en">
${head({ title, desc: g.desc, canonical, ogTitle: `${g.name} — Free ${g.cat} for DaVinci Resolve`, jsonld })}
<body>

${HEADER}

<div class="detail-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    ${breadcrumbCat}
  </div>

  <div class="detail-head">
    <div class="detail-icon" style="color:${catColor}">${icon}</div>
    <div class="detail-title-row">
      <h1 class="detail-title">${escapeHtml(g.name)}</h1>
      <div class="detail-tags">
        <span class="tag free">FREE</span>
      </div>
    </div>
  </div>

  <p class="detail-desc">${escapeHtml(g.desc)}</p>
${previews[g.slug] ? `
  <a class="detail-preview" href="${g.url}" target="_blank" rel="noopener noreferrer">
    <img src="${escapeHtml(previews[g.slug])}" alt="Preview of ${escapeHtml(g.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.style.display='none'">
  </a>
` : ''}
  <div class="detail-meta">
    <span class="cat-dot" style="background:${catColor}"></span>
    <span>${escapeHtml(g.cat)}</span>
  </div>

  <div class="detail-actions">
    <a class="btn-visit" href="${g.url}" target="_blank" rel="noopener noreferrer">
      Visit resource
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>
    </a>
  </div>

  <details class="install">
    <summary>How to install this in DaVinci Resolve</summary>
    <p>${escapeHtml(install)}</p>
  </details>${relatedHtml}
</div>

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

/* ---------- hub pages (category & camera) ---------- */

// Category hubs: keyword-rich landing pages. Only built for categories with enough depth.
const CAT_HUBS = [
  {
    path: '/luts/',
    repCat: 'LUT Pack',
    match: function (g) { return g.cat === 'LUT Pack'; },
    h1: 'Free LUTs for DaVinci Resolve',
    title: 'Free LUTs for DaVinci Resolve — Cinematic .cube Packs | resolve.directory',
    desc: 'A curated list of free LUT packs for DaVinci Resolve — cinematic, teal & orange, film emulation and more, gathered from creators across the web.',
    intro: 'Every free LUT pack in the directory, in one place. These are creative .cube LUTs from colorists and studios across the web — cinematic looks, teal &amp; orange, film emulation, wedding and horror grades — all free to download and drop straight into DaVinci Resolve.',
    faq: [
      ['Are these LUTs really free?', 'Yes. Every LUT listed here is offered free by its creator. Some ask for an email or a social follow, but none cost money.'],
      ['What format are the LUTs?', 'Almost all are .cube files, the standard 3D LUT format DaVinci Resolve reads natively. A few also include .xmp or .look versions.'],
      ['Do these work in the free version of Resolve?', 'Yes. 3D LUTs work identically in DaVinci Resolve and DaVinci Resolve Studio, so the free version handles all of them.']
    ]
  },
  {
    path: '/powergrades/',
    repCat: 'PowerGrade',
    match: function (g) { return g.cat === 'PowerGrade'; },
    h1: 'Free PowerGrades for DaVinci Resolve',
    title: 'Free PowerGrades for DaVinci Resolve — .drx Node Trees | resolve.directory',
    desc: 'Free DaVinci Resolve PowerGrades and node trees from working colorists — cinematic looks and log-to-Rec709 setups you can import in one drag.',
    intro: 'PowerGrades are full node trees a colorist has already built for you — not just a single LUT, but the whole grade. Import a .drx into your Gallery and apply the entire look, then tweak any node. Below are the free PowerGrades collected in the directory.',
    faq: [
      ['What is a PowerGrade?', 'A PowerGrade is a saved DaVinci Resolve node tree — the complete grade including every node, LUT and adjustment — stored as a .drx file you can reuse on any project.'],
      ['How do I import a PowerGrade?', 'On the Color page, open the Gallery panel, create or pick a PowerGrade album, then drag the .drx file into it. Right-click a clip and choose Apply Grade.'],
      ['Do PowerGrades need Resolve Studio?', 'No. PowerGrades work in the free version of DaVinci Resolve as well as Studio.']
    ]
  },
  {
    path: '/official-luts/',
    repCat: 'Official LUT',
    match: function (g) { return g.cat === 'Official LUT'; },
    h1: 'Official Camera Log LUTs for DaVinci Resolve',
    title: 'Free Official Camera Log LUTs for DaVinci Resolve | resolve.directory',
    desc: 'Official free log-to-Rec709 conversion LUTs straight from Sony, Canon, Nikon, Panasonic, DJI, RED, ARRI and Fujifilm — the correct starting point for grading log footage.',
    intro: 'These are the official conversion LUTs published by the camera manufacturers themselves — the technically correct way to take S-Log, C-Log, N-Log, V-Log, D-Log and Log-C footage back to a Rec.709 starting point before you grade. Always start from the official LUT, then build your look on top.',
    faq: [
      ['Why use the official LUT instead of a creative one?', 'The official manufacturer LUT is a technically accurate log-to-Rec709 transform. It gives you correct color and contrast as a neutral base, which you then grade on top of.'],
      ['Are manufacturer LUTs free?', 'Yes. Sony, Canon, Nikon, Panasonic, DJI, RED, ARRI and Fujifilm all publish their conversion LUTs for free.'],
      ['Which LUT do I need for my camera?', 'Pick the one that matches your camera brand and its log format — for example S-Log3 for Sony, C-Log for Canon, or V-Log for Panasonic.']
    ]
  },
  {
    path: '/film-grain/',
    repCat: 'Grain Pack',
    match: function (g) { return g.cat === 'Grain Pack'; },
    h1: 'Free Film Grain & Overlays for DaVinci Resolve',
    title: 'Free Film Grain & VHS Overlays for DaVinci Resolve | resolve.directory',
    desc: 'Free film grain, Super 8, 16mm and VHS overlay packs to add analog texture to your DaVinci Resolve edits.',
    intro: 'Digital footage can look too clean. These free grain and overlay packs add real Super 8, 16mm and VHS texture — grain, gate weave, projector flicker and analog artifacts — that you drop on a track above your footage or apply as a LUT.',
    faq: [
      ['How do I add film grain in DaVinci Resolve?', 'Import the grain clip into your Media Pool, place it on a track above your footage on the Edit page, and set its Composite Mode to Overlay or Screen. Adjust opacity to taste.'],
      ['Are these grain packs free?', 'Yes, every grain and overlay pack listed here is free to download from its creator.']
    ]
  }
];

const CAT_HUBS_BY_CAT = {
  'LUT Pack': '/luts/',
  'PowerGrade': '/powergrades/',
  'Official LUT': '/official-luts/',
  'Grain Pack': '/film-grain/'
};

// Camera metadata for richer copy on camera hubs.
const CAM_INFO = {
  Sony: { slug: 'sony', log: 'S-Log3 / S-Gamut3' },
  Canon: { slug: 'canon', log: 'Canon Log / C-Log' },
  Nikon: { slug: 'nikon', log: 'N-Log' },
  Panasonic: { slug: 'panasonic', log: 'V-Log / V-Log L' },
  DJI: { slug: 'dji', log: 'D-Log' },
  RED: { slug: 'red', log: 'IPP2 / REDLogFilm' },
  ARRI: { slug: 'arri', log: 'Log-C' },
  Fujifilm: { slug: 'fujifilm', log: 'F-Log' },
  GoPro: { slug: 'gopro', log: 'Protune / GP-Log' },
  Blackmagic: { slug: 'blackmagic', log: 'Blackmagic Film / Gen 5' }
};

const CAM_HUB_SLUGS = {}; // filled below for cameras that get a hub

const CAMERA_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.3-1.9a1 1 0 0 1 .83-.44h5.74a1 1 0 0 1 .83.44L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="12.4" r="3.4"/></svg>';

function hubPage(cfg) {
  const list = cfg.items;
  const rows = list.map(rowHtml).join('\n');

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cfg.h1,
    numberOfItems: list.length,
    itemListElement: list.map(function (g, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        url: `https://resolve.directory/grade/${g.slug}/`,
        name: g.name
      };
    })
  };
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cfg.title,
    description: cfg.desc,
    url: `https://resolve.directory${cfg.path}`
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'resolve.directory', item: 'https://resolve.directory/' },
      { '@type': 'ListItem', position: 2, name: cfg.crumb || cfg.h1, item: `https://resolve.directory${cfg.path}` }
    ]
  };
  const jsonld = [collection, itemList, breadcrumb];
  if (cfg.faq && cfg.faq.length) {
    jsonld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: cfg.faq.map(function (qa) {
        return {
          '@type': 'Question',
          name: qa[0],
          acceptedAnswer: { '@type': 'Answer', text: qa[1].replace(/&amp;/g, '&') }
        };
      })
    });
  }

  const faqHtml = (cfg.faq && cfg.faq.length)
    ? `\n  <section class="hub-faq">\n    <h2>Frequently asked</h2>\n${cfg.faq.map(function (qa) {
        return `    <div class="faq-item">\n      <h3>${qa[0]}</h3>\n      <p>${qa[1]}</p>\n    </div>`;
      }).join('\n')}\n  </section>`
    : '';

  const relatedHtml = cfg.related && cfg.related.length
    ? `\n  <nav class="hub-related">\n    <h2>Related collections</h2>\n    ${cfg.related.join('\n    ')}\n  </nav>`
    : '';

  const iconColor = cfg.iconColor || 'var(--text-dim)';
  const iconTile = cfg.icon
    ? `<div class="detail-head hub-head">
    <div class="detail-icon" style="color:${iconColor}">${cfg.icon}</div>
    <div class="detail-title-row">
      <h1 class="detail-title">${cfg.h1}</h1>
    </div>
  </div>`
    : `<h1 class="hub-h1">${cfg.h1}</h1>`;

  return `<!DOCTYPE html>
<html lang="en">
${head({ title: cfg.title, desc: cfg.desc, canonical: `https://resolve.directory${cfg.path}`, ogTitle: cfg.h1, jsonld })}
<body>

${HEADER}

<div class="detail-wrap hub-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    <span>${escapeHtml(cfg.crumb || cfg.h1)}</span>
  </div>

  ${iconTile}
  <p class="hub-intro">${cfg.intro}</p>

  <div class="hub-count">${list.length} free ${list.length === 1 ? 'resource' : 'resources'}</div>

  <div class="hub-list">
${rows}
  </div>${faqHtml}${relatedHtml}
</div>

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

/* ---------- pre-compute camera hubs (so resource pages can link to them) ---------- */

const camCounts = {};
grades.forEach(function (g) {
  if (g.cam && g.cam !== 'Any') camCounts[g.cam] = (camCounts[g.cam] || 0) + 1;
});

const camHubCfgs = [];
Object.keys(camCounts).forEach(function (cam) {
  if (camCounts[cam] < 2) return;
  const info = CAM_INFO[cam] || { slug: slugify(cam), log: 'log' };
  CAM_HUB_SLUGS[cam] = info.slug;
  camHubCfgs.push({ cam: cam, info: info });
});

/* ---------- generate resource pages ---------- */

grades.forEach(function (g) {
  writePage(path.join('grade', g.slug), pageHtml(g));
});

/* ---------- generate category hubs ---------- */

const generatedHubs = []; // { path, priority }

CAT_HUBS.forEach(function (cfg) {
  cfg.items = grades.filter(cfg.match);
  if (cfg.items.length === 0) return;
  cfg.icon = categoryIcons[cfg.repCat] || defaultIcon;
  cfg.iconColor = categoryColors[cfg.repCat] || 'var(--text-dim)';
  cfg.crumb = cfg.h1.replace(' for DaVinci Resolve', '');
  cfg.related = CAT_HUBS
    .filter(function (o) { return o.path !== cfg.path && grades.some(o.match); })
    .map(function (o) { return `<a href="${o.path}">${o.h1}</a>`; });
  cfg.related.push('<a href="/guides/how-to-install-luts-in-davinci-resolve/">How to install a LUT in DaVinci Resolve</a>');
  writePage(cfg.path, hubPage(cfg));
  generatedHubs.push({ path: cfg.path, priority: '0.8' });
});

/* ---------- generate camera hubs (>= 2 resources) ---------- */

camHubCfgs.forEach(function (c) {
  const cam = c.cam;
  const info = c.info;
  const items = grades.filter(function (g) { return g.cam === cam; });
  const cfg = {
    path: `/camera/${info.slug}/`,
    items: items,
    h1: `Free ${cam} LUTs for DaVinci Resolve`,
    crumb: `${cam} LUTs`,
    icon: CAMERA_ICON,
    iconColor: 'var(--text-dim)',
    title: `Free ${cam} LUTs & Grades for DaVinci Resolve (${info.log}) | resolve.directory`,
    desc: `Free ${cam} LUTs and PowerGrades for DaVinci Resolve — convert ${info.log} footage to Rec.709 and add a cinematic look, all gathered in one place.`,
    intro: `Free color resources for ${cam} shooters. Whether you're converting ${info.log} footage to a clean Rec.709 base or adding a cinematic look on top, these are the free ${cam} LUTs and grades collected in the directory — official conversion LUTs and creative packs alike.`,
    faq: [
      [`How do I convert ${cam} log footage in DaVinci Resolve?`, `Start with an official ${cam} ${info.log} to Rec.709 conversion LUT to get a neutral, correct base, then build your creative grade on top of it.`],
      [`Are these ${cam} LUTs free?`, `Yes — every ${cam} LUT and grade listed here is free to download from its creator or from the manufacturer.`],
      [`What format are they?`, `Mostly .cube 3D LUTs, which DaVinci Resolve reads natively in both the free and Studio versions.`]
    ],
    related: []
  };
  // relate to other camera hubs + the LUTs hub
  cfg.related = camHubCfgs
    .filter(function (o) { return o.cam !== cam; })
    .slice(0, 4)
    .map(function (o) { return `<a href="/camera/${o.info.slug}/">Free ${o.cam} LUTs</a>`; });
  cfg.related.push('<a href="/luts/">All free LUTs for DaVinci Resolve</a>');
  writePage(cfg.path, hubPage(cfg));
  generatedHubs.push({ path: cfg.path, priority: '0.7' });
});

/* ---------- guide article + guides index ---------- */

function guideInstallLutPage() {
  const canonical = 'https://resolve.directory/guides/how-to-install-luts-in-davinci-resolve/';
  const title = 'How to Install a LUT in DaVinci Resolve (Step by Step) | resolve.directory';
  const desc = 'A simple step-by-step guide to installing and applying LUTs in DaVinci Resolve — where the LUT folder is, how to import .cube files, and how to apply them on the Color page.';
  const camLinks = camHubCfgs.map(function (o) {
    return `<a href="/camera/${o.info.slug}/">${o.cam}</a>`;
  }).join('\n      ');

  const howto = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to install a LUT in DaVinci Resolve',
    description: desc,
    step: [
      { '@type': 'HowToStep', name: 'Open the LUT folder', text: 'In DaVinci Resolve go to Project Settings → Color Management and click "Open LUT Folder".' },
      { '@type': 'HowToStep', name: 'Copy your .cube files', text: 'Copy the downloaded .cube LUT files into that folder. You can create subfolders to stay organized.' },
      { '@type': 'HowToStep', name: 'Refresh the LUT list', text: 'Back in Color Management click "Update Lists", or restart DaVinci Resolve, so it picks up the new LUTs.' },
      { '@type': 'HowToStep', name: 'Apply the LUT', text: 'On the Color page, right-click a clip or node, choose LUTs, and pick your LUT. You can also drag it onto a node from the LUT browser.' }
    ]
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ['Where is the LUT folder in DaVinci Resolve?', 'The quickest way is Project Settings → Color Management → Open LUT Folder, which opens the exact folder Resolve scans for LUTs.'],
      ['Why does my LUT not show up?', 'Make sure it is a .cube file inside the LUT folder, then click Update Lists in Color Management or restart Resolve so it re-scans the folder.'],
      ['Do LUTs work in the free version of DaVinci Resolve?', 'Yes. 3D .cube LUTs work the same in the free version and in DaVinci Resolve Studio.']
    ].map(function (qa) {
      return { '@type': 'Question', name: qa[0], acceptedAnswer: { '@type': 'Answer', text: qa[1] } };
    })
  };

  const body = `<div class="detail-wrap hub-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    <a href="/guides/">Guides</a>
    <span>/</span>
    <span>Install a LUT</span>
  </div>

  <h1 class="hub-h1">How to install a LUT in DaVinci Resolve</h1>
  <p class="hub-intro">A LUT (Look-Up Table) is a small file that remaps the color and contrast of your footage — either to convert log footage to a standard Rec.709 base, or to apply a creative "look" in one click. Here's exactly how to install and apply one in DaVinci Resolve. It takes about a minute.</p>

  <section class="guide-prose">
    <h2>1. Download your LUT</h2>
    <p>Grab a <code>.cube</code> file — the standard 3D LUT format Resolve reads natively. Browse the <a href="/luts/">free LUT packs</a> or the <a href="/official-luts/">official camera log LUTs</a> in the directory if you need one.</p>

    <h2>2. Open the LUT folder</h2>
    <p>In DaVinci Resolve, open <strong>Project Settings</strong> (the gear icon, bottom right) → <strong>Color Management</strong>, then click <strong>Open LUT Folder</strong>. This opens the exact folder Resolve scans for LUTs, so you don't have to hunt for it manually.</p>

    <h2>3. Copy the .cube files in</h2>
    <p>Drop your downloaded <code>.cube</code> files into that folder. You can make subfolders (for example one per camera or per pack) to keep things tidy — Resolve shows them as groups.</p>

    <h2>4. Refresh the list</h2>
    <p>Back in Color Management, click <strong>Update Lists</strong>. If the LUT still doesn't appear, fully restart DaVinci Resolve so it re-scans the folder.</p>

    <h2>5. Apply it on the Color page</h2>
    <p>Go to the <strong>Color</strong> page, right-click a clip's thumbnail or a node, choose <strong>LUTs</strong>, and pick your LUT. You can also open the <strong>LUTs</strong> browser in the top-left and drag a LUT straight onto a node. Put the LUT on its own node so you can dial back its strength with the node's Key Output gain.</p>

    <h2>Log footage? Start with the official LUT</h2>
    <p>If you shot in a log profile (S-Log, C-Log, N-Log, V-Log, D-Log, Log-C), apply your camera's official conversion LUT first to get a correct Rec.709 base, then build your creative grade on top. Jump to your camera:</p>
    <div class="guide-cams">
      ${camLinks}
    </div>
  </section>

  <section class="hub-faq">
    <h2>Frequently asked</h2>
    <div class="faq-item"><h3>Where is the LUT folder in DaVinci Resolve?</h3><p>The quickest way is Project Settings → Color Management → Open LUT Folder, which opens the exact folder Resolve scans for LUTs.</p></div>
    <div class="faq-item"><h3>Why does my LUT not show up?</h3><p>Make sure it's a .cube file inside the LUT folder, then click Update Lists in Color Management or restart Resolve so it re-scans the folder.</p></div>
    <div class="faq-item"><h3>Do LUTs work in the free version of DaVinci Resolve?</h3><p>Yes. 3D .cube LUTs work the same in the free version and in DaVinci Resolve Studio.</p></div>
  </section>

  <nav class="hub-related">
    <h2>Keep exploring</h2>
    <a href="/luts/">Free LUTs for DaVinci Resolve</a>
    <a href="/powergrades/">Free PowerGrades</a>
    <a href="/official-luts/">Official camera log LUTs</a>
  </nav>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
${head({ title, desc, canonical, ogTitle: 'How to install a LUT in DaVinci Resolve', jsonld: [howto, faq] })}
<body>

${HEADER}

${body}

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

function guideInstallPowerGradePage() {
  const canonical = 'https://resolve.directory/guides/how-to-install-a-powergrade-in-davinci-resolve/';
  const title = 'How to Install a PowerGrade in DaVinci Resolve (Step by Step) | resolve.directory';
  const desc = 'A simple step-by-step guide to importing and applying PowerGrades (.drx) in DaVinci Resolve — where the PowerGrade album is, how to import stills, and how to apply the node tree to your clips.';

  const howto = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to install a PowerGrade in DaVinci Resolve',
    description: desc,
    step: [
      { '@type': 'HowToStep', name: 'Open the Gallery on the Color page', text: 'In DaVinci Resolve go to the Color page and open the Gallery (top-left button).' },
      { '@type': 'HowToStep', name: 'Show the PowerGrade album', text: 'Click the "..." menu in the Gallery (or right-click the album list) and make sure the PowerGrade 1 album is visible, then select it.' },
      { '@type': 'HowToStep', name: 'Import the .drx or .dpx still', text: 'Right-click inside the PowerGrade album and choose "Import", then select the downloaded .drx file (or the still that came with the pack).' },
      { '@type': 'HowToStep', name: 'Apply it to a clip', text: 'Select your clip, then middle-click the PowerGrade still (or right-click it and choose "Apply Grade") to copy its whole node tree onto the clip.' }
    ]
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ['What is the difference between a PowerGrade and a LUT?', 'A LUT is a single "baked" color transform. A PowerGrade is a full DaVinci Resolve node tree — every node stays editable, so you can adjust each part of the look after applying it.'],
      ['What file format is a PowerGrade?', 'Usually a .drx file (a Resolve grade export), sometimes shared as a still image with the grade embedded. Both import into the Gallery the same way.'],
      ['Do PowerGrades work in the free version of DaVinci Resolve?', 'Yes — PowerGrades work in the free version, as long as the nodes inside do not use Studio-only OFX plugins.']
    ].map(function (qa) {
      return { '@type': 'Question', name: qa[0], acceptedAnswer: { '@type': 'Answer', text: qa[1] } };
    })
  };

  const body = `<div class="detail-wrap hub-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    <a href="/guides/">Guides</a>
    <span>/</span>
    <span>Install a PowerGrade</span>
  </div>

  <h1 class="hub-h1">How to install a PowerGrade in DaVinci Resolve</h1>
  <p class="hub-intro">A PowerGrade is a complete DaVinci Resolve node tree saved as a preset — unlike a LUT, every node stays fully editable after you apply it. Here's how to import one and apply it to your footage. It takes about a minute.</p>

  <section class="guide-prose">
    <h2>1. Download your PowerGrade</h2>
    <p>Grab a <code>.drx</code> file (or a still with the grade embedded). Browse the <a href="/powergrades/">free PowerGrades</a> in the directory if you need one — they're all free downloads from their creators.</p>

    <h2>2. Open the Gallery on the Color page</h2>
    <p>Go to the <strong>Color</strong> page and click the <strong>Gallery</strong> button (top-left). This is where Resolve stores stills and grade presets.</p>

    <h2>3. Show the PowerGrade album</h2>
    <p>In the Gallery's album list, make sure <strong>PowerGrade 1</strong> is visible — if it isn't, click the <strong>…</strong> menu and enable it. Anything saved in a PowerGrade album is available in <em>every</em> project, not just the current one.</p>

    <h2>4. Import the .drx file</h2>
    <p>Right-click inside the PowerGrade album and choose <strong>Import</strong>, then select your downloaded <code>.drx</code> file. The grade appears as a still in the album.</p>

    <h2>5. Apply it to a clip</h2>
    <p>Select a clip in the timeline, then <strong>middle-click</strong> the PowerGrade still (or right-click → <strong>Apply Grade</strong>). The full node tree is copied onto your clip — open the node editor and tweak any node to taste.</p>

    <h2>Tip: fix your base first</h2>
    <p>PowerGrades are built on the assumption of a balanced starting image. If you shot log, do your <a href="/guides/how-to-install-luts-in-davinci-resolve/">conversion to Rec.709</a> or color-manage the project first, then apply the PowerGrade on top.</p>
  </section>

  <section class="hub-faq">
    <h2>Frequently asked</h2>
    <div class="faq-item"><h3>What is the difference between a PowerGrade and a LUT?</h3><p>A LUT is a single "baked" color transform. A PowerGrade is a full Resolve node tree — every node stays editable, so you can adjust each part of the look after applying it.</p></div>
    <div class="faq-item"><h3>What file format is a PowerGrade?</h3><p>Usually a .drx file (a Resolve grade export), sometimes shared as a still image with the grade embedded. Both import into the Gallery the same way.</p></div>
    <div class="faq-item"><h3>Do PowerGrades work in the free version of DaVinci Resolve?</h3><p>Yes — PowerGrades work in the free version, as long as the nodes inside don't use Studio-only OFX plugins.</p></div>
  </section>

  <nav class="hub-related">
    <h2>Keep exploring</h2>
    <a href="/powergrades/">Free PowerGrades for DaVinci Resolve</a>
    <a href="/guides/how-to-install-luts-in-davinci-resolve/">How to install a LUT</a>
    <a href="/luts/">Free LUTs for DaVinci Resolve</a>
  </nav>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
${head({ title, desc, canonical, ogTitle: 'How to install a PowerGrade in DaVinci Resolve', jsonld: [howto, faq] })}
<body>

${HEADER}

${body}

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

function guideFilmGrainPage() {
  const canonical = 'https://resolve.directory/guides/how-to-add-film-grain-in-davinci-resolve/';
  const title = 'How to Add Film Grain in DaVinci Resolve (Free, Step by Step) | resolve.directory';
  const desc = 'How to add real film grain to your footage in DaVinci Resolve for free — using scanned grain overlay plates with composite modes, plus how to dial in the right amount.';

  const howto = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to add film grain in DaVinci Resolve',
    description: desc,
    step: [
      { '@type': 'HowToStep', name: 'Download a grain plate', text: 'Download a free scanned film grain plate (a video clip of real film grain on a neutral gray background).' },
      { '@type': 'HowToStep', name: 'Import it to the Media Pool', text: 'Drag the grain clip into your Media Pool in DaVinci Resolve.' },
      { '@type': 'HowToStep', name: 'Place it on a track above', text: 'On the Edit page, place the grain clip on a video track above your footage and stretch it across the timeline.' },
      { '@type': 'HowToStep', name: 'Set the composite mode', text: 'Select the grain clip and in the Inspector set its Composite Mode to Overlay (or Soft Light for a subtler effect).' },
      { '@type': 'HowToStep', name: 'Dial in the amount', text: 'Lower the clip opacity until the grain feels organic — usually somewhere between 20% and 50%.' }
    ]
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ['Can I add film grain in the free version of DaVinci Resolve?', 'Yes. The overlay method works entirely in the free version — you only need a grain plate clip and a composite mode. The built-in Film Grain OFX effect is Studio-only.'],
      ['Why use real scanned grain instead of a plugin?', 'Scanned plates come from real film stocks, so the grain structure, size and movement are organic instead of procedurally generated.'],
      ['Should grain go before or after the grade?', 'Grain goes on top of (after) your finished grade, so it sits over the final image the way it would on printed film.']
    ].map(function (qa) {
      return { '@type': 'Question', name: qa[0], acceptedAnswer: { '@type': 'Answer', text: qa[1] } };
    })
  };

  const body = `<div class="detail-wrap hub-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    <a href="/guides/">Guides</a>
    <span>/</span>
    <span>Add film grain</span>
  </div>

  <h1 class="hub-h1">How to add film grain in DaVinci Resolve (free)</h1>
  <p class="hub-intro">Real film grain instantly makes digital footage feel more cinematic — it adds texture, hides the "too clean" digital look and ties a grade together. Here's the free way to do it in DaVinci Resolve using scanned grain plates.</p>

  <section class="guide-prose">
    <h2>1. Download a grain plate</h2>
    <p>A grain plate is a video clip of real, scanned film grain on a neutral gray background. Grab one from the <a href="/film-grain/">free film grain packs</a> in the directory — several are scanned from real 35mm and 16mm stocks in 4K.</p>

    <h2>2. Import it into the Media Pool</h2>
    <p>Drag the grain clip into your <strong>Media Pool</strong> like any other footage.</p>

    <h2>3. Put it on a track above your footage</h2>
    <p>On the <strong>Edit</strong> page, place the grain clip on a video track <em>above</em> your footage. If your timeline is longer than the plate, just duplicate the clip along the track.</p>

    <h2>4. Set the composite mode to Overlay</h2>
    <p>Select the grain clip, open the <strong>Inspector</strong>, and change <strong>Composite Mode</strong> to <strong>Overlay</strong>. Because the plate is a neutral gray, only the grain texture shows through. <strong>Soft Light</strong> gives a subtler version of the same effect.</p>

    <h2>5. Dial in the opacity</h2>
    <p>Lower the grain clip's <strong>Opacity</strong> in the Inspector until it feels organic rather than noisy — usually between 20% and 50% depending on the plate and how filmic you want the image.</p>

    <h2>Grain always goes last</h2>
    <p>Add grain on top of your <em>finished</em> grade — on real film, grain lives in the print itself, so it should sit over the final image. If you're still building your look, start with a <a href="/powergrades/">free PowerGrade</a> or a <a href="/luts/">free LUT</a>, then finish with grain.</p>
  </section>

  <section class="hub-faq">
    <h2>Frequently asked</h2>
    <div class="faq-item"><h3>Can I add film grain in the free version of DaVinci Resolve?</h3><p>Yes. The overlay method works entirely in the free version — you only need a grain plate clip and a composite mode. The built-in Film Grain OFX effect is Studio-only.</p></div>
    <div class="faq-item"><h3>Why use real scanned grain instead of a plugin?</h3><p>Scanned plates come from real film stocks, so the grain structure, size and movement are organic instead of procedurally generated.</p></div>
    <div class="faq-item"><h3>Should grain go before or after the grade?</h3><p>Grain goes on top of (after) your finished grade, so it sits over the final image the way it would on printed film.</p></div>
  </section>

  <nav class="hub-related">
    <h2>Keep exploring</h2>
    <a href="/film-grain/">Free film grain for DaVinci Resolve</a>
    <a href="/guides/how-to-install-a-powergrade-in-davinci-resolve/">How to install a PowerGrade</a>
    <a href="/luts/">Free LUTs for DaVinci Resolve</a>
  </nav>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
${head({ title, desc, canonical, ogTitle: 'How to add film grain in DaVinci Resolve (free)', jsonld: [howto, faq] })}
<body>

${HEADER}

${body}

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

/* ---------- data-driven guide system ----------
   Add a guide by dropping an object into NEW_GUIDES. Each one becomes a
   fully SEO-optimized page (HowTo + FAQ + Breadcrumb JSON-LD, internal links)
   and is auto-listed on the /guides/ index and in the sitemap. */

const NEW_GUIDES = [
  {
    slug: 'how-to-color-grade-in-davinci-resolve',
    crumb: 'Color grade (beginner)',
    title: 'How to Color Grade in DaVinci Resolve (Beginner Guide) | resolve.directory',
    h1: 'How to color grade in DaVinci Resolve',
    desc: 'A beginner-friendly color grading workflow for DaVinci Resolve — balance the shot, convert log to Rec.709, add contrast and a creative look, then match your clips. Works in the free version.',
    blurb: 'The full beginner workflow: balance, convert, contrast, creative look and match — step by step.',
    intro: 'Color grading looks intimidating, but almost every good grade follows the same order: get the image neutral and correct first, then build a look on top. Here is a simple, repeatable workflow you can use on the DaVinci Resolve Color page — all of it works in the free version.',
    howtoSteps: [
      { name: 'Balance the shot', text: 'Use the primary color wheels and scopes to set correct exposure and white balance so the image is neutral before any look.' },
      { name: 'Normalize log footage', text: 'If you shot log, add a Color Space Transform or camera LUT on its own node to convert to Rec.709.' },
      { name: 'Add contrast and saturation', text: 'On a new node, add contrast with the curve or the Contrast/Pivot controls and lift saturation slightly.' },
      { name: 'Create your look', text: 'On another node, push color into the shadows and highlights for a creative look — for example teal shadows and warm skin.' },
      { name: 'Match the rest of your clips', text: 'Grade one hero shot, then use Shot Match or copy the grade to keep every clip consistent.' }
    ],
    sections: [
      { h2: '1. Work left to right with nodes', html: '<p>Every grade lives on the <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node tree</a> in the bottom-right of the Color page. Keep each job on its own node — one for balance, one for conversion, one for contrast, one for the look. That way you can turn any step off or dial it back later without starting over.</p>' },
      { h2: '2. Balance before you get creative', html: '<p>Open the <strong>Waveform</strong> and <strong>Parade</strong> <a href="/guides/how-to-read-scopes-in-davinci-resolve/">scopes</a>. Use the <strong>Lift / Gamma / Gain</strong> wheels to set your blacks near the bottom and highlights near the top without clipping, and balance the red, green and blue channels so a neutral object reads neutral. Do this by eye <em>and</em> by scope — the scopes do not lie.</p>' },
      { h2: '3. Convert log footage to Rec.709', html: '<p>Log footage looks flat and grey on purpose. Add a <strong>Color Space Transform</strong> node (or your <a href="/official-luts/">camera\'s official log LUT</a>) to bring it to a correct Rec.709 base before grading. Full walkthrough: <a href="/guides/how-to-convert-log-to-rec709-in-davinci-resolve/">converting log to Rec.709</a>.</p>' },
      { h2: '4. Add contrast, then a look', html: '<p>On a fresh node, add contrast with the <a href="/guides/how-to-use-curves-in-davinci-resolve/">Custom curve</a> (a gentle S-shape) and nudge saturation. Then on another node build the creative look — a <a href="/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/">teal-and-orange</a> split, a warm nostalgic tone, or a cold thriller feel.</p>' },
      { h2: '5. Use a PowerGrade or LUT to shortcut it', html: '<p>Once you understand the steps, a ready-made <a href="/powergrades/">PowerGrade</a> or <a href="/luts/">LUT</a> from the directory can get you 80% of the way in one click — then you fine-tune. That is the fastest way to learn what a good grade is actually doing.</p>' }
    ],
    faqs: [
      ['Can you color grade in the free version of DaVinci Resolve?', 'Yes. The entire primary and secondary color grading toolset — wheels, curves, nodes, scopes, Color Space Transform and LUTs — is available in the free version. The main paid extras are noise reduction, HDR tools and some OFX effects.'],
      ['What is the difference between color correction and color grading?', 'Color correction makes the image technically neutral and consistent (exposure and white balance). Color grading is the creative step on top — the mood, palette and look. In practice you do correction first, then grading.'],
      ['What order should I grade in?', 'Balance and correct exposure and white balance first, normalize log footage to Rec.709, add contrast and saturation, then build your creative look, and finally match all your shots to each other.']
    ],
    related: [
      ['/guides/how-to-convert-log-to-rec709-in-davinci-resolve/', 'Convert log to Rec.709'],
      ['/guides/how-to-get-a-cinematic-look-in-davinci-resolve/', 'Get a cinematic look'],
      ['/luts/', 'Free LUTs for DaVinci Resolve']
    ]
  },
  {
    slug: 'how-to-convert-log-to-rec709-in-davinci-resolve',
    crumb: 'Log to Rec.709',
    title: 'How to Convert Log to Rec.709 in DaVinci Resolve (2 Ways) | resolve.directory',
    h1: 'How to convert log to Rec.709 in DaVinci Resolve',
    desc: 'Two clean ways to convert log footage to Rec.709 in DaVinci Resolve — the Color Space Transform node and the official camera LUT — so you start every grade from a correct base.',
    blurb: 'Two clean ways to normalize flat log footage — Color Space Transform vs the official camera LUT.',
    intro: 'Log footage (S-Log, C-Log, N-Log, V-Log, D-Log, Log-C) is recorded flat and desaturated to hold more dynamic range. Before you grade, you convert it to the standard Rec.709 display space. There are two reliable ways to do it in DaVinci Resolve, and both work in the free version.',
    howtoSteps: [
      { name: 'Add a node for the conversion', text: 'On the Color page, add a serial node dedicated to the log-to-Rec.709 conversion so you can keep it separate from your grade.' },
      { name: 'Add a Color Space Transform', text: 'Open the Effects/OpenFX panel, drag Color Space Transform onto the node.' },
      { name: 'Set input and output', text: 'Set Input Color Space and Gamma to your camera log profile, and Output to Rec.709 / Gamma 2.4.' },
      { name: 'Grade after the conversion', text: 'Add your contrast, balance and creative look on nodes after the conversion node.' }
    ],
    sections: [
      { h2: 'Method 1 — Color Space Transform (recommended)', html: '<p>Add a node, then apply the <strong>Color Space Transform</strong> ResolveFX to it. Set <strong>Input Color Space</strong> and <strong>Input Gamma</strong> to match your camera (for example <em>Sony S-Gamut3.Cine / S-Log3</em>), and set <strong>Output Color Space</strong> to <strong>Rec.709</strong> and <strong>Output Gamma</strong> to <strong>Gamma 2.4</strong>. This is a mathematical conversion, so it is precise and easy to tweak.</p>' },
      { h2: 'Method 2 — the official camera LUT', html: '<p>Drop your camera\'s official conversion LUT onto a node instead. It is a one-click "baked" version of the same idea. Grab the correct one from the <a href="/official-luts/">official camera log LUT library</a> and see <a href="/guides/how-to-install-luts-in-davinci-resolve/">how to install a LUT</a>. LUTs are convenient but less flexible than a Color Space Transform.</p>' },
      { h2: 'Put the conversion on its own node', html: '<p>Whichever method you use, keep the conversion on a dedicated node <em>before</em> your grade. That way you can balance the shot before it and build the look after it, and you can disable the conversion to check the raw log at any time.</p>' },
      { h2: 'Or color-manage the whole project', html: '<p>For mixed cameras, switch <strong>Project Settings → Color Management</strong> to <strong>DaVinci YRGB Color Managed</strong> and set the timeline to Rec.709. Resolve then converts every clip automatically. See <a href="/guides/davinci-resolve-color-management-settings-explained/">color management settings explained</a>.</p>' }
    ],
    faqs: [
      ['Should I use a LUT or Color Space Transform for log conversion?', 'Color Space Transform is generally cleaner and more flexible because it is a precise math conversion you can adjust. Official LUTs are faster and fine for most work, but they bake in a fixed tone curve.'],
      ['What output gamma should I use for Rec.709?', 'Gamma 2.4 is standard for video viewed on a calibrated Rec.709 monitor. If your footage looks too dark on typical web and phone screens, some people use Gamma 2.2 instead.'],
      ['Why does my footage look too contrasty after conversion?', 'That usually means the input color space or gamma does not match how the footage was shot. Double-check your camera\'s exact log profile and set the input to match it.']
    ],
    related: [
      ['/official-luts/', 'Official camera log LUTs'],
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade (beginner)'],
      ['/guides/davinci-resolve-color-management-settings-explained/', 'Color management explained']
    ]
  },
  {
    slug: 'how-to-get-a-cinematic-look-in-davinci-resolve',
    crumb: 'Cinematic look',
    title: 'How to Get a Cinematic Look in DaVinci Resolve (Free) | resolve.directory',
    h1: 'How to get a cinematic look in DaVinci Resolve',
    desc: 'The practical steps behind a cinematic look in DaVinci Resolve — correct exposure, log conversion, soft contrast, color separation, skin tones, grain and a subtle vignette. Free-version friendly.',
    blurb: 'What actually makes footage look cinematic: contrast, color separation, skin tones, grain and a vignette.',
    intro: '"Cinematic" is not one slider — it is a stack of small, deliberate choices. Here is what actually creates that filmic feel in DaVinci Resolve, and how to build it up in order. None of this requires DaVinci Resolve Studio.',
    sections: [
      { h2: 'Start from a correct image', html: '<p>A cinematic grade falls apart on a badly exposed or wrongly balanced shot. <a href="/guides/how-to-color-grade-in-davinci-resolve/">Balance the image</a> and, if you shot log, <a href="/guides/how-to-convert-log-to-rec709-in-davinci-resolve/">convert to Rec.709</a> first. Everything below sits on top of that.</p>' },
      { h2: 'Soft, filmic contrast', html: '<p>Film does not clip to pure black. Use the <a href="/guides/how-to-use-curves-in-davinci-resolve/">Custom curve</a> to add a gentle S-shape, then lift the very bottom of the curve slightly so your shadows sit a touch above pure black. That milky "film black" is a big part of the look.</p>' },
      { h2: 'Separate your colors', html: '<p>Push cool tones into the shadows and warm tones into the highlights so the palette is not muddy. The classic version is <a href="/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/">teal and orange</a>, but any complementary split reads as intentional and cinematic.</p>' },
      { h2: 'Protect skin tones', html: '<p>Whatever you do to the palette, keep skin looking healthy. Use a <a href="/guides/how-to-fix-skin-tones-in-davinci-resolve/">qualifier or the skin-tone line on the vectorscope</a> to hold faces near natural while the rest of the frame gets stylized.</p>' },
      { h2: 'Grain and a subtle vignette', html: '<p>Finish with a light layer of <a href="/guides/how-to-add-film-grain-in-davinci-resolve/">film grain</a> to break up digital cleanliness, and a very subtle <a href="/guides/how-to-add-a-vignette-in-davinci-resolve/">vignette</a> to pull the eye to your subject. Keep both gentle — the second someone notices them, they are too strong.</p>' },
      { h2: 'Shortcut it with a PowerGrade', html: '<p>A well-built <a href="/powergrades/">PowerGrade</a> already contains this whole stack as editable nodes, so you can apply it and then adjust each part. It is also the best way to reverse-engineer how a look was made.</p>' }
    ],
    faqs: [
      ['What makes footage look cinematic?', 'Mostly: correct exposure, soft film-like contrast that does not crush the blacks, deliberate color separation, natural skin tones, a light grain texture, and a subtle vignette — plus a widescreen aspect ratio and motion-blur-friendly shutter speed at the shooting stage.'],
      ['Do I need DaVinci Resolve Studio for a cinematic look?', 'No. Curves, color wheels, qualifiers, vignettes and LUTs are all in the free version. Studio adds noise reduction and the built-in Film Grain OFX, but you can add grain for free using overlay plates.'],
      ['Why does my grade look fake or over-done?', 'Usually the contrast or color push is too strong, or skin tones drifted. Dial the whole look node back with its Key Output gain and re-check faces on the vectorscope.']
    ],
    related: [
      ['/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/', 'Teal and orange look'],
      ['/guides/how-to-add-film-grain-in-davinci-resolve/', 'Add film grain'],
      ['/powergrades/', 'Free PowerGrades']
    ]
  },
  {
    slug: 'davinci-resolve-color-management-settings-explained',
    crumb: 'Color management',
    title: 'DaVinci Resolve Color Management Settings Explained | resolve.directory',
    h1: 'DaVinci Resolve color management settings explained',
    desc: 'What DaVinci YRGB vs DaVinci YRGB Color Managed actually do, and how to set color management for LUT-based grading or automatic RCM. Plain-English guide.',
    blurb: 'DaVinci YRGB vs Color Managed (RCM), explained in plain English — and which to pick.',
    intro: 'The Color Management panel in Project Settings decides how DaVinci Resolve interprets your footage before you grade it. Getting it right once saves a lot of confusion. Here is what the main options do and when to use each.',
    sections: [
      { h2: 'Where to find it', html: '<p>Open <strong>Project Settings</strong> (gear icon, bottom-right) → <strong>Color Management</strong>. The key control is <strong>Color science</strong> at the top.</p>' },
      { h2: 'DaVinci YRGB — manual', html: '<p>The classic mode. Resolve does <em>not</em> auto-convert anything; you handle log conversion yourself with a <a href="/guides/how-to-convert-log-to-rec709-in-davinci-resolve/">Color Space Transform or a LUT</a>. Choose this if you want full manual control or you are following LUT-based tutorials.</p>' },
      { h2: 'DaVinci YRGB Color Managed (RCM) — automatic', html: '<p>You tell Resolve your <strong>Input</strong> color space (or set it per clip), a <strong>Timeline</strong> color space, and an <strong>Output</strong> color space, and it converts everything automatically. Great for mixed cameras — set Timeline and Output to <strong>Rec.709 / Gamma 2.4</strong> and every clip is normalized for you.</p>' },
      { h2: 'Setting input color space per clip', html: '<p>In Color Managed mode, right-click any clip on the Color page → <strong>Input Color Space</strong> to override its camera profile. This is how you fix a clip that came in looking wrong.</p>' },
      { h2: 'Which should you pick?', html: '<p>New to grading or mixing cameras? Use <strong>Color Managed</strong> — it is the most forgiving. Following LUT tutorials or want manual control? Use <strong>DaVinci YRGB</strong> and convert with a node. Neither is "more professional"; they are just different workflows.</p>' }
    ],
    faqs: [
      ['What is the difference between DaVinci YRGB and DaVinci YRGB Color Managed?', 'DaVinci YRGB does no automatic color conversion — you convert log footage yourself with a node or LUT. DaVinci YRGB Color Managed (RCM) converts every clip from its input color space to your chosen timeline and output space automatically.'],
      ['Should I use Resolve Color Management?', 'It is a great default if you shoot on multiple cameras or are still learning, because it normalizes everything to Rec.709 for you. If you prefer manual LUT-based grading, the standard DaVinci YRGB mode gives you more direct control.'],
      ['What timeline color space should I use?', 'For standard online video, Rec.709 with Gamma 2.4 (or Gamma 2.2 for web-leaning delivery). Use a wider space only if you are mastering for HDR.']
    ],
    related: [
      ['/guides/how-to-convert-log-to-rec709-in-davinci-resolve/', 'Convert log to Rec.709'],
      ['/official-luts/', 'Official camera log LUTs'],
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade']
    ]
  },
  {
    slug: 'how-to-use-nodes-in-davinci-resolve',
    crumb: 'Nodes',
    title: 'How to Use Nodes in DaVinci Resolve (Serial, Parallel, Layer) | resolve.directory',
    h1: 'How to use nodes in DaVinci Resolve',
    desc: 'Understand the DaVinci Resolve node tree — serial, parallel and layer nodes, when to use each, and how to keep a clean, editable grade.',
    blurb: 'Serial, parallel and layer nodes — what each one does and how to keep a clean grade.',
    intro: 'The node tree is where a DaVinci Resolve grade actually lives. Once nodes click, everything else gets easier. Here is what the main node types do and how to structure a grade that stays editable.',
    sections: [
      { h2: 'What a node is', html: '<p>Each node is one adjustment layer in the bottom-right of the Color page. Signal flows left to right, node to node. Keeping one job per node — balance, conversion, contrast, look — means you can turn any step off without touching the rest.</p>' },
      { h2: 'Serial nodes (Alt/Opt + S)', html: '<p>The default. A serial node stacks <em>after</em> the previous one, so each change builds on the last. Most of your grade is a chain of serial nodes flowing left to right.</p>' },
      { h2: 'Parallel nodes', html: '<p>Parallel nodes split the signal, let you grade each branch separately, then mix them back together equally. Useful when two adjustments would fight each other if stacked — for example warming highlights and cooling shadows independently.</p>' },
      { h2: 'Layer nodes', html: '<p>Like parallel, but the lower layer sits <em>on top of</em> the upper one, so order matters. Layer nodes are handy for compositing a strong local effect over the base grade.</p>' },
      { h2: 'Keep it clean and labeled', html: '<p>Right-click a node → <strong>Node Label</strong> to name it ("Balance", "CST", "Look"). Use the node\'s <strong>Key Output gain</strong> to dial an effect back to taste. A tidy tree is what lets you — or a <a href="/powergrades/">PowerGrade</a> you downloaded — stay flexible.</p>' }
    ],
    faqs: [
      ['What is the difference between serial and parallel nodes?', 'Serial nodes stack one after another, so each builds on the previous result. Parallel nodes split the signal, grade each branch independently, then blend them back together equally.'],
      ['How do I add a node in DaVinci Resolve?', 'Right-click in the node editor, or use Alt+S (Option+S on Mac) to add a serial node after the selected one. Alt+P adds a parallel node and Alt+L adds a layer node.'],
      ['Why use multiple nodes instead of one?', 'Separating each job onto its own node keeps the grade editable — you can disable, reorder, or dial back any single step without redoing the whole thing, and it is far easier to troubleshoot.']
    ],
    related: [
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade'],
      ['/guides/how-to-install-a-powergrade-in-davinci-resolve/', 'Install a PowerGrade'],
      ['/powergrades/', 'Free PowerGrades']
    ]
  },
  {
    slug: 'how-to-use-color-wheels-in-davinci-resolve',
    crumb: 'Color wheels',
    title: 'How to Use the Color Wheels in DaVinci Resolve | resolve.directory',
    h1: 'How to use the color wheels in DaVinci Resolve',
    desc: 'Lift, Gamma, Gain and Offset explained — what each color wheel controls, how they overlap, and how to balance an image with them in DaVinci Resolve.',
    blurb: 'Lift, Gamma, Gain and Offset — what each wheel controls and how to balance with them.',
    intro: 'The primary color wheels are the heart of correction in DaVinci Resolve. Four wheels — Lift, Gamma, Gain and Offset — control different parts of the tonal range. Here is exactly what each one does.',
    sections: [
      { h2: 'Lift — the shadows', html: '<p><strong>Lift</strong> mostly moves your darkest tones. Drag the color ring to tint the shadows; use the wheel below it to raise or lower black level. Watch the bottom of the <a href="/guides/how-to-read-scopes-in-davinci-resolve/">waveform</a> so you do not crush detail.</p>' },
      { h2: 'Gain — the highlights', html: '<p><strong>Gain</strong> mostly affects your brightest tones. Use it to set your white point and tint the highlights. Keep the top of the waveform below clipping unless you deliberately want blown highlights.</p>' },
      { h2: 'Gamma — the midtones', html: '<p><strong>Gamma</strong> controls the middle of the range — where skin and most detail live. Small gamma moves have a big visual impact, so go gently, especially on faces.</p>' },
      { h2: 'Offset — everything at once', html: '<p><strong>Offset</strong> shifts the whole image together. It is perfect for overall white balance: rotate the Offset ring until a neutral object reads neutral on the <strong>Parade</strong> scope.</p>' },
      { h2: 'They overlap — go back and forth', html: '<p>Lift, Gamma and Gain influence neighbouring ranges, so adjusting one nudges the others. Expect to bounce between them a couple of times to settle a clean balance. Reset any wheel by clicking the small reset arrow above it.</p>' }
    ],
    faqs: [
      ['What do Lift, Gamma and Gain do in DaVinci Resolve?', 'Lift adjusts the shadows, Gamma adjusts the midtones, and Gain adjusts the highlights. Offset shifts the entire image at once and is ideal for overall white balance.'],
      ['What is the difference between the color wheels and the log wheels?', 'The primary wheels (Lift/Gamma/Gain) split the image into broad tonal ranges. The Log wheels (Shadow/Midtone/Highlight) have narrower, more separated ranges with less overlap, which is useful on log footage and for precise creative looks.'],
      ['How do I white balance with the color wheels?', 'Use the Offset wheel: put a neutral grey or white part of the frame on the Parade scope and rotate Offset until the red, green and blue traces line up.']
    ],
    related: [
      ['/guides/how-to-read-scopes-in-davinci-resolve/', 'How to read scopes'],
      ['/guides/how-to-use-curves-in-davinci-resolve/', 'How to use curves'],
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade']
    ]
  },
  {
    slug: 'how-to-use-curves-in-davinci-resolve',
    crumb: 'Curves',
    title: 'How to Use Curves in DaVinci Resolve (Custom & Hue Curves) | resolve.directory',
    h1: 'How to use curves in DaVinci Resolve',
    desc: 'How to use the Custom curve for contrast and the Hue vs Hue, Hue vs Sat and Lum vs Sat curves for targeted color control in DaVinci Resolve.',
    blurb: 'The Custom curve for contrast, plus Hue vs Hue / Sat / Lum for surgical color control.',
    intro: 'Curves give you the most precise control over tone and color in DaVinci Resolve. The Custom curve shapes contrast; the hue curves let you change one specific color without touching the rest. Here is how to use both.',
    sections: [
      { h2: 'The Custom curve — contrast', html: '<p>Open the <strong>Curves</strong> palette. Add a point in the highlights and pull up, add one in the shadows and pull down — a gentle <strong>S-shape</strong> that adds filmic contrast. Lift the very bottom point slightly for softer, film-like blacks.</p>' },
      { h2: 'Adjust individual channels', html: '<p>Switch the Custom curve to the <strong>Red</strong>, <strong>Green</strong> or <strong>Blue</strong> channel to tint specific tonal ranges — for example lifting blue in the shadows for a cool base while leaving highlights warm.</p>' },
      { h2: 'Hue vs Hue — shift a color', html: '<p>Use <strong>Hue vs Hue</strong> to rotate one color into another: click the color you want to change, then drag to shift its hue. Great for nudging an off orange sky or fixing a slightly green wall.</p>' },
      { h2: 'Hue vs Sat and Lum vs Sat', html: '<p><strong>Hue vs Sat</strong> boosts or mutes the saturation of one color (calm down a loud red jacket). <strong>Lum vs Sat</strong> controls saturation by brightness — pulling saturation out of the very brightest tones keeps highlights from looking neon.</p>' },
      { h2: 'Small moves win', html: '<p>Curves are powerful enough to wreck an image fast. Make small adjustments, and put big creative curve moves on their own <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node</a> so you can dial them back.</p>' }
    ],
    faqs: [
      ['How do I add contrast with curves in DaVinci Resolve?', 'On the Custom curve, pull the highlights up slightly and the shadows down to make a soft S-shape. The steeper the S, the more contrast. Lift the bottom point a touch for softer blacks.'],
      ['What does the Hue vs Hue curve do?', 'It lets you shift one specific hue to another without affecting other colors — for example turning a slightly orange sky more blue, or correcting a color cast on one object.'],
      ['What is Lum vs Sat used for?', 'Lum vs Sat changes saturation based on brightness. A common use is pulling saturation out of the brightest highlights so they do not look artificially colorful.']
    ],
    related: [
      ['/guides/how-to-use-color-wheels-in-davinci-resolve/', 'How to use color wheels'],
      ['/guides/how-to-fix-skin-tones-in-davinci-resolve/', 'Fix skin tones'],
      ['/guides/how-to-get-a-cinematic-look-in-davinci-resolve/', 'Get a cinematic look']
    ]
  },
  {
    slug: 'how-to-read-scopes-in-davinci-resolve',
    crumb: 'Scopes',
    title: 'How to Read Scopes in DaVinci Resolve (Waveform, Parade, Vectorscope) | resolve.directory',
    h1: 'How to read the scopes in DaVinci Resolve',
    desc: 'A plain-English guide to the DaVinci Resolve video scopes — Waveform, RGB Parade, Vectorscope and Histogram — and how to use them to grade accurately.',
    blurb: 'Waveform, Parade, Vectorscope and Histogram — what each one tells you and how to grade by it.',
    intro: 'Your eyes adapt and your monitor lies. The scopes are the objective truth of your image. You only need to understand four, and each answers a different question about your shot.',
    sections: [
      { h2: 'Open the scopes', html: '<p>On the Color page, click the scopes icon (top-right) to open the panel. Use the menu inside it to switch between Waveform, Parade, Vectorscope and Histogram.</p>' },
      { h2: 'Waveform — exposure', html: '<p>The <strong>Waveform</strong> plots brightness from bottom (black) to top (white), matched left-to-right to the frame. Keep detail off the very floor and ceiling to avoid crushed shadows or clipped highlights.</p>' },
      { h2: 'RGB Parade — white balance', html: '<p>The <strong>Parade</strong> shows red, green and blue separately. If a neutral part of the frame has the three channels at different heights, you have a color cast — line them up to balance. This is the single most useful scope for correction.</p>' },
      { h2: 'Vectorscope — hue and saturation', html: '<p>The <strong>Vectorscope</strong> shows color as direction (hue) and distance from center (saturation). The diagonal <strong>skin-tone line</strong> is your friend: healthy skin of any tone falls along it. More on that in <a href="/guides/how-to-fix-skin-tones-in-davinci-resolve/">fixing skin tones</a>.</p>' },
      { h2: 'Histogram — quick distribution', html: '<p>The <strong>Histogram</strong> is a fast read of how tones are spread from dark to light. It is less precise than the waveform but good for spotting clipping at a glance.</p>' }
    ],
    faqs: [
      ['Which scope should I use for white balance?', 'The RGB Parade. Find a neutral grey or white area in the frame and adjust until the red, green and blue traces sit at the same height there.'],
      ['What is the skin tone line on the vectorscope?', 'It is the diagonal indicator (around the 11 o\'clock position) that healthy skin tones of every ethnicity naturally fall along. Lining faces up to it is a reliable way to keep skin looking natural.'],
      ['How do I avoid clipping in DaVinci Resolve?', 'Watch the Waveform: keep your highlight detail below the top line and your shadow detail above the bottom line. Anything flattened against either edge has lost detail.']
    ],
    related: [
      ['/guides/how-to-use-color-wheels-in-davinci-resolve/', 'How to use color wheels'],
      ['/guides/how-to-fix-skin-tones-in-davinci-resolve/', 'Fix skin tones'],
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade']
    ]
  },
  {
    slug: 'how-to-match-shots-in-davinci-resolve',
    crumb: 'Match shots',
    title: 'How to Match Shots in DaVinci Resolve (Consistent Grade) | resolve.directory',
    h1: 'How to match shots in DaVinci Resolve',
    desc: 'How to make every clip in your edit look consistent in DaVinci Resolve — using scopes, the Shot Match tool, and copying grades between clips.',
    blurb: 'Make every clip match — scopes, the auto Shot Match tool, and copying grades between clips.',
    intro: 'Shots from different angles, times of day or cameras rarely match out of the box. Consistency is what makes an edit feel professional. Here are three ways to match your clips in DaVinci Resolve, from manual to automatic.',
    sections: [
      { h2: 'Grade a hero shot first', html: '<p>Pick your best, most representative shot and <a href="/guides/how-to-color-grade-in-davinci-resolve/">grade it fully</a>. Every other clip in the scene gets matched to this one, so it becomes your reference.</p>' },
      { h2: 'Match manually with the Parade', html: '<p>Put your hero shot and the clip you are matching side by side (use stills in the Gallery). Compare them on the <strong>RGB Parade</strong> and <a href="/guides/how-to-read-scopes-in-davinci-resolve/">match the black point, white point and mid balance</a> until the traces line up. This is the most reliable method.</p>' },
      { h2: 'Use the Shot Match tool', html: '<p>Select the clips you want to match, right-click your reference clip, and choose <strong>Shot Match to this Clip</strong>. Resolve analyzes and auto-matches them. Treat the result as a strong starting point, then clean it up by eye.</p>' },
      { h2: 'Copy a grade between clips', html: '<p>To copy a finished grade, select the target clip and <strong>middle-click</strong> the source clip\'s thumbnail — that applies its whole node tree. Or save the look as a <a href="/guides/how-to-install-a-powergrade-in-davinci-resolve/">PowerGrade</a> and apply it across the project.</p>' }
    ],
    faqs: [
      ['How does the Shot Match tool work in DaVinci Resolve?', 'Select the clips to correct, right-click the clip you want them to match, and choose "Shot Match to this Clip". Resolve analyzes both and automatically adjusts color and exposure to match. It is a great starting point but usually needs a little manual cleanup.'],
      ['How do I copy a grade from one clip to another?', 'Select the clip you want to grade, then middle-click the thumbnail of the already-graded clip. This copies its entire node tree. You can also save it as a PowerGrade in the Gallery.'],
      ['Why do my shots still not match after Shot Match?', 'Auto-matching struggles with very different exposures, mixed color temperatures or strong existing grades. Match the black and white points manually on the Parade scope first, then fine-tune.']
    ],
    related: [
      ['/guides/how-to-read-scopes-in-davinci-resolve/', 'How to read scopes'],
      ['/guides/how-to-install-a-powergrade-in-davinci-resolve/', 'Install a PowerGrade'],
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade']
    ]
  },
  {
    slug: 'how-to-fix-skin-tones-in-davinci-resolve',
    crumb: 'Skin tones',
    title: 'How to Fix Skin Tones in DaVinci Resolve | resolve.directory',
    h1: 'How to fix skin tones in DaVinci Resolve',
    desc: 'How to get natural skin tones in DaVinci Resolve using the vectorscope skin-tone line, a qualifier and Hue vs Hue — without wrecking the rest of your grade.',
    blurb: 'Natural skin every time — the vectorscope skin line, qualifiers and Hue vs Hue.',
    intro: 'Skin is the one thing viewers instantly judge. If faces look off, the whole grade looks wrong. Here is how to keep skin tones natural in DaVinci Resolve, even when the rest of your frame is heavily stylized.',
    sections: [
      { h2: 'Use the vectorscope skin-tone line', html: '<p>Open the <strong>Vectorscope</strong>. Healthy skin of every ethnicity falls along the diagonal <strong>skin-tone line</strong> — the difference between tones is mostly how far out along it they sit, not the angle. Adjust hue until your subject\'s skin trace lines up with it.</p>' },
      { h2: 'Isolate skin with a qualifier', html: '<p>To fix skin without touching everything else, add a <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node</a> and use the <strong>Qualifier</strong> (the eyedropper) to select skin. Refine the selection, enable the highlight to check it, then correct just that region.</p>' },
      { h2: 'Nudge hue with Hue vs Hue', html: '<p>If skin leans too orange, red or green, the <a href="/guides/how-to-use-curves-in-davinci-resolve/">Hue vs Hue curve</a> can rotate just that hue back toward natural without a full qualifier. It is quick and often enough on its own.</p>' },
      { h2: 'Protect skin while you stylize', html: '<p>Building a strong <a href="/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/">teal-and-orange look</a>? Do your creative grade first, then add a skin-protection node last so faces stay believable while the rest of the frame gets pushed.</p>' }
    ],
    faqs: [
      ['How do I make skin tones look natural in DaVinci Resolve?', 'Use the vectorscope skin-tone line as your guide and adjust hue until the skin trace aligns with it. For finer control, isolate skin with a qualifier or nudge it with the Hue vs Hue curve.'],
      ['What is the skin tone line on the vectorscope?', 'A diagonal reference line (around 11 o\'clock) that healthy skin tones of all ethnicities naturally fall along. It gives you an objective target so you are not relying only on your monitor.'],
      ['How do I fix skin without changing the whole image?', 'Add a new node and use the Qualifier to select only the skin, then correct that isolated region. This keeps your background and creative look untouched.']
    ],
    related: [
      ['/guides/how-to-read-scopes-in-davinci-resolve/', 'How to read scopes'],
      ['/guides/how-to-use-curves-in-davinci-resolve/', 'How to use curves'],
      ['/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/', 'Teal and orange look']
    ]
  },
  {
    slug: 'how-to-create-teal-and-orange-look-in-davinci-resolve',
    crumb: 'Teal & orange',
    title: 'How to Create the Teal and Orange Look in DaVinci Resolve | resolve.directory',
    h1: 'How to create the teal and orange look in DaVinci Resolve',
    desc: 'Build the classic teal-and-orange blockbuster look in DaVinci Resolve the right way — cool shadows, warm skin, and protected faces. Step by step.',
    blurb: 'The blockbuster split done right — cool shadows, warm skin, and faces that still look human.',
    intro: 'Teal and orange is the most recognizable look in modern film: cool teal shadows against warm orange skin. Done carelessly it looks cheap; done with restraint it looks like a blockbuster. Here is the clean way to build it in DaVinci Resolve.',
    howtoSteps: [
      { name: 'Balance and convert first', text: 'Correct exposure and white balance, and convert log footage to Rec.709, before adding the look.' },
      { name: 'Cool the shadows', text: 'On a new node, push the Lift or Offset wheel toward teal/cyan to tint the shadows.' },
      { name: 'Warm the highlights', text: 'Push the Gain wheel toward orange to warm the highlights and skin.' },
      { name: 'Protect skin tones', text: 'Add a qualifier or Hue vs Hue adjustment so faces stay natural along the vectorscope skin line.' },
      { name: 'Dial it back', text: 'Reduce the look node\'s Key Output gain until the effect feels subtle rather than obvious.' }
    ],
    sections: [
      { h2: '1. Start from a correct image', html: '<p>The look only works on a balanced base. <a href="/guides/how-to-color-grade-in-davinci-resolve/">Correct exposure and white balance</a> and <a href="/guides/how-to-convert-log-to-rec709-in-davinci-resolve/">convert log to Rec.709</a> first.</p>' },
      { h2: '2. Push shadows teal, highlights warm', html: '<p>On a new <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node</a>, tint the shadows toward teal with <strong>Lift</strong> or <strong>Offset</strong>, and warm the highlights toward orange with <strong>Gain</strong>. This complementary split is the whole idea.</p>' },
      { h2: '3. Protect the skin', html: '<p>Warm highlights can push skin into sunburn territory. Add a <a href="/guides/how-to-fix-skin-tones-in-davinci-resolve/">skin qualifier or Hue vs Hue</a> node to hold faces on the natural skin-tone line while the rest of the frame stays stylized.</p>' },
      { h2: '4. Keep it subtle', html: '<p>Reduce the look node with its <strong>Key Output gain</strong> until it reads as mood, not filter. Try it on a <a href="/luts/">free teal-and-orange LUT</a> from the directory to compare against your manual version.</p>' }
    ],
    faqs: [
      ['Why is teal and orange so popular?', 'Skin tones are warm/orange, and teal is the complementary opposite on the color wheel. Placing subjects against a cool background makes them pop, which is why it became the default look for so many films.'],
      ['How do I keep skin natural with a teal and orange grade?', 'Protect skin with a qualifier or the Hue vs Hue curve so faces stay on the vectorscope skin-tone line, even while you push the shadows teal and the highlights warm.'],
      ['Can I do teal and orange with a LUT?', 'Yes — a teal-and-orange LUT applies the split instantly. Put it on its own node so you can dial the strength back, and still add skin protection on top.']
    ],
    related: [
      ['/luts/', 'Free LUTs for DaVinci Resolve'],
      ['/guides/how-to-fix-skin-tones-in-davinci-resolve/', 'Fix skin tones'],
      ['/guides/how-to-get-a-cinematic-look-in-davinci-resolve/', 'Get a cinematic look']
    ]
  },
  {
    slug: 'how-to-add-a-vignette-in-davinci-resolve',
    crumb: 'Vignette',
    title: 'How to Add a Vignette in DaVinci Resolve (2 Ways) | resolve.directory',
    h1: 'How to add a vignette in DaVinci Resolve',
    desc: 'Two ways to add a vignette in DaVinci Resolve — a Power Window circle and the ResolveFX Vignette — plus how to keep it subtle and natural.',
    blurb: 'Two clean ways to add a vignette — a Power Window or ResolveFX — and how to keep it subtle.',
    intro: 'A subtle vignette darkens the edges of the frame to pull the eye toward your subject. It is one of the quietest, most effective finishing touches. Here are two ways to add one in DaVinci Resolve.',
    howtoSteps: [
      { name: 'Add a node', text: 'On the Color page, add a serial node dedicated to the vignette.' },
      { name: 'Draw a Power Window', text: 'Open the Window palette, add a Circle window and size it around your subject.' },
      { name: 'Invert the window', text: 'Invert the window so the effect applies to the edges instead of the center.' },
      { name: 'Darken the edges', text: 'Pull down the Gain or Lift so the outer frame gets darker, and raise the softness for a smooth falloff.' }
    ],
    sections: [
      { h2: 'Method 1 — Power Window (most control)', html: '<p>Add a <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node</a>, open the <strong>Window</strong> palette, and add a <strong>Circle</strong>. Size it around your subject, then click <strong>Invert</strong> so you are affecting the edges. Pull down <strong>Gain</strong> to darken the corners and raise <strong>Softness</strong> for a smooth, invisible falloff.</p>' },
      { h2: 'Track it if the camera moves', html: '<p>If your shot pans or the subject moves, use the <strong>Tracker</strong> palette to track the window so the vignette follows them instead of sitting statically over the frame.</p>' },
      { h2: 'Method 2 — ResolveFX Vignette', html: '<p>For a quick, symmetrical vignette, drag the <strong>Vignette</strong> ResolveFX onto a node and adjust size, softness and darkness. It is faster than a Power Window but less flexible about shape and position.</p>' },
      { h2: 'Keep it invisible', html: '<p>The best vignette is one nobody notices. Keep the darkening gentle and the falloff soft — if it looks like a black ring, it is far too strong. It is usually the last node in a <a href="/guides/how-to-get-a-cinematic-look-in-davinci-resolve/">cinematic grade</a>.</p>' }
    ],
    faqs: [
      ['How do I add a vignette in DaVinci Resolve?', 'Add a node, open the Window palette and draw a Circle window, invert it so it affects the edges, then lower the Gain and raise the softness to darken the corners smoothly. Or use the ResolveFX Vignette for a quick version.'],
      ['How do I make a vignette follow a moving subject?', 'Use the Tracker palette to track your Power Window. Resolve will move the window with the subject or camera so the vignette stays centered on them.'],
      ['Why does my vignette look fake?', 'It is almost always too strong or too hard-edged. Reduce how much you darken the edges and increase the softness so the transition is gradual and invisible.']
    ],
    related: [
      ['/guides/how-to-get-a-cinematic-look-in-davinci-resolve/', 'Get a cinematic look'],
      ['/guides/how-to-use-nodes-in-davinci-resolve/', 'How to use nodes'],
      ['/powergrades/', 'Free PowerGrades']
    ]
  },
  {
    slug: 'how-to-export-a-lut-from-davinci-resolve',
    crumb: 'Export a LUT',
    title: 'How to Export a LUT from DaVinci Resolve | resolve.directory',
    h1: 'How to export a LUT from DaVinci Resolve',
    desc: 'How to generate and export a .cube LUT from a grade in DaVinci Resolve, when to use a LUT vs a PowerGrade, and how to reuse it across projects.',
    blurb: 'Turn any grade into a reusable .cube LUT — and when a LUT beats a PowerGrade.',
    intro: 'Once you build a look you love, you can bake it into a LUT and reuse it anywhere — other projects, other editors, even on-set monitors. Here is how to export a .cube LUT from a grade in DaVinci Resolve.',
    howtoSteps: [
      { name: 'Grade your look on nodes', text: 'Build the look you want to save as a chain of nodes on the Color page.' },
      { name: 'Right-click the clip thumbnail', text: 'In the Color page timeline, right-click the graded clip\'s thumbnail.' },
      { name: 'Generate the LUT', text: 'Choose Generate LUT and pick a resolution such as 33 Point Cube.' },
      { name: 'Save the .cube file', text: 'Name it and save. It appears in your LUT folder ready to apply anywhere.' }
    ],
    sections: [
      { h2: '1. Build the look on nodes', html: '<p>Create the grade you want to save as a <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node chain</a>. Remember a LUT bakes in <em>only</em> color/contrast math — it cannot store Power Windows, tracking or spatial effects.</p>' },
      { h2: '2. Generate the LUT', html: '<p>Right-click the graded clip\'s thumbnail in the Color page timeline → <strong>Generate LUT</strong> → choose <strong>33 Point Cube</strong> (a good balance of accuracy and size). Save it — it lands in your LUT folder automatically.</p>' },
      { h2: '3. Reuse it anywhere', html: '<p>Your new <code>.cube</code> now installs like any other — see <a href="/guides/how-to-install-luts-in-davinci-resolve/">how to install a LUT</a>. You can share it, load it on a set monitor, or use it as a fast starting point on future edits.</p>' },
      { h2: 'LUT or PowerGrade?', html: '<p>Export a <strong>LUT</strong> when you want a portable, one-click look. Save a <a href="/guides/how-to-install-a-powergrade-in-davinci-resolve/"><strong>PowerGrade</strong></a> when you want every node to stay editable inside Resolve. Many colorists keep both.</p>' }
    ],
    faqs: [
      ['How do I export a LUT in DaVinci Resolve?', 'Right-click the graded clip\'s thumbnail on the Color page, choose Generate LUT, and pick a resolution like 33 Point Cube. Resolve saves a .cube file to your LUT folder.'],
      ['What LUT size should I export — 17, 33 or 65 point?', '33 Point Cube is the usual choice: accurate enough for almost everything and a reasonable file size. Use 65 point for maximum precision, or 17 point for lightweight on-set previews.'],
      ['Can a LUT capture Power Windows or tracking?', 'No. A LUT only stores a color and contrast transform. Power Windows, qualifiers, tracking and spatial effects cannot be baked into a LUT — save those as a PowerGrade instead.']
    ],
    related: [
      ['/guides/how-to-install-luts-in-davinci-resolve/', 'How to install a LUT'],
      ['/guides/how-to-install-a-powergrade-in-davinci-resolve/', 'Install a PowerGrade'],
      ['/luts/', 'Free LUTs for DaVinci Resolve']
    ]
  },
  {
    slug: 'davinci-resolve-free-vs-studio-differences',
    crumb: 'Free vs Studio',
    title: 'DaVinci Resolve Free vs Studio: What Is the Difference? | resolve.directory',
    h1: 'DaVinci Resolve free vs Studio',
    desc: 'A clear breakdown of DaVinci Resolve free vs Studio — what the free version can do, what the paid Studio upgrade adds, and whether you need it for color grading.',
    blurb: 'What the free version does, what Studio adds, and whether you actually need to pay.',
    intro: 'DaVinci Resolve is unusually generous: the free version is a full professional editor and color grading suite. Studio is a one-time purchase that adds performance and a set of pro features. Here is exactly what you do and do not get for free.',
    sections: [
      { h2: 'What the free version includes', html: '<p>The complete color grading toolset — <a href="/guides/how-to-use-color-wheels-in-davinci-resolve/">color wheels</a>, <a href="/guides/how-to-use-curves-in-davinci-resolve/">curves</a>, <a href="/guides/how-to-use-nodes-in-davinci-resolve/">nodes</a>, qualifiers, Power Windows, tracking, <a href="/guides/how-to-read-scopes-in-davinci-resolve/">scopes</a>, Color Space Transform and full LUT support. You can edit, grade, mix audio and export up to 4K. For most creators, the free version is genuinely all you need.</p>' },
      { h2: 'What Studio adds', html: '<p>The paid upgrade mainly adds: <strong>noise reduction</strong> (temporal and spatial), <strong>HDR grading tools</strong>, the built-in <strong>Film Grain OFX</strong> and many other ResolveFX/OFX plugins, more <strong>DaVinci Neural Engine</strong> features (Magic Mask, better face refinement, super scale), higher-than-4K and higher-frame-rate export, multi-GPU acceleration and remote/collaboration workflow tools.</p>' },
      { h2: 'Do you need Studio for color grading?', html: '<p>For learning and most online work — no. Every core technique on this site works in the free version. You mainly want Studio once you need <strong>noise reduction</strong>, <strong>HDR delivery</strong>, or the speed of multi-GPU on heavy timelines.</p>' },
      { h2: 'Adding grain without Studio', html: '<p>The one gap people hit early is the Film Grain effect being Studio-only. You can still <a href="/guides/how-to-add-film-grain-in-davinci-resolve/">add real film grain for free</a> using scanned overlay plates with composite modes.</p>' }
    ],
    faqs: [
      ['Is DaVinci Resolve free version good enough for color grading?', 'Yes. The free version includes the entire primary and secondary grading toolset, scopes, nodes, LUTs and Color Space Transform. It is more than enough for professional-looking results.'],
      ['What does DaVinci Resolve Studio add over the free version?', 'Mainly noise reduction, HDR grading tools, the built-in Film Grain and extra OFX plugins, more Neural Engine AI features, higher resolution/frame-rate export, and multi-GPU performance. Studio is a one-time purchase, not a subscription.'],
      ['Can I add film grain in the free version of DaVinci Resolve?', 'The built-in Film Grain OFX is Studio-only, but you can add real grain for free by layering a scanned grain overlay clip and setting its composite mode.']
    ],
    related: [
      ['/guides/how-to-add-film-grain-in-davinci-resolve/', 'Add film grain (free)'],
      ['/guides/how-to-color-grade-in-davinci-resolve/', 'How to color grade'],
      ['/guides/', 'All guides']
    ]
  },
  {
    slug: 'how-to-color-grade-iphone-footage-in-davinci-resolve',
    crumb: 'iPhone footage',
    title: 'How to Color Grade iPhone Footage in DaVinci Resolve | resolve.directory',
    h1: 'How to color grade iPhone footage in DaVinci Resolve',
    desc: 'How to grade iPhone footage in DaVinci Resolve — handling HDR/Dolby Vision that looks washed out, converting Apple Log to Rec.709, and getting a clean cinematic result.',
    blurb: 'Fix washed-out HDR, convert Apple Log to Rec.709, and grade iPhone clips cleanly.',
    intro: 'iPhone footage is deceptively tricky to grade because of how Apple records it — Dolby Vision HDR by default, and Apple Log on Pro models. Get the setup right and iPhone footage grades beautifully. Here is how to handle both in DaVinci Resolve.',
    sections: [
      { h2: 'Why iPhone clips look washed out or oversaturated', html: '<p>By default iPhones record <strong>Dolby Vision HDR</strong>. Dropped onto a standard Rec.709 timeline, that footage often looks flat, washed out or weirdly oversaturated. The fix is to tell Resolve how to interpret it rather than fighting it with the color wheels.</p>' },
      { h2: 'Grading standard (HDR) iPhone footage', html: '<p>Switch <strong>Project Settings → Color Management</strong> to <strong>DaVinci YRGB Color Managed</strong>, then set the input to the clip\'s HDR standard and the <strong>Timeline / Output</strong> to <strong>Rec.709 Gamma 2.4</strong>. Resolve tone-maps the HDR down to a correct SDR base you can grade normally. See <a href="/guides/davinci-resolve-color-management-settings-explained/">color management explained</a>.</p>' },
      { h2: 'Grading Apple Log (iPhone 15 Pro and newer)', html: '<p>If you shot <strong>Apple Log</strong> (ProRes Log), treat it like any log footage: add a <strong>Color Space Transform</strong> with input <strong>Apple Log</strong> and output <strong>Rec.709 / Gamma 2.4</strong>, or apply Apple\'s official Log LUT. Full method: <a href="/guides/how-to-convert-log-to-rec709-in-davinci-resolve/">convert log to Rec.709</a>.</p>' },
      { h2: 'Shoot to make grading easier', html: '<p>For the most control, shoot <strong>Apple Log</strong> (or Apple ProRes) on a Pro model. If your phone cannot, turning off HDR video in the iPhone camera settings records standard SDR, which is simpler to grade even if it holds less range.</p>' },
      { h2: 'Then grade like normal', html: '<p>Once you have a clean Rec.709 base, everything else on this site applies — <a href="/guides/how-to-color-grade-in-davinci-resolve/">balance and contrast</a>, a <a href="/guides/how-to-get-a-cinematic-look-in-davinci-resolve/">cinematic look</a>, or a one-click <a href="/luts/">LUT</a>.</p>' }
    ],
    faqs: [
      ['Why does my iPhone footage look washed out in DaVinci Resolve?', 'iPhones record Dolby Vision HDR by default. On a standard Rec.709 timeline that HDR footage looks flat or washed out. Use DaVinci YRGB Color Managed and set the output to Rec.709 so Resolve tone-maps it correctly, or shoot in SDR/Apple Log instead.'],
      ['How do I convert Apple Log to Rec.709?', 'Add a Color Space Transform node with input set to Apple Log and output to Rec.709 / Gamma 2.4, or apply Apple\'s official Apple Log LUT on its own node before you grade.'],
      ['Should I shoot iPhone video in HDR or Apple Log?', 'Apple Log (on Pro models) gives you the most grading flexibility. If Apple Log is not available, turning off HDR to record standard SDR makes footage much easier to grade than default Dolby Vision HDR.']
    ],
    related: [
      ['/guides/how-to-convert-log-to-rec709-in-davinci-resolve/', 'Convert log to Rec.709'],
      ['/guides/davinci-resolve-color-management-settings-explained/', 'Color management explained'],
      ['/guides/how-to-get-a-cinematic-look-in-davinci-resolve/', 'Get a cinematic look']
    ]
  },
  {
    slug: 'how-to-use-the-color-warper-in-davinci-resolve',
    crumb: 'Color Warper',
    title: 'How to Use the Color Warper in DaVinci Resolve | resolve.directory',
    h1: 'How to use the Color Warper in DaVinci Resolve',
    desc: 'How to use the Color Warper in DaVinci Resolve — the Chroma-Hue and Hue-Saturation grids — for intuitive, precise color shaping and color separation. Works in the free version.',
    blurb: 'The Chroma-Hue and Hue-Saturation grids for intuitive, precise color shaping.',
    intro: 'The Color Warper is one of the most intuitive tools in DaVinci Resolve: instead of sliders, you grab points on a grid and push colors exactly where you want them. It is great for color separation and fixing specific hues, and it works in the free version.',
    sections: [
      { h2: 'Open the Color Warper', html: '<p>On the <strong>Color</strong> page, open the <strong>Color Warper</strong> palette (the grid icon in the palette row). Put it on its own <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node</a> so you can dial it back later.</p>' },
      { h2: 'Chroma-Hue mode — push colors around', html: '<p>The <strong>Chroma-Hue</strong> grid maps hue around the circle and saturation outward. Grab a grid point over the color you want to change and drag: outward boosts saturation, around the wheel shifts hue. This is the fastest way to create <a href="/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/">color separation</a> — pull shadows one way, skin another.</p>' },
      { h2: 'Hue-Saturation mode — target by zone', html: '<p>The <strong>Hue-Saturation</strong> grid lets you rotate hue and adjust saturation for specific hue/sat zones, which is perfect for surgical fixes — calming a loud color or nudging a single hue without a qualifier.</p>' },
      { h2: 'Protect skin while you separate colors', html: '<p>Because the Warper works by hue zone, you can push the palette hard while leaving the skin zone near neutral — a clean way to keep <a href="/guides/how-to-fix-skin-tones-in-davinci-resolve/">natural skin tones</a> in a stylized grade.</p>' },
      { h2: 'Keep moves gentle', html: '<p>The grid makes big changes easy, so it is easy to overdo. Small drags go a long way; use the node\'s Key Output gain to reduce the whole effect if it gets heavy.</p>' }
    ],
    faqs: [
      ['What is the Color Warper in DaVinci Resolve?', 'It is a grid-based color tool with two modes — Chroma-Hue and Hue-Saturation — that lets you push colors around intuitively by dragging grid points instead of using sliders. It is excellent for color separation and targeted hue fixes.'],
      ['Is the Color Warper available in the free version of DaVinci Resolve?', 'Yes. The Color Warper is part of the standard color toolset and works in the free version, not just Studio.'],
      ['What is the Color Warper good for?', 'Creating color separation (like teal and orange), fixing or shifting specific hues without a qualifier, and shaping saturation by zone — all while keeping skin tones protected.']
    ],
    related: [
      ['/guides/how-to-create-teal-and-orange-look-in-davinci-resolve/', 'Teal and orange look'],
      ['/guides/how-to-fix-skin-tones-in-davinci-resolve/', 'Fix skin tones'],
      ['/guides/how-to-use-curves-in-davinci-resolve/', 'How to use curves']
    ]
  },
  {
    slug: 'best-free-luts-for-davinci-resolve',
    crumb: 'Best free LUTs',
    title: 'Best Free LUTs for DaVinci Resolve (Curated) | resolve.directory',
    h1: 'Best free LUTs for DaVinci Resolve',
    desc: 'A curated pick of the best free LUTs for DaVinci Resolve — cinematic looks, log conversion LUTs and film emulation — all free to download from the directory.',
    blurb: 'A curated shortlist of the best free LUT packs — creative looks, log conversions and film emulation.',
    intro: 'There are a lot of free LUTs out there and plenty of low-quality ones. This is a curated shortlist of genuinely useful free LUT packs for DaVinci Resolve, grouped by what you actually need them for. Every link is free.',
    sections: [
      { h2: 'Official log-conversion LUTs (start here)', html: '<p>If you shoot log, the most important LUTs are your camera\'s own conversion LUTs — they give you a correct Rec.709 base. Grab them from the <a href="/official-luts/">official camera log LUT library</a> for Sony, Canon, Panasonic, Nikon, DJI, ARRI and RED. See also <a href="/guides/how-to-convert-log-to-rec709-in-davinci-resolve/">converting log to Rec.709</a>.</p>' },
      { h2: 'Creative cinematic LUTs', html: '<p>For instant looks — teal-and-orange, film-style, moody — browse the <a href="/luts/">free creative LUT packs</a> in the directory. Apply them on their own <a href="/guides/how-to-use-nodes-in-davinci-resolve/">node</a> so you can dial the strength back to taste.</p>' },
      { h2: 'Film emulation LUTs', html: '<p>Want the feel of a specific film stock? Several packs in the directory emulate classic 35mm and instant-film looks. Pair them with a light layer of <a href="/guides/how-to-add-film-grain-in-davinci-resolve/">film grain</a> for a convincing analog result.</p>' },
      { h2: 'How to use them well', html: '<p>A LUT is a starting point, not a finish line. <a href="/guides/how-to-color-grade-in-davinci-resolve/">Balance your shot first</a>, apply the LUT on its own node, then reduce its Key Output gain and fine-tune. New to installing them? Read <a href="/guides/how-to-install-luts-in-davinci-resolve/">how to install a LUT</a>.</p>' },
      { h2: 'Browse the full directory', html: '<p>This shortlist is just a taste — the <a href="/index.html#list">full directory</a> lists every free LUT and PowerGrade we have collected, updated as new ones are found. <a href="/index.html#list">Browse everything free</a>.</p>' }
    ],
    faqs: [
      ['Are free LUTs good enough for professional work?', 'Yes, especially official camera log-conversion LUTs, which are made by the manufacturers. For creative looks, quality varies — use a LUT as a starting point, then balance and fine-tune the shot around it.'],
      ['Where can I download free LUTs for DaVinci Resolve?', 'The resolve.directory listing curates free LUTs and PowerGrades from creators and camera manufacturers across the web, including official log-conversion LUTs and creative cinematic packs.'],
      ['Do free LUTs work in the free version of DaVinci Resolve?', 'Yes. Standard 3D .cube LUTs work identically in the free version and in DaVinci Resolve Studio.']
    ],
    related: [
      ['/luts/', 'Free LUTs for DaVinci Resolve'],
      ['/official-luts/', 'Official camera log LUTs'],
      ['/powergrades/', 'Free PowerGrades']
    ]
  }
];

function buildGuidePage(g) {
  const canonical = `https://resolve.directory/guides/${g.slug}/`;
  const jsonld = [];
  if (g.howtoSteps && g.howtoSteps.length) {
    jsonld.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: g.h1,
      description: g.desc,
      step: g.howtoSteps.map(function (s) {
        return { '@type': 'HowToStep', name: s.name, text: s.text };
      })
    });
  }
  if (g.faqs && g.faqs.length) {
    jsonld.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: g.faqs.map(function (qa) {
        return { '@type': 'Question', name: qa[0], acceptedAnswer: { '@type': 'Answer', text: qa[1] } };
      })
    });
  }
  jsonld.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'resolve.directory', item: 'https://resolve.directory/' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://resolve.directory/guides/' },
      { '@type': 'ListItem', position: 3, name: g.crumb, item: canonical }
    ]
  });

  const sections = g.sections.map(function (s) {
    return `    <h2>${escapeHtml(s.h2)}</h2>\n    ${s.html}`;
  }).join('\n\n');

  const faqHtml = (g.faqs && g.faqs.length)
    ? `\n  <section class="hub-faq">\n    <h2>Frequently asked</h2>\n${g.faqs.map(function (qa) {
        return `    <div class="faq-item"><h3>${escapeHtml(qa[0])}</h3><p>${escapeHtml(qa[1])}</p></div>`;
      }).join('\n')}\n  </section>`
    : '';

  const related = (g.related && g.related.length) ? g.related : [
    ['/luts/', 'Free LUTs for DaVinci Resolve'],
    ['/powergrades/', 'Free PowerGrades'],
    ['/guides/', 'All guides']
  ];
  const relatedHtml = `\n  <nav class="hub-related">\n    <h2>Keep exploring</h2>\n${related.map(function (r) {
      return `    <a href="${r[0]}">${escapeHtml(r[1])}</a>`;
    }).join('\n')}\n  </nav>`;

  const body = `<div class="detail-wrap hub-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    <a href="/guides/">Guides</a>
    <span>/</span>
    <span>${escapeHtml(g.crumb)}</span>
  </div>

  <h1 class="hub-h1">${escapeHtml(g.h1)}</h1>
  <p class="hub-intro">${g.intro}</p>

  <section class="guide-prose">
${sections}
  </section>
${faqHtml}
${relatedHtml}
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
${head({ title: g.title, desc: g.desc, canonical, ogTitle: g.ogTitle || g.h1, jsonld })}
<body>

${HEADER}

${body}

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

function guidesIndexPage() {
  const canonical = 'https://resolve.directory/guides/';
  const title = 'DaVinci Resolve Color Grading Guides | resolve.directory';
  const desc = 'Free step-by-step DaVinci Resolve guides — color grading, log to Rec.709, LUTs, PowerGrades, curves, nodes, scopes, skin tones and the cinematic look.';
  const guides = [
    { url: '/guides/how-to-install-luts-in-davinci-resolve/', name: 'How to install a LUT in DaVinci Resolve', blurb: 'Where the LUT folder is, how to import .cube files and apply them on the Color page.' },
    { url: '/guides/how-to-install-a-powergrade-in-davinci-resolve/', name: 'How to install a PowerGrade in DaVinci Resolve', blurb: 'Importing .drx files into the Gallery\'s PowerGrade album and applying the node tree to your clips.' },
    { url: '/guides/how-to-add-film-grain-in-davinci-resolve/', name: 'How to add film grain in DaVinci Resolve (free)', blurb: 'Using real scanned grain plates with composite modes — works in the free version.' }
  ].concat(NEW_GUIDES.map(function (g) {
    return { url: `/guides/${g.slug}/`, name: g.h1, blurb: g.blurb };
  }));
  const rows = guides.map(function (gd, i) {
    return `      <a class="row" href="${gd.url}">
        <span class="rank">${i + 1}</span>
        <span class="icon">${defaultIcon}</span>
        <span class="row-main">
          <div class="name">${escapeHtml(gd.name)}</div>
          <div class="desc">${escapeHtml(gd.blurb)}</div>
        </span>
        <span class="tag free">GUIDE</span>
      </a>`;
  }).join('\n');

  const body = `<div class="detail-wrap hub-wrap">
  <div class="breadcrumb">
    <a href="/index.html">resolve.directory</a>
    <span>/</span>
    <span>Guides</span>
  </div>

  <h1 class="hub-h1">DaVinci Resolve guides</h1>
  <p class="hub-intro">Short, practical guides for getting the most out of the free LUTs and PowerGrades in the directory — no fluff, just the steps.</p>

  <div class="hub-list">
${rows}
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
${head({ title, desc, canonical, ogTitle: 'DaVinci Resolve color grading guides', jsonld: [] })}
<body>

${HEADER}

${body}

${FOOTER}

${SCRIPTS}

</body>
</html>
`;
}

writePage('/guides/how-to-install-luts-in-davinci-resolve/', guideInstallLutPage());
generatedHubs.push({ path: '/guides/how-to-install-luts-in-davinci-resolve/', priority: '0.6' });
writePage('/guides/how-to-install-a-powergrade-in-davinci-resolve/', guideInstallPowerGradePage());
generatedHubs.push({ path: '/guides/how-to-install-a-powergrade-in-davinci-resolve/', priority: '0.6' });
writePage('/guides/how-to-add-film-grain-in-davinci-resolve/', guideFilmGrainPage());
generatedHubs.push({ path: '/guides/how-to-add-film-grain-in-davinci-resolve/', priority: '0.6' });
NEW_GUIDES.forEach(function (g) {
  writePage(`/guides/${g.slug}/`, buildGuidePage(g));
  generatedHubs.push({ path: `/guides/${g.slug}/`, priority: '0.6' });
});
writePage('/guides/', guidesIndexPage());
generatedHubs.push({ path: '/guides/', priority: '0.6' });

/* ---------- sitemap ---------- */

function sitemapXml() {
  const urls = [{ loc: 'https://resolve.directory/', changefreq: 'weekly', priority: '1.0' }]
    .concat(generatedHubs.map(function (h) {
      return { loc: `https://resolve.directory${h.path}`, changefreq: 'weekly', priority: h.priority };
    }))
    .concat(grades.map(function (g) {
      return { loc: `https://resolve.directory/grade/${g.slug}/`, changefreq: 'monthly', priority: '0.7' };
    }));

  const body = urls.map(function (u) {
    return `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml());

/* ---------- bump styles.css version in hand-maintained pages ---------- */

['index.html', 'profile/index.html', 'privacy/index.html'].forEach(function (rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return;
  const html = fs.readFileSync(p, 'utf8');
  const updated = html.replace(/href="\/?styles\.css(\?v=[^"]*)?"/g, function (m) {
    const prefix = m.includes('"/styles') ? '/styles.css' : 'styles.css';
    return `href="${prefix}?v=${CSS_V}"`;
  });
  if (updated !== html) fs.writeFileSync(p, updated);
});

console.log(`Generated ${grades.length} resource pages, ${generatedHubs.length} hub/guide pages, and updated sitemap.xml`);
