---
name: bump
description: Bump the app version, run CI checks, commit the package version changes, push a branch, and open a pull request. Requires exactly one SemVer version argument.
---

# Bump the application version

This skill requires exactly one version argument in strict SemVer form:

```text
/bump 0.3.2
/bump 0.3.2-ALPHA
```

Accept `MAJOR.MINOR.PATCH` with an optional prerelease suffix. Numeric core
components and numeric prerelease identifiers must not have leading zeroes.
Reject build metadata, missing arguments, malformed versions, or extra arguments
without changing anything. Before proceeding, verify that `package.json` and the
root `package-lock.json` versions agree.

This skill changes only `package.json` and the root `package-lock.json`. It does
not update `CHANGELOG.md`, create a GitHub Release, create a Git tag, or trigger
a Pages deployment, and it must never run `npm publish`.

## Procedure

1. Require a clean worktree. Fetch `origin`, switch to `main`, and fast-forward it.
   Stop if the worktree is dirty or `main` cannot fast-forward; do not stash, reset,
   or rebase.
2. Confirm the requested version is greater than the current version in both
   package files using SemVer precedence. Confirm that no local or remote branch
   and no pull request already exists for `chore/version-<version>`. Stop on
   ambiguity.
3. Create and switch to `chore/version-<version>` from the updated `main` before
   editing files.
4. Update the app version without creating a local tag by running
   `npm version "$VERSION" --no-git-tag-version`. Verify that `package.json` and
   both version fields in the root `package-lock.json` exactly match the requested
   version.
5. Run all CI-equivalent checks and resolve any failures: `npx prettier --check .`,
   `npm audit --audit-level=high`, `npm test -- --watch=false`, `npm run test:e2e`,
   and `npm run build`.

6. Commit only `package.json` and `package-lock.json` with a Conventional Commit
   such as `chore(version): bump to <version>`. Push the branch and open a pull
   request to `main`. Do not edit the changelog or create a release or tag. Report
   the pull request URL and tell the user to merge it before starting the
   `publish` skill.
