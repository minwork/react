import { MouseEventHandler, TouchEventHandler, useCallback, useEffect, useRef } from "react";
import {
  LongPressCallback,
  LongPressCallbackMeta,
  LongPressCallbackReason,
  LongPressEmptyHandlers,
  LongPressEvent,
  LongPressEventType,
  LongPressHandlers,
  LongPressMouseHandlers,
  LongPressOptions,
  LongPressResult,
  LongPressTouchHandlers
} from "./use-long-press.types";
import { getCurrentPosition, isMouseEvent, isTouchEvent } from "./use-long-press.utils";

// Disabled callback
export function  useLongPress<Target extends Element = Element, Context = unknown>(
  callback: null,
  options?: LongPressOptions<Target, Context>
): LongPressResult<LongPressEmptyHandlers, Context>;
// Touch events
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback,
  options: LongPressOptions<Target, Context, LongPressEventType.TOUCH>
): LongPressResult<LongPressTouchHandlers<Target>, Context>;
// Mouse events
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback,
  options: LongPressOptions<Target, Context, LongPressEventType.MOUSE>
): LongPressResult<LongPressMouseHandlers<Target>, Context>;
// Default options
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback,
): LongPressResult<LongPressMouseHandlers<Target>, Context>;
// General
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback | null,
  options?: LongPressOptions<Target, Context>
): LongPressResult<LongPressHandlers<Target>, Context>;
/**
 * Detect click / tap and hold event
 * @param {Function|null} callback - Function to call when long press is detected (click or tap lasts for <i>threshold</i> amount of time or longer)
 * @param threshold
 * @param captureEvent
 * @param detect
 * @param cancelOnMovement
 * @param filterEvents
 * @param onStart
 * @param onMove
 * @param onFinish
 * @param onCancel
 * @see LongPressCallback
 * @see LongPressOptions
 * @see LongPressResult
 */
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback | null,
  {
    threshold = 400,
    captureEvent = false,
    detect = LongPressEventType.MOUSE,
    cancelOnMovement = false,
    filterEvents,
    onStart,
    onMove,
    onFinish,
    onCancel,
  }: LongPressOptions<Target, Context> = {}
): LongPressResult<LongPressHandlers<Target>, Context> {
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const savedCallback = useRef(callback);
  const startPosition = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const start = useCallback(
    (context?: Context) => (event: LongPressEvent<Target>) => {
      // Prevent multiple start triggers
      if (isPressed.current) {
        return;
      }

      // Ignore events other than mouse and touch
      if (!isMouseEvent(event) && !isTouchEvent(event)) {
        return;
      }

      // If we don't want all events to trigger long press and provided event is filtered out
      if (filterEvents !== undefined && !filterEvents(event)) {
        return;
      }

      startPosition.current = getCurrentPosition(event);

      if (captureEvent) {
        event.persist();
      }

      const meta: LongPressCallbackMeta<Context> = context === undefined ? {} : { context };

      // When touched trigger onStart and start timer
      onStart?.(event, meta);
      isPressed.current = true;
      timer.current = setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current(event, meta);
          isLongPressActive.current = true;
        }
      }, threshold);
    },
    [captureEvent, filterEvents, onStart, threshold]
  );

  const cancel = useCallback(
    (context?: Context, reason?: LongPressCallbackReason) => (event: LongPressEvent<Target>) => {
      // Ignore events other than mouse and touch
      if (!isMouseEvent(event) && !isTouchEvent(event)) {
        return;
      }

      startPosition.current = null;

      if (captureEvent) {
        event.persist();
      }

      const meta: LongPressCallbackMeta<Context> = context === undefined ? {} : { context };

      // Trigger onFinish callback only if timer was active
      if (isLongPressActive.current) {
        onFinish?.(event, meta);
      } else if (isPressed.current) {
        // Otherwise, if not active trigger onCancel
        onCancel?.(event, { ...meta, reason: reason ?? LongPressCallbackReason.CancelledByTimeout });
      }
      isLongPressActive.current = false;
      isPressed.current = false;
      timer.current !== undefined && clearTimeout(timer.current);
    },
    [captureEvent, onFinish, onCancel]
  );

  const handleMove = useCallback(
    (context?: Context) => (event: LongPressEvent<Target>) => {
      onMove?.(event, { context });
      if (cancelOnMovement && startPosition.current) {
        const currentPosition = getCurrentPosition(event);
        /* istanbul ignore else */
        if (currentPosition) {
          const moveThreshold = cancelOnMovement === true ? 25 : cancelOnMovement;
          const movedDistance = {
            x: Math.abs(currentPosition.x - startPosition.current.x),
            y: Math.abs(currentPosition.y - startPosition.current.y),
          };

          // If moved outside move tolerance box then cancel long press
          if (movedDistance.x > moveThreshold || movedDistance.y > moveThreshold) {
            cancel(context, LongPressCallbackReason.CancelledByMovement)(event);
          }
        }
      }
    },
    [cancel, cancelOnMovement, onMove]
  );

  // Clear timer on unmount
  useEffect(
    () => (): void => {
      timer.current !== undefined && clearTimeout(timer.current);
    },
    []
  );

  // Update callback handle when it changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  return useCallback<LongPressResult<LongPressHandlers<Target>, Context>>(
    (context?: Context) => {
      if (callback === null) {
        return {};
      }

      if (detect === LongPressEventType.MOUSE) {
        return {
          onMouseDown: start(context) as MouseEventHandler<Target>,
          onMouseMove: handleMove(context) as MouseEventHandler<Target>,
          onMouseUp: cancel(context) as MouseEventHandler<Target>,
        };
      }

      if (detect === LongPressEventType.TOUCH) {
        return {
          onTouchStart: start(context) as TouchEventHandler<Target>,
          onTouchMove: handleMove(context) as TouchEventHandler<Target>,
          onTouchEnd: cancel(context) as TouchEventHandler<Target>,
        };
      }
      return {};
    },
    [callback, cancel, detect, handleMove, start]
  );
}
