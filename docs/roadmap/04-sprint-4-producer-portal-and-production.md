# Sprint 4: Admin Console, Producer Portal and Launch

## Objective

Run Koncave Cinema day to day, then open it to producers and launch:

- The admin console for staff: films, showtimes, money, members, staff and the audit log.
- Later, a producer portal: their films, the distribution agreement and their box office.
- Production hardening and launch readiness.

**Changed:** the plan opened with the producer portal. The API built the staff side first (its
Phase 5.5 admin module), so the admin console came first; producers have no console yet. The
phase doc is [F6](../phases/phase-06-studio-producer-and-admin.md).

---

## Routes

| Route                                       | Access      | Page                                                         |
| :------------------------------------------ | :---------- | :----------------------------------------------------------- |
| `/admin/login`                              | Public      | Staff sign-in                                                |
| `/admin`                                    | Staff       | Today's screenings, refunds waiting, sales, drafts to finish |
| `/admin/films`, `/admin/films/new`, `/[id]` | Staff       | Films from draft to published                                |
| `/admin/showtimes`, `/[id]`                 | Staff       | The schedule; a screening's rooms, suites and revenue        |
| `/admin/sales`, `/refunds`, `/payments`     | Staff       | Sales report, refunds owed back, payments search             |
| `/admin/members`, `/[id]`                   | Staff       | Finding a member; their passes, payments and sign-ins        |
| `/admin/staff`, `/admin/audit`              | Super admin | Staff access; the audit log                                  |

Code in `src/features/admin/`, one folder per area. On sample data, one store
(`demo-store.ts`) behaves like the API, and every change is audited.

---

## Checklist

### 1. Admin console

- [x] Staff sign-in; members and signed-out visitors are turned away; super admin sections hidden
      from staff.
- [x] Films: draft, posters, master and trailer uploads with progress, the NFVCB certificate, a
      readiness list, publish with the API's refusal reasons, unpublish and delete.
- [x] Showtimes: add and move in Lagos time, cancel with a reason, each room's sales.
- [x] Money: sales report with CSV export, refunds queue (a super admin records refunds),
      payments search.
- [x] Members: search, a member's passes and payments, resend a booking email, cancel a pass, the
      legal name revealed to a super admin only (each reveal audited).
- [x] Staff: invite by email, change a role or remove access from the row's menu.
- [x] Audit log: filtered by member or action, paged on the API's cursor.
- [x] Every list pages at 10, 20, 50 or 100 rows, kept in the address.
- [ ] Connect the console to the API (the sample data stands in today).

### 2. Producer portal (`/studio`)

- [ ] A producer's own films, screenings and box office. Waits for the API's producer endpoints.
- [ ] Producers submitting a film (today staff upload it for them).

### 3. Producer distribution agreement

- [ ] Reviewing and accepting `docs/legal/producer-distribution-agreement.md` in the portal, with
      the producer's share, the non-exclusive window and the anti-piracy terms.
- [ ] A signed record (legal name, time, IP address, agreement version). Needs the API.

### 4. Box office and settlement

- [x] For staff: gross, gateway fees, the producer's and the platform's share, by film and by
      showtime (the sales report and each showtime's page).
- [x] Money is always the API's figures; nothing is worked out in the browser.
- [ ] For producers: their own figures and payout status, with a statement to download. Waits
      for the portal.

**Changed:** prices and the share come from the API (the base price is set per showtime, and the
share per film), not from fixed amounts in this plan.

### 5. Errors and resilience

- [x] Every list and record has loading, error (with a retry) and empty states.
- [x] A page that breaks keeps the sidebar and offers to try again (`error.tsx` in the dashboard
      and the console).
- [x] Sample data on a switch (`NEXT_PUBLIC_DATA_SOURCE`) while the API isn't connected.
- [ ] An offline notice and a maintenance page: in [F9](../phases/phase-09-hardening-and-launch.md).

### 6. Launch readiness

In [F9](../phases/phase-09-hardening-and-launch.md): Web Vitals budgets
([performance.md](../architecture/performance.md)), accessibility checks, the browsers to test,
environments and domains, and the launch sign-off.
