import { VersionData } from 'nx/src/command-line/release/utils/shared';
import { colorProjectName, printHeader } from '../utils/output';
import { releaseChangelog } from 'nx/release';
import { ChangelogOptions } from 'nx/src/command-line/release/command-object';
import { getLatestGitTagVersionsForProject } from './git';
import { isPrereleaseVersion } from './version';
import chalk from 'chalk';

export async function handlePrereleaseChangelog({ versionData, dryRun, verbose }: ChangelogOptions): Promise<void> {
  const projectsList = getChangedProjectsList(versionData);

  await releaseChangelog({
    versionData,
    dryRun,
    verbose,
    projects: projectsList,
  });
}

export async function handleRegularReleaseChangelog({ versionData, dryRun, verbose }: ChangelogOptions): Promise<void> {
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
  await releaseChangelog({
    versionData,
    dryRun,
    verbose,
    projects: implicitProjects,
  });
}

function getChangedProjectsList(versionData: VersionData): string[] {
  const projectsList = Object.entries(versionData)
    .filter(([project, entry]) => entry.newVersion !== null && entry.newVersion !== entry.currentVersion)
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
