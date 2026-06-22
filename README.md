# Pious Muslim Women International Organization

A full-stack website for the NGO, built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Prisma 7 + SQLite**.

## What it does

- **Brand theme** drawn from the logo: **Forest Green** `#1A6B3A` (primary), **Deep Green** `#1A3A2A` (nav/headings/body), **Crimson** `#C0392B` (accents/CTAs), on **Warm Ivory** `#F5F1EB` / **Sand** `#EDE7DA` backgrounds. Defined as Tailwind tokens (`brand-*`, `crimson-*`) in `src/app/globals.css`, so the whole app re-themes from one place.
- **Multipage public site**: Home, **About** (`/about`), **What We Do** (`/programs`), **Gallery** (`/gallery`) and **Contact** (`/contact`) — each with detailed content and a shared header/footer. Contact submissions notify admins.
- **Admin-managed gallery**: Administrators upload photos and assign a category at `/dashboard/gallery` (stored via the 10MB upload pipeline, served by `/api/gallery/[id]`). The public gallery is **filterable by category** and falls back to demo images until real ones are uploaded.
- **Landing page** highlighting the three core programs — **Empowerment**, **Orphanage Care**, and **Scholarships** for brilliant & needy public-school students.
- **Membership**: visitors can **register** (name, email, confirmed password) and **log in with their User ID or email**. Everyone gets a unique **User ID** (e.g. `PMW-T8N99G`); for Members it doubles as their **Referee ID**.
- **Referee-gated applications**: to apply, an applicant must **enter a member's Referee ID and validate it** — the form stays locked until a real referee is confirmed, and it's re-validated server-side on submit. Applying creates a **Beneficiary account** so the applicant can log in and track progress.

### Roles & approval workflow

Five role-based profiles, each with its own dashboard and permissions:

| Role | Dashboard highlights |
|------|----------------------|
| **Executive** | Final approver. 12 KPIs + **6 live charts**, quorum approval queue, payment final-approval, projects & activities. Manages users & settings. |
| **Board Member** | Review queue with **quorum voting** (approve/reject + comments), payment approvals, program statistics. |
| **Administrator** | User statistics, **user management** (create/disable), program & payment statistics, activity logs, quorum settings. |
| **Finance Officer** | **Enters payments** for approved beneficiaries and monitors the payment pipeline. |
| **Member / Referee** | Referral stats, **confirms or rejects** beneficiaries they're named on, tracks all referred applications. |
| **Beneficiary** | Application status with a **stage stepper**, submitted documents, payment status, notifications. |

**Quorum approvals.** There can be multiple Executives and Board members. A configurable number must approve at each stage (e.g. *3 of 5*) — set under **Settings → Quorum** (`boardQuorum`, `executiveQuorum`). Each member votes once per stage; the first decision to reach quorum wins, and a quorum is capped at the number of active members in that role. Every card shows live progress ("2 approve · 0 reject", "Approvals needed: 2 of 5").

**Application flow:** Beneficiary applies → Referee confirms (vouches they know them) → **Board quorum** recommends → **Executive quorum** approves → application granted.

**Programs & forms.**
- **Orphanage** and **Scholarship** are open to the public via `/apply`, capturing full applicant data (first/last name, email, contact phone, country, **NIN**, residential address, **guardian** name/relationship/phone, and — for scholarships — **school name, class, academic year**). Stored per-application as JSON in `Application.formData`.
- **Empowerment** is **members-only** and removed from the public form/landing page. Members apply from **Dashboard → Empowerment** when the window is open; their name, email, User ID and phone are **prefilled** from their account, and they add purpose, desired amount, cover letter, why-needed, sustainability plan, and an **optional** member referee.
- **Empowerment window:** an Admin/Executive opens or closes it under **Settings**. When closed, the member's "Empowerment" menu item is **grayed out** and the page is locked.

**Application detail & audit.** Every application has a detail page (`/dashboard/applications/[id]`, reachable via the **View** link in tables and **View full details** on review cards) showing all submitted fields, a stage stepper, the full **review/recommendation audit trail** (who reviewed, their role, decision, comment and date across referee → board → executive), the **payment approval trail**, documents, and — when it's the viewer's turn — the vote form to act right there.

