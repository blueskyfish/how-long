---
name: bump-publish
description: Bump the app version and changelog, open a PR, then publish a GitHub Release after merge. Requires one mandatory version argument in MAJOR.MINOR.PATCH format.
---

# Bump and publish a version

This skill requires exactly one stable semantic version argument:

```text
/bump-publish 0.3.0
```

If the argument is missing, malformed, or accompanied by extra arguments, stop without
changing anything. Accept only `MAJOR.MINOR.PATCH` using non-negative decimal integers
without leading zeroes; prerelease and build suffixes are not accepted. Before proceeding,
verify that `package.json` and the root `package-lock.json` version agree.

The npm package is private. **Never run `npm publish`.** Publishing means creating a
GitHub Release with a matching `v<version>` tag. The existing GitHub Pages deployment
continues to run after the version PR merges.

This workflow has two phases. To select a phase, inspect PRs to `main` from
`chore/release-<version>`:

- If exactly one such PR is merged and the version in both package files on `main` exactly
  matches the argument, run Phase 2.
- If no such PR exists and the requested version is greater than the version in both
  package files on `main` (compare numeric version components, not strings), run Phase 1.
- If a matching PR is open, report its URL and stop. If results are duplicated,
  contradictory, or otherwise ambiguous, stop without changing or publishing anything.
- If a matching PR was closed without merging, report it and stop; do not recreate its
  branch or prepare another PR automatically.
- If neither condition applies, explain the mismatch and stop.

The first invocation prepares and opens a version PR, then stops. After the user merges
that PR, invoke this skill again with the same version to create the GitHub Release. Never
merge a PR or publish a release from an unmerged branch.

## Phase 1: prepare the version PR

1. Require a clean worktree. Fetch `origin`, switch to `main`, and fast-forward it. Stop
   if the worktree is dirty or `main` cannot fast-forward; do not stash, reset, or rebase.
2. Confirm no local or remote branch and no release-preparation PR already exists for
   `chore/release-<version>`, and that neither the `v<version>` Git tag nor GitHub Release
   exists. Stop on ambiguity.
3. Create and switch to `chore/release-<version>` from the updated `main` before editing
   any files.
4. Find the latest published GitHub Release and inspect the merged PRs since its tag.
   Review their titles and changes on `main`, then summarize only meaningful,
   user-facing changes. Use the initial commit as the baseline if no earlier release
   exists.
5. Add an entry dated with the current UTC date immediately below `# Changelog`:

   ```markdown
   ## [0.3.0] - YYYY-MM-DD

   ### Added

   - User-facing change.

   ### Fixed

   - User-facing fix.
   ```

   Include only non-empty `Added`, `Changed`, and `Fixed` sections, omit an `Unreleased`
   section, and leave existing version entries unchanged. The changelog is updated only
   during this phase of this skill.

6. Update the app version in both package files without creating a local tag:

   ```sh
   npm version "$VERSION" --no-git-tag-version
   ```

   Verify that `package.json` and the root `package-lock.json` version exactly match the
   requested version.

7. Run all CI-equivalent checks and resolve any failures:

   ```sh
   npx prettier --check .
   npm audit --audit-level=high
   npm test -- --watch=false
   npm run test:e2e
   npm run build
   ```

8. Commit only `package.json`, `package-lock.json`, and `CHANGELOG.md` with a Conventional
   Commit such as `chore(release): bump version to <version>`, push the branch, and open a
   PR to `main`. Do not create the GitHub Release yet. Report the PR URL and tell the user
   to merge it, then invoke this skill again with the same version.

## Phase 2: publish after the version PR merges

1. Require a clean worktree on an up-to-date `main`. Verify that `package.json` and the
   root `package-lock.json` both exactly match the requested version. Do not require the
   requested version to be greater than the current version in this phase.
2. Find exactly one merged PR to `main` from `chore/release-<version>`. Verify that it
   changed `package.json`, `package-lock.json`, and `CHANGELOG.md`, and retrieve its merge
   commit SHA. If there is no such merged PR, it is not merged, or results are ambiguous,
   stop without publishing.
3. Verify that `CHANGELOG.md` contains exactly one heading for this version. Extract the
   complete matching entry up to (but not including) the next `## ` heading into a
   uniquely named temporary notes file. Remove that specific temporary file when done.
4. Confirm that neither the `v<version>` Git tag nor the GitHub Release already exists.
   Check the remote Git tag and GitHub Release separately. If either exists, stop rather
   than overwriting or moving it. Treat lookup errors other than a confirmed not-found
   response as failures and stop.
5. Create the GitHub Release and tag at the verified PR merge commit, using the changelog
   entry as release notes:

   ```sh
   gh release create "v$VERSION" \
     --target "$MERGE_COMMIT" \
     --title "How long $VERSION" \
     --notes-file "$NOTES_FILE"
   ```

   Remove only the exact temporary notes file created in step 3, whether the release
   succeeds or fails. Do not run `npm publish`. Report the GitHub Release URL when
   successful.
