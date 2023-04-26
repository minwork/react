import { UIEvent } from 'react';
import { LongPressDomEvents, LongPressReactEvents } from '../use-long-press.types';

export type LongPressTestHandlerType = 'start' | 'move' | 'stop';
export type LongPressTestHandler = (event: LongPressReactEvents | LongPressDomEvents) => void;
export type LongPressTestHandlersMap = {
  start: LongPressTestHandler;
  move: LongPressTestHandler;
  stop: LongPressTestHandler;
  leave?: LongPressTestHandler;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LongPressTestEventCreator = (options?: object) => UIEvent<Element, any>;
export type LongPressTestPositionedEventCreator<E extends Event> = (x: number, y: number) => E;

export type LongPressTestPositionedEventFactory<E extends Event> = Record<
  LongPressTestHandlerType,
  LongPressTestPositionedEventCreator<E>
>;
