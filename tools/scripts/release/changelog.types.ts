import { ChangelogOptions as NxChangelogOptions } from 'nx/src/command-line/release/command-object';

export interface HandleChangelogOptions {
  projectName: string;
  isPrerelease: boolean;
  isCI: boolean;
  options: NxChangelogOptions;
}
