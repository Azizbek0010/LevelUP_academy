/**
 * O'zbekcha (lotin) — draft translation.
 *
 * ⚠️ NEEDS A NATIVE REVIEW before it is treated as final marketing copy. The structure and
 * the technical terms are right; tone and phrasing should be checked by a native speaker.
 * Structure must mirror ru.js key for key — a missing key renders as `undefined`.
 */
export default {
  lang: { code: 'uz', label: 'UZ', switchTo: 'Русский', switchToCode: 'ru' },

  nav: {
    features: 'Imkoniyatlar',
    roles: 'Rollar',
    finance: 'Moliya',
    pricing: 'Tariflar',
    gamification: 'Motivatsiya',
    contacts: 'Aloqa',
    home: 'Bosh sahifa',
    login: 'Kirish',
    menu: 'Menyu',
  },

  common: {
    trial: 'Birinchi hafta — bepul, karta va majburiyatsiz',
    leaderboardWeek: 'Reyting · Hafta',
    coins: '★ koinlar',
  },

  cta: {
    defaultTitle: "Markazingizda tartib o'rnatishga tayyormisiz?",
    defaultText:
      "LevelUp Academy'ni ulang va to'lovlar, o'quv jarayoni va motivatsiyani bugunoq bitta tizimga ko'chiring.",
    button: "Biz bilan bog'laning",
  },

  footer: {
    tagline: "O'quv markazi uchun CRM: moliya, o'quv jarayoni va motivatsiya bitta tizimda.",
    product: 'Mahsulot',
    navigation: 'Navigatsiya',
    contact: 'Aloqa',
    writeUs: 'Bizga yozing',
    leaveRequest: 'Ariza qoldirish',
    rights: '© 2026 LevelUp Academy. Barcha huquqlar himoyalangan.',
    madeIn: "O'zbekistonda yaratilgan 🇺🇿",
  },

  home: {
    badge: "O'quv markazi uchun CRM",
    h1: "O'quv markazi — to'liq nazorat ostida",
    lead: "To'lovlar, davomat, imtihonlar, motivatsiya va chatlar — bitta tizimda. Besh rol, onlayn hisoblagich va Telegram bildirishnomalari darhol ishlaydi.",
    ctaPrimary: 'Ariza qoldirish',
    ctaSecondary: "Imkoniyatlarni ko'rish",

    dash: {
      title: 'Administrator paneli',
      sub: 'Filial: Chilonzor',
      revenue: 'Oylik tushum',
      students: "O'quvchilar",
      debtors: 'Qarzdorlar',
      chart: 'Baholar taqsimoti',
    },

    band: {
      roles: 'rol bitta tizimda',
      modules: 'ishlaydigan modul',
      live: 'onlayn hisoblagich',
      telegram: 'Telegram bildirishnomalari',
    },

    featuresHead: "Markazni boshqarish uchun hamma narsa",
    featuresLead:
      "O'nlab jadval va chat o'rniga bitta mahsulot. Moliya, o'quv jarayoni va motivatsiya — rollar va huquqlar bilan yagona tizimda.",
    features: [
      {
        icon: 'coin',
        title: 'Moliya nazorat ostida',
        text: "Split-to'lovlar (naqd + karta), invoyslar va cheklar. Qarzlar va tushum real vaqtda yangilanadi.",
      },
      {
        icon: 'check',
        title: 'Davomat',
        text: "Mentor jurnali va ota-ona uchun tarix. O'quvchi kelmadi — Telegram'ga avtomatik xabar ketadi.",
      },
      {
        icon: 'clock',
        title: 'Taymerli imtihonlar',
        text: "Test konstruktori, server tomonidagi deadline va avtomatik yakunlash. Baho shaffof 0–100 shkalasi bo'yicha.",
      },
      {
        icon: 'star',
        title: 'Motivatsiya',
        text: "Baho va faollik uchun koinlar, mukofotlar do'koni, hafta va oy reytinglari. Koinlar tarixi — faqat qo'shiladi, o'chirilmaydi.",
      },
      {
        icon: 'chat',
        title: 'Realtime chatlar',
        text: "Markazning umumiy chati va ota-ona bilan administrator o'rtasidagi to'g'ridan-to'g'ri kanal. Onlayn holat va bir zumda yetkazish.",
      },
      {
        icon: 'grid',
        title: 'Hisobotlar va rollar',
        text: "Tushum, qarzlar, mentorlar maoshi. 5 rol uchun RBAC va birinchi kundan ko'p filiallilik.",
      },
    ],

    rolesHead: 'Besh rol — besh kabinet',
    rolesLead:
      "Kirgandan so'ng tizim tokendagi rolga qarab kerakli kabinetni o'zi ochadi. Ortiqcha ma'lumotni hech kim ko'rmaydi — ruxsatni serverdagi RBAC hal qiladi.",
    roles: [
      { tag: 'SA', title: 'SuperAdmin', text: "Butun filiallar tarmog'i va filtrsiz umumiy hisobotlar." },
      { tag: 'A', title: 'Admin', text: "O'z filialining to'lovlari, guruhlari, o'quvchilari va hisobotlari." },
      { tag: 'M', title: 'Mentor', text: "Davomat, uy vazifasini tekshirish, koinlar, imtihonlar va o'z maoshi." },
      { tag: 'P', title: 'Ota-ona', text: "Farzandining o'zlashtirishi, davomati, qarzi va to'g'ridan-to'g'ri chat." },
      { tag: 'S', title: "O'quvchi", text: "Testlar, uy vazifalari, video, koinlar do'koni va reyting." },
    ],

    motivationBadge: 'Motivatsiya',
    motivationH2: "Ko'rinadigan motivatsiya",
    motivationLead:
      "Koinlar baho, davomat va faollik uchun beriladi — va darhol mukofotga aylanadi. Bolalar zerikib o'tirmaydi, balki musobaqalashadi.",
    motivationList: [
      "O'zlashtirish va faollik uchun koinlar",
      "Mukofotlar do'koni — koinlarni sarflash",
      "Hafta va oy reytinglari, tarix — faqat qo'shiladi",
    ],

    invoice: {
      title: 'Hisob #1042',
      sub: 'Aziza Rahimova · Frontend Pro',
      paid: "To'langan",
      totalLabel: 'Hisob summasi',
      total: "1 200 000 so'm",
      splitCaption: "Split-to'lov",
      cash: 'Naqd',
      cashValue: "700 000 so'm",
      card: 'Karta',
      cardValue: "500 000 so'm",
      resultCaption: 'Yakun',
      receipt: 'Chek',
      receiptValue: "To'lovga biriktirilgan",
      debt: "O'quvchi qarzi",
      debtValue: "0 so'm",
    },
    financeH2: "Pul nazorat ostida — bir tiyingacha",
    financeLead:
      "Bitta hisob — umumiy split_batch_id bilan bir nechta tranzaksiya. Chek to'lov bilan birga saqlanadi, qarzlar esa panelda darhol ko'rinadi.",
    financeList: [
      "Bitta to'lovda naqd + karta",
      "Har bir to'lovga chek biriktiriladi",
      'Invoys va tranzaksiyalar yagona batch bilan bog\'langan',
      "Arxiv ≠ o'chirish: faqat o'qish uchun, ma'lumot yo'qolmaydi",
    ],

    faqHead: 'Ko\'p beriladigan savollar',
    faqLead: "LevelUp Academy nima va u qanday ishlashi haqida qisqacha.",
    faq: [
      {
        q: 'LevelUp Academy nima?',
        a: "LevelUp Academy — o'quv markazlarini boshqarish uchun SaaS platforma (CRM): o'quvchilar, guruhlar, davomat, testlar va uy vazifalari, moliya (to'lovlar va split-to'lovlar), motivatsiya (koinlar, do'kon, reytinglar), chatlar va Telegram bildirishnomalari — barchasi bitta tizimda.",
      },
      {
        q: 'LevelUp Academy kimlar uchun?',
        a: "O'zbekistondagi o'quv markazlari va kurslar uchun: o'quvchilar hisobi, davomat, moliya va o'quvchilar motivatsiyasini avtomatlashtirmoqchi bo'lganlar uchun.",
      },
      {
        q: 'Narxi qancha?',
        a: "Birinchi hafta — bepul, karta va majburiyatsiz. Keyin — o'quv markazi uchun tarif bo'yicha.",
      },
      {
        q: 'Tizimda qanday rollar bor?',
        a: "Main Admin (platforma egasi), Super Admin (tashkilot), Admin (filial), Mentor (o'qituvchi), Student, Parent va Methodist — har bir rolning o'z kabineti va huquqlari bor.",
      },
      {
        q: 'Qanday imkoniyatlar bor?',
        a: "To'lovlar va split-to'lovlar, davomat, server taymerli testlar, uy vazifalari, koinlar va reytinglar, realtime chatlar, hisobotlar va bildirishnomalar uchun Telegram bot.",
      },
      {
        q: 'Qanday boshlash mumkin?',
        a: "Saytda ariza qoldiring — biz tashkilotingizni yaratamiz va birinchi haftani bepul ulaymiz.",
      },
    ],
  },

  features: {
    badge: 'Imkoniyatlar',
    h1: "Bitta tizim kabi ishlaydigan 12+ modul",
    lead: "LevelUp Academy jadvallar, messenjerlar va qo'lda yuritilgan jurnallar o'rnini bosadi. Hammasi bog'langan: to'lov ruxsat ochadi, kelmaslik xabar yuboradi, baho koin beradi.",
    modules: [
      {
        icon: 'coin',
        title: "To'lovlar va invoyslar",
        text: "To'liq to'lov konturi: hisob, tranzaksiyalar, naqd va karta bilan split-to'lov, bulutdagi chek. Filial tushumi bir zumda qayta hisoblanadi.",
        tags: ["Split-to'lovlar", 'Invoyslar', 'S3 dagi cheklar', 'Jonli tushum'],
      },
      {
        icon: 'calendar',
        title: 'Guruhlar va jadval',
        text: "Mentor, narx va dars jadvaliga ega guruhlar. O'quvchi guruhni tark etsa ham — tarix qoladi, hech narsa yo'qolmaydi.",
        tags: ['Dars jadvali', 'Guruh mentori', "A'zolik tarixi"],
      },
      {
        icon: 'check',
        title: 'Davomat',
        text: "Mentor guruhni bir daqiqada belgilaydi. Ota-ona davomat tarixini ko'radi, kelmaslik esa darhol bildirishnoma bo'lib uchadi — administrator qo'ng'iroq qilmaydi.",
        tags: ['Mentor jurnali', 'Ota-ona uchun tarix', 'Avto-bildirishnoma'],
      },
      {
        icon: 'clock',
        title: 'Testlar va imtihonlar',
        text: "Savollar bankiga ega test konstruktori. Taymerni brauzer emas, server ushlab turadi: deadline'dan keyin topshirish yopiladi, javoblarni soxtalashtirib bo'lmaydi.",
        tags: ['Server taymeri', 'Avto-topshirish', '0–100 shkala'],
      },
      {
        icon: 'book',
        title: 'Uy vazifalari',
        text: "Fayl, deadline va bahoga ega uy vazifalari. Fayllar to'g'ridan-to'g'ri bulutga yuklanadi — telefondan ham tez. Topshirilgan vazifa uchun o'quvchi koin oladi.",
        tags: ['Fayllar', 'Deadline', 'Topshirish uchun koin'],
      },
      {
        icon: 'star',
        title: 'Motivatsiya',
        text: "Koinlar, mukofotlar do'koni va hafta/oy reytinglari. Koinlar bilan bog'liq har bir amal jurnalga abadiy yoziladi — tarix tahrirlanmaydi.",
        tags: ['Koinlar', "Do'kon", 'Reytinglar', "Faqat qo'shiladi"],
      },
      {
        icon: 'chat',
        title: 'Realtime chatlar',
        text: "Markazning umumiy chati va ota-ona–administrator shaxsiy kanali. Xabarlar bir zumda yetkaziladi, tarix saqlanadi va skroll bilan yuklanadi.",
        tags: ['Socket.io', 'Onlayn holat', 'Tarix'],
      },
      {
        icon: 'video',
        title: 'Video darslar',
        text: "Dars yozuvlari faqat o'z guruhi o'quvchilariga ochiq. Videoga havola cheklangan vaqt yashaydi — kontent tashqariga chiqmaydi.",
        tags: ['Guruh bo\'yicha ruxsat', 'Himoyalangan havolalar'],
      },
      {
        icon: 'grid',
        title: 'Hisobotlar',
        text: "Tushum, qarzlar, mentorlar maoshi va davomat — filial yoki butun tarmoq kesimida. Raqamlar mos keladi, chunki manba bitta.",
        tags: ['Moliya', 'Maoshlar', 'Filiallar'],
      },
      {
        icon: 'send',
        title: 'Telegram bot',
        text: "Ota-ona bir martalik kod bilan akkauntini bog'laydi va muhim narsalarni oladi: to'lovlar, kelmasliklar, baholar, qarzlar. Ilova o'rnatmasdan.",
        tags: ["Kod bilan bog'lash", 'Bildirishnoma navbati'],
      },
      {
        icon: 'building',
        title: "Ko'p filiallilik",
        text: "Har bir filial izolyatsiya qilingan: admin faqat o'zinikini ko'radi. SuperAdmin esa butun tarmoqni ko'radi — filiallarni solishtiradi va o'sish nuqtalarini topadi.",
        tags: ["Ma'lumot izolyatsiyasi", 'Filiallar tarmog\'i'],
      },
    ],
    flowHead: 'LevelUp Academy bilan bir kun',
    flowLead: "Tizim har bir rolning vaqtini tejaydi — direktordan o'quvchigacha.",
    flow: [
      {
        title: 'Administratorning ertalabi',
        text: "Panelni ochdi — tushum, qarzdorlar va onlayn holat allaqachon ekranda. Qo'lda hisobot yo'q: raqamlar o'zi yig'ildi.",
      },
      {
        title: 'Mentorning kuni',
        text: "Davomatni bir daqiqada belgiladi, uy vazifasini tekshirdi, faollik uchun koin berdi. Ota-onalar xabarni allaqachon oldi — hech kimga qo'ng'iroq qilish shart emas.",
      },
      {
        title: "O'quvchining kechqurini",
        text: "Testni server deadline'igacha topshirdi, video darsni ko'rdi, koinlarni do'konda sarfladi va hafta reytingidagi o'rnini tekshirdi.",
      },
    ],
    faqHead: "Ko'p beriladigan savollar",
    faq: [
      {
        q: "Tizim IT bo'lmagan yo'nalishga to'g'ri keladimi?",
        a: "Ha. LevelUp Academy universal: ingliz tili, matematika, imtihonga tayyorgarlik — har qanday fan. Ichida dasturlashga bog'langan hech narsa yo'q.",
      },
      {
        q: 'Nechta filialni ulash mumkin?',
        a: "Cheklov yo'q. Ko'p filiallilik birinchi kundan qo'yilgan: har bir filial izolyatsiya qilingan, SuperAdmin esa butun tarmoqni ko'radi.",
      },
      {
        q: "Ota-onalarga ilova o'rnatish kerakmi?",
        a: "Yo'q. Ota-onaga Telegram yetarli: bir martalik kod bilan bog'lanadi, keyin bildirishnomalar o'zi keladi. Shaxsiy kabinet telefon brauzerida ochiladi.",
      },
      {
        q: "O'quvchi ketsa, ma'lumotlar nima bo'ladi?",
        a: "Hech narsa jismonan o'chirilmaydi. Arxiv — bu faqat o'qish rejimi: to'lovlar, baholar va koinlar tarixi hisobotlar uchun qoladi. O'quvchi qaytsa — tarixi ham qaytadi.",
      },
    ],
    ctaTitle: "Barcha modullarni jonli ko'rmoqchimisiz?",
    ctaText: 'Ariza qoldiring — tizim haqida gapirib beramiz va savollarga javob beramiz.',
  },

  roles: {
    badge: 'Rollar',
    h1: "Har kimga — o'z kabineti",
    lead: "Bitta login — va tizim kerakli interfeysni o'zi ochadi. Ruxsatni server (RBAC) hal qiladi, shuning uchun brauzer orqali «birovnikini ko'rish» imkonsiz.",
    items: [
      {
        tag: 'SA',
        title: "SuperAdmin — butun tarmoq kaft ustida",
        text: "Har bir filialni va butun tarmoqni birdan ko'radi: umumiy tushum, qarzlar, onlayn hisoblagich. Filiallar, adminlar va umumiy chatni boshqaradi.",
        list: [
          'Barcha filiallar bo\'yicha filtrsiz umumiy hisobotlar',
          'Filiallarni solishtirish: tushum, qarzlar, davomat',
          "Onlayn hisoblagich — hozir nechta o'quvchi onlayn",
          'Filiallar yaratish va administratorlar tayinlash',
        ],
      },
      {
        tag: 'A',
        title: "Admin — o'z filialining xo'jayini",
        text: "Filial to'liq nazoratda: to'lovlarni qabul qiladi (split ham), guruh va o'quvchilarni yuritadi, ota-onalarga to'g'ridan-to'g'ri chatda javob beradi.",
        list: [
          "To'lovlarni qabul qilish: naqd, karta, split",
          "O'z filiali guruhlari, o'quvchilari, mentorlari — CRUD",
          "O'quvchini muzlatish — qarz o'smaydi, tarix saqlanadi",
          'Filial hisobotlari: tushum, qarzdorlar, davomat',
        ],
      },
      {
        tag: 'M',
        title: 'Mentor — kam rutina, ko\'p dars',
        text: "Davomatni bir daqiqada belgilaydi, uy vazifasi va testlarni tekshiradi, o'quvchilarga koin beradi va o'z maoshini ko'radi.",
        list: [
          "O'z guruhlari davomati — bir necha bosishda",
          'Uy vazifasi va taymerli imtihonlarni tekshirish',
          "Koinlar ± majburiy sabab bilan — hammasi jurnalda",
          "O'z maoshi va yuklamasi — shaffof",
        ],
      },
      {
        tag: 'P',
        title: "Ota-ona — qo'ng'iroqsiz xotirjamlik",
        text: "Farzandining o'zlashtirishi, davomati va qarzini ko'radi. Kelmaslik, baho yoki qarz Telegram'ga o'zi keladi.",
        list: [
          "Farzandining o'zlashtirishi va davomati real vaqtda",
          "Qarz darhol ko'rinadi — kutilmagan holatlarsiz",
          "Administrator va mentor bilan to'g'ridan-to'g'ri chat",
          "Telegram bildirishnomalari: kelmaslik, to'lov, qarz",
        ],
      },
      {
        tag: 'S',
        title: "O'quvchi — qiziqtiradigan ta'lim",
        text: "Shaxsiy kabinet: testlar, uy vazifalari, video darslar. Yutuqlar uchun koinlar, mukofotlar do'koni va reytinglar — zerikish o'rniga musobaqa.",
        list: [
          'Halol server taymerli testlar',
          "To'g'ridan-to'g'ri telefondan fayl yuklab, uy vazifasini topshirish",
          "O'z guruhining video darslari",
          "Mukofotlar do'koni va hafta/oy reytinglari",
        ],
      },
    ],
    howHead: 'Ichkarida qanday ishlaydi',
    howLead: "Rol tokenga yozilgan va har bir so'rovda serverda tekshiriladi.",
    how: [
      {
        title: 'Kirish',
        text: "Telefon + parol. Server qisqa muddatli access-token beradi va uni o'zi yangilaydi — qayta chiqib-kirish shart emas.",
      },
      {
        title: "Rol bo'yicha yo'naltirish",
        text: "Tizim tokendan rolni o'qiydi va kerakli kabinetni ochadi: admin — filialni, ota-ona — farzandini, o'quvchi — o'z darslarini.",
      },
      {
        title: 'Serverdagi tekshiruv',
        text: "Har bir so'rov RBAC va filial filtridan o'tadi. Birovning manzilini bilgan taqdirda ham ochib bo'lmaydi — server rad etadi.",
      },
    ],
    ctaTitle: 'Bitta kirish — kerakli kabinet',
    ctaText: "Ariza qoldiring — rollar va huquqlar markazingizda qanday tartib o'rnatishini tushuntiramiz.",
  },

  finance: {
    badge: 'Moliya',
    h1: "Markaz puli — bir tiyingacha",
    lead: "Split-to'lovlar, invoyslar, qarz nazorati va jonli hisobotlar. Kassa uzilishi oy oxirida emas, oldindan ko'rinadi.",
    payHead: "To'lov — ota-onalarga qulay tarzda",
    payLead: "Markazlarda haqiqatda ishlatiladigan har qanday usul.",
    pay: [
      {
        icon: 'coin',
        title: "To'liq to'lov",
        text: "Bitta hisob — bitta tranzaksiya. Naqd yoki karta, chek to'lovga biriktiriladi va bulutda saqlanadi. Filial tushumi o'sha soniyada yangilanadi.",
      },
      {
        icon: 'swap',
        title: "Split-to'lov",
        text: "700 000 naqd + 500 000 karta? Muammo emas: bitta hisob, umumiy batch raqamiga ega bir nechta tranzaksiya. Qismlar summasi o'tkazishdan oldin tekshiriladi — nomuvofiqlik bo'lmaydi.",
      },
      {
        icon: 'receipt',
        title: 'Invoys va chek',
        text: "Har bir to'lov hisobga bog'langan, chek to'lov yonida bulutda saqlanadi. Yarim yildan keyin bahs chiqdimi? Hisobni ochdingiz — hammasi joyida.",
      },
    ],
    debtHead: "Qarzlar darhol ko'rinadi",
    debtLead:
      "Oy uchun to'lanmadi — o'quvchi avtomatik ravishda qarzdorlar ro'yxatiga tushadi. Administrator buni oy oxirida emas, panelda darhol ko'radi.",
    debt: [
      {
        title: "To'lov kelmadi",
        text: "O'quvchi qarzi oshdi — tizim uni hisob chiqarilgan paytda o'zi qayta hisobladi. Qo'lda hisobot yo'q.",
      },
      {
        title: 'Ota-onaga eslatma',
        text: "Ota-ona qarzni o'z kabinetida ko'radi va Telegram'ga bildirishnoma oladi. Qarzlarning aksariyati birinchi eslatmadan keyin yopiladi.",
      },
      {
        title: 'Kerak bo\'lsa — muzlatish',
        text: "O'quvchi vaqtincha kelmayaptimi? Muzlatdingiz — qarz o'smay qoldi, to'lovlar tarixi to'liq saqlandi.",
      },
    ],
    compareHead: "LevelUp Academy'gacha va keyin",
    compare: {
      task: 'Vazifa',
      before: 'Jadvallar va chatlar',
      after: 'LevelUp Academy',
      rows: [
        {
          task: "Split-to'lovni qabul qilish",
          before: "Turli jadvallarda ikki qator, yo'qotish oson",
          after: "Bitta hisob, bog'langan tranzaksiyalar",
        },
        {
          task: 'Qarzlar nazorati',
          before: "Qo'lda — daftar va xotira bo'yicha",
          after: "Qarzdorlar ro'yxati o'zi yangilanadi",
        },
        {
          task: 'Oylik tushum',
          before: 'Bir-ikki kunda, xatolar bilan yig\'iladi',
          after: 'Panelda jonli raqam',
        },
        {
          task: "Aniq o'quvchining qarzi",
          before: "«Buxgalterga qo'ng'iroq qiling»",
          after: "Ota-ona va adminga darhol ko'rinadi",
        },
        {
          task: "O'quvchi ketgandan keyingi tarix",
          before: "Qator o'chirildi — ma'lumot yo'q",
          after: "Faqat o'qish uchun arxiv: hammasi saqlanadi",
        },
      ],
    },
    safetyHead: 'Bank darajasidagi ishonchlilik',
    safetyLead: 'Tasodifan ham buzib bo\'lmaydigan qoidalar.',
    safety: [
      {
        icon: 'lock',
        title: 'Pul faqat tranzaksiyalarda',
        text: "Har bir pul amali atomar: yo to'liq o'tadi, yo umuman o'tmaydi. Yarim to'lov degan narsa yo'q.",
      },
      {
        icon: 'receipt',
        title: 'Aniq arifmetika',
        text: "«Suzuvchi» tiyinlar yo'q: summalar aniq pul formatida saqlanadi. 1 200 000 — bu roppa-rosa 1 200 000.",
      },
      {
        icon: 'shield',
        title: "Hech narsa yo'qolmaydi",
        text: "Jismoniy o'chirish yo'q: arxiv va «yumshoq» o'chirish. Har qanday to'lovni bir yildan keyin ham ko'tarish mumkin — hisobot yoki bahs uchun.",
      },
    ],
    ctaTitle: "Markaz moliyasida tartib o'rnatamizmi?",
    ctaText: "Ariza qoldiring — LevelUp Academy to'lovlar va qarzdorlarni qanday yuritishini tushuntiramiz.",
  },

  pricing: {
    badge: 'Tariflar',
    h1: 'Markazdagi tartib uchun halol narx',
    lead: "Narx faol o'quvchilar soniga qarab belgilanadi — filiallar cheksiz kiradi. Har bir filial uchun qo'shimcha to'lov va yashirin foizlar yo'q.",
    positioning:
      "Biz eng arzon CRM emasmiz — va bo'lishga urinmaymiz ham. Narx — bu sifat: xavfsiz to'lovlar, har kunlik zaxira nusxa va bir haftada ishga tushirish. Markazingiz ishonchliligi uchun ikki marta to'lamaysiz.",

    plansHead: "Tariflar — o'quvchilar soniga qarab",
    plansLead:
      "Faol o'quvchilar soniga mos tarifni tanlang. O'sib ketsangiz — keyingisiga o'tasiz, tarix saqlanadi.",
    free: 'Bepul',
    negotiable: 'Kelishuv asosida',
    per: "so'm/oyiga",
    popular: 'Ommabop',
    cardCta: 'Ariza qoldirish',
    plans: [
      { id: 'free', name: 'Free', amount: 0, range: "0–30 o'quvchi" },
      { id: 'start', name: 'Start', amount: 199000, range: "31–100 o'quvchi" },
      { id: 'standard', name: 'Standard', amount: 349000, range: "101–300 o'quvchi", popular: true },
      { id: 'pro', name: 'Pro', amount: 599000, range: "301–600 o'quvchi" },
      { id: 'business', name: 'Business', amount: 799000, range: "601–1000 o'quvchi" },
      { id: 'network', name: 'Network', amount: null, range: "1000+ o'quvchi" },
    ],
    perksHead: 'Har bir tarifga kiradi',
    perks: [
      'Filiallar cheksiz kiradi',
      "Yillik to'lov — 15% chegirma",
      "Birinchi hafta bepul, to'liq kirish",
    ],

    trialHead: 'Birinchi hafta — bepul',
    trialLead: "Hammasini jonli sinab ko'ring — xavfsiz va kartasiz.",
    trial: [
      {
        icon: 'check',
        title: "To'liq funksiya",
        text: "Barcha modullar cheklovsiz: to'lovlar, davomat, testlar, koinlar, chatlar va hisobotlar — pullik tarifdek.",
      },
      {
        icon: 'shield',
        title: 'Karta kerak emas',
        text: "Kartani biriktirish va avto-yechishlar yo'q. Hafta tugaydi — hech narsa o'zi yechilmaydi.",
      },
    ],

    guaranteeHead: 'Bizning kafolatlarimiz',
    guaranteeLead: "Xavfni o'z zimmamizga olamiz — sizga faqat natija qoladi.",
    guarantee: [
      {
        icon: 'refresh',
        title: '30 kun ichida qaytarish',
        text: "Yoqmadimi? 30 kun ichida to'lovni 100% qaytaramiz — hech qanday shartsiz.",
      },
      {
        icon: 'shield',
        title: "Ma'lumot yo'qolmaydi",
        text: "Har kuni barcha ma'lumotlaringizning zaxira nusxasi. To'lovlar, baholar va o'quvchilar tarixi xavfsiz.",
      },
      {
        icon: 'rocket',
        title: 'Bir haftada ishga tushirish',
        text: "Markazingizni 7 kunda sozlab ishga tushiramiz. Ulgurmasak — keyingi oy bepul.",
      },
    ],

    extraHead: "Markaz uchun o'z brendingizda sayt",
    extraText:
      "Markazingizga o'z firma uslubida alohida sayt va dizayn qilib beramiz — bizning platformamizda. Alohida xizmat: markaz vazifalariga qarab individual kelishiladi.",
    extraCta: 'Sayt haqida gaplashish',

    faqHead: 'Narx haqida savollar',
    faq: [
      {
        q: 'LevelUp Academy narxi qancha?',
        a: "Narx faqat faol o'quvchilar soniga bog'liq: Free (30 tagacha) — bepul, Start (31–100) — 199 000 so'm/oyiga, Standard (101–300) — 349 000, Pro (301–600) — 599 000, Business (601–1000) — 799 000. 1000 dan ortiq o'quvchi — kelishuv asosida.",
      },
      {
        q: "Filiallar soni narxga ta'sir qiladimi?",
        a: "Yo'q. Filiallar har bir tarifga cheksiz kiradi — siz har bir filial uchun emas, faqat faol o'quvchilar soni uchun to'laysiz.",
      },
      {
        q: 'Bepul davr bormi?',
        a: "Ha, birinchi hafta to'liq funksiya bilan va cheklovsiz bepul. Karta kerak emas, avto-yechishlar yo'q.",
      },
      {
        q: "Yillik to'lovda chegirma bormi?",
        a: "Ha, yillik to'lovda tarif summasidan 15% chegirma qo'llaniladi.",
      },
      {
        q: "Tizim to'g'ri kelmasa-chi?",
        a: "Qaytarish kafolati amal qiladi: 30 kun ichida to'lovni 100% qaytaramiz, hech qanday shartsiz.",
      },
      {
        q: "Ma'lumotlarimiz nima bo'ladi?",
        a: "Biz har kuni zaxira nusxa olamiz. To'lovlar, baholar, davomat va o'quvchilar tarixi yo'qolmaydi — arxiv yozuvlari ham hisobotlar uchun ochiq qoladi.",
      },
    ],

    ctaTitle: 'Tarifingizni hisoblashga tayyormisiz?',
    ctaText:
      "Ariza qoldiring — markazingiz hajmiga mos tarifni tanlaymiz va birinchi haftani bepul ulaymiz.",
  },

  gamification: {
    badge: 'Motivatsiya',
    h1: "O'quvchilar zerikib o'tirmaydi, musobaqalashadi",
    lead: "Yutuqlar uchun koinlar, mukofotlar do'koni va jonli reytinglar. Motivatsiya yig'ilishdagi quruq gap bo'lmay qoladi — uni har bir o'quvchi har kuni ko'radi.",
    earnHead: 'Koinlar qanday ishlab topiladi',
    earnLead:
      "Koinlar haqiqiy yutuqlar uchun beriladi, har bir amal esa sabab talab qiladi — «shunchaki» bo'lmaydi.",
    earnList: [
      'Test va imtihonlardagi yuqori baholar',
      "Vaqtida topshirilgan uy vazifalari",
      "Qoldirmasdan qatnashish",
      'Darsdagi faollik — mentor belgilaydi',
    ],
    spendHead: 'Koinlar qayerga sarflanadi',
    spendLead:
      "Mukofotlar do'koni — vitrinani markazning o'zi to'ldiradi: merch, sertifikatlar, bepul darslar — nima xohlasa.",
    spend: [
      {
        title: 'Markaz vitrinasi',
        text: "Administrator mukofotlar va ularning koindagi narxini joylaydi. Narx sotib olish paytida qotiriladi — keyin o'zgarmaydi.",
      },
      {
        title: "O'quvchining xaridi",
        text: "O'quvchi to'g'ridan-to'g'ri kabinetdan yig'adi va sarflaydi. Balans minusga ketmaydi — tizim bor summadan ortiqni sarflashga yo'l qo'ymaydi.",
      },
      {
        title: 'Berish va hisob',
        text: "Buyurtma administratorda paydo bo'ladi, mukofot shaxsan topshiriladi. Barcha xaridlar tarixi abadiy saqlanadi.",
      },
    ],
    journalBadge: 'Halollik',
    journalH2: "Qayta yozib bo'lmaydigan jurnal",
    journalLead:
      "Koinlarning har bir qo'shilishi va yechilishi jurnalga abadiy yoziladi: kim, kimga, qancha va nima uchun. Yozuvlar tahrirlanmaydi va o'chirilmaydi — faqat qo'shiladi.",
    journalList: [
      'Har qanday amal uchun sabab majburiy',
      "Balans va jurnal faqat birga o'zgaradi",
      'Reytinglar avtomatik qayta hisoblanadi',
      "Bahsli holat? Jurnal hammasini ko'rsatadi",
    ],
    journalTitle: 'Koinlar jurnali',
    journalRows: [
      { amount: '+50', text: 'Aziza R. — imtihon 96/100' },
      { amount: '+20', text: "Bekzod K. — uy vazifasi deadline'gacha topshirildi" },
      { amount: '−300', text: 'Dilnoza T. — xarid: markaz futbolkasi' },
      { amount: '+10', text: 'Sanjar U. — darsdagi faollik' },
    ],
    boardHead: 'Hafta va oy reytinglari',
    boardLead:
      "Reyting har hafta va har oy nolga tushadi — yangi kelgan ham quvib yetishga imkon topadi. O'tgan g'alabalar snapshotlarda saqlanadi: yutuqlar tarixi yo'qolmaydi.",
    board: [
      {
        icon: 'zap',
        title: 'Jonli reyting',
        text: "Koin oldi — reytingdagi o'rin darhol yangilandi. O'quvchilar harakatni real vaqtda ko'radi.",
      },
      {
        icon: 'refresh',
        title: 'Halol qayta boshlash',
        text: "Hafta va oy hamma uchun noldan boshlanadi. Musobaqa yetib bo'lmas lider bilan poygaga aylanmaydi.",
      },
      {
        icon: 'trophy',
        title: "G'alabalar tarixi",
        text: "Har bir davr g'oliblari qayd etiladi. Markazning faxriylar doskasi o'zi yig'iladi.",
      },
    ],
    ctaTitle: 'Markazingizda musobaqani yoqing',
    ctaText: "Koinlar, do'kon va reytinglar markazingiz qoidalariga moslanadi.",
  },

  contacts: {
    badge: 'Aloqa',
    h1: 'Markazingizni muhokama qilamizmi?',
    lead: 'Ariza qoldiring — LevelUp Academy haqida gapirib beramiz va barcha savollarga javob beramiz.',
    form: {
      name: 'Ism',
      namePlaceholder: 'Sizga qanday murojaat qilaylik',
      phone: 'Telefon',
      center: "O'quv markazi",
      centerPlaceholder: 'Markaz nomi',
      size: 'Markaz hajmi',
      sizePlaceholder: "Nechta o'quvchi",
      sizeOptions: [
        "100 tagacha o'quvchi",
        "100–500 o'quvchi",
        "500+ o'quvchi",
        'Filiallar tarmog\'i',
      ],
      message: 'Xabar',
      messagePlaceholder: 'Markazni boshqarishda nimani yaxshilamoqchisiz?',
      submit: 'Ariza yuborish',
      sending: 'Yuborilmoqda…',
      success: "Ariza qabul qilindi! Tez orada siz bilan bog'lanamiz.",
      note: "Tugmani bosish orqali siz ma'lumotlarni qayta ishlash siyosatiga rozilik bildirasiz.",
      errorRate: "Urinishlar juda ko'p — bir daqiqa kuting va qayta yuboring.",
      errorGeneric: 'Arizani yuborib bo\'lmadi. Ism va telefonni tekshirib, qayta urinib ko\'ring.',
      errorNetwork: 'Server ishlamayapti. Keyinroq urinib ko\'ring yoki bizga Telegram\'da yozing.',
    },
    info: [
      {
        icon: 'send',
        title: 'Telegram',
        text: "Eng tezi — bizga Telegram'da yozish: javob beramiz va tizim haqida gapirib beramiz.",
      },
      {
        icon: 'rocket',
        title: 'Mahsulot holati',
        text: "LevelUp Academy faol rivojlanmoqda. Kontakt qoldiring — ishga tushish haqida birinchi bo'lib bilasiz.",
      },
      {
        icon: 'message',
        title: 'Savol va takliflar',
        text: "Markazingizga nima yetishmayotganini ayting — eng yaxshi g'oyalar mahsulotga qo'shiladi.",
      },
    ],
  },

  notFound: {
    badge: '404',
    h1: "Bunday sahifa yo'q",
    text: "Ehtimol havola eskirgan yoki manzilda xatolik bor. Bosh sahifaga qayting — u yerdan LevelUp Academy'ning barcha bo'limlari ochiladi.",
    button: 'Bosh sahifaga',
  },

  seo: {
    home: {
      title: "LevelUp Academy — o'quv markazi uchun CRM",
      description:
        "O'quv markazi uchun CRM: to'lovlar va split-to'lovlar, davomat, imtihonlar, motivatsiya va Telegram bildirishnomalari bitta tizimda. Birinchi hafta — bepul.",
    },
    features: {
      title: 'Imkoniyatlar — 12+ CRM moduli | LevelUp Academy',
      description:
        "To'lovlar, davomat, server taymerli testlar, uy vazifalari, koinlar, realtime chatlar, video darslar, hisobotlar va Telegram bot — LevelUp Academy'ning barcha modullari.",
    },
    roles: {
      title: 'Rollar va ruxsatlar — 5 kabinet | LevelUp Academy',
      description:
        "SuperAdmin, Admin, Mentor, Ota-ona va O'quvchi — har bir rolning o'z kabineti. Ruxsatni serverdagi RBAC hal qiladi: ortiqchasini hech kim ko'rmaydi.",
    },
    finance: {
      title: "Markaz moliyasi va to'lovlari | LevelUp Academy",
      description:
        "Naqd va karta bilan split-to'lovlar, invoyslar, bulutdagi cheklar, qarz nazorati va tushum bo'yicha jonli hisobotlar. O'quv markazi puli — bir tiyingacha.",
    },
    pricing: {
      title: "Tariflar va narxlar — o'quv markazi uchun CRM | LevelUp",
      description:
        "LevelUp Academy narxlari: 30 o'quvchigacha bepul, keyin 199 000 so'm/oyidan. Narx o'quvchilar soniga qarab, filiallar cheksiz kiradi, birinchi hafta bepul.",
    },
    gamification: {
      title: 'Motivatsiya va geymifikatsiya | LevelUp Academy',
      description:
        "O'zlashtirish uchun koinlar, mukofotlar do'koni va hafta hamda oyning jonli reytinglari. Koinlar jurnali faqat to'ldiriladi — har kuni ko'rinadigan motivatsiya.",
    },
    contacts: {
      title: 'Aloqa va ariza | LevelUp Academy',
      description:
        'Ariza qoldiring — LevelUp Academy haqida gapirib beramiz va savollarga javob beramiz. Birinchi hafta bepul, karta va majburiyatsiz.',
    },
    notFound: {
      title: "Sahifa topilmadi — LevelUp Academy",
      description: "Bunday sahifa yo'q. LevelUp Academy bosh sahifasiga qayting.",
    },
    breadcrumbHome: 'Bosh sahifa',
  },
};
