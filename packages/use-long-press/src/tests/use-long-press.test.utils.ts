import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from 'react';
import { createEvent, fireEvent, FireObject } from '@testing-library/react';
import { EventType } from '@testing-library/dom/types/events';
import { LongPressDomEvents, LongPressEventType, LongPressHandlers } from '../lib';
import {
  LongPressTestHandler,
  LongPressTestHandlersMap,
  LongPressTestHandlerType,
  LongPressTestPositionedEventCreator,
  LongPressTestPositionedEventFactory,
} from './use-long-press.test.types';
import { convertHandlerNameToEventName } from './use-long-press.test.functions';
import { longPressPositionedEventCreatorMap, longPressTestHandlerNamesMap, noop } from './use-long-press.test.consts';

export function createMockedDomEventFactory(
  eventType: LongPressEventType
): Record<LongPressTestHandlerType, (options?: EventInit) => LongPressDomEvents> {
  return (['start', 'move', 'stop'] as const).reduce((result, handlerName) => {
    const eventName = convertHandlerNameToEventName(longPressTestHandlerNamesMap[eventType][handlerName]) as EventType;
    result[handlerName] = (options?: EventInit) => createEvent[eventName](window, options) as LongPressDomEvents;
    return result;
  }, {} as Record<LongPressTestHandlerType, (options?: EventInit) => LongPressDomEvents>);
}

export function createPositionedDomEventFactory<E extends MouseEvent | TouchEvent | PointerEvent>(
  eventType: LongPressEventType,
  element: Element
): LongPressTestPositionedEventFactory<E> {
  return (['start', 'move', 'stop'] as LongPressTestHandlerType[]).reduce((result, handlerType) => {
    const handlerName = longPressTestHandlerNamesMap[eventType][handlerType];
    const eventName = convertHandlerNameToEventName(handlerName) as EventType;
    const creator = longPressPositionedEventCreatorMap[eventType];

    result[handlerType] = ((x: number, y: number) =>
      creator(element, eventName, x, y)) as LongPressTestPositionedEventCreator<E>;

    return result;
  }, {} as LongPressTestPositionedEventFactory<E>);
}
/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Test handlers
 ⌞____________________________________________________________________________________________________
*/
export function getTestHandlersMap(
  eventType: LongPressEventType,
  handlers: LongPressHandlers
): LongPressTestHandlersMap {
  const handlerNames = longPressTestHandlerNamesMap[eventType];

  return Object.fromEntries(
    Object.keys(handlerNames).map((type) => {
      const handlerName = handlerNames[type as LongPressTestHandlerType];
      const handler = handlers[handlerName as keyof LongPressHandlers] as
        | ((event: ReactMouseEvent | ReactTouchEvent | ReactPointerEvent) => void)
        | undefined;

      return [type, handler ?? noop];
    })
  ) as Record<LongPressTestHandlerType, LongPressTestHandler>;
}

export function getDOMTestHandlersMap(
  eventType: LongPressEventType,
  element: Window | Element | Node | Document
): LongPressTestHandlersMap {
  function eventHandler(eventName: keyof FireObject) {
    return (options?: object) => fireEvent[eventName](element, options);
  }

  switch (eventType) {
    case LongPressEventType.Mouse:
      return {
        start: eventHandler('mouseDown'),
        move: eventHandler('mouseMove'),
        stop: eventHandler('mouseUp'),
        leave: eventHandler('mouseLeave'),
      };
    case LongPressEventType.Touch:
      return {
        start: eventHandler('touchStart'),
        move: eventHandler('touchMove'),
        stop: eventHandler('touchEnd'),
      };
    case LongPressEventType.Pointer: {
      return {
        start: eventHandler('pointerDown'),
        move: eventHandler('pointerMove'),
        stop: eventHandler('pointerUp'),
        leave: eventHandler('pointerLeave'),
      };
    }
  }
}
