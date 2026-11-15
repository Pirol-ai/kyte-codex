// The parts of this repository that a pull request can check without Codex and without kyte.
//
// check.sh proves the real thing — marketplace, install, connection — but it needs both programs
// on the machine. These checks need neither, so they run on every pull request and catch what
// actually goes wrong in a manifest: a path that points nowhere, a variable the server needs but
// does not get, and the data folder drifting apart between the server line and the prose.

import { test } from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const readJson = (...parts) => JSON.parse(read(...parts));

const PLUGIN = join("plugins", "kyte");

test("the marketplace points at a plugin that is there", () => {
  const marketplace = readJson(".agents", "plugins", "marketplace.json");
  assert.strictEqual(marketplace.name, "kyte-codex");

  const entries = marketplace.plugins ?? [];
  assert.strictEqual(entries.length, 1, "one plugin, or the readme is wrong");

  const [entry] = entries;
  assert.strictEqual(entry.name, "kyte");
  assert.strictEqual(entry.source.source, "local");
  assert.ok(
    existsSync(join(root, entry.source.path, ".codex-plugin", "plugin.json")),
    `${entry.source.path} holds no plugin manifest`,
  );
});

test("every path in the plugin manifest leads somewhere", () => {
  const manifest = readJson(PLUGIN, ".codex-plugin", "plugin.json");
  assert.strictEqual(manifest.name, "kyte");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);

  const paths = [
    manifest.mcpServers,
    manifest.skills,
    manifest.interface?.composerIcon,
    manifest.interface?.logo,
    manifest.interface?.logoDark,
  ];
  for (const path of paths) {
    assert.ok(path, "the manifest leaves out a path the plugin needs");
    assert.ok(existsSync(join(root, PLUGIN, path)), `${path} does not exist`);
  }
});

test("the server is started as kyte mcp, with the variables it needs", () => {
  const { mcpServers } = readJson(PLUGIN, ".mcp.json");
  const names = Object.keys(mcpServers);
  assert.deepStrictEqual(names, ["kyte"]);

  const server = mcpServers.kyte;
  const line = [server.command, ...(server.args ?? [])].join(" ");
  assert.match(line, /mcp --db/, "the server does not serve a workspace");

  // Without HOME the folder becomes /.kyte/codex, which nobody can sign in to; without PATH the
  // shell cannot find kyte at all. Both are easy to drop and neither fails loudly.
  for (const variable of ["HOME", "PATH"]) {
    assert.ok(
      (server.env_vars ?? []).includes(variable),
      `${variable} is not passed to the server`,
    );
  }
});

test("the skill is one Codex can read", () => {
  const skill = read(PLUGIN, "skills", "kyte", "SKILL.md");
  assert.match(skill, /^---\nname: kyte\n/, "the front matter does not name the skill");
  assert.ok(/^description: .{40,}/m.test(skill), "the skill does not say when to use it");
});

test("the server, the skill and the readme name the same folder", () => {
  const { mcpServers } = readJson(PLUGIN, ".mcp.json");
  const line = [mcpServers.kyte.command, ...(mcpServers.kyte.args ?? [])].join(" ");

  const inServer = line.match(/\$HOME\/(\.kyte\/[\w.-]+)/)?.[1];
  assert.ok(inServer, `no data folder in the server line: ${line}`);

  for (const file of [join(PLUGIN, "skills", "kyte", "SKILL.md"), "README.md"]) {
    const folders = new Set(
      [...read(file).matchAll(/--db ~\/([\w./-]+?)[`\s]/g)].map((match) => match[1]),
    );
    assert.deepStrictEqual(
      folders,
      new Set([inServer]),
      `${file} sends the person to a different folder than the server opens`,
    );
  }
});