**Payment flow (multi-level):** once an application is approved, a **Finance Officer enters the payment** → it needs **Board** approval (quorum) → then **Executive** final approval (quorum), at which point the funds are disbursed and the beneficiary is notified. Every vote is recorded in a `PaymentApproval` trail. Each step also writes notifications and an activity-log entry.

### Dashboard navigation

The dashboard uses a **sidebar layout** (collapses to a drawer on mobile) with role-aware sections:

- **Overview** — role-specific KPIs, charts, and action queues.
- **Applications** — filterable table (search + program + status). Scoped per role: staff see all, members see their referrals, beneficiaries see their own.
- **Members** — filterable directory of all members (referees) with referral counts.
- **Beneficiaries** — program rosters with sub-menus for **Orphanage / Scholarship / Empowerment**, each a filterable table.
- **Payments** — totals, **allocated money per month** (table + charts), and a filterable payments list. *(Executive/Admin)*
- **Audit Logs** — full, filterable action trail. *(Executive/Admin)*
- **Users** — create staff users and enable/disable accounts. *(Executive/Admin)*

Every table supports free-text search, dropdown filters, and **pagination** (10/page), with live result counts. Each row links to a full **application detail page** that previews the applicant's submitted data, the review/audit trail, payments, and document previews — so reviewers can inspect before acting and audit afterwards.

### Profiles, forms & uploads

