import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const BASELINE_RELEASE_COMMIT = "c30ed3497c23704b05f580898957f14c14381cbb";
export const INITIAL_VERSION = "0.0.0.0";
export const FALLBACK_BASE_VERSION = "1.16.0.18";

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

function applyCommitBump(version, subject, body = "") {
  const fullText = `${subject}\n${body}`;
  const isBreaking =
    /^[a-z]+(\([^)]+\))?!:/i.test(subject) ||
    /BREAKING CHANGE/i.test(fullText);

  if (isBreaking) {
    return {
      major: version.major + 1,
      minor: 0,
      patch: 0,
      build: version.build + 1,
    };
  }

  if (/^feat(\([^)]+\))?:/i.test(subject)) {
    return {
      major: version.major,
      minor: version.minor + 1,
      patch: 0,
      build: version.build + 1,
    };
  }

  return {
    major: version.major,
    minor: version.minor,
    patch: version.patch + 1,
    build: version.build + 1,
  };
}

function computeSemanticVersionFromRange(baseVersion, fromRef, cwd) {
  const rawLog = runGit(
    `git log --reverse --format="%s%x1f%b%x1e" ${fromRef}..HEAD`,
    cwd
  );
  if (rawLog === null) return null;

  let current = { ...baseVersion };
  const entries = rawLog
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const [subject = "", body = ""] = entry.split("\x1f");
    current = applyCommitBump(current, subject.trim(), body.trim());
  }

  return {
    version: `${current.major}.${current.minor}.${current.patch}.${current.build}`,
    commitsSinceTag: entries.length,
  };
}

/**
 * Resolves a 4-segment Semantic Git-based version (`MAJOR.MINOR.PATCH.BUILD`).
 *
 * - Tag `v1.0.0.0` at `c30ed3497c23704b05f580898957f14c14381cbb` represents the first release (`1.0.0.0`).
 * - Analyzes every commit since the latest release tag (or baseline commit):
 *   - Breaking change (`feat!:`, `fix!:`, `BREAKING CHANGE`): increments MAJOR, resets MINOR & PATCH.
 *   - `feat:` / `feat(...)`: increments MINOR, resets PATCH.
 *   - `fix:`, `refactor:`, `chore:`, etc.: increments PATCH.
 *   - Every commit increments BUILD (4th segment).
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
        const [, majorStr, minorStr, patchStr, baseBuildStr, , sha] = match;
        const baseTag = `v${majorStr}.${minorStr}.${patchStr}.${baseBuildStr}`;
        const baseVersion = {
          major: Number(majorStr),
          minor: Number(minorStr),
          patch: Number(patchStr),
          build: Number(baseBuildStr),
        };

        const computed = computeSemanticVersionFromRange(baseVersion, baseTag, cwd);
        if(computed) {
          return {
            version: computed.version,
            commit: sha,
            tag: baseTag,
            commitsSinceTag: computed.commitsSinceTag,
            label: `v${computed.version} (${sha})`,
          };
        }
      }
    }

    // Fallback when tags are absent (e.g., shallow fetch without tags)
    const isBaselineAncestor =
      runGit(
        `git merge-base --is-ancestor ${BASELINE_RELEASE_COMMIT} HEAD && echo yes`,
        cwd
      ) === "yes";

    if (isBaselineAncestor) {
    const computed = computeSemanticVersionFromRange(
          { major: 1, minor: 0, patch: 0, build: 0 },
          BASELINE_RELEASE_COMMIT,
          cwd
        );
      if (computed) {
        return {
          version: computed.version,
          commit: shortSha,
          tag: "v1.0.0.0",
          commitsSinceTag: computed.commitsSinceTag,
          label: shortSha
            ? `v${computed.version} (${shortSha})`
            : `v${computed.version}`,
        };
      }
    }

    const fallbackVersion =
      process.env.NEXT_PUBLIC_APP_VERSION?.trim() ||
      (shortSha ? FALLBACK_BASE_VERSION : INITIAL_VERSION);

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
