import { expect } from "vitest";
import {
  LongPressCallbackMeta,
  LongPressEventType,
  LongPressMouseHandlers,
  LongPressPointerHandlers,
  LongPressTouchHandlers
} from "../use-long-press.types";
import { EventType } from "@testing-library/dom/types/events";
import { LongPressTestEventCreator, LongPressTestHandlerType } from "./use-long-press.test.types";
import {
  createMockedMouseEvent,
  createMockedPointerEvent,
  createMockedTouchEvent,
  createPositionedMouseEvent,
  createPositionedPointerEvent,
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
export const expectPointerEvent = expect.objectContaining({ nativeEvent: expect.any(PointerEvent) });

export const expectSpecificEvent = (event: Event) =>
  expect.objectContaining({
    nativeEvent: event,
  });

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Utility maps
 ⌞____________________________________________________________________________________________________
*/

export const longPressPositionedEventCreatorMap = {
  [LongPressEventType.Mouse]: createPositionedMouseEvent,
  [LongPressEventType.Touch]: createPositionedTouchEvent,
  [LongPressEventType.Pointer]: createPositionedPointerEvent,
} satisfies Record<LongPressEventType, (element: Element, eventType: EventType, x: number, y: number) => Event>;

export const longPressTestHandlerNamesMap = {
  [LongPressEventType.Mouse]: {
    start: 'onMouseDown',
    move: 'onMouseMove',
    stop: 'onMouseUp',
    leave: 'onMouseLeave',
  },
  [LongPressEventType.Touch]: {
    start: 'onTouchStart',
    move: 'onTouchMove',
    stop: 'onTouchEnd',
    leave: undefined as unknown as keyof LongPressTouchHandlers,
  },
  [LongPressEventType.Pointer]: {
    start: 'onPointerDown',
    move: 'onPointerMove',
    stop: 'onPointerUp',
    leave: 'onPointerLeave',
  },
} satisfies Record<
  LongPressEventType,
  Record<
    LongPressTestHandlerType,
    keyof LongPressMouseHandlers | keyof LongPressTouchHandlers | keyof LongPressPointerHandlers
  >
>;

export const longPressMockedEventCreatorMap = {
  [LongPressEventType.Mouse]: createMockedMouseEvent,
  [LongPressEventType.Touch]: createMockedTouchEvent,
  [LongPressEventType.Pointer]: createMockedPointerEvent,
} satisfies Record<LongPressEventType, LongPressTestEventCreator>;

export const longPressExpectedEventMap = {
  [LongPressEventType.Mouse]: expectMouseEvent,
  [LongPressEventType.Touch]: expectTouchEvent,
  [LongPressEventType.Pointer]: expectPointerEvent,
} satisfies Record<LongPressEventType, unknown>;
