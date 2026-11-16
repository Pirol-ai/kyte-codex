# kyte for Codex

**kyte** is the company OS by [Pirol Labs](https://pirol.ai): customers, contacts, deals, projects,
hours, invoices, goals, people and the company's documents, in one workspace. This repository is a
Codex marketplace with one plugin in it, which serves that workspace to Codex — ask which projects
still have unbilled hours, book three hours on an implementation, look up who is out next week.

Codex works **as you**: it sees exactly what your role in kyte may see and changes only what your
role may change.

## What you need

The **kyte command line**, installed and signed in once:

1. Install it — macOS and Linux: `curl -fsSL https://updates.pirol.ai/cli/install.sh | sh`
2. Sign in for this plugin's own folder: `kyte login --db ~/.kyte/codex`

The folder is this connection's own copy of the workspace, kept apart from any kyte session you
run in a terminal, so the two never compete for one database.

## Install

```
codex plugin marketplace add Pirol-ai/kyte-codex
codex plugin add kyte@kyte-codex
```

Then start a new Codex session: the server is started at session start, so a running session does
not pick it up.

## Use it

Ask in plain words: *"Which projects for Meyer GmbH still have unbilled hours?"*, *"Book three
hours on the Northwind implementation for today"*, *"Who is out next week?"*. Codex looks things up
with the kyte tools before it answers and says afterwards what it changed.

## Settings

Two variables, for the cases where the defaults do not fit. Set them where your shell sets
variables, or in `~/.codex/config.toml` under `[mcp_servers.kyte.env]`.

- `KYTE_PROGRAM` — the kyte program, if it is installed somewhere the installer does not put it.
  The installer's own place is `~/.local/bin/kyte`.
- `KYTE_CODEX_DB` — another data folder than `~/.kyte/codex`.

## Where it works

macOS and Linux. The server is started through `/bin/sh`, because Codex passes the command line to
the program without a shell and `~` would arrive as a folder literally named `~`. On Windows, add
the server by hand in `~/.codex/config.toml`:

```toml
[mcp_servers.kyte]
command = "%LOCALAPPDATA%\\Programs\\kyte\\kyte.exe"
args = ["mcp", "--db", "C:\\Users\\<you>\\.kyte\\codex"]
```

## What it runs, sends and stores

- **Runs:** the `kyte` program on your own computer, as `kyte mcp`, with a named environment —
  where your files are, how this network reaches the internet — and not with everything else you
  have set in your shell.
- **Sends:** what Codex reads through these tools goes to Codex's model, as with any tool you use
  there. kyte itself keeps your workspace in step with **your company's kyte team server**, run by
  your company itself or by Pirol on its behalf in German data centres. This plugin sends nothing
  anywhere else.
- **Stores:** an encrypted local copy of your workspace in the data folder. Every change Codex
  makes is recorded in kyte as made by an agent on your behalf.
- **Never:** builds apps or extensions, runs commands, or reads your files — only the data tools of
  your kyte workspace exist for it.

## Checking it

`sh check.sh` walks the whole path in a throwaway `CODEX_HOME` and a throwaway `HOME`, so neither
your Codex nor your workspace is touched: it adds the marketplace, installs the plugin, looks at
the server Codex registered, talks to that server, and finally reads what Codex puts in front of
the model. That last step matters on its own — a plugin can install cleanly, serve every tool, and
still never show the model the skill. It asks Codex by standing a throwaway endpoint in front of
it and reading the request, so no account is used and no tokens are spent.

It needs `codex`, `node` and `kyte` on the machine. `node --test tests/*.test.mjs` checks the
manifests alone and runs on every pull request.

## Support

Questions and problems: [github.com/Pirol-ai/kyte-codex/issues](https://github.com/Pirol-ai/kyte-codex/issues).
Documentation: [kyte.pirol.ai/docs/en/mcp/](https://kyte.pirol.ai/docs/en/mcp/) ·
Privacy: [pirol.ai/privacy](https://pirol.ai/privacy) · Terms: [pirol.ai/terms](https://pirol.ai/terms)

## License

MIT — see [LICENSE](LICENSE). The licence covers this plugin; the kyte program it starts is
licensed separately.
