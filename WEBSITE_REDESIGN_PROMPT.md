# AeroAttendance Web — Full UI Redesign (Build Prompt)

You are a senior React engineer and product designer. Redesign the **entire web frontend** in this folder (`fintradify_frontend/fintradify_frontend_project`, Create React App) into a premium, consistent, professional product: the public marketing website, the login flows, the **Admin panel** and the **Employee panel**. Every screen must keep working against the existing Node/Express backend. Do not remove any feature — restyle and restructure, then verify.

The product is **AeroAttendance**, the HR and attendance platform of **Aerowheels** ("Delivering Promise"). The old brand "Fintradify" must not appear anywhere a user can see it.

---

## 1. Hard constraints (do not break these)

1. **Stack stays:** React 17, `react-scripts` 5, `react-router-dom` **v5** (`Switch`, `Route`, `useHistory`), `axios`, `react-bootstrap` 2 / Bootstrap 5, `recharts`, `lucide-react`, `react-icons`, `react-toastify`, `leaflet` / `react-leaflet` 3, `moment-timezone`. Do not upgrade React or the router. You may add small, well-known packages only when clearly needed.
2. **API base URL:** always `process.env.REACT_APP_API_URL` (currently `http://72.60.41.224/api`). Use the shared instance in `src/utils/axios.js` for new code. Never hard-code another host.
3. **Auth:** JWT in `localStorage.token`. Login is `POST /auth/login`; the response is `{ token, role }`. A `role` of `admin` goes to `/admin`, anything else goes to `/employee`. Send `Authorization: Bearer <token>` on every call. On 401, clear the token and go to `/login`. On 403 with `code` `ACCOUNT_TERMINATED` or `PORTAL_ACCESS_BLOCKED`, show a full-page "Access disabled" state. On any other `*_ACCESS_BLOCKED` code, show a "Module locked by HR" card inside that section.
4. **API contracts are fixed.** Keep every endpoint listed in section 7 wired and reachable. Do not rename request fields.
5. **Empty-database safe.** The production database is new and nearly empty. Every list, chart and KPI must render a proper empty state. Nothing may crash when the data is `[]`, `{}`, `null`, or `{ message: '...' }`. Add a helper and use it everywhere:
   ```js
   export const asList = (body) => Array.isArray(body) ? body
     : Array.isArray(body?.data) ? body.data
     : Array.isArray(body?.attendances) ? body.attendances : [];
   export const asObject = (body) => (body && typeof body === 'object' && !Array.isArray(body))
     ? (body.data && typeof body.data === 'object' ? body.data : body) : {};
   ```
   (A real crash already happened: `/attendance/overview` returned `{ message }` and `overview[date].reduce` failed. Guard every `Object.keys(x).map(k => x[k].reduce(...))`-style pattern.)
6. **Build must be clean:** `CI=true npm run build` passes with **zero ESLint warnings** (CI treats warnings as errors). No console errors or React key warnings at runtime.

---

## 2. Brand

| Item | Value |
|---|---|
| Product name | **AeroAttendance** (portal: "AeroAttendance HR Portal") |
| Company | **Aerowheels** — tagline "Delivering Promise" |
| Full logo (wordmark) | `/aerowheels-logo.png` (public folder) |
| Logo mark (icon) | `/aerowheels-mark.png` |
| Favicon / PWA | `/favicon.ico`, `/favicon.png`, `/logo192.png`, `/logo512.png` (already generated) |
| Address | Plot No. 498, Ground Floor, Kh-433/1 & 433/2, Block-A, Mahipulpur Extension, New Delhi, India - 110037 |
| Phone | 011-46658638 |
| Email | marketing@aerowheels.co.in |
| Website | https://www.aerowheels.co.in/ |

- All of these live in **`src/config/brand.js`**. Import from there; never repeat the strings inline. `PublicDataContext` merges the server's `/public/site` brand over these defaults. Keep that behaviour, but fall back to `brand.js` when a server field is empty.
- `settings.companyName` / `settings.companyLogo` from `/settings` (admin-editable) override the name/logo in the panel headers when present.
- **"Fintradify" rule:** after the redesign, `grep -ri fintradify src public` must return nothing except the Play Store `appUrl` (package id `com.fintradify.hrportal`, which cannot change). This includes titles, alt text, placeholders, CSV file names, footers and copyright lines.

