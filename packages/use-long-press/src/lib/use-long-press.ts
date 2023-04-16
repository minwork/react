import { MouseEventHandler, PointerEventHandler, TouchEventHandler, useCallback, useEffect, useRef } from "react";
import {
  LongPressCallback,
  LongPressCallbackReason,
  LongPressEmptyHandlers,
  LongPressEvent,
  LongPressEventType,
  LongPressHandlers,
  LongPressMouseHandlers,
  LongPressOptions,
  LongPressPointerHandlers,
  LongPressResult,
  LongPressTouchHandlers
} from "./use-long-press.types";
import { getCurrentPosition, isRecognisableEvent } from "./use-long-press.utils";

// Disabled callback
export function useLongPress<Target extends Element = Element, Context = unknown>(
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
  options: LongPressOptions<Target, Context, LongPressEventType.Touch>
): LongPressResult<LongPressTouchHandlers<Target>, Context>;
// Mouse events
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback,
  options: LongPressOptions<Target, Context, LongPressEventType.Mouse>
): LongPressResult<LongPressMouseHandlers<Target>, Context>;
// Pointer events
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback,
  options: LongPressOptions<Target, Context, LongPressEventType.Pointer>
): LongPressResult<LongPressPointerHandlers<Target>, Context>;
// Default options
export function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(callback: Callback): LongPressResult<LongPressPointerHandlers<Target>, Context>;
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
    detect = LongPressEventType.Pointer,
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
  const target = useRef<Target>();
  const context = useRef<Context>();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const savedCallback = useRef(callback);
  const startPosition = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const start = useCallback(
    (event: LongPressEvent<Target>) => {
      // Prevent multiple start triggers
      if (isPressed.current) {
        return;
      }

      // Ignore unrecognised events
      if (!isRecognisableEvent(event)) {
        return;
      }

      // If we don't want all events to trigger long press and provided event is filtered out
      if (filterEvents !== undefined && !filterEvents(event)) {
        return;
      }

      if (captureEvent) {
        event.persist();
      }

      // When touched trigger onStart and start timer
      onStart?.(event, { context: context.current });

      // Calculate position after calling 'onStart' so it can potentially change it
      startPosition.current = getCurrentPosition(event);
      target.current = event.currentTarget;
      isPressed.current = true;

      timer.current = setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current(event, { context: context.current });
          isLongPressActive.current = true;
        }
      }, threshold);
    },
    [captureEvent, filterEvents, onStart, threshold]
  );

  const cancel = useCallback(
    (event: LongPressEvent<Target>, reason?: LongPressCallbackReason) => {
      // Ignore unrecognised events
      if (!isRecognisableEvent(event)) {
        return;
      }

      startPosition.current = null;

      if (captureEvent) {
        event.persist();
      }

      // Trigger onFinish callback only if timer was active
      if (isLongPressActive.current) {
        onFinish?.(event, { context: context.current });
      } else if (isPressed.current) {
        // If not active but pressed, trigger onCancel
        onCancel?.(event, { context: context.current, reason: reason ?? LongPressCallbackReason.CancelledByRelease });
      }

      if (event.currentTarget) target.current = undefined;
      isLongPressActive.current = false;
      isPressed.current = false;
      timer.current !== undefined && clearTimeout(timer.current);
    },
    [captureEvent, onFinish, onCancel]
  );

  const handleMove = useCallback(
    (event: LongPressEvent<Target>) => {
      // First call callback to allow modifying event position
      onMove?.(event, { context: context.current });

      if (cancelOnMovement && startPosition.current) {
        const currentPosition = getCurrentPosition(event);

        if (currentPosition) {
          const moveThreshold = cancelOnMovement === true ? 25 : cancelOnMovement;
          const movedDistance = {
            x: Math.abs(currentPosition.x - startPosition.current.x),
            y: Math.abs(currentPosition.y - startPosition.current.y),
          };

          // If moved outside move tolerance box then cancel long press
          if (movedDistance.x > moveThreshold || movedDistance.y > moveThreshold) {
            cancel(event, LongPressCallbackReason.CancelledByMovement);
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
    (ctx?: Context) => {
      context.current = ctx;

      if (callback === null) {
        return {};
      }

      switch (detect) {
        case LongPressEventType.Mouse:
          return {
            onMouseDown: start as MouseEventHandler<Target>,
            onMouseMove: handleMove as MouseEventHandler<Target>,
            onMouseUp: cancel as MouseEventHandler<Target>,
          };

        case LongPressEventType.Touch:
          return {
            onTouchStart: start as TouchEventHandler<Target>,
            onTouchMove: handleMove as TouchEventHandler<Target>,
            onTouchEnd: cancel as TouchEventHandler<Target>,
          };

        case LongPressEventType.Pointer:
          return {
            onPointerDown: start as PointerEventHandler<Target>,
            onPointerMove: handleMove as PointerEventHandler<Target>,
            onPointerUp: cancel as PointerEventHandler<Target>,
          };
      }
    },
    [callback, cancel, detect, handleMove, start]
  );
}
