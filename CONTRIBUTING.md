# Contributing

## Setup

```sh
npm install
```

Press F5 in VS Code to launch an Extension Development Host with the extension loaded.

## Tests

```sh
npm test                  # unit tests for the set logic and the worker
npm run test:integration  # runs the commands inside a downloaded copy of VS Code
```

`npm run test:integration` uses a pinned VS Code version. Set `VSCODE_VERSION` to test
another, e.g. `VSCODE_VERSION=1.85.0` for the oldest supported version.

## Layout

- `src/extension.ts`: commands, tab picking, reading tabs, and showing results.
- `src/worker.ts`: runs each operation on a worker thread.
- `src/setOperations.ts`: the set logic itself.
- `images/icon.png` is rendered from `images/icon.svg` at 256×256.

## Releasing

1. Add an entry to `CHANGELOG.md`.
2. Bump the version: `npm version patch --no-git-tag-version` (or `minor`).
3. Commit, tag (`git tag -a vX.Y.Z -m "..."`), and push with `git push --follow-tags`.
4. Publish: `npx vsce publish`.
