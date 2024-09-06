import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';
import * as yargs from 'yargs';
import * as process from 'node:process';
import { $, execaSync } from 'execa';
import chalk from 'chalk';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';
import { execCommand } from 'nx/src/command-line/release/utils/exec-command';

(async () => {
  const options = await yargs
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

  // Get current branch
  const { stdout: branch } = execaSync('git', ['branch', '--show-current']);

  // Determine options based on specifier
  const specifier: string | undefined = options.version ?? (branch === 'main' ? undefined : 'prerelease');
  const isPrerelease = specifier === 'prerelease';
  const preid: string | undefined = isPrerelease ? 'preview' : undefined;
  const tag: string = isPrerelease ? 'preview' : 'latest';

  console.log(`${chalk.bgBlueBright(chalk.black(' BRANCH '))}  Detecting current git branch\n`);
  console.log(`${chalk.blueBright(branch)} 🔀 Using ${chalk.yellow(specifier ?? 'default')} specifier\n`);

  console.log('Tags list exec command', await execCommand('git', ['tag', '--sort', '-v:refname']));
  console.log('Tags list execa', execaSync('git', ['tag', '--sort', '-v:refname']).stdout);

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

    // If there is no package with new version
    if (Object.values(projectsVersionData).every((entry) => entry.newVersion === null)) {
      console.log(
        `${chalk.bgYellowBright(
          chalk.black(' VERSION ')
        )}  No changes detected across any package, skipping publish step altogether\n`
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
      `Running command "nx run-many -t build ${options.projects && `--projects=${options.projects}`} --verbose=${
        options.verbose ? 'true' : 'false'
      }"\n`
    );

    await $({ stdout: process.stdout, stderr: process.stderr, verbose: options.verbose })`nx run-many -t build ${
      options.projects && `--projects=${options.projects}`
    } --verbose=${options.verbose ? 'true' : 'false'}`;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  // The returned number value from releasePublish will be zero if all projects are published successfully, non-zero if not
  const publishStatus = await releasePublish({
    dryRun: options.dryRun,
    verbose: options.verbose,
    projects: options.projects,
    tag,
    registry: 'https://registry.npmjs.org/',
    otp: options.otp,
  });

  process.exit(publishStatus);
})();
