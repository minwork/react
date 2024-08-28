import type { StoryObj, StoryFn, Meta } from '@storybook/react';
import { LongPressButton } from './LongPressButton';
import { LongPressEventType } from 'use-long-press';

const meta: Meta<typeof LongPressButton> = { component: LongPressButton };
export default meta;

type Story = StoryObj<typeof LongPressButton>;
type StoryComponent = StoryFn<typeof LongPressButton>;

export const Default: Story = {
  argTypes: {
    filterEvents: {
      control: false,
      table: {
        disable: true,
      },
    },
    context: {
      control: 'object',
    },
    cancelOnMovement: {
      control: 'boolean',
    },
    detect: {
      options: [LongPressEventType.Mouse, LongPressEventType.Touch, LongPressEventType.Pointer],
      control: 'radio',
    },
  },
  args: {
    threshold: 1000,
  },
};

export const CancelOnMovement: Story = {
  ...Default,
  argTypes: {
    ...Default.argTypes,
    cancelOnMovement: {
      control: {
        type: 'number',
      },
    },
  },
  args: {
    ...Default.args,
    cancelOnMovement: 25,
  },
};

export const NoCancelOutsideElement: Story = {
  ...Default,
  args: {
    ...Default.args,
    cancelOutsideElement: false,
  },
};

export const FilterRightClick: Story = {
  ...Default,
  argTypes: {
    ...Default.argTypes,
    filterEvents: {
      control: false,
    },
  },
  args: {
    ...Default.args,
    filterEvents(event) {
      // Filter right clicks
      return !(
        event.nativeEvent instanceof MouseEvent &&
        (event.nativeEvent.which === 3 || event.nativeEvent.button === 2 || event.ctrlKey || event.metaKey)
      );
    },
  },
};

export const WithContext: Story = {
  ...Default,
  args: {
    ...Default.args,
    context: 'Example context',
  },
};
