# Studio decision log

_Cross-product decisions owned by Product Studio, with why and what each was chosen over. Product decisions stay in each product's own log. Format: `templates/DECISION-LOG.md`._

## STU-DEC-1: Hearth's messenger becomes a shared library, not its own product
- **Date:** 2026-10-23 · **Decided by:** Product Studio, adopting Hearth's recommendation (intake from Hearth, Oct 23). License: AGPL-3.0 (Chase, Oct 26).
- **Chose:** a shared package, `packages/messenger`, extracted from Hearth after its beta (Nov 22). It starts as a folder inside the Hearth repo, and moves to its own repo only when a second product actually uses it.
- **Over:** (a) a standalone consumer messenger; (b) copying the messenger into each product; (c) extracting it now, before the beta.
- **Why:**
  - Most of the roughly 500 lines are generic: the MLS suite (`mlsCrypto.ts`, ts-mls 1.6.4 on @noble, runs in Expo Go) and the sync engine in `client.ts`. Only the roster, chat titles and the relay's membership check (migration 0015) are Hearth-specific.
  - A consumer messenger competes with Signal and WhatsApp and needs push, abuse reporting, multi-device, key verification and an outside crypto audit; Hearth has the first two in progress at best and not the last three (S18-S20). A drop-in encrypted group chat SDK is the more realistic product, and is revisited once two products use the library and the audit is done.
  - One copy in Hearth means no versioning or publishing work until a second user exists.
  - Extraction touches tested crypto code, and Chase froze new work past Hearth's milestone 1 (Oct 19), so it waits for the beta.
- **Shape:** three plug points: `Relay` (publish, claim, fetch), `Roster` (who belongs in conversation X), `Store` (encrypted local storage), plus a Postgres/Supabase relay template whose membership rule is one function each product writes.
- **License (Chase, Oct 26): AGPL-3.0.** Chose it over Apache-2.0 (the earlier recommendation) because Chase is worried about copying: anyone who changes it and runs it, even as a website or app, must publish their source under AGPL, so companies won't quietly reuse it. Chase owns the copyright, so his own products (Hearth, Crew Clock and others, open or closed) can use it under any terms, and he can relicense or loosen it later. A paid commercial license stays possible. Matches Hearth's planned AGPL-3.0 (Hearth DEC-7).
- **Second user (Chase, Oct 23):** Crew Clock, then other products ("I want to use it in crew clock and others"). So the package moves to its own repo when Crew Clock starts integrating, and Chase's own products can use it whatever their license, because he holds the copyright. Crew Clock's project does its own integration from a separate intake, after Hearth's extraction lands.
- **Known gap:** no outside review of the crypto glue yet (Hearth S20). Any product that ships the library inherits it until an audit.
- **Owner:** Product Studio decides and schedules. Hearth's project does the extraction (it owns the Hearth repo), from a go-ahead INTAKE that Chase pastes after the beta.
- **Undo cost:** cheap now (nothing has moved); after extraction, a refactor.
