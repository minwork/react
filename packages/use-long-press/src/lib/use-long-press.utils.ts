import { LongPressDomEvents, LongPressReactEvents } from './use-long-press.types';
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  SyntheticEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';

const getPointerEvent = () => (typeof window === 'object' ? window?.PointerEvent ?? null : null);
const getTouchEvent = () => (typeof window === 'object' ? window?.TouchEvent ?? null : null);

export function isTouchEvent<Target extends Element>(event: SyntheticEvent<Target>): event is ReactTouchEvent<Target> {
  const { nativeEvent } = event;
  const TouchEvent = getTouchEvent();

  return (TouchEvent && nativeEvent instanceof TouchEvent) || 'touches' in event;
}

export function isMouseEvent<Target extends Element>(event: SyntheticEvent<Target>): event is ReactMouseEvent<Target> {
  const PointerEvent = getPointerEvent();
  return event.nativeEvent instanceof MouseEvent && !(PointerEvent && event.nativeEvent instanceof PointerEvent);
}

export function isPointerEvent<Target extends Element>(
  event: SyntheticEvent<Target>
): event is ReactPointerEvent<Target> {
  const { nativeEvent } = event;
  if (!nativeEvent) {
    return false;
  }

  const PointerEvent = getPointerEvent();
  return (PointerEvent && nativeEvent instanceof PointerEvent) || 'pointerId' in nativeEvent;
}

export function isRecognisableEvent<Target extends Element>(
  event: SyntheticEvent<Target>
): event is LongPressReactEvents<Target> {
  return isMouseEvent(event) || isTouchEvent(event) || isPointerEvent(event);
}

export function getCurrentPosition<Target extends Element>(
  event: LongPressReactEvents<Target>
): {
  x: number;
  y: number;
} | null {
  if (isTouchEvent(event)) {
    return {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
  }

  if (isMouseEvent(event) || isPointerEvent(event)) {
    return {
      x: event.pageX,
      y: event.pageY,
    };
  }

  return null;
}

export function createArtificialReactEvent<Target extends Element = Element>(
  event: LongPressDomEvents
): LongPressReactEvents<Target> {
  return {
    target: event.target,
    currentTarget: event.currentTarget,
    nativeEvent: event,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    persist: () => {},
  } as LongPressReactEvents<Target>;
}

export function hashContext(context: unknown): string {
  return JSON.stringify(context);
}
