import { releasePublish } from 'nx/release';
import * as process from 'node:process';
import chalk from 'chalk';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';
import { printHeader } from '../utils/output';
import { syncPackageJson } from './publish';
import { parseReleaseOptions, parseReleaseCliOptions } from './cli';
import { handlePrereleaseVersioning, handleRegularReleaseVersioning } from './version';
import { handlePrereleaseChangelog, handleRegularReleaseChangelog } from './changelog';
import { hasGitChanges } from './git';

(async () => {
  const options = await parseReleaseCliOptions();
  const graph = await createProjectGraphAsync({ exitOnError: true });
  const { publishOnly, projects, verbose, otp, skipPublish } = options;
  const { tag, preid, isPrerelease, dryRun } = parseReleaseOptions(options);

  let projectsList: string[] = projects ?? [];

  if (verbose) {
    console.group(printHeader('Options', 'gray'), 'Provided and calculated options');
    console.log('{');
    Object.entries({ projects, verbose, publishOnly, skipPublish, tag, preid, isPrerelease, dryRun }).forEach(
      ([key, value]) => {
        console.log(`  ${chalk.whiteBright(key)}: ${chalk.cyan(value)}`);
      }
    );
    console.log('}');
    console.groupEnd();
    console.log('\n');
  }

  if (!dryRun && (await hasGitChanges())) {
    console.warn(printHeader('git', 'redBright'), '🚨 Detected uncommitted git changes, aborting! 🚨');
    console.log(chalk.grey('Commit your changes first, then run release as it will create new commits'));
    process.exit(1);
  }

  if (publishOnly) {
    // Create new version and update changelog if not only publishing
    console.log(printHeader('mode', 'cyanBright'), `Publish only, skipping version and changelog\n`);
  } else {
    if (isPrerelease) {
      const versionData = await handlePrereleaseVersioning({
        preid,
        projects,
        dryRun,
        verbose,
      });
      await handlePrereleaseChangelog({
        versionData,
        dryRun,
        verbose,
      });
    } else {
      const versionData = await handleRegularReleaseVersioning({
        preid,
        projects: projects,
        dryRun,
        verbose,
      });

      await handleRegularReleaseChangelog({
        versionData,
        dryRun,
        verbose,
      });
    }
  }

  console.log('\n');

  if (skipPublish) {
    console.log(printHeader('mode', 'cyanBright'), `Skip publish, version and changelog only\n`);
    process.exit(0);
  } else {
    // Sync package.json files before release
    syncPackageJson(projectsList, graph);

    // The returned number value from releasePublish will be zero if all projects are published successfully, non-zero if not
    const publishProjectsResult = await releasePublish({
      dryRun,
      verbose,
      projects: projectsList,
      tag,
      registry: 'https://registry.npmjs.org/',
      otp,
    });

    const publishStatus = Object.values(publishProjectsResult).reduce((sum, { code }) => sum + code, 0);

    process.exit(publishStatus);
  }
})();
