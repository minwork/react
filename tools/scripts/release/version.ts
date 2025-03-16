import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { colorProjectName, printHeader } from '../utils/output';
import { diff, parse, prerelease, ReleaseType } from 'semver';
import chalk from 'chalk';
import { releaseVersion } from 'nx/release';
import { VersionOptions as NxVersionOptions } from 'nx/src/command-line/release/command-object';
import { HandleVersionOptions } from './version.types';

export async function handleVersion({
  options,
  projectName,
  suggestedVersionData,
  isPrerelease,
}: HandleVersionOptions): Promise<VersionData | null> {
  // If suggested version was modified
  let modified = false;
  let { newVersion, currentVersion } = suggestedVersionData;

  console.log(printHeader('version', 'cyan'), 'Detecting version changes\n');

  // If no change, skip
  if (newVersion === currentVersion) {
    console.log(colorProjectName(projectName), 'Current version same as the new version, skipping');
    return null;
  }

  // If new version was detected as prerelease, but it shouldn't correct it to proper regular version
  if (newVersion !== null && isPrereleaseVersion(newVersion) && !isPrerelease) {
    const regularVersion = getRegularVersionFromPrerelease(newVersion);

    console.log(
      colorProjectName(projectName),
      'Detected version change from',
      chalk.red(currentVersion),
      'to',
      chalk.yellow(newVersion),
      'but instead correcting to',
      chalk.green(regularVersion)
    );

    newVersion = regularVersion;
    modified = true;
  }

  // If no new version was detected but current is prerelease and want to release regular then promote it
  if (newVersion === null && !isPrerelease && isPrereleaseVersion(currentVersion)) {
    const regularVersion = getRegularVersionFromPrerelease(currentVersion);

    console.log(
      colorProjectName(projectName),
      'Promoting prerelease version',
      chalk.yellow(currentVersion),
      'to',
      chalk.green(regularVersion)
    );

    newVersion = regularVersion;
    modified = true;
  }

  // If no modifications were made just log what will be released
  if (!modified) {
    console.log(
      colorProjectName(projectName),
      'Detected version change from',
      chalk.red(currentVersion),
      'to',
      chalk.green(newVersion)
    );
  }

  // Calculate precise specifier if modified
  const specifier: ReleaseType | undefined =
    modified && newVersion ? diff(newVersion, currentVersion) ?? undefined : undefined;

  // Version using NX version script
  const { projectsVersionData } = await releaseVersion({
    ...options,
    specifier,
    projects: [projectName],
  });

  return projectsVersionData;
}

export async function getSuggestedProjectsVersionData(options: NxVersionOptions): Promise<VersionData> {
  const { projectsVersionData } = await releaseVersion({
    ...options,
    gitCommit: false,
    gitTag: false,
    dryRun: true,
    verbose: false,
    stageChanges: false,
  });

  return projectsVersionData;
}

export function isPrereleaseVersion(version: string): boolean {
  const prereleaseComponents = prerelease(version);
  return (prereleaseComponents?.length ?? 0) > 0;
}

export function getRegularVersionFromPrerelease(prereleaseVersion: string): string {
  if (!isPrereleaseVersion(prereleaseVersion)) {
    throw new Error(
      `Trying to get regular version from prerelease version, but provided version is not prerelease: ${chalk.red(
        prereleaseVersion
      )}`
    );
  }

  const data = parse(prereleaseVersion);

  if (data === null) {
    throw new Error(`Cannot parse prerelease version ${prereleaseVersion}`);
  }

  return `${data.major}.${data.minor}.${data.patch}`;
}
