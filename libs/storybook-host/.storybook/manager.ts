import { addons, types } from '@storybook/manager-api';
import { inject } from '@vercel/analytics';
import {
  VERCEL_ANALYTICS_ADDON_ID,
  VERCEL_ANALYTICS_ADDON_NAME,
  VERCEL_ANALYTICS_TOOL_ID,
  VercelAnalyticsAddon,
} from './addons/vercel-analytics';

addons.register(VERCEL_ANALYTICS_ADDON_ID, () => {
  inject({
    disableAutoTrack: true,
  });
  addons.add(VERCEL_ANALYTICS_TOOL_ID, {
    type: types.TOOLEXTRA,
    render: VercelAnalyticsAddon,
    title: VERCEL_ANALYTICS_ADDON_NAME,
  });
});
