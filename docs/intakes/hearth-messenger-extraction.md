# Go-ahead INTAKE: extract Hearth's messenger into a shared library

_Chase pastes the block below into the Hearth project after the Nov 22 beta. Decision: `DECISIONS.md` STU-DEC-1. Fill in the license line first._

```
INTAKE for Hearth (from Product Studio): go ahead and extract the messenger into a shared library

Owner: Hearth, because the change lands in the Hearth repo. Product Studio decided and scheduled it (pm-tools DECISIONS.md, STU-DEC-1).

## When
After the Nov 22 beta ships. Don't start while beta fixes are open.

## Decision
- A shared library, not its own product. It lives at packages/messenger inside the Hearth repo, and Hearth imports it from there. It moves to its own repo only when a second product uses it. Chase picked Crew Clock as the second user, then others, so design the three interfaces for a product that isn't Hearth (no Hearth groups or parents inside the package).
- License for packages/messenger: Apache-2.0 (add its own LICENSE file in the package; Hearth's app license is unchanged).

## Do
1. Move app/src/messenger/mlsCrypto.ts and the sync engine in client.ts into packages/messenger, behind three interfaces:
   - Relay: publish, claim, fetch.
   - Roster: who belongs in conversation X.
   - Store: encrypted local storage.
2. Keep the Hearth-specific parts in the app: chat membership (group members plus parents), chat titles, and Hearth's Relay, Roster and Store implementations.
3. Turn migration 0015 into a Postgres/Supabase relay template in the package, where the membership rule is one function each product writes. Hearth's own rule keeps reading its groups.
4. Keep every MSG test green, with no behavior change. Add package-level tests that run the engine against in-memory fakes of the three interfaces (labeled as test fakes).
5. Keep ts-mls 1.6.4, the ciphersuite MLS_128_DHKEMX25519_CHACHA20POLY1305_SHA256_Ed25519 and @noble, and keep it running in Expo Go (no WebCrypto).
6. Write packages/messenger/README.md: what it is, the three interfaces, the relay template, and a plain warning that the crypto glue has no outside review yet (S20).
7. Update Hearth's HANDOFF.md, SPEC-MESSENGER.md and docs/architecture/06-messenger.md, and add a Hearth decision log entry pointing at STU-DEC-1.

## Not in scope
Publishing to npm, a separate repo, a second product's integration, or closing S18-S20 and T8-T10.

## After shipping
Tell Product Studio (an INTAKE back, or a line in Hearth's HANDOFF.md under "Portfolio / public presence") so STUDIO-STATUS and the roadmap card move to Done.
```
