import { $ } from 'execa';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as process from 'process';

const { otp, path } = await yargs(hideBin(process.argv))
  .option('otp', {
    type: 'number',
    demandOption: true,
    description: 'One time password required for publishing to npm',
  })
  .option('path', {
    type: 'string',
    demandOption: true,
    description: 'Path to package root (where package.json is located)',
  })
  .parse();

const { stdout: tagName } = await $`git describe --tags --abbrev=0`;
const { stdout } = await $`git notes --ref semantic-release show ${tagName}`;
const note = JSON.parse(stdout);
const channels: string[] = note.channels ?? [];
const channel = channels[0] ?? 'latest';

console.log(`🚀 Publishing '${tagName}' from '${path}' on '${channel}' channel...`);

const { exitCode, stderr } = await $`npm publish ${path} --tag ${channel} --otp ${otp}`;

if(exitCode === 0) {
  console.log(`✅ Successfully published package on npm`);
} else {
  console.log(`❌ Failed to publish package on npm`, stderr.toString());
}

export {};
