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
  const { publishOnly, projects, verbose, otp } = options;
  const { tag, preid, isPrerelease, dryRun } = parseReleaseOptions(options);

  let projectsList: string[] = projects ?? [];

  // Create new version and update changelog if not only publishing
  if (publishOnly) {
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
})();
