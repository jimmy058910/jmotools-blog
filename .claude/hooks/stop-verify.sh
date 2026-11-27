#!/usr/bin/env bash
# Stop hook: before Claude ends a turn, run the unit tests, `astro check` and the build when
# site files have changed, and send Claude back once (exit 2) with the errors if any fails.
#
# Why here: nothing local checks this repo. There are no git hooks, and CI (ci.yml) and the
# Cloudflare Pages build run only after a push. A post whose frontmatter breaks the content
# schema, a type error in a component, or a broken subscribe helper is otherwise found by a
# red CI run or a failed deploy.
#
# "Changed" means the working tree (git status, untracked files included) OR commits on this
# branch since it left origin/main, limited to src/, public/ and the root config files. That
# gate comes first and needs only git, so a turn that changed nothing here costs a git status.
#
# The build writes dist/ and .astro/, both gitignored. Nothing is deployed from here.
#
# It fails OPEN on purpose: this file is tracked, so it also runs in cloud sessions and fresh
# clones, where node (nvm) or `npm ci` may be missing. A missing node, npm or dependency
# skips the checks with a note instead of blocking a session that cannot run them.
#
# Loop protection: when stop_hook_active is true Claude is already continuing because of this
# hook, so it exits 0. Claude gets exactly one bounce; if the errors are in files another
# session is editing, it can say so and stop.
#
# Measured 2026-11-20: tests 0.6s, astro check 3.6s, build 2.3s.

set -u
input=$(cat)

note() { printf 'stop-verify: %s\n' "$*" >&2; }

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" 2>/dev/null || exit 0

changed=$(
  git --no-optional-locks status --porcelain --untracked-files=all 2>/dev/null |
    sed -E 's/^.. //; s/^.* -> //; s/^"//; s/"$//'
  if base=$(git merge-base HEAD origin/main 2>/dev/null); then
    git --no-optional-locks diff --name-only "$base" HEAD 2>/dev/null
  fi
)
printf '%s\n' "$changed" | grep -Eq '^(src/|public/|[^/]+\.(mjs|cjs|js|ts|json)$)' || exit 0

# Run on the Node in .nvmrc, the version Cloudflare's build and CI use. Astro 7 refuses to start
# below 22.23.4, and the hook otherwise inherits nvm's default, which can be older (22.23.3 on
# .199 on 2026-11-27). nvm.sh is not written for `set -u`, hence the toggle.
nvm_sh="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
if [ -f .nvmrc ] && [ -s "$nvm_sh" ]; then
  set +u
  # shellcheck disable=SC1090
  . "$nvm_sh" --no-use >/dev/null 2>&1
  nvm use --silent >/dev/null 2>&1 || note "nvm has no Node $(cat .nvmrc) (run: nvm install); using $(node -v 2>/dev/null)."
  set -u
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  note "site files changed but node or npm was not found; tests, astro check and build skipped."
  exit 0
fi

active=$(printf '%s' "$input" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(String(JSON.parse(s).stop_hook_active === true)); }
    catch { process.stdout.write("false"); }
  });')
[ "$active" = "true" ] && exit 0

# A worktree under .claude/worktrees/ has no node_modules of its own and resolves the main
# checkout's by walking up, so look up the tree the way node does. (require.resolve cannot
# be used: these packages do not export their package.json.)
if ! node -e '
  const fs = require("fs"), path = require("path");
  const installed = (pkg) => {
    for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, "node_modules", pkg, "package.json"))) return true;
      if (path.dirname(dir) === dir) return false;
    }
  };
  process.exit(["astro", "vitest", "@astrojs/check"].every(installed) ? 0 : 1);' 2>/dev/null; then
  note "dependencies are not installed (astro, vitest or @astrojs/check not found); run npm ci to enable the checks here."
  exit 0
fi

# Run all three even when one fails, so the one bounce carries every error. NO_COLOR and the
# sed below keep terminal colour codes out of what Claude reads (astro check ignores NO_COLOR).
export NO_COLOR=1
test_out=$(npm test --silent 2>&1); test_status=$?
check_out=$(npm run --silent astro -- check 2>&1); check_status=$?
build_out=$(npm run --silent build 2>&1); build_status=$?
[ "$test_status" -eq 0 ] && [ "$check_status" -eq 0 ] && [ "$build_status" -eq 0 ] && exit 0

{
  echo "stop-verify: the unit tests, astro check or the build failed. Fix these before finishing; if"
  echo "they are in files another session is editing, say so instead. This hook will not block a second time."
  [ "$test_status" -ne 0 ] && { echo "--- npm test (exit $test_status), last 40 lines:"; printf '%s\n' "$test_out" | tail -n 40; }
  [ "$check_status" -ne 0 ] && { echo "--- astro check (exit $check_status), last 40 lines:"; printf '%s\n' "$check_out" | tail -n 40; }
  [ "$build_status" -ne 0 ] && { echo "--- npm run build (exit $build_status), last 40 lines:"; printf '%s\n' "$build_out" | tail -n 40; }
} 2>&1 | sed -E $'s/\x1b\\[[0-9;]*m//g' >&2
# Claude Code reads an exit 2 with empty stdout and a "No such file or directory" stderr as a
# hook that could not start, and lets the turn end. One stdout line rules that reading out.
echo "stop-verify: blocked on test, astro check or build errors"
exit 2
