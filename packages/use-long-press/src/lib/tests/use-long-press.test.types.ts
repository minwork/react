import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  UIEvent,
} from 'react';

export type LongPressReactEvents = ReactMouseEvent | ReactTouchEvent | ReactPointerEvent;
export type LongPressTestHandlerType = 'start' | 'move' | 'stop';
export type LongPressTestHandler = (event: LongPressReactEvents) => void;
export type LongPressTestHandlersMap = Record<LongPressTestHandlerType, LongPressTestHandler>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LongPressEventCreator = (options?: object) => UIEvent<Element, any>;
export type LongPressPositionedEventCreator<E extends Event> = (x: number, y: number) => E;


export type LongPressPositionedEventFactory<E extends Event> = Record<LongPressTestHandlerType, LongPressPositionedEventCreator<E>>;
