# MyDacanlao Backend (MySQL / XAMPP)

Backend ng **Barangay Secretary Certification Management** (Objective 1, John Risel P. Ermita).
Node.js + Express + MySQL (Sequelize). Ang mga endpoint ay tugma sa `src/api/index.js` ng frontend.

## Structure

```
config/        env, database connection, constants (workflow), roles (permissions), upload (multer)
controllers/   manipis na layer: kinukuha ang request, tinatawag ang service, nagbabalik ng response
models/        Sequelize models (isang file bawat table) + index.js para sa relationships
routes/        mga URL at kung anong permission ang kailangan
services/      lahat ng business rules at database queries
utils/         ApiError, auth middleware, error handler, rate limiters, seed
app.js         entry point
```

## Setup sa XAMPP

1. Buksan ang **XAMPP Control Panel** at i-**Start** ang **MySQL** (hindi kailangan ang Apache).
2. Sa folder ng backend:
   ```bash
   npm install
   copy .env.example .env      # (Mac/Linux: cp .env.example .env)
   npm run seed                # gagawa ng database, mga table, sample data, at Secretary account
   npm run dev
   ```
3. Ang default ng XAMPP ay user `root`, walang password, port `3306`. Iyon ang laman ng `.env.example`. Kung may password ang MySQL mo, ilagay sa `DB_PASSWORD`.
4. Awtomatikong ginagawa ang database na `mydacanlao` kung wala pa. Makikita mo ito sa phpMyAdmin (`http://localhost/phpmyadmin`).

Default seed login: `secretary` / `ChangeMe123!` at `bhw` / `ChangeMe123!` (palitan ang `SEED_PASSWORD` at `SEED_BHW_PASSWORD` sa `.env` bago mag-seed).
Ang `npm run seed` ay **binubura at ginagawang muli ang lahat ng table** sa database, kaya huwag gamitin kapag may totoong data na.

Kapag `npm run dev` o `npm start` lang ang pinatakbo, ang mga table na wala pa ay awtomatikong ginagawa at hindi binubura ang laman ng mayroon na.
Awtomatiko ring idinadagdag ang mga bagong column (hal. ang verification at version ng residents) sa mga table na nauna nang ginawa, kaya hindi na kailangang mag-seed ulit.

**May database ka na at gusto mo lang magdagdag ng BHW account?** Huwag mag-seed. Patakbuhin ang:
```bash
npm run add-bhw                                        # gamit ang SEED_BHW_USERNAME / SEED_BHW_PASSWORD sa .env
npm run add-bhw -- juana MyPassword123 "Juana R. Cruz" # o ilagay mismo ang username, password, at pangalan
```

## Mga table

| Table | Laman |
| --- | --- |
| `users` | Secretary at BHW account (username, password hash, role: `secretary` o `bhw`) |
| `households` | Sambahayan (head, address, purok, tenure, contact, `version`, nagrehistro at huling nag-edit) |
| `residents` | Mga residente, naka-link sa household. May verification (status, remarks, sino, kailan), `version`, nagrehistro at huling nag-edit |
| `resident_audits` | Audit trail ng residents: ano ang nagbago (dati at bago), sino, at kailan |
| `certification_requests` | Request, status, reviewer, at ang sinagot ng applicant sa form |
| `request_requirements` | Bawat kailangang dokumento ng request: file at resulta ng validation |
| `request_remarks` | Mga remark ng Secretary sa bawat request |
| `counters` | Susunod na numero ng request bawat taon (CR-2026-0042), at ng `RES` at `HH` |

## Work breakdown -> endpoint

