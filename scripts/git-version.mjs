import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const BASELINE_RELEASE_COMMIT = "c30ed3497c23704b05f580898957f14c14381cbb";
export const INITIAL_VERSION = "0.0.0.0";

function runGit(command, cwd) {
  try {
    return execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Resolves a 4-segment Git-based version (`MAJOR.MINOR.PATCH.BUILD`).
 *
 * - Tag `v1.0.0.0` at `c30ed3497c23704b05f580898957f14c14381cbb` represents the first release (`1.0.0.0`).
 * - Each subsequent commit increments the 4th segment (`1.0.0.1`, `1.0.0.2`, ...).
 * - Creating a newer annotated tag (e.g. `git tag -a v1.1.0.0 -m "Release 1.1.0.0"`)
 *   resets the baseline and restarts the 4th segment from that tag.
 */
export function resolveGitVersion(cwd = process.cwd()) {
  const isShallow = runGit("git rev-parse --is-shallow-repository", cwd) === "true";
  if (isShallow) {
    runGit("git fetch --unshallow --tags", cwd);
  }

  const shortSha =
    runGit("git rev-parse --short HEAD", cwd) ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    "";

  const described = runGit(
    'git describe --tags --long --match "v[0-9]*.[0-9]*.[0-9]*.[0-9]*"',
    cwd
  );

  if (described) {
    const match = described.match(
      /^v(\d+)\.(\d+)\.(\d+)\.(\d+)-(\d+)-g([0-9a-f]+)$/i
    );
    if (match) {
      const [, major, minor, patch, baseBuild, commitsAhead, sha] = match;
      const commitsSinceTag = Number(commitsAhead);
      const buildNumber = Number(baseBuild) + commitsSinceTag;
      const version = `${major}.${minor}.${patch}.${buildNumber}`;
      return {
        version,
        commit: sha,
        tag: `v${major}.${minor}.${patch}.${baseBuild}`,
        commitsSinceTag,
        label: `v${version} (${sha})`,
      };
    }
  }

  // Fallback when tags are absent (e.g., shallow fetch without tags)
  const isBaselineAncestor =
    runGit(
      `git merge-base --is-ancestor ${BASELINE_RELEASE_COMMIT} HEAD && echo yes`,
      cwd
    ) === "yes";

  if (isBaselineAncestor) {
    const countStr = runGit(
      `git rev-list --count ${BASELINE_RELEASE_COMMIT}..HEAD`,
      cwd
    );
    const commitsSinceTag = Number(countStr || "0");
    const version = `1.0.0.${commitsSinceTag}`;
    return {
      version,
      commit: shortSha,
      tag: "v1.0.0.0",
      commitsSinceTag,
      label: shortSha ? `v${version} (${shortSha})` : `v${version}`,
    };
  }

  const fallbackVersion =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() ||
    (shortSha ? "1.0.0.0" : INITIAL_VERSION);

  return {
    version: fallbackVersion,
    commit: shortSha,
    tag: `v${fallbackVersion}`,
    commitsSinceTag: 0,
    label: shortSha ? `v${fallbackVersion} (${shortSha})` : `v${fallbackVersion}`,
  };
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
  const info = resolveGitVersion();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log(info.label);
  }
}
