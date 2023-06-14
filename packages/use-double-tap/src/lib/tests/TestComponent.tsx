import React from 'react';
import { DoubleTapCallback, DoubleTapOptions, useDoubleTap } from '../';
import { render, RenderResult } from '@testing-library/react';

import { noop } from '@react/shared/util-tests';

export interface TestComponentProps {
  callback?: DoubleTapCallback;
  threshold?: number;
  options?: DoubleTapOptions;
}

const TestComponent: React.FC<TestComponentProps> = ({ callback = noop, threshold, options }) => {
  const bind = useDoubleTap(callback, threshold, options);

  return <button {...bind}>Click me</button>;
};

export function createTestElement(props: TestComponentProps) {
  const component = createTestComponent(props);

  return getComponentElement(component);
}

export function createTestComponent(props: TestComponentProps) {
  return render(<TestComponent {...props} />);
}

export function getComponentElement(component: RenderResult): HTMLButtonElement {
  return component.container.firstChild as HTMLButtonElement;
}

export default TestComponent;
