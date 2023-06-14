import { CallbackFunction, DoubleTapOptions, useDoubleTap } from '../';
import { renderHook } from '@testing-library/react';
import { expect } from 'vitest';

export function renderUseDoubleTap<Target = Element>(
  callback: CallbackFunction<Target> | null,
  threshold = 300,
  options: DoubleTapOptions<Target> = {}
) {
  return renderHook(({ callback, threshold, options }) => useDoubleTap(callback, threshold, options), {
    initialProps: {
      callback,
      threshold,
      options,
    },
  });
}

export const expectMouseEvent = expect.objectContaining({ nativeEvent: expect.any(MouseEvent) });
export const expectTouchEvent = expect.objectContaining({ nativeEvent: expect.any(TouchEvent) });
export const expectPointerEvent = expect.objectContaining({ nativeEvent: expect.any(PointerEvent) });
export const expectSpecificEvent = (event: Event) =>
  expect.objectContaining({
    nativeEvent: event,
  });