| Item | Endpoint | Permission |
| --- | --- | --- |
| 1.1.1 Listahan at detalye | `GET /api/certification-requests`, `GET /api/certification-requests/:id` | `cert:view` |
| 1.1.2 Search at filter | `GET /api/certification-requests?q=&status=&type=&from=&to=` | `cert:view` |
| 1.1.3 Status management | `PATCH /api/certification-requests/:id/status` `{ status, remark? }` | `cert:manage` |
| 1.1.4 Remarks | `POST /api/certification-requests/:id/remarks` `{ text }` | `cert:manage` |
| 1.2.1 Applicant info | Kasama sa `GET /:id`: `submitted`, `record`, `discrepancies` | `cert:view` |
| 1.2.2 Requirements at files | `requirements` at `summary` sa `GET /:id`; `GET /:id/requirements/:name/file` | `cert:view` |
| 1.2.3 Requirement validation | `PUT /api/certification-requests/:id/requirements/:name/validation` `{ status, remarks }` | `cert:manage` |
| 1.2.4 Incomplete handling | `summary.missing / flagged / incomplete` + status `resubmission` | `cert:manage` |
| 1.3.1 / 1.3.2 Residents (Secretary, read-only) | `GET /api/residents`, `GET /api/residents/:id` | `resident:view` |
| 1.3.3 / 1.3.4 Households (Secretary) | `GET /api/households`, `GET /api/households/:id` | `household:view` |
| 1.3.5 Edit household | `PUT /api/households/:id` | `household:edit` |
| 1.4.1 Dashboard | `GET /api/secretary/summary` | `cert:view` |
| 1.4.2 Access control | JWT login (`POST /api/auth/login`, `GET /api/auth/me`) + permission checks sa bawat route | - |
| Public form ng resident | `POST /api/certification-requests` (multipart, walang login) | public |

## BHW module (2.1 hanggang 2.3)

Para sa **Barangay Health Worker** (`role: bhw`). Lahat ng list endpoint ay may `?page=&pageSize=` (default 10, hanggang 50) at nagbabalik ng `{ items, total, page, pageSize, totalPages }`.

| Item | Endpoint | Permission |
| --- | --- | --- |
| 2.1.1 Mag-register ng resident | `POST /api/residents` `{ firstName, middleName?, lastName, sex, birthDate, civilStatus, occupation?, contact?, householdId, relationship }` | `resident:create` |
| 2.1.2 Validation, duplicate check | Sa `POST` at `PUT` ng resident: `422` na may `fields` kapag may mali; `409` na may `duplicate` kapag pareho ang pangalan at birth date | `resident:create` / `resident:edit` |
| 2.1.2 Verification | `PATCH /api/residents/:id/verification` `{ status: verified \| needs_correction, remarks }` | `resident:verify` |
| 2.1.3 / 2.1.4 List, detalye, search, filter | `GET /api/residents?q=&purok=&householdId=&verification=&page=&pageSize=`, `GET /api/residents/:id` | `resident:view` |
| 2.1.5 Edit + audit trail | `PUT /api/residents/:id` (kasama ang `version`), `GET /api/residents/:id/history` | `resident:edit` |
| 2.2.1 / 2.2.2 Mag-register ng household | `POST /api/households` `{ address, purok, tenure, contact?, head: {...} }` o `{ ..., headId }` | `household:create` |
| 2.2.3 / 2.2.4 List, detalye, members, search | `GET /api/households?q=&purok=&page=&pageSize=`, `GET /api/households/:id`, `GET /api/households/:id/members` | `household:view` |
| 2.2.5 Ilipat ang resident sa ibang household | `PATCH /api/residents/:id/household` `{ householdId, relationship, version? }` | `household:assign` |
| 2.2.6 Edit household + conflict detection | `PUT /api/households/:id` `{ headId, address, purok, tenure, contact, version }` | `household:edit` |
| 2.3.1 Dashboard | `GET /api/bhw/summary` -> `{ residents, households, verification }` | `summary:view` |
| 2.3.2 Role-based access | Ang `config/roles.js` ang listahan ng permission ng bawat role. Walang `cert:*` ang BHW, kaya `403` ang lahat ng certification endpoint | - |

Rules:

- **Duplicate resident:** pareho ang first name, last name, at birth date (hindi tinitingnan ang upper/lower case at ang middle name). **Duplicate household:** pareho ang purok at address.
- **Household head:** isa lang ang head bawat household. Itinatakda ito sa pag-register ng household (bagong resident, o resident na naka-register na na lilipat bilang head). Hindi puwedeng gawing `Head` ang relationship sa ibang paraan. Kapag pinalitan ang head sa pag-edit ng household, ang dating head ay nagiging `Relative` at ang bago ay `Head`.
- Ang head ng isang household ay hindi puwedeng ilipat hangga't hindi napapalitan ang head niyon.
- **Conflict detection:** may `version` ang bawat resident at household na tumataas kapag may nag-save. Kailangang ipadala ng edit form ang `version` na nakita nito. Kung nagbago na iyon, `409` ang sagot na may `conflict: { updatedBy, updatedAt }` at walang nase-save.
- **Audit trail:** bawat pag-register, pag-edit, verification, at paglipat ng resident ay may isang linya sa `resident_audits` (dating halaga, bagong halaga, sino, kailan). Ang pag-register at pag-update ay sabay na naka-save sa isang transaction.
- Ang mga ID (`RES-016`, `HH-007`) ay galing sa `counters`, at hindi bumababa sa pinakamataas na numerong nasa table na.

