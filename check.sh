#!/bin/sh
# Does this repository actually work as a Codex marketplace?
#
# Everything happens in two throwaway folders: a CODEX_HOME, so the person's own Codex is not
# touched, and a HOME, so no real kyte workspace is opened. What is checked is the whole path a
# newcomer walks — add the marketplace, install the plugin, see the server registered, and get an
# answer out of it.
#
# Run it from anywhere:  sh check.sh

set -eu

repo=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

CODEX_HOME="$work/codex"
HOME="$work/home"
mkdir -p "$CODEX_HOME" "$HOME"
export CODEX_HOME HOME

fail() {
  echo "FAILED: $1" >&2
  exit 1
}

echo "1. the marketplace"
codex plugin marketplace add "$repo" >"$work/add.txt" 2>&1 || fail "codex would not add the marketplace
$(cat "$work/add.txt")"
grep -q 'kyte-codex' "$work/add.txt" || fail "the marketplace is not called kyte-codex
$(cat "$work/add.txt")"

codex plugin list >"$work/list.txt" 2>&1 || fail "codex plugin list did not run"
grep -q 'kyte@kyte-codex' "$work/list.txt" || fail "the catalogue does not offer kyte
$(cat "$work/list.txt")"

echo "2. the install"
codex plugin add kyte@kyte-codex >"$work/install.txt" 2>&1 || fail "the plugin would not install
$(cat "$work/install.txt")"

codex plugin list >"$work/list.txt" 2>&1
grep -q 'kyte@kyte-codex *installed, enabled' "$work/list.txt" ||
  fail "the plugin is not installed and enabled
$(cat "$work/list.txt")"

echo "3. the server Codex registered"
codex mcp list >"$work/servers.txt" 2>&1 || fail "codex mcp list did not run"
grep -q '^kyte ' "$work/servers.txt" || fail "no kyte server was registered
$(cat "$work/servers.txt")"
grep -q 'mcp --db' "$work/servers.txt" || fail "the server is not started as 'kyte mcp --db …'
$(cat "$work/servers.txt")"

echo "4. the answer"
# No workspace has been opened in this throwaway HOME, so the one tool kyte serves is the one that
# says why — which is exactly what the skill tells the model to relay.
node "$repo/scripts/mcp-probe.mjs" >"$work/probe.txt" 2>&1 || fail "the server did not answer
$(cat "$work/probe.txt")"
sed 's/^/   /' "$work/probe.txt"
grep -q 'kyte_status' "$work/probe.txt" ||
  fail "without a workspace the server should offer kyte_status and nothing else
$(cat "$work/probe.txt")"

echo
echo "All four passed."
