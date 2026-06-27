# DKP Arizalar Nazorati

**Google Apps Script** (V8) platformasida qurilgan korporativ ariza nazorati
tizimi. Ma'lumotlar bazasi sifatida **Google Sheets**, frontend sifatida
**HTML5 / Material Design** web-ilova ishlatiladi.

> Administrator bir marta bosib kunlik hisobotni yuklaydi; shundan so'ng tizim
> statistika, moliya, muddatlar, dashboard, ruxsatlar, kesh va loglarni
> avtomatik qayta hisoblaydi — va 100 000+ qatorda ham tez hamda xavfsiz
> ishlashda davom etadi.

Loyiha **bosqichma-bosqich** yetkazib beriladi. Hozirgi holat:
**1-bosqich — Loyiha arxitekturasi**. To'liq qatlamli skelet, kelishuvlar
(conventions) va asosiy primitivlar tayyor; biznes-mantiq keyingi bosqichlarda
amalga oshiriladi.

---

## Arxitektura qisqacha

Qat'iy, bir tomonlama qatlamli (MVC ko'rinishidagi) arxitektura. Bog'liqliklar
faqat **pastga** yo'naladi — ichki qatlam hech qachon tashqi qatlamni chaqirmaydi.

```
            Brauzer (HTML5 / Material Design SPA)
                       │  google.script.run -> api()
        ┌──────────────▼───────────────┐
        │  web/        WebApp router    │  doGet · include · dispatch (+ auth/CSRF)
        ├──────────────┬───────────────┤
        │ controllers/ │ tekshirish · ruxsat · envelope   (biznes-mantiq yo'q)
        ├──────────────┼───────────────┤
        │ services/    │ biznes-mantiq, orkestratsiya      ("miya")
        ├──────────────┼───────────────┤
        │ repositories/│ BARCHA sheet I/O (yagona get/setValues, chunk, kesh)
        ├──────────────┼───────────────┤
        │ utils/       │ toza yordamchilar (sana, matn, hash, tekshirish)
        ├──────────────┼───────────────┤
        │ config/      │ Config · Constants · Schema  (yagona haqiqat manbai)
        ├──────────────┴───────────────┤
        │ core/        Namespace · AppError · Result        (primitivlar)
        └───────────────────────────────┘
                       │
            Google Sheets (mavjud BD) + CacheService / PropertiesService
```

### Qatlamlar vazifasi

| Qatlam | Papka | Vazifasi |
|------|--------|----------|
| Core | `src/core` | Modul kelishuvi, tipli `AppError`, `Result` envelope. |
| Config | `src/config` | Sheet ro'yxati, enumlar, HISOBOT ustun sxemasi. Boshqa joyda nom qattiq yozilmaydi. |
| Utils | `src/utils` | Toza, qayta ishlatiluvchi yordamchilar (sheet'ga murojaat yo'q). |
| Repositories | `src/repositories` | `SpreadsheetApp` / Cache'ga tegadigan **yagona** joy. |
| Services | `src/services` | Biznes-mantiq, hisob-kitoblar, orkestratsiya. |
| Controllers | `src/controllers` | API chegarasi: tekshirish, ruxsat, delegatsiya, envelope qaytarish. |
| Web | `src/web` | `doGet`/`api` marshrutlash, HTML uzatish, markaziy xatolik boshqaruvi. |
| Views | `src/views` | Material Design SPA (8-bosqichda quriladi). |

---

## Modul kelishuvlari

Google Apps Script har bir faylni yagona umumiy (global) ko'lamga yuklaydi,
shuning uchun biz **muzlatilgan IIFE moduli** namunasidan foydalanamiz:

```js
var SomeModule = (function () {
  'use strict';
  function publicFn() { /* ... */ }
  return Object.freeze({ publicFn: publicFn });
})();
```

Buni xavfsiz va boshqariladigan qiladigan qoidalar:

1. **Yuklash vaqtida modullararo chaqiriq yo'q.** Modullar bir-birini faqat
   funksiyalar ichida chaqiradi, shuning uchun fayllarning yuklanish tartibi
   hech qachon ahamiyatga ega emas.
2. **Config — yagona haqiqat manbai.** Hech qaysi sheet nomi, ustun, rol yoki
   status matni `src/config` tashqarisida qattiq yozilmaydi.
3. **Barcha I/O repository'larda.** Service/controller'lar `SpreadsheetApp`'ni
   bevosita chaqirmaydi.
