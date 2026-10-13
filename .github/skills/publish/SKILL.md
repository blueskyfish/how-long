---
name: publish
description: Prepare the changelog PR for a merged stable app version, then create its GitHub Release after that PR is merged. Requires exactly one stable SemVer version argument.
---

# Publish a GitHub Release

This skill requires exactly one stable SemVer version argument:

```text
/publish 0.3.2
```

Accept only `MAJOR.MINOR.PATCH` using non-negative decimal integers without
leading zeroes. Reject missing, malformed, prerelease, or extra arguments without
publishing. Before proceeding, verify that `package.json` and the root
`package-lock.json` versions agree and exactly match the requested version.

The npm package is private. **Never run `npm publish`.** This skill has two
invocations: first it adds the release entry to `CHANGELOG.md` and opens a pull
request; after that PR is merged, invoke it again with the same version to create
the GitHub Release and matching `v<version>` tag. GitHub Pages deployment remains
handled by the existing workflow after a merged pull request and only for stable
versions.

## Phase 1: prepare the changelog PR

1. Require a clean worktree on an up-to-date `main`. Fetch `origin`, switch to
   `main`, and fast-forward it. Stop if the worktree is dirty or `main` cannot
   fast-forward; do not stash, reset, or rebase.
2. Verify the versions in `package.json` and the root `package-lock.json` exactly
   match the requested version.
3. Find exactly one merged version bump pull request to `main` from
   `chore/version-<version>`. Verify that it changed `package.json` and
   `package-lock.json`, and retrieve its merge commit SHA. Confirm that no open or
   closed-unmerged changelog PR and no local or remote branch already exists for
   `chore/release-<version>`. Also confirm that neither the `v<version>` Git tag
   nor the GitHub Release already exists. Stop on missing, duplicate, or ambiguous
   results.
4. Find the latest published GitHub Release and inspect merged pull requests since
   its tag, including the version bump PR and its changes on `main`. Summarize only
   meaningful user-facing changes. Use the initial commit as the baseline if no
   earlier release exists.
5. Create and switch to `chore/release-<version>` from the updated `main`. Add an
   entry dated with the current UTC date immediately below `# Changelog`, using
   only non-empty `Added`, `Changed`, and `Fixed` sections. Omit an `Unreleased`
   section and leave existing entries unchanged. Run the formatting check.
6. Commit only `CHANGELOG.md` with a Conventional Commit such as
   `docs(changelog): add <version> release notes`. Push the branch and open a pull
   request to `main`. Do not create the GitHub Release or tag yet. Report the PR
   URL and tell the user to merge it, then invoke this skill again with the same
   version.

## Phase 2: publish after the changelog PR merges

1. Require a clean worktree on an up-to-date `main`. Fetch `origin`, switch to
   `main`, and fast-forward it. Stop if the worktree is dirty or `main` cannot
   fast-forward; do not stash, reset, or rebase.
2. Verify the versions in `package.json` and the root `package-lock.json` exactly
   match the requested version.
3. Find exactly one merged changelog pull request to `main` from
   `chore/release-<version>`. Verify that it changed `CHANGELOG.md`, retrieve its
   merge commit SHA, and confirm the merged version bump PR from
   `chore/version-<version>` changed both package files. If either PR is missing,
   not merged, or ambiguous, stop without publishing.
4. Verify that `CHANGELOG.md` contains exactly one heading for this version.
   Extract the complete matching entry up to (but not including) the next `## `
   heading into a uniquely named temporary notes file.
5. Confirm that neither the `v<version>` Git tag nor the GitHub Release already
   exists. Check the remote Git tag and GitHub Release separately. If either exists,
   stop rather than overwriting or moving it. Treat lookup errors other than a
   confirmed not-found response as failures and stop.
6. Create the GitHub Release and tag at the changelog PR merge commit, using the
   changelog entry as release notes:

   ```sh
   gh release create "v$VERSION" \
     --target "$MERGE_COMMIT" \
     --title "How long $VERSION" \
     --notes-file "$NOTES_FILE"
   ```

7. Remove only the exact temporary notes file created in step 4, whether the
   release succeeds or fails. Do not run `npm publish`. Report the GitHub Release
   URL when successful.
