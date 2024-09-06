import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';
import * as yargs from 'yargs';
import * as process from 'node:process';
import { $, execaSync } from 'execa';
import chalk from 'chalk';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';

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
  console.log(`${chalk.blueBright(branch)} 🔀 Using ${chalk.yellow(specifier ?? 'default')} specifier`);

  const { workspaceVersion, projectsVersionData } = await releaseVersion({
    specifier,
    preid,
    dryRun: options.dryRun,
    verbose: options.verbose,
    projects: options.projects,
  });

  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun: options.dryRun,
    verbose: options.verbose,
    projects: options.projects,
  });

  // An explicit null value here means that no changes were detected across any package
  if (workspaceVersion === null) {
    console.log('⏭️ No changes detected across any package, skipping publish step altogether');
    process.exit(0);
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
  });
  process.exit(publishStatus);
})();
