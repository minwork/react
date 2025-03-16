import { colorProjectName, printHeader } from '../utils/output';
import { releaseChangelog } from 'nx/release';
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
