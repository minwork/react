import { createEvent } from '@testing-library/react';
import { EventType } from '@testing-library/dom/types/events';
import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export function convertHandlerNameToEventName(handlerName: string): string {
  const str = handlerName.substring(2);
  return str.charAt(0).toLowerCase() + str.substring(1);
}
/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Mocked events
 ⌞____________________________________________________________________________________________________
*/

export function createMockedTouchEvent<T extends HTMLElement = HTMLElement>(
  options?: Partial<ReactTouchEvent<T>> & { nativeEvent?: TouchEvent }
): ReactTouchEvent<T> {
  return {
    nativeEvent: new TouchEvent('touchstart'),
    touches: [{ pageX: 0, pageY: 0 }],
    ...options,
  } as ReactTouchEvent<T>;
}

export function createMockedMouseEvent<T extends HTMLElement = HTMLElement>(
  options?: Partial<ReactMouseEvent<T>> & { nativeEvent?: MouseEvent }
): ReactMouseEvent<T> {
  return {
    nativeEvent: new MouseEvent('mousedown'),
    ...options,
  } as ReactMouseEvent<T>;
}

export function createMockedPointerEvent<T extends HTMLElement = HTMLElement>(
  options?: Partial<ReactPointerEvent<T>> & { nativeEvent?: PointerEvent }
): ReactPointerEvent<T> {
  return {
    nativeEvent: new PointerEvent('pointerdown'),
    pointerId: 1,
    ...options,
  } as ReactPointerEvent<T>;
}

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Mocked positioned events (with 'x' and 'y' coordinates)
 ⌞____________________________________________________________________________________________________
*/
export function createPositionedMouseEvent(
  element: Document | Element | Window | Node,
  eventType: EventType,
  x: number,
  y: number
): MouseEvent {
  const event = createEvent[eventType](element) as unknown as MouseEvent;

  Object.defineProperties(event, {
    pageX: {
      value: x,
      writable: false,
      enumerable: true,
    },
    pageY: {
      value: y,
      writable: false,
      enumerable: true,
    },
  });

  return event;
}

export function createPositionedPointerEvent(
  element: Document | Element | Window | Node,
  eventType: EventType,
  x: number,
  y: number
): PointerEvent {
  const event = createEvent[eventType]({
    ...element,
    // Remove this after jsdom add support for pointer events
    ownerDocument: { ...document, defaultView: window },
  }) as PointerEvent;

  Object.defineProperties(event, {
    pageX: {
      value: x,
      writable: false,
      enumerable: true,
    },
    pageY: {
      value: y,
      writable: false,
      enumerable: true,
    },
  });

  return event;
}

export function createPositionedTouchEvent(
  element: Document | Element | Window | Node,
  eventType: EventType,
  x: number,
  y: number
): TouchEvent {
  return createEvent[eventType](element, {
    touches: [{ pageX: x, pageY: y } as Touch],
  }) as TouchEvent;
}
