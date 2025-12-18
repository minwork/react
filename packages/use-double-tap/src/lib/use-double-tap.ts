import { MouseEvent, useCallback, useRef } from 'react';
import { CallbackFunction, DoubleTapCallback, DoubleTapOptions, DoubleTapResult } from './use-double-tap.types';

/**
 * @param callback - The function to be called on a double tap event.
 * @param threshold - The time in milliseconds that defines the interval between single taps for them to be considered a double tap. Default is 300 ms.
 * @param options - An object containing optional callbacks for single tap and other configurations.
 * @return An object with an onClick handler if a callback is provided, otherwise an empty object.
 */
export function useDoubleTap<Target = Element, Callback extends DoubleTapCallback<Target> = DoubleTapCallback<Target>>(
  callback: Callback,
  threshold = 300,
  options: DoubleTapOptions<Target> = {}
): DoubleTapResult<Target, Callback> {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const handler = useCallback<CallbackFunction<Target>>(
    (event: MouseEvent<Target>) => {
      if (!timer.current) {
        timer.current = setTimeout(() => {
          if (options.onSingleTap) {
            options.onSingleTap(event);
          }
          timer.current = null;
        }, threshold);
      } else {
        clearTimeout(timer.current);
        timer.current = null;
        callback && callback(event);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, threshold, options.onSingleTap]
  );

  return (
    callback
      ? {
          onClick: handler,
        }
      : {}
  ) as DoubleTapResult<Target, Callback>;
}
