import { renderHook } from '@testing-library/react';
import { IntervalHookCallback, IntervalHookFinishCallback, useInterval } from '../lib';
import { noop } from '@react/shared/util-tests';

describe('Check isolated hook calls', () => {
  let callback: IntervalHookCallback;
  let onFinish: IntervalHookFinishCallback;
  beforeEach(() => {
    vi.useFakeTimers();
    callback = vi.fn();
    onFinish = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('Always return object with management methods as a result', () => {
    const resultTemplate = {
      start: expect.any(Function),
      stop: expect.any(Function),
      isActive: expect.any(Function),
    };
    expect(renderHook(() => useInterval(noop)).result.current).toMatchObject(resultTemplate);
    expect(renderHook(() => useInterval(noop, 200)).result.current).toMatchObject(resultTemplate);
    expect(
      renderHook(() =>
        useInterval(noop, 1000, {
          onFinish: noop,
          immediate: false,
          autoStart: true,
        })
      ).result.current
    ).toMatchObject(resultTemplate);
  });

  it('Call interval callback regularly after started and before stopped', () => {
    const interval = 500;
    const manage = renderHook(() => useInterval(callback, interval, { autoStart: false, immediate: false })).result
      .current;

    expect(callback).toBeCalledTimes(0);
    // Start interval
    manage.start();
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(1);
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(2);
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(3);
    manage.stop();
    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(interval);
    expect(callback).toBeCalledTimes(3);
  });

  it('Automatically starts timer when autoStart option is set to true', () => {
    renderHook(() => useInterval(callback, 1000, { autoStart: true }));

    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(1);
  });

  it('Immediately call callback when immediate option and autoStart is set to true', () => {
    renderHook(() => useInterval(callback, 1000, { immediate: true, autoStart: true }));

    expect(callback).toBeCalledTimes(1);
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(2);
  });

  it('Call callback after using start method when immediate option is set to true and autoStart is set to false', () => {
    const { start } = renderHook(() => useInterval(callback, 1000, { immediate: true, autoStart: false })).result
      .current;

    start();
    expect(callback).toBeCalledTimes(1);
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(2);
  });

  it('Call onFinish callback after using stop method (accordingly to stop method argument)', () => {
    renderHook(() => useInterval(callback, 1000, { immediate: true, autoStart: true, onFinish })).result.current.stop();

    expect(onFinish).toBeCalledTimes(1);

    renderHook(() => useInterval(callback, 1000, { onFinish })).result.current.stop();

    expect(onFinish).toBeCalledTimes(2);

    renderHook(() => useInterval(callback, 1000, { onFinish })).result.current.stop(false);

    expect(onFinish).toBeCalledTimes(2);

    // Do not call stop if timer wasn't started
    renderHook(() =>
      useInterval(callback, 1000, { immediate: false, autoStart: false, onFinish })
    ).result.current.stop();

    expect(onFinish).toBeCalledTimes(2);

    renderHook(() => useInterval(callback, 1000, { immediate: true, autoStart: false, onFinish })).result.current.stop(
      false
    );

    expect(onFinish).toBeCalledTimes(2);
  });

  it('Properly return if interval is active using isActive method', () => {
    const { start, stop, isActive } = renderHook(() => useInterval(callback, 1000, { autoStart: false, onFinish }))
      .result.current;

    expect(isActive()).toBe(false);

    start();
    expect(isActive()).toBe(true);
    vi.runOnlyPendingTimers();
    expect(isActive()).toBe(true);
    stop();

    expect(isActive()).toBe(false);
  });

  it('Interval is properly self-correcting and callback is called with correct amount of ticks', () => {
    const { start, stop } = renderHook(() => useInterval(callback, 1000, { autoStart: false })).result.current;

    vi.spyOn(Date, 'now')
      .mockReturnValue(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(5000)
      .mockReturnValueOnce(10500)
      .mockReturnValueOnce(11000);

    start();
    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenLastCalledWith(2);

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenLastCalledWith(3);

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenLastCalledWith(5);

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenLastCalledWith(1);

    stop();
  });

  it('Hook properly ignore duplicated managing method calls', () => {
    const { start, stop } = renderHook(() =>
      useInterval(callback, 1000, { autoStart: false, immediate: false, onFinish })
    ).result.current;

    expect(callback).toBeCalledTimes(0);
    start();
    expect(callback).toBeCalledTimes(0);
    start();
    vi.runOnlyPendingTimers();
    start();
    expect(callback).toBeCalledTimes(1);

    expect(onFinish).toBeCalledTimes(0);
    stop();
    expect(onFinish).toBeCalledTimes(1);
    vi.runOnlyPendingTimers();
    stop();
    stop();
    vi.runOnlyPendingTimers();
    expect(onFinish).toBeCalledTimes(1);

    expect(callback).toBeCalledTimes(1);

    start();
    stop();
    start();
    stop();
    start();
    stop();

    expect(callback).toBeCalledTimes(1);
    expect(onFinish).toBeCalledTimes(4);

    start();
    start();
    expect(callback).toBeCalledTimes(1);
    start();
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(2);
  });

  it('Hook properly ignore duplicated managing method calls when immediate option is set to true', () => {
    const { start, stop } = renderHook(() => useInterval(callback, 1000, { autoStart: false, immediate: true })).result
      .current;

    expect(callback).toBeCalledTimes(0);
    start();
    expect(callback).toBeCalledTimes(1);
    start();
    vi.runOnlyPendingTimers();
    start();
    expect(callback).toBeCalledTimes(2);

    stop();
    vi.runOnlyPendingTimers();
    stop();
    stop();
    vi.runOnlyPendingTimers();

    expect(callback).toBeCalledTimes(2);

    start();
    start();
    expect(callback).toBeCalledTimes(3);
    start();
    vi.runOnlyPendingTimers();
    expect(callback).toBeCalledTimes(4);
  });

  it('should not self correct and pass ticks when selfCorrecting flag is false', () => {
    const { start, stop } = renderHook(() => useInterval(callback, 1000, { autoStart: false, selfCorrecting: false }))
      .result.current;

    start();
    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith();

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(2);

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(3);

    vi.runOnlyPendingTimers();
    expect(callback).toHaveBeenCalledTimes(4);

    stop();
  });
});
