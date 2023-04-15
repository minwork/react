import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";
import { createEvent, fireEvent } from "@testing-library/react";
import { EventType } from "@testing-library/dom/types/events";
import { LongPressEventType, LongPressHandlers } from "../use-long-press.types";
import {
  LongPressPositionedEventCreator,
  LongPressPositionedEventFactory,
  LongPressTestHandler,
  LongPressTestHandlersMap,
  LongPressTestHandlerType
} from "./use-long-press.test.types";
import { convertHandlerNameToEventName } from "./use-long-press.test.functions";
import { longPressPositionedEventCreatorMap, longPressTestHandlerNamesMap, noop } from "./use-long-press.test.consts";

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Mocked events
 ⌞____________________________________________________________________________________________________
*/
export function createMockedTouchEvent(
  options?: Partial<ReactTouchEvent>
): ReactTouchEvent {
  return {
    nativeEvent: new TouchEvent('touch'),
    touches: [{ pageX: 0, pageY: 0}],
    ...options,
  } as ReactTouchEvent;
}

export function createMockedMouseEvent(
  options?: Partial<ReactMouseEvent>
): ReactMouseEvent {
  return {
    nativeEvent: new MouseEvent('mouse'),
    ...options,
  } as ReactMouseEvent;
}

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Mocked positioned events (with 'x' and 'y' coordinates)
 ⌞____________________________________________________________________________________________________
*/
export function createPositionedMouseEvent(element: Element, eventType: EventType, x: number, y: number): MouseEvent {
  const event = createEvent[eventType](element) as MouseEvent;
  Object.assign(event, {
    pageX: x,
    pageY: y,
  });

  return event;
}

export function createPositionedTouchEvent(element: Element, eventType: EventType, x: number, y: number): TouchEvent {
  return createEvent[eventType](element, {
    touches: [{ pageX: x, pageY: y }],
  } as TouchEventInit) as TouchEvent;
}

export function createPositionedEventFactory<E extends MouseEvent | TouchEvent | PointerEvent>(eventType: LongPressEventType, element: Element): LongPressPositionedEventFactory<E> {
  return (['start', 'move', 'stop'] as LongPressTestHandlerType[]).reduce((result, handlerType) => {
    const handlerName = longPressTestHandlerNamesMap[eventType][handlerType];
    const eventName = convertHandlerNameToEventName(handlerName) as EventType;
    const creator = longPressPositionedEventCreatorMap[eventType];

    result[handlerType] = ((x: number, y: number) => creator(element, eventName, x, y)) as LongPressPositionedEventCreator<E>;

    return result;
  }, {} as LongPressPositionedEventFactory<E>);
}
/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Test handlers
 ⌞____________________________________________________________________________________________________
*/
export function getTestHandlersMap(eventType: LongPressEventType, handlers: LongPressHandlers): LongPressTestHandlersMap {
  const handlerNames = longPressTestHandlerNamesMap[eventType];

  return Object.fromEntries(Object.keys(handlerNames).map((type) => {
    const handlerName = handlerNames[type as LongPressTestHandlerType];
    const handler = handlers[handlerName as keyof LongPressHandlers] as ((event: ReactMouseEvent | ReactTouchEvent | ReactPointerEvent) => void) | undefined;

    return [type, handler ?? noop]
  })) as Record<LongPressTestHandlerType, LongPressTestHandler>
}

export function getDOMTestHandlersMap(eventType: LongPressEventType, element: Element): LongPressTestHandlersMap {
  switch (eventType) {
    case LongPressEventType.Mouse:
      return {
        start: fireEvent.mouseDown.bind(null, element),
        move: fireEvent.mouseMove.bind(null, element),
        stop: fireEvent.mouseUp.bind(null, element),
      };
    case LongPressEventType.Touch:
      return {
        start: fireEvent.touchStart.bind(null, element),
        move: fireEvent.touchMove.bind(null, element),
        stop: fireEvent.touchEnd.bind(null, element),
      };
  }
}
