(function (root) {
  function slugify(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const rawGrades = [
    { name: "CinematicX 30 Free LUTs", desc: "Full set of 30 cinematic LUTs built specifically for Resolve, by The Resolve Store.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://theresolve.store/30-free-cinematicx-luts-for-davinci-resolve/" },
    { name: "Color Grading Central 100 Free LUTs", desc: "Hand-picked pack including the popular M31 orange and teal look.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://www.colorgradingcentral.com/free-luts/" },
    { name: "CineColor Free LUTs", desc: "Small curated collection of free cinematic color LUTs.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/collections/free-luts" },
    { name: "FilmDaft Free Cinematic LUTs", desc: "Free pack aimed at giving raw footage an instant film look.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://filmdaft.com/free-cinematic-luts-for-color-grading/" },
    { name: "GradeAtlas Free PowerGrade Collection", desc: "Free PowerGrade archive shared by creators on the GradeAtlas marketplace.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://www.gradeatlas.com/free-powergrades" },
    { name: "veresdenialex S-Log to Rec709", desc: "Free Sony S-Log to Rec709 LUT and PowerGrade, works across camera brands.", cat: "PowerGrade", tag: "free", cam: "Sony", url: "https://www.veresdenialex.com/product-page/sony-classic-film-s-log-to-rec709" },
    { name: "PixelTools Free DCTL Toolkit", desc: "Three free DCTL tools for Resolve — Checker, Exposure/Chart and PQ Tester.", cat: "DCTL Tool", tag: "free", cam: "Any", url: "https://pixeltoolspost.com/collections/free-tools" },
    { name: "Creative Shrimp AgX & Filmic LUTs", desc: "Free LUT pack for grading Blender OpenEXR renders inside Resolve.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://www.creativeshrimp.com/agx-filmic-luts.html" },
    { name: "Luttie Free .cube LUTs", desc: "Free professional .cube LUTs, plus an online editor to customize each one.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://luttie.app/luts" },
    { name: "Cullen Kelly Free Toolkit", desc: "Free DCTLs and a Template Node Tree PowerGrade from working colorist Cullen Kelly.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://cullenkellycolor.com/toolkit/all" },
    { name: "Lutify.me Free LUTs", desc: "5 free scene-referred cinematic LUTs plus an online LUT creator, free account.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://lutify.me/free-luts/" },
    { name: "Brock Roberts Basic Node Tree PowerGrade", desc: "Free foundational node-tree PowerGrade to jumpstart your grading workflow.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://brock-roberts-films.sellfy.store/p/powergrade/" },
    { name: "Stockfilm Free Grain & LUT Tools", desc: "Free film grain, gate weave, projector flicker and color LUTs for filmmakers.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://stockfilm.com/tools/grain-overlays" },
    { name: "Fujifilm Film Simulation LUTs", desc: "Official free LUTs recreating Fujifilm's in-camera film simulations.", cat: "Official LUT", tag: "free", cam: "Fujifilm", url: "http://www.fujifilm-x.com/global/support/download/lut/" },
    { name: "Panasonic V-Log LUT Library", desc: "Official free LUT downloads for Lumix V-Log and V-Log L cameras.", cat: "Official LUT", tag: "free", cam: "Panasonic", url: "https://av.jpn.support.panasonic.com/support/global/cs/dsc/download/lut/index.html" },
    { name: "DJI Official LUT Download Center", desc: "Official free D-Log to Rec.709 LUTs for every DJI drone and camera.", cat: "Official LUT", tag: "free", cam: "DJI", url: "https://www.dji.com/lut" },
    { name: "Sony Professional LUT Library", desc: "Official free LUTs for on-set monitoring and post with Sony cameras.", cat: "Official LUT", tag: "free", cam: "Sony", url: "https://pro.sony/en_GB/technology/professional-video-lut-look-up-table" },
    { name: "Nikon N-Log 3D LUT", desc: "Official free 3D LUT for grading N-Log footage from Nikon mirrorless cameras.", cat: "Official LUT", tag: "free", cam: "Nikon", url: "https://downloadcenter.nikonimglib.com/en/download/sw/244.html" },
    { name: "Nikon RED Creative LUTs", desc: "Four free creative LUTs for N-Log, developed by Nikon with RED.", cat: "Official LUT", tag: "free", cam: "Nikon", url: "https://www.nikonusa.com/content/red-luts" },
    { name: "Canon Log LUT (Official)", desc: "Official free Canon Log to Rec.709 lookup tables for Canon cinema cameras.", cat: "Official LUT", tag: "free", cam: "Canon", url: "https://in.canon/en/support/0200280202" },
    { name: "ARRI LUT Generator", desc: "Official free tool to generate custom LUTs for ARRI Log-C workflows.", cat: "Official LUT", tag: "free", cam: "ARRI", url: "https://www.arri.com/en/learn-help/learn-help-camera-system/tools/lut-generator" },
    { name: "RED IPP2 Output Presets", desc: "Official free 3D LUTs for every RED IPP2 output transform combination.", cat: "Official LUT", tag: "free", cam: "RED", url: "https://www.reddigitalcinema.com/download/ipp2-output-presets" },
    { name: "RED Creative LUT Kit", desc: "25 free creative LUTs for RED footage by Phil Holland and Eric Weidt.", cat: "Official LUT", tag: "free", cam: "RED", url: "https://www.reddigitalcinema.com/download/red-creative-lut-kit" },
    { name: "CineColor Canon C-Log LUT", desc: "Free Canon C-Log conversion LUT for mirrorless and cinema cameras.", cat: "LUT Pack", tag: "free", cam: "Canon", url: "https://cinecolor.io/blogs/news/free-canon-c-log-lut-download-here" },
    { name: "CineColor Lumix V-Log LUT", desc: "Free Panasonic Lumix V-Log conversion LUT, cropped and full-frame versions.", cat: "LUT Pack", tag: "free", cam: "Panasonic", url: "https://cinecolor.io/blogs/news/free-lumix-v-log-lut-download-here" },
    { name: "CineColor DJI D-Log LUT", desc: "Free D-Log to Rec.709 conversion LUT for DJI drone and gimbal footage.", cat: "LUT Pack", tag: "free", cam: "DJI", url: "https://cinecolor.io/products/free-dji-d-log-lut" },
    { name: "CineColor Classic B&W LUT", desc: "Free high-contrast classic black & white LUT in .cube and .xmp.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/blogs/news/download-our-free-high-contrast-classic-black-white-lut-1" },
    { name: "CineColor Teal and Orange LUT", desc: "Free Hollywood-style teal and orange LUT, cool shadows and warm skin.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/products/teal-and-orange-lut-free-download" },
    { name: "CineColor Horror LUT Pack", desc: "Free 3-LUT sample pack with heavy contrast and dynamic saturation.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/products/horror-lut-pack-free" },
    { name: "CineColor Skintone LUT", desc: "Free LUT that smooths and enhances skin tones while staying natural.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/blogs/news/free-skintone-lut-download-enhances-appearance-smoothed-skin-naturally" },
    { name: "CineColor VHS LUT & Texture", desc: "Free VHS conversion LUT plus scanned VHS texture, glitches and leader.", cat: "Grain Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/products/free-vhs-lut-texture" },
    { name: "CineColor Wedding LUTs", desc: "Free 3-LUT sampler pack optimized for filmic weddings and live events.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/products/wedding-lut-free-download" },
    { name: "CineColor Nikon N-Log LUT", desc: "Free Nikon N-Log to Rec.709 conversion LUT.", cat: "LUT Pack", tag: "free", cam: "Nikon", url: "https://cinecolor.io/blogs/news/free-nikon-n-log-lut-rec-709-conversion" },
    { name: "CineColor ARRI Alexa Classic LUT", desc: "Free LUT emulating the classic ARRI Alexa color science.", cat: "LUT Pack", tag: "free", cam: "ARRI", url: "https://cinecolor.io/blogs/news/download-our-free-arri-alexa-classic-lut-here" },
    { name: "CineColor RED IPP2 LUT", desc: "Free conversion LUT for RED footage shot with IPP2 color science.", cat: "LUT Pack", tag: "free", cam: "RED", url: "https://cinecolor.io/blogs/news/free-red-ipp2-lut-download-here" },
    { name: "CineColor 35mm Film Emulation LUT", desc: "Free modern 35mm film emulation LUT with natural skin tones.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://cinecolor.io/products/modern-35mm-film-emulation-lut-free" },
    { name: "Fresh LUTs GoPro ProTune to Color", desc: "Free CC0-licensed GoPro Protune to GoPro Color conversion LUT.", cat: "LUT Pack", tag: "free", cam: "GoPro", url: "https://freshluts.com/luts/161" },
    { name: "FilmLooks Free Film Grain", desc: "36 free HD Super 8 & 16mm film grain overlays, no cost.", cat: "Grain Pack", tag: "free", cam: "Any", url: "https://filmlooks.com/free-film-grain/" },
    { name: "Noam Kroll CHROMATIC LUT", desc: "Free Classic Chrome-inspired LUT from filmmaker Noam Kroll.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://noamkroll.com/download-my-free-classic-chrome-inspired-lut-here/" },
    { name: "Noam Kroll Multi-Camera LUT Bundle", desc: "Free conversion LUTs for 8 camera formats: Sony, Canon, Arri, Fuji, Lumix, BM, RED, iPhone.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://noamkroll.com/free-download-camera-luts-for-sony-lumix-blackmagic-arri-red-canon-fuji-more/" },
    { name: "Bounce Color True Log Conversion LUTs", desc: "Free technical Log-to-Rec709 LUTs across most major camera brands.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://www.bouncecolor.com/blogs/news/true-luts" },
    { name: "MyCreativeFX Orange and Teal LUT V1", desc: "Free orange and teal LUT with a classic Hollywood-inspired grade.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://mycreativefx.com/details/mkfx-16-orange-and-teal-lut-v1-free" },
    { name: "FreeVisuals Teal & Orange LUT", desc: "Free teal & orange LUT, no attribution required for commercial use.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://www.freevisuals.net/item/free-cinematic-teal-orange-lut" },
    { name: "PremiumBeat Wanderlust LUTs", desc: "17 free LUTs for LOG footage, built for travel and location shoots.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://www.premiumbeat.com/blog/free-luts-log-footage/" },
    { name: "Color Grading Central VHS Overlay", desc: "Free VHS overlay pack for an authentic 80s/90s VCR look.", cat: "Grain Pack", tag: "free", cam: "Any", url: "https://www.colorgradingcentral.com/vhs-overlay/" },
    { name: "Lightworks 5 Free Horror LUTs", desc: "Free LUTs inspired by Saw, The Shining, The Ring, Evil Dead and more.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://lwks.com/blog/shortcuts-4-how-to-use-luts" },
    { name: "SmallHD Cinematic Looks LUT Pack", desc: "Free 3D LUT pack inspired by hit movie color grades.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://smallhd.com/blogs/community/free-3d-lut-pack-cinematic-looks-smallhd" },
    { name: "Color Finale BMD Film Log LUT Pack", desc: "Free Blackmagic Film Log LUT pack, shared free to everyone.", cat: "LUT Pack", tag: "free", cam: "Blackmagic", url: "https://colorfinale.com/blog/post/jan-2026-giveaway-12-25" },
    { name: "Kondor Blue Sony FX30 Creative LUT", desc: "Free creative LUT for Sony FX30 / S-Log3 footage.", cat: "LUT Pack", tag: "free", cam: "Sony", url: "https://kondorblue.com/products/sony-fx30-creative-lut" },
    { name: "IWLTBAP 10 Free Cinematic LUTs", desc: "10 free LUTs including Blade Runner 2049 and Kodachrome-inspired looks.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://blog.iwltbap.com/the-10-free-cinematic-luts-by-iwltbap/" },
    { name: "Rocket House Pictures GH V-Log LUTs", desc: "Free LUTs made for the Panasonic LUMIX GH series V-Log, no strings attached.", cat: "LUT Pack", tag: "free", cam: "Panasonic", url: "https://rockethousepictures.com/luts.html" },
    { name: "Felipe Idrovo Free Wedding LUT", desc: "Free 33-point wedding LUT for natural skin tones, follow required.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://felipeidrovo.com/free-wedding-cinema-lut/" },
    { name: "Trub Film Co 35mm Film LUT", desc: "Free 35mm film emulation LUT, turns flat LOG into rich cinema color.", cat: "LUT Pack", tag: "free", cam: "Any", url: "https://www.trubfilmco.com/film-lut-download" },
    { name: "spektrafilm OFX", desc: "Free OFX plugin with spectral film emulation, 17 negative stocks and 9 print stocks modeled from real Kodak and Fujifilm data.", cat: "OFX Plugin", tag: "free", cam: "Any", url: "https://spektrafilm.114c.de/" },
    { name: "Rocket Rooster Eterna PowerGrade", desc: "Free Fujifilm Eterna-inspired film emulation PowerGrade.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://rocketrooster.sellfy.store/p/rocket-rooster-eterna-powergrade/" },
    { name: "2383 Free PowerGrade", desc: "Free Kodak 2383 print film emulation PowerGrade by Christopher Balladarez.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://729731420154.gumroad.com/l/2383FreePowergrade" },
    { name: "Soft Toast Films Base PowerGrade", desc: "Free base node tree PowerGrade shared by Runhaar of Soft Toast Films.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://www.softtoastfilms.com/powergrades" },
    { name: "Film Simplified Basic Grade PowerGrade", desc: "Free basic grade PowerGrade to start your color pipeline in Resolve.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://filmsimplified.com/davinci-resolve-powergrades/1" },
    { name: "veresdenialex Basic Node Tree", desc: "Free foundational DaVinci Resolve node tree PowerGrade, works with any camera.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://www.veresdenialex.com/product-page/davinci-resolve-basic-node-tree" },
    { name: "Resolved Tools Beginner PowerGrade", desc: "Free beginner-friendly PowerGrade with a clean, organized node structure.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://www.resolvedtools.com/product/beginner-powergrade" },
    { name: "Cody Scott Canon EOS-R PowerGrade", desc: "Free PowerGrade built for Canon EOS-R footage in DaVinci Resolve.", cat: "PowerGrade", tag: "free", cam: "Canon", url: "https://videographybusinessmastery.sellfy.store/p/bmpcc6k-gen-5-power-grade-8kmnvt" },
    { name: "Joshua Kirk Custom Curve PowerGrades", desc: "Free custom curve PowerGrades for precise contrast shaping in Resolve.", cat: "PowerGrade", tag: "free", cam: "Any", url: "https://joshuakirknz.gumroad.com/l/customcurves" },
    { name: "TDCAT Free 4K Film Grain Plates", desc: "Free DCI 4K scanned film grain plates for overlaying real texture.", cat: "Grain Pack", tag: "free", cam: "Any", url: "https://tdcat.com/downloads/filmgrain" }
  ];

  const seen = {};
  const grades = rawGrades.map(function (g) {
    let slug = slugify(g.name);
    if (seen[slug]) {
      seen[slug]++;
      slug = slug + '-' + seen[slug];
    } else {
      seen[slug] = 1;
    }
    return Object.assign({ slug: slug }, g);
  });

  const categoryIcons = {
    "PowerGrade": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7.5 11 16M16 7.5 13 16M8.5 6H15.5"/></svg>',
    "LUT Pack": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="12" height="12" rx="1.5"/><path d="M9 9h12v12H9z" opacity="0.55"/></svg>',
    "Official LUT": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
    "Grain Pack": '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="6" cy="6" r="1.3"/><circle cx="13" cy="5" r="1"/><circle cx="18" cy="9" r="1.4"/><circle cx="5" cy="14" r="1"/><circle cx="11" cy="12" r="1.4"/><circle cx="17" cy="16" r="1"/><circle cx="8" cy="19" r="1.3"/><circle cx="15" cy="20" r="1"/></svg>',
    "DCTL Tool": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/></svg>',
    "OFX Plugin": '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 3v4M15 3v4M6 7h12l-1 4a5 5 0 0 1-10 0z"/><path d="M12 15v6"/></svg>'
  };
  const categoryColors = {
    "PowerGrade": "#e8622c",
    "LUT Pack": "#4fae72",
    "Official LUT": "#5b9dd9",
    "Grain Pack": "#c98fd8",
    "DCTL Tool": "#d9b45b",
    "OFX Plugin": "#8a7fd1"
  };
  const defaultIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="12" r="6" stroke="currentColor" stroke-width="1.5"/></svg>';

  const categoryInstall = {
    "PowerGrade": "Open the Color page in DaVinci Resolve, then in the Gallery panel create or select a PowerGrade Album. Drag the downloaded .drx file into that album. To use it, right-click any clip's node graph and choose \"Apply Grade\", or drag the PowerGrade thumbnail directly onto a node.",
    "LUT Pack": "Go to Project Settings → Color Management → Open LUT Folder, then copy the downloaded .cube file(s) into that folder. Restart DaVinci Resolve, right-click a clip on the Color page, and the LUT will appear under 3D LUTs in the panel on the right.",
    "Official LUT": "Go to Project Settings → Color Management → Open LUT Folder, then copy the downloaded .cube file(s) into that folder. Restart DaVinci Resolve, right-click a clip on the Color page, and the LUT will appear under 3D LUTs in the panel on the right.",
    "Grain Pack": "For LUT/texture files, copy them into Project Settings → Color Management → Open LUT Folder and restart Resolve. For grain or overlay footage, import the clip into your Media Pool and place it on a track above your footage set to Screen or Overlay blend mode.",
    "DCTL Tool": "Go to Project Settings → Color Management → Open LUT Folder, then copy the .dctl file into the LUT folder's DCTL subfolder. Restart DaVinci Resolve and apply it from the OpenFX/DCTL panel in the Color page's Effects Library.",
    "OFX Plugin": "Run the downloaded installer for your OS (macOS, Windows or Linux) and restart DaVinci Resolve. The plugin installs itself into Resolve's OFX folder automatically. Open the Effects Library on the Color or Edit page, find it under OpenFX, and drag it onto a clip or node."
  };

  const data = { grades: grades, categoryIcons: categoryIcons, categoryColors: categoryColors, defaultIcon: defaultIcon, categoryInstall: categoryInstall };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = data;
  } else {
    root.RESOLVE_DATA = data;
  }
})(typeof window !== 'undefined' ? window : this);