## Mahahalagang rules

- **Status flow:** pending -> under_review -> approved / rejected / resubmission; resubmission -> under_review. Ang approved at rejected ay final.
- Ang `rejected` at `resubmission` ay kailangan ng remark. Ang `approved` ay kailangan na lahat ng requirement ay `valid`.
- Ang requirement ay mave-validate lang kapag `under_review` ang request. Ang walang file ay hindi puwedeng maging `valid`. Ang `invalid` at `resubmit` ay kailangan ng remark.
- Naka-save sa bawat pagbabago ang reviewer (`reviewed_by`) at petsa (`updated_at`). Naka-lock ang row ng request habang nag-a-update para walang magka-banggaan.
- **1.4.2:** Ang Secretary ay may `resident:view` lang, kaya `403` ang bawat pagbabago ng resident at ang pag-create ng household. Ang `DELETE` sa residents at households ay `403` sa lahat.
- Ang mga file (JPG, PNG, PDF, hanggang 5 MB) ay naka-save sa `uploads/` na may random na pangalan at hindi public. Para mabuksan, kailangan ng Secretary login.

## Error format

Lahat ng error ay `{ "message": "...", "fields": { "email": "..." } }` (ang `fields` ay para sa validation). Ito ang binabasa ng `ApiError` ng frontend. Kapag patay ang MySQL, `503` ang ibinabalik na may mensaheng i-start ang MySQL sa XAMPP.

## Pag-connect sa frontend

1. Ipadala ang token sa bawat secretary request: `Authorization: Bearer <token>` (galing sa `/api/auth/login`).
2. Palitan ang laman ng bawat function sa `src/api/index.js` ng `fetch('http://localhost:5000/api/...')` at panatilihin ang parehong arguments at return shape.
3. Para sa public form, gumamit ng `FormData`: ilagay ang bawat field (`name`, `address`, `purok`, `birthDate`, `email`, `voter`, `civil`, `type`, `purpose`, `contact`, `boarder`) at i-append ang bawat file gamit ang **pangalan ng requirement** bilang field name, halimbawa `fd.append('Valid government ID', file)`.
4. Para buksan ang uploaded file, i-`fetch` ang `file.url` kasama ang token, gawing blob, at gumamit ng `URL.createObjectURL`. Hindi gagana ang plain `<a href>` dahil protektado ito.
5. Siguraduhing nasa `CLIENT_ORIGIN` ng `.env` ang address ng frontend (default `http://localhost:5173` ng Vite).

## Email sa resident (Gmail)

Kapag binago ng Secretary ang status ng request, may email na ipinapadala sa resident (sa email na inilagay nila sa form):
**Start review**, **Approved**, **Rejected**, at **Needs resubmission**. Kasama sa rejected at resubmission ang dahilang isinulat ng Secretary;
kasama rin sa resubmission ang listahan ng mga dokumentong kulang o minarkahang mali. Ang optional na remark sa ibang status ay hindi ipinapadala (internal note iyon).

Setup (walang domain na kailangan):

1. Sa Gmail account ng barangay, i-on ang **2-Step Verification** (Google Account > Security).
2. Pumunta sa **myaccount.google.com/apppasswords** at gumawa ng App password (16 letters).
3. Sa `.env`: itakda ang `SMTP_USER=iyong-gmail@gmail.com`, `SMTP_PASS=ang-app-password`, at `SMTP_PORT=587` (STARTTLS).
4. `npm install`, tapos i-restart ang backend. Dapat may lumabas na `[email] Gmail is ON ...`.
5. Subukan: `npm run test-email iba-mong-email@gmail.com`.

`EMAIL_REDIRECT_TO` ay pang-test lang: kapag may laman, lahat ng email ay mapupunta sa address na iyon. Alisan ng laman sa totoong gamit.
Karaniwang may limit na mga 500 email kada araw ang Gmail. Ang wording ng mga email ay nasa `services/emailTemplates.js`.
Kung pumalya ang pagpapadala, hindi nito binabawi ang pagbabago ng status; makikita ang dahilan sa console ng backend (`[email] ...`).