4. **Xatoliklar tipli.** Funksiyalar `Result.ok/fail(AppError)` qaytaradi; web
   qatlami ularni mijozga xavfsiz envelope'ga aylantiradi va ichki ma'lumotni
   oshkor qilmaydi.
5. **Xavfsizlik server tomonda.** Ruxsat/sessiya har bir amal uchun serverda
   tekshiriladi; frontend ko'rsatmalariga hech qachon ishonilmaydi.
6. **Har bir funksiyada JSDoc bor** va u qaysi bosqichda amalga oshirilishi
   izohlangan.

---

## Unumdorlik shartnomasi (100 000+ qator uchun)

- O'qish uchun bitta `getValues()`, yozish uchun bitta (chunk'langan)
  `setValues()` — hech qachon har bir katak alohida emas.
- `Map`/obyekt indekslarini bir marta qurish; `VLOOKUP`/`INDEX-MATCH` o'rniga
  O(1) qidiruv.
- Agregatsiyalar **bir martalik aylanish** (`COUNTIFS`/`SUMIFS` → bitta loop)
  va **oldindan hisoblangan**, so'ng keshlangan. Dashboard xom ma'lumotni emas,
  tayyor snapshot'larni o'qiydi.
- Server tomonda filtrlash, sahifalash (pagination), debounced qidiruv;
  import'ni chunk'lab qayta ishlash.
- Biznes hisob-kitoblari jadval formulalarida emas — barchasi JavaScript'da.

---

## Kunlik import quvuri (4-bosqich)

```
Backup → O'qish → Tekshirish → Transform → Biznes-mantiq → Statistika →
Moliya → Kesh → Dashboard yangilash → Loglar → Tayyor   (xatolikda rollback)
```

---

## Mavjud ma'lumotlar bazasi (QAYTA yaratilmaydi)

`DASHBOARD, HISOBOT, DATA, STATISTICS, FINANCE, LOGIN, EMPLOYEES, SETTINGS,
HOLIDAYS, SERVICE_RULES, AREA_RULES, EXPORT, BACKUP, IMPORT_LOG, LOGIN_LOG,
ACTION_LOG, MONTHLY_STATS, CACHE` — `src/config/Config.js` da ro'yxatga olingan.
`HISOBOT` — asosiy kunlik import qilinadigan ma'lumot manbai
(~18 000 → 100 000+ qator, ~73 ustun).

---

## Loyiha tuzilmasi

```
src/
├── appsscript.json            # manifest (V8, Asia/Tashkent, webapp + scope'lar)
├── core/                      # Namespace · AppError · Result
├── config/                    # Config · Constants · Schema
├── utils/                     # Logger · Date/String/Array/Map · Sanitizer · Validator · Hash
├── repositories/              # Base · Hisobot · Employee · Holiday · Log · Cache
├── services/                  # Calendar · Auth · Permission · Import · BusinessLogic
│                              #   · Statistics · Finance · Dashboard · Export · Log
├── controllers/               # Auth · Dashboard · Import · Export
├── web/                       # WebApp (doGet/api router)
└── views/                     # Index.html (SPA qobig'i)
```

---

## Ishlab chiqish yo'l xaritasi

| Bosqich | Qamrov | Holat |
|------:|-------|--------|
| 1 | Loyiha arxitekturasi | ✅ shu yetkazib berish |
| 2 | Konfiguratsiya (SETTINGS override, sheet handle'lar) | ⏳ |
| 3 | Autentifikatsiya va Ruxsatlar | ⏳ |
| 4 | Import dvigateli | ⏳ |
| 5 | Biznes-mantiq va Ish kunlari kalendari | ⏳ |
| 6 | Statistika va Loglash | ⏳ |
| 7 | Moliya | ⏳ |
| 8 | Dashboard (Material Design UI) | ⏳ |
| 9 | Eksport (Excel/PDF/CSV/Print, navbat) | ⏳ |
| 10 | Optimizatsiya (kesh, pagination, chunking) | ⏳ |
| 11 | Testlash | ⏳ |

Har bir bosqich keyingisidan oldin yetkazib berilib, ko'rib chiqiladi.

---

## Lokal sozlash (clasp)

Manba kodi [`clasp`](https://github.com/google/clasp) uchun moslangan.

1. `npm i -g @google/clasp && clasp login`
2. `.clasp.json.example` faylini `.clasp.json` ga nusxalang va script id'ni
   qo'ying (mavjud jadvalga bog'langan loyiha). `rootDir` — `src`.
3. Yuklash uchun `clasp push`. `.clasp.json` git tomonidan e'tiborsiz
   qoldiriladi (hech qachon commit qilinmaydi).
