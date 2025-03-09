import { VersionData } from 'nx/src/command-line/release/utils/shared';

export interface HandleVersionOptions {
  projectName: string;
  suggestedVersionData: VersionData[keyof VersionData];
  isPrerelease: boolean;
  options: VersionOptions;
}

export interface VersionOptions {
  // specifier?: ReleaseType | string;
  preid?: string;
  dryRun?: boolean;
  verbose?: boolean;
}