---

## 3. Design system (build this first)

Create `src/theme/tokens.css` with CSS custom properties, plus `src/components/ui/`. The same palette is used by the mobile app, so both products look like one brand.

**Colours**
- Primary navy `#0A1F8F`, dark `#06135C`, light `#2B45C4`, soft `#EEF1FC`
- Accent red `#D0142A`, soft `#FDECEE` (for CTAs, destructive actions and highlights only)
- Background `#F5F7FB`, surface `#FFFFFF`, border `#E6E9F2`, divider `#F0F2F7`
- Text `#0F172A`, secondary `#64748B`, muted `#94A3B8`
- Status: success `#16A34A`/`#DCFCE7`, warning `#D97706`/`#FEF3C7`, danger `#DC2626`/`#FEE2E2`, info `#2563EB`/`#DBEAFE`, WFH purple `#7C3AED`/`#EDE9FE`, office teal `#0F766E`/`#CCFBF1`
- Brand gradient: `linear-gradient(135deg, #06135C 0%, #0A1F8F 55%, #2B45C4 100%)` (hero, login side panel, KPI hero cards)

**Typography:** Inter (Google Fonts). Replace the current Plus Jakarta Sans link in `public/index.html`. Scale: 32/800 display, 24/700 h1, 20/700 h2, 16/600 h3, 14/400 body, 12/500 caption. Use tabular numbers for money, times and counts.

**Shape and depth:** radius 12 for inputs and buttons, 16 for cards, 20 for modals. Shadow `0 6px 18px rgba(15,23,42,.06)`, hover `0 10px 28px rgba(15,23,42,.10)`. Spacing on a 4-px grid. Page padding 24 on desktop, 16 on mobile.

**Theme:** light only for now. Remove or hide any dark-mode toggles.

**Component kit** (`src/components/ui/`, used everywhere, no one-off styling):
`Button` (primary / secondary / ghost / danger, sizes, loading), `IconButton`, `Card`, `StatCard` (icon badge, value, label, delta), `PageHeader` (title, subtitle, breadcrumbs, right-side actions), `Tabs`, `Badge` / `StatusBadge` (maps pending / approved / rejected / in-progress / completed / submitted / under_review / active / blocked / terminated / valid / revoked, case-insensitive), `DataTable` (sticky header, sortable columns, search, filters slot, pagination via `PaginationControls`, row actions menu, CSV export hook, responsive card view below 768 px), `EmptyState`, `ErrorState` (retry), `Skeleton` rows and cards, `Modal`, `Drawer` (side panel for details and forms), `ConfirmDialog`, `FormField` (label, hint, error), `Select`, `DateRangePicker` (native inputs styled), `FileDropzone` (drag and drop, size and type validation, progress), `Avatar` (photo or initials), `LockedModule`, `KpiGrid`, `ChartCard` (recharts wrapper with legend and empty state), `Toast` via `react-toastify` (one `ToastContainer`, top-right, brand-styled).

Replace `window.alert` / `window.confirm` everywhere with `Toast` / `ConfirmDialog`.

---

## 4. App shell and routing

- Keep the public routes in `src/App.js` as they are.
- Turn the panels' internal `activeTab` state into **URL routes** so that refresh, back/forward and deep links work. Use `/admin/:section?` and `/employee/:section?` with react-router v5, where `section` is one of the keys in section 6. An unknown or missing section redirects to the overview. Keep the old tab keys as the URL slugs.
- **Panel layout (admin and employee):**
  - **Left sidebar, 264 px, collapsible to 76 px.** At the top: logo mark plus "AeroAttendance" and a small "Admin" or "Employee" pill. Menu groups are listed in section 6, each item with an icon from `lucide-react`. The active item gets a soft navy background and a left accent bar. Locked modules show a lock icon.
  - **Top bar:** page title and breadcrumbs, a global search (admin: employees by name/ID), a notification bell with unread count (`GET /notifications/count`) and a dropdown of the latest 5, and a user menu (avatar, name, role, Profile, Change password, Logout).
  - **Mobile (<992 px):** the sidebar becomes an off-canvas drawer with a hamburger button. The employee panel also gets a bottom tab bar (Home, Attendance, Leave, Tasks, More).
  - **Content area:** `PageHeader`, then a max-width 1440 px container.