- **Profiles** — every user can edit their profile (name, phone, country, profile image) and **change their password** at `/dashboard/profile`. A public **forgot/reset-password** flow (`/forgot-password`) issues a single-use, time-limited token. *(No email service is wired, so the reset link is shown on screen — swap in email for production.)*
- **Empowerment** is **members-only** behind an **open/close window** the Administrator toggles in **Settings**. When closed, the sidebar item is greyed out and the action is blocked server-side. The form prefills the member's details and uses a **WYSIWYG editor** for the cover letter, why-needed and sustainability plan (HTML is sanitized on save). An optional member referee can be named.
- **Public forms** (Orphanage/Scholarship) capture full applicant details — name, guardian, NIN, address, contact. **Scholarship** adds State (Kwara/Oyo/Lagos/Ogun/Osun), term, school type (Primary/Secondary), school ownership (Public/Federal/State — private isn't eligible), and student category (Needy/Brilliant), with awards capped at **₦50,000** (enforced at payment entry). **Orphanage** adds class type (Primary/Secondary/Tertiary) and need (Clothing/Health/Feeding/Tuition/Stipends). Orphanage applicants can upload a **photo**; all forms accept a **supporting document** (image/PDF, **max 10MB**), served through an **auth-gated route** with inline preview.
- **Form builder** — Administrators/Executives can add custom fields (text, textarea, number, select) per program at `/dashboard/form-fields`. They render dynamically on the matching application form and are captured into the application.
- **Scholarships** record a **start/end period** (set by staff on the detail page; shown on the scholarship roster *and* on the Executive/Board/Admin dashboards) and support **re-application/renewal**, which clones the application for a fresh review cycle.
- **Application detail** is a cascade view: applicant data + admin custom fields, the review/audit trail, documents (with preview), and a **month-by-month benefit breakdown** of everything the beneficiary has been disbursed.
- The **profile link lives in the sidebar** (not the top bar), alongside the role's other sections.

**Account creation** is secure: public sign-up only ever creates Members/Beneficiaries. Staff accounts (Executive, Board, Administrator, Finance, **State Coordinator**) are seeded and created in-app by the Administrator/Executive. **New member registrations are held for admin approval** — they can't log in until an Administrator approves them on the Users page.

**State Coordinators** are a region-scoped role: each covers one or more states. **Scholarship applications must be nominated by a State Coordinator** (not a regular member) — the apply form's referee field becomes a "State Coordinator ID", and the applicant's State dropdown is restricted to the states that coordinator covers (re-checked server-side). Coordinators get a **Scholarship Monitoring** dashboard (their nominees, payment status, breakdown per month / session / term) and submit **per-term performance reports** with the student's **position in class** (e.g. "3rd of 34") and an uploaded result — visible to the Board and Executive on the application's detail page.

### Demo accounts (after seeding)

All use password **`Password123`**:

| Role | Login (User ID or email) |
|------|--------------------------|
| Executive | `PMW-EXEC01` · `executive@pmwio.org` (also `PMW-EXEC02`) |
| Board Member | `PMW-BOARD1` · `board@pmwio.org` (also `PMW-BOARD2`, `PMW-BOARD3`) |
| Administrator | `PMW-ADMIN1` · `admin@pmwio.org` |
| Finance Officer | `PMW-FIN001` · `finance@pmwio.org` |
| Member / Referee | `PMW-MEMB01` · `member@pmwio.org` |
| Beneficiary | `PMW-BEN001` · `beneficiary1@example.com` |

> The seed ships **2 executives** and **3 board members** with the quorum set to **2** — so you can watch an approval reach quorum by voting as two different people.

Seed (or reset) the demo data in development by visiting **`/api/seed?confirm=reset-demo-data`** (disabled in production). The seed logic lives in `src/lib/seed.ts`.

## Tech & structure

```
src/
  app/
    page.tsx            Landing page
    login/ register/    Auth pages (login by User ID or email)
    apply/              Public application (referee-gated; creates a Beneficiary account)
    dashboard/          Sidebar layout + sections:
      layout.tsx          Sidebar/topbar chrome (auth-gated)
      page.tsx            Overview (role-specific)
      applications/ members/ beneficiaries/ payments/ audit/ users/ notifications/
    logout/route.ts     Clears the session cookie
    api/seed/route.ts   Dev-only demo data seeder (token-guarded)
    actions/            Server Actions: auth, apply, workflow (approvals), beneficiary
  components/
    dashboard/          DashboardChrome (sidebar), DataTable, Charts (Recharts),
                        PageHeader, UI primitives, roles/* overviews
    forms/              Login, register, apply, create-user forms
  lib/
    db.ts               Prisma client (SQLite via better-sqlite3 adapter)
    auth.ts             Password hashing (bcrypt) + User ID / reference generation
    session.ts          Signed httpOnly cookie sessions (JWT via jose) + getCurrentUser
    roles.ts            Roles, permissions (RBAC), labels
    status.ts           Application workflow statuses + styling
    stats.ts            Executive KPIs + chart series
    content.ts          Org copy, program definitions, labels
    seed.ts             Demo dataset
prisma/schema.prisma    User, Application, Review, Document, Payment,
                        Notification, Project, Activity, ActivityLog
```

Authentication uses a signed JWT stored in an **httpOnly cookie** (no third-party auth service). Passwords are hashed with **bcrypt**.

## Running it locally

> **Node.js** was installed at `~/.local/node/v24.16.0` and added to your shell profile, so a normal terminal already has `node`/`npm`.

```bash
cd "pmw-site"
npm install          # first time only
npm run dev          # start the dev server → http://localhost:3000
```

Other useful commands:

```bash
npm run build && npm start      # production build + serve
npx prisma studio               # browse/edit the database in a GUI
npx prisma migrate dev          # apply schema changes
```

## Environment variables (`.env`)

- `DATABASE_URL` — SQLite file location (default `file:./dev.db`).
- `SESSION_SECRET` — random secret used to sign session cookies (already generated). **Set a new one in production.**
- `PAYSTACK_SECRET_KEY` — Paystack secret key used only by server actions and webhook verification.
- `APP_URL` — deployed site origin used for Paystack callback URLs, e.g. `https://example.org`.

Configure the Paystack webhook URL as:

```text
https://your-domain.example/api/paystack/webhook
```

Use Paystack test keys until callback verification, webhook delivery, campaign donations and monthly subscription renewals have all been tested.

`.env` and the SQLite database are git-ignored.

## Deploying

The app is a standard Next.js project and deploys to any Node host (Vercel, Render, a VPS, etc.).

- **Database**: SQLite is great for local/small deployments. For a serverless host like Vercel, switch to a hosted database (e.g. Postgres): change the `datasource` provider in `prisma/schema.prisma` and swap the adapter in `src/lib/db.ts` for `@prisma/adapter-pg`, then set `DATABASE_URL` accordingly.
- Always set a strong `SESSION_SECRET` in the production environment.

## Ideas for next steps

- **Email/SMS notifications** to mirror the in-app notifications when an application changes stage.
- **Real document uploads** (currently documents are recorded by name/reference) via S3 or similar.
- **Report exports** (CSV/PDF) for the Executive and Administrator "Generate reports" permission.
- **Configurable forms & workflows** for the Administrator (currently the workflow is fixed in code).
- A real logo/brand image and program photography; password reset flow.
