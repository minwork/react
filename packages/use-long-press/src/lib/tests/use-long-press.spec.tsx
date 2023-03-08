import { act, renderHook } from '@testing-library/react-hooks';
import { fireEvent, render } from '@testing-library/react';
import {
  createPositionedMouseEventFactory,
  createPositionedTouchEventFactory,
  emptyContext,
  expectMouseEvent,
  expectSpecificEvent,
  expectTouchEvent,
  mockReactMouseEvent,
  mockReactTouchEvent,
  noop,
} from './use-long-press-spec.utils';
import { LongPressCallback, LongPressDetectEvents, LongPressEventReason, useLongPress } from '../use-long-press';
import {
  createTestComponent,
  createTestElement,
  getComponentElement,
  TestComponent,
  TestComponentProps,
} from './TestComponent';
import React from 'react';
import { isMouseEvent, isTouchEvent } from '../use-long-press.utils';
import { expect, MockedFunction } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('Check isolated hook calls', () => {
  it('should return empty object when callback is null', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current()).toEqual({});
  });

  it('should return object with all handlers when callback is not null', () => {
    const { result } = renderHook(() => useLongPress(noop));
    expect(result.current()).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });

  it('should return appropriate handlers when called with detect param', () => {
    const { result: resultBoth } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressDetectEvents.BOTH,
      })
    );
    expect(resultBoth.current()).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });

    const { result: resultMouse } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressDetectEvents.MOUSE,
      })
    );
    expect(resultMouse.current()).toMatchObject({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseLeave: expect.any(Function),
    });

    const { result: resultTouch } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressDetectEvents.TOUCH,
      })
    );
    expect(resultTouch.current()).toMatchObject({
      onTouchStart: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });

  it('should return callable object', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current()).toEqual({});
  });

  it('Hook is not failing when invalid event was sent to the handler', () => {
    vi.useFakeTimers();

    const fakeMouseEvent = new ErrorEvent('invalid') as unknown as React.MouseEvent;
    const fakeTouchEvent = new ErrorEvent('invalid') as unknown as React.TouchEvent;
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();

    const { result } = renderHook(() => useLongPress(callback));

    // Make sure it works on proper event
    result.current().onMouseDown(mouseEvent);
    vi.runOnlyPendingTimers();
    result.current().onMouseUp(mouseEvent);

    expect(callback).toHaveBeenCalledTimes(1);

    callback.mockReset();

    result.current().onMouseDown(fakeMouseEvent);
    vi.runOnlyPendingTimers();
    result.current().onMouseUp(fakeMouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    result.current().onMouseDown(fakeMouseEvent);
    result.current().onMouseMove(fakeMouseEvent);
    vi.runOnlyPendingTimers();
    result.current().onMouseUp(fakeMouseEvent);
    result.current().onMouseLeave(fakeMouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    result.current().onTouchStart(fakeTouchEvent);
    vi.runOnlyPendingTimers();
    result.current().onTouchEnd(fakeTouchEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    result.current().onTouchStart(fakeTouchEvent);
    result.current().onTouchMove(fakeTouchEvent);
    vi.runOnlyPendingTimers();
    result.current().onTouchEnd(fakeTouchEvent);

    expect(callback).toHaveBeenCalledTimes(0);
  })
});

describe('Browser compatibility', () => {
  const originalTouchEvent = window.TouchEvent;

  let touchEvent: React.TouchEvent;

  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();

    touchEvent = mockReactTouchEvent();

    // Temporary remove TouchEvent from window to check if it will be properly handled
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete window.TouchEvent;

    callback = vi.fn();
    onStart = vi.fn();
    onFinish = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    // Restore original window touch event
    window.TouchEvent = originalTouchEvent;

    vi.clearAllMocks();
    vi.clearAllTimers();
  });
  it('Properly detect TouchEvent event if browser doesnt provide it', () => {
    const component = createTestElement({
      callback,
      onStart,
      onFinish,
      onCancel,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    fireEvent.touchStart(component, touchEvent);
    vi.runOnlyPendingTimers();
    fireEvent.touchEnd(component, touchEvent);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(0);
  });
});

describe('Detect long press and trigger appropriate handlers', () => {
  let threshold: number;

  let mouseEvent: React.MouseEvent;
  let touchEvent: React.TouchEvent;

  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();

    threshold = Math.round(Math.random() * 1000);

    mouseEvent = mockReactMouseEvent();
    touchEvent = mockReactTouchEvent();

    callback = vi.fn();
    onStart = vi.fn();
    onFinish = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it('Detect long press using mouse events', () => {
    const component = createTestElement({
      callback,
      onStart,
      onFinish,
      onCancel,
      threshold,
      captureEvent: true,
      detect: LongPressDetectEvents.MOUSE,
    });

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse up (trigger long press)
    // --------------------------------------------------------------------------------------------------------

    fireEvent.mouseDown(component, mouseEvent);
    vi.runOnlyPendingTimers();
    fireEvent.mouseUp(component, mouseEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse leave (trigger long press)
    // --------------------------------------------------------------------------------------------------------
    vi.clearAllMocks();

    fireEvent.mouseDown(component, mouseEvent);
    vi.runOnlyPendingTimers();
    fireEvent.mouseLeave(component, mouseEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse up (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    vi.clearAllMocks();

    fireEvent.mouseDown(component, mouseEvent);
    vi.advanceTimersByTime(Math.round(threshold / 2));
    fireEvent.mouseUp(component, mouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(expectMouseEvent, { reason: LongPressEventReason.CANCELED_BY_TIMEOUT });

    expect(onFinish).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Mouse down + mouse leave (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    vi.clearAllMocks();

    fireEvent.mouseDown(component, mouseEvent);
    vi.advanceTimersByTime(Math.round(threshold / 2));
    fireEvent.mouseLeave(component, mouseEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(expectMouseEvent, { reason: LongPressEventReason.CANCELED_BY_TIMEOUT });

    expect(onFinish).toHaveBeenCalledTimes(0);
  });

  it('Detect long press using touch events', () => {
    const component = createTestElement({
      callback,
      onStart,
      onFinish,
      onCancel,
      threshold,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    // --------------------------------------------------------------------------------------------------------
    // Touch start + touch end (trigger long press)
    // --------------------------------------------------------------------------------------------------------

    fireEvent.touchStart(component, touchEvent);
    vi.runOnlyPendingTimers();
    fireEvent.touchEnd(component, touchEvent);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(0);

    // --------------------------------------------------------------------------------------------------------
    // Touch start + touch end (cancelled long press)
    // --------------------------------------------------------------------------------------------------------
    vi.clearAllMocks();

    fireEvent.touchStart(component, touchEvent);
    vi.advanceTimersByTime(Math.round(threshold / 2));
    fireEvent.touchEnd(component, touchEvent);

    expect(callback).toHaveBeenCalledTimes(0);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledWith(expectTouchEvent, { reason: LongPressEventReason.CANCELED_BY_TIMEOUT });

    expect(onFinish).toHaveBeenCalledTimes(0);
  });

  it('Detect and capture move event', () => {
    const onMove = vi.fn();

    let touchComponent = createTestElement({
      callback: vi.fn(),
      onMove,
      captureEvent: true,
      detect: LongPressDetectEvents.TOUCH,
    });

    fireEvent.touchMove(touchComponent, touchEvent);
    expect(onMove).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    touchComponent = createTestElement({
      callback: vi.fn(),
      onMove,
      captureEvent: false,
      detect: LongPressDetectEvents.TOUCH,
    });

    fireEvent.touchMove(touchComponent, touchEvent);
    expect(onMove).toHaveBeenCalledWith(expectTouchEvent, emptyContext);

    let mouseComponent = createTestElement({
      callback: vi.fn(),
      onMove,
      captureEvent: true,
      detect: LongPressDetectEvents.MOUSE,
    });

    fireEvent.mouseMove(mouseComponent, mouseEvent);
    expect(onMove).toHaveBeenCalledWith(expectMouseEvent, emptyContext);

    mouseComponent = createTestElement({
      callback: vi.fn(),
      onMove,
      captureEvent: false,
      detect: LongPressDetectEvents.MOUSE,
    });

    fireEvent.mouseMove(mouseComponent, mouseEvent);
    expect(onMove).toHaveBeenCalledWith(expectMouseEvent, emptyContext);
  });
});

describe('Check appropriate behaviour considering supplied hook options', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('Non-persistent events are passed to callbacks when captureEvent flag is false', () => {
    const threshold = 400;
    const callback = vi.fn();
    const onStart = vi.fn();
    const onFinish = vi.fn();
    const onCancel = vi.fn();
    const persistMock = vi.fn();
    const mouseEvent = mockReactMouseEvent({ persist: persistMock });
    const component = createTestElement({
      callback,
      onStart,
      onFinish,
      onCancel,
      threshold,
      captureEvent: false,
    });

    fireEvent.mouseDown(component, mouseEvent);
    vi.runOnlyPendingTimers();
    fireEvent.mouseUp(component, mouseEvent);

    expect(persistMock).toHaveBeenCalledTimes(0);

    fireEvent.mouseDown(component, mouseEvent);
    vi.advanceTimersByTime(Math.round(threshold / 2));
    fireEvent.mouseUp(component, mouseEvent);

    expect(persistMock).toHaveBeenCalledTimes(0);
  });

  it('Long press is properly detected when end event is long after threshold value', () => {
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();
    const threshold = 1000;
    const component = createTestElement({ callback, threshold });

    fireEvent.mouseDown(component, mouseEvent);
    vi.advanceTimersByTime(threshold * 5);
    fireEvent.mouseUp(component, mouseEvent);

    expect(callback).toBeCalledTimes(1);
  });

  it('Detect both mouse and touch events interchangeably, when using detect both option', () => {
    const touchEvent = mockReactTouchEvent();
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();
    const component = createTestElement({ callback, detect: LongPressDetectEvents.BOTH });

    fireEvent.touchStart(component, touchEvent);
    vi.runOnlyPendingTimers();
    fireEvent.mouseLeave(component, mouseEvent);

    expect(callback).toBeCalledTimes(1);
  });

  it('Triggering multiple events simultaneously does not trigger onStart and callback twice when using detect both option', () => {
    const touchEvent = mockReactTouchEvent();
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();
    const onStart = vi.fn();
    const onFinish = vi.fn();
    const component = createTestElement({
      callback,
      detect: LongPressDetectEvents.BOTH,
      onStart,
      onFinish,
    });

    fireEvent.mouseDown(component, mouseEvent);
    fireEvent.touchStart(component, touchEvent);
    expect(onStart).toBeCalledTimes(1);
    vi.runOnlyPendingTimers();
    fireEvent.mouseLeave(component, mouseEvent);
    fireEvent.mouseUp(component, mouseEvent);
    fireEvent.touchEnd(component, touchEvent);
    expect(callback).toBeCalledTimes(1);
    expect(onFinish).toBeCalledTimes(1);
  });

  describe('Cancel on movement', () => {
    it('Should not cancel on movement when appropriate option is set to false', () => {
      const callback = vi.fn();
      const component = createTestElement({
        callback,
        cancelOnMovement: false,
      });

      const touchEventFactory = createPositionedTouchEventFactory(component);
      const mouseEventFactory = createPositionedMouseEventFactory(component);


      fireEvent(component, touchEventFactory.touchStart(0, 0));
      fireEvent(component, touchEventFactory.touchMove(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
      vi.runOnlyPendingTimers();
      fireEvent(component, touchEventFactory.touchEnd(0, 0));

      expect(callback).toBeCalledTimes(1);

      fireEvent(component, mouseEventFactory.mouseDown(0, 0));
      fireEvent(component, mouseEventFactory.mouseMove(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
      vi.runOnlyPendingTimers();
      fireEvent(component, mouseEventFactory.mouseUp(0, 0));
      expect(callback).toBeCalledTimes(2);
    });

    it('Should cancel on movement when appropriate option is set to true', () => {
      const callback = vi.fn();
      const onMove = vi.fn();
      const onCancel = vi.fn();
      const component = createTestElement({
        callback,
        onMove,
        onCancel,
        cancelOnMovement: true,
      });

      const touchEventFactory = createPositionedTouchEventFactory(component);
      const mouseEventFactory = createPositionedMouseEventFactory(component);


      const touchMoveEvent = touchEventFactory.touchMove(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

      fireEvent(component, touchEventFactory.touchStart(0, 0));
      fireEvent(component, touchMoveEvent);
      vi.runOnlyPendingTimers();
      fireEvent(component, touchEventFactory.touchEnd(0, 0));

      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(expectSpecificEvent(touchMoveEvent), emptyContext);
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(expectSpecificEvent(touchMoveEvent), { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });

      callback.mockReset();
      onMove.mockReset();
      onCancel.mockReset();

      const mouseMoveEvent = mouseEventFactory.mouseMove(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

      fireEvent(component, mouseEventFactory.mouseDown(0, 0));
      fireEvent(component, mouseMoveEvent);
      vi.runOnlyPendingTimers();
      fireEvent(component, mouseEventFactory.mouseUp(0, 0));

      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(expectSpecificEvent(mouseMoveEvent), emptyContext);
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(expectSpecificEvent(mouseMoveEvent), { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });
    });

    it('Should not cancel when within explicitly set movement tolerance', () => {
      const tolerance = 10;
      const callback = vi.fn();
      const onMove = vi.fn();

      const component = createTestElement({
        callback,
        onMove,
        cancelOnMovement: tolerance,
      });

      const touchEventFactory = createPositionedTouchEventFactory(component);
      const mouseEventFactory = createPositionedMouseEventFactory(component);

      const touchMoveEvent = touchEventFactory.touchMove(tolerance, tolerance);

      fireEvent(component, touchEventFactory.touchStart(0, 0));
      fireEvent(component, touchMoveEvent);
      vi.runOnlyPendingTimers();
      fireEvent(component, touchEventFactory.touchEnd(0, 0));

      expect(callback).toBeCalledTimes(1);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(expectSpecificEvent(touchMoveEvent), emptyContext);

      callback.mockReset();
      onMove.mockReset();

      const mouseMoveEvent = mouseEventFactory.mouseMove(tolerance, tolerance);

      fireEvent(component, mouseEventFactory.mouseDown(0,0));
      fireEvent(component, mouseMoveEvent);
      vi.runOnlyPendingTimers();
      fireEvent(component, mouseEventFactory.mouseUp(0,0));
      expect(callback).toBeCalledTimes(1);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(expectSpecificEvent(mouseMoveEvent), emptyContext);
    });

    it('Should cancel when moved outside explicitly set movement tolerance', () => {
      const tolerance = 10;
      const callback = vi.fn();
      const onMove = vi.fn();
      const onCancel = vi.fn();

      const component = createTestElement({
        callback,
        onMove,
        onCancel,
        cancelOnMovement: tolerance,
      });

      const touchEventFactory = createPositionedTouchEventFactory(component);
      const mouseEventFactory = createPositionedMouseEventFactory(component);

      const touchMoveEvent = touchEventFactory.touchMove(tolerance + 1, tolerance);

      fireEvent(component, touchEventFactory.touchStart(0, 0));
      fireEvent(component, touchMoveEvent);
      vi.runOnlyPendingTimers();
      fireEvent(component, touchEventFactory.touchEnd(0, 0));

      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(expectSpecificEvent(touchMoveEvent), emptyContext);
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(expectSpecificEvent(touchMoveEvent), { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });

      callback.mockReset();
      onMove.mockReset();
      onCancel.mockReset();

      const mouseMoveEvent = mouseEventFactory.mouseMove(tolerance, tolerance * 2);

      fireEvent(component, mouseEventFactory.mouseDown(0,0));
      fireEvent(component, mouseMoveEvent);
      vi.runOnlyPendingTimers();
      fireEvent(component, mouseEventFactory.mouseUp(0,0));

      expect(callback).toBeCalledTimes(0);
      expect(onMove).toBeCalledTimes(1);
      expect(onMove).toBeCalledWith(expectSpecificEvent(mouseMoveEvent), emptyContext);
      expect(onCancel).toBeCalledTimes(1);
      expect(onCancel).toBeCalledWith(expectSpecificEvent(mouseMoveEvent), { reason: LongPressEventReason.CANCELED_BY_MOVEMENT });
    });
  });

  it('should not trigger callbacks when event is filtered out by filterEvents option', () => {
    let touchEvent = mockReactTouchEvent({ altKey: true });
    let mouseEvent = mockReactMouseEvent({ button: 2 });
    const callback = vi.fn();
    const onStart = vi.fn();
    const onFinish = vi.fn();
    const onCancel = vi.fn();
    const component = createTestElement({
      callback,
      detect: LongPressDetectEvents.BOTH,
      onStart,
      onFinish,
      onCancel,
      filterEvents: (event) => {
        if ('button' in event && event.button === 2) {
          return false;
        }
        return !event.altKey;
      },
    });

    fireEvent.mouseDown(component, mouseEvent);
    fireEvent.touchStart(component, touchEvent);
    expect(onStart).toBeCalledTimes(0);
    vi.runOnlyPendingTimers();
    fireEvent.mouseLeave(component, mouseEvent);
    fireEvent.mouseUp(component, mouseEvent);
    fireEvent.touchEnd(component, touchEvent);
    expect(callback).toBeCalledTimes(0);
    expect(onFinish).toBeCalledTimes(0);
    expect(onCancel).toBeCalledTimes(0);

    mouseEvent = mockReactMouseEvent();
    touchEvent = mockReactTouchEvent();

    fireEvent.mouseDown(component, mouseEvent);
    fireEvent.touchStart(component, touchEvent);
    expect(onStart).toBeCalledTimes(1);
    vi.runOnlyPendingTimers();
    fireEvent.mouseLeave(component, mouseEvent);
    fireEvent.mouseUp(component, mouseEvent);
    fireEvent.touchEnd(component, touchEvent);
    expect(callback).toBeCalledTimes(1);
    expect(onFinish).toBeCalledTimes(1);
    expect(onCancel).toBeCalledTimes(0);
  });
});
describe('Hook returned binder', () => {
  let mouseEvent: React.MouseEvent = mockReactMouseEvent();
  let touchEvent: React.TouchEvent = mockReactTouchEvent();
  let threshold: number;
  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();
    // Setup common variables
    mouseEvent = mockReactMouseEvent();
    touchEvent = mockReactTouchEvent();
    threshold = Math.round(Math.random() * 1000);
    callback = vi.fn();
    onStart = vi.fn();
    onFinish = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it.each([
    [LongPressDetectEvents.MOUSE, mouseEvent],
    [LongPressDetectEvents.TOUCH, touchEvent],
  ])('should be able to retrieve passed context on %s events', (detectType, event) => {
    const onMove: LongPressCallback = vi.fn();
    const context = {
      data: {
        foo: 'bar',
      },
    };
    const component = createTestElement({
      callback,
      context,
      onStart,
      onMove,
      onFinish,
      onCancel,
      threshold,
      detect: detectType,
    });

    if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event)) {
      fireEvent.mouseDown(component, event);
      vi.runOnlyPendingTimers();
      fireEvent.mouseMove(component, event);
      vi.runOnlyPendingTimers();
      fireEvent.mouseUp(component, event);
    } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event)) {
      fireEvent.touchStart(component, event);
      vi.runOnlyPendingTimers();
      fireEvent.touchMove(component, event);
      vi.runOnlyPendingTimers();
      fireEvent.touchEnd(component, event);
    }

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining(event), { context });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining(event), { context });

    expect(onCancel).toHaveBeenCalledTimes(0);
  });

  it.each([
    [LongPressDetectEvents.MOUSE, mouseEvent],
    [LongPressDetectEvents.TOUCH, touchEvent],
  ])('should only receive last passed context on %s events', (detectType, event) => {
    const onMove: LongPressCallback = vi.fn();
    let i = 1;
    const getContext = () => ({
      data: {
        test: i++,
      },
    });

    const context1 = getContext();
    const context2 = getContext();
    const context3 = getContext();

    const props: TestComponentProps = {
      callback,
      context: context1,
      onStart,
      onMove,
      onFinish,
      onCancel,
      detect: detectType,
    };

    const component = render(<TestComponent {...props} />);

    if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event)) {
      fireEvent.mouseDown(getComponentElement(component), event);

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context2 }}/>);

      fireEvent.mouseMove(getComponentElement(component), event);
      vi.runOnlyPendingTimers();

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context3 }}/>);

      fireEvent.mouseUp(getComponentElement(component), event);
    } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event)) {
      fireEvent.touchStart(getComponentElement(component), event);

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context2 }}/>);

      fireEvent.touchMove(getComponentElement(component), event);
      vi.runOnlyPendingTimers();

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context3 }}/>);

      fireEvent.touchEnd(getComponentElement(component), event);
    }

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining(event), { context: context1 });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context: context1 });

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context: context2 });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining(event), { context: context3 });

    expect(onCancel).toHaveBeenCalledTimes(0);
  });

  it.each([
    [LongPressDetectEvents.MOUSE, mouseEvent],
    [LongPressDetectEvents.TOUCH, touchEvent],
  ])(
    'should pass context along with reason when onCancel is called because of a timeout for %s events',
    (detectType, event) => {
      const onMove: LongPressCallback = vi.fn();
      const context = {
        data: {
          foo: 'bar',
        },
      };
      const component = createTestElement({
        callback,
        context,
        onStart,
        onMove,
        onFinish,
        onCancel,
        threshold,
        detect: detectType,
      });

      if (detectType === LongPressDetectEvents.MOUSE && isMouseEvent(event)) {
        fireEvent.mouseDown(component, event);
        vi.advanceTimersByTime(Math.round(threshold / 2));
        fireEvent.mouseMove(component, event);
        fireEvent.mouseLeave(component, event);
      } else if (detectType === LongPressDetectEvents.TOUCH && isTouchEvent(event)) {
        fireEvent.touchStart(component, event);
        vi.advanceTimersByTime(Math.round(threshold / 2));
        fireEvent.touchMove(component, event);
        fireEvent.touchEnd(component, event);
      }

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expect.objectContaining(event), { context, reason: LongPressEventReason.CANCELED_BY_TIMEOUT });
    }
  );

  it(
    'should pass context along with reason when onCancel is called because of a movement for mouse and touch events',
    () => {
      const onMove: MockedFunction<LongPressCallback> = vi.fn();
      const context = {
        data: {
          foo: 'bar',
        },
      };

      let component = createTestElement({
        callback,
        context,
        onStart,
        onMove,
        onFinish,
        onCancel,
        threshold,
        cancelOnMovement: true,
        detect: LongPressDetectEvents.MOUSE,
      });

      const mouseEventsFactory = createPositionedMouseEventFactory(component);

      const mouseMoveEvent = mouseEventsFactory.mouseMove(Infinity, Infinity);

      fireEvent(component, mouseEventsFactory.mouseDown(0, 0));
      vi.advanceTimersByTime(Math.round(threshold / 2));
      fireEvent(component, mouseMoveEvent);
      fireEvent(component, mouseEventsFactory.mouseUp(0, 0));

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectMouseEvent, { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expectSpecificEvent(mouseMoveEvent), { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expectMouseEvent, {
        context,
        reason: LongPressEventReason.CANCELED_BY_MOVEMENT,
      });

      callback.mockReset();
      onStart.mockReset();
      onMove.mockReset();
      onFinish.mockReset();
      onCancel.mockReset();

      component = createTestElement({
        callback,
        context,
        onStart,
        onMove,
        onFinish,
        onCancel,
        threshold,
        cancelOnMovement: true,
        detect: LongPressDetectEvents.TOUCH,
      });

      const touchEventsFactory = createPositionedTouchEventFactory(component);

      const touchMoveEvent = touchEventsFactory.touchMove(Infinity, Infinity);

      fireEvent(component, touchEventsFactory.touchStart(0, 0));
      vi.advanceTimersByTime(Math.round(threshold / 2));
      fireEvent(component, touchMoveEvent);
      fireEvent(component, touchEventsFactory.touchEnd(0, 0));

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectTouchEvent, { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expectSpecificEvent(touchMoveEvent), { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expectTouchEvent, {
        context,
        reason: LongPressEventReason.CANCELED_BY_MOVEMENT,
      });

    }
  );
});

