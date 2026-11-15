/* Victoria demo — cash desk: new sale (incl. pay later & package), sales & refunds, receivables, expenses, day close, customer account. */
(function () {
  const S = () => V.S;
  const METHOD = { kart: 'Kart', nakit: 'Nakit', havale: 'Havale/EFT', sonra: 'Sonra öde' };

  V.saleRefunded = (s) => (s.refunds || []).reduce((a, r) => a + r.amount, 0);
  const baseTotal = V.saleTotal;
  V.saleTotal = (s) => baseTotal(s) - V.saleRefunded(s);
  V.payLabel = (s) => { const m = (s.payments || []).map((p) => METHOD[p.method] + (s.payments.length > 1 ? ' ' + V.money(p.amount) : '')); if (s.plan) m.push('Sonra öde'); return m.join(' + ') || (V.saleTotal(s) ? '-' : 'Paket seansı'); };

  // ---------- Cart ----------
  V.newCart = (cid) => ({ customer: cid || null, appt: null, lines: [], discount: 0, pay: { method: 'kart', down: '', downMethod: 'nakit', count: '3', first: V.addMonths(V.TODAY, 1) } });
  V.cartFor = (cid, keep) => {
    const c = S().cart;
    if (c && (c.customer === (cid || null))) return c;
    if (c && keep && !c.customer && !c.lines.length) { c.customer = cid || null; return c; }
    if (c && keep && !c.customer && !cid) return c;
    S().cart = V.newCart(cid); return S().cart;
  };
  const cartTotal = (c) => c.lines.reduce((a, l) => a + V.lineTotal(l), 0) - (+c.discount || 0);
  V.planPreview = (total, pay) => {
    const down = Math.min(V.num(pay.down), total), rest = total - down, n = Math.max(1, +pay.count || 1), each = Math.floor(rest / n);
    const out = []; for (let i = 0; i < n; i++) out.push({ due: V.addMonths(pay.first || V.addMonths(V.TODAY, 1), i), amount: i === n - 1 ? rest - each * (n - 1) : each, paid: 0 });
    return { down, rest, inst: rest > 0 ? out : [] };
  };

  // ---------- Screen ----------
  V.screens.kasa = (r) => {
    if (r.q.appt) {
      const a = V.appt(r.q.appt);
      if (a && a.status === 'completed' && (!S().cart || S().cart.appt !== a.id)) {
        const cart = V.newCart(a.customer); cart.appt = a.id;
        const p = a.pkg ? V.pkg(a.pkg) : null;
        cart.lines.push(p ? { type: 'session', ref: a.service, name: V.svcLabel(a.service, a.area) + ' (paket ' + p.used + '/' + V.tpl(p.template).sessions + ')', qty: 1, price: 0, staff: a.staff }
          : { type: 'service', ref: a.service, name: V.svcLabel(a.service, a.area), qty: 1, price: V.svcPrice(a.service, a.area), staff: a.staff });
        S().cart = cart; V.save();
      }
      V.UI.tab_kasa = 'satis';
      V.UI.at = '#/kasa';
    }
    if (r.q.tab) { V.UI.tab_kasa = r.q.tab; V.UI.at = '#/kasa'; }
    const tab = V.UI.tab_kasa || 'satis';
    const overdue = V.openInst().filter((x) => x.inst.due < V.TODAY).length, missing = S().sales.filter((s) => !s.receipt && !(s.refunds || []).length).length;
    const tabs = V.tabs('kasa', [['satis', 'Yeni satış', 'shopping-cart'], ['satislar', 'Satışlar' + (missing ? ' ' + V.tag(missing, 'orange') : ''), 'receipt'], ['alacak', 'Alacaklar' + (overdue ? ' ' + V.tag(overdue, 'red') : ''), 'hand-coins'], ['gider', 'Giderler', 'file-minus'], ['gunsonu', 'Gün sonu', 'lock']], tab);
    const body = { satis: newSale, satislar: salesList, alacak: receivables, gider: expenses, gunsonu: dayClose }[tab]();
    return V.header('Kasa', 'Satış yapın, tahsilat alın, günü kapatın') + tabs + body;
  };

  function newSale() {
    const cart = S().cart || V.cartFor(null);
    const c = cart.customer ? V.cust(cart.customer) : null, total = cartTotal(cart), pay = cart.pay;
    const sub = V.UI.saleSub || 'urun';
    const tiles = S().products.filter((p) => p.retail).map((p) => '<div class="tile" data-act="addProduct" data-id="' + p.id + '"' + (p.stock <= 0 ? ' style="opacity:.45;pointer-events:none"' : '') + '><b>' + V.esc(p.name) + '</b><div class="muted small">' + (p.stock > 0 ? 'stokta ' + p.stock : 'stokta yok') + '</div><div class="price">' + V.money(p.price) + '</div></div>').join('');
    const svcPick = '<div class="form-grid"><div class="field"><label>Hizmet</label><select class="select" id="svcSel" data-change="svcSelChange">' + S().services.map((s) => V.opt(s.id, s.name, V.UI.svcSel || 'hydra')).join('') + '</select></div>' +
      (V.svc(V.UI.svcSel || 'hydra').areas ? '<div class="field"><label>Bölge</label><select class="select" id="areaSel">' + V.svc(V.UI.svcSel || 'hydra').areas.map((a) => V.opt(a.id, a.name + ' · ' + V.money(a.price))).join('') + '</select></div>' : '') +
      '<div class="field" style="justify-content:flex-end"><button class="btn" data-act="addService"><i data-lucide="plus"></i>Ekle</button></div></div>';
    const lines = cart.lines.map((l, i) => '<div class="cart-line"><div class="grow"><b>' + V.esc(l.name) + '</b>' + (l.ai ? ' ' + V.tag('YZ', 'purple') : '') + (l.book ? '<div class="small muted">' + V.tpl(l.ref).sessions + ' seans planlanacak · ilk ' + V.ds(l.book.first) + '</div>' : '') +
      '<div class="small"><select class="select" style="height:24px;font-size:12px;width:auto" data-change="lineStaff" data-i="' + i + '">' + S().staff.filter((s) => s.kind !== 'owner').map((s) => V.opt(s.id, s.name, l.staff)).join('') + '</select></div></div>' +
      (l.type === 'product' ? '<button class="btn sm" data-act="qty" data-i="' + i + '" data-d="-1">−</button><span>' + l.qty + '</span><button class="btn sm" data-act="qty" data-i="' + i + '" data-d="1">+</button>' : '') +
      '<span class="right" style="min-width:72px">' + V.money(V.lineTotal(l)) + '</span><button class="icon-btn" data-act="rmLine" data-i="' + i + '"><i data-lucide="x"></i></button></div>').join('');
    let payBox = '';
    const methods = '<div class="pay-methods">' + [['kart', 'credit-card'], ['nakit', 'banknote'], ['havale', 'landmark'], ['sonra', 'calendar-clock']].map(([m, ic]) => '<button class="' + (pay.method === m ? 'on' : '') + '" data-act="payMethod" data-val="' + m + '"><i data-lucide="' + ic + '"></i>' + METHOD[m] + '</button>').join('') + '</div>';
    if (pay.method === 'sonra') {
      const pv = V.planPreview(total, pay), limit = +S().decisions.creditLimit || 0;
      const after = (c ? V.custBalance(c.id) : 0) + pv.rest, od = c ? V.custOverdue(c.id) : 0;
      const maxN = +S().decisions.maxInst || 6;
      payBox = '<div class="plan-box"><div class="row between"><b><i data-lucide="calendar-clock"></i> Ödeme planı</b>' + (!c ? V.tag('Müşteri seçin', 'red') : od ? V.tag('Gecikmiş borcu var', 'red') : limit && after > limit ? V.tag('Limit aşılıyor', 'red') : V.tag('Limit uygun', 'green')) + '</div>' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Şimdi ödenecek</label><input class="input" value="' + V.esc(pay.down) + '" placeholder="0" data-change="payField" name="down"></div>' +
        '<div class="field"><label>Şimdi ödeme şekli</label><select class="select" data-change="payField" name="downMethod">' + ['nakit', 'kart', 'havale'].map((m) => V.opt(m, METHOD[m], pay.downMethod)).join('') + '</select></div>' +
        '<div class="field"><label>Kalan tutar</label><select class="select" data-change="payField" name="count">' + Array.from({ length: maxN }, (_, i) => i + 1).map((n) => V.opt(n, n === 1 ? 'Tek ödeme' : n + ' taksit', pay.count)).join('') + '</select></div>' +
        '<div class="field"><label>İlk vade</label><input class="input" type="date" value="' + pay.first + '" data-change="payField" name="first"></div></div>' +
        (pv.inst.length ? '<table class="table" style="background:#fff"><thead><tr><th>#</th><th>Vade</th><th class="num">Tutar</th></tr></thead><tbody>' + pv.inst.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + V.ds(x.due) + '</td><td class="num">' + V.money(x.amount) + '</td></tr>').join('') + '</tbody></table>' : '') +
        (c ? '<div class="small muted">Bu satıştan sonra açık bakiye: <b>' + V.money(after) + '</b>' + (limit ? ' · limit ' + V.money(limit) : '') + '</div>' : '') +
        '<label class="chk"><input type="checkbox" checked> Her vadeden 2 gün önce SMS hatırlatması</label>' +
        '<div class="alert info small"><i data-lucide="receipt"></i><div>Resmi fiş bugün tutarın tamamı için kesilir; sonraki ödemeler tahsilat olarak kaydedilir.</div></div></div>';
    }
    const canPay = cart.lines.length && (pay.method !== 'sonra' || c);
    return '<div class="pos"><div class="stack">' +
      (cart.lines.some((l) => l.ai) ? '<div class="alert ai"><i data-lucide="sparkles"></i><div>Danışmada kabul edilen öneriler satışa eklendi.</div></div>' : '') +
      '<div class="card"><div class="card-head"><h3>Kalem ekle</h3><div class="seg"><button class="' + (sub === 'urun' ? 'on' : '') + '" data-act="setUI" data-key="saleSub" data-val="urun">Ürünler</button><button class="' + (sub === 'hizmet' ? 'on' : '') + '" data-act="setUI" data-key="saleSub" data-val="hizmet">Hizmetler</button><button data-act="sellPkg">Paket sat</button></div></div>' +
      '<div class="card-body">' + (sub === 'urun' ? '<div class="tiles">' + tiles + '</div>' : svcPick) + '</div></div></div>' +
      '<div class="card" style="position:sticky;top:76px;max-height:calc(100vh - 92px);overflow:auto"><div class="card-head"><h3><i data-lucide="user-round"></i>Müşteri</h3>' + (cart.lines.length ? '<button class="btn sm text" data-act="clearCart">Temizle</button>' : '') + '</div>' +
      '<div class="card-body" style="padding-bottom:0"><select class="select" data-change="cartCust">' + V.custOptions(cart.customer || '', 'Müşterisiz satış') + '</select>' + (cart.appt ? '<div class="small muted mt">Randevudan: ' + V.appt(cart.appt).start + ' ' + V.esc(V.svcLabel(V.appt(cart.appt).service, V.appt(cart.appt).area)) + '</div>' : '') +
      (c && V.custOverdue(c.id) ? '<div class="alert error small mt"><i data-lucide="hand-coins"></i><div>Gecikmiş ödemesi var: ' + V.money(V.custOverdue(c.id)) + '. <a href="#" data-act="collectFor" data-id="' + c.id + '">Tahsil et</a></div></div>' : '') + '</div>' +
      '<div class="mt">' + (lines || '<div class="card-body muted">Henüz kalem yok. Soldan ürün veya hizmet ekleyin.</div>') + '</div>' +
      '<div class="card-body stack"><div class="row"><label class="small muted">İndirim (₺)</label><input class="input" style="width:110px" value="' + (cart.discount || '') + '" data-change="cartDiscount" placeholder="0"></div>' +
      '<div class="totals"><span class="muted">KDV dahil (%20)</span><span class="right">' + V.money(total / 6) + '</span><span class="grand">Toplam</span><span class="grand right">' + V.money(total) + '</span></div>' + methods + payBox +
      '<button class="btn primary lg block" data-act="takePayment"' + (canPay ? '' : ' disabled style="opacity:.5;pointer-events:none"') + '><i data-lucide="check"></i>' + (pay.method === 'sonra' ? 'Satışı kaydet' + (V.num(pay.down) ? ' · şimdi ' + V.money(Math.min(V.num(pay.down), total)) + ' al' : '') : 'Ödemeyi al ' + V.money(total)) + '</button></div></div></div>';
  }
  V.act.addProduct = (el) => {
    const cart = S().cart || V.cartFor(null), p = V.prod(el.dataset.id), ex = cart.lines.find((l) => l.type === 'product' && l.ref === p.id);
    if (ex) ex.qty++; else cart.lines.push({ type: 'product', ref: p.id, name: p.name, qty: 1, price: p.price, staff: V.isSpecialist() ? V.user().id : 'za' });
    V.commit();
  };
  V.act.svcSelChange = (el) => { V.UI.svcSel = el.value; V.render(); };
  V.act.addService = () => {
    const cart = S().cart || V.cartFor(null), sid = document.getElementById('svcSel').value, ae = document.getElementById('areaSel'), area = ae ? ae.value : null;
    cart.lines.push({ type: 'service', ref: sid, area, name: V.svcLabel(sid, area), qty: 1, price: V.svcPrice(sid, area), staff: V.svc(sid).staff[0] }); V.commit();
  };
  V.act.qty = (el) => { const l = S().cart.lines[+el.dataset.i]; l.qty = Math.max(1, l.qty + +el.dataset.d); V.commit(); };
  V.act.rmLine = (el) => { S().cart.lines.splice(+el.dataset.i, 1); V.commit(); };
  V.act.lineStaff = (el) => { S().cart.lines[+el.dataset.i].staff = el.value; V.save(); };
  V.act.cartCust = (el) => { const cart = S().cart || V.cartFor(null); cart.customer = el.value || null; V.commit(); };
  V.act.cartDiscount = (el) => { S().cart.discount = V.num(el.value); V.commit(); };
  V.act.clearCart = () => { S().cart = null; V.commit('Satış temizlendi'); };
  V.act.payMethod = (el) => { const cart = S().cart || V.cartFor(null); cart.pay.method = el.dataset.val; V.commit(); };
  V.act.payField = (el) => { S().cart.pay[el.name] = el.value; V.commit(); };

  // Package sale drawer
  V.act.sellPkg = () => { const cart = S().cart || V.cartFor(null); V.openDrawer('pkg', { tpl: 't_yuz6', price: '', book: true, first: V.addDays(V.TODAY, 7), weeks: '6', start: '14:00', staff: 'ad', noCust: !cart.customer }); };
  V.drawers.pkg = (d) => {
    const t = V.tpl(d.tpl), price = d.price === '' ? t.price : V.num(d.price), s = V.svc(t.service);
    const dates = []; for (let i = 0; i < t.sessions; i++) dates.push(V.addDays(d.first, i * 7 * (+d.weeks || 6)));
    return { title: '<i data-lucide="gift"></i>Paket sat' + (S().cart.customer ? ' · ' + V.esc(V.cust(S().cart.customer).name) : ''), wide: true,
      body: (d.noCust && !S().cart.customer ? '<div class="alert warning"><i data-lucide="user-round"></i>Paket bir müşteriye satılır; kasada müşteriyi seçmeyi unutmayın.</div>' : '') +
        '<div class="form-grid"><div class="field span-2"><label>Paket</label><select class="select" name="tpl" data-change="drawerSync">' + S().templates.map((x) => V.opt(x.id, x.name + ' · ' + V.money(x.price) + ' · ' + x.months + ' ay', d.tpl)).join('') + '</select></div>' +
        '<div class="field"><label>Fiyat</label><input class="input" name="price" value="' + (d.price === '' ? '' : V.esc(d.price)) + '" placeholder="' + V.money(t.price) + '" data-change="drawerSync"><span class="hint">%10\'un üzerindeki indirim müdür onayı gerektirir</span></div>' +
        '<div class="field"><label>Uygulayan</label><select class="select" name="staff">' + s.staff.map((id) => V.opt(id, V.staff(id).name, d.staff)).join('') + '</select></div></div>' +
        '<label class="chk"><input type="checkbox" name="book" data-change="drawerSync"' + (d.book ? ' checked' : '') + '> Tüm seansları şimdi planla</label>' +
        (d.book ? '<div class="form-grid"><div class="field"><label>İlk seans</label><input class="input" type="date" name="first" value="' + d.first + '" data-change="drawerSync"></div><div class="field"><label>Saat</label><input class="input" type="time" step="900" name="start" value="' + d.start + '"></div>' +
          '<div class="field"><label>Aralık</label><select class="select" name="weeks" data-change="drawerSync">' + ['4', '6', '8'].map((w) => V.opt(w, w + ' hafta', d.weeks)).join('') + '</select></div></div><div class="row wrap" style="gap:6px">' + dates.map((x) => V.tag(V.ds(x), 'indigo')).join('') + '</div>' : '') +
        '<div class="small muted">Ödemeyi kasada peşin veya "Sonra öde" ile taksitli alabilirsiniz.</div>',
      foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn primary" data-act="addPkg">Satışa ekle · ' + V.money(price) + '</button>' };
  };
  V.act.addPkg = () => {
    V.syncDrawer(); const d = V.UI.drawer.data, t = V.tpl(d.tpl), price = d.price === '' ? t.price : V.num(d.price);
    S().cart.lines.push({ type: 'package', ref: t.id, name: t.name, qty: 1, price, staff: d.staff, book: d.book ? { first: d.first, weeks: +d.weeks, start: d.start, staff: d.staff } : null });
    V.closeDrawer(); V.commit(V.esc(t.name) + ' satışa eklendi');
  };

  // Take payment
  V.act.takePayment = () => {
    const cart = S().cart, total = cartTotal(cart), pay = cart.pay, c = cart.customer ? V.cust(cart.customer) : null;
    if (cart.lines.some((l) => l.type === 'package') && !c) { V.toast('Paket satışı için müşteri seçin'); return; }
    const sale = { id: 'S-2026-' + V.id('sale', ''), date: V.TODAY, time: V.NOW, customer: cart.customer, staff: V.user().id, appt: cart.appt, lines: cart.lines.map((l) => Object.assign({}, l)), discount: +cart.discount || 0, payments: [], receipt: total > 0 ? null : { type: '-', no: 'Gerekmez' } };
    if (pay.method === 'sonra') {
      const pv = V.planPreview(total, pay);
      if (pv.down > 0) sale.payments.push({ method: pay.downMethod, amount: pv.down });
      if (pv.inst.length) { const plan = { id: 'P-' + V.id('plan', '', 3), customer: c.id, sale: sale.id, label: cart.lines.map((l) => l.name).join(', '), total, down: pv.down, inst: pv.inst }; S().plans.push(plan); sale.plan = plan.id; }
    } else if (total > 0) sale.payments.push({ method: pay.method, amount: total });
    sale.lines.forEach((l) => {
      if (l.type === 'product') { const p = V.prod(l.ref); p.stock -= l.qty; S().moves.unshift({ date: V.TODAY, time: V.NOW, product: p.id, qty: -l.qty, type: 'Satış', ref: sale.id, by: l.staff }); }
      if (l.type === 'package') {
        const t = V.tpl(l.ref), pk = { id: V.id('pkg', 'k'), customer: c.id, template: t.id, used: 0, sold: V.TODAY, expiry: V.addMonths(V.TODAY, t.months), price: l.price }; S().packages.push(pk);
        if (l.book) for (let i = 0; i < t.sessions; i++) {
          const a = { id: V.id('appt', 'a'), customer: c.id, staff: l.book.staff, service: t.service, area: t.area, device: V.svc(t.service).device ? 'd808' : undefined, date: V.addDays(l.book.first, i * 7 * l.book.weeks), start: l.book.start, dur: V.svcDur(t.service, t.area), status: 'booked', pkg: pk.id };
          if (V.conflict(a)) a.start = V.hhmm(V.mins(a.start) + 60);
          S().appts.push(a);
        }
      }
    });
    if (cart.appt) V.appt(cart.appt).status = 'paid';
    S().sales.push(sale);
    if (c && c.demoNew && sale.lines.some((l) => l.ai)) S().tasks.t2 = true;
    if (sale.plan && sale.lines.some((l) => l.type === 'package')) S().tasks.t3 = true;
    if (cart.appt && V.appt(cart.appt).byDemo) S().tasks.t5 = true;
    S().cart = null; V.save();
    V.UI.tab_kasa = 'satis';
    V.commit(pay.method === 'sonra' ? 'Satış kaydedildi · ödeme planı oluşturuldu' : 'Ödeme alındı: ' + V.money(total));
    if (total > 0) V.openDrawer('receipt', { id: sale.id, type: 'ÖKC', no: '' });
  };

  // Receipt
  V.drawers.receipt = (d) => {
    const s = V.sale(d.id);
    return { title: '<i data-lucide="receipt"></i>Resmi fiş · ' + s.id,
      body: '<div class="alert info"><i data-lucide="info"></i><div>Fişi ÖKC\'den veya e-Arşiv portalından kesin, numarasını yazın ve fotoğrafını ekleyin. Tutar: <b>' + V.money(V.saleTotal(s)) + '</b></div></div>' +
        '<div class="form-grid"><div class="field"><label>Tür</label><select class="select" name="type">' + ['ÖKC', 'e-Arşiv'].map((x) => V.opt(x, x, d.type)).join('') + '</select></div><div class="field"><label>Fiş / fatura no</label><input class="input" name="no" value="' + V.esc(d.no) + '" placeholder="ör. Z-0012/0456"></div></div>' +
        '<div class="upload" data-act="fakeUpload"><i data-lucide="camera"></i><br>' + (d.uploaded ? '✓ Fotoğraf eklendi' : 'Fişin fotoğrafını çek / yükle') + '</div>',
      foot: '<button class="btn" data-act="closeDrawer">Sonra</button><button class="btn primary" data-act="saveReceipt">Fişi kaydet</button>' };
  };
  V.act.saveReceipt = () => { V.syncDrawer(); const d = V.UI.drawer.data, s = V.sale(d.id); if (!d.no && !d.uploaded) { V.toast('Fiş numarasını yazın veya fotoğraf ekleyin'); return; } s.receipt = { type: d.type, no: d.no || 'fotoğraf', photo: !!d.uploaded }; V.closeDrawer(); V.commit('Fiş kaydedildi'); };

  // ---------- Sales list & refunds ----------
  function salesList() {
    const f = V.UI.salesFilter || 'all';
    const list = S().sales.filter((s) => f === 'all' || (!s.receipt && !(s.refunds || []).length)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    return '<div class="filter-bar"><div class="seg"><button class="' + (f === 'all' ? 'on' : '') + '" data-act="setUI" data-key="salesFilter" data-val="all">Tümü</button><button class="' + (f === 'miss' ? 'on' : '') + '" data-act="setUI" data-key="salesFilter" data-val="miss">Fişi eksik</button></div></div>' +
      '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>No</th><th>Tarih</th><th>Müşteri</th><th>Kalemler</th><th>Ödeme</th><th class="num">Tutar</th><th>Fiş</th></tr></thead><tbody>' +
      (list.length ? list.map((s) => '<tr class="clickable" data-act="openSale" data-id="' + s.id + '"><td>' + s.id + '</td><td>' + V.ds(s.date) + ' ' + s.time + '</td><td>' + (s.customer ? V.esc(V.cust(s.customer).name) : '–') + '</td><td>' + s.lines.map((l) => V.esc(l.name) + (l.ai ? ' ' + V.tag('YZ', 'purple') : '')).join(', ') + '</td><td>' + V.payLabel(s) + '</td><td class="num">' + V.money(V.saleTotal(s)) + ((s.refunds || []).length ? ' <span class="small down">(iade ' + V.money(V.saleRefunded(s)) + ')</span>' : '') + '</td><td>' + (s.receipt ? V.tag(s.receipt.type === '-' ? 'Gerekmez' : s.receipt.type + ' · ' + V.esc(s.receipt.no), 'green') : V.tag('Eksik', 'orange')) + '</td></tr>').join('') : '<tr><td colspan="7" class="muted">Kayıt yok</td></tr>') +
      '</tbody></table></div></div>';
  }
  V.act.openSale = (el) => V.openDrawer('sale', { id: el.dataset.id });
  V.drawers.sale = (d) => {
    const s = V.sale(d.id);
    if (d.mode === 'refund') {
      return { title: '<i data-lucide="undo-2"></i>İade · ' + s.id,
        body: '<table class="table"><thead><tr><th></th><th>Kalem</th><th class="num">Tutar</th></tr></thead><tbody>' + s.lines.map((l, i) => '<tr><td><input type="checkbox" name="l' + i + '"' + (V.lineTotal(l) ? '' : ' disabled') + '></td><td>' + V.esc(l.name) + '</td><td class="num">' + V.money(V.lineTotal(l)) + '</td></tr>').join('') + '</tbody></table>' +
          '<div class="field"><label>Neden</label><select class="select" name="reason"><option>Ürün açılmadı, vazgeçti</option><option>Alerjik reaksiyon</option><option>Hasarlı ürün</option><option>Diğer</option></select></div>' +
          '<label class="chk"><input type="checkbox" name="restock" checked> Ürünleri stoğa geri al (açılmamış)</label>' +
          '<div class="field"><label>İade şekli</label><select class="select" name="method">' + ['kart', 'nakit', 'havale'].map((m) => V.opt(m, METHOD[m], (s.payments[0] || {}).method)).join('') + '</select></div>' +
          '<div class="alert info small"><i data-lucide="info"></i><div>Fişi kesilmiş satış düzenlenemez; değiştirmek için iade edip yeniden satış yapın.</div></div>',
        foot: '<button class="btn" data-act="drawerSet" data-key="mode" data-val="view">Geri</button><button class="btn danger" data-act="doRefund">İade et</button>' };
    }
    return { title: '<i data-lucide="receipt"></i>' + s.id,
      body: '<dl class="desc"><dt>Tarih</dt><dd>' + V.ds(s.date) + ' ' + s.time + '</dd><dt>Müşteri</dt><dd>' + (s.customer ? '<a href="#/musteri/' + s.customer + '">' + V.esc(V.cust(s.customer).name) + '</a>' : '–') + '</dd><dt>Ödeme</dt><dd>' + V.payLabel(s) + '</dd>' + (s.plan ? '<dt>Ödeme planı</dt><dd>' + s.plan + ' · kalan ' + V.money(V.planOpen(V.plan(s.plan))) + '</dd>' : '') + '</dl>' +
        '<table class="table"><thead><tr><th>Kalem</th><th>Personel</th><th class="num">Tutar</th></tr></thead><tbody>' + s.lines.map((l) => '<tr><td>' + V.esc(l.name) + (l.qty > 1 ? ' ×' + l.qty : '') + '</td><td>' + V.esc(V.staff(l.staff).name) + '</td><td class="num">' + V.money(V.lineTotal(l)) + '</td></tr>').join('') +
        ((s.refunds || []).map((r) => '<tr><td colspan="2" class="down">İade · ' + V.esc(r.reason) + '</td><td class="num down">−' + V.money(r.amount) + '</td></tr>').join('')) + '</tbody><tfoot><tr><td colspan="2">Toplam</td><td class="num">' + V.money(V.saleTotal(s)) + '</td></tr></tfoot></table>' +
        '<div class="card"><div class="card-head"><h3>Resmi fiş</h3>' + (s.receipt ? V.tag('Kayıtlı', 'green') : V.tag('Eksik', 'orange')) + '</div><div class="card-body">' + (s.receipt ? V.esc(s.receipt.type + ' · ' + s.receipt.no) : '<button class="btn sm primary" data-act="toReceipt" data-id="' + s.id + '">Fiş ekle</button>') + '</div></div>',
      foot: (V.saleTotal(s) > 0 ? '<button class="btn danger" data-act="drawerSet" data-key="mode" data-val="refund">İade</button>' : '') + '<button class="btn" data-act="closeDrawer">Kapat</button>' };
  };
  V.act.toReceipt = (el) => V.openDrawer('receipt', { id: el.dataset.id, type: 'ÖKC', no: '' });
  V.act.doRefund = () => {
    V.syncDrawer(); const d = V.UI.drawer.data, s = V.sale(d.id);
    const idx = s.lines.map((l, i) => (d['l' + i] ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) { V.toast('İade edilecek kalemi seçin'); return; }
    const amount = idx.reduce((a, i) => a + V.lineTotal(s.lines[i]), 0);
    s.refunds = (s.refunds || []).concat({ date: V.TODAY, lines: idx, amount, method: d.method, reason: d.reason });
    if (d.restock) idx.forEach((i) => { const l = s.lines[i]; if (l.type === 'product') { V.prod(l.ref).stock += l.qty; S().moves.unshift({ date: V.TODAY, time: V.NOW, product: l.ref, qty: l.qty, type: 'İade', ref: s.id, by: V.user().id }); } });
    V.closeDrawer(); V.commit(V.money(amount) + ' iade edildi (' + METHOD[d.method] + ')');
  };

  // ---------- Receivables ----------
  function receivables() {
    const open = V.openInst(), total = open.reduce((a, x) => a + V.instOpen(x.inst), 0);
    const od = open.filter((x) => x.inst.due < V.TODAY), soon = open.filter((x) => x.inst.due >= V.TODAY && V.days(V.TODAY, x.inst.due) <= 7);
    const month = S().collections.filter((c) => c.date.startsWith('2026-11')).reduce((a, c) => a + c.amount, 0) + S().baseline.collected;
    return '<div class="grid g4 mb">' + V.stat('warning', 'Toplam alacak', V.money(total), open.length + ' açık taksit') + V.stat('primary', '7 gün içinde', V.money(soon.reduce((a, x) => a + V.instOpen(x.inst), 0)), soon.length + ' taksit · SMS hatırlatması planlı') +
      V.stat(od.length ? 'error' : 'success', 'Gecikmiş', V.money(od.reduce((a, x) => a + V.instOpen(x.inst), 0)), od.length + ' taksit') + V.stat('success', 'Bu ay tahsil edilen', V.money(month)) + '</div>' +
      '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Vade</th><th>Müşteri</th><th>Telefon</th><th>Kaynak</th><th>Taksit</th><th class="num">Tutar</th><th>Durum</th><th></th></tr></thead><tbody>' +
      (open.length ? open.map((x) => { const c = V.cust(x.plan.customer), st = V.instStatus(x.inst);
        return '<tr><td class="' + (x.inst.due < V.TODAY ? 'down' : '') + '">' + V.ds(x.inst.due) + '</td><td><a href="#/musteri/' + c.id + '?tab=hesap">' + V.esc(c.name) + '</a></td><td>' + c.phone + '</td><td>' + V.esc(x.plan.label) + '</td><td>' + x.n + ' / ' + x.of + '</td><td class="num">' + V.money(V.instOpen(x.inst)) + '</td><td>' + V.tag(st[0], st[1]) + '</td>' +
          '<td class="row">' + (x.inst.due <= V.addDays(V.TODAY, 3) ? '<button class="btn sm" data-act="smsRemind" data-id="' + c.id + '">SMS</button>' : '') + '<button class="btn sm primary" data-act="collectFor" data-id="' + c.id + '" data-plan="' + x.plan.id + '">Tahsil et</button></td></tr>'; }).join('') : '<tr><td colspan="8" class="muted">Açık alacak yok</td></tr>') +
      '</tbody></table></div></div>';
  }
  V.act.smsRemind = (el) => V.toast('Hatırlatma SMS\'i gönderildi: ' + V.esc(V.cust(el.dataset.id).name));
  V.act.collectFor = (el) => {
    const cid = el.dataset.id, plans = S().plans.filter((p) => p.customer === cid && V.planOpen(p) > 0);
    const plan = el.dataset.plan || (plans[0] || {}).id; if (!plan) { V.toast('Açık taksit yok'); return; }
    const first = V.plan(plan).inst.find((i) => V.instOpen(i) > 0);
    V.openDrawer('collect', { cid, plan, amount: String(V.instOpen(first)), method: 'nakit' });
  };
  V.drawers.collect = (d) => {
    const c = V.cust(d.cid), p = V.plan(d.plan), plans = S().plans.filter((x) => x.customer === d.cid && V.planOpen(x) > 0);
    return { title: '<i data-lucide="hand-coins"></i>Tahsilat · ' + V.esc(c.name),
      body: (plans.length > 1 ? '<div class="field"><label>Ödeme planı</label><select class="select" name="plan" data-change="drawerSync">' + plans.map((x) => V.opt(x.id, x.label + ' · kalan ' + V.money(V.planOpen(x)), d.plan)).join('') + '</select></div>' : '<div class="small muted">' + V.esc(p.label) + '</div>') +
        '<table class="table"><thead><tr><th>#</th><th>Vade</th><th class="num">Kalan</th><th>Durum</th></tr></thead><tbody>' + p.inst.map((i, n) => V.instOpen(i) > 0 ? '<tr><td>' + (n + 1) + '</td><td>' + V.ds(i.due) + '</td><td class="num">' + V.money(V.instOpen(i)) + '</td><td>' + V.tag(V.instStatus(i)[0], V.instStatus(i)[1]) + '</td></tr>' : '').join('') + '</tbody></table>' +
        '<div class="field"><label>Tutar</label><input class="input" name="amount" value="' + V.esc(d.amount) + '"><span class="hint">Önce en eski vadeye uygulanır; kısmi ödeme yapılabilir.</span></div>' +
        '<div class="field"><label>Ödeme şekli</label><select class="select" name="method">' + ['nakit', 'kart', 'havale'].map((m) => V.opt(m, METHOD[m], d.method)).join('') + '</select></div>',
      foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn primary" data-act="doCollect">Tahsil et</button>' };
  };
  V.act.doCollect = () => {
    V.syncDrawer(); const d = V.UI.drawer.data, p = V.plan(d.plan); let left = Math.min(V.num(d.amount), V.planOpen(p));
    if (!(left > 0)) { V.toast('Tutarı girin'); return; }
    const total = left; let overdueHit = false;
    p.inst.forEach((i) => { if (left <= 0) return; const o = V.instOpen(i); if (o <= 0) return; const pay = Math.min(o, left); i.paid = (i.paid || 0) + pay; left -= pay; if (V.instOpen(i) <= 0.5) i.paidOn = V.TODAY; if (i.due < V.TODAY) overdueHit = true; });
    S().collections.push({ id: 'T-' + V.id('col', '', 3), date: V.TODAY, time: V.NOW, customer: d.cid, plan: p.id, amount: total, method: d.method, by: V.user().id });
    if (overdueHit) S().tasks.t4 = true;
    V.closeDrawer(); V.commit(V.money(total) + ' tahsil edildi · kalan ' + V.money(V.custBalance(d.cid)));
  };

  // ---------- Customer account tab (used on the profile) ----------
  V.accountTab = (c) => {
    const plans = S().plans.filter((p) => p.customer === c.id);
    const ledger = [];
    S().sales.filter((s) => s.customer === c.id).forEach((s) => { ledger.push([s.date, s.time, 'Satış ' + s.id + ' · ' + s.lines.map((l) => l.name).join(', '), V.saleTotal(s), 0]); (s.payments || []).forEach((p) => ledger.push([s.date, s.time + '1', 'Ödeme · ' + METHOD[p.method], 0, p.amount])); });
    plans.forEach((p) => { if (!S().sales.some((s) => s.id === p.sale)) { ledger.push([p.inst[0] ? V.addMonths(p.inst[0].due, -1) : V.TODAY, '00', 'Satış ' + p.sale + ' · ' + p.label, p.total, 0]); if (p.down) ledger.push([p.inst[0] ? V.addMonths(p.inst[0].due, -1) : V.TODAY, '01', 'Peşinat', 0, p.down]); } });
    S().collections.filter((x) => x.customer === c.id).forEach((x) => ledger.push([x.date, x.time || '12', 'Taksit ödemesi · ' + METHOD[x.method], 0, x.amount]));
    plans.forEach((p) => p.inst.forEach((i, n) => { if (i.paidOn && !S().collections.some((x) => x.plan === p.id && x.date === i.paidOn)) ledger.push([i.paidOn, '12', 'Taksit ' + (n + 1) + ' ödemesi', 0, i.paid]); }));
    ledger.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
    let bal = 0; const rows = ledger.map((e) => { bal += e[3] - e[4]; return '<tr><td>' + V.ds(e[0]) + '</td><td>' + V.esc(e[2]) + '</td><td class="num">' + (e[3] ? V.money(e[3]) : '') + '</td><td class="num up">' + (e[4] ? V.money(e[4]) : '') + '</td><td class="num">' + V.money(Math.max(0, bal)) + '</td></tr>'; }).reverse().join('');
    const limit = +S().decisions.creditLimit || 0, b = V.custBalance(c.id), next = V.openInst().find((x) => x.plan.customer === c.id);
    return '<div class="grid g4 mb">' + V.stat(b ? 'warning' : 'success', 'Açık bakiye', V.money(b), plans.filter((p) => V.planOpen(p) > 0).length + ' aktif ödeme planı') +
      V.stat('primary', 'Sıradaki ödeme', next ? V.money(V.instOpen(next.inst)) : '–', next ? V.ds(next.inst.due) + ' · ' + V.instStatus(next.inst)[0] : '') +
      V.stat(V.custOverdue(c.id) ? 'error' : 'success', 'Gecikmiş', V.money(V.custOverdue(c.id))) + V.stat('neutral', 'Borç limiti', limit ? V.money(limit) : 'Yok', limit ? V.money(Math.max(0, limit - b)) + ' kullanılabilir' : '') + '</div>' +
      '<div class="grid g2"><div class="stack">' + (plans.length ? plans.map((p) => '<div class="card"><div class="card-head"><h3><i data-lucide="calendar-clock"></i>Ödeme planı ' + p.id + '</h3>' + (V.planOpen(p) > 0 ? '<button class="btn sm primary" data-act="collectFor" data-id="' + c.id + '" data-plan="' + p.id + '"><i data-lucide="hand-coins"></i>Tahsil et</button>' : V.tag('Kapandı', 'green')) + '</div>' +
        '<div class="card-body small muted" style="padding-bottom:0">' + V.esc(p.label) + ' · ' + V.money(p.total) + (p.down ? ' · peşinat ' + V.money(p.down) : '') + '</div><div class="card-body flush"><table class="table"><thead><tr><th>#</th><th>Vade</th><th class="num">Tutar</th><th class="num">Ödenen</th><th>Durum</th></tr></thead><tbody>' +
        p.inst.map((i, n) => { const st = V.instStatus(i); return '<tr><td>' + (n + 1) + '</td><td>' + V.ds(i.due) + '</td><td class="num">' + V.money(i.amount) + '</td><td class="num">' + V.money(i.paid || 0) + '</td><td>' + V.tag(st[0] + (i.paidOn && st[0] === 'Ödendi' ? ' ' + V.ds(i.paidOn).slice(0, 5) : ''), st[1]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>').join('') : '<div class="card"><div class="card-body muted">Ödeme planı yok</div></div>') + '</div>' +
      '<div class="card"><div class="card-head"><h3><i data-lucide="history"></i>Hesap hareketleri</h3><button class="btn sm" data-act="exportNote"><i data-lucide="download"></i>Ekstre</button></div><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Tarih</th><th>Açıklama</th><th class="num">Borç</th><th class="num">Ödeme</th><th class="num">Bakiye</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5" class="muted">Hareket yok</td></tr>') + '</tbody></table></div></div></div>';
  };

  // ---------- Expenses ----------
  function expenses() {
    const list = S().expenses.slice().sort((a, b) => b.date.localeCompare(a.date));
    const nov = S().expenses.filter((e) => e.date.startsWith('2026-11'));
    const spent = nov.filter((e) => !e.planned).reduce((a, e) => a + e.amount, 0), planned = nov.filter((e) => e.planned).reduce((a, e) => a + e.amount, 0);
    return '<div class="row between wrap mb"><span class="muted">Yaklaşık kârı görmek için basit gider listesi. Muhasebe değildir; defterleri mali müşavir tutar.</span><button class="btn primary" data-act="newExpense"><i data-lucide="plus"></i>Gider ekle</button></div>' +
      '<div class="grid g3 mb">' + V.stat('neutral', 'Bu ayın giderleri', V.money(spent), nov.filter((e) => !e.planned).length + ' kayıt') + V.stat('warning', 'Bu ay planlanan', V.money(planned), 'Maaşlar · 30.11') + '</div>' +
      '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Tarih</th><th>Kategori</th><th>Açıklama</th><th>Ödeme</th><th class="num">Tutar</th><th></th></tr></thead><tbody>' +
      list.map((e) => '<tr><td>' + V.ds(e.date) + '</td><td>' + V.tag(e.cat) + '</td><td>' + V.esc(e.desc) + (e.monthly ? ' <span class="small muted">(her ay)</span>' : '') + '</td><td>' + METHOD[e.method] + (e.method === 'nakit' ? ' <span class="small muted">(kasadan)</span>' : '') + '</td><td class="num">' + V.money(e.amount) + '</td><td>' + (e.planned ? V.tag('Planlandı', 'orange') : '') + '</td></tr>').join('') + '</tbody></table></div></div>';
  }
  V.act.newExpense = () => V.openDrawer('expense', { date: V.TODAY, cat: 'Tedarikçi', desc: '', amount: '', method: 'havale', monthly: false });
  V.drawers.expense = (d) => ({ title: '<i data-lucide="file-minus"></i>Gider ekle',
    body: '<div class="form-grid"><div class="field"><label>Tarih</label><input class="input" type="date" name="date" value="' + d.date + '"></div><div class="field"><label>Tutar (₺)</label><input class="input" name="amount" value="' + V.esc(d.amount) + '"></div>' +
      '<div class="field"><label>Kategori</label><select class="select" name="cat">' + V.EXP_CATS.map((c) => V.opt(c, c, d.cat)).join('') + '</select></div><div class="field"><label>Ödeme şekli</label><select class="select" name="method">' + ['havale', 'kart', 'nakit'].map((m) => V.opt(m, METHOD[m], d.method)).join('') + '</select><span class="hint">Nakit giderler gün sonunda kasadan düşülür.</span></div></div>' +
      '<div class="field"><label>Açıklama</label><input class="input" name="desc" value="' + V.esc(d.desc) + '"></div><label class="chk"><input type="checkbox" name="monthly"> Her ay tekrarlanır</label>' +
      '<div class="upload" data-act="fakeUpload"><i data-lucide="camera"></i><br>' + (d.uploaded ? '✓ Fatura eklendi' : 'Faturanın fotoğrafı veya PDF\'i') + '</div>',
    foot: '<button class="btn" data-act="closeDrawer">Vazgeç</button><button class="btn primary" data-act="saveExpense">Kaydet</button>' });
  V.act.saveExpense = () => {
    V.syncDrawer(); const d = V.UI.drawer.data; if (!(V.num(d.amount) > 0)) { V.toast('Tutarı girin'); return; }
    S().expenses.push({ id: 'G-' + V.id('exp', ''), date: d.date, cat: d.cat, desc: d.desc || d.cat, amount: V.num(d.amount), method: d.method, monthly: !!d.monthly });
    V.closeDrawer(); V.commit('Gider kaydedildi');
  };

  // ---------- Day close ----------
  V.cashToday = () => {
    const c = S().cash;
    const sales = S().sales.filter((s) => s.date === V.TODAY).reduce((a, s) => a + (s.payments || []).filter((p) => p.method === 'nakit').reduce((x, p) => x + p.amount, 0), 0);
    const refunds = S().sales.reduce((a, s) => a + (s.refunds || []).filter((r) => r.date === V.TODAY && r.method === 'nakit').reduce((x, r) => x + r.amount, 0), 0);
    const cols = S().collections.filter((x) => x.date === V.TODAY && x.method === 'nakit').reduce((a, x) => a + x.amount, 0);
    const out = S().expenses.filter((e) => e.date === V.TODAY && e.method === 'nakit' && !e.planned).reduce((a, e) => a + e.amount, 0);
    const card = S().sales.filter((s) => s.date === V.TODAY).reduce((a, s) => a + (s.payments || []).filter((p) => p.method === 'kart').reduce((x, p) => x + p.amount, 0), 0) + S().collections.filter((x) => x.date === V.TODAY && x.method === 'kart').reduce((a, x) => a + x.amount, 0);
    const transfer = S().sales.filter((s) => s.date === V.TODAY).reduce((a, s) => a + (s.payments || []).filter((p) => p.method === 'havale').reduce((x, p) => x + p.amount, 0), 0) + S().collections.filter((x) => x.date === V.TODAY && x.method === 'havale').reduce((a, x) => a + x.amount, 0);
    return { opening: c.opening, sales, cols, out, refunds, expected: c.opening + sales + cols - out - refunds, card, transfer };
  };
  function dayClose() {
    const k = V.cashToday(), c = S().cash, missing = S().sales.filter((s) => !s.receipt && !(s.refunds || []).length).length;
    const counted = V.UI.counted != null ? V.UI.counted : '';
    const diff = counted === '' ? null : V.num(counted) - k.expected;
    const hist = c.history.map((h) => '<tr><td>' + V.ds(h.date) + '</td><td class="num">' + V.money(h.expected) + '</td><td class="num">' + V.money(h.counted) + '</td><td class="num' + (h.counted - h.expected ? ' down' : '') + '">' + V.money(h.counted - h.expected) + '</td></tr>').join('');
    const left = c.closed
      ? '<div class="card"><div class="card-body stack"><div class="alert success"><i data-lucide="lock"></i><div><b>Gün kapatıldı</b> · ' + c.closed.time + ' · ' + V.esc(V.staff(c.closed.by).name) + '</div></div><dl class="desc"><dt>Beklenen</dt><dd>' + V.money(c.closed.expected) + '</dd><dt>Sayılan</dt><dd>' + V.money(c.closed.counted) + '</dd><dt>Fark</dt><dd>' + V.money(c.closed.counted - c.closed.expected) + (c.closed.note ? ' · ' + V.esc(c.closed.note) : '') + '</dd></dl><button class="btn" data-act="reopenDay" style="align-self:flex-start">Günü yeniden aç</button></div></div>'
      : '<div class="card"><div class="card-head"><h3><i data-lucide="lock"></i>Nakdi say ve günü kapat</h3><button class="btn sm" data-act="newCashOut"><i data-lucide="arrow-left-right"></i>Kasadan çıkış</button></div><div class="card-body stack">' +
        (missing ? '<div class="alert warning small"><i data-lucide="receipt"></i><div>' + missing + ' satışın fişi eksik. Yine de kapatabilirsiniz; Satışlar sekmesinde listede kalırlar.</div></div>' : '') +
        '<dl class="desc"><dt>Açılış nakdi</dt><dd>' + V.money(k.opening) + '</dd><dt>Nakit satışlar</dt><dd>+ ' + V.money(k.sales) + '</dd><dt>Nakit tahsilatlar</dt><dd>+ ' + V.money(k.cols) + '</dd><dt>Kasadan çıkış</dt><dd>− ' + V.money(k.out) + '</dd>' + (k.refunds ? '<dt>Nakit iade</dt><dd>− ' + V.money(k.refunds) + '</dd>' : '') +
        '<dt><b>Beklenen nakit</b></dt><dd><b>' + V.money(k.expected) + '</b></dd><dt>Kart toplamı</dt><dd>' + V.money(k.card) + ' · POS gün sonu fişiyle karşılaştırın</dd><dt>Havale/EFT</dt><dd>' + V.money(k.transfer) + '</dd></dl>' +
        '<div class="form-grid"><div class="field"><label>Sayılan nakit <span class="req">*</span></label><input class="input" data-change="setCounted" value="' + V.esc(counted) + '" placeholder="' + V.money(k.expected) + '"></div><div class="field"><label>Fark</label><input class="input" disabled value="' + (diff == null ? '' : V.money(diff)) + '" style="' + (diff ? 'color:#b91c1c' : '') + '"></div></div>' +
        (diff ? '<div class="field"><label>Açıklama (fark var)</label><input class="input" name="closeNote" id="closeNote" placeholder="ör. para üstü yanlış verildi"></div>' : '') +
        '<button class="btn primary lg" style="align-self:flex-start" data-act="closeDay"' + (counted === '' ? ' disabled style="opacity:.5;pointer-events:none;align-self:flex-start"' : '') + '><i data-lucide="lock"></i>Günü kapat</button></div></div>';
    return '<div class="grid g-main">' + left + '<div class="card"><div class="card-head"><h3>Önceki günler</h3></div><div class="card-body flush"><table class="table"><thead><tr><th>Tarih</th><th class="num">Beklenen</th><th class="num">Sayılan</th><th class="num">Fark</th></tr></thead><tbody>' + hist + '</tbody></table></div></div></div>';
  }
  V.act.setCounted = (el) => { V.UI.counted = el.value; V.render(); };
  V.act.closeDay = () => {
    const k = V.cashToday(), note = (document.getElementById('closeNote') || {}).value || '';
    S().cash.closed = { time: V.NOW, by: V.user().id, expected: k.expected, counted: V.num(V.UI.counted), note };
    S().tasks.t6 = true; V.UI.counted = null; V.commit('Gün kapatıldı · özet işletme sahibine gönderildi');
  };
  V.act.reopenDay = () => { S().cash.closed = null; V.commit('Gün yeniden açıldı'); };
  V.act.newCashOut = () => V.openDrawer('expense', { date: V.TODAY, cat: 'Diğer', desc: '', amount: '', method: 'nakit' });
})();
