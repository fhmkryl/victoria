/* Victoria demo — catalog & stock, team, settings. Read-mostly; enough to verify the setup. */
(function () {
  const S = () => V.S;

  V.screens.katalog = (r) => {
    if (r.q.tab) V.UI.tab_katalog = r.q.tab;
    const tab = V.UI.tab_katalog || 'hizmet';
    let body = '';
    if (tab === 'hizmet') {
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Hizmet</th><th>Kategori</th><th>Süre</th><th class="num">Fiyat</th><th>Kim yapabilir</th><th>Gereklilik</th><th>Hedeflediği sorunlar</th></tr></thead><tbody>' +
        S().services.map((s) => '<tr><td><b>' + V.esc(s.name) + '</b>' + (s.areas ? '<div class="small muted">' + s.areas.length + ' bölge</div>' : '') + '</td><td>' + s.cat + '</td><td>' + (s.areas ? s.areas[0].dur + '–' + s.areas[s.areas.length - 1].dur : s.dur) + ' dk</td><td class="num">' + (s.areas ? V.money(Math.min(...s.areas.map((a) => a.price))) + '–' + V.money(Math.max(...s.areas.map((a) => a.price))) : V.money(s.price)) + '</td>' +
          '<td class="small">' + s.staff.map((id) => V.staff(id).name).join(', ') + '</td><td>' + (s.physician ? V.tag('Hekim', 'red') + ' ' : '') + (s.device ? V.tag('Sertifikalı uzman', 'indigo') + ' ' : '') + (s.consent ? V.tag('Onam') : '') + '</td><td class="small">' + (s.concerns || []).map((k) => (V.CONCERNS.find((x) => x[0] === k) || [k, k])[1]).join(', ') + '</td></tr>').join('') + '</tbody></table></div></div>';
    } else if (tab === 'urun') {
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Ürün</th><th>Tür</th><th class="num">Stok</th><th class="num">Min.</th><th>Lot · SKT</th><th class="num">Fiyat</th><th>Durum</th></tr></thead><tbody>' +
        S().products.map((p) => '<tr><td><b>' + V.esc(p.name) + '</b>' + (p.retail ? '<div class="small muted">' + V.esc(p.why) + '</div>' : '') + '</td><td>' + (p.retail ? V.tag('Perakende', 'blue') : V.tag('Sarf malzemesi')) + '</td><td class="num">' + p.stock + '</td><td class="num">' + p.min + '</td><td>' + (p.lot ? p.lot + ' · ' + V.ds(p.exp) : '-') + '</td><td class="num">' + (p.retail ? V.money(p.price) : '-') + '</td><td>' +
          (p.stock <= 0 ? V.tag('Stokta yok', 'red') : p.stock < p.min ? V.tag('Kritik', 'orange') : V.tag('Normal', 'green')) + '</td></tr>').join('') + '</tbody></table></div></div>';
    } else if (tab === 'paket') {
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Paket</th><th class="num">Seans</th><th>Geçerlilik</th><th class="num">Fiyat</th><th class="num">Seans başı</th><th class="num">Satılan</th></tr></thead><tbody>' +
        S().templates.map((t) => '<tr><td><b>' + V.esc(t.name) + '</b></td><td class="num">' + t.sessions + '</td><td>' + t.months + ' ay</td><td class="num">' + V.money(t.price) + '</td><td class="num">' + V.money(t.price / t.sessions) + '</td><td class="num">' + S().packages.filter((p) => p.template === t.id).length + '</td></tr>').join('') + '</tbody></table></div></div>';
    } else {
      body = '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Tarih</th><th>Ürün</th><th>Tür</th><th>Kaynak</th><th>Personel</th><th class="num">Miktar</th></tr></thead><tbody>' +
        S().moves.map((m) => '<tr><td>' + V.ds(m.date) + ' ' + (m.time || '') + '</td><td>' + V.esc(V.prod(m.product).name) + '</td><td>' + V.tag(m.type, m.type === 'Satış' ? 'blue' : m.type === 'Uygulama' ? 'indigo' : m.type === 'Mal kabul' || m.type === 'İade' ? 'green' : '') + '</td><td>' + V.esc(m.ref) + '</td><td>' + V.esc(V.staff(m.by).name) + '</td><td class="num ' + (m.qty < 0 ? 'down' : 'up') + '">' + (m.qty > 0 ? '+' : '') + m.qty + '</td></tr>').join('') + '</tbody></table></div></div>';
    }
    return V.header('Katalog ve stok', 'Hizmetler, ürünler, paketler ve stok hareketleri') +
      V.tabs('katalog', [['hizmet', 'Hizmetler', 'sparkles'], ['urun', 'Ürünler', 'package'], ['paket', 'Paketler', 'gift'], ['stok', 'Stok hareketleri', 'boxes']], tab) + body;
  };

  V.screens.ekip = () => {
    const rows = S().staff.filter((s) => s.kind !== 'owner').map((s) => {
      const today = S().appts.filter((a) => a.staff === s.id && a.date === V.TODAY && a.status !== 'cancelled');
      const base = S().baseline.staff[s.id] || [0, 0, 0];
      const lines = S().sales.filter((x) => x.date >= '2026-11-12').flatMap((x) => x.lines).filter((l) => l.staff === s.id);
      return '<tr><td><div class="row"><span class="avatar">' + V.esc(s.initials) + '</span><b>' + V.esc(s.name) + '</b></div></td><td>' + V.esc(s.title) + '</td><td>' + (s.hours ? s.hours[0] + ':00–' + s.hours[1] + ':00' : '09:00–19:00') + '</td><td class="num">' + today.length + '</td><td class="num">' +
        V.money(base[1] + lines.reduce((a, l) => a + V.lineTotal(l), 0)) + '</td><td class="num">' + (base[2] + lines.filter((l) => l.type === 'product').reduce((a, l) => a + l.qty, 0)) + '</td></tr>';
    }).join('');
    return V.header('Ekip', 'Kim ne yaptı, ne sattı. Prim şu an: <b>' + V.esc(S().decisions.commission) + '</b>') +
      '<div class="card"><div class="card-body flush table-wrap"><table class="table"><thead><tr><th>Personel</th><th>Görev</th><th>Çalışma saatleri</th><th class="num">Bugünkü randevu</th><th class="num">Bu ay ciro</th><th class="num">Bu ay satılan ürün</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="alert info mt"><i data-lucide="info"></i><div>Gerçek uygulamada personel ayrıntısında yaptığı her işlem, çalışma planı, izinler, yetkinlikler ve (açıksa) prim dökümü bulunur.</div></div>';
  };

  V.screens.ayarlar = () => {
    const d = S().decisions, b = S().business;
    return V.header('Ayarlar', 'Bu denemede kurallar "Nasıl test edilir?" sayfasındaki cevaplarınızdan gelir.', '<a class="btn" href="#/baslangic"><i data-lucide="flag"></i>Cevapları değiştir</a>') +
      '<div class="grid g2"><div class="card"><div class="card-head"><h3>İşletme</h3></div><div class="card-body"><dl class="desc"><dt>Ad</dt><dd>' + V.esc(b.name) + '</dd><dt>Telefon</dt><dd>' + b.phone + '</dd><dt>Adres</dt><dd>' + V.esc(b.address) + '</dd><dt>Para birimi</dt><dd>TRY · KDV %20 dahil</dd><dt>Diller</dt><dd>Türkçe, İngilizce</dd></dl></div></div>' +
      '<div class="card"><div class="card-head"><h3>Kurallar</h3></div><div class="card-body"><dl class="desc"><dt>Geç iptal</dt><dd>' + V.esc(d.lateCancel) + '</dd><dt>Gelmeyen müşteri</dt><dd>' + V.esc(d.noShow) + '</dd><dt>Borç limiti</dt><dd>' + (+d.creditLimit ? V.money(+d.creditLimit) : 'Limit yok') + '</dd><dt>En fazla taksit</dt><dd>' + d.maxInst + '</dd><dt>Resmi fiş</dt><dd>' + V.esc(d.receipt) + '</dd><dt>Prim</dt><dd>' + V.esc(d.commission) + '</dd><dt>Yalnızca hekim</dt><dd>' + d.physician.map((id) => V.svc(id).name).join(', ') + '</dd></dl></div></div>' +
      '<div class="card"><div class="card-head"><h3>Kullanıcılar</h3></div><div class="card-body flush"><table class="table"><thead><tr><th>Kişi</th><th>Rol</th><th>Giriş</th></tr></thead><tbody>' + S().staff.map((s) => '<tr><td>' + V.esc(s.name) + '</td><td>' + V.esc(s.title) + '</td><td>' + (s.kind === 'owner' ? 'Şifre + iki adımlı doğrulama, sonra PIN' : 'PIN') + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h3>Lazer cihazları</h3></div><div class="card-body flush"><table class="table"><thead><tr><th>Cihaz</th><th>Tür</th><th>Başlık ömrü</th></tr></thead><tbody>' + S().devices.map((x) => '<tr><td>' + x.name + '</td><td>' + x.type + ' · ' + x.wave + '</td><td><div class="progress' + (x.shots / x.life > 0.9 ? ' red' : '') + '" style="width:120px"><span style="width:' + Math.round(x.shots / x.life * 100) + '%"></span></div><span class="small">' + x.shots.toLocaleString('tr-TR') + ' / ' + x.life.toLocaleString('tr-TR') + ' atım</span></td></tr>').join('') + '</tbody></table></div></div></div>' +
      '<div class="card mt"><div class="card-body row between wrap"><span>Denemeyi baştan başlatmak için verileri sıfırlayın.</span><button class="btn danger" data-act="reset"><i data-lucide="rotate-ccw"></i>Demoyu sıfırla</button></div></div>';
  };
})();
