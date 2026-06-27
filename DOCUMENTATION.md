# Pious Muslim Women International Organization — Solution Documentation

A full-stack web platform for the **Pious Muslim Women International Organization (PMWIO)**, a global Islamic NGO. It combines a public marketing website with a **role-based operations dashboard** that runs the organization's three programs — **Empowerment**, **Orphanage Care**, and **Scholarships** — end to end: from public application through a multi-stage review and approval workflow, payment disbursement, and post-award academic monitoring.

> This document is the full reference. For a quick start, see [`README.md`](./README.md).

---

## Table of contents

1. [Technology stack](#1-technology-stack)
2. [Getting started](#2-getting-started)
3. [User roles & permissions](#3-user-roles--permissions)
4. [The application workflow](#4-the-application-workflow)
5. [Feature reference](#5-feature-reference)
6. [Data model](#6-data-model)
7. [Project structure](#7-project-structure)
8. [Demo accounts](#8-demo-accounts)
9. [Administration guide](#9-administration-guide)
10. [Security](#10-security)
11. [Deployment](#11-deployment)
12. [Known limitations & roadmap](#12-known-limitations--roadmap)

---

## 1. Technology stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router, React Server Components, Server Actions) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** (theme tokens in `src/app/globals.css`) |
| Database | **SQLite** via **Prisma 7** (`@prisma/adapter-better-sqlite3`) |
| Auth | Custom — **bcrypt** password hashing + signed **JWT** session in an httpOnly cookie (`jose`). No third-party auth service. |
| Charts | **Recharts** |
| Validation | **zod** |
| Uploads | Local filesystem (`./uploads`), served through auth-gated route handlers |

**Design language:** the theme is drawn from the PMWIO logo — Forest Green `#1A6B3A` (primary), Deep Green `#1A3A2A` (nav/headings), Crimson `#C0392B` (accents/CTAs), on Warm Ivory `#F5F1EB` / Sand `#EDE7DA` backgrounds. All colors are Tailwind tokens (`brand-*`, `crimson-*`), so the whole app re-themes from one file.

---

## 2. Getting started

### Prerequisites
- **Node.js 20+** (developed on Node 24) and npm.

### Setup
```bash
git clone <your-repo-url>
cd pmw-site

npm install              # also runs `prisma generate` via postinstall
cp .env.example .env     # then edit SESSION_SECRET (see the comment in the file)

npx prisma migrate dev   # creates the SQLite database (dev.db) and tables
npm run dev              # http://localhost:3000
```

### Load demo data (development only)
Visit **`http://localhost:3000/api/seed?confirm=reset-demo-data`** in your browser. This wipes and reloads a complete demo dataset (users for every role, applications across all stages, payments, gallery fallbacks, term reports, etc.) and returns the demo login credentials. The endpoint is disabled when `NODE_ENV=production`.

### Useful commands
```bash
npm run dev            # development server (hot reload)
npm run build          # production build
npm run start          # production server (auto-builds first via prestart)
npx prisma studio      # browse/edit the database in a GUI
npx prisma migrate dev # apply schema changes during development
```

### Environment variables (`.env`)
- `DATABASE_URL` — SQLite file location (default `file:./dev.db`).
- `SESSION_SECRET` — random secret signing session cookies. **Always set a strong value in production.**

---

## 3. User roles & permissions

There are **seven roles**. Public sign-up only ever creates **Members** or **Beneficiaries**; all staff roles are created in-app by an Administrator/Executive.

| Role | Purpose | Key dashboard |
|------|---------|---------------|
| **Executive** | Final approving authority | KPIs + 6 charts, final approval queue, payment approval, scholarship periods, projects/activities |
| **Board Member** | Reviews applications before the Executive | Review queue, recommend approve/reject with comments, program stats |
| **Administrator** | Daily operations | Member approvals, user management, form builder, gallery, settings, audit logs |
| **Finance Officer** | Enters & processes payments | Payments pipeline, allocations per month |
| **State Coordinator** | Nominates & monitors scholarship beneficiaries in their state(s) | Scholarship monitoring, per-term reports & result uploads |
| **Member / Referee** | Refers and vouches for beneficiaries | Referrals, confirm/reject referrals, empowerment application |
| **Beneficiary** | Applicant seeking support | Application status (stage stepper), documents, payments, notifications |

Roles, labels and a permission matrix live in [`src/lib/roles.ts`](./src/lib/roles.ts). Every server action and protected page re-checks the caller's role server-side.

---

## 4. The application workflow

Applications move through a multi-stage pipeline. Each transition writes a review/comment trail, in-app notifications, and an audit-log entry.

```
Beneficiary applies
        │   (referee-gated: a valid Referee/Coordinator ID is required & re-checked server-side)
        ▼
PENDING_REFEREE ──► Referee/Coordinator confirms they know the applicant
        │
        ▼
PENDING_BOARD ──► Board members recommend (quorum of recommendations)
        │
        ▼
PENDING_EXECUTIVE ──► Executives approve/reject (quorum of approvals)
        │
        ├──► APPROVED ──► Finance enters a payment ──► Board ➜ Executive approve payment ──► COMPLETED (disbursed)
        └──► REJECTED
```

- **Empowerment** is members-only and skips the referee gate (the applicant is already a trusted member); it enters at `PENDING_BOARD`. An optional member referee can be named.
- **Scholarships** must be nominated by a **State Coordinator** whose covered states include the applicant's state.
- **Orphanage** applications are referred by any member.
- **Quorums** (how many board recommendations / executive approvals are required) are configurable in **Settings**.
- **Payments** themselves go through a Finance → Board → Executive approval chain before being marked disbursed.

Statuses, labels and styling are defined in [`src/lib/status.ts`](./src/lib/status.ts).

---

## 5. Feature reference

### Public website (multipage)
- **Home** (`/`) — hero, impact stats, program previews, gallery preview, CTAs.
- **About** (`/about`) — mission, founder's message, "how we do it", values.
- **What We Do** (`/programs`) — each program in depth: description, eligibility, how to apply.
- **Gallery** (`/gallery`) — admin-managed **photo albums** in a blog-style grid (feature image + title/description, filterable by category). Clicking an album opens a **lightbox**: an image carousel on one side and the album's title, description and date on the other. Admins bulk-upload images into an album (captions optional) and can **edit published albums** (details, captions, add/remove photos).
- **Contact** (`/contact`) — org details + a contact form that notifies admins.

### Membership & accounts
- **Registration** with a confirmed password. New members are **held for admin approval** before they can log in (verifying they are genuine members).
- **Login** with **User ID or email**. Every account has a unique **User ID** (`PMW-XXXXXX`); for Members/Coordinators it doubles as their **Referee/Coordinator ID**.
- **Profile** management (name, phone, country, avatar upload) and **change password**, plus a token-based **forgot/reset password** flow.

### Applications
- **Referee-gated apply form** — the applicant validates a referee before the form unlocks; re-validated server-side.
- **Rich program-specific fields** captured into the application:
  - *Scholarship:* state, term, school type (Primary/Secondary), school ownership (Public/Federal/State — private not eligible), student category (Needy/Brilliant), school name/class/year. Awards capped at **₦50,000**.
  - *Orphanage:* class type (Primary/Secondary/Tertiary), type of need (Clothing/Health/Feeding/Tuition/Stipends), guardian & NIN details, **applicant photo upload**.
  - *Empowerment:* purpose, desired amount, and **WYSIWYG** cover letter / why-needed / sustainability plan, with an optional supporting document.
- **File uploads** (images/PDF, max **10 MB**) with **inline preview** through auth-gated routes.
- **Custom fields** — Administrators can add fields (text/textarea/number/select) per program via the **Form Builder**; they render dynamically on the relevant form and are captured with the application.

### Review, approval & monitoring
- **Application detail page** — a cascade view of all applicant data + custom fields, the full review/audit trail, documents (with preview), a **month-by-month benefit breakdown**, and (for scholarships) academic reports.
- **Scholarship monitoring** (`/dashboard/scholarships`) — all scholarship beneficiaries (or just a coordinator's nominees), payment status, and breakdowns **per month** and **per session & term**.
- **State Coordinator term reports** — coordinators submit per-term **performance reports** with the student's **position in class** (e.g. "3rd of 34") and an uploaded result; the Board and Executive see these on the detail page.

### Dashboards & tables
- A **sidebar layout** with role-aware navigation (collapses to a drawer on mobile).
- Reusable **filterable, paginated tables** (search + dropdown filters) across Applications, Members, Beneficiaries, Payments, Audit Logs and Users.
- The **Executive overview** renders 6 live charts (monthly applications/approvals, payment trends, beneficiary & geographic distribution, program performance).

---

## 6. Data model

Defined in [`prisma/schema.prisma`](./prisma/schema.prisma):

| Model | Purpose |
|-------|---------|
| `User` | All accounts. `role`, `approved` (member approval gate), `states` (coordinator coverage), `active`, `imagePath`. |
| `Application` | A request for support. `category`, `status`, applicant fields, `formData` (JSON of program-specific & custom fields), scholarship period, referral linkage. |
| `Review` | A referee/board/executive comment & recommendation — the audit trail. |
| `Document` | Uploaded supporting files / photos / results (stored on disk; metadata in DB). |
| `Payment` + `PaymentApproval` | Disbursements and their Finance→Board→Executive approval chain. |
| `TermReport` | A coordinator's per-term report on a scholarship beneficiary (position, class size, performance, result file). |
| `FormField` | Admin-defined custom form fields. |
| `GalleryImage` | Admin-managed gallery photos by category. |
| `Notification` | In-app notifications. |
| `Project`, `Activity` | Org projects and upcoming activities (Executive dashboard). |
| `ActivityLog` | System-wide audit log. |
| `Settings` | Singleton: board/executive quorums, empowerment window open/closed. |
| `PasswordReset` | Single-use, time-limited password reset tokens. |

---

## 7. Project structure

```
src/
  app/
    page.tsx  about/  programs/  gallery/  contact/   Public marketing pages
    login/  register/  forgot-password/  reset-password/
    apply/                         Public, referee-gated application
    dashboard/                     Sidebar layout + role-aware sections:
      page.tsx                       Overview (renders the role's dashboard)
      applications/  members/  beneficiaries/  scholarships/
      payments/  audit/  users/  form-fields/  gallery/
      settings/  empowerment/  notifications/  profile/
      applications/[id]/             Application detail (review, audit, reports)
    api/
      seed/                          Dev-only demo seeder (token-guarded)
      files/[id]/  avatar/[id]/  gallery/[id]/   Auth-gated file serving
    logout/                          Clears the session cookie
    actions/                         Server Actions (auth, apply, workflow,
                                     empowerment, reports, gallery, formFields,
                                     contact, profile, scholarship)
  components/
    dashboard/                       Sidebar, DataTable, Charts, role dashboards,
                                     forms (create user, gallery, term report, …)
    forms/                           Login, register, apply, WYSIWYG editor, …
    SiteHeader / SiteFooter / GallerySection / MarketingHero / …
  lib/
    db.ts          Prisma client (SQLite via better-sqlite3 adapter)
    auth.ts        Password hashing + ID/reference generation
    session.ts     httpOnly cookie JWT sessions + getCurrentUser
    roles.ts       Roles, permissions, covered states
    status.ts      Workflow statuses + styling
    stats.ts       Executive KPIs + chart series
    content.ts     Org copy, program definitions, option sets, labels
    formFields.ts  Custom field loading
    gallery.ts     Gallery data (DB or demo fallback)
    uploads.ts     File validation + storage
    sanitize.ts    WYSIWYG HTML sanitizer
    settings.ts    Settings + quorum helpers
prisma/schema.prisma   Data model & migrations
```

---

## 8. Demo accounts

After seeding (`/api/seed?confirm=reset-demo-data`), all accounts use password **`Password123`**:

| Role | Login (User ID or email) |
|------|--------------------------|
| Executive | `PMW-EXEC01` · `executive@pmwio.org` |
| Board Member | `PMW-BOARD1` · `board@pmwio.org` |
| Administrator | `PMW-ADMIN1` · `admin@pmwio.org` |
| Finance Officer | `PMW-FIN001` · `finance@pmwio.org` |
| State Coordinator | `PMW-COORD1` · `coordinator@pmwio.org` (covers Kwara, Oyo, Lagos) |
| Member / Referee | `PMW-MEMB01` · `member@pmwio.org` |
| Beneficiary | `PMW-BEN001` · `beneficiary1@example.com` |

---

## 9. Administration guide

Administrators (and Executives) can:
- **Approve members** — the Users page shows a "Pending member approvals" queue; approve or decline new registrations.
- **Create staff users** — including assigning **states** to a State Coordinator.
- **Enable/disable** any account.
- **Build forms** — add custom application fields per program (Form Builder).
- **Manage the gallery** — upload photos and assign categories.
- **Configure settings** — board/executive quorums and the empowerment application window (open/closed).
- **Review audit logs** — a filterable trail of every significant action.

State Coordinators monitor and report on their scholarship beneficiaries; Finance enters payments that then flow through board/executive approval.

---

## 10. Security

- Passwords are hashed with **bcrypt**; sessions are signed **JWTs** in **httpOnly** cookies.
- **Every** server action and protected page re-checks the caller's role and ownership — the client UI is never the source of truth.
- The **referee gate** is re-validated server-side; scholarship state restrictions are enforced server-side.
- **File serving is auth-gated** — documents/results are only served to staff, the nominating coordinator, the referring member, or the owning beneficiary. Gallery images are public by design.
- Member registrations are **inactive until an admin approves** them.
- Uploaded WYSIWYG HTML is **sanitized** (strict tag allowlist, all attributes stripped) before storage.
- The seed endpoint is **disabled in production** and requires an explicit confirm token in development.
- `.env`, the SQLite database, and `uploads/` are git-ignored.

---

## 11. Deployment

The app is a standard Next.js project and deploys to any Node host.

- **Database:** SQLite is ideal for local/small deployments. For a serverless host (e.g. Vercel), switch to a hosted database such as Postgres: change the `datasource` provider in `prisma/schema.prisma`, swap the adapter in `src/lib/db.ts` for `@prisma/adapter-pg`, and set `DATABASE_URL` accordingly. Run `prisma migrate deploy` on release.
- **File uploads:** the local `./uploads` directory is fine for a single server, but is ephemeral on serverless platforms — move uploads to S3 (or similar) for production there.
- **Secrets:** set a strong `SESSION_SECRET` in the production environment.
- Always run `npm run build` before `npm run start` (the `prestart` script does this automatically).

---

## 12. Known limitations & roadmap

- **Email/SMS:** in-app notifications are implemented; outbound email/SMS (e.g. password-reset links, status updates) is not yet wired up. The reset flow currently surfaces the link in-app for demo purposes.
- **Contact inbox:** contact-form messages are recorded to the audit log and pushed as admin notifications; a dedicated managed inbox could be added.
- **Reports export:** "Generate reports" permissions exist; CSV/PDF export is a natural next step.
- **Configurable workflows:** the approval pipeline is fixed in code (quorums are configurable); a visual workflow builder is a future enhancement.
- **Photography & branding:** the gallery falls back to placeholder images until the admin uploads real photos.

---

*Built with Next.js, TypeScript, Tailwind CSS and Prisma.*

