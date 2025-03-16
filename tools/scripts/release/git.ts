import { execCommand } from 'nx/src/command-line/release/utils/exec-command';
import { interpolate } from 'nx/src/tasks-runner/utils';
import { readNxJson } from 'nx/src/config/nx-json';
import { isPrereleaseVersion } from './version';

function escapeRegExp(str: string): string {
  return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/g;

export async function getLatestGitTagVersionsForProject(
  projectName: string,
  excludeVersion?: string | null | string[]
): Promise<{
  releaseVersion: string | null;
  releaseVersionTag: string | null;
  prereleaseVersion: string | null;
  prereleaseVersionTag: string | null;
}> {
  const nxJson = readNxJson();
  const releaseTagPattern = nxJson?.release?.releaseTagPattern ?? '{projectName}@{version}';
  const excludedVersions: string[] =
    typeof excludeVersion === 'string' ? [excludeVersion] : Array.isArray(excludeVersion) ? excludeVersion : [];

  try {
    let tags: string[];
    tags = await execCommand('git', ['tag', '--sort', '-v:refname', '--merged']).then((r) =>
      r
        .trim()
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean)
    );
    if (!tags.length) {
      // try again, but include all tags on the repo instead of just --merged ones
      tags = await execCommand('git', ['tag', '--sort', '-v:refname']).then((r) =>
        r
          .trim()
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      );
    }

    // If no tags matched both version will be null
    if (!tags.length) {
      return { releaseVersion: null, releaseVersionTag: null, prereleaseVersion: null, prereleaseVersionTag: null };
    }

    const interpolatedTagPattern = interpolate(releaseTagPattern, {
      version: '%v%',
      projectName,
    });

    const tagRegexp = `^${escapeRegExp(interpolatedTagPattern).replace('%v%', '(.+)').replace('%p%', '(.+)')}`;

    const matchingSemverTags = tags.filter(
      (tag) =>
        // Do the match against SEMVER_REGEX to ensure that we skip tags that aren't valid semver versions
        !!tag.match(tagRegexp) && tag.match(tagRegexp)?.some((r) => r.match(SEMVER_REGEX))
    );

    // If no tags matched both version will be null
    if (!matchingSemverTags.length) {
      return { releaseVersion: null, releaseVersionTag: null, prereleaseVersion: null, prereleaseVersionTag: null };
    }

    let releaseVersion: string | null = null;
    let releaseVersionTag: string | null = null;
    let prereleaseVersion: string | null = null;
    let prereleaseVersionTag: string | null = null;

    for (const semverTag of matchingSemverTags) {
      const match = semverTag.match(tagRegexp);
      if (!match) {
        continue;
      }
      const [tag, ...rest] = match;
      const version = rest.filter((r) => {
        return r.match(SEMVER_REGEX);
      })[0];

      // If this version is excluded then skip to the next one
      if (excludedVersions.includes(version)) {
        continue;
      }

      if (isPrereleaseVersion(version)) {
        if (prereleaseVersion === null) {
          prereleaseVersion = version;
          prereleaseVersionTag = tag;
        }
      } else {
        if (releaseVersion === null) {
          releaseVersion = version;
          releaseVersionTag = tag;
        }
      }
      if (prereleaseVersion !== null && releaseVersion !== null) {
        break;
      }
    }

    return {
      releaseVersion: releaseVersion,
      releaseVersionTag: releaseVersionTag,
      prereleaseVersion: prereleaseVersion,
      prereleaseVersionTag: prereleaseVersionTag,
    };
  } catch {
    return { releaseVersion: null, releaseVersionTag: null, prereleaseVersion: null, prereleaseVersionTag: null };
  }
}

export async function hasGitChanges(): Promise<boolean> {
  const changesAmount = await execCommand('git', ['status', '--porcelain']).then((result) => {
    return result.split('\n').filter((line) => line.trim().length > 0).length;
  });

  return changesAmount > 0;
}

export async function getGitTail(): Promise<string> {
  return await execCommand('git', ['rev-list', '--max-parents=0', 'HEAD']);
}
