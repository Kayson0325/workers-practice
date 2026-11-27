# workers-practice

Two Cloudflare Workers built while learning the deployment model: one returns JSON, one serves a static site from a folder.

| Worker | Path | Serves |
| --- | --- | --- |
| `kayson-hello-api` | `hello-api/` | `GET /api/hello` returns JSON |
| `kayson-static-site` | `static-site/` | HTML, CSS and any file placed in `public/` |

## Run locally

```bash
bun install

bun run dev:hello    # http://localhost:8781/api/hello
bun run dev:static   # http://localhost:8782
```

## What each Worker shows

**hello-api** is a small program. Its `fetch` handler receives a `Request` and returns a `Response`. It reads two plain variables from `wrangler.jsonc` (`GREETING`, `BUILD_LABEL`), which is how a Worker gets configuration without a build step. `POST /api/hello` returns `405` with an `Allow` header, and unknown paths return a structured `404`.

**static-site** has no script at all. Its config declares `assets.directory`, so `wrangler deploy` uploads `public/` and Cloudflare serves those files from the edge. Requests that match a file never invoke Worker code, which is why static requests are not billed as Worker invocations.

Two behaviours worth knowing, both seen in the local run:

- `not_found_handling: "single-page-application"` answers an unknown path with `index.html` and status `200`, which is what a client side router needs.
- With the default `html_handling`, a request for `/about/team.html` answers `307` and redirects to `/about/team`. The asset layer strips the extension. A link that looks broken is often this.

## Deploy by hand

```bash
bunx wrangler login

bunx wrangler deploy --config hello-api/wrangler.jsonc
bunx wrangler deploy --config static-site/wrangler.jsonc
```

Each prints the `*.workers.dev` URL. The account's workers.dev subdomain is chosen once per account in the dashboard.

Secrets, as opposed to `vars`, are set out of band and never live in the repository:

```bash
bunx wrangler secret put SOME_SECRET --config hello-api/wrangler.jsonc
```

## Deploy from GitHub Actions

Two workflows, one per Worker, each triggered by a push to `main` that touches its folder, plus manual dispatch:

- `.github/workflows/deploy-hello.yml`
- `.github/workflows/deploy-static.yml`

They use the official `cloudflare/wrangler-action@v4` and read two repository secrets:

| Secret | How to get it |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Dashboard, My Profile, API Tokens, create from the **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard, Workers and Pages, right hand side of the overview |

Without `CLOUDFLARE_API_TOKEN` the workflows still run to completion, but they skip the deploy step and print a notice. That keeps the pipeline honest before the secrets exist: a green run means the checkout worked, not that a deployment happened.

## Workers static assets compared with Pages

Cloudflare's current recommendation is to serve new static sites with Workers static assets, not Pages. Both run on the same network, so the difference is in the workflow rather than in the request path.

**Workers static assets** bind a directory to a Worker. `wrangler deploy` uploads the files and, optionally, the script that runs next to them. One project, one deploy, one origin. Files that match are served without invoking the script. Adding a `main` entry to the same config turns it into a full stack Worker that serves both the assets and an API on the same hostname.

**Pages** is the older product. It connects to a git repository, runs a build command on Cloudflare's builders, and publishes the output, with preview deployments per branch. It is still supported, but new features land on Workers first.

**When to use which**

- New static site or a design portfolio: Workers static assets. Fewer moving parts, and the same config can grow an API later.
- A site that already lives on Pages and runs well: leave it. Migrating is optional.
- A project that depends on the Pages build step, git integration and per branch previews, and has no Worker code: Pages still fits, and the docs include a migration guide for when it does not.
