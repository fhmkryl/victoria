/* Victoria demo — seed data. One coherent story: Wednesday 12 November 2026, 12:45.
   V.seed() returns a fresh copy so "Demoyu sıfırla" starts over. */
window.V = window.V || {};

V.TODAY = '2026-11-12';
V.NOW = '12:45';

V.CONCERNS = [
  ['tuy', 'İstenmeyen tüy'], ['leke', 'Leke / pigmentasyon'], ['akne', 'Akne / yağlı cilt'], ['kuruluk', 'Kuruluk'],
  ['kirisiklik', 'İnce çizgi / kırışıklık'], ['kizariklik', 'Kızarıklık / hassasiyet'], ['mat', 'Mat cilt'], ['gozenek', 'Gözenek'],
  ['stres', 'Rahatlama / stres'], ['selulit', 'Vücut / selülit'], ['bakim', 'Uygulama sonrası bakım']
];
V.AREAS = [['yuz', 'Yüz'], ['koltuk', 'Koltuk altı'], ['bacak', 'Bacak'], ['bikini', 'Bikini'], ['sirt', 'Sırt'], ['vucut', 'Tüm vücut']];
V.SAFETY = [
  ['hamile', 'Hamile veya emziriyor'],
  ['izotretinoin', 'Retinoid / izotretinoin / ışığa duyarlılık yapan ilaç kullanıyor'],
  ['bronz', 'Yakın zamanda bronzlaşma veya güneş yanığı'],
  ['enfeksiyon', 'Aktif cilt enfeksiyonu, egzama veya açık yara']
];
V.FLAG_TEXT = { hamile: 'hamilelik', izotretinoin: 'ışığa duyarlılık yapan ilaç', bronz: 'yakın zamanda bronzlaşma', enfeksiyon: 'aktif cilt sorunu', hassas: 'hassas cilt', lazer_kur: 'devam eden lazer kürü' };
V.STATUS = { booked: ['Rezerve', ''], confirmed: ['Onaylandı', ''], checkedin: ['Geldi', 'blue'], inprogress: ['İşlemde', 'indigo'], completed: ['Tamamlandı', 'orange'], paid: ['Ödendi', 'green'], cancelled: ['İptal', 'red'], noshow: ['Gelmedi', 'red'] };
V.EXP_CATS = ['Tedarikçi', 'Kira', 'Maaşlar', 'Faturalar', 'Pazarlama', 'Bakım', 'Diğer'];
V.CONSENTS = [['kvkk', 'KVKK aydınlatma metni'], ['health', 'Açık rıza: sağlık verileri'], ['photo', 'Fotoğraf onamı'], ['ai', 'YZ destekli öneri onamı'], ['laser', 'Lazer uygulama onamı'], ['peel', 'Kimyasal peeling onamı']];

