import { ReleaseChannel } from './release.consts';

export interface ParsedOptions {
  isPrerelease: boolean;
  isCI: boolean;
  preid: string | undefined;
  tag: ReleaseChannel;
  dryRun: boolean;
  verbose: boolean;
}
