import React from 'react';
import { expectMouseEvent, renderUseDoubleTap } from './use-double-tap.test.utils';
import { DoubleTapCallback } from '../';
import { createTestComponent, createTestElement } from './TestComponent';
import { fireEvent } from '@testing-library/react';
import { createMockedMouseEvent, noop } from '@react/shared/util-tests';

describe('Abstract hook usage', () => {
  test('Return expected result', () => {
    const { result } = renderUseDoubleTap(noop);

    expect(result.current).toEqual({
      onClick: expect.any(Function),
    });
  });

  test('Accept two arguments', () => {
    const { result } = renderUseDoubleTap(noop, 1000);

    expect(result.current).toEqual({
      onClick: expect.any(Function),
    });
  });

  test('Accept three arguments', () => {
    const { result } = renderUseDoubleTap(noop, 1000, {
      onSingleTap: noop,
    });

    expect(result.current).toEqual({
      onClick: expect.any(Function),
    });
  });

  test('Accept empty options argument', () => {
    const { result } = renderUseDoubleTap(noop, 1000, {});

    expect(result.current).toEqual({
      onClick: expect.any(Function),
    });
  });

  test('Null callback call return empty object', () => {
    const { result } = renderUseDoubleTap(null);

    expect(result.current).toEqual({});

    const { result: result2 } = renderUseDoubleTap(null, 500);
    expect(result2.current).toEqual({});

    const { result: result3 } = renderUseDoubleTap(null, 500, {});
    expect(result3.current).toEqual({});
  });
});

describe('Component usage', () => {
  let callback: DoubleTapCallback, mouseEvent: React.MouseEvent<HTMLButtonElement>;
  beforeEach(() => {
    vi.useFakeTimers();
    callback = vi.fn();
    mouseEvent = createMockedMouseEvent();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  test('Render component with initial tap count equal zero', () => {
    createTestComponent({ callback });
    expect(callback).toBeCalledTimes(0);
  });

  test('Detect double click and pass proper event to callback', () => {
    const element = createTestElement({ callback });
    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledWith(expectMouseEvent);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledWith(expectMouseEvent);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledWith(expectMouseEvent);

    expect(callback).toBeCalledTimes(3);
  });

  test('Trigger double tap only on clicks within threshold', () => {
    const element = createTestElement({ callback, threshold: 400 });
    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);
    // Wait 500ms
    vi.advanceTimersByTime(500);

    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(1);
  });

  test('Trigger double tap only on clicks within custom threshold', () => {
    const element = createTestElement({ callback, threshold: 400 });

    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);

    // Wait 500ms
    vi.advanceTimersByTime(500);

    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(1);

    fireEvent.click(element, mouseEvent);

    // Wait 200ms
    vi.advanceTimersByTime(200);

    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(2);
  });

  test('Ignore double tap when callback is null', () => {
    const element = createTestElement({ callback: null });

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    expect(callback).toBeCalledTimes(0);
  });

  test('Ignore double tap when callback is null and using custom threshold', () => {
    const element = createTestElement({ callback: null, threshold: 2000 });

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    expect(callback).toBeCalledTimes(0);
  });

  test('Trigger custom callback', () => {
    const element = createTestElement({ callback });

    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);

    expect(callback).toBeCalledTimes(1);

    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(1);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(2);
  });

  test('Trigger custom callback when having custom threshold', () => {
    const element = createTestElement({ callback, threshold: 1500 });

    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);

    // Wait 100ms
    vi.advanceTimersByTime(100);

    fireEvent.click(element, mouseEvent);

    expect(callback).toBeCalledTimes(1);

    fireEvent.click(element, mouseEvent);

    vi.advanceTimersByTime(2000);

    expect(callback).toBeCalledTimes(1);

    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(callback).toBeCalledTimes(2);
  });

  test('Call single tap or double tap callback depending on clicks interval, supply proper event', () => {
    const singleTapCallback = vi.fn();

    const element = createTestElement({
      callback,
      threshold: 300,
      options: { onSingleTap: singleTapCallback },
    });

    expect(callback).toBeCalledTimes(0);

    fireEvent.click(element, mouseEvent);

    // Trigger single tap
    vi.runOnlyPendingTimers();
    expect(singleTapCallback).toBeCalledTimes(1);
    expect(singleTapCallback).toBeCalledWith(expectMouseEvent);
    expect(callback).toBeCalledTimes(0);

    // After double tap, counter should stay the same
    fireEvent.click(element, mouseEvent);
    fireEvent.click(element, mouseEvent);
    expect(singleTapCallback).toBeCalledTimes(1);
    expect(callback).toBeCalledTimes(1);

    // After double tap with 200ms delay, counter should stay the same
    vi.runOnlyPendingTimers();

    fireEvent.click(element, mouseEvent);
    vi.advanceTimersByTime(200);
    fireEvent.click(element, mouseEvent);
    expect(singleTapCallback).toBeCalledTimes(1);
    expect(callback).toBeCalledTimes(2);

    // Counter should increase when there was a long delay after first tap
    fireEvent.click(element, mouseEvent);

    // Wait 5 seconds
    vi.advanceTimersByTime(5000);
    expect(singleTapCallback).toBeCalledTimes(2);
    expect(callback).toBeCalledTimes(2);
  });
});
