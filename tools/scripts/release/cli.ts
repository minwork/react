import * as yargs from 'yargs';
import { parseCSV } from 'nx/src/command-line/yargs-utils/shared-options';
import chalk from 'chalk';
import { printHeader } from '../utils/output';
import { execaSync } from 'execa';
import { ReleaseChannel, releaseChannelPreid } from './release.consts';
import { ReleasePreidValue } from './release.types';

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

export function parseReleaseOptions({ channel }: { channel?: ReleaseChannel }): {
  isPrerelease: boolean;
  preid?: string;
  tag: ReleaseChannel;
} {
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

  return {
    isPrerelease,
    preid,
    tag,
  };
}
