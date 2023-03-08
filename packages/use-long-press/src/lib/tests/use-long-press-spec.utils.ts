import React from 'react';
import { expect } from 'vitest';
import { createEvent } from '@testing-library/react';
import { EventType } from '@testing-library/dom/types/events';
import { LongPressCallbackMeta } from '../use-long-press.types';


export function mockReactTouchEvent<EventType extends React.TouchEvent = React.TouchEvent>(
  options?: Partial<EventType>
): EventType {
  return {
    nativeEvent: new TouchEvent('touch'),
    touches: [{ pageX: 0, pageY: 0}],
    ...options,
  } as EventType;
}

export function mockReactMouseEvent<EventType extends React.MouseEvent = React.MouseEvent>(
  options?: Partial<EventType>
): EventType {
  return {
    nativeEvent: new MouseEvent('mouse'),
    ...options,
  } as EventType;
}

type MouseEventTypes = Extract<EventType, 'mouseDown' | 'mouseUp' | 'mouseMove' | 'mouseCancel'>;
export function createPositionedMouseEvent(node: Node, eventType: MouseEventTypes, x: number, y: number): MouseEvent {
  const event = createEvent[eventType](node) as MouseEvent;
  Object.assign(event, {
    pageX: x,
    pageY: y,
  });

  return event;
}

type TouchEventTypes = Extract<EventType, 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel'>;
export function createPositionedTouchEvent(node: Node, eventType: TouchEventTypes, x: number, y: number): TouchEvent {
  return createEvent[eventType](node, {
    touches: [
      { pageX: x, pageY: y }
    ]
  } as TouchEventInit) as TouchEvent;
}
type PositionedEventCreator<E extends Event> = (x: number, y: number) => E;

type PositionedMouseEventFactory = Record<MouseEventTypes, PositionedEventCreator<MouseEvent>>;

export function createPositionedMouseEventFactory(element: HTMLElement): PositionedMouseEventFactory {
  return (['mouseDown', 'mouseUp', 'mouseMove', 'mouseCancel'] as MouseEventTypes[]).reduce((result, eventType) => {
    result[eventType] = (x: number, y: number) => createPositionedMouseEvent(element, eventType, x, y);

    return result;
  }, {} as PositionedMouseEventFactory);
}

type PositionedTouchEventFactory = Record<TouchEventTypes, PositionedEventCreator<TouchEvent>>;
export function createPositionedTouchEventFactory(element: HTMLElement): PositionedTouchEventFactory {
  return (['touchStart', 'touchEnd', 'touchMove', 'touchCancel'] as TouchEventTypes[]).reduce((result, eventType) => {
    result[eventType] = (x: number, y: number) => createPositionedTouchEvent(element, eventType, x, y);

    return result;
  }, {} as PositionedTouchEventFactory);
}

export const expectMouseEvent = expect.objectContaining({ nativeEvent: expect.any(MouseEvent) });
export const expectTouchEvent = expect.objectContaining({ nativeEvent: expect.any(TouchEvent) });

export const expectSpecificEvent = (event: Event) => expect.objectContaining({
  nativeEvent: event
})

export const emptyContext: LongPressCallbackMeta<undefined> = { context: undefined };

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};
