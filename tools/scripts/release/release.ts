import { releasePublish } from 'nx/release';
import * as process from 'node:process';
import chalk from 'chalk';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';
import { printHeader } from '../utils/output';
import { syncPackageJson } from './publish';
import { parseReleaseOptions, parseReleaseCliOptions } from './cli';
import { handlePrereleaseVersioning, handleRegularReleaseVersioning } from './version';
import { handlePrereleaseChangelog, handleRegularReleaseChangelog } from './changelog';

(async () => {
  const options = await parseReleaseCliOptions();
  const graph = await createProjectGraphAsync({ exitOnError: true });
  const { tag, preid, isPrerelease } = parseReleaseOptions(options);

  const releaseEnabled = process.env.RELEASE_ENABLED === '1' || process.env.RELEASE_ENABLED === 'true';

  console.info(
    printHeader('release', 'yellow'),
    `Live release enabled? ${releaseEnabled ? chalk.green('Yes') : chalk.red('No')} (RELEASE_ENABLED=${
      process.env.RELEASE_ENABLED
    })\n`
  );

  let projectsList: string[] = options.projects ?? [];

  // Create new version and update changelog if not only publishing
  if (options.publishOnly) {
    console.log(printHeader('mode', 'cyanBright'), `Publish only, skipping version and changelog\n`);
  } else {
    if (isPrerelease) {
      const versionData = await handlePrereleaseVersioning({
        preid,
        projects: options.projects,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
      await handlePrereleaseChangelog({
        versionData,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    } else {
      const versionData = await handleRegularReleaseVersioning({
        preid,
        projects: options.projects,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });

      await handleRegularReleaseChangelog({
        versionData,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    }
  }

  // Sync package.json files before release
  syncPackageJson(projectsList, graph);

  // The returned number value from releasePublish will be zero if all projects are published successfully, non-zero if not
  const publishProjectsResult = await releasePublish({
    dryRun: options.dryRun,
    verbose: options.verbose,
    projects: projectsList,
    tag,
    registry: 'https://registry.npmjs.org/',
    otp: options.otp,
  });

  const publishStatus = Object.values(publishProjectsResult).reduce((sum, { code }) => sum + code, 0);

  process.exit(publishStatus);
})();
