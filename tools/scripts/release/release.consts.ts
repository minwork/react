import { ReleasePreidValue } from './release.types';

export enum ReleaseChannel {
  Preview = 'preview',
  Latest = 'latest',
}

export const releaseChannelPreid = {
  [ReleaseChannel.Preview]: 'preview',
  [ReleaseChannel.Latest]: undefined,
} satisfies Record<ReleaseChannel, ReleasePreidValue>;
