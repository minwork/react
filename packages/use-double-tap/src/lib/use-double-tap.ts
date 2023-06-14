import { MouseEvent, useCallback, useRef } from 'react';
import { CallbackFunction, DoubleTapCallback, DoubleTapOptions, DoubleTapResult } from './use-double-tap.types';

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
