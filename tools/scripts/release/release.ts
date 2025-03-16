import { releasePublish } from 'nx/release';
import * as process from 'node:process';
import chalk from 'chalk';
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph';
import { colorProjectName, printHeader, suppressOutput } from '../utils/output';
import { syncPackageJson } from './publish';
import { parseReleaseCliOptions, parseReleaseOptions } from './cli';
import { getSuggestedProjectsVersionData, handleVersion } from './version';
import { hasGitChanges } from './git';
import { VersionOptions } from 'nx/src/command-line/release/command-object';
import { handleChangelog } from './changelog';

(async () => {
  const options = await parseReleaseCliOptions();
  const graph = await createProjectGraphAsync({ exitOnError: true });
  const { publishOnly, projects, otp, skipPublish, githubRelease } = options;
  const { tag, preid, isPrerelease, dryRun, isCI, verbose } = parseReleaseOptions(options);

  const projectsList = new Set(projects ?? []);

  // If using verbose option, dump calculated options as pseudo-JSON
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
    console.log('Calculating changed projects...\n');
    // Start by obtaining all projects and their suggested release version
    const versionOptions: VersionOptions = {
      preid,
      projects,
      dryRun,
      verbose,
    };
    const suggestedProjectsVersionData = await suppressOutput(() => getSuggestedProjectsVersionData(versionOptions));

    console.log(
      `Finished calculating proposed changes for ${Object.keys(suggestedProjectsVersionData)
        .map(colorProjectName)
        .join(', ')}.`
    );
    console.log('Proceeding with release...\n');

    // Iterate through changed projects and release them one by one
    for (const projectName of Object.keys(suggestedProjectsVersionData)) {
      const suggestedVersionData = suggestedProjectsVersionData[projectName];

      const versionData = await handleVersion({
        projectName,
        suggestedVersionData,
        isPrerelease,
        options: {
          preid,
          dryRun,
          verbose,
        },
      });

      // If version changed
      if (versionData) {
        await handleChangelog({
          projectName,
          isPrerelease,
          options: {
            versionData,
            dryRun,
            verbose,
            createRelease: githubRelease ? 'github' : undefined,
            gitPush: githubRelease || isCI ? true : undefined,
          },
        });
        // Add this project to projects list that will be published
        projectsList.add(projectName);
      }
    }
    /*if (isPrerelease) {
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
        projects,
        dryRun,
        verbose,
      });

      await handleRegularReleaseChangelog({
        versionData,
        dryRun,
        verbose,
      });
    }*/
  }

  console.log('\n');

  if (skipPublish) {
    console.log(printHeader('mode', 'cyanBright'), `Skip publish, version and changelog only\n`);
    return process.exit(0);
  } else {
    if (publishOnly && projects.length === 0) {
      console.error(
        printHeader('Projects', 'redBright'),
        `Trying to publish only but no projects were specified. This would release ALL projects with tag '${tag}'! Exiting...`
      );
      return process.exit(1);
    }

    const projectsListArray = Array.from(projectsList.values());
    // Sync package.json files before release
    syncPackageJson(projectsListArray, graph);

    // The returned number value from releasePublish will be zero if all projects are published successfully, non-zero if not
    const publishProjectsResult = await releasePublish({
      dryRun,
      verbose,
      projects: projectsListArray,
      tag,
      registry: 'https://registry.npmjs.org/',
      otp,
    });

    const publishStatus = Object.values(publishProjectsResult).reduce((sum, { code }) => sum + code, 0);

    return process.exit(publishStatus);
  }
})();
