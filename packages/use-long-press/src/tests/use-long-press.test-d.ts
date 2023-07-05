import { describe, expectTypeOf, test } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import {
  LongPressCallback,
  LongPressEmptyHandlers,
  LongPressEventType,
  LongPressHandlers,
  LongPressMouseHandlers,
  LongPressOptions,
  LongPressPointerHandlers,
  LongPressResult,
  LongPressTouchHandlers,
  useLongPress,
} from '../lib';
import { noop } from './use-long-press.test.consts';

describe('useLongPress typings', () => {
  test('General hook function typings', () => {
    const { result } = renderHook(() => useLongPress(noop));
    const bind = result.current;

    expectTypeOf(useLongPress).toBeFunction();
    expectTypeOf(useLongPress).parameter(0).toMatchTypeOf<LongPressCallback | null>();
    expectTypeOf(useLongPress).parameter(1).toMatchTypeOf<LongPressOptions | undefined>();
    expectTypeOf(useLongPress).returns.toBeFunction();

    expectTypeOf(bind).toMatchTypeOf<LongPressResult<LongPressHandlers, void>>();
    expectTypeOf(bind).toBeFunction();
    expectTypeOf(bind).parameter(0).toBeUnknown();
    expectTypeOf(bind).returns.toBeObject();
    expectTypeOf(bind).returns.toMatchTypeOf<LongPressHandlers>();

    const handlers = bind();

    expectTypeOf(handlers).toBeObject();
    expectTypeOf(handlers).toMatchTypeOf<LongPressHandlers>();
  });

  test('Hook with null callback do not return handlers', () => {
    const { result } = renderHook(() => useLongPress(null));
    expectTypeOf(result.current).returns.toMatchTypeOf<LongPressEmptyHandlers>();
  });

  test('Hook with default detect to return pointer handlers', () => {
    const { result } = renderHook(() => useLongPress<HTMLDivElement>(noop));
    expectTypeOf(result.current).returns.toMatchTypeOf<LongPressPointerHandlers<HTMLDivElement>>();
  });

  test('Hook with "mouse" detect to return mouse handlers', () => {
    const { result } = renderHook(() => useLongPress<HTMLDivElement>(noop, { detect: LongPressEventType.Mouse }));
    expectTypeOf(result.current).returns.toMatchTypeOf<LongPressMouseHandlers<HTMLDivElement>>();
  });

  test('Hook with "touch" detect to return touch handlers', () => {
    const { result } = renderHook(() => useLongPress<HTMLDivElement>(noop, { detect: LongPressEventType.Touch }));
    expectTypeOf(result.current).returns.toMatchTypeOf<LongPressTouchHandlers<HTMLDivElement>>();
  });

  test('Hook with "pointer" detect to return pointer handlers', () => {
    const { result } = renderHook(() => useLongPress<HTMLDivElement>(noop, { detect: LongPressEventType.Pointer }));
    expectTypeOf(result.current).returns.toMatchTypeOf<LongPressPointerHandlers<HTMLDivElement>>();
  });
});
