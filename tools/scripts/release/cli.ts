import * as yargs from 'yargs';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';
import chalk from 'chalk';
import { printHeader } from '../utils/output';
import { execaSync } from 'execa';
import { ReleaseChannel, releaseChannelPreid } from './release.consts';
import { ReleasePreidValue } from './release.types';
import { ParsedOptions } from './cli.types';
import { isCI as isNxCI } from 'nx/src/utils/is-ci';

export function parseReleaseCliOptions() {
  return yargs
    .version(false) // don't use the default meaning of version in yargs
    .option('channel', {
      alias: 'c',
      description: 'Explicit channel specifier to use when not deploying based on branch',
      type: 'string',
      choices: Object.values(ReleaseChannel),
    })
    .option('dryRun', {
      alias: 'd',
      description: 'Whether or not to perform a dry-run of the release process, defaults to true',
      type: 'boolean',
      default: false,
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
    .options('skipPublish', {
      description: 'Whether or not to skip publishing step',
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
    .option('ci', {
      type: 'boolean',
      describe: 'Whether or not to run in CI context.',
      demandOption: false,
    })
    .option('githubRelease', {
      type: 'boolean',
      alias: 'ghr',
      default: false,
      describe: 'Whether or not to create Github release (doing so will require pushing changes)',
    })
    .parseAsync();
}

export function parseReleaseOptions({
  channel,
  dryRun,
  ci,
  verbose,
}: Awaited<ReturnType<typeof parseReleaseCliOptions>>): ParsedOptions {
  let isPrerelease: boolean;
  let preid: ReleasePreidValue;
  let tag: ReleaseChannel;

  let selectedChannel: ReleaseChannel;

  console.log(printHeader('channel', 'blueBright'), `Detecting release channel...\n`);

  if (!channel) {
    // Auto determine based on branch
    const { stdout: branch } = execaSync('git', ['branch', '--show-current']);
    console.log(`🚫 No channel specified, using current git branch ${chalk.blueBright(branch)}`);
    selectedChannel = branch === 'main' ? ReleaseChannel.Latest : ReleaseChannel.Preview;
  } else {
    selectedChannel = channel;
  }

  console.log(`🔀 ${chalk.yellow(selectedChannel)} channel selected for release\n`);

  switch (selectedChannel) {
    case ReleaseChannel.Latest:
      isPrerelease = false;
      break;
    case ReleaseChannel.Preview:
    default:
      isPrerelease = true;
      break;
  }

  preid = releaseChannelPreid[selectedChannel];
  tag = selectedChannel;

  const releaseEnabled = process.env.RELEASE_ENABLED === '1' || process.env.RELEASE_ENABLED === 'true';

  console.info(
    printHeader('release', 'yellow'),
    `Live release enabled? ${releaseEnabled ? chalk.green('Yes') : chalk.red('No')} (RELEASE_ENABLED=${
      process.env.RELEASE_ENABLED
    })\n`
  );

  const isCI = ci ?? isNxCI();

  return {
    isPrerelease,
    preid,
    tag,
    dryRun: dryRun || !releaseEnabled,
    verbose: isCI || verbose,
    isCI,
  };
}
