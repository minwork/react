import { LongPressDomEvents, LongPressReactEvents } from './use-long-press.types';
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  SyntheticEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';

const recognisedMouseEvents: string[] = [
  'mousedown',
  'mousemove',
  'mouseup',
  'mouseleave',
  'mouseout',
] satisfies (keyof WindowEventMap)[];

const recognisedTouchEvents: string[] = [
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
] satisfies (keyof WindowEventMap)[];

const recognisedPointerEvents: string[] = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointerleave',
  'pointerout',
] satisfies (keyof WindowEventMap)[];

function hasPageCoordinates(obj: unknown): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'pageX' in obj &&
    typeof obj.pageX === 'number' &&
    'pageY' in obj &&
    typeof obj.pageY === 'number'
  );
}

export function isMouseEvent<Target extends Element>(event: SyntheticEvent<Target>): event is ReactMouseEvent<Target> {
  return recognisedMouseEvents.includes(event?.nativeEvent?.type);
}

export function isTouchEvent<Target extends Element>(event: SyntheticEvent<Target>): event is ReactTouchEvent<Target> {
  return recognisedTouchEvents.includes(event?.nativeEvent?.type) || 'touches' in event;
}

export function isPointerEvent<Target extends Element>(
  event: SyntheticEvent<Target>
): event is ReactPointerEvent<Target> {
  const { nativeEvent } = event;
  if (!nativeEvent) return false;

  return recognisedPointerEvents.includes(nativeEvent?.type) || 'pointerId' in nativeEvent;
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
  const positionHolder = isTouchEvent(event) ? event?.touches?.[0] : event;

  if (hasPageCoordinates(positionHolder)) {
    return {
      x: positionHolder.pageX,
      y: positionHolder.pageY,
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
