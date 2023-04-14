import {
  MouseEvent as ReactMouseEvent,
  MouseEventHandler,
  TouchEvent as ReactTouchEvent,
  TouchEventHandler
} from "react";

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Enums
 ⌞____________________________________________________________________________________________________
*/

/**
 * Which event listeners should be returned from the hook
 */
export enum LongPressEventType {
  MOUSE = 'mouse',
  TOUCH = 'touch',
}

/**
 * What was the reason behind calling specific callback
 * For now it applies only to 'onCancel' which receives cancellation reason
 *
 * @see LongPressCallbackMeta
 */
export enum LongPressCallbackReason {
  /**
   * Returned when mouse / touch was moved outside initial press area when `cancelOnMovement` is active
   */
  CancelledByMovement = 'cancelled-by-movement',
  /**
   * Returned when click / tap was released before long press detection time threshold
   */
  CancelledByRelease = 'cancelled-by-release',
}

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Long press callback
 ⌞____________________________________________________________________________________________________
*/

/**
 * Function to call when long press event is detected
 *
 * @callback longPressCallback
 * @param {Object} event React mouse or touch event (depends on *detect* param)
 * @param {Object} meta Object containing *context* and / or *reason* (if applicable)
 */
export type LongPressCallback<Target extends Element = Element, Context = unknown> = (
  event: LongPressEvent<Target>,
  meta: LongPressCallbackMeta<Context>
) => void;

export type LongPressEvent<Target extends Element = Element> = ReactMouseEvent<Target> | ReactTouchEvent<Target>;
export type LongPressCallbackMeta<Context = unknown> = { context?: Context; reason?: LongPressCallbackReason };

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Hook function
 ⌞____________________________________________________________________________________________________
*/

export interface LongPressOptions<
  Target extends Element = Element,
  Context = unknown,
  EventType extends LongPressEventType = LongPressEventType
> {
  /**
   * Period of time that must elapse after detecting click or tap in order to trigger _callback_
   */
  threshold?: number;
  /**
   * If React Event will be supplied as first argument to all callbacks
   */
  captureEvent?: boolean;
  /**
   * Which type of events should be detected ('mouse' | 'touch'). For TS use *LongPressEventType* enum.
   * @see LongPressEventType
   */
  detect?: EventType;
  filterEvents?: (event: LongPressEvent<Target>) => boolean;
  /**
   * If long press should be canceled on mouse / touch move. Possible values:
   * - `*false*: [default] Disable cancelling on movement
   * - *true*: Enable cancelling on movement and use default 25px threshold
   * - *number*: Set a specific tolerance value in pixels (square side size inside which movement won't cancel long press)
   */
  cancelOnMovement?: boolean | number;
  /**
   * Called right after detecting click / tap event (e.g. onMouseDown or onTouchStart)
   */
  onStart?: LongPressCallback<Target, Context>;
  onMove?: LongPressCallback<Target, Context>;
  /**
   * Called, only if long press was triggered, on releasing click or tap (e.g. onMouseUp, onMouseLeave or onTouchEnd)
   */
  onFinish?: LongPressCallback<Target, Context>;
  /**
   * Called (if long press <u>was <b>not</b> triggered</u>) on releasing click or tap (e.g. onMouseUp, onMouseLeave or onTouchEnd)
   */
  onCancel?: LongPressCallback<Target, Context>;
}

export type LongPressResult<
  T extends LongPressHandlers<Target> | LongPressEmptyHandlers,
  Context = unknown,
  Target extends Element = Element
> = (context?: Context) => T;

export type LongPressEmptyHandlers = Record<never, never>;

export interface LongPressMouseHandlers<Target extends Element = Element> {
  onMouseDown: MouseEventHandler<Target>;
  onMouseMove: MouseEventHandler<Target>;
  onMouseUp: MouseEventHandler<Target>;
}
export interface LongPressTouchHandlers<Target extends Element = Element> {
  onTouchStart: TouchEventHandler<Target>;
  onTouchMove: TouchEventHandler<Target>;
  onTouchEnd: TouchEventHandler<Target>;
}

export type LongPressHandlers<Target extends Element = Element> =
  | LongPressMouseHandlers<Target>
  | LongPressTouchHandlers<Target>
  | LongPressEmptyHandlers;