V.seed = function () {
  return {
    v: 1,
    seq: { sale: 1188, appt: 100, cust: 20, plan: 20, col: 10, pkg: 20, exp: 10, tr: 10, mv: 10 },
    session: null,
    seenStart: false,
    decisions: { lateCancel: '24 saat', noShow: 'Pakette kalsın', creditLimit: '10000', maxInst: '6', receipt: 'Mali müşavire soracağım', commission: 'Şimdilik kapalı', physician: ['peel', 'botoks', 'konsult'], expenses: 'Evet', notes: '' },
    business: { name: 'Victoria Güzellik & Bakım', phone: '0212 000 00 00', address: 'Kadıköy / İstanbul' },

    staff: [
      { id: 'fk', name: 'Fehmi K.', initials: 'FK', title: 'İşletme sahibi', kind: 'owner' },
      { id: 'za', name: 'Zeynep Arslan', initials: 'ZA', title: 'Resepsiyon', kind: 'reception' },
      { id: 'ad', name: 'Ayşe Demir', initials: 'AD', title: 'Lazer uzmanı', kind: 'specialist', hours: [9, 18], color: 'c1' },
      { id: 'mk', name: 'Merve Kaya', initials: 'MK', title: 'Estetisyen', kind: 'specialist', hours: [9, 18], color: 'c2' },
      { id: 'sa', name: 'Dr. Selin Aydın', initials: 'SA', title: 'Hekim', kind: 'specialist', hours: [11, 17], color: 'c3' },
      { id: 'es', name: 'Elif Şahin', initials: 'EŞ', title: 'Terapist', kind: 'specialist', hours: [10, 19], color: 'c4' }
    ],
    devices: [
      { id: 'd808', name: 'Diode 808', type: 'Diyot', wave: '808 nm', fluence: '5–60 J/cm²', spot: '12, 9 mm', hp: 'HP-2', shots: 1820450, life: 2000000 },
      { id: 'ax755', name: 'Alexandrite 755', type: 'Aleksandrit', wave: '755 nm', fluence: '4–40 J/cm²', spot: '10–18 mm', hp: 'A-1', shots: 412000, life: 1500000 }
    ],
    services: [
      { id: 'lazer', name: 'Lazer epilasyon', cat: 'Lazer', staff: ['ad', 'sa'], device: true, consent: 'laser', concerns: ['tuy'], contra: ['hamile', 'izotretinoin', 'bronz', 'enfeksiyon'],
        areas: [{ id: 'yuz', name: 'Yüz', dur: 20, price: 1200, shots: 220 }, { id: 'koltuk', name: 'Koltuk altı', dur: 15, price: 800, shots: 600 }, { id: 'bacak', name: 'Tüm bacak', dur: 60, price: 3000, shots: 3500 },
          { id: 'bikini', name: 'Bikini', dur: 20, price: 1000, shots: 700 }, { id: 'sirt', name: 'Sırt', dur: 45, price: 2500, shots: 2900 }, { id: 'vucut', name: 'Tüm vücut', dur: 90, price: 4500, shots: 7000 }],
        why: 'Kalıcı tüy azaltma; 6–8 seans, 4–6 hafta arayla.', say: 'Diyot lazerle tüyler seanslar ilerledikçe belirgin şekilde azalır; seans başına birkaç dakika sürer.' },
      { id: 'hydra', name: 'HydraFacial', cat: 'Cilt bakımı', staff: ['mk'], dur: 60, price: 1800, room: 'Oda 2', concerns: ['kuruluk', 'mat', 'gozenek'], contra: ['enfeksiyon'],
        why: 'Derin temizlik ve nem; anında parlaklık.', say: 'Gözenekleri temizleyip cilde nem veren, hemen sonuç gördüğünüz bir bakım.' },
      { id: 'aydinlatici', name: 'Aydınlatıcı cilt bakımı (C vitamini)', cat: 'Cilt bakımı', staff: ['mk'], dur: 50, price: 1400, room: 'Oda 2', concerns: ['leke', 'mat'], contra: ['enfeksiyon'],
        why: 'Leke ve mat görünüm için; lazer seansından 2 hafta sonra yapılabilir.', say: 'C vitaminiyle cilt tonunu eşitleyen, rahatlatıcı bir bakım.' },
      { id: 'akne', name: 'Akne bakımı', cat: 'Cilt bakımı', staff: ['mk'], dur: 60, price: 1500, room: 'Oda 2', concerns: ['akne', 'gozenek'], contra: [],
        why: 'Akne ve tıkalı gözenekler için temizlik ve yatıştırma.', say: 'Sivilce ve siyah noktalar için cildi derinlemesine temizleyip yatıştıran bir bakım.' },
      { id: 'peel', name: 'Kimyasal peeling', cat: 'Medikal estetik', staff: ['sa'], physician: true, dur: 45, price: 2200, room: 'Oda 1', consent: 'peel', concerns: ['leke', 'akne'], contra: ['hamile', 'izotretinoin', 'bronz', 'enfeksiyon', 'lazer_kur'],
        why: 'Leke ve akne izleri için hekim uygulaması.', say: 'Hekimimizin uyguladığı, lekeleri ve izleri azaltan bir yenileme.' },
      { id: 'botoks', name: 'Botoks', cat: 'Medikal estetik', staff: ['sa'], physician: true, dur: 30, price: 6500, room: 'Oda 1', concerns: ['kirisiklik'], contra: ['hamile'],
        why: 'Mimik çizgileri için hekim uygulaması.', say: 'Hekimimiz önce görüşüp size uygun olup olmadığını değerlendirir.' },
      { id: 'konsult', name: 'Hekim konsültasyonu', cat: 'Medikal estetik', staff: ['sa'], physician: true, dur: 20, price: 0, room: 'Oda 1', concerns: ['kirisiklik', 'leke'], contra: [],
        why: 'Medikal uygulamalar öncesi ücretsiz değerlendirme.', say: 'Hekimimizle 20 dakikalık ücretsiz bir değerlendirme yapabiliriz.' },
      { id: 'masaj', name: 'Rahatlatıcı masaj', cat: 'Spa', staff: ['es'], dur: 60, price: 1300, room: 'Spa odası', concerns: ['stres'], contra: [],
        why: 'Stres ve kas gerginliği için.', say: 'Bir saatlik, gevşetici bir masaj.' },
      { id: 'sargi', name: 'Vücut sargısı', cat: 'Spa', staff: ['es'], dur: 60, price: 1600, room: 'Spa odası', concerns: ['selulit', 'kuruluk'], contra: ['hamile'],
        why: 'Selülit görünümü ve cilt sıkılığı için.', say: 'Cildi sıkılaştırıp nemlendiren bir vücut bakımı.' },
      { id: 'kas', name: 'Kaş şekillendirme', cat: 'Kaş ve kirpik', staff: ['mk'], dur: 20, price: 400, room: 'Oda 2', concerns: [], contra: [] }
    ],
    products: [
      { id: 'spf', name: 'SPF 50 Güneş Kremi 50 ml', retail: true, price: 1150, cost: 520, stock: 12, min: 5, lot: 'SP-7720', exp: '2027-09', weeks: 8, concerns: ['leke', 'bakim', 'kizariklik'], contra: [], ingredients: ['çinko oksit'],
        why: 'Lazer sürecinde ve leke tedavisinde şart; yeni lekelerin oluşmasını engeller.', use: 'Her sabah son adım; dışarıda 2 saatte bir yenileyin.', say: 'Her gün SPF 50, özellikle lazer sürecinde yeni lekelerin oluşmasını engeller.' },
      { id: 'aloe', name: 'Yatıştırıcı Aloe Jel 200 ml', retail: true, price: 890, cost: 380, stock: 9, min: 4, lot: 'AG-310', exp: '2027-02', weeks: 10, concerns: ['kizariklik', 'bakim', 'kuruluk'], contra: [], ingredients: ['aloe vera'],
        why: 'Lazer ve peeling sonrası kızarıklığı yatıştırır, cildi serinletir.', use: 'Uygulamadan sonraki 3 gün, günde 2 kez.', say: 'Uygulamadan sonra cildinizi serinletir ve kızarıklığı hızla azaltır.' },
      { id: 'niasinamid', name: '%10 Niasinamid Serum 30 ml', retail: true, price: 980, cost: 410, stock: 7, min: 3, lot: 'NS-118', exp: '2028-04', weeks: 8, concerns: ['leke', 'akne', 'gozenek', 'kizariklik'], contra: [], ingredients: ['niasinamid'],
        why: 'Lekeleri nazikçe açar, ışığa duyarlılık yapmaz; lazer seansları arasında kullanılabilir.', use: 'Sabah ve akşam temiz cilde.', caution: 'Lazer günü ve sonraki 2 gün ara verin.', say: 'Bu serum cilt tonunu nazikçe eşitler ve lazerle etkileşime girmez.' },
      { id: 'hyaluronik', name: 'Hyaluronik Serum 30 ml', retail: true, price: 1250, cost: 540, stock: 14, min: 4, lot: 'HS-120', exp: '2027-11', weeks: 8, concerns: ['kuruluk', 'kirisiklik', 'mat'], contra: [], ingredients: ['hyaluronik asit'],
        why: 'Yoğun nem; ince çizgileri dolgun gösterir.', use: 'Sabah ve akşam, nemlendiriciden önce.', say: 'Cildin nemini artırır, ince çizgileri daha az belirgin gösterir.' },
      { id: 'temizleyici', name: 'Nazik Temizleyici 150 ml', retail: true, price: 640, cost: 260, stock: 20, min: 5, lot: 'NT-044', exp: '2028-01', weeks: 10, concerns: ['akne', 'kizariklik', 'gozenek', 'kuruluk'], contra: [], ingredients: ['seramid'],
        why: 'Cildi kurutmadan temizler; hassas ciltlere uygun.', use: 'Sabah ve akşam.', say: 'Cildinizi kurutmadan temizler, her rutinin ilk adımı.' },
      { id: 'cvit', name: 'C Vitamini Serum 50 ml', retail: true, price: 1490, cost: 640, stock: 0, min: 3, lot: 'VC-2291', exp: '2026-12', weeks: 8, concerns: ['leke', 'mat'], contra: [], ingredients: ['askorbik asit'],
        why: 'Aydınlatıcı antioksidan.', use: 'Sabah.', say: 'Cilde parlaklık veren bir antioksidan.' },
      { id: 'retinol', name: 'Retinol Gece Kremi 50 ml', retail: true, price: 1350, cost: 590, stock: 5, min: 3, lot: 'RG-501', exp: '2027-11', weeks: 10, concerns: ['kirisiklik', 'akne', 'leke'], contra: ['hamile', 'hassas', 'lazer_kur', 'izotretinoin'], ingredients: ['retinol'],
        why: 'Hücre yenilenmesi; ince çizgi ve izler için.', use: 'Akşam, haftada 3 gece başlayarak.', say: 'Gece kullanılan, cildi yenileyen bir krem.' },
      { id: 'losyon', name: 'Onarıcı Vücut Losyonu 250 ml', retail: true, price: 720, cost: 300, stock: 6, min: 3, lot: 'VL-090', exp: '2027-08', weeks: 8, concerns: ['kuruluk', 'selulit'], contra: [], ingredients: ['shea yağı'],
        why: 'Kuru vücut cildi için yoğun bakım.', use: 'Duş sonrası.', say: 'Vücut cildini yumuşatıp nemlendirir.' },
      { id: 'goz', name: 'Göz Çevresi Kremi 15 ml', retail: true, price: 1080, cost: 470, stock: 4, min: 2, lot: 'GC-033', exp: '2027-10', weeks: 10, concerns: ['kirisiklik'], contra: [], ingredients: ['peptit'],
        why: 'Göz çevresi çizgileri ve morluklar için.', use: 'Sabah ve akşam, hafifçe tampone ederek.', say: 'Göz çevresindeki ince çizgileri ve yorgun görünümü azaltır.' },
      { id: 'uyusturucu', name: 'Uyuşturucu Krem 30 g', retail: true, price: 650, cost: 280, stock: 8, min: 2, lot: 'UK-210', exp: '2027-05', weeks: 12, concerns: ['tuy'], contra: [], ingredients: ['lidokain'],
        why: 'Lazer öncesi hassas bölgelerde konfor sağlar.', use: 'Uygulamadan 30 dk önce ince tabaka.', say: 'Lazerden önce sürüldüğünde işlemi daha konforlu hale getirir.' },
      { id: 'jel', name: 'Lazer soğutma jeli (ml)', retail: false, price: 0, cost: 0.28, stock: 1800, min: 3000, lot: 'CG-551', exp: '2027-06', concerns: [], contra: [], ingredients: [] },
      { id: 'eldiven', name: 'Nitril eldiven (çift)', retail: false, price: 0, cost: 3, stock: 140, min: 100, concerns: [], contra: [], ingredients: [] }
    ],
    templates: [
      { id: 't_yuz6', name: 'Lazer Yüz 6 seans', service: 'lazer', area: 'yuz', sessions: 6, price: 7200, months: 12 },
      { id: 't_koltuk6', name: 'Lazer Koltuk altı 6 seans', service: 'lazer', area: 'koltuk', sessions: 6, price: 4800, months: 12 },
      { id: 't_bacak8', name: 'Lazer Tüm bacak 8 seans', service: 'lazer', area: 'bacak', sessions: 8, price: 24000, months: 18 },
      { id: 't_vucut8', name: 'Lazer Tüm vücut 8 seans', service: 'lazer', area: 'vucut', sessions: 8, price: 32000, months: 18 },
      { id: 't_peel4', name: 'Kimyasal peeling 4 seans', service: 'peel', sessions: 4, price: 7600, months: 6 },
      { id: 't_hydra3', name: 'HydraFacial 3 seans', service: 'hydra', sessions: 3, price: 4800, months: 6 }
    ],
    customers: [
      { id: 'c1', name: 'Burcu Koç', phone: '0532 *** 41 18', since: '2025-03-05', tags: ['Hassas cilt'], skin: 'Karma, hassas', fitz: 'III', allergies: ['lidokain'], flags: ['hassas', 'lazer_kur'],
        note: 'İzotretinoin 08/2026\'da bırakıldı.', consents: { kvkk: '2027-03-05', health: '2027-03-05', photo: '2027-03-05', ai: '2027-08-20', laser: '2026-07-05' }, sms: true, staffPref: 'ad' },
      { id: 'c2', name: 'Deniz Yılmaz', phone: '0505 *** 22 70', since: '2024-11-02', tags: ['VIP'], skin: 'Normal', fitz: 'II', allergies: [], flags: ['lazer_kur'], consents: { kvkk: '2027-01-01', health: '2027-01-01', photo: '2027-01-01', ai: '2027-01-01', laser: '2027-07-15' }, sms: true, staffPref: 'ad' },
      { id: 'c3', name: 'Ece Çelik', phone: '0544 *** 09 31', since: '2025-06-10', tags: ['Doğum günü bugün'], skin: 'Kuru', fitz: 'II', allergies: [], flags: [], consents: { kvkk: '2027-06-10', health: '2027-06-10' }, sms: true, staffPref: 'mk' },
      { id: 'c4', name: 'Gizem Öztürk', phone: '0535 *** 77 02', since: '2025-09-01', tags: [], skin: 'Karma', fitz: 'III', allergies: [], flags: [], consents: { kvkk: '2027-09-01', health: '2027-09-01', peel: '2027-09-01' }, sms: true, staffPref: 'sa' },
      { id: 'c5', name: 'Nazlı Aksoy', phone: '0533 *** 12 90', since: '2026-09-20', tags: [], skin: 'Normal', fitz: 'III', allergies: [], flags: ['lazer_kur'], consents: { kvkk: '2027-09-20', health: '2027-09-20', laser: '2027-09-20' }, sms: true, staffPref: 'ad' },
      { id: 'c6', name: 'Hande Polat', phone: '0541 *** 66 13', since: '2026-11-11', tags: ['Yeni'], skin: 'Yağlı', fitz: 'IV', allergies: [], flags: [], consents: { kvkk: '2027-11-11', health: '2027-11-11', laser: '2027-11-11' }, sms: true, staffPref: 'ad' },
      { id: 'c7', name: 'Cem Aktaş', phone: '0536 *** 18 07', since: '2026-08-15', tags: [], skin: 'Normal', fitz: 'III', allergies: [], flags: ['lazer_kur'], consents: { kvkk: '2027-08-15', health: '2027-08-15', laser: '2027-08-15' }, sms: true, staffPref: 'ad' },
      { id: 'c8', name: 'Aylin Sarı', phone: '0507 *** 44 21', since: '2026-05-04', tags: [], skin: 'Karma', fitz: 'III', allergies: [], flags: [], consents: { kvkk: '2027-05-04', health: '2027-05-04' }, sms: true, staffPref: 'mk' },
      { id: 'c9', name: 'Selin Er', phone: '0542 *** 30 05', since: '2025-12-12', tags: [], skin: 'Normal', fitz: 'II', allergies: [], flags: [], consents: { kvkk: '2027-12-12' }, sms: false, staffPref: 'es' },
      { id: 'c10', name: 'Ayten Kurt', phone: '0538 *** 51 64', since: '2026-11-05', tags: ['Yeni'], skin: 'Kuru', fitz: 'II', allergies: [], flags: [], consents: { kvkk: '2027-11-05', health: '2027-11-05' }, sms: true, staffPref: 'sa' },
      { id: 'c11', name: 'Melis Ural', phone: '0546 *** 27 83', since: '2026-02-14', tags: [], skin: 'Normal', fitz: 'III', allergies: [], flags: [], consents: { kvkk: '2027-02-14' }, sms: true, staffPref: 'es' },
      { id: 'c12', name: 'Cansu Yıldız', phone: '0530 *** 58 44', since: '2025-04-09', tags: ['Uzun süredir gelmedi'], skin: 'Normal', fitz: 'III', allergies: [], flags: ['lazer_kur'], consents: { kvkk: '2027-04-09', health: '2027-04-09', laser: '2027-04-09' }, sms: true, staffPref: 'ad' }
    ],
    packages: [
      { id: 'k1', customer: 'c1', template: 't_yuz6', used: 3, sold: '2026-07-05', expiry: '2027-07-05' },
      { id: 'k2', customer: 'c2', template: 't_bacak8', used: 5, sold: '2026-07-15', expiry: '2028-01-15' },
      { id: 'k4', customer: 'c4', template: 't_peel4', used: 2, sold: '2026-10-08', expiry: '2027-04-08' },
      { id: 'k5', customer: 'c5', template: 't_koltuk6', used: 1, sold: '2026-10-01', expiry: '2027-10-01' },
      { id: 'k6', customer: 'c6', template: 't_vucut8', used: 0, sold: '2026-11-11', expiry: '2028-05-11' },
      { id: 'k7', customer: 'c7', template: 't_bacak8', used: 2, sold: '2026-09-01', expiry: '2028-03-01' },
      { id: 'k12', customer: 'c12', template: 't_koltuk6', used: 4, sold: '2025-12-20', expiry: '2026-12-20' }
    ],
    appts: [
      { id: 'a1', customer: 'c2', staff: 'ad', service: 'lazer', area: 'bacak', device: 'd808', date: '2026-11-12', start: '09:00', dur: 60, status: 'paid', pkg: 'k2' },
      { id: 'a2', customer: 'c3', staff: 'mk', service: 'hydra', date: '2026-11-12', start: '10:00', dur: 60, status: 'paid' },
      { id: 'a3', customer: 'c4', staff: 'sa', service: 'peel', date: '2026-11-12', start: '11:30', dur: 45, status: 'completed', pkg: 'k4' },
      { id: 'a4', customer: 'c5', staff: 'ad', service: 'lazer', area: 'koltuk', device: 'd808', date: '2026-11-12', start: '13:00', dur: 15, status: 'checkedin', pkg: 'k5' },
      { id: 'a5', customer: 'c1', staff: 'ad', service: 'lazer', area: 'yuz', device: 'd808', date: '2026-11-12', start: '14:00', dur: 20, status: 'confirmed', pkg: 'k1' },
      { id: 'a6', customer: 'c9', staff: 'es', service: 'masaj', date: '2026-11-12', start: '15:00', dur: 60, status: 'booked' },
      { id: 'a7', customer: 'c6', staff: 'ad', service: 'lazer', area: 'vucut', device: 'd808', date: '2026-11-12', start: '16:00', dur: 90, status: 'booked', pkg: 'k6' },
      { id: 'a8', customer: 'c10', staff: 'sa', service: 'konsult', date: '2026-11-12', start: '16:30', dur: 20, status: 'booked' },
      { id: 'a9', customer: 'c11', staff: 'es', service: 'sargi', date: '2026-11-12', start: '17:00', dur: 60, status: 'booked' },
      { id: 'a10', customer: 'c2', staff: 'ad', service: 'lazer', area: 'bacak', device: 'd808', date: '2026-12-24', start: '10:00', dur: 60, status: 'booked', pkg: 'k2' },
      { id: 'a11', customer: 'c1', staff: 'ad', service: 'lazer', area: 'yuz', device: 'd808', date: '2026-12-24', start: '14:00', dur: 20, status: 'booked', pkg: 'k1' },
      { id: 'a12', customer: 'c7', staff: 'ad', service: 'lazer', area: 'bacak', device: 'd808', date: '2026-11-13', start: '11:00', dur: 60, status: 'booked', pkg: 'k7' }
    ],
    treatments: [
      { id: 'tr1', appt: null, customer: 'c1', staff: 'ad', service: 'lazer', area: 'yuz', date: '2026-07-05', device: 'd808', fluence: 14, pulse: 30, spot: 12, shots: 220, reaction: 'Yok', note: '' },
      { id: 'tr2', appt: null, customer: 'c1', staff: 'ad', service: 'lazer', area: 'yuz', date: '2026-08-20', device: 'd808', fluence: 15, pulse: 30, spot: 12, shots: 205, reaction: 'Yok', note: '' },
      { id: 'tr3', appt: null, customer: 'c1', staff: 'ad', service: 'lazer', area: 'yuz', date: '2026-10-01', device: 'd808', fluence: 16, pulse: 30, spot: 12, shots: 210, reaction: 'Hafif kızarıklık', note: 'Kıl yoğunluğu belirgin azaldı.' },
      { id: 'tr4', appt: null, customer: 'c5', staff: 'ad', service: 'lazer', area: 'koltuk', date: '2026-10-01', device: 'd808', fluence: 18, pulse: 30, spot: 12, shots: 620, reaction: 'Yok', note: '' },
      { id: 'tr6', appt: 'a3', customer: 'c4', staff: 'sa', service: 'peel', date: '2026-11-12', reaction: 'Hafif kızarıklık', note: 'TCA %15, 2 kat.' },
      { id: 'tr5', appt: 'a1', customer: 'c2', staff: 'ad', service: 'lazer', area: 'bacak', date: '2026-11-12', device: 'd808', fluence: 22, pulse: 30, spot: 12, shots: 3620, reaction: 'Yok', note: '' }
    ],
    sales: [
      { id: 'S-2026-1183', date: '2026-11-11', time: '15:10', customer: 'c11', staff: 'za', lines: [{ type: 'service', ref: 'sargi', name: 'Vücut sargısı', qty: 1, price: 1600, staff: 'es' }], discount: 0, payments: [{ method: 'nakit', amount: 1600 }], receipt: null },
      { id: 'S-2026-1185', date: '2026-11-11', time: '18:20', customer: null, staff: 'za', lines: [{ type: 'product', ref: 'temizleyici', name: 'Nazik Temizleyici 150 ml', qty: 2, price: 640, staff: 'za' }], discount: 0, payments: [{ method: 'kart', amount: 1280 }], receipt: null },
      { id: 'S-2026-1186', date: '2026-11-12', time: '09:55', customer: 'c2', staff: 'za', appt: 'a1', lines: [{ type: 'session', ref: 'lazer', name: 'Lazer epilasyon · Tüm bacak (paket 5/8)', qty: 1, price: 0, staff: 'ad' }], discount: 0, payments: [], receipt: { type: '-', no: 'Gerekmez' } },
      { id: 'S-2026-1187', date: '2026-11-12', time: '11:05', customer: 'c3', staff: 'za', appt: 'a2', lines: [{ type: 'service', ref: 'hydra', name: 'HydraFacial', qty: 1, price: 1800, staff: 'mk' }, { type: 'product', ref: 'hyaluronik', name: 'Hyaluronik Serum 30 ml', qty: 1, price: 1250, staff: 'mk', ai: true }], discount: 0, payments: [{ method: 'kart', amount: 3050 }], receipt: { type: 'ÖKC', no: 'Z-0012/0455' } }
    ],
    plans: [
      { id: 'P-031', customer: 'c1', sale: 'S-2026-0861', label: 'Ev bakım seti (Niasinamid, SPF 50, Temizleyici)', total: 2770, down: 770, inst: [{ due: '2026-10-15', amount: 500, paid: 500, paidOn: '2026-10-15' }, { due: '2026-11-15', amount: 500, paid: 0 }, { due: '2026-12-15', amount: 500, paid: 0 }, { due: '2027-01-15', amount: 500, paid: 0 }] },
      { id: 'P-018', customer: 'c2', sale: 'S-2026-0602', label: 'Paket · Lazer Tüm bacak 8 seans', total: 24000, down: 6000, inst: [{ due: '2026-09-15', amount: 6000, paid: 6000, paidOn: '2026-09-15' }, { due: '2026-10-15', amount: 6000, paid: 6000, paidOn: '2026-10-14' }, { due: '2026-11-15', amount: 6000, paid: 0 }] },
      { id: 'P-036', customer: 'c4', sale: 'S-2026-0990', label: 'Paket · Kimyasal peeling 4 seans', total: 7600, down: 4800, inst: [{ due: '2026-11-19', amount: 2800, paid: 0 }] },
      { id: 'P-044', customer: 'c6', sale: 'S-2026-1184', label: 'Paket · Lazer Tüm vücut 8 seans', total: 32000, down: 8000, inst: [{ due: '2026-11-18', amount: 8000, paid: 0 }, { due: '2026-12-18', amount: 8000, paid: 0 }, { due: '2027-01-18', amount: 8000, paid: 0 }] },
      { id: 'P-027', customer: 'c7', sale: 'S-2026-0741', label: 'Paket · Lazer Tüm bacak 8 seans', total: 24000, down: 12000, inst: [{ due: '2026-10-01', amount: 3000, paid: 3000, paidOn: '2026-10-02' }, { due: '2026-11-01', amount: 3000, paid: 0 }, { due: '2026-12-01', amount: 3000, paid: 0 }, { due: '2027-01-01', amount: 3000, paid: 0 }] },
      { id: 'P-039', customer: 'c8', sale: 'S-2026-1022', label: 'Ürünler (ev bakım seti)', total: 6000, down: 0, inst: [{ due: '2026-11-05', amount: 3000, paid: 0 }, { due: '2026-12-05', amount: 3000, paid: 0 }] }
    ],
    collections: [
      { id: 'T-008', date: '2026-10-15', customer: 'c1', plan: 'P-031', amount: 500, method: 'nakit', by: 'za' },
      { id: 'T-009', date: '2026-10-14', customer: 'c2', plan: 'P-018', amount: 6000, method: 'kart', by: 'za' }
    ],
    expenses: [
      { id: 'G-1', date: '2026-11-01', cat: 'Kira', desc: 'Kasım kirası', amount: 35000, method: 'havale', monthly: true },
      { id: 'G-2', date: '2026-11-03', cat: 'Tedarikçi', desc: 'Derma Dağıtım · fatura 2026-4471', amount: 18400, method: 'havale' },
      { id: 'G-3', date: '2026-11-05', cat: 'Faturalar', desc: 'Ekim elektrik', amount: 4900, method: 'havale' },
      { id: 'G-4', date: '2026-11-10', cat: 'Pazarlama', desc: 'Instagram reklamları', amount: 2550, method: 'kart' },
      { id: 'G-5', date: '2026-11-12', cat: 'Diğer', desc: 'Kahve ve sarf', amount: 350, method: 'nakit' },
      { id: 'G-6', date: '2026-11-30', cat: 'Maaşlar', desc: 'Aylık maaşlar (planlı)', amount: 140000, method: 'havale', monthly: true, planned: true }
    ],
    moves: [
      { date: '2026-11-12', time: '09:45', product: 'jel', qty: -180, type: 'Uygulama', ref: 'Deniz Yılmaz · Tüm bacak', by: 'ad' },
      { date: '2026-11-12', time: '11:05', product: 'hyaluronik', qty: -1, type: 'Satış', ref: 'S-2026-1187', by: 'mk' },
      { date: '2026-10-28', time: '10:20', product: 'spf', qty: 12, type: 'Mal kabul', ref: 'Derma Dağıtım', by: 'za' }
    ],
    cash: { opening: 1000, openedBy: 'za', openedAt: '08:45', closed: null,
      history: [{ date: '2026-11-11', expected: 6420, counted: 6400 }, { date: '2026-11-10', expected: 3980, counted: 3980 }] },
    // Month-to-date figures before today (01–11.11) so reports have realistic totals.
    baseline: { revenue: 161600, services: 128400, products: 33200, collected: 21500, aiShown: 82, aiAccepted: 36,
      staff: { ad: [88, 58400, 18], mk: [50, 46300, 33], sa: [19, 39900, 3], es: [28, 17000, 8] },
      best: [['Lazer epilasyon', 84200], ['Botoks', 39000], ['HydraFacial', 23400], ['SPF 50 Güneş Kremi', 14950], ['Yatıştırıcı Aloe Jel', 8900]] },
    cart: null,
    recos: [],
    tasks: {}
  };
};
