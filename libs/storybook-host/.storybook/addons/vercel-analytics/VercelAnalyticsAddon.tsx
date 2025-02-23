import { FC, useEffect } from 'react';
import { useStorybookState } from '@storybook/manager-api';
import { pageview } from '@vercel/analytics';

export const VercelAnalyticsAddon: FC = () => {
  const { path } = useStorybookState();

  useEffect(() => {
    pageview({
      path,
    });
  }, [path]);

  return null;
};
