# Contributing

Thanks for taking the time to improve How long. Bug reports, ideas and code contributions
are welcome.

## Before you start

- Check existing issues and pull requests to avoid duplicate work.
- For a larger change, open an issue first so we can agree on the approach.
- Keep changes focused. Please do not include unrelated formatting or cleanup.

## Reporting an issue

Use a clear, specific title. Include the details needed to understand and reproduce the
problem:

- **What happened:** Describe the behavior you saw.
- **What you expected:** Describe what should have happened.
- **Steps to reproduce:** List the shortest reliable sequence, including sample input when
  relevant.
- **Environment:** Include your browser and operating system. For display or device-specific
  issues, include the device and screen orientation.
- **Evidence:** Add a screenshot or a short, relevant error message when it helps explain
  the issue.

Report one problem per issue. Keep error messages exact when possible, and include the
action that triggered them. Remove personal data, tokens and other sensitive information
from screenshots, logs and examples.

## Making a change

1. Create a branch from the latest `main`.
2. Make the smallest change that addresses the issue.
3. Add or update tests when behavior changes.
4. Run the relevant checks before opening a pull request:

   ```bash
   npx prettier --check .
   npm audit --audit-level=high
   npm test -- --watch=false
   npm run test:e2e
   npm run build
   ```

5. Open a pull request to `main`. Explain what changed, why it helps, and how you tested
   it. Link the related issue when there is one. Include screenshots for visible UI changes.

Use a concise Conventional Commit title with a scope, for example
`fix(home): refresh countdown after resume`. Keep the pull request title and description
specific to the change.

## Writing and review

Be friendly, respectful and direct. Focus feedback on the work, explain suggestions, and
assume good intent.

Prefer concrete, useful writing over filler. If you use AI tools, review every suggested
change yourself: check facts, tests, wording and scope, and remove generic or repetitive
text. Do not claim that a check passed unless you ran it.

Pull requests are reviewed before merging. Please do not merge your own pull request;
the maintainers handle merging.
