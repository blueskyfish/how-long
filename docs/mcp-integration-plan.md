# MCP integration plan

**Status checked:** 2026-10-13  
**Current state:** Zed now has a project-level MCP configuration in `.zed/settings.json`.
The Angular CLI dependency includes MCP implementation packages, but configuration is what
makes the server available to an agent.

## Server availability

| Technology   | Server found                                                                                                                                                       | Status and suitability                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular      | Yes — Angular CLI MCP, provided by `@angular/cli`                                                                                                                  | First-party server. This project uses Angular CLI 22.2.2. It can inspect the workspace and run Angular tooling. Start in read-only mode and confirm its available tools against this CLI version.                                                  |
| Spartan      | Yes — `@spartan-ng/mcp`                                                                                                                                            | First-party Spartan server, documented by the Spartan project. It exposes component, API, example, block, accessibility, and documentation information. The published version checked was 1.6.3, matching this project's Spartan package versions. |
| Tailwind CSS | No Tailwind Labs MCP server was found in the official documentation/repository during this check. A third-party package, `tailwindcss-mcp-server` (0.1.1), exists. | Not first-party; its npm metadata showed its last modification in August 2025. Do not enable it until its maintenance, security, and Tailwind CSS 4 compatibility have been reviewed. Prefer Tailwind's official documentation in the meantime.    |

The Angular server uses the project's locally installed CLI in read-only mode. The Spartan
server is pinned to the published version aligned with this repository's Spartan packages.

## Proposed implementation

Use Zed's project-level `.zed/settings.json` to make both first-party servers available to the
Zed Agent when this repository is opened. Do not add application runtime dependencies. Use the
locally installed Angular CLI and initially limit its tools to read-only operations:

```json
{
  "context_servers": {
    "angular-cli": {
      "command": "npx",
      "args": ["ng", "mcp", "--read-only"]
    },
    "spartan-ui": {
      "command": "npx",
      "args": ["-y", "@spartan-ng/mcp@1.6.3"]
    }
  }
}
```

Zed launches configured MCP servers itself and connects to them over stdio. A Zed task can
start a command in a terminal, but that process is not registered as an MCP server and its
tools are not exposed to the agent. Therefore a separate task runner for starting these MCP
servers is unnecessary and should not be used as the integration mechanism. Zed's MCP Servers
settings page can be used to confirm that the servers are active.

Keep Tailwind CSS outside the initial configuration. Before considering the community package,
review its source and permissions, confirm compatibility with Tailwind CSS 4 and this
repository's PostCSS setup, then test it in a disposable environment. If it is not suitable,
use the official Tailwind documentation directly rather than presenting the community server
as an official integration.

## Implementation and verification steps

1. Open this project in Zed and allow/trust its project MCP configuration when prompted.
2. In Zed's **Settings → AI → MCP Servers**, verify both servers are active and their tools
   are discoverable. Check that Angular workspace/build information matches this repository
   and retrieve a real Spartan component API or example.
3. Use Angular MCP for Angular CLI/workspace questions and Spartan MCP for Spartan components
   and APIs. Continue to follow the existing project instructions for Tailwind CSS 4, Signal
   Forms, generated UI primitives, localization, and testing.
4. After adding or changing the configuration, run the repository's normal formatting check,
   unit tests, and production build. Confirm the application itself has no new runtime
   dependency or behavior change.
5. Only enable Angular write-capable tools when a task needs them and the proposed operation
   has been reviewed. Reassess the Tailwind server separately before adding it.

The checked-in configuration makes these servers available to Zed; it does not configure
other agent hosts. Zed may require explicit approval before running project MCP commands.

## Sources

- Angular CLI MCP documentation: <https://angular.dev/ai/mcp>
- Spartan MCP setup and tool documentation: <https://github.com/spartan-ng/spartan/blob/main/skills/spartan/mcp.md>
- Zed MCP documentation: <https://zed.dev/docs/ai/mcp>
- Zed task runner documentation: <https://zed.dev/docs/tasks>
- Tailwind CSS documentation: <https://tailwindcss.com/docs>
- Third-party Tailwind MCP package: <https://www.npmjs.com/package/tailwindcss-mcp-server>
- Third-party Tailwind MCP source: <https://github.com/CarbonoDev/tailwindcss-mcp-server>
