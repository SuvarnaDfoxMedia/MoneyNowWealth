# MoneyNow Wealth - Complete Project Flow (Single Document)

This is the unified end-to-end flow document for the whole project, covering:
- Public website (`moneynow-frontend`)
- User dashboard (`moneynow-frontend` under `/user/*`)
- Admin/Editor panel (`backend`)
- API + DB + cron automation (`api`)

It is based on active code paths in controllers, routes, services, hooks, and schedulers.

## 1) Project Architecture

## 1.1 Apps and roles
- `api`: Express API, MongoDB models, email integrations, cron jobs
- `moneynow-frontend`: public website + authenticated user dashboard
- `backend`: admin/editor operational panel

Actors:
- Visitor: anonymous public user
- User: authenticated end user
- Admin: full CMS/subscription/newsletter/customer operations
- Editor: content + MF operations (as configured), limited vs admin

## 1.2 API startup lifecycle
On API boot (`src/index.ts`):
1. env load + DB connect
2. cron jobs start:
- Topic/Article publish scheduler (`startTopicScheduler`) every 5 min
- Subscription lifecycle scheduler (`startSubscriptionScheduler`) daily midnight IST
- Newsletter publish scheduler (`startNewsletterPublishScheduler`) every 1 min
3. middleware stack:
- CORS allowlist
- cookie parser + helmet
- selective rate limit for auth/newsletter/contact
- static `/uploads`
4. route registration under `/api/*`

## 1.3 Authentication/session model
- JWT token set in `token` cookie on register/login/google-login
- Protected API routes use `protect` middleware (cookie token + active user check)
- Role URLs use `roleFromUrl([roles])` and enforce URL-role == logged-in role

---

## 2) Public Website Flow (Step-0 onward)

## 2.1 Step 0: First landing
User can land on:
- home
- blog listing/detail pages
- cluster pages
- calculators pages
- contact page
- auth pages
- mutual fund pages

Public APIs involved (examples):
- `GET /api/topic/published`
- `GET /api/topic/published/slug/:slug`
- `GET /api/cluster/*`
- `GET /api/articles`
- `GET /api/newsletter-publications`
- `GET /api/mf/*` (main categories, categories, schemes, nfo, snapshots, home, filters)

## 2.2 Registration (email/password)
Frontend:
- `moneynow-frontend/src/app/auth/register/page.tsx`

API:
- `POST /api/auth/register`

Backend behavior (`authController.registerUser`):
1. Validate title/name/email/password/mobile/terms
2. Normalize and validate phone/country code
3. Create local user (`role=user`, `provider=local`)
4. Auto-assign Free plan (`userSubscriptionService.assignFreePlan`)
5. Send welcome email (best-effort)
6. Set JWT cookie and return token + user payload + subscription payload

Frontend currently redirects user to login page after successful registration.

## 2.3 Login (email/password)
Frontend:
- `moneynow-frontend/src/app/auth/login/page.tsx`

API:
- `POST /api/auth/login`

Backend behavior:
1. Validate credentials
2. Block deleted accounts
3. Set JWT cookie
4. Return user summary

Then frontend navigates to `/user/dashboard`.

## 2.4 Google login
Frontend:
- Google OAuth button in login page
- posts ID token to API

API:
- `POST /api/auth/google-login`

Backend behavior (`authController.googleLogin`):
1. Verify Google token with Google client
2. Find by googleId, else by email
3. If new user:
- create account (`provider=google`)
- try Free plan assignment
- send welcome email (best-effort)
4. Link googleId if needed
5. Set JWT cookie

## 2.5 Middleware protection for user pages
Frontend middleware (`moneynow-frontend/src/middleware.ts`):
- all `/user/*` routes require `token` cookie
- if missing -> redirect `/auth/login`

---

## 3) User Authenticated Journey

## 3.1 Session bootstrap
After login:
- `useFetchProfile` -> `GET /api/get-profile`
- `useUserId` -> `GET /api/auth/me`
- session-aware pages render dashboard data

## 3.2 Profile flow
APIs:
- `GET /api/get-profile`
- `GET /api/auth/me`
- `PUT /api/profile` (multipart for profile image)

Behavior:
- profile fields normalized in frontend store
- profile image path normalized to public URL
- update writes firstname/lastname split, mobile, countryCode, address, profile image

## 3.3 Dashboard flow
Dashboard pages include:
- `/user/dashboard`
- `/user/dashboard/profile`
- `/user/dashboard/subscription`
- `/user/dashboard/newsletter`
- `/user/dashboard/change-password`
- `/invoice/:id`

Data pulls include:
- latest recommendation blogs
- latest newsletter publications
- subscription/payment history

## 3.4 Subscription visibility and invoice flow
Frontend hook:
- `useSubscription` -> `GET /api/subscription-payment/history/:userId`

Invoice page:
- `GET /api/subscription-payment/invoice/:paymentId`

Displayed:
- plan name, amount, payment date, start/end validity, payment metadata

