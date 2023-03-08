import React, { useRef } from 'react';
import { LongPressCallback, LongPressOptions, useLongPress } from '../use-long-press';
import { render, RenderResult } from '@testing-library/react';

export interface TestComponentProps extends LongPressOptions {
  callback: LongPressCallback | null;
  context?: unknown;
}

let i = 1;

export const TestComponent: React.FC<TestComponentProps> = ({ callback, context, ...options }) => {
  const bind = useLongPress<HTMLButtonElement>(callback, options);
  const key = useRef(i++);

  return (
    <button key={key.current} type="button" {...(context === undefined ? bind() : bind(context))}>
      Click and hold
    </button>
  );
};

export function createTestElement(
  props: TestComponentProps
) {
  const component = createTestComponent(props);

  return getComponentElement(component);
}

export function createTestComponent(
  props: TestComponentProps
) {
  return render(<TestComponent {...props} />);
}

export function getComponentElement(component: RenderResult): HTMLButtonElement {
  const element = component.container.firstChild;
  if (!element) {
    throw new Error('Component is missing clickable element');
  }
  return element as HTMLButtonElement;
}
