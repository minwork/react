import React, { useRef } from 'react';
import { useLongPress } from '../use-long-press';
import { render, RenderResult } from '@testing-library/react';
import { LongPressCallback, LongPressOptions } from '../use-long-press.types';

export interface TestComponentProps extends LongPressOptions {
  callback: LongPressCallback | null;
  context?: unknown;
}

let i = 1;

export const TestComponent: React.FC<TestComponentProps> = ({ callback, context, ...options }) => {
  const bind = useLongPress<HTMLButtonElement>(callback, options);
  const key = useRef(i++);
  const handlers = context === undefined ? bind() : bind(context);

  return (
    <button
      key={key.current}
      type="button"
      {...handlers}
      onPointerDown={(event) => {
        if ('onPointerDown' in handlers) {
          event.nativeEvent = new PointerEvent('pointerdown');
          handlers.onPointerDown(event);
        }
      }}
      onPointerMove={(event) => {
        if ('onPointerMove' in handlers) {
          event.nativeEvent = new PointerEvent('pointermove');
          Object.assign(event.nativeEvent, {
            pageX: event.pageX,
            pageY: event.pageY,
          });
          handlers.onPointerMove(event);
        }
      }}
      onPointerUp={(event) => {
        if ('onPointerUp' in handlers) {
          event.nativeEvent = new PointerEvent('pointerup');
          handlers.onPointerUp(event);
        }
      }}
      onPointerLeave={(event) => {
        if ('onPointerLeave' in handlers && handlers.onPointerLeave) {
          event.nativeEvent = new PointerEvent('pointerleave');
          handlers.onPointerLeave(event);
        }
      }}
    >
      Click and hold
    </button>
  );
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
