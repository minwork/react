import {
  MouseEvent,
  MouseEventHandler,
  PointerEvent,
  PointerEventHandler,
  TouchEventHandler,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  LongPressCallback,
  LongPressCallbackReason,
  LongPressDomEvents,
  LongPressEmptyHandlers,
  LongPressEventType,
  LongPressHandlers,
  LongPressMouseHandlers,
  LongPressOptions,
  LongPressPointerHandlers,
  LongPressReactEvents,
  LongPressResult,
  LongPressTouchHandlers,
} from './use-long-press.types';
import { createArtificialReactEvent, getCurrentPosition, isRecognisableEvent } from './use-long-press.utils';

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
 * @param {useLongPress~callback|null} callback - Function to call when long press is detected (click or tap lasts for <i>threshold</i> amount of time or longer)
 *
 * @param {number} threshold - Period of time that must elapse after detecting click or tap in order to trigger _callback_
 *
 * @param {boolean} captureEvent - If `event.persist()` should be called on react event
 *
 * @param {string} detect - Which type of events should be detected (`'mouse'` | `'touch'` | `'pointer'`). For TS use *LongPressEventType* enum.
 *
 * @param {boolean|number} cancelOnMovement - If long press should be canceled on mouse / touch / pointer move. Possible values:<ul>
 * <li>`false` - [default] Disable cancelling on movement</li>
 * <li>`true` - Enable cancelling on movement and use default 25px threshold</li>
 * <li>`number` - Set a specific tolerance value in pixels (square side size inside which movement won't cancel long press)</li>
 * </ul>
 *
 * @param {boolean} cancelOutsideElement If long press should be canceled when moving mouse / touch / pointer outside the element to which it was bound. Works for mouse and pointer events, touch events will be supported in the future.
 *
 * @param {(event:Object)=>boolean} filterEvents - Function to filter incoming events. Function should return `false` for events that will be ignored (e.g. right mouse clicks)
 *
 * @param {useLongPress~callback} onStart - Called after detecting initial click / tap / point event. Allows to change event position before registering it for the purpose of `cancelOnMovement`.
 *
 * @param {useLongPress~callback} onMove - Called on every move event. Allows to change event position before calculating distance for the purpose of `cancelOnMovement`.
 *
 * @param {useLongPress~callback} onFinish - Called when releasing click / tap / point if long press **was** triggered.
 *
 * @param {useLongPress~callback} onCancel - Called when releasing click / tap / point if long press **was not** triggered
 *
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
    cancelOutsideElement = true,
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
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const savedCallback = useRef(callback);
  const startPosition = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const start = useCallback(
    (context?: Context) => (event: LongPressReactEvents<Target>) => {
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
      onStart?.(event, { context });

      // Calculate position after calling 'onStart' so it can potentially change it
      startPosition.current = getCurrentPosition(event);
      isPressed.current = true;
      target.current = event.currentTarget;

      timer.current = setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current(event, { context });
          isLongPressActive.current = true;
        }
      }, threshold);
    },
    [captureEvent, filterEvents, onStart, threshold]
  );

  const cancel = useCallback(
    (context?: Context) => (event: LongPressReactEvents<Target>, reason?: LongPressCallbackReason) => {
      // Ignore unrecognised events
      if (!isRecognisableEvent(event)) {
        return;
      }

      // Ignore when element is not pressed anymore
      if (!isPressed.current) {
        return;
      }

      startPosition.current = null;

      if (captureEvent) {
        event.persist();
      }

      // Trigger onFinish callback only if timer was active
      if (isLongPressActive.current) {
        onFinish?.(event, { context });
      } else if (isPressed.current) {
        // If not active but pressed, trigger onCancel
        onCancel?.(event, { context, reason: reason ?? LongPressCallbackReason.CancelledByRelease });
      }

      isLongPressActive.current = false;
      isPressed.current = false;
      timer.current !== undefined && clearTimeout(timer.current);
    },
    [captureEvent, onFinish, onCancel]
  );

  const move = useCallback(
    (context?: Context) => (event: LongPressReactEvents<Target>) => {
      // Ignore unrecognised events
      if (!isRecognisableEvent(event)) {
        return;
      }

      // First call callback to allow modifying event position
      onMove?.(event, { context });

      if (cancelOnMovement !== false && startPosition.current) {
        const currentPosition = getCurrentPosition(event);

        if (currentPosition) {
          const moveThreshold = cancelOnMovement === true ? 25 : cancelOnMovement;
          const movedDistance = {
            x: Math.abs(currentPosition.x - startPosition.current.x),
            y: Math.abs(currentPosition.y - startPosition.current.y),
          };

          // If moved outside move tolerance box then cancel long press
          if (movedDistance.x > moveThreshold || movedDistance.y > moveThreshold) {
            cancel(context)(event, LongPressCallbackReason.CancelledByMovement);
          }
        }
      }
    },
    [cancel, cancelOnMovement, onMove]
  );

  /*const unregisterWindowListeners = useCallback((context: Context | undefined) => {
    // Skip if SSR
    if (!window) return;

    const contextHash = hashContext(context);
    const listener = windowListeners.current.get(contextHash);

    if (listener) {
      window.removeEventListener('mouseup', listener);
      window.removeEventListener('touchend', listener);
      window.removeEventListener('pointerup', listener);

      windowListeners.current.delete(contextHash);
    }
  }, []);*/

  const binder = useCallback<LongPressResult<LongPressHandlers<Target>, Context>>(
    (ctx?: Context) => {
      if (callback === null) {
        return {};
      }

      switch (detect) {
        case LongPressEventType.Mouse: {
          const result: LongPressMouseHandlers = {
            onMouseDown: start(ctx) as MouseEventHandler<Target>,
            onMouseMove: move(ctx) as MouseEventHandler<Target>,
            onMouseUp: cancel(ctx) as MouseEventHandler<Target>,
          };

          if (cancelOutsideElement) {
            result.onMouseLeave = (event: MouseEvent<Target>) => {
              cancel(ctx)(event, LongPressCallbackReason.CancelledOutsideElement);
            };
          }

          return result;
        }

        case LongPressEventType.Touch:
          return {
            onTouchStart: start(ctx) as TouchEventHandler<Target>,
            onTouchMove: move(ctx) as TouchEventHandler<Target>,
            onTouchEnd: cancel(ctx) as TouchEventHandler<Target>,
          };

        case LongPressEventType.Pointer: {
          const result: LongPressPointerHandlers = {
            onPointerDown: start(ctx) as PointerEventHandler<Target>,
            onPointerMove: move(ctx) as PointerEventHandler<Target>,
            onPointerUp: cancel(ctx) as PointerEventHandler<Target>,
          };

          if (cancelOutsideElement) {
            result.onPointerLeave = (event: PointerEvent<Target>) =>
              cancel(ctx)(event, LongPressCallbackReason.CancelledOutsideElement);
          }

          return result;
        }
      }
    },
    [callback, cancel, cancelOutsideElement, detect, move, start]
  );

  // Listen to long press stop events on window
  useEffect(() => {
    function listener(event: LongPressDomEvents) {
      const reactEvent = createArtificialReactEvent<Target>(event);
      cancel()(reactEvent);
    }

    window.addEventListener('mouseup', listener);
    window.addEventListener('touchend', listener);
    window.addEventListener('pointerup', listener);

    // Unregister all listeners on unmount
    return () => {
      window.removeEventListener('mouseup', listener);
      window.removeEventListener('touchend', listener);
      window.removeEventListener('pointerup', listener);
    };
  }, [cancel]);

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

  return binder;
}
