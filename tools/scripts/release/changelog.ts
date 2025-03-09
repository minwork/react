import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { colorProjectName, printHeader } from '../utils/output';
import { releaseChangelog } from 'nx/release';
import { ChangelogOptions as NxChangelogOptions } from 'nx/src/command-line/release/command-object';
import { getGitTail, getLatestGitTagVersionsForProject } from './git';
import { isPrereleaseVersion } from './version';
import chalk from 'chalk';
import { HandleChangelogOptions } from './changelog.types';

export async function handleChangelog({ projectName, isPrerelease, options }: HandleChangelogOptions): Promise<void> {
  // Option to explicitly specify scope of the changelog
  let from: string | undefined;
  const currentVersion = options.versionData[projectName].currentVersion;
  const newVersion = options.versionData[projectName].newVersion;

  // If generating changelog for regular release but current version is detected as prerelease, then explicitly specify 'from' option to generate changelog from last regular release
  if (!isPrerelease && isPrereleaseVersion(currentVersion)) {
    console.log(
      printHeader('changelog', 'cyan'),
      `Correcting changelog generation for ${colorProjectName(projectName)}\n`
    );

    // Get latest regular release version that is not a new version
    const { releaseVersionTag, releaseVersion } = await getLatestGitTagVersionsForProject(projectName, newVersion);

    if (releaseVersion && releaseVersionTag) {
      console.log(
        colorProjectName(projectName),
        'Detected changelog generation from',
        chalk.red(currentVersion),
        'to',
        chalk.redBright(newVersion),
        'but instead will generate from',
        chalk.yellow(releaseVersion),
        'to',
        chalk.green(newVersion)
      );

      from = releaseVersionTag;
    } else {
      console.log(
        colorProjectName(projectName),
        'Detected changelog generation from',
        chalk.red(currentVersion),
        'to',
        chalk.redBright(newVersion),
        'but instead will generate from',
        chalk.yellow('TAIL'),
        'to',
        chalk.green(newVersion)
      );

      from = await getGitTail();
    }
  }

  await releaseChangelog({
    ...options,
    projects: [projectName],
    from,
  });
}

export async function handlePrereleaseChangelog({ versionData, dryRun, verbose }: NxChangelogOptions): Promise<void> {
  const projectsList = getChangedProjectsList(versionData);

  await releaseChangelog({
    versionData,
    dryRun,
    verbose,
    projects: projectsList,
  });
}

export async function handleRegularReleaseChangelog({
  versionData,
  dryRun,
  verbose,
}: NxChangelogOptions): Promise<void> {
  const projectsList = getChangedProjectsList(versionData);

  // Find projects that need to be released explicitly
  const explicitProjects = projectsList.filter((projectName) =>
    isPrereleaseVersion(versionData[projectName].currentVersion)
  );
  // Rest of the projects
  const implicitProjects = projectsList.filter((projectName) => !explicitProjects.includes(projectName));

  if (explicitProjects.length > 0) {
    console.log(
      printHeader('changelog', 'cyan'),
      `Correcting changelog generation for ${explicitProjects.map((project) => colorProjectName(project)).join(', ')}\n`
    );

    // Create changelog per project specifying 'from' parameter to correct changelog scope
    for (const projectName of explicitProjects) {
      const { releaseVersionTag, releaseVersion } = await getLatestGitTagVersionsForProject(projectName);
      console.log(
        colorProjectName(projectName),
        'Detected changelog generation from',
        chalk.red(versionData[projectName].currentVersion),
        'to',
        chalk.redBright(versionData[projectName].newVersion),
        'but instead will generate from',
        chalk.yellow(releaseVersion),
        'to',
        chalk.green(versionData[projectName].newVersion)
      );

      await releaseChangelog({
        versionData,
        dryRun,
        verbose,
        projects: [projectName],
        from: releaseVersionTag,
      });
    }
  }

  // Now release rest of the projects using regular flow
  if (implicitProjects.length > 0) {
    await releaseChangelog({
      versionData,
      dryRun,
      verbose,
      projects: implicitProjects,
    });
  }
}

function getChangedProjectsList(versionData: VersionData): string[] {
  const projectsList = Object.entries(versionData)
    .filter(([, entry]) => entry.newVersion !== null && entry.newVersion !== entry.currentVersion)
    .map(([project]) => project);

  // If there is no project with new version exit
  if (projectsList.length === 0) {
    console.log(
      printHeader('version', 'yellow'),
      `No changes detected across any package, skipping changelog and publish step altogether\n`
    );
    process.exit(0);
  }

  return projectsList;
}
