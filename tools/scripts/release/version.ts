import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { colorProjectName, printHeader, suppressOutput } from '../utils/output';
import { diff, parse, prerelease, ReleaseType } from 'semver';
import chalk from 'chalk';
import { releaseVersion } from 'nx/release';
import { VersionOptions } from 'nx/src/command-line/release/command-object';

export async function handleRegularReleaseVersioning({
  preid,
  dryRun,
  verbose,
  projects,
}: VersioningOptions): Promise<VersionData> {
  const suggestedProjectsVersionData = await suppressOutput(() => getSuggestedProjectsVersionData({ preid, projects }));

  const specifiers: Partial<Record<ReleaseType, string[]>> = {};
  console.log(printHeader('version', 'cyan'), 'Detecting version changes\n');

  // Promote all prerelease versions to regular release
  for (const projectName in suggestedProjectsVersionData) {
    let { newVersion, currentVersion } = suggestedProjectsVersionData[projectName];

    // If no change, skip
    if (newVersion === currentVersion) {
      console.log(colorProjectName(projectName), 'Current version same as the new version, skipping');
      continue;
    }

    // If is prerelease and should be regular
    if (isPrereleaseVersion(newVersion)) {
      const regularVersion = getRegularVersionFromPrerelease(newVersion);
      // Promote prerelease version to proper release version
      console.log(
        colorProjectName(projectName),
        'Detected version change from',
        chalk.red(currentVersion),
        'to',
        chalk.yellow(newVersion),
        'but instead promoting to',
        chalk.green(regularVersion)
      );
      newVersion = regularVersion;
    } else if (newVersion === null && isPrereleaseVersion(currentVersion)) {
      // If no new version but just promoting prerelease to regular release
      newVersion = getRegularVersionFromPrerelease(currentVersion);
      console.log(
        colorProjectName(projectName),
        'Promoting prerelease version',
        chalk.yellow(currentVersion),
        'to',
        chalk.green(newVersion)
      );
    } else {
      console.log(
        colorProjectName(projectName),
        'Detected version change from',
        chalk.red(currentVersion),
        'to',
        chalk.green(newVersion)
      );
    }

    // Save changes per project
    const specifier = diff(newVersion, currentVersion);
    if (!specifiers[specifier]) {
      specifiers[specifier] = [];
    }
    specifiers[specifier].push(projectName);
  }

  // Apply release version per specifier providing projects list
  const projectsVersionData: VersionData = {};
  for (const specifier in specifiers) {
    const projects = specifiers[specifier as ReleaseType];
    const { projectsVersionData: partialVersionData } = await releaseVersion({
      specifier,
      preid,
      dryRun,
      verbose,
      projects,
    });
    Object.assign(projectsVersionData, partialVersionData);
  }

  // Correct current versions from prerelease to release
  /*for (const projectName in projectsVersionData) {
    const { currentVersion } = projectsVersionData[projectName];

    if (isPrereleaseVersion(currentVersion)) {
      const { releaseVersion, releaseVersionTag } = await getLatestGitTagVersionsForProject(projectName);
      projectsVersionData[projectName].currentVersion = releaseVersion;
    }
  }*/

  return projectsVersionData;
}

/**
 * Prerelease works good out of the box, so just use NX API
 *
 * @param specifier
 * @param preid
 * @param dryRun
 * @param verbose
 * @param projects
 */
export async function handlePrereleaseVersioning({
  preid,
  dryRun,
  verbose,
  projects,
}: VersioningOptions): Promise<VersionData> {
  const { projectsVersionData } = await releaseVersion({
    preid,
    dryRun,
    verbose,
    projects,
  });

  return projectsVersionData;
}

async function getSuggestedProjectsVersionData(options: VersionOptions): Promise<VersionData> {
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
  return prereleaseComponents?.length > 0;
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

  return `${data.major}.${data.minor}.${data.patch}`;
}

export interface VersioningOptions {
  // specifier?: ReleaseType | string;
  preid?: string;
  dryRun?: boolean;
  verbose?: boolean;
  projects: string[];
}
