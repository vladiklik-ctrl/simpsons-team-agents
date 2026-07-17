# simpsons team agents

A small static website that will grow into a team dashboard for the "Simpsons
agents" team. Each member (March/Marge, Homer, Bart, Lisa, Maggie) will later be
shown as a card with a Simpsons avatar, name, project role and status.

This first version is intentionally minimal: a single `index.html` page with the
site heading. Avatars, names and statuses come in later increments.

## Live site

The site is deployed to GitHub Pages:
<https://vladiklik-ctrl.github.io/simpsons-team-agents/>

## Project layout

- `index.html` — the static page (the heading for now).
- `test/index.test.js` — automated test that checks the heading is present.
- `.github/workflows/ci.yml` — CI (runs tests) and deployment to GitHub Pages.

## Run locally

Requirements: [Node.js](https://nodejs.org/) 18 or newer (built-in test runner).

Open the page in a browser:

```sh
# from the repository root, any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000/
```

Or simply open `index.html` directly in your browser.

## Run the tests

No dependencies to install — the test uses Node's built-in `node:test` runner:

```sh
npm test
```

## How deployment works

On every push and pull request to `main`, GitHub Actions runs the test suite.
When the tests pass on `main`, the same workflow publishes the site to GitHub
Pages using the official `actions/upload-pages-artifact` and
`actions/deploy-pages` actions. The Pages source is set to "GitHub Actions".

## License

MIT
