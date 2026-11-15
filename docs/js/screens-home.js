/* Victoria demo — start page, requirements summary, sign-in, Today, My day. */
(function () {
  const S = () => V.S;

  // ---------- Start page: tasks + decisions ----------
  const TASKS = [
    ['t1', 'Randevu oluşturun', 'Takvim\'de boş bir saate tıklayın, bir müşteri ve lazer bölgesi seçip randevuyu kaydedin.', '#/takvim'],
    ['t2', 'Randevusuz gelen birine danışıp satış yapın', 'Üstteki "Hızlı danışma" → "Randevusuz" → ihtiyaçları seçin → öneriyi kabul edin → yeni müşteri olarak kaydedin → ödemeyi alın.', '#/danisma'],
    ['t3', 'Taksitli paket satın', 'Kasa → Yeni satış → bir müşteri seçin → "Paket sat" → ödemeyi "Sonra öde" ile taksitlendirin.', '#/kasa'],
    ['t4', 'Gecikmiş bir ödemeyi tahsil edin', 'Kasa → Alacaklar → Cem Aktaş\'ın gecikmiş taksiti → Tahsil et.', '#/kasa?tab=alacak'],
    ['t5', 'Uzman olarak bir uygulamayı kaydedip ödemesini alın', 'Sağ üstteki baş harflere dokunun → Ayşe Demir → herhangi 4 rakam → Günüm → Nazlı Aksoy → Uygulamayı başlat → Tamamla → Ödemeyi al.', '#/giris'],
    ['t6', 'Günü kapatın', 'Kasa → Gün sonu → sayılan nakdi girin → Günü kapat.', '#/kasa?tab=gunsonu']
  ];
  const QUESTIONS = [
    ['lateCancel', 'Randevuya kaç saatten az kala iptal "geç iptal" sayılsın?', ['12 saat', '24 saat', '48 saat', 'Geç iptal takibi istemiyorum']],
    ['noShow', 'Gelmeyen müşterinin paket seansı ne olsun?', ['Pakette kalsın', 'Kullanılmış sayılsın', 'Duruma göre biz karar verelim']],
    ['creditLimit', '"Sonra öde" için müşteri başına varsayılan borç limiti?', [['5000', '₺5.000'], ['10000', '₺10.000'], ['20000', '₺20.000'], ['0', 'Limit olmasın']]],
    ['maxInst', 'En fazla kaç taksit verilebilsin?', ['3', '6', '12']],
    ['receipt', 'Resmi fişi nasıl kesiyorsunuz?', ['ÖKC (yazar kasa)', 'e-Arşiv fatura', 'İkisi de', 'Mali müşavire soracağım']],
    ['commission', 'Personele prim verilecek mi?', ['Şimdilik kapalı', 'Evet, hizmetlerden', 'Evet, ürün satışından', 'Evet, ikisinden de']],
    ['expenses', 'Giderleri (kira, maaş, fatura) uygulamada takip etmek ister misiniz?', ['Evet', 'Hayır, mali müşavir yeterli']]
  ];
  V.taskDone = (id) => !!S().tasks[id];

  V.screens.baslangic = () => {
    S().seenStart = true; V.save();
    const d = S().decisions, done = TASKS.filter((t) => V.taskDone(t[0])).length;
    const physOpts = S().services.filter((s) => s.cat !== 'Spa' && s.id !== 'kas').map((s) =>
      '<label class="chk"><input type="checkbox" name="physician" data-multi="1" value="' + s.id + '"' + (d.physician.includes(s.id) ? ' checked' : '') + '> ' + V.esc(s.name) + '</label>').join('');
    return V.header('Victoria uygulamasını deneyin', 'Bu, salonunuz için hazırlanan uygulamanın çalışan bir denemesidir. Gerçek gibi kullanabilirsiniz; veriler yalnızca bu cihazdaki tarayıcıda tutulur ve hiçbir yere gönderilmez.',
        '<a class="btn" href="#/ozet"><i data-lucide="file-text"></i>Gereksinim özeti</a><a class="btn primary" href="#/giris"><i data-lucide="log-in"></i>Uygulamaya giriş</a>') +
      '<div class="grid g-main">' +
      '<div class="stack">' +
        '<div class="card"><div class="card-head"><h3><i data-lucide="list-checks"></i>Deneme görevleri · ' + done + ' / ' + TASKS.length + '</h3><div class="progress" style="width:140px"><span style="width:' + Math.round(done / TASKS.length * 100) + '%"></span></div></div>' +
        TASKS.map((t, i) => '<div class="task' + (V.taskDone(t[0]) ? ' done' : '') + '"><span class="n">' + (V.taskDone(t[0]) ? '✓' : i + 1) + '</span><div class="grow"><b>' + t[1] + '</b><div class="small muted">' + t[2] + '</div></div><a class="btn sm" href="' + t[3] + '">Başla</a></div>').join('') + '</div>' +
        '<div class="alert info"><i data-lucide="info"></i><div><b>İpuçları:</b> Bugün 12.11.2026 Çarşamba, saat 12:45 kabul edilir. Telefon veya tablette de açabilirsiniz. Baştan başlamak için sol alttaki "Demoyu sıfırla"yı kullanın.</div></div>' +
      '</div>' +
      '<div class="card"><div class="card-head"><h3><i data-lucide="message-square-quote"></i>Sizin kararınız gereken konular</h3></div>' +
        QUESTIONS.map(([key, q, opts]) => '<div class="q"><b>' + q + '</b><div class="opts">' + opts.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o];
          return '<label class="chk"><input type="radio" name="' + key + '" value="' + V.esc(v) + '"' + (String(d[key]) === String(v) ? ' checked' : '') + '> ' + l + '</label>'; }).join('') + '</div></div>').join('') +
        '<div class="q"><b>Hangi işlemleri yalnızca hekim yapmalı?</b><div class="opts">' + physOpts + '</div></div>' +
        '<div class="q"><b>Eksik, yanlış veya fazla bulduğunuz bir şey var mı?</b><textarea class="input mt" name="notes" placeholder="Aklınıza gelen her şeyi yazın">' + V.esc(d.notes) + '</textarea></div>' +
        '<div class="card-body row wrap"><button class="btn primary" data-act="saveDecisions"><i data-lucide="save"></i>Cevapları kaydet</button><button class="btn" data-act="copyDecisions"><i data-lucide="copy"></i>Cevapları kopyala (WhatsApp / e-posta için)</button></div>' +
      '</div></div>';
  };
  V.act.saveDecisions = () => {
    const f = V.form('main');
    Object.keys(S().decisions).forEach((k) => { if (f[k] !== undefined) S().decisions[k] = f[k]; });
    S().decisions.physician = f.physician || [];
    S().services.forEach((s) => { s.physician = S().decisions.physician.includes(s.id); });
    V.commit('Cevaplarınız kaydedildi');
  };
  V.act.copyDecisions = () => {
    V.act.saveDecisions();
    const d = S().decisions, done = TASKS.filter((t) => V.taskDone(t[0])).map((t) => '✓ ' + t[1]);
    const txt = ['Victoria deneme cevapları', ''].concat(QUESTIONS.map(([k, q, opts]) => { const o = opts.map((x) => Array.isArray(x) ? x : [x, x]).find((x) => String(x[0]) === String(d[k])); return q + ' → ' + (o ? o[1] : d[k]); }),
      ['Yalnızca hekim: ' + d.physician.map((id) => V.svc(id).name).join(', '), '', 'Notlar: ' + (d.notes || '-'), '', 'Tamamlanan görevler:'], done.length ? done : ['(henüz yok)']).join('\n');
    const fallback = () => { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); };
    (navigator.clipboard ? navigator.clipboard.writeText(txt).catch(fallback) : Promise.resolve(fallback())).then(() => V.toast('Cevaplar kopyalandı; WhatsApp veya e-postaya yapıştırabilirsiniz'));
  };

  // ---------- Requirements summary ----------
  V.screens.ozet = () => V.header('Gereksinim özeti', 'Uygulamanın ilk sürümde ne yapacağı, ne yapmayacağı ve sizden beklenen kararlar. Teknik ayrıntı içermez.',
    '<a class="btn" href="#/baslangic"><i data-lucide="flag"></i>Deneme görevleri</a>') +
    '<div class="card"><div class="card-body summary">' +
    '<p>Victoria, merkezin günlük işini tek yerde toplayan bir <b>arka ofis</b> uygulamasıdır. Yalnızca siz ve personeliniz kullanır; müşteriler uygulamaya girmez, onlarla SMS üzerinden iletişim kurulur. Tablet, telefon ve bilgisayarda çalışır, Türkçe ve İngilizce kullanılabilir.</p>' +
    '<h2>İlk sürümde neler var?</h2><ul>' +
    '<li><b>Randevular ve takvim:</b> personel ve lazer cihazına göre günlük takvim, çakışma kontrolü, randevu hatırlatma SMS\'i, erteleme, iptal ve gelmedi kaydı, seans serileri.</li>' +
    '<li><b>Müşteriler:</b> iletişim bilgileri, cilt ve sağlık bilgileri (alerji, kontrendikasyon), KVKK ve uygulama onamları, öncesi/sonrası fotoğraflar, tüm geçmiş, paketler, hesap ve ödemeler.</li>' +
    '<li><b>Uygulama kaydı:</b> her seansta lazer ayarları (enerji, spot, atım sayısı), kullanılan ürünler ve lot numaraları, notlar. Kullanılan sarf malzemesi stoktan otomatik düşer.</li>' +
    '<li><b>Yapay zekâ ile danışma:</b> müşteri geldiğinde ihtiyaçları birkaç dokunuşla girilir; uygulama kendi ürün ve hizmetlerinizden uygun olanları, nedenini ve müşteriye ne söyleneceğini önerir. Alerji ve kontrendikasyonlar önce kural ile elenir; son kararı her zaman personel verir.</li>' +
    '<li><b>Kasa:</b> ürün, hizmet ve paket satışı; kart, nakit, havale; <b>sonra ödeme ve taksit</b> (vadeler, hatırlatma SMS\'i, tahsilat, gecikenler); resmi fişin fotoğrafını ekleme; iade; gider kaydı; gün sonu kasa sayımı.</li>' +
    '<li><b>Stok:</b> ürünler ve sarf malzemeleri, kritik stok ve son kullanma tarihi uyarıları, mal kabul.</li>' +
    '<li><b>Ekip:</b> kim hangi işlemi yaptı ve ne sattı; çalışma saatleri; prim (isterseniz açılır).</li>' +
    '<li><b>Raporlar:</b> ciro, tahsilat, gider ve yaklaşık kâr, personel bazında işlem ve satış, en çok satanlar; her liste Excel\'e aktarılabilir.</li>' +
    '<li><b>Güvenlik:</b> herkes kendi PIN\'i ile girer, herkes yalnızca yetkisi olanı görür, yapılan her işlem kaydedilir. Sağlık verileri KVKK\'ya uygun saklanır.</li></ul>' +
    '<h2>İlk sürümde neler yok?</h2><ul>' +
    '<li>Müşterilerin kendi başına online randevu alması veya uygulamaya girmesi.</li>' +
    '<li>Muhasebe, bordro ve resmi fatura kesme (ilk sürümde fiş fotoğrafı eklenir; e-Arşiv entegrasyonu sonra eklenebilir).</li>' +
    '<li>Sadakat puanı, hediye kartı, kampanyalar, birden fazla şube (sonraki aşamalar).</li></ul>' +
    '<h2>Sizden beklenen kararlar</h2><p>Geç iptal süresi, gelmeyen müşterinin paket seansı, sonra ödeme limiti ve taksit sayısı, resmi fiş yöntemi, prim ve hangi işlemlerin yalnızca hekim tarafından yapılacağı. Bunları <a href="#/baslangic">Nasıl test edilir?</a> sayfasından işaretleyip bize gönderebilirsiniz.</p>' +
    '<h2>Mali müşavir ve hukuk tarafında netleşmesi gerekenler</h2><ul><li>Resmi fiş: ÖKC mi, e-Arşiv mi?</li><li>Sonra ödemeli satışlarda fişin tamamının satış günü kesilmesi.</li><li>Yapay zekâ hizmetinin yurt dışında çalışması durumunda KVKK açısından gerekenler.</li></ul>' +
    '</div></div>';

  // ---------- Sign-in ----------
  V.screens.giris = () => {
    const sel = V.UI.loginUser || 'ad', pin = V.UI.pin || 0;
    const tiles = S().staff.map((s) => '<div class="user-tile' + (s.id === sel ? ' on' : '') + '" data-act="pickUser" data-id="' + s.id + '"><span class="avatar">' + V.esc(s.initials) + '</span><b>' + V.esc(s.name) + '</b><span class="small muted">' + V.esc(s.title) + '</span></div>').join('');
    return '<div class="login"><div class="login-box">' +
      '<div class="row between mb"><div class="row"><img src="' + V.LOGO + '" alt="Victoria" style="width:56px;height:56px;border-radius:12px"><div><div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:24px;letter-spacing:.14em;color:#9a7b45">VICTORIA</div><div class="small muted">Güzellik &amp; Bakım</div></div></div><a class="small" href="#/baslangic">Görevler</a></div>' +
      '<h2 style="font-size:18px;margin:8px 0 12px">Bu tableti kim kullanıyor?</h2><div class="user-tiles">' + tiles + '</div>' +
      '<div style="text-align:center;margin-top:18px"><b>' + V.esc(V.staff(sel).name) + '</b>, 4 haneli PIN\'inizi girin <span class="small muted">(denemede herhangi 4 rakam)</span></div>' +
      '<div class="pin">' + [0, 1, 2, 3].map((i) => '<span class="' + (i < pin ? 'f' : '') + '"></span>').join('') + '</div>' +
      '<div class="pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button data-act="pinKey">' + n + '</button>').join('') + '<button style="visibility:hidden"></button><button data-act="pinKey">0</button><button data-act="pinDel">⌫</button></div>' +
      '<p class="small muted" style="text-align:center;margin:16px 0 0">Uzmanlar sade "Günüm" ekranını, işletme sahibi ve resepsiyon tüm menüyü görür.</p></div></div>';
  };
  V.act.pickUser = (el) => { V.UI.loginUser = el.dataset.id; V.UI.pin = 0; V.render(); };
  V.act.pinDel = () => { V.UI.pin = Math.max(0, (V.UI.pin || 0) - 1); V.render(); };
  V.act.pinKey = () => {
    V.UI.pin = (V.UI.pin || 0) + 1; V.render();
    if (V.UI.pin >= 4) setTimeout(() => {
      S().session = { user: V.UI.loginUser || 'ad' }; V.UI.pin = 0; V.UI.loginUser = null; V.save();
      V.UI.pendingToast = 'Hoş geldiniz, ' + V.user().name.split(' ')[0]; V.go(V.isSpecialist() ? '#/gunum' : '#/bugun');
    }, 200);
  };

  // ---------- Shared numbers ----------
  V.todayStats = () => {
    const sales = S().sales.filter((s) => s.date === V.TODAY && !s.refunded);
    const appts = S().appts.filter((a) => a.date === V.TODAY && !['cancelled'].includes(a.status));
    const cols = S().collections.filter((c) => c.date === V.TODAY);
    return {
      sales, appts, revenue: sales.reduce((a, s) => a + V.saleTotal(s), 0),
      done: appts.filter((a) => ['completed', 'paid'].includes(a.status)).length,
      products: sales.reduce((a, s) => a + s.lines.filter((l) => l.type === 'product').reduce((x, l) => x + l.qty, 0), 0),
      aiProducts: sales.reduce((a, s) => a + s.lines.filter((l) => l.ai).length, 0),
      collected: cols.reduce((a, c) => a + c.amount, 0)
    };
  };
  V.alertsList = () => {
    const out = [];
    S().products.filter((p) => p.stock < p.min).forEach((p) => out.push(['package', '#d97706', '<b>Kritik stok:</b> ' + V.esc(p.name) + ' (' + p.stock + (p.retail ? ' adet' : '') + ' kaldı)', '#/katalog?tab=urun']));
    S().products.filter((p) => p.exp && p.exp <= V.TODAY.slice(0, 7).replace(/(\d+)-(\d+)/, (m, y, mo) => (mo === '12' ? (+y + 1) + '-01' : y + '-' + String(+mo + 1).padStart(2, '0')))).forEach((p) => out.push(['calendar-clock', '#dc2626', '<b>SKT yaklaşıyor:</b> ' + V.esc(p.name) + ' · ' + V.ds(p.exp), '#/katalog?tab=urun']));
    S().appts.filter((a) => a.date === V.TODAY && !['paid', 'completed', 'cancelled', 'noshow'].includes(a.status)).forEach((a) => {
      const s = V.svc(a.service), c = V.cust(a.customer);
      if (s.consent && !V.consentOk(c, s.consent)) out.push(['file-warning', '#dc2626', '<b>Eksik onam:</b> ' + V.esc(c.name) + ', ' + a.start + ' ' + V.esc(s.name), '#/musteri/' + c.id + '?tab=saglik']);
    });
    V.openInst().filter((x) => x.inst.due < V.TODAY).forEach((x) => out.push(['hand-coins', '#dc2626', '<b>Gecikmiş ödeme:</b> ' + V.esc(V.cust(x.plan.customer).name) + ' · ' + V.money(V.instOpen(x.inst)) + ' · vade ' + V.ds(x.inst.due), '#/kasa?tab=alacak']));
    const miss = S().sales.filter((s) => !s.receipt && !s.refunded).length;
    if (miss) out.push(['receipt', '#d97706', '<b>' + miss + ' satışın</b> fiş fotoğrafı/numarası yok', '#/kasa?tab=satislar']);
    return out;
  };

  // ---------- Today (owner / reception) ----------
  V.screens.bugun = (r) => {
    const tab = r.q.tab || V.UI.tab_bugun || 'bugun';
    const t = V.todayStats(), openBal = V.openInst().reduce((a, x) => a + V.instOpen(x.inst), 0), overdue = V.openInst().filter((x) => x.inst.due < V.TODAY).reduce((a, x) => a + V.instOpen(x.inst), 0);
    const head = V.header('Merhaba ' + V.user().name.split(' ')[0], V.ds(V.TODAY) + ' ' + V.dayName(V.TODAY) + ' · ' + t.appts.length + ' randevu · ' + t.done + ' tamamlandı',
      '<a class="btn" href="#" data-act="newAppt"><i data-lucide="calendar-plus"></i>Yeni randevu</a><a class="btn primary" href="#/kasa"><i data-lucide="shopping-cart"></i>Yeni satış</a>');
    if (tab === 'rapor') return head + V.tabs('bugun', [['bugun', 'Bugün', 'sun'], ['rapor', 'Raporlar', 'bar-chart-3']], tab) + V.reports();
    const rows = t.appts.slice().sort((a, b) => a.start.localeCompare(b.start)).map((a) => {
      const c = V.cust(a.customer), warn = V.apptWarnings(a).some((w) => w[0] === 'error');
      let btn = '';
      if (['booked', 'confirmed'].includes(a.status)) btn = '<button class="btn sm" data-act="setStatus" data-id="' + a.id + '" data-val="checkedin">Geldi</button>';
      else if (a.status === 'checkedin' || a.status === 'inprogress') btn = '<a class="btn sm" href="#/uygulama/' + a.id + '">Uygulama</a>';
      else if (a.status === 'completed') btn = '<a class="btn sm primary" href="#/kasa?appt=' + a.id + '">Ödeme al</a>';
      return '<tr><td>' + a.start + '</td><td><a href="#/musteri/' + c.id + '">' + V.esc(c.name) + '</a>' + (warn ? ' <i data-lucide="alert-triangle" style="color:#dc2626;width:14px;height:14px"></i>' : '') + '</td><td>' + V.esc(V.svcLabel(a.service, a.area)) +
        (a.pkg ? ' <span class="small muted">(paket)</span>' : '') + '</td><td>' + V.esc(V.staff(a.staff).name) + '</td><td>' + V.statusTag(a.status) + '</td><td class="right">' + btn + '</td></tr>';
    }).join('');
    const al = V.alertsList();
    return head + V.tabs('bugun', [['bugun', 'Bugün', 'sun'], ['rapor', 'Raporlar', 'bar-chart-3']], tab) +
      '<div class="grid g4 mb">' + V.stat('primary', 'Bugünkü ciro', V.money(t.revenue), t.sales.length + ' satış' + (t.collected ? ' · ' + V.money(t.collected) + ' tahsilat' : '')) +
      V.stat('success', 'Randevular', t.done + ' / ' + t.appts.length, 'tamamlandı') + V.stat('neutral', 'Satılan ürün', t.products, t.aiProducts + ' tanesi YZ önerisinden') +
      V.stat(overdue ? 'warning' : 'neutral', 'Açık alacak', V.money(openBal), (overdue ? V.money(overdue) + ' gecikmiş · ' : '') + '<a href="#/kasa?tab=alacak">Alacaklar</a>') + '</div>' +
      '<div class="grid g-main"><div class="card"><div class="card-head"><h3><i data-lucide="calendar-days"></i>Bugünkü randevular</h3><a class="btn sm" href="#/takvim">Takvim</a></div><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Saat</th><th>Müşteri</th><th>Hizmet</th><th>Personel</th><th>Durum</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h3><i data-lucide="bell"></i>Uyarılar</h3>' + V.tag(al.length, al.length ? 'orange' : 'green') + '</div><ul class="list">' +
      (al.length ? al.map(([ic, col, txt, href]) => '<li><i data-lucide="' + ic + '" style="color:' + col + '"></i><div class="grow">' + txt + '</div><a class="btn sm" href="' + href + '">Aç</a></li>').join('') : '<li class="muted">Uyarı yok</li>') + '</ul></div></div>';
  };
  V.act.setStatus = (el) => { const a = V.appt(el.dataset.id); a.status = el.dataset.val; V.closeDrawer(); V.commit(V.esc(V.cust(a.customer).name) + ': ' + V.STATUS[a.status][0]); };

  V.reports = () => {
    const b = S().baseline, t = V.todayStats();
    const monthSales = S().sales.filter((s) => s.date >= '2026-11-12' && !s.refunded);
    const svc = monthSales.reduce((a, s) => a + s.lines.filter((l) => l.type !== 'product').reduce((x, l) => x + V.lineTotal(l), 0), 0);
    const prd = monthSales.reduce((a, s) => a + s.lines.filter((l) => l.type === 'product').reduce((x, l) => x + V.lineTotal(l), 0), 0);
    const revenue = b.revenue + svc + prd;
    const collected = b.collected + S().collections.filter((c) => c.date >= '2026-11-12').reduce((a, c) => a + c.amount, 0);
    const exp = S().expenses.filter((e) => e.date.startsWith('2026-11') && !e.planned).reduce((a, e) => a + e.amount, 0);
    const planned = S().expenses.filter((e) => e.date.startsWith('2026-11') && e.planned).reduce((a, e) => a + e.amount, 0);
    const shown = b.aiShown + S().recos.length, acc = b.aiAccepted + S().recos.filter((x) => x.accepted).length;
    const staffRows = V.specialists().map((s) => {
      const base = b.staff[s.id] || [0, 0, 0];
      const lines = monthSales.flatMap((x) => x.lines).filter((l) => l.staff === s.id);
      const tr = S().treatments.filter((x) => x.staff === s.id && x.date >= '2026-11-12').length + S().appts.filter((a) => a.staff === s.id && a.date === V.TODAY && a.status === 'paid' && !S().treatments.some((x) => x.appt === a.id)).length;
      return '<tr><td>' + V.esc(s.name) + '</td><td class="num">' + (base[0] + tr) + '</td><td class="num">' + V.money(base[1] + lines.reduce((a, l) => a + V.lineTotal(l), 0)) + '</td><td class="num">' + (base[2] + lines.filter((l) => l.type === 'product').reduce((a, l) => a + l.qty, 0)) + '</td></tr>';
    }).join('');
    const best = b.best.map(([n, v], i) => '<div class="hbar"><span>' + n + '</span><div class="progress' + (i > 2 ? ' green' : '') + '"><span style="width:' + Math.round(v / b.best[0][1] * 100) + '%"></span></div><span class="right small">' + V.money(v) + '</span></div>').join('');
    return '<div class="row between wrap mb"><span class="muted">Kasım 2026 · ayın başından bugüne</span><button class="btn" data-act="exportNote"><i data-lucide="download"></i>Excel\'e aktar</button></div>' +
      '<div class="grid g4 mb">' + V.stat('primary', 'Ciro', V.money(revenue), 'hizmet ' + V.money(b.services + svc) + ' · ürün ' + V.money(b.products + prd)) +
      V.stat('success', 'Alacaklardan tahsilat', V.money(collected), V.money(V.openInst().reduce((a, x) => a + V.instOpen(x.inst), 0)) + ' hâlâ açık') +
      V.stat('neutral', 'Gider · yaklaşık kâr', V.money(exp) + ' · ' + V.money(revenue - exp), 'maaşlar (' + V.money(planned) + ') 30.11\'de') +
      V.stat('neutral', 'Kabul edilen YZ önerisi', '%' + Math.round(acc / shown * 100), acc + ' / ' + shown) + '</div>' +
      '<div class="grid g2"><div class="card"><div class="card-head"><h3>Personele göre</h3></div><div class="card-body flush"><table class="table"><thead><tr><th>Personel</th><th class="num">Uygulama</th><th class="num">Ciro</th><th class="num">Satılan ürün</th></tr></thead><tbody>' + staffRows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h3>En çok satanlar</h3></div><div class="card-body">' + best + '</div></div></div>';
  };
  V.act.exportNote = () => V.toast('Gerçek uygulamada bu liste Excel dosyası olarak iner');

  // ---------- My day (specialist) ----------
  V.screens.gunum = () => {
    let u = V.user(); if (u.kind !== 'specialist') u = V.staff('ad');
    const mine = S().appts.filter((a) => a.date === V.TODAY && a.staff === u.id && a.status !== 'cancelled').sort((a, b) => a.start.localeCompare(b.start));
    const open = mine.filter((a) => !['completed', 'paid', 'noshow'].includes(a.status));
    const next = open.find((a) => ['checkedin', 'inprogress'].includes(a.status)) || open.find((a) => a.start >= V.NOW) || open[0];
    const done = mine.filter((a) => ['completed', 'paid'].includes(a.status)).length;
    document.body.classList.add('touch');
    let nextHtml = '<div class="alert success"><i data-lucide="check-circle"></i>Bugün için bekleyen randevunuz yok.</div>';
    if (next) {
      const c = V.cust(next.customer), p = next.pkg ? V.pkg(next.pkg) : null, tp = p ? V.tpl(p.template) : null;
      const last = S().treatments.filter((x) => x.customer === c.id && x.service === next.service && x.area === next.area).sort((a, b) => b.date.localeCompare(a.date))[0];
      const w = V.apptWarnings(next);
      nextHtml = '<div class="next-card mb"><div class="row between wrap"><div><div class="small muted">Sıradaki · ' + next.start + ' · ' + (next.device ? V.dev(next.device).name : V.svc(next.service).room || '') + '</div>' +
        '<div style="font-size:22px;font-weight:700;margin:4px 0">' + V.esc(c.name) + '</div><div>' + V.esc(V.svcLabel(next.service, next.area)) + (tp ? ' · ' + tp.sessions + ' seansın ' + (p.used + 1) + '.\'si (paket)' : '') + '</div>' +
        '<div class="row wrap mt" style="gap:6px">' + w.map(([k, txt]) => V.tag(txt, k === 'error' ? 'red' : 'orange')).join('') + (w.length ? '' : V.tag('Onamlar geçerli', 'green')) + V.tag('Fitzpatrick ' + c.fitz) +
        (last && last.fluence ? V.tag('Geçen sefer: ' + last.fluence + ' J/cm² · ' + last.shots + ' atım · ' + last.reaction) : '') + '</div></div>' +
        '<div class="row wrap"><a class="btn" href="#/musteri/' + c.id + '"><i data-lucide="user-round"></i>Müşteri</a><a class="btn ai" href="#/danisma/' + c.id + '"><i data-lucide="sparkles"></i>Danış</a>' +
        (next.status === 'checkedin' || next.status === 'inprogress' ? '<a class="btn primary" href="#/uygulama/' + next.id + '"><i data-lucide="play"></i>Uygulamayı başlat</a>' : '<button class="btn primary" data-act="setStatus" data-id="' + next.id + '" data-val="checkedin"><i data-lucide="log-in"></i>Geldi olarak işaretle</button>') + '</div></div></div>';
    }
    const rows = mine.map((a) => { const c = V.cust(a.customer), fin = ['completed', 'paid'].includes(a.status);
      return '<div class="appt-row' + (fin ? ' done' : '') + '"><span class="time">' + a.start + '</span><div class="grow"><b>' + V.esc(c.name) + '</b><div class="small muted">' + V.esc(V.svcLabel(a.service, a.area)) + '</div></div>' +
        (fin ? V.statusTag(a.status) : a.status === 'checkedin' ? '<a class="btn sm primary" href="#/uygulama/' + a.id + '">Başlat</a>' : V.statusTag(a.status)) + '</div>'; }).join('');
    return V.header('İyi günler, ' + u.name.split(' ')[0].replace('Dr.', u.name.split(' ')[1] || ''), V.ds(V.TODAY) + ' ' + V.dayName(V.TODAY) + ' · ' + mine.length + ' randevu · ' + done + ' tamamlandı',
      '<a class="btn ai" href="#/danisma"><i data-lucide="sparkles"></i>Hızlı danışma</a>') + nextHtml +
      '<div class="grid g-main"><div class="card"><div class="card-head"><h3><i data-lucide="calendar-days"></i>Bugünkü randevularım</h3></div><div>' + (rows || '<div class="card-body muted">Randevu yok</div>') + '</div></div>' +
      '<div class="stack"><div class="alert info"><i data-lucide="info"></i><div>Uzman görünümü: kısa menü, büyük düğmeler, yalnızca kendi randevularınız. Ciro raporları görünmez.</div></div><a class="btn" href="#/giris" style="align-self:flex-start"><i data-lucide="log-out"></i>Kullanıcı değiştir</a></div></div>';
  };
})();
