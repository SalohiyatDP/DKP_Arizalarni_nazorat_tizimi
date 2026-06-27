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
├── Diagnostics.js             # healthCheck() / getAppInfo() — o'rnatishni tekshirish
├── core/                      # Namespace · AppError · Result
├── config/                    # Config · Constants · Schema · Settings
├── utils/                     # Logger · Date/String/Array/Map · Sanitizer · Validator · Hash
├── repositories/              # Base · Cache · Settings · Hisobot · Employee · Holiday · Log
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
| 2 | Konfiguratsiya (SETTINGS override, sheet handle'lar) | ✅ |
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

## Apps Script'ga yuklash (Deployment)

Kod **bog'langan (container-bound)** Apps Script loyihasiga yuklanadi — ya'ni
mavjud Google Spreadsheet ichidagi skriptga. Ikki yo'l bor: **A) `clasp`
orqali** (tavsiya etiladi, 35+ fayl uchun qulay) va **B) qo'lda nusxalash**.

### 0. Tayyorgarlik: Script ID'ni olish

1. Google Spreadsheet'ni oching → menyuda **Extensions → Apps Script**.
2. Ochilgan Apps Script muharririda **Project Settings (⚙️)** bo'limiga o'ting.
3. **Script ID** ni nusxalab oling (bu loyiha jadvalga allaqachon bog'langan).
4. O'sha sahifada **"Show 'appsscript.json' manifest file in editor"** ni yoqing
   (manifestni ko'rish/tahrirlash uchun).

---

### A varianti — `clasp` orqali (tavsiya etiladi)

Talab: kompyuteringizda **Node.js** o'rnatilgan bo'lsin.

```bash
# 1. Repozitoriyni klonlash
git clone https://github.com/SalohiyatDP/DKP_Arizalarni_nazorat_tizimi.git
cd DKP_Arizalarni_nazorat_tizimi

# 2. clasp'ni o'rnatish va Google hisobingizga kirish
npm install                 # @google/clasp dev-dependency sifatida
npx clasp login             # brauzerda Google hisobni tasdiqlaysiz

# 3. .clasp.json faylini yaratish (namunadan nusxalab, Script ID'ni qo'ying)
cp .clasp.json.example .clasp.json
#   .clasp.json ichidagi <PASTE_YOUR_APPS_SCRIPT_PROJECT_ID_HERE> o'rniga
#   0-bosqichda olingan Script ID'ni yozing. rootDir allaqachon "src".

# 4. Kodni Apps Script'ga yuklash
npm run push                # = clasp push  (barcha src/ fayllarni yuklaydi)

# 5. Muharrirni ochish
npm run open                # = clasp open
```

> `clasp push` paytida "Manifest file has been updated. Do you want to push and
> overwrite?" so'ralsa — **Yes**. `.clasp.json` `.gitignore`'da, hech qachon
> commit qilinmaydi.

Mavjud `package.json` skriptlari: `npm run push` (yuklash),
`npm run watch` (o'zgarishni avtomatik yuklash), `npm run pull` (Apps Script'dan
yuklab olish), `npm run logs` (loglar), `npm run open` (muharrir).

---

### B varianti — qo'lda nusxalash (clasp'siz)

`clasp`'siz ham bo'ladi, lekin fayllar ko'p — har birini qo'lda yaratasiz.

1. Apps Script muharririda chap paneldagi **+ → Script** bilan yangi fayl
   yarating va nomini **papka yo'li bilan** bering, masalan: `core/Namespace`,
   `config/Config`, `repositories/BaseRepository` va hokazo. Apps Script `/`
   belgisini "papka" sifatida ko'rsatadi.
2. Ushbu repozitoriyadagi `src/...` faylining mazmunini muharrirdagi mos faylga
   to'liq nusxalang. **Barcha** `src/**/*.js` fayllar uchun takrorlang.
3. HTML uchun **+ → HTML** bilan `views/Index` faylini yarating va
   `src/views/Index.html` mazmunini nusxalang.
4. Manifest uchun `appsscript.json` faylini oching (0-bosqichda yoqilgan) va
   `src/appsscript.json` mazmuni bilan almashtiring.

> Fayllar tartibi muhim emas — modullar bir-birini faqat funksiya ichida
> chaqiradi (load-order'dan mustaqil).

---

### Yuklangandan keyin tekshirish ✅

1. Muharrirda yuqoridagi funksiya ro'yxatidan **`healthCheck`** ni tanlang →
   **Run** bosing. Birinchi marta Google **ruxsat (authorization)** so'raydi —
   tasdiqlang.
2. **Execution log** (View → Logs) da hisobotni ko'rasiz:
   - `spreadsheet` — bog'langan jadval nomi,
   - `sheets` — har bir kerakli varaq bor/yo'qligi,
   - `missing` — topilmagan varaqlar ro'yxati (bo'sh bo'lishi kerak),
   - `settings` — SETTINGS asosida hisoblangan amaldagi qiymatlar,
   - `ok: true` — hammasi joyida.

`getAppInfo` funksiyasi esa versiya/bosqich ma'lumotini qaytaradi.

---

### Web App sifatida ishga tushirish (deploy)

1. Muharrirda **Deploy → New deployment** → tur sifatida **Web app**.
2. **Execute as:** *Me* (sizning nomingizdan), **Who has access:** tashkilot
   siyosatiga qarab (masalan, *Anyone within <tashkilot>*).
3. **Deploy** → berilgan **Web app URL** orqali ilova ochiladi (hozircha
   1–2-bosqich qobig'i ko'rinadi; to'liq UI 8-bosqichda).
4. Keyinchalik kod yangilanganda: `clasp push` → **Deploy → Manage deployments**
   → mavjud deploymentni **Edit → New version → Deploy**.

> CLI orqali ham: `npm run deploy` (`clasp deploy`).

---

### Hozircha nima ishlaydi (1–2-bosqich)

- `doGet` web ilovaning qobig'ini (`views/Index`) uzatadi.
- `healthCheck()` o'rnatishni va sozlamalarni tekshiradi.
- Ma'lumotlarga kirish (BaseRepository), kesh (CacheRepository) va sozlamalar
  (Settings) qatlami to'liq ishlaydi.
- Autentifikatsiya/import/dashboard `api()` chaqiruvlari hozircha
  `"Not implemented"` qaytaradi — ular 3–9-bosqichlarda ulanadi.
