/* Victoria demo — core: helpers, state, router, shell, drawers, event wiring. */
(function () {
  // ---------- Formatting & dates ----------
  V.money = (n) => (n < -0.5 ? '−' : '') + '₺' + Math.abs(Math.round(n || 0)).toLocaleString('tr-TR');
  V.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  V.d = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d || 1)); };
  V.iso = (d) => d.toISOString().slice(0, 10);
  V.addDays = (s, n) => { const d = V.d(s); d.setUTCDate(d.getUTCDate() + n); return V.iso(d); };
  V.addMonths = (s, n) => { const d = V.d(s); d.setUTCMonth(d.getUTCMonth() + n); return V.iso(d); };
  V.days = (a, b) => Math.round((V.d(b) - V.d(a)) / 864e5);
  V.ds = (s) => (s && s.length >= 10 ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) : s && s.length === 7 ? s.slice(5, 7) + '/' + s.slice(0, 4) : s || '');
  V.dayName = (s) => ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][V.d(s).getUTCDay()];
  V.mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  V.hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  V.num = (v) => { const n = parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };

  // ---------- State ----------
  const KEY = 'victoria-demo-v1';
  V.load = () => { try { const s = localStorage.getItem(KEY); if (s) { const o = JSON.parse(s); if (o && o.v === 1) return o; } } catch (e) {} return V.seed(); };
  V.save = () => { try { localStorage.setItem(KEY, JSON.stringify(V.S)); } catch (e) {} };
  V.reset = () => { V.S = V.seed(); V.UI = {}; V.save(); V.go('#/baslangic'); V.toast('Demo sıfırlandı'); };
  V.id = (k, prefix, pad) => { V.S.seq[k] = (V.S.seq[k] || 0) + 1; return prefix + String(V.S.seq[k]).padStart(pad || 0, '0'); };
  V.UI = {};

  // ---------- Lookups ----------
  const by = (arr, id) => arr.find((x) => x.id === id);
  V.cust = (id) => by(V.S.customers, id);
  V.staff = (id) => by(V.S.staff, id);
  V.svc = (id) => by(V.S.services, id);
  V.prod = (id) => by(V.S.products, id);
  V.tpl = (id) => by(V.S.templates, id);
  V.pkg = (id) => by(V.S.packages, id);
  V.appt = (id) => by(V.S.appts, id);
  V.plan = (id) => by(V.S.plans, id);
  V.sale = (id) => by(V.S.sales, id);
  V.dev = (id) => by(V.S.devices, id);
  V.area = (svcId, areaId) => { const s = V.svc(svcId); return s && s.areas ? s.areas.find((a) => a.id === areaId) : null; };
  V.svcLabel = (svcId, areaId) => { const s = V.svc(svcId); const a = V.area(svcId, areaId); return s ? s.name + (a ? ' · ' + a.name : '') : ''; };
  V.svcPrice = (svcId, areaId) => { const a = V.area(svcId, areaId); return a ? a.price : (V.svc(svcId) || {}).price || 0; };
  V.svcDur = (svcId, areaId) => { const a = V.area(svcId, areaId); return a ? a.dur : (V.svc(svcId) || {}).dur || 30; };
  V.user = () => V.S.session ? V.staff(V.S.session.user) : V.staff('fk');
  V.isSpecialist = () => (V.user() || {}).kind === 'specialist';
  V.specialists = () => V.S.staff.filter((s) => s.kind === 'specialist');

  // ---------- Money & plans ----------
  V.lineTotal = (l) => l.qty * l.price * (1 - (l.disc || 0) / 100);
  V.saleTotal = (s) => s.lines.reduce((a, l) => a + V.lineTotal(l), 0) - (s.discount || 0);
  V.salePaid = (s) => (s.payments || []).reduce((a, p) => a + p.amount, 0);
  V.instOpen = (i) => i.amount - (i.paid || 0);
  V.planOpen = (p) => p.inst.reduce((a, i) => a + V.instOpen(i), 0);
  V.custBalance = (cid) => V.S.plans.filter((p) => p.customer === cid).reduce((a, p) => a + V.planOpen(p), 0);
  V.custOverdue = (cid) => V.openInst().filter((x) => x.plan.customer === cid && x.inst.due < V.TODAY).reduce((a, x) => a + V.instOpen(x.inst), 0);
  V.openInst = () => {
    const out = [];
    V.S.plans.forEach((p) => p.inst.forEach((i, n) => { if (V.instOpen(i) > 0.5) out.push({ plan: p, inst: i, n: n + 1, of: p.inst.length }); }));
    return out.sort((a, b) => a.inst.due.localeCompare(b.inst.due));
  };
  V.instStatus = (i) => {
    if (V.instOpen(i) <= 0.5) return ['Ödendi', 'green'];
    const d = V.days(V.TODAY, i.due);
    if (d < 0) return [-d + ' gün gecikti', 'red'];
    if (d === 0) return ['Bugün', 'orange'];
    if (d <= 7) return [d + ' gün sonra', 'orange'];
    return ['Planlandı', ''];
  };
  V.consentOk = (c, key) => c.consents && c.consents[key] && c.consents[key] >= V.TODAY;

  // Appointment warnings (shown when booking and on the appointment).
  V.apptWarnings = (a) => {
    const c = V.cust(a.customer), s = V.svc(a.service), w = [];
    if (!c || !s) return w;
    if (s.consent && !V.consentOk(c, s.consent)) w.push(['error', (V.CONSENTS.find((x) => x[0] === s.consent) || [])[1] + ' eksik veya süresi dolmuş']);
    if (c.allergies && c.allergies.length) w.push(['warning', 'Alerji: ' + c.allergies.join(', ')]);
    if (c.note) w.push(['warning', c.note]);
    const hit = (s.contra || []).filter((f) => (c.flags || []).includes(f) && f !== 'lazer_kur');
    if (hit.length) w.push(['error', 'Kontrendikasyon: ' + hit.map((f) => V.FLAG_TEXT[f]).join(', ')]);
    return w;
  };
  V.conflict = (a, ignoreId) => {
    const s1 = V.mins(a.start), e1 = s1 + a.dur;
    return V.S.appts.find((b) => b.id !== ignoreId && b.date === a.date && !['cancelled', 'noshow'].includes(b.status) &&
      (b.staff === a.staff || (a.device && b.device === a.device)) && V.mins(b.start) < e1 && s1 < V.mins(b.start) + b.dur);
  };

  // ---------- Router & shell ----------
  V.screens = {};
  V.drawers = {};
  V.act = {};
  V.route = () => {
    const h = (V.UI.at || '').replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {}; (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v || ''); });
    return { name: parts[0] || '', param: parts[1], q };
  };
  // In-page navigation: hosted pages only allow plain #name hashes, so the route lives in V.UI.at.
  V.go = (h) => {
    const changed = V.UI.at !== h;
    V.UI.at = h;
    if (changed) { V.UI.drawer = V.UI.keepDrawer ? V.UI.drawer : null; V.UI.keepDrawer = false; }
    V.render(); if (changed) window.scrollTo(0, 0); V.flushToast();
  };

  const NAV_OWNER = [
    ['Demo', [['baslangic', 'Nasıl test edilir?', 'flag'], ['ozet', 'Gereksinim özeti', 'file-text']]],
    ['Günlük', [['bugun', 'Bugün', 'sun'], ['takvim', 'Takvim', 'calendar-days'], ['musteriler', 'Müşteriler', 'users'], ['kasa', 'Kasa', 'wallet']]],
    ['Yönetim', [['katalog', 'Katalog ve stok', 'package'], ['ekip', 'Ekip', 'user-cog'], ['ayarlar', 'Ayarlar', 'settings']]]
  ];
  const NAV_SPEC = [
    ['Demo', [['baslangic', 'Nasıl test edilir?', 'flag']]],
    ['Günlük', [['gunum', 'Günüm', 'sun'], ['takvim', 'Takvim', 'calendar-days'], ['musteriler', 'Müşteriler', 'users'], ['kasa', 'Kasa', 'wallet']]]
  ];
  const ACTIVE = { musteri: 'musteriler', danisma: 'musteriler', uygulama: 'takvim' };

  V.render = () => {
    const r = V.route();
    if (!r.name) { V.go(V.S.seenStart ? (V.S.session ? (V.isSpecialist() ? '#/gunum' : '#/bugun') : '#/giris') : '#/baslangic'); return; }
    const app = document.getElementById('app');
    document.body.classList.remove('touch');
    if (r.name === 'giris') { app.innerHTML = V.screens.giris(r); V.icons(); return; }
    const screen = V.screens[r.name] || V.screens.bugun;
    let body;
    try { body = screen(r); } catch (e) { console.error(e); body = '<div class="alert error">Bu ekranda bir hata oluştu: ' + V.esc(e.message) + '</div>'; }
    const u = V.user(), spec = V.isSpecialist(), active = ACTIVE[r.name] || r.name;
    const overdue = V.openInst().filter((x) => x.inst.due < V.TODAY).length;
    const missing = V.S.sales.filter((s) => !s.receipt && !s.refunded).length;
    const nav = (spec ? NAV_SPEC : NAV_OWNER).map(([g, items]) => '<div class="group">' + g + '</div>' + items.map(([id, label, icon]) =>
      '<a href="#/' + id + '" class="' + (active === id ? 'active' : '') + '"><i data-lucide="' + icon + '"></i>' + label +
      (id === 'kasa' && overdue + missing ? '<span class="pill">' + (overdue + missing) + '</span>' : '') + '</a>').join('')).join('');
    app.innerHTML =
      '<div class="shell"><aside class="sider"><a class="brand" href="#/' + (spec ? 'gunum' : 'bugun') + '"><img class="logo-img" src="' + V.LOGO + '" alt="Victoria"><span><span class="brand-name">VICTORIA</span><span class="brand-tag">Güzellik &amp; Bakım</span></span></a>' +
      '<nav class="nav">' + nav + '</nav><div class="foot">Demo · ' + V.ds(V.TODAY) + ' ' + V.dayName(V.TODAY) + ', ' + V.NOW + '<br><a href="#" data-act="reset" style="color:#a08a63">Demoyu sıfırla</a></div></aside>' +
      '<div class="main"><header class="header"><label class="search"><i data-lucide="search"></i><input placeholder="Müşteri ara: isim veya telefon" data-input="search" value="' + V.esc(V.UI.search || '') + '"></label><div class="spacer"></div>' +
      '<a class="btn sm ai" href="#/danisma"><i data-lucide="sparkles"></i>Hızlı danışma</a>' +
      (spec ? '' : '<a class="btn sm" href="#" data-act="newAppt"><i data-lucide="calendar-plus"></i>Yeni randevu</a>') +
      '<a class="avatar" href="#/giris" title="Kullanıcı değiştir">' + V.esc(u.initials) + '</a></header>' +
      '<div class="proto-banner"><i data-lucide="flask-conical"></i>Deneme sürümü: veriler yalnızca bu tarayıcıda tutulur, hiçbir yere gönderilmez. Bugün ' + V.ds(V.TODAY) + ' kabul edilir. <a href="#/baslangic" style="margin-left:auto">Görevler</a></div>' +
      '<main class="content">' + body + '</main></div></div>' +
      '<div class="overlay" id="overlay" data-act="closeDrawer"></div><aside class="drawer" id="drawer"></aside>' +
      '<div class="toast" id="toast"></div>';
    if (V.UI.drawer) V.renderDrawer();
    V.icons();
    if (V.UI.focusSearch) { const i = document.querySelector('[data-input="search"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } V.UI.focusSearch = false; }
  };
  V.icons = () => { if (window.lucide) lucide.createIcons(); };

  // ---------- Drawers & toast ----------
  V.openDrawer = (kind, data) => { V.UI.drawer = { kind, data: data || {} }; V.renderDrawer(); };
  V.renderDrawer = () => {
    const el = document.getElementById('drawer'), ov = document.getElementById('overlay');
    if (!el) return;
    const d = V.UI.drawer;
    if (!d) { el.classList.remove('on', 'wide'); ov.classList.remove('on'); return; }
    const out = V.drawers[d.kind](d.data);
    el.className = 'drawer on' + (out.wide ? ' wide' : '');
    el.innerHTML = '<div class="drawer-head"><h3>' + out.title + '</h3><button class="icon-btn" data-act="closeDrawer"><i data-lucide="x"></i></button></div>' +
      '<div class="drawer-body stack">' + out.body + '</div>' + (out.foot ? '<div class="drawer-foot">' + out.foot + '</div>' : '');
    ov.classList.add('on');
    V.icons();
  };
  V.closeDrawer = () => { V.UI.drawer = null; V.renderDrawer(); };
  V.form = (scope) => {
    const o = {};
    document.querySelectorAll((scope || '#drawer') + ' [name]').forEach((el) => {
      if (el.type === 'checkbox') { if (el.dataset.multi) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; }
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value;
    });
    return o;
  };
  V.syncDrawer = () => { if (V.UI.drawer) Object.assign(V.UI.drawer.data, V.form()); };
  V.toast = (msg) => {
    const t = document.getElementById('toast'); if (!t) return;
    t.innerHTML = msg; t.style.display = 'block';
    clearTimeout(V._tt); V._tt = setTimeout(() => { t.style.display = 'none'; }, 2600);
  };
  // Save state, then re-render (or navigate) and show a confirmation.
  V.commit = (msg, hash) => {
    V.save();
    V.UI.pendingToast = msg || null;
    if (hash && V.UI.at !== hash) { V.go(hash); return; }
    V.render(); V.flushToast();
  };
  V.flushToast = () => { if (V.UI.pendingToast) { V.toast(V.UI.pendingToast); V.UI.pendingToast = null; } };

  // ---------- Small HTML helpers ----------
  V.tag = (text, cls) => '<span class="tag ' + (cls || '') + '">' + text + '</span>';
  V.statusTag = (st) => { const s = V.STATUS[st] || [st, '']; return V.tag(s[0], s[1]); };
  V.opt = (value, label, sel) => '<option value="' + V.esc(value) + '"' + (String(sel) === String(value) ? ' selected' : '') + '>' + V.esc(label) + '</option>';
  V.custOptions = (sel, allowNone) => (allowNone ? V.opt('', allowNone, sel) : '') + V.S.customers.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr')).map((c) => V.opt(c.id, c.name + ' · ' + c.phone, sel)).join('');
  V.header = (title, sub, actions) => '<div class="page-header"><div class="title"><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div>';
  V.tabs = (key, list, cur) => '<div class="tabs main-tabs">' + list.map(([id, label, icon]) => '<button class="' + (cur === id ? 'on' : '') + '" data-act="tab" data-key="' + key + '" data-id="' + id + '">' + (icon ? '<i data-lucide="' + icon + '"></i>' : '') + label + '</button>').join('') + '</div>';
  V.stat = (cls, label, value, note) => '<div class="stat ' + cls + '"><div class="label">' + label + '</div><div class="value">' + value + '</div>' + (note ? '<div class="note">' + note + '</div>' : '') + '</div>';
  V.alerts = (list) => list.map(([k, t]) => '<div class="alert ' + k + '"><i data-lucide="' + (k === 'error' ? 'alert-octagon' : 'alert-triangle') + '"></i><div>' + t + '</div></div>').join('');

  // ---------- Common actions ----------
  V.act.closeDrawer = () => V.closeDrawer();
  V.act.reset = () => V.openDrawer('confirmReset');
  V.drawers.confirmReset = () => ({ title: '<i data-lucide="rotate-ccw"></i>Demoyu sıfırla',
    body: '<p>Demo baştan başlasın mı? Yaptığınız tüm değişiklikler (randevular, satışlar, cevaplar) silinir.</p>',
    foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn danger" data-act="doReset">Evet, sıfırla</button>' });
  V.act.doReset = () => V.reset();
  // A tab click wins over a ?tab= / ?appt= in the current route, so drop the query.
  V.act.tab = (el) => { V.UI['tab_' + el.dataset.key] = el.dataset.id; V.UI.at = (V.UI.at || '').split('?')[0]; V.render(); };
  V.act.go = (el) => V.go(el.dataset.href);
  V.act.search = (el) => { V.UI.search = el.value; V.UI.focusSearch = true; if (V.route().name !== 'musteriler') V.go('#/musteriler'); else V.render(); };
  V.act.toggleUI = (el) => { const k = el.dataset.key, v = el.dataset.val; const s = new Set(V.UI[k] || []); s.has(v) ? s.delete(v) : s.add(v); V.UI[k] = [...s]; V.render(); };
  V.act.setUI = (el) => { V.UI[el.dataset.key] = el.dataset.val; V.render(); };
  V.act.drawerSync = () => { V.syncDrawer(); V.renderDrawer(); };
  V.act.drawerSet = (el) => { V.syncDrawer(); V.UI.drawer.data[el.dataset.key] = el.dataset.val; V.renderDrawer(); };

  // ---------- Event wiring ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (a && !(a.tagName === 'INPUT' || a.tagName === 'SELECT')) {
      e.preventDefault();
      const fn = V.act[a.dataset.act]; if (fn) fn(a, e); else console.warn('no action', a.dataset.act);
      return;
    }
    const link = e.target.closest('a[href^="#/"]');
    if (link) { e.preventDefault(); V.go(link.getAttribute('href')); return; }
    const r = e.target.closest('[data-href]');
    if (r && !e.target.closest('a,button,input,select,textarea')) V.go(r.dataset.href);
  });
  document.addEventListener('change', (e) => { const a = e.target.closest('[data-change]'); if (a) { const fn = V.act[a.dataset.change]; if (fn) fn(a, e); } });
  document.addEventListener('input', (e) => { const a = e.target.closest('[data-input]'); if (a) { const fn = V.act[a.dataset.input]; if (fn) fn(a, e); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') V.closeDrawer(); });
  window.addEventListener('hashchange', () => { if ((location.hash || '').startsWith('#/')) V.go(location.hash); });
  const boot = () => { V.S = V.load(); V.UI.at = (location.hash || '').startsWith('#/') ? location.hash : ''; V.render(); };
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot); else boot();
})();
