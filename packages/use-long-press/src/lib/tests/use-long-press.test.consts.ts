import { expect } from "vitest";
import {
  LongPressCallbackMeta,
  LongPressEventType,
  LongPressMouseHandlers,
  LongPressTouchHandlers
} from "../use-long-press.types";
import { EventType } from "@testing-library/dom/types/events";
import { LongPressEventCreator, LongPressTestHandlerType } from "./use-long-press.test.types";
import {
  createMockedMouseEvent,
  createMockedTouchEvent,
  createPositionedMouseEvent,
  createPositionedTouchEvent
} from "./use-long-press.test.utils";

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Utility constants
 ⌞____________________________________________________________________________________________________
*/
export const emptyContext: LongPressCallbackMeta<undefined> = { context: undefined };
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Test constants
 ⌞____________________________________________________________________________________________________
*/
export const expectMouseEvent = expect.objectContaining({ nativeEvent: expect.any(MouseEvent) });
export const expectTouchEvent = expect.objectContaining({ nativeEvent: expect.any(TouchEvent) });
// export const expectPointerEvent = expect.objectContaining({ nativeEvent: expect.any(PointerEvent) });

export const expectSpecificEvent = (event: Event) => expect.objectContaining({
  nativeEvent: event
})

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Utility maps
 ⌞____________________________________________________________________________________________________
*/

export const longPressPositionedEventCreatorMap = {
  [LongPressEventType.MOUSE]: createPositionedMouseEvent,
  [LongPressEventType.TOUCH]: createPositionedTouchEvent,
} satisfies Record<LongPressEventType, (element: Element, eventType: EventType, x: number, y: number) => Event>;

export const longPressTestHandlerNamesMap = {
  [LongPressEventType.MOUSE]: {
    start: 'onMouseDown',
    move: 'onMouseMove',
    stop: 'onMouseUp',
  },
  [LongPressEventType.TOUCH]: {
    start: 'onTouchStart',
    move: 'onTouchMove',
    stop: 'onTouchEnd'
  }
} satisfies Record<LongPressEventType, Record<LongPressTestHandlerType, keyof LongPressMouseHandlers | keyof LongPressTouchHandlers>>;

export const longPressMockedEventCreatorMap = {
  [LongPressEventType.MOUSE]: createMockedMouseEvent,
  [LongPressEventType.TOUCH]: createMockedTouchEvent,
} satisfies Record<LongPressEventType, LongPressEventCreator>

export const longPressExpectedEventMap = {
  [LongPressEventType.MOUSE]: expectMouseEvent,
  [LongPressEventType.TOUCH]: expectTouchEvent,
} satisfies Record<LongPressEventType, unknown>
