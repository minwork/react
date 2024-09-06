import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';
import * as yargs from 'yargs';
import * as process from 'node:process';
import { $, execaSync } from 'execa';
import chalk from 'chalk';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';

(async () => {
  const options = await parseOptions();

  // Get current branch
  const { stdout: branch } = execaSync('git', ['branch', '--show-current']);

  // Determine options based on specifier
  const specifier: string | undefined = options.version ?? (branch === 'main' ? undefined : 'prerelease');
  const isPrerelease = specifier === 'prerelease';
  const preid: string | undefined = isPrerelease ? 'preview' : undefined;
  const tag: string = isPrerelease ? 'preview' : 'latest';

  // Output which branch is used
  console.log(`${chalk.bgBlueBright(chalk.black(' BRANCH '))}  Detecting current git branch\n`);
  console.log(`${chalk.blueBright(branch)} 🔀 Using ${chalk.yellow(preid ?? '[empty]')} preid\n`);

  let projectsList: string[] = options.projects ?? [];

  // Create new version and update changelog if not only publishing
  if (options.publishOnly) {
    console.log(`${chalk.bgCyanBright(chalk.black(' MODE '))}  Publish only, skipping version and changelog\n`);
  } else {
    const { workspaceVersion, projectsVersionData } = await releaseVersion({
      // specifier,
      preid,
      dryRun: options.dryRun,
      verbose: options.verbose,
      projects: options.projects,
    });

    // Filter projects that have new version
    projectsList = Object.entries(projectsVersionData)
      .filter(([project, entry]) => entry.newVersion !== null)
      .map(([project]) => project);

    // If there is no package with new version
    if (projectsList.length === 0) {
      console.log(
        `${chalk.bgYellowBright(
          chalk.black(' VERSION ')
        )}  No changes detected across any package, skipping changelog and publish step altogether\n`
      );
      process.exit(0);
    }

    await releaseChangelog({
      versionData: projectsVersionData,
      version: workspaceVersion,
      dryRun: options.dryRun,
      verbose: options.verbose,
      projects: options.projects,
    });
  }

  // Build selected projects to ensure bumped version of package.json in output
  try {
    console.log(
      chalk.bgBlueBright(chalk.black(' BUILD ')),
      `Running command "nx run-many -t build --projects=${options.projects ?? ''} --verbose=${
        options.verbose ? 'true' : 'false'
      }"\n`
    );

    await $({
      stdout: 'inherit',
      stderr: 'inherit',
      verbose: options.verbose,
    })`nx run-many -t build --projects=${options.projects ?? ''} --verbose=${options.verbose ? 'true' : 'false'}`;
  } catch (error) {
    process.exit(1);
  }

  // The returned number value from releasePublish will be zero if all projects are published successfully, non-zero if not
  const publishStatus = await releasePublish({
    dryRun: options.dryRun,
    verbose: options.verbose,
    projects: projectsList,
    tag,
    registry: 'https://registry.npmjs.org/',
    otp: options.otp,
  });

  process.exit(publishStatus);
})();

function parseOptions() {
  return yargs
    .version(false) // don't use the default meaning of version in yargs
    .option('version', {
      description: 'Explicit version specifier to use, if overriding conventional commits',
      type: 'string',
    })
    .option('dryRun', {
      alias: 'd',
      description: 'Whether or not to perform a dry-run of the release process, defaults to true',
      type: 'boolean',
      default: true,
    })
    .option('verbose', {
      description: 'Whether or not to enable verbose logging, defaults to false',
      type: 'boolean',
      default: false,
    })
    .options('publishOnly', {
      description: 'Whether or not to only execute publishing step',
      type: 'boolean',
      default: false,
    })
    .option('otp', {
      description: 'One time password for publishing',
      type: 'number',
    })
    .option('projects', {
      type: 'string',
      alias: 'p',
      coerce: parseCSV,
      describe: 'Projects to run. (comma/space delimited project names and/or patterns)',
    })
    .parseAsync();
}