- Protect `/admin` and `/employee`. No token redirects to `/login`. A token with the wrong role redirects to that role's own panel. Decode `role` from the JWT payload or read it from `/employees/profile`.

---

## 5. Public website (marketing and legal)

All public pages share a new `Navbar` and `Footer`.

**Navbar:** sticky, white with blur on scroll. Full logo on the left. Links: Features, Pricing, About, Contact, Verify Certificate. On the right: a "Sign in" ghost button and a "Get the app" primary button (Play Store `appUrl`). Mobile hamburger menu.

**Footer:** navy gradient background. Logo in white on a rounded white chip. Tagline. Contact block (address, phone, email with icons). Link columns (Product, Company, Resources, Legal — the current `groups` in `Footer.js`). Website and email icon links. "© {year} Aerowheels. All rights reserved."

**Data source:** keep reading `GET /public/site` through `PublicDataContext` (brand, metrics, features, pricingPlans, pages) and `GET /public/performance?month=` for leaderboards. Static fallbacks come from `brand.js`.

| Route | Design |
|---|---|
| `/` Landing | Hero on the brand gradient: headline "Attendance & HR, delivered on promise.", a sub-copy line, "Sign in" and "Get the app" CTAs, and a floating dashboard mock (a styled card collage, no stock photos). Trust strip with live metrics from `metrics` (employees, attendance today, tasks, uptime). A features grid of 6 cards from `features`. A "How it works" 3-step section (Punch in with GPS → Manage leave & tasks → Payslips & documents). A mobile app section with the app screenshots area and the Play Store badge. A **Top performers** leaderboard (`/public/performance`, month selector, rank badges, avatar, score) with an empty state. A pricing teaser linking to `/pricing`. A contact CTA band. |
| `/features` | Module sections with alternating layout: Attendance (GPS geofence, WFH), Leave, Tasks, Payroll documents, Reimbursements, Documents/KYC, Certificates with QR verification, Admin analytics. |
| `/pricing` | 3 plan cards from `pricingPlans` (highlight the middle one), a feature comparison table, and an FAQ accordion. |
| `/about`, `/careers`, `/press`, `/community`, `/help`, `/docs`, `/api`, `/integrations`, `/status`, `/compliance`, `/privacy-policy`, `/terms`, `/cookies`, `/gdpr` | One shared **`PublicStaticPage`** template (already data-driven from `pages[key]`): a gradient page hero with eyebrow, title and summary; a sticky "On this page" table of contents for long pages; section cards; and a CTA band. Legal pages get a readable 72-character column, "Last updated", and print-friendly styles. `/status` shows an operational banner plus the metrics. |
| `/contact` | Two columns: contact cards (address with a Google Maps link, phone `tel:`, email `mailto:`, business hours) and a contact form. There is no backend endpoint for the form, so compose a `mailto:` with the subject and body prefilled, and show a success toast. |
| `/verify-certificate` | Search card (certificate no. / employee ID / email / phone) calling `GET /certificates/verify?q=`, reading `?certificateNo=` from the URL for QR scans. Result: an employee card plus certificate cards with a big "Verified" or "Revoked" seal, and **Preview** / **Download** buttons (`/certificates/preview/:no`, `/certificates/download/:no`). Clear not-found state. |

**SEO:** each route sets `document.title` to `"<Page> | AeroAttendance by Aerowheels"`. Keep and update the meta description and keywords in `public/index.html`.

---

## 6. Auth pages, Admin panel, Employee panel

### 6.1 `/login` and `/forgot-password`
- Split layout. The left half is the brand gradient with the white logo, a headline, three benefit bullets and a subtle illustration pattern. The right half holds the form card. On mobile, only the form is shown, with the logo on top.
- Tabs **Admin** and **Employee**. Employee has a sub-toggle between **Password** and **Email OTP**:
  - Password: `POST /auth/login {email, password}`.
  - OTP step 1: `POST /auth/login {email}` returns `{message: 'OTP sent to email'}`.
  - OTP step 2: `POST /auth/login {email, otp}`, with 4 OTP boxes, a 5:00 countdown and Resend.
