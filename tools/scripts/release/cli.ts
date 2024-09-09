import * as yargs from 'yargs';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';
import chalk from 'chalk';
import { printHeader } from '../utils/output';
import { execaSync } from 'execa';

export function parseReleaseCliOptions() {
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

export function getOptionsBasedOnBranch(): { isPrerelease: boolean; preid?: string; tag: string } {
  // Get current branch
  const { stdout: branch } = execaSync('git', ['branch', '--show-current']);

  // Determine options based on branch
  const isPrerelease = branch !== 'main';
  const preid: string | undefined = isPrerelease ? 'preview' : undefined;
  const tag: string = isPrerelease ? 'preview' : 'latest';

  // Output which branch is used
  console.log(printHeader('branch', 'blueBright'), `Detecting current git branch\n`);
  console.log(`${chalk.blueBright(branch)} 🔀 Using "${chalk.yellow(preid ?? '[empty]')}" preid\n`);

  return {
    isPrerelease,
    preid,
    tag,
  };
}
