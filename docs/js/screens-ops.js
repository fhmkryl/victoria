/* Victoria demo — calendar, appointments, customers, profile, consultation, treatment record. */
(function () {
  const S = () => V.S;
  const PX = 0.8; // 48px per hour
  const DAY_START = 9 * 60, DAY_END = 19 * 60;

  // ---------- Calendar ----------
  V.screens.takvim = () => {
    const date = V.UI.calDate || V.TODAY;
    const staff = V.specialists();
    const hours = []; for (let h = 9; h < 19; h++) hours.push('<div class="time">' + String(h).padStart(2, '0') + ':00</div>');
    const cols = staff.map((s) => {
      const appts = S().appts.filter((a) => a.date === date && a.staff === s.id && !['cancelled'].includes(a.status));
      const off = [[DAY_START, s.hours[0] * 60], [s.hours[1] * 60, DAY_END]].filter(([a, b]) => b > a)
        .map(([a, b]) => '<div class="off" style="top:' + (a - DAY_START) * PX + 'px;height:' + (b - a) * PX + 'px"></div>').join('');
      const blocks = appts.map((a) => {
        const c = V.cust(a.customer), warn = V.apptWarnings(a).some((w) => w[0] === 'error');
        return '<div class="appt ' + s.color + (['paid', 'noshow'].includes(a.status) ? ' done' : '') + '" style="top:' + (V.mins(a.start) - DAY_START) * PX + 'px;height:' + Math.max(a.dur * PX - 2, 22) + 'px" data-act="openAppt" data-id="' + a.id + '">' +
          '<b>' + V.esc(c.name) + (warn ? ' <span class="warn">⚠</span>' : '') + '</b>' + a.start + ' · ' + V.esc(V.svcLabel(a.service, a.area)) + ' · ' + V.STATUS[a.status][0] + '</div>';
      }).join('');
      return '<div class="col"><div class="colbody" data-act="slot" data-staff="' + s.id + '">' + Array(10).fill('<div class="hour"></div>').join('') + off + blocks + '</div></div>';
    }).join('');
    return V.header('Takvim', 'Boş bir saate tıklayarak randevu oluşturun; randevuya tıklayarak ayrıntıları açın.',
      '<button class="btn" data-act="calMove" data-val="-1"><i data-lucide="chevron-left"></i></button><button class="btn" data-act="calMove" data-val="0">Bugün</button><button class="btn" data-act="calMove" data-val="1"><i data-lucide="chevron-right"></i></button>' +
      '<span class="strong" style="margin:0 8px">' + V.ds(date) + ' ' + V.dayName(date) + '</span><button class="btn primary" data-act="newAppt"><i data-lucide="plus"></i>Yeni randevu</button>') +
      '<div class="cal" style="grid-template-columns:56px repeat(' + staff.length + ',minmax(160px,1fr))"><div class="corner"></div>' +
      staff.map((s) => '<div class="colhead"><span class="avatar">' + V.esc(s.initials) + '</span><div>' + V.esc(s.name) + '<small>' + V.esc(s.title) + ' · ' + s.hours[0] + '–' + s.hours[1] + '</small></div></div>').join('') +
      '<div class="times">' + hours.join('') + '</div>' + cols + '</div>';
  };
  V.act.calMove = (el) => { const v = +el.dataset.val; V.UI.calDate = v === 0 ? V.TODAY : V.addDays(V.UI.calDate || V.TODAY, v); V.render(); };
  V.act.slot = (el, e) => {
    const y = e.clientY - el.getBoundingClientRect().top;
    const m = Math.min(DAY_END - 15, Math.max(DAY_START, DAY_START + Math.floor(y / PX / 15) * 15));
    V.act.newAppt(null, null, { staff: el.dataset.staff, start: V.hhmm(m), date: V.UI.calDate || V.TODAY });
  };

  // ---------- New appointment ----------
  V.act.newAppt = (el, e, preset) => {
    const d = Object.assign({ customer: '', service: 'lazer', area: 'yuz', staff: 'ad', date: V.UI.calDate || V.TODAY, start: '15:30', device: 'd808', pkg: '', sms: true, series: false }, preset || {});
    V.openDrawer('newAppt', d);
  };
  V.drawers.newAppt = (d) => {
    const s = V.svc(d.service);
    if (s.areas && !s.areas.some((a) => a.id === d.area)) d.area = s.areas[0].id;
    if (!s.areas) d.area = '';
    if (!s.staff.includes(d.staff)) d.staff = s.staff[0];
    if (!s.device) d.device = '';
    else if (!d.device) d.device = 'd808';
    const dur = V.svcDur(d.service, d.area);
    const pk = d.customer ? S().packages.filter((p) => p.customer === d.customer && V.tpl(p.template).service === d.service && (!V.tpl(p.template).area || V.tpl(p.template).area === d.area) && p.used < V.tpl(p.template).sessions) : [];
    if (d.pkg === '' && pk.length && !d.pkgTouched) d.pkg = pk[0].id;
    if (d.pkg && !pk.some((p) => p.id === d.pkg)) d.pkg = '';
    const a = { customer: d.customer, service: d.service, area: d.area, staff: d.staff, date: d.date, start: d.start, dur, device: d.device };
    const warn = d.customer ? V.apptWarnings(a) : [];
    const clash = d.start && V.conflict(a);
    const st = V.staff(d.staff), outside = V.mins(d.start) < st.hours[0] * 60 || V.mins(d.start) + dur > st.hours[1] * 60;
    const ok = d.customer && d.start && !clash && !outside;
    return {
      title: '<i data-lucide="calendar-plus"></i>Yeni randevu',
      body:
        '<div class="field"><label>Müşteri <span class="req">*</span></label><div class="row"><select class="select" name="customer" data-change="drawerSync">' + V.custOptions(d.customer, '— müşteri seçin —') + '</select><button class="btn" data-act="newCust" title="Yeni müşteri"><i data-lucide="user-plus"></i></button></div></div>' +
        V.alerts(warn) +
        '<div class="form-grid">' +
        '<div class="field"><label>Hizmet</label><select class="select" name="service" data-change="drawerSync">' + S().services.map((x) => V.opt(x.id, x.name, d.service)).join('') + '</select></div>' +
        (s.areas ? '<div class="field"><label>Bölge</label><select class="select" name="area" data-change="drawerSync">' + s.areas.map((x) => V.opt(x.id, x.name + ' · ' + x.dur + ' dk · ' + V.money(x.price), d.area)).join('') + '</select></div>' : '') +
        '<div class="field"><label>Personel</label><select class="select" name="staff" data-change="drawerSync">' + s.staff.map((id) => V.opt(id, V.staff(id).name, d.staff)).join('') + '</select><span class="hint">' + (s.physician ? 'Bu işlem yalnızca hekim tarafından yapılır.' : 'Yalnızca bu işleme yetkili personel listelenir.') + '</span></div>' +
        (s.device ? '<div class="field"><label>Cihaz</label><select class="select" name="device" data-change="drawerSync">' + S().devices.map((x) => V.opt(x.id, x.name, d.device)).join('') + '</select></div>' : '') +
        '<div class="field"><label>Tarih</label><input class="input" type="date" name="date" value="' + d.date + '" data-change="drawerSync"></div>' +
        '<div class="field"><label>Saat</label><input class="input" type="time" step="900" name="start" value="' + d.start + '" data-change="drawerSync"><span class="hint">' + dur + ' dk · bitiş ' + V.hhmm(V.mins(d.start || '00:00') + dur) + '</span></div></div>' +
        (clash ? '<div class="alert error"><i data-lucide="calendar-x"></i><div><b>Çakışma:</b> ' + V.esc(V.cust(clash.customer).name) + ' ' + clash.start + ' (' + (clash.staff === d.staff ? V.staff(d.staff).name : V.dev(d.device).name) + ' dolu). Başka bir saat seçin.</div></div>' : '') +
        (outside && !clash ? '<div class="alert warning"><i data-lucide="clock"></i>' + V.esc(st.name) + ' ' + st.hours[0] + ':00–' + st.hours[1] + ':00 arası çalışıyor.</div>' : '') +
        (d.customer ? '<div class="field"><label>Paket</label><select class="select" name="pkg" data-change="pkgPick">' + V.opt('', 'Paketsiz (seans ücreti ' + V.money(V.svcPrice(d.service, d.area)) + ')', d.pkg) + pk.map((p) => V.opt(p.id, V.tpl(p.template).name + ' · ' + (V.tpl(p.template).sessions - p.used) + ' seans kaldı', d.pkg)).join('') + '</select></div>' : '') +
        '<label class="chk"><input type="checkbox" name="sms"' + (d.sms ? ' checked' : '') + '> 24 saat önce SMS hatırlatması gönder</label>',
      foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn primary" data-act="saveAppt"' + (ok ? '' : ' disabled style="opacity:.5;pointer-events:none"') + '>Randevuyu kaydet</button>'
    };
  };
  V.act.newApptFor = (el) => V.act.newAppt(null, null, { customer: el.dataset.id, service: (V.cust(el.dataset.id).staffPref === 'es' ? 'masaj' : 'lazer') });
  V.act.pkgPick = () => { V.syncDrawer(); V.UI.drawer.data.pkgTouched = true; V.renderDrawer(); };
  V.act.saveAppt = () => {
    V.syncDrawer(); const d = V.UI.drawer.data;
    const a = { id: V.id('appt', 'a'), customer: d.customer, staff: d.staff, service: d.service, area: d.area || undefined, device: d.device || undefined, date: d.date, start: d.start, dur: V.svcDur(d.service, d.area), status: 'booked', pkg: d.pkg || undefined };
    S().appts.push(a); S().tasks.t1 = true; V.UI.calDate = d.date; V.closeDrawer();
    V.commit('Randevu oluşturuldu: ' + V.esc(V.cust(a.customer).name) + ' · ' + V.ds(a.date) + ' ' + a.start + (d.sms ? ' · SMS hatırlatması planlandı' : ''), V.route().name === 'takvim' ? null : '#/takvim');
  };

  // ---------- Appointment details & changes ----------
  V.act.openAppt = (el) => V.openDrawer('appt', { id: el.dataset.id, mode: 'view' });
  V.drawers.appt = (d) => {
    const a = V.appt(d.id), c = V.cust(a.customer), s = V.svc(a.service), p = a.pkg ? V.pkg(a.pkg) : null;
    const title = '<i data-lucide="calendar"></i>' + V.esc(c.name) + ' · ' + a.start;
    if (d.mode === 'resched') {
      const na = Object.assign({}, a, { date: d.date || a.date, start: d.start || a.start });
      const clash = V.conflict(na, a.id);
      return { title, body: '<div class="small muted">Şu an: ' + V.ds(a.date) + ' ' + a.start + ' · ' + V.esc(V.staff(a.staff).name) + '</div>' +
        '<div class="form-grid"><div class="field"><label>Yeni tarih</label><input class="input" type="date" name="date" value="' + na.date + '" data-change="drawerSync"></div><div class="field"><label>Yeni saat</label><input class="input" type="time" step="900" name="start" value="' + na.start + '" data-change="drawerSync"></div></div>' +
        (clash ? '<div class="alert error"><i data-lucide="calendar-x"></i>Bu saat dolu (' + V.esc(V.cust(clash.customer).name) + ' ' + clash.start + ').</div>' : '<div class="alert success"><i data-lucide="check"></i>Bu saat uygun.</div>') +
        '<label class="chk"><input type="checkbox" name="sms" checked> Yeni saati SMS ile bildir</label>',
        foot: '<button class="btn" data-act="drawerSet" data-key="mode" data-val="view">Geri</button><button class="btn primary" data-act="doResched"' + (clash ? ' disabled style="opacity:.5;pointer-events:none"' : '') + '>Randevuyu taşı</button>' };
    }
    if (d.mode === 'cancel') {
      const late = V.days(V.TODAY, a.date) < 1;
      return { title, body: '<div class="field"><label>İptal eden</label><select class="select" name="by"><option>Müşteri</option><option>Merkez</option></select></div>' +
        '<div class="field"><label>Neden</label><select class="select" name="reason"><option>Hastalık</option><option>Program çakışması</option><option>Fiyat</option><option>Cihaz / personel müsait değil</option><option>Diğer</option></select></div>' +
        (late ? '<div class="alert warning"><i data-lucide="clock"></i>Randevuya ' + V.S.decisions.lateCancel + '\'ten az kaldı: müşteride geç iptal olarak işaretlenir.</div>' : '') +
        (p ? '<div class="small muted">Paket seansı pakete geri eklenir.</div>' : ''),
        foot: '<button class="btn" data-act="drawerSet" data-key="mode" data-val="view">Geri</button><button class="btn danger" data-act="doCancel">Randevuyu iptal et</button>' };
    }
    if (d.mode === 'noshow') {
      return { title, body: '<div class="small muted">Gelmeme politikası (Ayarlar): <b>' + V.esc(V.S.decisions.noShow) + '</b></div>' + (p ? '<label class="chk"><input type="checkbox" name="useSession"' + (V.S.decisions.noShow === 'Kullanılmış sayılsın' ? ' checked' : '') + '> Paket seansı kullanılmış sayılsın</label>' : '') +
        '<label class="chk"><input type="checkbox" name="sms" checked> "Sizi özledik" SMS\'i gönder</label>',
        foot: '<button class="btn" data-act="drawerSet" data-key="mode" data-val="view">Geri</button><button class="btn danger" data-act="doNoShow">Gelmedi olarak işaretle</button>' };
    }
    const actions = [];
    if (['booked', 'confirmed'].includes(a.status)) actions.push('<button class="btn primary" data-act="setStatus" data-id="' + a.id + '" data-val="checkedin"><i data-lucide="log-in"></i>Geldi</button>');
    if (['checkedin', 'inprogress'].includes(a.status)) actions.push('<a class="btn primary" href="#/uygulama/' + a.id + '"><i data-lucide="clipboard-list"></i>Uygulama kaydı</a>');
    if (a.status === 'completed') actions.push('<a class="btn primary" href="#/kasa?appt=' + a.id + '"><i data-lucide="shopping-cart"></i>Ödeme al</a>');
    const canChange = !['completed', 'paid', 'cancelled', 'noshow'].includes(a.status);
    return { title,
      body: '<div class="row wrap">' + V.statusTag(a.status) + (p ? V.tag('Paket ' + (p.used + (['completed', 'paid'].includes(a.status) ? 0 : 1)) + '/' + V.tpl(p.template).sessions) : '') + V.tag('Fitzpatrick ' + c.fitz) + '</div>' +
        V.alerts(V.apptWarnings(a)) +
        '<dl class="desc"><dt>Hizmet</dt><dd>' + V.esc(V.svcLabel(a.service, a.area)) + '</dd><dt>Tarih</dt><dd>' + V.ds(a.date) + ' ' + a.start + ' · ' + a.dur + ' dk</dd><dt>Personel</dt><dd>' + V.esc(V.staff(a.staff).name) + '</dd>' +
        (a.device ? '<dt>Cihaz</dt><dd>' + V.dev(a.device).name + '</dd>' : '<dt>Oda</dt><dd>' + V.esc(s.room || '-') + '</dd>') + '<dt>Telefon</dt><dd>' + c.phone + '</dd></dl>' +
        (canChange ? '<div class="row wrap"><button class="btn sm" data-act="drawerSet" data-key="mode" data-val="resched"><i data-lucide="calendar-clock"></i>Ertele</button><button class="btn sm danger" data-act="drawerSet" data-key="mode" data-val="cancel">İptal</button><button class="btn sm danger" data-act="drawerSet" data-key="mode" data-val="noshow">Gelmedi</button></div>' : ''),
      foot: '<a class="btn" href="#/musteri/' + c.id + '"><i data-lucide="user-round"></i>Müşteri</a><a class="btn ai" href="#/danisma/' + c.id + '"><i data-lucide="sparkles"></i>Danış</a>' + actions.join('') };
  };
  V.act.doResched = () => { V.syncDrawer(); const d = V.UI.drawer.data, a = V.appt(d.id); a.date = d.date; a.start = d.start; V.UI.calDate = a.date; V.closeDrawer(); V.commit('Randevu ' + V.ds(a.date) + ' ' + a.start + '\'e taşındı' + (d.sms ? ' · SMS gönderildi' : '')); };
  V.act.doCancel = () => { V.syncDrawer(); const a = V.appt(V.UI.drawer.data.id); a.status = 'cancelled'; a.cancel = { by: V.UI.drawer.data.by, reason: V.UI.drawer.data.reason, late: V.days(V.TODAY, a.date) < 1 }; V.closeDrawer(); V.commit('Randevu iptal edildi'); };
  V.act.doNoShow = () => { V.syncDrawer(); const d = V.UI.drawer.data, a = V.appt(d.id); a.status = 'noshow'; if (d.useSession && a.pkg) V.pkg(a.pkg).used++; V.closeDrawer(); V.commit('Gelmedi olarak işaretlendi' + (d.sms ? ' · SMS gönderildi' : '')); };

  // ---------- Customers ----------
  V.screens.musteriler = () => {
    const q = (V.UI.search || '').toLocaleLowerCase('tr');
    const list = S().customers.filter((c) => !q || c.name.toLocaleLowerCase('tr').includes(q) || c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '~'));
    const rows = list.map((c) => {
      const next = S().appts.filter((a) => a.customer === c.id && a.date >= V.TODAY && !['cancelled', 'noshow', 'paid', 'completed'].includes(a.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
      const pk = S().packages.filter((p) => p.customer === c.id && p.used < V.tpl(p.template).sessions)[0];
      const bal = V.custBalance(c.id), od = V.custOverdue(c.id);
      const consentIssue = S().services.some((s) => s.consent && S().appts.some((a) => a.customer === c.id && a.service === s.id && a.date >= V.TODAY && !['cancelled'].includes(a.status)) && !V.consentOk(c, s.consent));
      return '<tr class="clickable" data-href="#/musteri/' + c.id + '"><td><div class="row"><span class="avatar">' + c.name.split(' ').map((x) => x[0]).join('').slice(0, 2) + '</span><b>' + V.esc(c.name) + '</b></div></td><td>' + c.phone + '</td><td>' + (c.tags || []).map((t) => V.tag(V.esc(t))).join(' ') + '</td>' +
        '<td>' + (next ? V.ds(next.date) + ' ' + next.start : '–') + '</td><td>' + (pk ? V.esc(V.tpl(pk.template).name) + ' · ' + (V.tpl(pk.template).sessions - pk.used) + ' kaldı' : '–') + '</td>' +
        '<td class="num' + (od ? ' down' : '') + '">' + (bal ? V.money(bal) : '₺0') + (od ? ' <span class="small">(gecikmiş)</span>' : '') + '</td><td>' + (consentIssue ? V.tag('Onam eksik', 'red') : V.tag('Tamam', 'green')) + '</td></tr>';
    }).join('');
    return V.header('Müşteriler', S().customers.length + ' müşteri', '<button class="btn primary" data-act="newCust"><i data-lucide="user-plus"></i>Yeni müşteri</button>') +
      (q ? '<div class="filter-bar"><span class="muted">"' + V.esc(V.UI.search) + '" için ' + list.length + ' sonuç</span><button class="btn sm" data-act="clearSearch">Temizle</button></div>' : '') +
      '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Müşteri</th><th>Telefon</th><th>Etiketler</th><th>Sıradaki randevu</th><th>Aktif paket</th><th class="num">Bakiye</th><th>Onamlar</th></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="muted">Sonuç yok</td></tr>') + '</tbody></table></div></div>';
  };
  V.act.clearSearch = () => { V.UI.search = ''; V.render(); };
  V.act.newCust = (el) => { const back = V.UI.drawer; V.openDrawer('newCust', { back, name: '', phone: '', kvkk: true, health: true, sms: false }); };
  V.drawers.newCust = (d) => ({
    title: '<i data-lucide="user-plus"></i>' + (d.walkin ? 'Randevusuz müşteriyi kaydet' : 'Yeni müşteri'),
    body: (d.walkin ? '<div class="alert ai small"><i data-lucide="sparkles"></i><div>Bu danışmadaki ihtiyaçlar, güvenlik cevapları ve kabul edilen öneriler yeni profile kaydedilir.</div></div>' : '') +
      '<div class="form-grid"><div class="field"><label>Ad soyad <span class="req">*</span></label><input class="input" name="name" value="' + V.esc(d.name) + '" placeholder="ör. Pınar Doğan"></div>' +
      '<div class="field"><label>Cep telefonu <span class="req">*</span></label><input class="input" name="phone" value="' + V.esc(d.phone) + '" placeholder="05xx xxx xx xx"></div></div>' +
      '<div class="card"><div class="card-body stack small"><label class="chk"><input type="checkbox" name="kvkk"' + (d.kvkk ? ' checked' : '') + '> KVKK aydınlatma metni verildi</label>' +
      '<label class="chk"><input type="checkbox" name="health"' + (d.health ? ' checked' : '') + '> Açık rıza: sağlık verileri</label><label class="chk"><input type="checkbox" name="sms"' + (d.sms ? ' checked' : '') + '> Ticari SMS (İYS)</label>' +
      '<span class="muted">İmzalı formlar daha sonra profilden eklenebilir.</span></div></div>' +
      (d.error ? '<div class="alert error"><i data-lucide="alert-octagon"></i>' + d.error + '</div>' : ''),
    foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn primary" data-act="saveCust">' + (d.walkin ? 'Kaydet ve kasaya git' : 'Kaydet') + '</button>'
  });
  V.act.saveCust = () => {
    V.syncDrawer(); const d = V.UI.drawer.data;
    if (!d.name.trim() || d.phone.replace(/\D/g, '').length < 10) { d.error = 'Ad soyad ve 10 haneli telefon gerekli.'; V.renderDrawer(); return; }
    const exp = V.addMonths(V.TODAY, 12);
    const c = { id: V.id('cust', 'c'), name: d.name.trim(), phone: d.phone.trim(), since: V.TODAY, tags: ['Yeni'], skin: '-', fitz: '-', allergies: [], flags: [], consents: {}, sms: !!d.sms, demoNew: true };
    if (d.kvkk) c.consents.kvkk = exp; if (d.health) c.consents.health = exp;
    if (d.walkin) {
      const k = V.UI.cons || {};
      c.flags = (k.safety || []).slice(); if (k.allergy) c.allergies = k.allergy.split(/[,;]/).map((x) => x.trim().toLocaleLowerCase('tr')).filter(Boolean);
      c.consult = { date: V.TODAY, concerns: k.concerns, words: k.words };
      S().customers.push(c);
      V.cartFor(null, true); S().cart.customer = c.id;
      if (V.UI.cons) { V.UI.cons.cid = c.id; V.UI.cons.walkin = false; }
      V.closeDrawer(); V.commit(V.esc(c.name) + ' kaydedildi', '#/kasa'); return;
    }
    S().customers.push(c);
    const back = d.back;
    if (back && back.kind === 'newAppt') { back.data.customer = c.id; V.UI.drawer = back; V.save(); V.render(); V.toast(V.esc(c.name) + ' kaydedildi'); return; }
    V.closeDrawer(); V.commit(V.esc(c.name) + ' kaydedildi', '#/musteri/' + c.id);
  };

  // ---------- Customer profile ----------
  V.screens.musteri = (r) => {
    const c = V.cust(r.param); if (!c) return '<div class="alert error">Müşteri bulunamadı</div>';
    if (r.q.tab) { V.UI.tab_musteri = r.q.tab; }
    const tab = V.UI.tab_musteri || 'genel';
    const bal = V.custBalance(c.id), od = V.custOverdue(c.id);
    const nextInst = V.openInst().find((x) => x.plan.customer === c.id);
    const pks = S().packages.filter((p) => p.customer === c.id);
    const spent = S().sales.filter((s) => s.customer === c.id && !s.refunded).reduce((a, s) => a + V.saleTotal(s), 0) + (c.purchases || []).reduce((a, p) => a + p.price, 0);
    const consentAlert = S().services.filter((s) => s.consent && S().appts.some((a) => a.customer === c.id && a.service === s.id && a.date >= V.TODAY && !['cancelled', 'paid', 'completed'].includes(a.status)) && !V.consentOk(c, s.consent));
    let body = '';
    if (tab === 'genel') {
      const up = S().appts.filter((a) => a.customer === c.id && a.date >= V.TODAY && !['cancelled', 'noshow', 'paid'].includes(a.status)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
      body = '<div class="grid g-main"><div class="card"><div class="card-head"><h3>Yaklaşan randevular</h3><button class="btn sm" data-act="newApptFor" data-id="' + c.id + '">Randevu ver</button></div><ul class="list">' +
        (up.length ? up.map((a) => '<li><i data-lucide="calendar-days"></i><div class="grow"><b>' + V.ds(a.date) + ' ' + a.start + '</b> · ' + V.esc(V.svcLabel(a.service, a.area)) + ' · ' + V.esc(V.staff(a.staff).name) + '</div>' + V.statusTag(a.status) + '</li>').join('') : '<li class="muted">Yaklaşan randevu yok</li>') + '</ul></div>' +
        '<div class="card"><div class="card-head"><h3>Profil</h3></div><div class="card-body"><dl class="desc"><dt>Telefon</dt><dd>' + c.phone + '</dd><dt>Müşteri olduğu tarih</dt><dd>' + V.ds(c.since) + '</dd><dt>Tercih edilen</dt><dd>' + (c.staffPref ? V.esc(V.staff(c.staffPref).name) : '-') + '</dd><dt>Ticari SMS</dt><dd>' + (c.sms ? V.tag('İzin var', 'green') : V.tag('İzin yok')) + '</dd>' +
        (c.consult ? '<dt>Son danışma</dt><dd>' + V.ds(c.consult.date) + ' · ' + (c.consult.concerns || []).map((k) => (V.CONCERNS.find((x) => x[0] === k) || [k, k])[1]).join(', ') + '</dd>' : '') + '</dl></div></div></div>';
    } else if (tab === 'saglik') {
      body = '<div class="grid g2"><div class="card"><div class="card-head"><h3><i data-lucide="heart-pulse"></i>Cilt ve sağlık</h3></div><div class="card-body"><dl class="desc"><dt>Cilt tipi</dt><dd>' + V.esc(c.skin) + '</dd><dt>Fitzpatrick</dt><dd>' + V.esc(c.fitz) + '</dd><dt>Alerjiler</dt><dd>' + (c.allergies.length ? c.allergies.map((a) => V.tag(V.esc(a), 'red')).join(' ') : 'Yok') + '</dd>' +
        '<dt>Dikkat</dt><dd>' + ((c.flags || []).map((f) => V.tag(V.FLAG_TEXT[f] || f, 'orange')).join(' ') || '-') + '</dd>' + (c.note ? '<dt>Not</dt><dd>' + V.esc(c.note) + '</dd>' : '') + '</dl><div class="small muted mt">Sağlık bilgilerini her görüntüleme kayda geçer (KVKK).</div></div></div>' +
        '<div class="card"><div class="card-head"><h3><i data-lucide="file-check"></i>Onamlar</h3><button class="btn sm primary" data-act="consent" data-id="' + c.id + '">Onam kaydet</button></div><div class="card-body flush"><table class="table"><thead><tr><th>Onam</th><th>Geçerlilik</th><th>Durum</th></tr></thead><tbody>' +
        V.CONSENTS.map(([k, n]) => { const v = c.consents[k]; return '<tr><td>' + n + '</td><td>' + (v ? V.ds(v) : '-') + '</td><td>' + (!v ? V.tag('Yok') : v >= V.TODAY ? V.tag('Geçerli', 'green') : V.tag('Süresi dolmuş', 'red')) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
    } else if (tab === 'uygulama') {
      const tr = S().treatments.filter((t) => t.customer === c.id).sort((a, b) => b.date.localeCompare(a.date));
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Tarih</th><th>Uygulama</th><th>Personel</th><th>Ayarlar</th><th>Reaksiyon</th><th>Not</th></tr></thead><tbody>' +
        (tr.length ? tr.map((t) => '<tr><td>' + V.ds(t.date) + '</td><td>' + V.esc(V.svcLabel(t.service, t.area)) + '</td><td>' + V.esc(V.staff(t.staff).name) + '</td><td class="small">' + (t.fluence ? t.fluence + ' J/cm² · ' + t.spot + ' mm · ' + t.shots + ' atım' : '-') + '</td><td>' + V.esc(t.reaction || '-') + '</td><td class="small">' + V.esc(t.note || '') + '</td></tr>').join('') : '<tr><td colspan="6" class="muted">Henüz uygulama yok</td></tr>') + '</tbody></table></div></div>';
    } else if (tab === 'paket') {
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Paket</th><th>Satış</th><th>Seanslar</th><th>Son geçerlilik</th><th class="num">Fiyat</th></tr></thead><tbody>' +
        (pks.length ? pks.map((p) => { const t = V.tpl(p.template); return '<tr><td>' + V.esc(t.name) + '</td><td>' + V.ds(p.sold) + '</td><td><div class="progress" style="width:120px"><span style="width:' + Math.round(p.used / t.sessions * 100) + '%"></span></div><span class="small">' + p.used + ' kullanıldı · ' + (t.sessions - p.used) + ' kaldı</span></td><td>' + V.ds(p.expiry) + '</td><td class="num">' + V.money(p.price || t.price) + '</td></tr>'; }).join('') : '<tr><td colspan="5" class="muted">Paket yok</td></tr>') + '</tbody></table></div></div>';
    } else if (tab === 'satis') {
      const sales = S().sales.filter((s) => s.customer === c.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>No</th><th>Tarih</th><th>Kalemler</th><th class="num">Tutar</th><th>Ödeme</th></tr></thead><tbody>' +
        sales.map((s) => '<tr class="clickable" data-act="openSale" data-id="' + s.id + '"><td>' + s.id + '</td><td>' + V.ds(s.date) + '</td><td>' + s.lines.map((l) => V.esc(l.name)).join(', ') + '</td><td class="num">' + V.money(V.saleTotal(s)) + '</td><td>' + V.payLabel(s) + '</td></tr>').join('') +
        (c.purchases || []).slice().reverse().map((p) => '<tr><td class="muted">önceki</td><td>' + V.ds(p.date) + '</td><td>' + V.esc(V.prod(p.p).name) + '</td><td class="num">' + V.money(p.price) + '</td><td>-</td></tr>').join('') +
        (sales.length || (c.purchases || []).length ? '' : '<tr><td colspan="5" class="muted">Satış yok</td></tr>') + '</tbody></table></div></div>';
    } else if (tab === 'hesap') {
      body = V.accountTab(c);
    }
    return '<div class="breadcrumb"><a href="#/musteriler">Müşteriler</a><i data-lucide="chevron-right"></i>' + V.esc(c.name) + '</div>' +
      V.header(V.esc(c.name), c.phone + ' · Fitzpatrick ' + c.fitz + ' · ' + V.esc(c.skin) + (c.allergies.length ? ' · <span class="down">Alerji: ' + c.allergies.join(', ') + '</span>' : ''),
        '<button class="btn" data-act="newApptFor" data-id="' + c.id + '"><i data-lucide="calendar-plus"></i>Randevu</button><a class="btn" href="#" data-act="sellTo" data-id="' + c.id + '"><i data-lucide="shopping-cart"></i>Satış</a><a class="btn ai" href="#/danisma/' + c.id + '"><i data-lucide="sparkles"></i>YZ ile danış</a>') +
      consentAlert.map((s) => '<div class="alert error mb"><i data-lucide="file-warning"></i><div><b>' + (V.CONSENTS.find((x) => x[0] === s.consent) || [])[1] + ' eksik veya süresi dolmuş.</b> Uygulamadan önce imzalatın. <a href="#" data-act="consent" data-id="' + c.id + '" data-key="' + s.consent + '">Şimdi kaydet</a></div></div>').join('') +
      '<div class="grid g4 mb">' + V.stat('primary', 'Toplam harcama', V.money(spent)) + V.stat('neutral', 'Aktif paket', pks.filter((p) => p.used < V.tpl(p.template).sessions).length ? pks.filter((p) => p.used < V.tpl(p.template).sessions).map((p) => (V.tpl(p.template).sessions - p.used) + ' seans').join(', ') : '–') +
      V.stat(od ? 'error' : bal ? 'warning' : 'success', 'Açık bakiye', V.money(bal), nextInst ? 'Sıradaki: ' + V.ds(nextInst.inst.due) + ' · ' + V.money(V.instOpen(nextInst.inst)) : 'Açık taksit yok') +
      V.stat('neutral', 'Uygulama sayısı', S().treatments.filter((t) => t.customer === c.id).length) + '</div>' +
      V.tabs('musteri', [['genel', 'Genel', 'layout-dashboard'], ['saglik', 'Sağlık ve onamlar', 'heart-pulse'], ['uygulama', 'Uygulamalar', 'clipboard-list'], ['paket', 'Paketler', 'gift'], ['satis', 'Satışlar', 'receipt'], ['hesap', 'Hesap ve ödemeler' + (bal ? ' ' + V.tag(V.money(bal), od ? 'red' : 'orange') : ''), 'wallet']], tab) + body;
  };
  V.act.sellTo = (el) => { V.cartFor(el.dataset.id); V.go('#/kasa'); };
  V.act.consent = (el) => V.openDrawer('consent', { id: el.dataset.id, key: el.dataset.key || 'laser' });
  V.drawers.consent = (d) => ({
    title: '<i data-lucide="file-check"></i>Onam kaydet',
    body: '<div class="field"><label>Onam formu</label><select class="select" name="key">' + V.CONSENTS.map(([k, n]) => V.opt(k, n, d.key)).join('') + '</select></div>' +
      '<div class="alert info"><i data-lucide="printer"></i><div>Formu yazdırıp müşteriye imzalatın, ardından fotoğrafını ekleyin.</div></div><div class="upload" data-act="fakeUpload"><i data-lucide="camera"></i><br>' + (d.uploaded ? '✓ Fotoğraf eklendi' : 'İmzalı formun fotoğrafını çek / yükle') + '</div>' +
      '<div class="small muted">Geçerlilik: ' + V.ds(V.addMonths(V.TODAY, 12)) + '\'e kadar (12 ay)</div>',
    foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn primary" data-act="saveConsent">Kaydet</button>'
  });
  V.act.fakeUpload = () => { V.syncDrawer(); V.UI.drawer.data.uploaded = true; V.renderDrawer(); };
  V.act.saveConsent = () => { V.syncDrawer(); const d = V.UI.drawer.data, c = V.cust(d.id); c.consents[d.key] = V.addMonths(V.TODAY, 12); V.closeDrawer(); V.commit((V.CONSENTS.find((x) => x[0] === d.key) || [])[1] + ' kaydedildi · uyarı kalktı'); };

  // ---------- Consultation ----------
  const QUESTIONS = { leke: 'Lekeler yeni mi çıktı, yoksa yıllardır mı var?', akne: 'Şu an hangi temizleyiciyi kullanıyorsunuz?', tuy: 'Daha önce lazer veya ağda yaptırdınız mı?', kuruluk: 'Nemlendirici kullanıyor musunuz, gün içinde cildiniz geriliyor mu?',
    kirisiklik: 'En çok hangi bölgedeki çizgiler sizi rahatsız ediyor?', kizariklik: 'Kızarıklık hangi durumlarda artıyor?', stres: 'Daha çok hangi bölgede gerginlik hissediyorsunuz?', selulit: 'Daha çok hangi bölge için bir şey arıyorsunuz?', mat: 'Sabah ve akşam cildinize neler uyguluyorsunuz?', gozenek: 'Makyajı nasıl temizliyorsunuz?', bakim: 'Son uygulamanızdan sonra cildiniz nasıldı?' };
  const lastBought = (c, pid) => {
    const dates = (c.purchases || []).filter((p) => p.p === pid).map((p) => p.date)
      .concat(S().sales.filter((s) => s.customer === c.id).flatMap((s) => s.lines.filter((l) => l.type === 'product' && l.ref === pid).map(() => s.date)));
    return dates.sort().pop();
  };
  V.recommend = (k) => {
    const c = k.cid ? V.cust(k.cid) : null;
    const flags = new Set([].concat(c ? c.flags || [] : [], k.safety || []));
    const allergies = [].concat(c ? c.allergies : [], (k.allergy || '').split(/[,;]/).map((x) => x.trim().toLocaleLowerCase('tr')).filter(Boolean));
    const concerns = new Set(k.concerns), budget = +k.budget || 0, excluded = [], prods = [], svcs = [];
    if (k.interest.includes('urun')) S().products.filter((p) => p.retail).forEach((p) => {
      const match = p.concerns.filter((x) => concerns.has(x)); if (!match.length) return;
      const al = p.ingredients.filter((i) => allergies.some((a) => i.includes(a) || a.includes(i)));
      if (al.length) return excluded.push([p.name, 'alerji (' + al.join(', ') + ')']);
      const ct = p.contra.filter((f) => flags.has(f)); if (ct.length) return excluded.push([p.name, ct.map((f) => V.FLAG_TEXT[f]).join(', ')]);
      if (p.stock <= 0) return excluded.push([p.name, 'stokta yok']);
      let score = match.length * 3, note = null;
      if (c) { const lb = lastBought(c, p.id); if (lb) { const wk = Math.round(V.days(lb, V.TODAY) / 7); if (wk >= p.weeks) { score += 2; note = 'Son alımı ' + wk + ' hafta önceydi; genelde ' + p.weeks + ' hafta yeter.'; } else { score -= 4; note = wk + ' hafta önce aldı; henüz bitmemiş olabilir.'; } } }
      const over = budget && p.price > budget; if (over) score -= 2;
      prods.push({ kind: 'product', item: p, match, score, note, over });
    });
    if (k.interest.includes('hizmet')) S().services.forEach((s) => {
      const match = (s.concerns || []).filter((x) => concerns.has(x)); if (!match.length) return;
      const ct = (s.contra || []).filter((f) => flags.has(f)); if (ct.length) return excluded.push([s.name, ct.map((f) => V.FLAG_TEXT[f]).join(', ')]);
      let price = s.price, label = s.name, area = null;
      if (s.areas) { const sel = s.areas.filter((a) => (k.areas || []).includes(a.id)); area = (sel[0] || s.areas[0]); price = area.price; label = s.name + ' · ' + area.name; }
      let score = match.length * 3 + (s.physician ? -1 : 0); const over = budget && price > budget; if (over) score -= 1;
      svcs.push({ kind: 'service', item: s, label, area: area && area.id, price, match, score, over, doctor: s.physician });
    });
    prods.sort((a, b) => b.score - a.score); svcs.sort((a, b) => b.score - a.score);
    const passed = S().products.filter((p) => p.retail).length + S().services.length - excluded.length;
    return { prods: prods.slice(0, 3), svcs: svcs.slice(0, 2), excluded, flags: [...flags], passed };
  };

  V.screens.danisma = (r) => {
    let k = V.UI.cons;
    if (!k || (r.param && k.cid !== r.param)) k = V.UI.cons = { cid: r.param || null, walkin: !r.param, concerns: [], areas: [], interest: ['urun', 'hizmet'], budget: '0', words: '', safety: [], allergy: '', res: null };
    const c = k.cid ? V.cust(k.cid) : null;
    const chip = (key, v, l, on) => '<button class="' + (on ? 'on' : '') + '" data-act="consToggle" data-key="' + key + '" data-val="' + v + '">' + l + '</button>';
    const intake = '<div class="card ai-card mb"><div class="card-head"><h3><i data-lucide="clipboard-pen"></i>Müşterinin bugün neye ihtiyacı var?</h3>' +
      '<div class="seg"><button class="' + (!k.walkin ? 'on' : '') + '" data-act="consMode" data-val="cust">Kayıtlı müşteri</button><button class="' + (k.walkin ? 'on' : '') + '" data-act="consMode" data-val="walkin">Randevusuz / kaydı yok</button></div></div>' +
      '<div class="card-body needs-grid"><div class="stack" style="gap:12px">' +
      (!k.walkin ? '<div class="field"><label>Müşteri</label><select class="select" data-change="consCust">' + V.custOptions(k.cid, '— müşteri seçin —') + '</select></div>' : '') +
      '<div class="field"><label>Şikâyetler (uygun olanların hepsine dokunun)</label><div class="chips">' + V.CONCERNS.map(([v, l]) => chip('concerns', v, l, k.concerns.includes(v))).join('') + '</div></div>' +
      '<div class="field"><label>Bölge</label><div class="chips">' + V.AREAS.map(([v, l]) => chip('areas', v, l, k.areas.includes(v))).join('') + '</div></div>' +
      '<div class="field"><label>İlgilendiği</label><div class="chips">' + chip('interest', 'urun', 'Ev bakım ürünleri', k.interest.includes('urun')) + chip('interest', 'hizmet', 'Uygulamalar', k.interest.includes('hizmet')) + '</div></div></div>' +
      '<div class="stack" style="gap:12px"><div class="field"><label>Bütçe</label><select class="select" data-change="consBudget">' + [['0', 'Fark etmez'], ['1500', '₺1.500\'ün altı'], ['3000', '₺3.000\'ün altı']].map(([v, l]) => V.opt(v, l, k.budget)).join('') + '</select></div>' +
      '<div class="field"><label>Kendi sözleriyle (isteğe bağlı)</label><textarea class="input" data-input="consWords" placeholder="Müşteri ne dedi?">' + V.esc(k.words) + '</textarea></div>' +
      (k.walkin ? '<div class="alert warning" style="flex-direction:column;gap:6px"><b>Hızlı güvenlik soruları</b>' + V.SAFETY.map(([v, l]) => '<label class="chk"><input type="checkbox" data-change="consToggle" data-key="safety" data-val="' + v + '"' + (k.safety.includes(v) ? ' checked' : '') + '> ' + l + '</label>').join('') +
        '<label class="chk">Bilinen alerji: <input class="input" style="height:26px;margin-left:6px" data-input="consAllergy" value="' + V.esc(k.allergy) + '" placeholder="ör. lidokain"></label><span class="small">Cevaplar yalnızca güvenlik filtresinde kullanılır; müşteri kaydı oluşturulmadıkça saklanmaz.</span></div>' : '') +
      '<div class="row between wrap"><span class="small muted">' + (k.concerns.length ? '' : 'Önce en az bir şikâyet seçin.') + '</span><button class="btn ai lg" data-act="consRun"' + (k.concerns.length && (k.walkin || k.cid) ? '' : ' disabled style="opacity:.5;pointer-events:none"') + '><i data-lucide="sparkles"></i>Ürün ve hizmet öner</button></div></div></div></div>';

    let results = '';
    if (k.res) {
      const res = k.res, items = res.prods.concat(res.svcs), inCart = (S().cart && S().cart.lines) || [];
      const card = (x) => {
        const isP = x.kind === 'product', it = x.item, rid = (isP ? 'p:' : 's:') + it.id;
        const accepted = (V.UI.consAcc || []).includes(rid) || (isP && inCart.some((l) => l.ref === it.id && l.ai));
        const rejected = (V.UI.consRej || []).includes(rid);
        return '<div class="reco' + (accepted ? ' accepted' : rejected ? ' rejected' : '') + '"><div class="row between"><b>' + V.esc(isP ? it.name : x.label) + '</b>' + (x.doctor ? V.tag('Hekimle görüşün', 'orange') : V.tag(isP ? 'Ürün' : 'Uygulama', isP ? 'blue' : 'purple')) + '</div>' +
          '<div class="why"><b>Neden:</b> ' + V.esc(it.why) + ' <span class="muted">(' + x.match.map((m) => (V.CONCERNS.find((z) => z[0] === m) || [m, m])[1].toLocaleLowerCase('tr')).join(', ') + ')</span></div>' +
          (isP ? '<div class="small muted">' + V.esc(it.use) + ' · ' + V.money(it.price) + ' · stokta ' + it.stock + '</div>' : '<div class="small muted">' + V.money(x.price) + (it.dur || x.area ? ' · ' + V.svcDur(it.id, x.area) + ' dk' : '') + '</div>') +
          (x.note ? '<div class="small" style="color:#5b21b6">' + V.esc(x.note) + '</div>' : '') + (it.caution ? '<div class="caution"><i data-lucide="info"></i>' + V.esc(it.caution) + '</div>' : '') + (x.over ? '<div class="caution"><i data-lucide="wallet"></i>Bütçenin üzerinde; sonra ödeme veya taksit önerilebilir.</div>' : '') +
          '<div class="row">' + (accepted ? V.tag(isP ? '✓ Satışa eklendi' : '✓ Randevu formu açıldı', 'green') :
            (isP ? '<button class="btn sm primary" data-act="consAccept" data-id="' + rid + '"><i data-lucide="plus"></i>Satışa ekle</button>' : '<button class="btn sm primary" data-act="consAccept" data-id="' + rid + '" data-area="' + (x.area || '') + '"><i data-lucide="calendar-plus"></i>Randevu ver</button>') +
            '<button class="btn sm" data-act="consReject" data-id="' + rid + '">Şimdi değil</button>') + '</div></div>';
      };
      const names = k.concerns.map((v) => (V.CONCERNS.find((z) => z[0] === v) || [v, v])[1].toLocaleLowerCase('tr'));
      const cheapest = res.prods.slice().sort((a, b) => a.item.price - b.item.price)[0];
      const talk = ['<li><b>Açılış:</b> "' + (k.words ? 'Bahsettiğiniz ' : '') + names.join(' ve ') + ' için size uygun, cildinizi yormayacak seçenekler var."</li>']
        .concat(items.slice(0, 4).map((x) => '<li><b>' + V.esc(x.kind === 'product' ? x.item.name.split(' ').slice(0, 3).join(' ') : x.label) + ':</b> "' + V.esc(x.item.say || x.item.why) + '"</li>'))
        .concat(k.concerns.includes('kizariklik') || res.flags.includes('hassas') ? ['<li><b>"Hassas cilt için uygun mu?" diye sorarsa:</b> önerilenler hassas ciltte kullanılabilir; ilk hafta gün aşırı başlanabilir.</li>'] : [])
        .concat(cheapest ? ['<li><b>Fiyat endişesi varsa:</b> ' + V.esc(cheapest.item.name) + ' (' + V.money(cheapest.item.price) + ') ile başlayın; sonra ödeme veya taksit de mümkün.</li>'] : []);
      const qs = k.concerns.slice(0, 2).map((v) => '<li>"' + QUESTIONS[v] + '"</li>').join('');
      results = '<div class="grid g-side"><div class="stack">' +
        '<div class="card"><div class="card-head"><h3><i data-lucide="shield-check"></i>Güvenlik filtresi</h3>' + V.tag('Kural tabanlı, YZ değil') + '</div><ul class="list small">' +
        res.excluded.map(([n, why]) => '<li><i data-lucide="x-circle" style="color:#dc2626"></i><div class="grow">' + V.esc(n) + ': ' + V.esc(why) + '</div></li>').join('') +
        '<li><i data-lucide="check-circle" style="color:#059669"></i><div class="grow">' + res.passed + ' ürün ve hizmet değerlendirildi</div></li></ul></div>' +
        (c ? '<div class="card"><div class="card-head"><h3><i data-lucide="user-round"></i>Yapay zekânın bildikleri</h3></div><div class="card-body small"><dl class="desc" style="grid-template-columns:100px 1fr"><dt>Cilt</dt><dd>' + V.esc(c.skin) + ' · Fitzpatrick ' + c.fitz + '</dd><dt>Dikkat</dt><dd>' + ((c.flags || []).map((f) => V.FLAG_TEXT[f]).join(', ') || '-') + '</dd><dt>Son alımlar</dt><dd>' + ((c.purchases || []).slice(-3).map((p) => V.prod(p.p).name.split(' ').slice(0, 3).join(' ')).join(', ') || '-') + '</dd></dl><div class="alert info mt small"><i data-lucide="lock"></i><div>İsim ve telefon gönderilmez.</div></div></div></div>' : '') +
        '</div><div class="card ai-card"><div class="card-head"><h3><i data-lucide="sparkles"></i>Öneriler</h3><span class="small muted">Kriter: ' + names.join(', ') + (k.budget !== '0' ? ' · ' + V.money(+k.budget) + '\'ün altı' : '') + '</span></div>' +
        '<div class="card-body grid g2">' + (items.length ? items.map(card).join('') : '<div class="muted">Bu kriterlere uyan ürün veya hizmet bulunamadı.</div>') + '</div>' +
        '<div class="card-body" style="border-top:1px solid #ede9fe"><div class="strong" style="margin-bottom:6px"><i data-lucide="message-circle"></i> Ne söyleyebilirsiniz</div><ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-2)">' + talk.join('') + '</ul>' +
        (qs ? '<div class="strong" style="margin:10px 0 6px"><i data-lucide="help-circle"></i> Sorulmaya değer sorular</div><ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-2)">' + qs + '</ul>' : '') + '</div>' +
        '<div class="card-body row between wrap" style="border-top:1px solid #ede9fe"><span class="disclaimer"><i data-lucide="info"></i>YZ önerisidir; önermeden önce kontrol edin. Tıbbi tavsiye değildir.</span>' +
        (k.walkin ? '<button class="btn primary" data-act="walkinSave"><i data-lucide="user-plus"></i>Yeni müşteri olarak kaydet</button>' : '<a class="btn primary" href="#/kasa"><i data-lucide="shopping-cart"></i>Satış ekranına git' + (inCart.length ? ' (' + inCart.length + ')' : '') + '</a>') + '</div></div></div>';
    }
    return (c ? '<div class="breadcrumb"><a href="#/musteriler">Müşteriler</a><i data-lucide="chevron-right"></i><a href="#/musteri/' + c.id + '">' + V.esc(c.name) + '</a><i data-lucide="chevron-right"></i>Danışma</div>' : '') +
      V.header('<span class="row"><i data-lucide="sparkles" style="color:#7c3aed;width:22px;height:22px"></i>Hızlı danışma' + (c ? ' · ' + V.esc(c.name) : k.walkin ? ' · randevusuz müşteri' : '') + '</span>', 'İhtiyaçları seçin; kendi ürün ve hizmetlerinizden uygun olanlar, nedeni ve ne söyleyeceğinizle birlikte gelir.') + intake + results;
  };
  V.act.consToggle = (el) => { const k = V.UI.cons, key = el.dataset.key, v = el.dataset.val; const s = new Set(k[key]); s.has(v) ? s.delete(v) : s.add(v); k[key] = [...s]; V.render(); };
  V.act.consMode = (el) => { const k = V.UI.cons; k.walkin = el.dataset.val === 'walkin'; if (k.walkin) k.cid = null; k.res = null; V.render(); };
  V.act.consCust = (el) => { V.UI.cons.cid = el.value || null; V.UI.cons.res = null; V.render(); };
  V.act.consBudget = (el) => { V.UI.cons.budget = el.value; };
  V.act.consWords = (el) => { V.UI.cons.words = el.value; };
  V.act.consAllergy = (el) => { V.UI.cons.allergy = el.value; };
  V.act.consRun = () => {
    const k = V.UI.cons; k.res = V.recommend(k); V.UI.consAcc = []; V.UI.consRej = [];
    k.res.prods.concat(k.res.svcs).forEach((x) => S().recos.push({ date: V.TODAY, item: x.item.id, customer: k.cid, accepted: false }));
    V.save(); V.render(); V.toast('Öneriler hazır');
  };
  V.act.consAccept = (el) => {
    const k = V.UI.cons, [kind, id] = el.dataset.id.split(':');
    const rec = S().recos.slice().reverse().find((x) => x.item === id); if (rec) rec.accepted = true;
    V.UI.consAcc = (V.UI.consAcc || []).concat(el.dataset.id);
    if (kind === 'p') {
      const p = V.prod(id); V.cartFor(k.cid, true);
      S().cart.lines.push({ type: 'product', ref: p.id, name: p.name, qty: 1, price: p.price, staff: V.isSpecialist() ? V.user().id : (k.cid && V.cust(k.cid).staffPref) || 'ad', ai: true });
      V.save(); V.render(); V.toast(V.esc(p.name) + ' satışa eklendi');
    } else {
      if (!k.cid) { V.save(); V.render(); V.toast('Randevu için önce müşteriyi kaydedin'); return; }
      V.save(); V.render(); V.act.newAppt(null, null, { customer: k.cid, service: id, area: el.dataset.area || undefined, date: V.addDays(V.TODAY, 1), start: '11:00' });
    }
  };
  V.act.consReject = (el) => { V.UI.consRej = (V.UI.consRej || []).concat(el.dataset.id); V.render(); };
  V.act.walkinSave = () => V.openDrawer('newCust', { walkin: true, name: '', phone: '', kvkk: true, health: true, sms: false });

  // ---------- Treatment record ----------
  V.screens.uygulama = (r) => {
    const a = V.appt(r.param); if (!a) return '<div class="alert error">Randevu bulunamadı</div>';
    const c = V.cust(a.customer), s = V.svc(a.service), area = V.area(a.service, a.area), p = a.pkg ? V.pkg(a.pkg) : null;
    if (a.status === 'checkedin') { a.status = 'inprogress'; V.save(); }
    const last = S().treatments.filter((t) => t.customer === c.id && t.service === a.service && t.area === a.area).sort((x, y) => y.date.localeCompare(x.date))[0] || {};
    const f = V.UI.trForm && V.UI.trForm.appt === a.id ? V.UI.trForm : (V.UI.trForm = { appt: a.id, fluence: last.fluence || 16, pulse: last.pulse || 30, spot: last.spot || 12, shots: area ? area.shots : '', reaction: 'Yok', note: '' });
    const laser = !!s.device;
    const gel = laser ? Math.round((+f.shots || 0) / 100 * 5 + 5) : 0;
    const done = ['completed', 'paid'].includes(a.status);
    return '<div class="breadcrumb"><a href="#/' + (V.isSpecialist() ? 'gunum' : 'takvim') + '">' + (V.isSpecialist() ? 'Günüm' : 'Takvim') + '</a><i data-lucide="chevron-right"></i>' + V.esc(c.name) + ' · ' + a.start + '<i data-lucide="chevron-right"></i>Uygulama kaydı</div>' +
      V.header('Uygulama kaydı', V.esc(V.svcLabel(a.service, a.area)) + (p ? ' · ' + V.tpl(p.template).sessions + ' seansın ' + (p.used + (done ? 0 : 1)) + '.\'si' : '') + ' · ' + V.esc(V.staff(a.staff).name) + ' · ' + V.ds(a.date) + ' ' + a.start,
        '<a class="btn" href="#/musteri/' + c.id + '"><i data-lucide="user-round"></i>Müşteri</a><a class="btn ai" href="#/danisma/' + c.id + '"><i data-lucide="sparkles"></i>Danış</a>' +
        (done ? (a.status === 'completed' ? '<a class="btn primary" href="#/kasa?appt=' + a.id + '">Ödeme al</a>' : '') : '<button class="btn primary" data-act="completeTr" data-id="' + a.id + '"><i data-lucide="check"></i>Tamamla ve ödemeye geç</button>')) +
      V.alerts(V.apptWarnings(a)) +
      '<div class="grid g-main mt"><div class="stack">' +
      (laser ? '<div class="card"><div class="card-head"><h3><i data-lucide="sliders-horizontal"></i>Lazer ayarları</h3><span class="small muted">' + (last.date ? 'Önceki seanstan dolduruldu (' + V.ds(last.date) + ')' : 'İlk seans') + '</span></div><div class="card-body form-grid">' +
        '<div class="field"><label>Cihaz</label><input class="input" value="' + V.dev(a.device || 'd808').name + ' · ' + V.dev(a.device || 'd808').hp + '" disabled></div>' +
        '<div class="field"><label>Enerji (J/cm²)</label><input class="input" type="number" name="fluence" value="' + f.fluence + '" data-input="trField"></div>' +
        '<div class="field"><label>Atım süresi (ms)</label><input class="input" type="number" name="pulse" value="' + f.pulse + '" data-input="trField"></div>' +
        '<div class="field"><label>Spot (mm)</label><input class="input" type="number" name="spot" value="' + f.spot + '" data-input="trField"></div>' +
        '<div class="field"><label>Atım sayısı <span class="req">*</span></label><input class="input" type="number" name="shots" value="' + f.shots + '" data-input="trField"><span class="hint">Cihaz ekranından girin</span></div>' +
        '<div class="field"><label>Reaksiyon</label><select class="select" name="reaction" data-change="trField">' + ['Yok', 'Hafif kızarıklık', 'Şişlik', 'Kabarma'].map((x) => V.opt(x, x, f.reaction)).join('') + '</select></div></div></div>' : '') +
      '<div class="card"><div class="card-head"><h3><i data-lucide="flask-conical"></i>Kullanılan ürünler</h3><span class="small muted">Stoktan otomatik düşülür</span></div><div class="card-body flush"><table class="table"><thead><tr><th>Ürün</th><th>Lot</th><th class="num">Miktar</th></tr></thead><tbody>' +
      (laser ? '<tr><td>Lazer soğutma jeli</td><td>CG-551</td><td class="num">' + gel + ' ml</td></tr>' : '') + '<tr><td>Nitril eldiven</td><td>-</td><td class="num">1 çift</td></tr></tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h3>Not</h3></div><div class="card-body"><textarea class="input" name="note" data-input="trField" placeholder="Seansla ilgili notlar">' + V.esc(f.note) + '</textarea></div></div></div>' +
      '<div class="stack"><div class="card"><div class="card-head"><h3><i data-lucide="camera"></i>Fotoğraflar</h3>' + (V.consentOk(c, 'photo') ? V.tag('Onam var', 'green') : V.tag('Fotoğraf onamı yok')) + '</div><div class="card-body grid g2"><div class="photo">önce</div><div class="upload" style="display:grid;place-items:center" data-act="toastMsg" data-msg="Gerçek uygulamada tabletin kamerası açılır"><i data-lucide="camera"></i>Sonra</div></div></div>' +
      (last.date ? '<div class="card"><div class="card-head"><h3>Önceki seans</h3></div><div class="card-body small"><dl class="desc" style="grid-template-columns:100px 1fr"><dt>Tarih</dt><dd>' + V.ds(last.date) + '</dd>' + (last.fluence ? '<dt>Enerji</dt><dd>' + last.fluence + ' J/cm²</dd><dt>Atım</dt><dd>' + last.shots + '</dd>' : '') + '<dt>Reaksiyon</dt><dd>' + V.esc(last.reaction || '-') + '</dd></dl></div></div>' : '') +
      (p ? '<div class="alert info"><i data-lucide="gift"></i><div>Tamamlayınca paketten <b>1 seans</b> düşülür (' + (V.tpl(p.template).sessions - p.used - (done ? 0 : 1)) + ' seans kalır).</div></div>' : '') + '</div></div>';
  };
  V.act.trField = (el) => { V.UI.trForm[el.name] = el.value; if (el.name === 'shots') { const span = null; } };
  V.act.toastMsg = (el) => V.toast(el.dataset.msg);
  V.act.completeTr = (el) => {
    const a = V.appt(el.dataset.id), f = V.UI.trForm, s = V.svc(a.service);
    if (s.device && !(+f.shots > 0)) { V.toast('Atım sayısını girin'); return; }
    S().treatments.push({ id: V.id('tr', 'tr'), appt: a.id, customer: a.customer, staff: a.staff, service: a.service, area: a.area, date: a.date, device: a.device, fluence: s.device ? +f.fluence : null, pulse: +f.pulse, spot: +f.spot, shots: s.device ? +f.shots : null, reaction: f.reaction, note: f.note });
    a.status = 'completed'; a.byDemo = true;
    if (a.pkg) V.pkg(a.pkg).used++;
    const time = V.NOW;
    if (s.device) {
      const gel = Math.round(+f.shots / 100 * 5 + 5); V.prod('jel').stock -= gel; V.dev(a.device || 'd808').shots += +f.shots;
      S().moves.unshift({ date: V.TODAY, time, product: 'jel', qty: -gel, type: 'Uygulama', ref: V.cust(a.customer).name + ' · ' + V.svcLabel(a.service, a.area), by: a.staff });
    }
    V.prod('eldiven').stock -= 1;
    V.UI.trForm = null;
    V.commit('Uygulama kaydedildi · stok güncellendi', '#/kasa?appt=' + a.id);
  };
})();
