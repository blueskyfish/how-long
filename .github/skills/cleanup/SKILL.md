---
name: cleanup
description: Update local main from origin and remove local branches whose pull requests have been merged.
---

# Refresh main and prune merged PR branches

Use this skill when asked to return to `main`, update it from the remote, or clean up
local branches after their pull requests merge.

## Safety rules

- Inspect `git status --short --branch` first. If there are modified, staged, or untracked
  files, stop before switching branches or deleting anything; do not stash or remove files
  without permission.
- Never delete `main`, the remote branch, or a branch whose pull request is open, closed
  without merging, or cannot be verified as merged.
- Do not assume Git's `-d` check detects a squash-merged PR. Verify the PR state with
  `gh` before using `git branch -D`.
- Be conservative: skip a local branch if it has commits not contained in the merged PR
  head, if its PR cannot be found, or if multiple results are ambiguous.

## Procedure

1. Confirm the worktree is clean, then fetch and fast-forward `main`:

   ```sh
   git fetch origin
   git switch main
   git pull --ff-only origin main
   ```

   If switching fails or the fast-forward is not possible, stop and report the reason.
   Do not reset or rebase `main`.

2. Get the locally available branches and merged PR heads:

   ```sh
   git branch --format='%(refname:short)'
   gh pr list --state merged --limit 1000 \
     --json headRefName,headRefOid,mergedAt
   ```

3. For each local branch except `main`, find a merged PR with the same
   `headRefName`. Check that the local branch tip is contained in that PR's `headRefOid`:

   ```sh
   git merge-base --is-ancestor <local-branch-tip> <merged-pr-head-oid>
   ```

   Delete the branch only when the command succeeds and the PR result explicitly shows
   it was merged. Because squash merges are not necessarily ancestors of `main`, the
   merged PR record is the authority for whether the work landed. The ancestry check
   ensures the local branch has no extra commits beyond that PR.

   ```sh
   git branch -D <verified-local-branch>
   ```

   Never pass remote-tracking refs or use a wildcard in a branch deletion command.
   Leave open-PR branches and unmatched branches untouched.

4. Verify the final state:

   ```sh
   git status --short --branch
   git branch -vv
   ```

   Report the updated `main`, the local branches deleted, and any branches deliberately
   retained. Do not commit or push unless explicitly requested.