- Show a password eye toggle, inline field errors, a loading button, and server `message` errors in an alert.
- Forgot password: step 1 is `POST /auth/employee-password/request-reset {email}`. Step 2 is `POST /auth/employee-password/reset {email, otp, password, confirmPassword}`, with a strength meter.
- Keep the existing privacy modal content, rebranded.

### 6.2 Admin panel `/admin/:section` — sidebar groups

| Group | Section key → existing component | Redesign notes |
|---|---|---|
| **Overview** | `overview` (in `AdminDashboard.js`) | Hero greeting card; KPI grid (total and active employees, present today %, pending leaves, pending WFH, open tasks, pending reimbursements, this-month payroll ₹); charts: attendance trend line (last 14 days from `/attendance/overview`), leave status donut, department bar, task completion radial; lists: recent attendance, pending approvals queue (leaves, WFH, attendance) with approve/reject inline; quick actions. All must be empty-safe. |
| | `reports-center` → `AdminReportsCenter` | Date-range filters, report cards with Download CSV, file names `aeroattendance-<report>-<from>-to-<to>.csv`. |
| **People** | `employee-list` → `EmployeeList` | `DataTable`: avatar, name, ID, position, department, status badge, joined, actions (view drawer, edit, block/unblock, terminate, delete). Filters: department, status. |
| | `add-employee` / `edit-employee` → `EmployeeForm` | Multi-step form in cards (Personal → Job → Bank → Access & modules → Photo) with a sticky save bar. Module access toggles (`access.portal/attendance/tasks/leave/salary/documents/reimbursements/workFromHome`) plus `accessReason`. |
| | `block-employees` / `unblock-employees` → `EmployeeList` | Same table, pre-filtered, with bulk actions. |
| | `teams` → `EmployeeTeams` | Team cards with online dots, hours today, today's tasks. |
| | `tracking` → `EmployeeTracking` | Full-height Leaflet map with a side list of employees and last-seen times. Keep the existing leaflet marker fix. |
| **Attendance** | `attendance` → `AttendanceTable` | Table with date range, status filter, CSV download (`/attendance/download`). |
| | `active-attendance` → `ActiveAttendance` | Live "working now" cards with pause/resume. |
| | `approved-attendance` / `rejected-attendance` → `AttendanceList` | Tables. |
| | `manual-attendance` → `ManualAttendance` | Form drawer plus table with edit/delete. |
| | `attendance-radius` → `AdminAttendanceRadius` | Map preview of the office point and radius circle, with inputs for lat, lng, radius and the WFH toggle. |
| **Leave & WFH** | `leaves` → `LeaveRequest` | Approval queue with tabs by status and approve/reject with remarks. |
| | `paid-leaves` → `PaidLeaves` | Balances table. |
| | `wfh` → `WFHRequest` | Queue with admin remarks. |
| **Work** | `tasks` → `AdminTasks` | Kanban board (Pending / In progress / Completed) plus a list toggle; create/edit drawer (title, description, assignee, priority, due date). |
| | `monthly-performance` → `AdminPerformanceReport` | Month picker, ranking table, score bars, "Send monthly emails" action. |
| **Payroll & Documents** | `salary` → `SalarySlip` | Generate form in a drawer with a live earnings/deductions summary; slips table with PDF download. |
| | `offer-letter` → `OfferLetter` | Form plus live A4 preview (uses `/offer-template-page1.jpg`, `/offer-template-page2.jpg`, which are already Aerowheels letterheads), with status actions. |
| | `relieving-letter` → `RelievingLetter` | Generate, list, send email. |
| | `certificates` → `CertificateManager` | Generate (signature and stamp uploads), list, revoke, preview/download, copy verify link. |
| | `documents` → `DocumentSubmission` | Review queue with a file preview modal and approve/reject with comment. |
| | `compliance-center` → `AdminComplianceCenter` | Per-employee checklist matrix (docs, offer, certificate, relieving). |
| | `reimbursements` → `AdminReimbursement` | Stats cards (`/reimbursements/stats`) plus claims table with attachment thumbnails and approve/reject reason. |
| **System** | `notifications` → `Notification` | Inbox grouped by day, mark read / mark all. |
| | `login-credentials` → `AdminCredentials` | Change admin email/password. |
| | `settings` → `AdminSettings` | Sectioned settings (Company: name, logo, banner, favicon uploads; Attendance; Leave; Notifications). Show the logo preview on a white chip. |

