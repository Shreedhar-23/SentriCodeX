# Publishing SentriCodeX to the VS Code Marketplace

This covers the steps that require your own Microsoft/Azure identity —
nothing here can be automated on your behalf. Do these once; after
that, publishing updates is just the last two steps.

## 1. Create an Azure DevOps organization (if you don't have one)

1. Go to https://dev.azure.com and sign in with a Microsoft account
2. If prompted, create a new organization (any name is fine — it's
   just an administrative container, not shown to Marketplace users)

## 2. Generate a Personal Access Token (PAT)

1. In Azure DevOps, click your profile icon (top right) → **Personal access tokens**
2. Click **New Token**
3. Name it something like `vsce-publish`
4. **Organization:** select "All accessible organizations"
5. **Scopes:** click "Show all scopes", find **Marketplace**, check **Manage**
6. Set an expiration you're comfortable with (you'll need to regenerate this token when it expires)
7. Click **Create**, then **copy the token immediately** — Azure DevOps only shows it once

## 3. Create your publisher

A "publisher" is the identity your extension is listed under (e.g.
`sentricodex` — must match the `"publisher"` field in `package.json`).

**Option A — via the CLI** (from `extension/`):
```bash
npx vsce create-publisher sentricodex
```
You'll be prompted for the PAT from Step 2.

**Option B — via the web UI** (often more reliable):
1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with the same Microsoft account
3. Click **Create publisher**
4. Publisher ID must be exactly `sentricodex` (matching `package.json`)

## 4. Log in with vsce (from `extension/`)

```bash
npx vsce login sentricodex
```
Paste your PAT when prompted. This is a one-time step per machine (the
token is cached locally).

## 5. Publish

```bash
npm run package    # builds and sanity-checks the .vsix one more time
npx vsce publish
```

`vsce publish` reads the version from `package.json` (currently
`1.0.0`), builds the package the same way `npm run package` does
(running `vscode:prepublish`, which bundles the Python engine), and
uploads it directly — no separate upload step needed.

## Publishing an Update Later

1. Bump the version in `extension/package.json` (or run `npx vsce publish patch` / `minor` / `major` to have vsce bump it for you)
2. Add a new entry to the root `CHANGELOG.md`
3. `npx vsce publish`

## Verifying After Publishing

- Your listing appears at `https://marketplace.visualstudio.com/items?itemName=sentricodex.sentricodex`
- It may take a few minutes to become searchable inside VS Code itself
- Search for "SentriCodeX" in the Extensions view to confirm

## If Something Goes Wrong

- **"Publisher not found"** — the publisher ID in `package.json` doesn't match what you created in Step 3; they must match exactly
- **PAT errors** — tokens expire; regenerate one via Step 2 and re-run `vsce login`
- **Missing README/LICENSE warnings** — confirm `extension/README.md` and `extension/LICENSE` both exist (added in Phase 8)