## 3.5 Change password flow
API:
- `POST /api/auth/change-password`

Backend:
- checks old password
- validates new password policy
- updates hash
- sends password-changed email (best-effort)

## 3.6 Forgot/reset flow
APIs:
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`

Reset email uses website link:
- `${WEBSITE_URL}/auth/set-new-password?token=...`

## 3.7 Logout flow
API:
- `POST /api/auth/logout`

Effect:
- cookie cleared, user session ends

---

## 4) Subscription Lifecycle (Detailed)

This is the most important state machine in project logic.

## 4.1 Data models involved
- `UserSubscription` (one per user, unique `user_id`)
- `UserSubscriptionPayment` (history entries, invoices)
- `SubscriptionPlan` (Free/Premium plan definitions)

`UserSubscription` tracks:
- plan type (`Free`/`Premium`)
- trial type
- start/end
- active/expired
- promotional flags
- eligibility flags (including `purchase_required`)
- transition history

`UserSubscriptionPayment` tracks:
- payment method/status/type
- exact `start_date` and `end_date` (invoice correctness)
- optional plan snapshot

## 4.2 Auto assignment on signup
During register/google-new-user:
- `assignFreePlan(userId)` runs
- if Free plan missing, service auto-creates default Free plan
- subscription row created/updated
- payment row created

## 4.3 Purchase/assignment paths
User-side APIs:
- `POST /api/subscriptions/purchase`
- `POST /api/subscription-payment/purchase`

Admin-side APIs:
- `POST /api/:role/subscriptions/create`
- `POST /api/:role/subscriptions/assign`
- `POST /api/:role/subscription-payment/create`

Common behavior:
1. Validate plan/user
2. check purchase eligibility
3. createOrUpdateSubscription(...)
4. create payment record
5. update `last_payment_id`
6. send activation/trial emails (some delayed)

## 4.4 Eligibility behavior
`checkPurchaseEligibility` currently allows normal premium purchase and mainly blocks reusing a zero-cost promotional premium plan if already consumed.

## 4.5 Daily subscription cron behavior
File: `src/cron/subscriptionCron.ts`
Schedule: daily at midnight IST

It performs:
1. Find expired active Premium subscriptions
2. Downgrade to Free using active Free plan duration
3. Write downgrade payment row with exact dates
4. Update eligibility:
- promotional expiry -> `purchase_required=true`
- always keeps premium purchase possible
5. Send emails:
- premium expired
- free activated
6. Grant promotional premium trial to eligible users:
- account age > 24h
- active free plan
- not used promotional trial before
7. Send reminder emails for premium expiring by next midnight

---

## 5) Blog/Content Flow (Cluster -> Topic -> Article)

## 5.1 Content hierarchy
- Cluster
- Topic (belongs to cluster)
- Article (belongs to topic)

## 5.2 Public consumption
Public APIs:
- `GET /api/cluster`
- `GET /api/cluster/first-topic-article/all`
- `GET /api/topic/published`
- `GET /api/topic/published/slug/:slug`
- `GET /api/topic/published/cluster/:clusterSlug/slug/:slug`
- `GET /api/articles`
- `GET /api/cluster/slug/:slug`

Filtering logic excludes deleted/unpublished and enforces publish date windows on published endpoints.

## 5.3 Admin/editor content operations
Role APIs:
- cluster CRUD/toggle
- topic CRUD/publish/toggle
- article CRUD/publish/toggle + section image upload

Publish behavior:
- publishing sets status + publish date
- `is_email_sent` reset to false on publish paths so scheduler can send notification

## 5.4 Blog notification pipeline (current)
Scheduler: `topicScheduler` every 5 min

Steps:
1. Finds today published topics/articles where `is_email_sent=false`
2. Builds active subscriber list from users with active subscription + valid email
3. Sends per-recipient blog notification:
- primary: GetResponse transactional email
- fallback: SMTP queue via existing email service
4. Marks `is_email_sent=true`

Important: blog notification is currently GetResponse-first with SMTP fallback.

---

## 6) Newsletter Flow

## 6.1 Public newsletter subscription
API:
- `POST /api/newsletter`

Behavior (`newsletterController.addNewsletter`):
1. validate email + terms
2. check duplicate subscriber
3. store subscriber
4. try add contact to GetResponse
5. send thank-you email (SMTP path)

## 6.2 Newsletter publications (admin)
APIs under:
- `/:role/newsletter-publications/*`

Admin can:
- create with file upload
- update
- publish now
- schedule
- send emails manually
- toggle status/delete/restore

## 6.3 Newsletter sending automation
Scheduler: `newsletterPublishCron` every 1 minute

Steps:
1. find newsletters ready to send (`publish_date<=now`, not sent)
2. read subscriber list
3. send newsletter emails via email service
4. mark sent timestamps/counters

## 6.4 Public newsletter listing
Public API:
- `GET /api/newsletter-publications`

Service returns only active + published for non-admin requests.

---

## 7) Contact Enquiry Flow

## 7.1 Public contact form submission
Frontend sends:
- `POST /api/contact-enquiries`

Backend stores enquiry for admin follow-up.

## 7.2 Admin contact management
Admin APIs:
- `GET /api/:role/contact-enquiries`
- `DELETE /api/:role/contact-enquiries/delete/:id`

## 7.3 Current mismatch to note
Frontend contact form currently also attempts:
- `POST /api/contact-thank-you`

This endpoint is not present in API routes right now. Main enquiry save still works, but this second call has no registered route.

---

## 8) Mutual Fund Module Flow

## 8.1 Public MF discovery
Public APIs:
- main categories
- categories
- schemes (by code/slug)
- nfo
- index snapshots
- mf home
- mf filters

Frontend MF pages consume these discovery/listing APIs for browsing.

## 8.2 Admin/editor MF operations
Role APIs allow CRUD/toggle for:
- main categories
- categories
- schemes
- NFO
- index snapshots

MF excel import route is intentionally disabled currently.

## 8.3 Extra direct MF hook in frontend
`useMutualFund` currently also calls external AdvisorKhoj API directly from frontend for one performance flow.

---

## 9) Calculators Flow

## 9.1 Free calculators
Frontend calculator hook maps multiple calculator tabs to API routes:
- `/api/calc/:type`

Payload changes per calculator type (SIP, lumpsum, goal, retirement, loan EMI, SWP, compounding, children education, spending less, etc.).

Result is shown in chart/table widgets and normalized in UI-level components.

## 9.2 Premium calculator hook status
`usePremiumCalculator` targets `/api/premium/calc/:type` with bearer token from localStorage, but active premium calculator page currently uses general `useCalculator` flow.

So premium-specific endpoint usage appears not primary in current active UI path.

---

## 10) CMS Pages Flow

Public APIs:
- `GET /api/cmspages`
- `GET /api/cmspages/:id`
- `GET /api/cmspages/slug/:slug`

Admin APIs:
- create/edit/toggle/delete/list pages under `/:role/cmspages/*` (admin role)

Used for static informational pages rendered in frontend.

---

## 11) Upload & Asset Flow

Upload routes support image file handling for:
- article body images
- hero images
- section images
- cluster thumbnails

Files stored under `uploads/*` and served via static `/uploads` route.

---

## 12) Admin/Editor Panel Journey (Operational)

## 12.1 Login and route access
Backend app (`backend`) login calls API auth login and routes by role:
- admin/editor -> `/:role/dashboard`

Protected via app-side private routes + API cookie auth + URL role checks.

## 12.2 Typical editorial publishing journey
1. Create cluster
2. Create topic (access type, publish date, status)
3. Create article under topic
4. Publish topic/article
5. Scheduler dispatches user notifications

## 12.3 Typical subscription operations journey
1. Manage subscription plans
2. Assign/create user subscriptions
3. Create/view payment history
4. Open invoice by payment
5. Review customer subscription timeline

## 12.4 Typical newsletter operations journey
1. Create newsletter publication + upload file
2. Publish now or schedule
3. Trigger send manually or wait for cron
4. Monitor publication status and recipient counts

## 12.5 MF admin journey
1. Create main category
2. Create category
3. Create schemes/NFO/index snapshots
4. Toggle active states and maintain listings

---

## 13) Reliability and Guardrails

- selective rate limit on auth/newsletter/contact endpoints
- role mismatch blocks via `roleFromUrl`
- account deletion blocks auth via `protect`
- publish email idempotency via `is_email_sent`
- invoice correctness via payment-level start/end date storage
- GetResponse integration wrapped with fallback in blog publish notifications

---

## 14) End-to-End User Timeline (Practical)

1. Visitor opens website and explores free resources
2. Registers/login (or Google login)
3. Backend assigns Free plan and stores payment history
4. User enters dashboard and profile/subscription details load
5. User follows blogs/newsletters/MF sections and calculators
6. If eligible, promotional premium trial can be granted by subscription cron
7. Reminder emails sent near premium expiry
8. On expiry, scheduler downgrades to free and records transition
9. User can purchase premium via purchase endpoints/admin assignment
10. Invoice and history reflect exact validity periods
11. User continues journey with ongoing content and notifications

---

## 15) Important Notes for Future Changes

1. Keep API response shape compatibility (`user` / `data` wrappers) because frontend hooks parse multiple shapes.
2. Avoid changing cookie auth behavior unless both frontends are updated together.
3. Do not break `is_email_sent` semantics, otherwise duplicate publish emails can occur.
4. Subscription and invoice logic depends on `UserSubscriptionPayment.start_date/end_date`; preserve this.
5. Blog publish notifications currently rely on GetResponse-first + SMTP fallback; maintain fallback safety.
6. Contact flow has a frontend extra call to `/api/contact-thank-you` that is currently unmatched in API.