describe('Test general hook behaviour inside a component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('Callback is called repetitively on multiple long presses', () => {
    const touchEvent = mockReactTouchEvent();
    const callback = vi.fn();
    const component = createTestElement({ callback });

    fireEvent.touchStart(component, touchEvent);
    vi.runOnlyPendingTimers();
    fireEvent.touchEnd(component, touchEvent);

    expect(callback).toBeCalledTimes(1);

    fireEvent.touchStart(component, touchEvent);
    vi.runOnlyPendingTimers();
    fireEvent.touchEnd(component, touchEvent);

    expect(callback).toBeCalledTimes(2);

    fireEvent.touchStart(component, touchEvent);
    vi.runOnlyPendingTimers();
    fireEvent.touchEnd(component, touchEvent);

    expect(callback).toBeCalledTimes(3);
  });

  it('Timer is destroyed when component unmount', () => {
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();
    const onStart = vi.fn();
    const threshold = 1000;
    const thresholdHalf = Math.round(threshold / 2);

    const testComponent = createTestComponent({ callback, threshold, onStart });

    // Trigger press start
    fireEvent.mouseDown(getComponentElement(testComponent), mouseEvent);
    expect(onStart).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(thresholdHalf);

    testComponent.unmount();
    // Trigger useEffect unmount handler
    act(() => {
      vi.runAllTimers();
    });

    expect(callback).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(thresholdHalf + 1);
    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('Callbacks are not triggered when callback change to null after click / tap', () => {
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();
    const onStart = vi.fn();
    const onFinish = vi.fn();
    const onCancel = vi.fn();

    const props: TestComponentProps = { callback, onStart, onFinish, onCancel, detect: LongPressDetectEvents.MOUSE };

    const testComponent = render(<TestComponent {...props} />);
    const element = getComponentElement(testComponent);

    fireEvent.mouseDown(element, mouseEvent);

    testComponent.rerender(<TestComponent {...{...props, callback: null}}/>);

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(onStart).toBeCalledTimes(1);
    expect(callback).toBeCalledTimes(0);
    expect(onFinish).toBeCalledTimes(0);
    expect(onCancel).toBeCalledTimes(0);
  });

  it('Cancel event is not called on mouse leave when no mouse down event was present', () => {
    const mouseEvent = mockReactMouseEvent();
    const callback = vi.fn();
    const onCancel = vi.fn();
    const element = createTestElement({ callback, onCancel });

    fireEvent.mouseLeave(element, mouseEvent);
    fireEvent.mouseDown(element, mouseEvent);
    vi.runOnlyPendingTimers();
    fireEvent.mouseUp(element, mouseEvent);
    fireEvent.mouseLeave(element, mouseEvent);

    expect(onCancel).toBeCalledTimes(0);
  });
});
