# PR Plan: Mini Program Real Backend Integration Closure (Defense Ready)

## Summary

This PR closes mini-program side integration gaps to ensure all key demo flows are backed by real backend APIs and database state, not front-end-only placeholders.

Focus:

1. User flow closure (login -> product -> order -> mine)
2. Leader flow closure (workbench -> pending confirm -> picked result)
3. Remove/mark pseudo interactions that could fail defense questioning
4. Deliver executable smoke checklist for on-site defense

---

## Current Status Snapshot

### Already Real-Connected

- `src/api/user.ts`
  - `/api/user/login`
  - `/api/user/info`
  - `/api/user/list`
- `src/api/product.ts`
  - product list/detail
- `src/api/order.ts` + `src/services/order.ts`
  - user order list/detail/create
  - leader list/workbench/confirm
  - open-group query
- `src/api/pick-point.ts` + `src/services/pick-point.ts`
  - pick-point list/detail
- `src/services/*` schema validation via zod (`src/schemas/*`)

### Still Risky for Defense (must be closed/explicit)

- `src/pages/mine/mine.vue`
  - [DONE 2026-05-05] `applyLeader()` no longer returns fake success; switched to explicit "管理员开通 + 联系客服" path.
  - [DONE 2026-05-05] asset cards no longer show fake numeric data; now explicit `暂未开通`.
- page-level capability disclosure is still not fully centralized (which feature is real / planned).

---

## Scope

### In Scope

- Replace simulation-only entrypoints with real backend requests or explicit "planned" status.
- Ensure role split is consistent in mini-program:
  - normal user
  - leader (`isLeader=true`)
- Harden error/empty-state behavior for network + business errors.
- Provide defense smoke scripts and expected result checklist.

### Out of Scope

- redesign UI/visual language
- introducing new architecture/dependencies
- full business redesign of coupon/points domain

---

## Implementation Plan

## P0.1 Mine Page Interaction Closure

Target file: `src/pages/mine/mine.vue`

- Convert `applyLeader()` from simulated modal into real request flow:
  - Option A (recommended): call existing admin/backend leader-apply endpoint if available.
  - Option B: if no apply endpoint exists, route user to explicit contact/statement page and mark capability text as "管理员开通".
- Replace fixed asset fields with either:
  - real backend fields if available, or
  - explicit placeholder badge: "暂未开通" (not fake numeric data).
- Keep existing UI structure; only adjust interaction/data source.

Acceptance:

- no button shows success without backend state change.
- re-enter page reflects newest backend role state.

---

## P0.2 Leader Workbench Consistency

Target files:

- `src/pages/leader/leader.vue`
- `src/services/order.ts`

Progress:

- [DONE 2026-05-05] no `default_pick_point_id` now triggers explicit guidance and keeps workbench state clean (no stale pending/recent data).
- [DONE 2026-05-05] confirm success path continues to refresh pending list + today count and sets `order_need_refresh`.

Actions:

- keep `getLeaderWorkbench()` + `leaderConfirmPick()` as single source of truth.
- enforce pick-point precondition path:
  - no `default_pick_point_id` -> clear guidance + jump self-pick page.
- after confirm success:
  - refresh pending list + today picked count
  - ensure order page refresh flag remains consistent (`order_need_refresh`).

Acceptance:

- pending count decrements after confirm.
- confirmed order appears in recent-picked list.

---

## P0.3 User Order Linkage

Target files:

- `src/pages/order/order.vue`
- `src/pages/order/detail.vue`

Progress:

- [DONE 2026-05-05] order list now blocks invalid request when not logged in (`userId` missing) and provides explicit retry message.
- [DONE 2026-05-05] order detail now handles missing `id` query with stable error state + retry guidance.

Actions:

- verify status mapping fully consistent with backend numeric statuses.
- ensure list/detail always derived from backend responses.
- improve failed-load retry consistency.

Acceptance:

- order status transitions observable after leader confirm.
- no local mock order generation path remains.

---

## P0.4 Capability Contract Doc for Defense

- Add this doc and keep it updated per merged code.
- Mark each mini-program module as:
  - `REAL` (DB + backend effective)
  - `LIMITED` (backend exists but partial semantics)
  - `PLANNED` (no backend, explicit non-demo claim)

Current suggested marking:

- REAL:
  - login/user info
  - product list/detail
  - create/list/detail order
  - leader workbench + confirm
  - pick-point list/detail
- LIMITED:
  - mine page asset cards (pending backend domain fields)
- PLANNED or explicit admin-open flow:
  - user self-apply leader (if backend apply endpoint absent)

Progress:

- [DONE 2026-05-05] capability contract doc created: `docs/mini-program-capability-contract.md`.

---

## Integration Matrix (Mini Program -> Backend)

- `/pages/login/login` -> `/api/user/login`
- `/pages/index/index` -> product APIs
- `/pages/goods/*` -> product detail APIs
- `/pages/order/order` -> `/api/order/list/{userId}`
- `/pages/order/detail` -> `/api/order/{id}`
- `/pages/leader/leader` ->
  - `/api/order/leader/workbench`
  - `/api/order/leader/confirm/{orderId}`
- `/pages/self-pick/self-pick` -> `/api/pick-point/list`, `/api/pick-point/{id}`
- `/pages/mine/mine` -> `/api/user/info` (+ leader-related closure action)

---

## Defense Smoke Checklist (must run before presentation)

Record template: `docs/defense-smoke-record-template.md`

1. Login with test account -> `token` + `userInfo` persisted.
2. Create order from product page -> appears in `/pages/order/order`.
3. Leader account with valid default pick point enters workbench -> sees pending list.
4. Leader confirms one pending order -> toast success + pending count decreases.
5. Back to user order list/detail -> status reflects latest backend state.
6. Mine page leader entry:
   - leader sees real summary line from workbench.
   - non-leader does not receive fake "申请成功" without backend evidence.

---

## Risk & Mitigation

1. Backend endpoint not available for "apply leader"

- Mitigation: switch to explicit admin-open workflow text + no fake success action.

2. Local cache stale after role/status change

- Mitigation: refresh `userInfo` in `onShow` and enforce post-action refetch.

3. Defense challenge on data authenticity

- Mitigation: provide endpoint mapping + on-site API/network log verification + this checklist.

---

## Definition of Done

- [x] mini-program key pages have no fake-success interaction.
- [x] all shown core business data comes from backend API responses.
- [x] leader flow end-to-end is reproducible on live DB.
- [ ] smoke checklist executed and recorded before defense day.
- [x] this doc updated with final endpoint reality.
