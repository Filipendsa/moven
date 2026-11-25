import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

function parseVersionString(ver) {
  const m = String(ver || "").match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    build: Number(m[3]),
    revision: Number(m[4]),
  };
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
      build: 0,
      revision: 0,
    };
  }

  if (/^feat(\([^)]+\))?:/i.test(subject)) {
    return {
      major: version.major,
      minor: version.minor + 1,
      build: 0,
      revision: 0,
    };
  }

  if (/^(fix|hotfix|patch)(\([^)]+\))?:/i.test(subject)) {
    return {
      major: version.major,
      minor: version.minor,
      build: version.build,
      revision: version.revision + 1,
    };
  }

  return {
    major: version.major,
    minor: version.minor,
    build: version.build + 1,
    revision: 0,
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
    ...current,
    version: `${current.major}.${current.minor}.${current.build}.${current.revision}`,
    commitsSinceTag: entries.length,
  };
}

function readVersionManifest(cwd) {
  const manifestPath = resolve(cwd, "version.json");
  if (!existsSync(manifestPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
    const nums = parseVersionString(parsed.version);
    if (!nums) return null;
    return { ...nums, version: parsed.version };
  } catch {
    return null;
  }
}

/**
 * Resolves a 4-segment Semantic Git-based version (`MAJOR.MINOR.PATCH.BUILD`).
 */
export function resolveGitVersion(cwd = process.cwd()) {
  const isShallow =
    runGit("git rev-parse --is-shallow-repository", cwd) === "true";
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
        build: Number(patchStr),
        revision: Number(baseBuildStr),
      };

      const computed = computeSemanticVersionFromRange(baseVersion, baseTag, cwd);
      if (computed) {
        return {
          ...computed,
          commit: sha,
          tag: baseTag,
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
      { major: 1, minor: 0, build: 0, revision: 0 },
      BASELINE_RELEASE_COMMIT,
      cwd
    );
    if (computed) {
      return {
        ...computed,
        commit: shortSha,
        tag: "v1.0.0.0",
        label: shortSha
          ? `v${computed.version} (${shortSha})`
          : `v${computed.version}`,
      };
    }
  }

  // Shallow clone / Vercel fallback: read committed version.json manifest
  const manifest = readVersionManifest(cwd);
  if (manifest) {
    return {
      ...manifest,
      commit: shortSha,
      tag: `v${manifest.version}`,
      commitsSinceTag: 0,
      label: shortSha
        ? `v${manifest.version} (${shortSha})`
        : `v${manifest.version}`,
    };
  }

  const fallbackVersion =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() ||
    (shortSha ? FALLBACK_BASE_VERSION : INITIAL_VERSION);
  const fallbackNums = parseVersionString(fallbackVersion) || {
    major: 1,
    minor: 16,
    build: 0,
    revision: 18,
  };

  return {
    ...fallbackNums,
    version: fallbackVersion,
    commit: shortSha,
    tag: `v${fallbackVersion}`,
    commitsSinceTag: 0,
    label: shortSha
      ? `v${fallbackVersion} (${shortSha})`
      : `v${fallbackVersion}`,
  };
}

export function writeVersionFiles(cwd = process.cwd()) {
  const info = resolveGitVersion(cwd);

  const manifestPath = resolve(cwd, "version.json");
  const manifestContent =
    JSON.stringify(
      {
        version: info.version,
        major: info.major,
        minor: info.minor,
        build: info.build,
        revision: info.revision,
      },
      null,
      2
    ) + "\n";
  writeFileSync(manifestPath, manifestContent, "utf8");

  const versionTsPath = resolve(cwd, "src/shared/config/version.ts");
  const versionTsContent = `export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "${info.version}";

export const APP_COMMIT = process.env.NEXT_PUBLIC_APP_COMMIT?.trim() || "";

export const APP_VERSION_LABEL = APP_COMMIT
  ? \`v\${APP_VERSION} (\${APP_COMMIT})\`
  : \`v\${APP_VERSION}\`;
`;
  writeFileSync(versionTsPath, versionTsContent, "utf8");

  return info;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
  const info = process.argv.includes("--write")
    ? writeVersionFiles()
    : resolveGitVersion();

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log(info.label);
  }
}
