import { ReleaseChannel } from './release.consts';

export interface ParsedOptions {
  isPrerelease: boolean;
  isCI: boolean;
  preid?: string;
  tag: ReleaseChannel;
  dryRun?: boolean;
}
