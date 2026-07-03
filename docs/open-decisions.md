# Open Decisions

This document locks default answers for ambiguities listed in `docs/technical-design.md`. Fable and subagents should **apply these defaults** unless the product owner explicitly overrides them in chat.

Status key: **Locked** = proceed with this default | **Needs confirmation** = propose to user before irreversible work

---

## Decision OD-001: Web scope at launch

**Status:** Locked

**Default:** Full web app at launch — same core loop as iOS/Android (auth, categories, items, battles, rankings, history). Web is not a read-only companion.

**Rationale:** One codebase via Expo + React Native Web; MVP is small enough to ship parity. Companion-only web adds product complexity without reducing build scope much.

---

## Decision OD-002: Local-only mode without account

**Status:** Locked

**Default:** **Account required** for MVP. No anonymous/local-only backlogs in v1.

**Rationale:** Supabase auth + RLS is the security model from day one. Local-only sync later is a separate feature.

---

## Decision OD-003: Item images in MVP

**Status:** Locked

**Default:** **Optional** — items have title + notes + type; `image_url` nullable. No requirement to upload or display images in MVP UI. Placeholder or initial letter avatar is fine.

**Rationale:** Reduces storage, upload UX, and polish scope. Schema supports images for later.

---

## Decision OD-004: Ranking scope

**Status:** Locked

**Default:** **Per-battle rankings** stored in `battle_rankings` for each completed battle. Show "latest battle result" and battle history per category. No single merged Elo/global category ranking in MVP.

**Rationale:** Matches knockout tournament MVP; avoids ranking algorithm scope creep. UI can highlight "winner of last battle" as de facto "pick next."

---

## Decision OD-005: Analytics provider

**Status:** Locked

**Default:** **PostHog** for product analytics (events listed in technical design). Sentry for crash reporting in Phase 5.

**Rationale:** PostHog strong for product teams, generous free tier, good Expo/web support. Amplitude remains an option if team already standardized on it.

---

## Decision OD-006: Reminder scope for MVP

**Status:** Locked

**Default:** Native push notifications (iOS/Android) via Expo Notifications. **Web push deferred** post-MVP. User opts in; frequencies: weekly, biweekly, monthly.

---

## Decision OD-007: Minimum items to start a battle

**Status:** Locked

**Default:** Minimum **2 active items** in a category. Show friendly empty state below that.

---

## Decision OD-008: Branch naming for agent work

**Status:** Locked

**Default:** Feature branches use prefix `cursor/` and suffix `-7446`, e.g. `cursor/phase-1-foundation-7446`.

---

## Override process

If the user says "override OD-00X" or gives a conflicting instruction, update this file in the same PR and note the change in `docs/decisions-log.md` as a new decision entry.
