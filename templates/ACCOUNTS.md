# Accounts and names

_Template from pm-tools (proved in Hearth). Copy to `docs/product/ACCOUNTS.md` on day one._

Every outside account <product> uses, which login it's under, and where the name "<product>" is baked in. Use it for a rename, a handover, or moving off a personal email. **No keys, tokens or passwords here, ever**; they live in the environment secrets or the service itself. Name a secret by its variable name only (`SUPABASE_ACCESS_TOKEN`), never its value. In a public repo, leave out project ids, bucket names and personal emails too: write "owner's personal email", not the address.

**Rule for Claude:** when the owner sets up a new account or a new name, add a row in the same session.

| Service | What it's for | Login | Where "<product>" is | Rename cost |
|---|---|---|---|---|
| Claude (claude.ai) | Project, cloud environment (names its secrets by variable), published pages | Owner's personal email | Project and environment names, page titles | Easy (rename in settings) |
| GitHub | Code, CI, Pages | `<github-login>` | Repo `<owner>/<repo>` | Easy (GitHub redirects old links) |
| <Hosting or database> | <What it does> | <Which login> | <Project name, function names> | <Easy / Hard, and why> |
| <App store / domain> | <What it does> | Not set up yet | <App ID, domain> | **Permanent once <event>** |

**Rename cost** says what makes the name expensive to change: "Easy" (a display name), "Easy until <event>", or **Permanent once <event>** in bold.

## Decide the name before

**Name final:** no

While this says no, nothing that locks the name in may run. Only the owner changes it to yes. **Rule for Claude:** before any step below, or anything else that makes the name hard to change, stop and warn the owner first, even if they asked for the step.

1. Buying the domain.
2. The first app store build or upload (the app ID is permanent).
3. Publishing a package under the name (npm, PyPI).
4. Telling users or testers the name.
5. Printed or paid material: business cards, ads, a trademark filing.

Before those, a full rename of the product's words, emails and docs is usually an afternoon of work. Check the name for trademark conflicts (USPTO search, same class) before any of them.