### 6.3 Employee panel `/employee/:section`

| Group | Section key → component | Redesign notes |
|---|---|---|
| **Home** | `profile` (dashboard in `EmployeeDashboard.js`) | Greeting hero; **punch card** (live timer, WFO/WFH badge, punch in/out via `POST /attendance/punch {type, location:{lat,lng}, address}` using browser geolocation, with a distance-to-office message on 403); KPI tiles (paid leave balance, open tasks, reimbursements pending, present this month); upcoming tasks; recent notifications. |
| **Attendance** | `attendance-calendar` → `AttendanceCalendar` | Month calendar with coloured status dots and a day detail drawer. |
| | `attendance` → `AttendanceTable` | Own records plus CSV (`/attendance/download/my-attendance`). |
| **Leave** | `leaves` → `LeaveRequest` | Balance cards (`/leaves/my-balances`), apply form (paid / unpaid / half-day, date range, reason, day count), history. |
| | `wfh` → `WFHRequest` | Today banner (`/wfh/today-status`), request form, history, cancel pending. |
| **Work** | `tasks` → `EmployeeTasks` | Kanban with Start / Complete (submission note). |
| **Pay & Docs** | `salary` → `SalarySlip` | Payslip cards plus detail drawer with breakdown and PDF download. |
| | `reimbursements` → `EmployeeReimbursement` | Summary plus claim form with `FileDropzone` (max 5 files). |
| | `documents` → `DocumentSubmission` | KYC checklist grid plus upload (10 MB limit). |
| | `certificates` → `CertificateManager` | Own certificates with preview/download. |
| **Account** | `notifications`, `edit-profile` → `EmployeeProfileEdit` (photo upload), `settings` → `EmployeeSettings`, `change-password` → `EmployeePasswordSettings` | Clean forms in cards. |

Module locks: read `access` from `GET /employees/profile`. When a flag is `false`, show a lock icon in the sidebar and render `LockedModule` instead of the section.

---

## 7. Endpoint map (must stay wired)

Response shapes vary. Always parse with `asList` / `asObject`.

- **Auth:** `POST /auth/login`, `POST /auth/employee-password/request-reset`, `POST /auth/employee-password/reset`
- **Employees:**
  - `GET /employees` (bare array)
  - `POST /employees`, `PUT /employees/:id`, `DELETE /employees/:id`
  - `PUT /employees/:id/block|unblock|terminate|enable`
  - `GET/PUT /employees/profile`, `PUT /employees/profile/password`
  - `POST /employees/upload-photo`, `POST /employees/:id/upload-photo` (multipart `photo`)
  - `PUT /employees/admin/credentials`
- **Attendance:**
  - `GET /attendance` (bare array, or `{data, pagination}` when `page`/`limit` are sent)
  - `GET /attendance/my-attendance`, `/attendance/overview` (date → rows map), `/attendance/active`, `/attendance/approved`, `/attendance/rejected`, `/attendance/pending`
  - `GET /attendance/download`, `/attendance/download/my-attendance` (CSV blobs)
  - `POST /attendance/punch`, `POST /attendance/admin/punch`, `PUT /attendance/admin/edit/:id`, `DELETE /attendance/admin/delete/:id`, `PUT /attendance/admin/approve|reject|pause|resume/:id`
