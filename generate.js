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
<link rel="stylesheet" href="/styles.css">
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

function guidesIndexPage() {
  const canonical = 'https://resolve.directory/guides/';
  const title = 'DaVinci Resolve Color Grading Guides | resolve.directory';
  const desc = 'Simple, practical guides for color grading in DaVinci Resolve — installing LUTs, using PowerGrades and getting a cinematic look for free.';
  const guides = [
    { url: '/guides/how-to-install-luts-in-davinci-resolve/', name: 'How to install a LUT in DaVinci Resolve', blurb: 'Where the LUT folder is, how to import .cube files and apply them on the Color page.' }
  ];
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

console.log(`Generated ${grades.length} resource pages, ${generatedHubs.length} hub/guide pages, and updated sitemap.xml`);
