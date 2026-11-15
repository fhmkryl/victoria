/* Victoria prototype shell: sidebar, header, global drawers and small interactions.
   Each page sets <body data-page="..."> and puts its content in <main class="content">.
   Language comes from <html lang="tr|en">. English pages live in prototype/, Turkish pages in prototype/tr/
   with the same file names; the TR/EN switch jumps to the same page in the other language. */
(function () {
  var SCRIPT = document.currentScript ? document.currentScript.getAttribute('src') : 'assets/app.js';
  var ASSETS = SCRIPT.replace(/app\.js(\?.*)?$/, '');
  var LANG = (document.documentElement.lang || 'en').slice(0, 2) === 'tr' ? 'tr' : 'en';
  var T = {
    en: {
      groups: ['Daily', 'Manage'],
      nav: { dashboard: 'Today', calendar: 'Calendar', customers: 'Customers', kasa: 'Cash desk', catalog: 'Catalog &amp; stock', team: 'Team', settings: 'Settings' },
      off: 'off',
      foot: 'Victoria Güzellik &amp; Bakım<br><span style="color:#64748b">Single branch · v0.1 prototype</span>',
      tagline: 'Beauty &amp; Care',
      search: 'Search customer by phone or name, product, sale no…',
      newAppt: 'New appointment', myDay: 'My day', switchUser: 'Switch user', quickConsult: 'Quick consult', aiTitle: 'Ask your data', notifTitle: 'Notifications', owner: 'Owner',
      banner: 'Clickable HTML prototype: static sample data, nothing is saved.',
      sitemap: 'Sitemap',
      ask: 'Ask your data', phase2: 'Phase 2',
      chat:
        '<div class="msg user">Which employee sold the most retail products last month?</div>' +
        '<div class="msg bot"><b>Merve Kaya</b> sold the most retail in October: <b>38 items, ₺24,350</b>.<br>Ayşe Demir was second with 21 items (₺12,900).<table class="table mt" style="background:#fff;border-radius:6px"><tr><th>Employee</th><th class="num">Items</th><th class="num">Revenue</th></tr><tr><td>Merve Kaya</td><td class="num">38</td><td class="num">₺24,350</td></tr><tr><td>Ayşe Demir</td><td class="num">21</td><td class="num">₺12,900</td></tr><tr><td>Elif Şahin</td><td class="num">9</td><td class="num">₺5,120</td></tr></table><div class="small muted mt">Based on: sales 01.10–31.10, retail lines only, net of refunds.</div></div>' +
        '<div class="msg user">How much laser cooling gel did we use?</div>' +
        '<div class="msg bot">4.2 L in October across 96 laser sessions (avg. 44 ml per session). Current stock: 1.8 L, enough for about 12 days at this rate. <a href="product-detail.html">Open product</a></div>',
      askPh: 'Ask about sales, stock, employees, customers…',
      notifs: [
        ['alert-triangle', '#d97706', '<b>Low stock:</b> Laser cooling gel 5 L (1.8 L left)', '10 min ago', 'product-detail.html', 'Open'],
        ['calendar-clock', '#dc2626', '<b>Expiring:</b> Vitamin C Serum lot VC-2291 expires in 21 days (6 pcs)', 'Today 08:00', 'product-detail.html', 'Open'],
        ['file-warning', '#dc2626', '<b>Missing consent:</b> Burcu Koç, 14:00 laser appointment', 'Today 08:00', 'customer-detail.html', 'Open'],
        ['hand-coins', '#dc2626', '<b>Overdue payment:</b> Cem Aktaş, ₺3,000 due 01.11.2026', 'Today 08:00', 'kasa.html#k-receivables', 'Open'],
        ['receipt', '#d97706', '<b>3 sales</b> without receipt photo', 'Yesterday', 'kasa.html#k-sales', 'Open'],
        ['wrench', '#0284c7', '<b>Handpiece</b> of Diode 808 at 91% of rated shots', 'Yesterday', 'settings.html#x-devices', 'Open']
      ],
      accepted: 'Added to checkout · recommendation marked <b>Accepted</b>',
      rejected: 'Marked <b>Rejected</b> · reason saved for reporting'
    },
    tr: {
      groups: ['Günlük', 'Yönetim'],
      nav: { dashboard: 'Bugün', calendar: 'Takvim', customers: 'Müşteriler', kasa: 'Kasa', catalog: 'Katalog ve stok', team: 'Ekip', settings: 'Ayarlar' },
      off: 'kapalı',
      foot: 'Victoria Güzellik &amp; Bakım<br><span style="color:#64748b">Tek şube · v0.1 prototip</span>',
      tagline: 'Güzellik &amp; Bakım',
      search: 'Telefon veya isimle müşteri, ürün, satış no ara…',
      newAppt: 'Yeni randevu', myDay: 'Günüm', switchUser: 'Kullanıcı değiştir', quickConsult: 'Hızlı danışma', aiTitle: 'Verilerinize sorun', notifTitle: 'Bildirimler', owner: 'İşletme sahibi',
      banner: 'Tıklanabilir HTML prototipi: örnek veriler, hiçbir şey kaydedilmez.',
      sitemap: 'Site haritası',
      ask: 'Verilerinize sorun', phase2: 'Faz 2',
      chat:
        '<div class="msg user">Geçen ay en çok ürün satan personel kim?</div>' +
        '<div class="msg bot">Ekim ayında en çok ürünü <b>Merve Kaya</b> sattı: <b>38 adet, ₺24.350</b>.<br>İkinci sırada 21 adetle (₺12.900) Ayşe Demir var.<table class="table mt" style="background:#fff;border-radius:6px"><tr><th>Personel</th><th class="num">Adet</th><th class="num">Ciro</th></tr><tr><td>Merve Kaya</td><td class="num">38</td><td class="num">₺24.350</td></tr><tr><td>Ayşe Demir</td><td class="num">21</td><td class="num">₺12.900</td></tr><tr><td>Elif Şahin</td><td class="num">9</td><td class="num">₺5.120</td></tr></table><div class="small muted mt">Kaynak: 01.10–31.10 satışları, yalnızca ürün satırları, iadeler düşülmüş.</div></div>' +
        '<div class="msg user">Ne kadar lazer soğutma jeli kullandık?</div>' +
        '<div class="msg bot">Ekim ayında 96 lazer seansında 4,2 L (seans başına ort. 44 ml). Mevcut stok: 1,8 L; bu hızla yaklaşık 12 gün yeter. <a href="product-detail.html">Ürünü aç</a></div>',
      askPh: 'Satış, stok, personel, müşteri hakkında sorun…',
      notifs: [
        ['alert-triangle', '#d97706', '<b>Kritik stok:</b> Lazer soğutma jeli 5 L (1,8 L kaldı)', '10 dk önce', 'product-detail.html', 'Aç'],
        ['calendar-clock', '#dc2626', '<b>SKT yaklaşıyor:</b> C Vitamini Serum, lot VC-2291, 21 gün içinde (6 adet)', 'Bugün 08:00', 'product-detail.html', 'Aç'],
        ['file-warning', '#dc2626', '<b>Eksik onam:</b> Burcu Koç, 14:00 lazer randevusu', 'Bugün 08:00', 'customer-detail.html', 'Aç'],
        ['hand-coins', '#dc2626', '<b>Gecikmiş ödeme:</b> Cem Aktaş, ₺3.000, vade 01.11.2026', 'Bugün 08:00', 'kasa.html#k-receivables', 'Aç'],
        ['receipt', '#d97706', '<b>3 satışın</b> fiş fotoğrafı yok', 'Dün', 'kasa.html#k-sales', 'Aç'],
        ['wrench', '#0284c7', 'Diode 808 <b>başlığı</b> atım ömrünün %91’inde', 'Dün', 'settings.html#x-devices', 'Aç']
      ],
      accepted: 'Satışa eklendi · öneri <b>Kabul edildi</b> olarak işaretlendi',
      rejected: '<b>Reddedildi</b> olarak işaretlendi · neden raporlama için kaydedildi'
    }
  }[LANG];

  var NAV = [
    { items: [
      { id: 'dashboard', href: 'index.html', icon: 'sun' },
      { id: 'calendar', href: 'calendar.html', icon: 'calendar-days' },
      { id: 'customers', href: 'customers.html', icon: 'users' },
      { id: 'kasa', href: 'kasa.html', icon: 'wallet', pill: '5' }] },
    { items: [
      { id: 'catalog', href: 'catalog.html', icon: 'package' },
      { id: 'team', href: 'employees.html', icon: 'user-cog' },
      { id: 'settings', href: 'settings.html', icon: 'settings' }] }
  ];

  // Role: owner sees everything; a specialist (treatment-room tablet) sees a short menu.
  var ROLE = document.body.getAttribute('data-role');
  try {
    if (ROLE) sessionStorage.setItem('victoria-role', ROLE);
    else ROLE = sessionStorage.getItem('victoria-role');
  } catch (e) {}
  ROLE = ROLE || 'owner';
  if (ROLE === 'specialist') {
    NAV = [{ items: [
      { id: 'dashboard', href: 'my-day.html', icon: 'sun', label: T.myDay },
      { id: 'calendar', href: 'calendar.html', icon: 'calendar-days' },
      { id: 'customers', href: 'customers.html', icon: 'users' },
      { id: 'kasa', href: 'kasa.html', icon: 'wallet' }] }];
  }
  var page = document.body.getAttribute('data-page') || '';
  var nav = page.split(':')[0];
  var file = location.pathname.split('/').pop() || 'index.html';
  var otherLangHref = (LANG === 'tr' ? '../' : 'tr/') + file + location.hash;

  var fav = document.createElement('link'); fav.rel = 'icon'; fav.href = ASSETS + 'logo.jpg'; document.head.appendChild(fav);

  // ---------- Sidebar ----------
  var sider = document.getElementById('sider');
  if (sider) {
    var html = '<a class="brand" href="index.html"><img class="logo-img" src="' + ASSETS + 'logo.jpg" alt="Victoria">' +
      '<span><span class="brand-name">VICTORIA</span><span class="brand-tag">' + T.tagline + '</span></span></a><nav class="nav">';
    NAV.forEach(function (g, gi) {
      html += '<div class="group">' + T.groups[gi] + '</div>';
      g.items.forEach(function (it) {
        html += '<a href="' + it.href + '" class="' + (it.id === nav ? 'active' : '') + '">' +
          '<i data-lucide="' + it.icon + '"></i>' + (it.label || T.nav[it.id]) +
          (it.pill ? '<span class="pill">' + it.pill + '</span>' : '') + '</a>';
      });
    });
    html += '</nav><div class="foot">' + T.foot + '</div>';
    sider.className = 'sider';
    sider.innerHTML = html;
  }

  // ---------- Header ----------
  var header = document.getElementById('header');
  if (header) {
    header.className = 'header';
    header.innerHTML =
      '<label class="search"><i data-lucide="search"></i><input placeholder="' + T.search + '" ' +
      'onkeydown="if(event.key===\'Enter\')location.href=\'customers.html\'"><span class="small muted">Ctrl K</span></label>' +
      '<div class="spacer"></div>' +
      '<a class="btn sm ai" href="consultation.html"><i data-lucide="sparkles"></i>' + T.quickConsult + '</a>' +
      '<a class="btn sm" href="calendar.html#new"><i data-lucide="calendar-plus"></i>' + T.newAppt + '</a>' +
      '<button class="icon-btn" data-open="drawer-assistant" title="' + T.aiTitle + '"><i data-lucide="sparkles" style="color:#7c3aed"></i></button>' +
      '<button class="icon-btn" data-open="drawer-notifications" title="' + T.notifTitle + '"><i data-lucide="bell"></i><span class="dot">6</span></button>' +
      '<div class="lang">' +
        (LANG === 'tr' ? '<button class="on">TR</button><a class="lang-link" href="' + otherLangHref + '">EN</a>'
                       : '<a class="lang-link" href="' + otherLangHref + '">TR</a><button class="on">EN</button>') +
      '</div>' +
      '<a class="avatar" href="login.html" title="' + T.switchUser + '">' + (ROLE === 'specialist' ? 'AD' : 'FK') + '</a>';
    var banner = document.createElement('div');
    banner.className = 'proto-banner';
    banner.innerHTML = '<i data-lucide="flask-conical"></i>' + T.banner + ' <a href="sitemap.html" style="margin-left:auto">' + T.sitemap + '</a>';
    header.insertAdjacentElement('afterend', banner);
  }

  // ---------- Global drawers ----------
  var notifHtml = T.notifs.map(function (n) {
    return '<li><i data-lucide="' + n[0] + '" style="color:' + n[1] + '"></i><div class="grow">' + n[2] +
      '<div class="small muted">' + n[3] + '</div></div><a class="btn sm" href="' + n[4] + '">' + n[5] + '</a></li>';
  }).join('');
  var globals =
    '<div class="overlay" id="overlay"></div>' +
    '<aside class="drawer" id="drawer-assistant"><div class="drawer-head"><h3><i data-lucide="sparkles" style="color:#7c3aed"></i>' + T.ask + ' <span class="tag purple">' + T.phase2 + '</span></h3><button class="icon-btn" data-close><i data-lucide="x"></i></button></div>' +
    '<div class="drawer-body"><div class="chat">' + T.chat + '</div></div>' +
    '<div class="drawer-foot" style="justify-content:stretch"><input class="input" placeholder="' + T.askPh + '"><button class="btn ai"><i data-lucide="send"></i></button></div></aside>' +
    '<aside class="drawer" id="drawer-notifications"><div class="drawer-head"><h3><i data-lucide="bell"></i>' + T.notifTitle + '</h3><button class="icon-btn" data-close><i data-lucide="x"></i></button></div><div class="drawer-body" style="padding:0"><ul class="list">' +
    notifHtml + '</ul></div></aside>' +
    '<div class="toast" id="toast" style="position:fixed;top:64px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #e2e8f0;box-shadow:0 6px 16px rgba(0,0,0,.08);border-radius:8px;padding:8px 14px;z-index:1000;display:none;font-size:13px"></div>';
  document.body.insertAdjacentHTML('beforeend', globals);

  // ---------- Interactions ----------
  var overlay = document.getElementById('overlay');
  function closeAll() {
    document.querySelectorAll('.drawer.on,.modal.on').forEach(function (d) { d.classList.remove('on'); });
    overlay.classList.remove('on');
  }
  window.openPanel = function (id) {
    closeAll();
    var el = document.getElementById(id);
    if (el) { el.classList.add('on'); overlay.classList.add('on'); if (window.lucide) lucide.createIcons(); }
  };
  window.toast = function (msg) {
    var t = document.getElementById('toast');
    t.innerHTML = msg; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 2200);
  };
  overlay.addEventListener('click', closeAll);

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t) { e.preventDefault(); openPanel(t.getAttribute('data-open')); return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeAll(); return; }

    var tab = e.target.closest('.tabs button[data-tab]');
    if (tab) {
      var bar = tab.parentElement, grp = bar.getAttribute('data-tabs');
      bar.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === tab); });
      document.querySelectorAll('.tab-panel[data-group="' + grp + '"]').forEach(function (p) {
        p.classList.toggle('on', p.id === tab.getAttribute('data-tab'));
      });
      return;
    }
    var chip = e.target.closest('.chips button');
    if (chip) { chip.classList.toggle('on'); return; }
    var seg = e.target.closest('.seg button, .pay-methods button');
    if (seg) {
      seg.parentElement.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', b === seg);
        var tgt = b.getAttribute('data-show') && document.getElementById(b.getAttribute('data-show'));
        if (tgt) tgt.style.display = b === seg ? '' : 'none';
      });
      var hide = seg.parentElement.getAttribute('data-hide-when');
      if (hide) document.querySelectorAll(hide).forEach(function (el) { el.style.display = seg.hasAttribute('data-show') ? 'none' : ''; });
      return;
    }
    var row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a,button,input')) { location.href = row.getAttribute('data-href'); return; }

    var reco = e.target.closest('[data-reco]');
    if (reco) {
      var card = reco.closest('.reco'), act = reco.getAttribute('data-reco');
      card.classList.remove('accepted', 'rejected');
      card.classList.add(act === 'accept' ? 'accepted' : 'rejected');
      toast(act === 'accept' ? T.accepted : T.rejected);
      return;
    }
    var tst = e.target.closest('[data-toast]');
    if (tst) { e.preventDefault(); toast(tst.getAttribute('data-toast')); closeAll(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); var s = document.querySelector('.header .search input'); if (s) s.focus(); }
  });

  // Deep links: #tab-id activates a tab (and its outer tab), #drawer-id opens a drawer or modal.
  if (location.hash) {
    var h = location.hash.slice(1).replace(/^new$/, 'drawer-new');
    var tabBtn = document.querySelector('.tabs button[data-tab="' + h + '"]');
    if (tabBtn) {
      var outer = tabBtn.closest('.tab-panel');
      if (outer) { var ob = document.querySelector('.tabs button[data-tab="' + outer.id + '"]'); if (ob) ob.click(); }
      tabBtn.click();
    } else {
      var el = document.getElementById(h);
      if (el && (el.classList.contains('drawer') || el.classList.contains('modal'))) openPanel(h);
    }
  }
  if (window.lucide) lucide.createIcons();
})();