- **Leave:** `GET /leaves` (bare), `/leaves/my-leaves` (bare), `/leaves/my-balances`, `/leaves/balances`, `/leaves/history`; `POST /leaves`; `PUT /leaves/:id`
- **WFH:** `GET /wfh` (bare), `/wfh/my-requests` (bare), `/wfh/today-status`; `POST /wfh`; `PUT /wfh/:id`; `DELETE /wfh/:id`
- **Tasks:** `GET /tasks` (`{success,data}`), `/tasks/my-tasks`, `/tasks/all-tasks`; `POST /tasks`; `PUT /tasks/:id`
- **Salary:** `GET /salary`, `/salary/my-slips` (`{success,data}`); `POST /salary`; `GET /salary/download/:id` (PDF blob)
- **Reimbursements:** `GET /reimbursements`, `/reimbursements/my`, `/reimbursements/stats`; `POST /reimbursements` (multipart `attachments[]`); `PUT /reimbursements/:id/status`; `DELETE /reimbursements/:id`
- **Documents:** `GET /document-submissions`, `/document-submissions/my`; `POST /document-submissions` (multipart `document`); `PUT /document-submissions/:id/status`; `DELETE /document-submissions/:id`
- **Letters and certificates:**
  - `GET/POST /offer`, `/offer/generate`, `PUT /offer/:id/status`, `DELETE /offer/:id`
  - `GET /relieving`, `POST /relieving/generate`, `POST /relieving/send-email`, `DELETE /relieving/:id`
  - `GET /certificates`, `/certificates/my`, `POST /certificates/generate`, `PUT /certificates/:id`, `PUT /certificates/:id/revoke`, `DELETE /certificates/:id`, `GET /certificates/verify`, `/certificates/preview/:no`, `/certificates/download/:no`
- **Other:**
  - `GET /notifications/:userId` (bare), `/notifications/count`; `PUT /notifications/:id/read`
  - `GET /teams`, `GET /tracking`
  - `GET /performance/monthly`, `POST /performance/monthly-email`
  - `GET /dashboard/metrics`
  - `GET/PUT /settings`, `PUT /settings/attendance|leave|notifications`, `POST /settings/reset|logo|banner|favicon`, `GET /settings/employee`, `/settings/public`
  - `GET /public/site`, `/public/performance`

File downloads: request with `responseType: 'blob'`, then save through an object URL with a branded filename. Show a toast on success and error.

---

## 8. Quality bar

- **Responsive** at 360, 768, 1024 and 1440 px. No horizontal page scroll. Tables switch to cards on mobile.
- **Accessibility:** semantic landmarks, visible focus rings (navy 2 px), `aria-label` on icon buttons, colour contrast at AA or better, forms connected to labels, modals trap focus and close on Esc.
- **Loading states:** skeletons on first load, button spinners on submit, optimistic toggles where safe.
- **Performance:** lazy-load the admin and employee panels and the Leaflet/Chart sections with `React.lazy` + `Suspense`. Avoid re-fetching on every tab switch; cache per section until a mutation.
- **Code organisation:**
  - `src/theme/` — tokens
  - `src/components/ui/` — kit
  - `src/layouts/` — `PublicLayout`, `PanelLayout`
  - `src/features/<module>/` — for sections you rewrite
  - `src/utils/` — `asList`, download helper, date/currency formatters (IST, `en-IN`, ₹)
- **Cleanup:** move the huge inline `<style jsx>` blocks out of `AdminDashboard.js` and `EmployeeDashboard.js` into CSS modules or plain CSS files, and delete dead styles.
- Remove unused components and imports so ESLint stays clean.

---

## 9. Acceptance checklist

1. `CI=true npm run build` succeeds with no warnings, and `npm start` shows no console errors.
2. `grep -ri fintradify src public` returns only the Play Store package id in `brand.js`.
3. With a **fresh database** (1 admin, no other data), every admin and employee section opens without errors and shows friendly empty states.
4. Admin can: create an employee, approve/reject leave, WFH and attendance, create a task, generate a salary slip / offer / relieving letter / certificate and download each PDF, review documents and reimbursements, change settings and the logo.
5. Employee can: log in with password and with OTP, punch in/out, apply leave and WFH, complete a task, download a payslip and attendance CSV, upload a document and a reimbursement, edit profile and photo, change password.
6. Public site: every route renders with the new layout, certificate verification works from a QR link, and every contact link uses the Aerowheels details.
7. Every screen follows the design tokens. There are no default Bootstrap-blue buttons and no leftover unstyled tables.

Work in this order: tokens and UI kit → layouts and routing → login pages → admin overview → admin sections (grouped as in 6.2) → employee panel → public site → cleanup and the acceptance checklist. Run `CI=true npm run build` after each group and fix issues before moving on.
