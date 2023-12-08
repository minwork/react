import { renderHook as renderHookSSR } from '@testing-library/react-hooks/server';
import { act, createEvent, fireEvent, render, renderHook } from '@testing-library/react';
import {
  LongPressCallback,
  LongPressCallbackReason,
  LongPressDomEvents,
  LongPressEventType,
  LongPressMouseHandlers,
  LongPressOptions,
  LongPressPointerHandlers,
  LongPressReactEvents,
  LongPressTouchHandlers,
  useLongPress,
} from '../lib';
import {
  createArtificialReactEvent,
  isMouseEvent,
  isPointerEvent,
  isRecognisableEvent,
  isTouchEvent,
} from '../lib/use-long-press.utils';
import {
  createTestComponent,
  createTestElement,
  getComponentElement,
  TestComponent,
  TestComponentProps,
} from './TestComponent';
import { TouchEvent as ReactTouchEvent, TouchList as ReactTouchList } from 'react';
import { afterEach, beforeEach, describe, expect, MockedFunction, test } from 'vitest';
import {
  emptyContext,
  expectSpecificEvent,
  longPressExpectedEventMap,
  longPressMockedEventCreatorMap,
} from './use-long-press.test.consts';
import {
  createMockedDomEventFactory,
  createPositionedDomEventFactory,
  getDOMTestHandlersMap,
  getTestHandlersMap,
} from './use-long-press.test.utils';
import {
  createMockedMouseEvent,
  createMockedPointerEvent,
  createMockedTouchEvent,
  createPositionedMouseEvent,
  createPositionedPointerEvent,
  createPositionedTouchEvent,
  noop,
} from './use-long-press.test.functions';

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Isolated hook tests
 ⌞____________________________________________________________________________________________________
*/
describe('Hook result', () => {
  test('Return callable function with ability to pass context', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current).toBeTypeOf('function');
    expect(result.current()).toBeTypeOf('object');
    expect(result.current('any context')).toBeTypeOf('object');
  });

  test('Return empty object when callback is null', () => {
    const { result } = renderHook(() => useLongPress(null));
    expect(result.current()).toStrictEqual({});
  });

  test('Return object with pointer handlers when options are not specified', () => {
    const { result } = renderHook(() => useLongPress(noop));
    expect(result.current()).toStrictEqual<LongPressPointerHandlers>({
      onPointerDown: expect.any(Function),
      onPointerMove: expect.any(Function),
      onPointerUp: expect.any(Function),
      onPointerLeave: expect.any(Function),
    });
  });

  test('Return appropriate handlers when called with detect param', () => {
    const { result: resultMouse } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressEventType.Mouse,
      })
    );
    expect(resultMouse.current()).toStrictEqual<LongPressMouseHandlers>({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseMove: expect.any(Function),
      onMouseLeave: expect.any(Function),
    });

    const { result: resultTouch } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressEventType.Touch,
      })
    );
    expect(resultTouch.current()).toMatchObject<LongPressTouchHandlers>({
      onTouchStart: expect.any(Function),
      onTouchMove: expect.any(Function),
      onTouchEnd: expect.any(Function),
    });
  });
});

describe('Hook handlers', () => {
  test.each([
    [LongPressEventType.Mouse, new ErrorEvent('invalid') as unknown as React.MouseEvent],
    [LongPressEventType.Touch, new ErrorEvent('invalid') as unknown as React.TouchEvent],
    [LongPressEventType.Pointer, new ErrorEvent('invalid') as unknown as React.PointerEvent],
  ])('Properly handle invalid event when using "%s" events', (eventType, event) => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() => useLongPress(callback, { detect: eventType }));
    const handlers = getTestHandlersMap(eventType, result.current());

    handlers.start(event);
    vi.runOnlyPendingTimers();
    handlers.stop(event);

    expect(callback).toHaveBeenCalledTimes(0);

    handlers.start(event);
    handlers.move(event);
    vi.runOnlyPendingTimers();
    handlers.stop(event);

    expect(callback).toHaveBeenCalledTimes(0);
  });
});

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Component context tests
 ⌞____________________________________________________________________________________________________
*/
describe('Different environment compatibility', () => {
  test('Properly detect TouchEvent event even if browser doesnt provide it', () => {
    const touchEvent = { touches: {} as ReactTouchList, nativeEvent: { touches: {} as TouchList } } as ReactTouchEvent;
    expect(isRecognisableEvent(touchEvent)).toBe(true);
  });

  describe('Without window', () => {
    beforeEach(() => {
      // Use fake timers for detecting long press
      vi.useFakeTimers();
      // Simulate absence of TouchEvent
      vi.stubGlobal('window', undefined);
    });

    afterEach(() => {
      vi.clearAllMocks();
      vi.clearAllTimers();
      vi.unstubAllGlobals();
    });

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Using hook will not throw error when rendered in SSR context, using "%s" events',
      (eventType) => {
        expect(window).not.toBeDefined();

        const callback = vi.fn();
        const onStart = vi.fn();
        const onMove = vi.fn();
        const onCancel = vi.fn();
        const onFinish = vi.fn();

        const event = longPressMockedEventCreatorMap[eventType]();
        const { result } = renderHookSSR(() =>
          useLongPress(callback, { detect: eventType, onStart, onMove, onCancel, onFinish })
        );
        const handlers = getTestHandlersMap(eventType, result.current());

        handlers.start(event);
        handlers.move(event);
        vi.runOnlyPendingTimers();
        handlers.stop(event);

        expect(isRecognisableEvent(event)).toBe(true);
        expect(callback).toHaveBeenCalledTimes(1);
      }
    );
  });
});

describe('Detecting long press', () => {
  let threshold: number;

  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();

    threshold = Math.round(500 + Math.random() * 500);

    callback = vi.fn();
    onStart = vi.fn();
    onFinish = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Detect long press using "%s" events',
    (eventType) => {
      const component = createTestElement({
        callback,
        onStart,
        onFinish,
        onCancel,
        threshold,
        captureEvent: true,
        detect: eventType,
      });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);
      const expectedEvent = longPressExpectedEventMap[eventType];

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onCancel).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Detect cancelled long press using "%s" events',
    (eventType) => {
      const component = createTestElement({
        callback,
        onStart,
        onFinish,
        onCancel,
        threshold,
        captureEvent: true,
        detect: eventType,
      });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);
      const expectedEvent = longPressExpectedEventMap[eventType];

      vi.clearAllMocks();

      longPressEvent.start(event);
      vi.advanceTimersByTime(Math.round(threshold / 2));
      longPressEvent.stop(event);

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expectedEvent, { reason: LongPressCallbackReason.CancelledByRelease });

      expect(onFinish).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Detect long press when "long press stop" is called on window using "%s" events',
    (eventType) => {
      const component = createTestElement({
        callback,
        onStart,
        onFinish,
        onCancel,
        threshold,
        captureEvent: true,
        detect: eventType,
      });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);
      const domEventFactory = createMockedDomEventFactory(eventType);
      const expectedEvent = longPressExpectedEventMap[eventType];

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      fireEvent(window, domEventFactory.stop());

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onCancel).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Detect cancelled long press when "long press stop" is called on window using "%s" events',
    (eventType) => {
      const component = createTestElement({
        callback,
        onStart,
        onFinish,
        onCancel,
        threshold,
        captureEvent: true,
        detect: eventType,
      });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);
      const domEventFactory = createMockedDomEventFactory(eventType);
      const expectedEvent = longPressExpectedEventMap[eventType];

      vi.clearAllMocks();

      longPressEvent.start(event);
      vi.advanceTimersByTime(Math.round(threshold / 2));
      fireEvent(window, domEventFactory.stop());

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectedEvent, emptyContext);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expectedEvent, { reason: LongPressCallbackReason.CancelledByRelease });

      expect(onFinish).toHaveBeenCalledTimes(0);
    }
  );
});

describe('Hook options', () => {
  describe('captureEvent', () => {
    const persistMock = vi.fn();

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.clearAllMocks();
    });

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'should pass non-persistent "%s" events to callbacks when captureEvent flag is "false"',
      (eventType) => {
        const threshold = 400;
        const callback = vi.fn();
        const onStart = vi.fn();
        const onFinish = vi.fn();
        const onCancel = vi.fn();
        const component = createTestElement({
          callback,
          onStart,
          onFinish,
          onCancel,
          threshold,
          captureEvent: false,
          detect: eventType,
        });
        const longPressEvent = getDOMTestHandlersMap(eventType, component);
        const event = longPressMockedEventCreatorMap[eventType]({ persist: persistMock });

        longPressEvent.start(event);
        vi.runOnlyPendingTimers();
        longPressEvent.stop(event);

        expect(persistMock).toHaveBeenCalledTimes(0);

        longPressEvent.start(event);
        vi.advanceTimersByTime(Math.round(threshold / 2));
        longPressEvent.stop(event);

        expect(persistMock).toHaveBeenCalledTimes(0);
      }
    );

    test.each([
      [LongPressEventType.Mouse, true],
      [LongPressEventType.Mouse, false],
      [LongPressEventType.Touch, true],
      [LongPressEventType.Touch, false],
      [LongPressEventType.Pointer, true],
      [LongPressEventType.Pointer, false],
    ])('should detect "%s" move event when captureEvent is set to "%s"', (eventType, captureEvent) => {
      const onMove = vi.fn();
      const event = longPressExpectedEventMap[eventType];
      const expectedEvent = longPressExpectedEventMap[eventType];

      const component = createTestElement({
        callback: vi.fn(),
        onMove,
        captureEvent,
        detect: eventType,
      });
      const longPressEvent = getDOMTestHandlersMap(eventType, component);

      longPressEvent.move(event);
      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expectedEvent, emptyContext);
    });
  });

  describe('threshold', () => {
    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Detect long press after timer lag is bigger than threshold when using "%s" events',
      (eventType) => {
        const callback = vi.fn();
        const threshold = 1000;
        const component = createTestElement({ callback, threshold, detect: eventType });
        const longPressEvent = getDOMTestHandlersMap(eventType, component);
        const event = longPressMockedEventCreatorMap[eventType]();

        longPressEvent.start(event);
        vi.advanceTimersByTime(threshold * 5);
        longPressEvent.stop(event);

        expect(callback).toBeCalledTimes(1);
      }
    );
  });

  describe('cancelOnMovement', () => {
    test.each([[LongPressEventType.Touch], [LongPressEventType.Mouse], [LongPressEventType.Pointer]])(
      'Do not cancel on movement when "cancelOnMovement" is set to false and using "%s" events',
      (eventType) => {
        const callback = vi.fn();
        const component = createTestElement({
          callback,
          cancelOnMovement: false,
          detect: eventType,
        });
        const eventFactory = createPositionedDomEventFactory(eventType, component);

        fireEvent(component, eventFactory.start(0, 0));
        fireEvent(component, eventFactory.move(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
        vi.runOnlyPendingTimers();
        fireEvent(component, eventFactory.stop(0, 0));

        expect(callback).toBeCalledTimes(1);
      }
    );

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Cancel on movement when "cancelOnMovement" is set to true and using "%s" events',
      (eventType) => {
        const callback = vi.fn();
        const onMove = vi.fn();
        const onCancel = vi.fn();
        const component = createTestElement({
          callback,
          onMove,
          onCancel,
          detect: eventType,
          cancelOnMovement: true,
        });

        const eventFactory = createPositionedDomEventFactory(eventType, component);

        const startEvent = eventFactory.start(0, 0);
        const moveEvent = eventFactory.move(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        const stopEvent = eventFactory.stop(0, 0);

        fireEvent(component, startEvent);
        fireEvent(component, moveEvent);
        vi.runOnlyPendingTimers();
        fireEvent(component, stopEvent);

        expect(callback).toBeCalledTimes(0);
        expect(onMove).toBeCalledTimes(1);
        expect(onMove).toBeCalledWith(expectSpecificEvent(moveEvent), emptyContext);
        expect(onCancel).toBeCalledTimes(1);
        expect(onCancel).toBeCalledWith(expectSpecificEvent(moveEvent), {
          reason: LongPressCallbackReason.CancelledByMovement,
        });
      }
    );

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Do not cancel on movement when within explicitly set movement tolerance, while using "%s" events',
      (eventType) => {
        const tolerance = 10;
        const callback = vi.fn();
        const onMove = vi.fn();

        const component = createTestElement({
          callback,
          onMove,
          cancelOnMovement: tolerance,
          detect: eventType,
        });
        const eventFactory = createPositionedDomEventFactory(eventType, component);

        const moveEvent = eventFactory.move(tolerance, tolerance);

        fireEvent(component, eventFactory.start(0, 0));
        fireEvent(component, moveEvent);
        vi.runOnlyPendingTimers();
        fireEvent(component, eventFactory.stop(0, 0));

        expect(callback).toBeCalledTimes(1);
        expect(onMove).toBeCalledTimes(1);
        expect(onMove).toBeCalledWith(expectSpecificEvent(moveEvent), emptyContext);
      }
    );

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Cancel on movement when outside explicitly set movement tolerance, while using "%s" events',
      (eventType) => {
        const tolerance = 10;
        const callback = vi.fn();
        const onMove = vi.fn();
        const onCancel = vi.fn();

        const component = createTestElement({
          callback,
          onMove,
          onCancel,
          cancelOnMovement: tolerance,
          detect: eventType,
        });
        const eventFactory = createPositionedDomEventFactory(eventType, component);

        const moveEvent = eventFactory.move(tolerance + 1, tolerance);

        fireEvent(component, eventFactory.start(0, 0));
        fireEvent(component, moveEvent);
        vi.runOnlyPendingTimers();
        fireEvent(component, eventFactory.stop(0, 0));

        expect(callback).toBeCalledTimes(0);
        expect(onMove).toBeCalledTimes(1);
        expect(onMove).toBeCalledWith(expectSpecificEvent(moveEvent), emptyContext);
        expect(onCancel).toBeCalledTimes(1);
        expect(onCancel).toBeCalledWith(expectSpecificEvent(moveEvent), {
          reason: LongPressCallbackReason.CancelledByMovement,
        });
      }
    );
  });

  describe('cancelOutsideElement', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
    });

    test.each([[LongPressEventType.Mouse] /*, [LongPressEventType.Touch]*/, [LongPressEventType.Pointer]])(
      'By default cancel with proper reason when "%s" leaves element',
      (eventType) => {
        const onCancel = vi.fn();
        const onFinish = vi.fn();
        const threshold = 1000;

        const element = createTestElement({
          callback: vi.fn(),
          onCancel,
          detect: eventType,
          threshold,
        });
        const longPressEvent = getDOMTestHandlersMap(eventType, element);
        const event = longPressMockedEventCreatorMap[eventType]();
        const expectedEvent = longPressExpectedEventMap[eventType];

        longPressEvent.start(event);
        vi.advanceTimersByTime(threshold / 2);
        longPressEvent.leave?.(event);

        expect(onFinish).toHaveBeenCalledTimes(0);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledWith(expectedEvent, {
          reason: LongPressCallbackReason.CancelledOutsideElement,
        });
      }
    );

    test.each([[LongPressEventType.Mouse] /*, [LongPressEventType.Touch]*/, [LongPressEventType.Pointer]])(
      'Do not cancel when "%s" left element after long press',
      (eventType) => {
        const callback = vi.fn();
        const onCancel = vi.fn();
        const onFinish = vi.fn();
        const threshold = 1000;

        const element = createTestElement({
          callback,
          onCancel,
          onFinish,
          detect: eventType,
          cancelOutsideElement: true,
          threshold,
        });
        const longPressEvent = getDOMTestHandlersMap(eventType, element);
        const event = longPressMockedEventCreatorMap[eventType]();

        longPressEvent.start(event);
        vi.advanceTimersByTime(threshold + 1);
        longPressEvent.leave?.(event);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(0);
        expect(onFinish).toHaveBeenCalledTimes(1);
      }
    );

    test.each([[LongPressEventType.Mouse] /*, [LongPressEventType.Touch]*/, [LongPressEventType.Pointer]])(
      'Do not cancel when "%s" left element if option is set to false',
      (eventType) => {
        const callback = vi.fn();
        const onCancel = vi.fn();
        const onFinish = vi.fn();
        const threshold = 1000;

        const element = createTestElement({
          callback,
          onCancel,
          onFinish,
          detect: eventType,
          cancelOutsideElement: false,
          threshold,
        });
        const longPressEvent = getDOMTestHandlersMap(eventType, element);
        const event = longPressMockedEventCreatorMap[eventType]();

        longPressEvent.start(event);
        longPressEvent.leave?.(event);
        expect(callback).toHaveBeenCalledTimes(0);
        expect(onFinish).toHaveBeenCalledTimes(0);

        vi.advanceTimersByTime(threshold + 1);
        longPressEvent.stop(event);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(0);
        expect(onFinish).toHaveBeenCalledTimes(1);
      }
    );

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Trigger cancel on window when moved "%s" outside element if option is set to false',
      (eventType) => {
        const callback = vi.fn();
        const onCancel = vi.fn();
        const onFinish = vi.fn();
        const windowOnCancel = vi.fn();
        const windowEventName = {
          [LongPressEventType.Mouse]: 'mouseup',
          [LongPressEventType.Touch]: 'touchend',
          [LongPressEventType.Pointer]: 'pointerup',
        }[eventType];
        const threshold = 1000;

        const element = createTestElement({
          callback,
          onCancel,
          onFinish,
          detect: eventType,
          cancelOutsideElement: false,
          threshold,
        });
        const longPressEvent = getDOMTestHandlersMap(eventType, element);
        const event = longPressMockedEventCreatorMap[eventType]();

        window.addEventListener(windowEventName, windowOnCancel);

        longPressEvent.start(event);
        longPressEvent.leave?.(event);
        expect(callback).toHaveBeenCalledTimes(0);
        expect(onFinish).toHaveBeenCalledTimes(0);
        expect(onCancel).toHaveBeenCalledTimes(0);

        vi.advanceTimersByTime(threshold + 1);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledTimes(0);
        expect(onCancel).toHaveBeenCalledTimes(0);
        expect(windowOnCancel).toHaveBeenCalledTimes(0);

        fireEvent(window, createEvent(windowEventName, window));

        expect(windowOnCancel).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(0);

        window.removeEventListener(windowEventName, windowOnCancel);
      }
    );
  });

  describe('filterEvents', () => {
    vi.useFakeTimers();

    const filterEvents = (event: LongPressReactEvents) => {
      if ('button' in event && event.button === 2) {
        return false;
      }
      return !event.altKey;
    };

    test.each([
      [LongPressEventType.Mouse, createMockedMouseEvent({ button: 2 })],
      [LongPressEventType.Touch, createMockedTouchEvent({ altKey: true })],
      [LongPressEventType.Pointer, createMockedPointerEvent()],
    ])('Do not trigger callbacks when "%s" event is filtered out', (eventType, event) => {
      const callback = vi.fn();
      const onStart = vi.fn();
      const onFinish = vi.fn();
      const onCancel = vi.fn();
      const component = createTestElement({
        callback,
        detect: eventType,
        onStart,
        onFinish,
        onCancel,
        // Add pointer event options and check by it when jsdom start supporting pointer events
        filterEvents: (event) => filterEvents(event) && !(event.nativeEvent instanceof PointerEvent),
      });

      const longPressEvent = getDOMTestHandlersMap(eventType, component);

      longPressEvent.start(event);
      expect(onStart).toBeCalledTimes(0);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);
      expect(callback).toBeCalledTimes(0);
      expect(onFinish).toBeCalledTimes(0);
      expect(onCancel).toBeCalledTimes(0);
    });

    test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
      'Trigger callbacks when "%s" event is not filtered out',
      (eventType) => {
        const callback = vi.fn();
        const onStart = vi.fn();
        const onFinish = vi.fn();
        const onCancel = vi.fn();
        const component = createTestElement({
          callback,
          detect: eventType,
          onStart,
          onFinish,
          onCancel,
          filterEvents,
        });

        const longPressEvent = getDOMTestHandlersMap(eventType, component);
        const event = longPressMockedEventCreatorMap[eventType]();

        longPressEvent.start(event);
        expect(onStart).toBeCalledTimes(1);
        vi.runOnlyPendingTimers();
        longPressEvent.stop(event);
        expect(callback).toBeCalledTimes(1);
        expect(onFinish).toBeCalledTimes(1);
        expect(onCancel).toBeCalledTimes(0);
      }
    );
  });
});

describe('Hook context', () => {
  let threshold: number;
  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onMove: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();
    // Setup common variables
    threshold = Math.round(500 + Math.random() * 500);
    callback = vi.fn();
    onStart = vi.fn();
    onMove = vi.fn();
    onFinish = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Retrieve passed context from callbacks when using "%s" events',
    (eventType) => {
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
        detect: eventType,
      });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      longPressEvent.move(event);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onCancel).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Retrieve only last passed context from callbacks when using "%s" events',
    (eventType) => {
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
        detect: eventType,
      };

      const component = render(<TestComponent {...props} />);
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, getComponentElement(component));

      longPressEvent.start(event);

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context2 }} />);

      longPressEvent.move(event);
      vi.runOnlyPendingTimers();

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context3 }} />);

      longPressEvent.stop(event);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context: context1 });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context: context2 });

      expect(callback).toHaveBeenCalledTimes(1);
      // Callback receive context as it was when long press started
      expect(callback).toHaveBeenCalledWith(expect.objectContaining(event), { context: context1 });

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining(event), { context: context3 });

      expect(onCancel).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Each binder call should have its own context when using "%s" events',
    (eventType) => {
      let i = 1;
      const getContext = () => ({
        data: {
          test: i++,
        },
      });

      const context1 = getContext();
      const context2 = getContext();
      const context3 = getContext();

      const options: LongPressOptions = {
        onStart,
        onMove,
        onFinish,
        onCancel,
        detect: eventType,
        cancelOnMovement: false,
      };

      const { result } = renderHook(() => useLongPress(callback, options));

      const event = longPressMockedEventCreatorMap[eventType]();
      const expectedEvent = longPressExpectedEventMap[eventType];

      const handlers1 = getTestHandlersMap(eventType, result.current(context1));
      const handlers2 = getTestHandlersMap(eventType, result.current(context2));
      const handlers3 = getTestHandlersMap(eventType, result.current(context3));

      handlers1.start(event);
      vi.runOnlyPendingTimers();
      handlers1.stop(event);

      expect(onStart).toHaveBeenLastCalledWith(expectedEvent, { context: context1 });
      expect(callback).toHaveBeenLastCalledWith(expectedEvent, { context: context1 });
      expect(onFinish).toHaveBeenLastCalledWith(expectedEvent, { context: context1 });

      handlers2.start(event);
      handlers2.stop(event);

      expect(onStart).toHaveBeenLastCalledWith(expectedEvent, { context: context2 });
      expect(onCancel).toHaveBeenLastCalledWith(expectedEvent, {
        context: context2,
        reason: LongPressCallbackReason.CancelledByRelease,
      });

      const domEventFactory = createMockedDomEventFactory(eventType);

      handlers3.start(event);
      handlers3.move(event);
      fireEvent(window, domEventFactory.stop());

      expect(onStart).toHaveBeenLastCalledWith(expectedEvent, { context: context3 });
      expect(onMove).toHaveBeenLastCalledWith(expectedEvent, { context: context3 });

      // Undefined context when cancelled on window
      expect(onCancel).toHaveBeenLastCalledWith(expectedEvent, {
        context: undefined,
        reason: LongPressCallbackReason.CancelledByRelease,
      });
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Pass context along with reason when "onCancel" is called, while using "%s" events',
    (eventType) => {
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
        detect: eventType,
      });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);

      longPressEvent.start(event);
      vi.advanceTimersByTime(Math.round(threshold / 2));
      longPressEvent.move(event);
      longPressEvent.stop(event);

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expect.objectContaining(event), {
        context,
        reason: LongPressCallbackReason.CancelledByRelease,
      });
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Pass context along with reason when "onCancel" is called because of a movement, while using "%s" events',
    (eventType) => {
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
        cancelOnMovement: true,
        detect: eventType,
      });
      const eventsFactory = createPositionedDomEventFactory(eventType, component);
      const expectEvent = longPressExpectedEventMap[eventType];

      const moveEvent = eventsFactory.move(Infinity, Infinity);

      fireEvent(component, eventsFactory.start(0, 0));
      vi.advanceTimersByTime(Math.round(threshold / 2));
      fireEvent(component, moveEvent);
      fireEvent(component, eventsFactory.stop(0, 0));

      expect(callback).toHaveBeenCalledTimes(0);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expectEvent, { context });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expectSpecificEvent(moveEvent), { context });

      expect(onFinish).toHaveBeenCalledTimes(0);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledWith(expectEvent, {
        context,
        reason: LongPressCallbackReason.CancelledByMovement,
      });
    }
  );
});

describe('Hook usability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Callback is called repetitively on multiple long presses, while using "%s" events',
    (eventType) => {
      const callback = vi.fn();
      const component = createTestElement({ callback, detect: eventType });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, component);

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);

      expect(callback).toBeCalledTimes(1);

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);

      expect(callback).toBeCalledTimes(2);

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);

      expect(callback).toBeCalledTimes(3);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Timer is destroyed when component unmount, while using "%s" events',
    (eventType) => {
      const callback = vi.fn();
      const onStart = vi.fn();
      const threshold = 1000;
      const thresholdHalf = Math.round(threshold / 2);

      const component = createTestComponent({ callback, threshold, onStart, detect: eventType });
      const element = getComponentElement(component);
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.start(event);
      expect(onStart).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(thresholdHalf);

      component.unmount();
      // Trigger useEffect unmount handler
      act(() => {
        vi.runAllTimers();
      });

      expect(callback).toHaveBeenCalledTimes(0);
      vi.advanceTimersByTime(thresholdHalf + 1);
      expect(callback).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Window listeners are unregistered on component unmount when using "%s" events',
    (eventType) => {
      const onAddEventListener = vi.spyOn(window, 'addEventListener');
      const onRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      const callback = vi.fn();
      const onStart = vi.fn();
      const threshold = 1000;
      const thresholdHalf = Math.round(threshold / 2);

      const component = createTestComponent({ callback, threshold, onStart, detect: eventType });
      const element = getComponentElement(component);
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.start(event);
      expect(onStart).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(thresholdHalf);

      component.unmount();
      // Trigger useEffect unmount handler
      act(() => {
        vi.runAllTimers();
      });

      expect(callback).toHaveBeenCalledTimes(0);
      vi.advanceTimersByTime(thresholdHalf + 1);
      expect(callback).toHaveBeenCalledTimes(0);

      expect(onAddEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(onAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(onAddEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));

      onAddEventListener.mockRestore();
      onRemoveEventListener.mockRestore();
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Window listeners are updated when onCancel or onFinish callback changes when using "%s" events',
    (eventType) => {
      const onAddEventListener = vi.spyOn(window, 'addEventListener');
      const onRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      const callback = vi.fn();
      const onCancel1 = vi.fn();
      const onCancel2 = vi.fn();
      const onFinish1 = vi.fn();
      const onFinish2 = vi.fn();

      const props: TestComponentProps = {
        callback,
        onCancel: onCancel1,
        onFinish: onFinish1,
        detect: eventType,
      };
      const component = render(<TestComponent {...props} />);
      const element = getComponentElement(component);

      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);
      const domEventFactory = createMockedDomEventFactory(eventType);

      longPressEvent.start(event);
      fireEvent(window, domEventFactory.stop());

      expect(onCancel1).toHaveBeenCalledTimes(1);
      expect(onCancel2).toHaveBeenCalledTimes(0);
      expect(onFinish1).toHaveBeenCalledTimes(0);
      expect(onFinish2).toHaveBeenCalledTimes(0);

      // Update cancel callback
      component.rerender(<TestComponent {...{ ...props, onCancel: onCancel2 }} />);

      longPressEvent.start(event);
      fireEvent(window, domEventFactory.stop());
      expect(onCancel1).toHaveBeenCalledTimes(1);
      expect(onCancel2).toHaveBeenCalledTimes(1);
      expect(onFinish1).toHaveBeenCalledTimes(0);
      expect(onFinish2).toHaveBeenCalledTimes(0);

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      fireEvent(window, domEventFactory.stop());
      expect(onCancel1).toHaveBeenCalledTimes(1);
      expect(onCancel2).toHaveBeenCalledTimes(1);
      expect(onFinish1).toHaveBeenCalledTimes(1);
      expect(onFinish2).toHaveBeenCalledTimes(0);

      // Update callback
      component.rerender(<TestComponent {...{ ...props, onFinish: onFinish2 }} />);

      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      fireEvent(window, domEventFactory.stop());
      expect(onCancel1).toHaveBeenCalledTimes(1);
      expect(onCancel2).toHaveBeenCalledTimes(1);
      expect(onFinish1).toHaveBeenCalledTimes(1);
      expect(onFinish2).toHaveBeenCalledTimes(1);

      expect(onAddEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(onAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(onAddEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(onRemoveEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));

      onAddEventListener.mockRestore();
      onRemoveEventListener.mockRestore();
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Callbacks are not triggered when callback change to null after click / tap, while using "%s" events',
    (eventType) => {
      const callback = vi.fn();
      const onStart = vi.fn();
      const onFinish = vi.fn();
      const onCancel = vi.fn();

      const props: TestComponentProps = {
        callback,
        onStart,
        onFinish,
        onCancel,
        detect: eventType,
      };

      const component = render(<TestComponent {...props} />);
      const element = getComponentElement(component);
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.start(event);
      component.rerender(<TestComponent {...{ ...props, callback: null }} />);

      act(() => {
        vi.runOnlyPendingTimers();
      });

      expect(onStart).toBeCalledTimes(1);
      expect(callback).toBeCalledTimes(0);
      expect(onFinish).toBeCalledTimes(0);
      expect(onCancel).toBeCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Cancel event is called only after starting press, while using "%s" events',
    (eventType) => {
      const callback = vi.fn();
      const onCancel = vi.fn();
      const element = createTestElement({ callback, onCancel, detect: eventType });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.stop(event);
      longPressEvent.start(event);
      vi.runOnlyPendingTimers();
      longPressEvent.stop(event);
      longPressEvent.stop(event);

      expect(onCancel).toBeCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Suppress multiple "long press start" callback calls, while using "%s" events',
    (eventType) => {
      const onStart = vi.fn();
      const element = createTestElement({ callback: vi.fn(), onStart, detect: eventType });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.start(event);
      longPressEvent.start(event);
      longPressEvent.start(event);
      longPressEvent.start(event);
      longPressEvent.start(event);

      expect(onStart).toHaveBeenCalledTimes(1);
    }
  );

  test.each([[LongPressEventType.Mouse], [LongPressEventType.Touch], [LongPressEventType.Pointer]])(
    'Suppress multiple "long press stop" callback calls, while using "%s" events',
    (eventType) => {
      const onCancel = vi.fn();
      const onFinish = vi.fn();
      const element = createTestElement({ callback: vi.fn(), onCancel, onFinish, detect: eventType });
      const event = longPressMockedEventCreatorMap[eventType]();
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.start(event);
      longPressEvent.stop(event);
      longPressEvent.stop(event);
      longPressEvent.stop(event);
      longPressEvent.stop(event);
      longPressEvent.stop(event);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledTimes(0);
    }
  );
});

describe('Utils', () => {
  test.each([
    [{ nativeEvent: new MouseEvent('mousedown') }, true],
    [{ nativeEvent: new MouseEvent('mousemove') }, true],
    [{ nativeEvent: new MouseEvent('mouseup') }, true],

    [createMockedMouseEvent(), true],
    [createMockedTouchEvent(), false],
    [createMockedPointerEvent(), false],

    [{ nativeEvent: createPositionedMouseEvent(window, 'mouseMove', 1, 2) }, true],
    [{ nativeEvent: createPositionedTouchEvent(window, 'touchMove', 1, 2) }, false],
    [{ nativeEvent: createPositionedPointerEvent(window, 'pointerMove', 1, 2) }, false],

    [{ nativeEvent: new MouseEvent('mousedown') }, true],
    [{ nativeEvent: new TouchEvent('touchstart') }, false],
    [{ nativeEvent: new PointerEvent('pointerdown') }, false],
    [{ nativeEvent: new Event('blur') }, false],

    [{ nativeEvent: createEvent.mouseUp(window) }, true],
    [{ nativeEvent: createEvent.touchEnd(window) }, false],
    [{ nativeEvent: createEvent.pointerUp(window) }, false],
  ])('isMouseEvent treat %s as mouse event: %s', (event, isProperEvent) => {
    expect(isMouseEvent(event as LongPressReactEvents)).toBe(isProperEvent);
  });

  test.each([
    [{ nativeEvent: new TouchEvent('touchstart') }, true],
    [{ nativeEvent: new TouchEvent('touchmove') }, true],
    [{ nativeEvent: new TouchEvent('touchend') }, true],

    [createMockedMouseEvent(), false],
    [createMockedTouchEvent(), true],
    [createMockedPointerEvent(), false],

    [{ nativeEvent: createPositionedMouseEvent(window, 'mouseMove', 1, 2) }, false],
    [{ nativeEvent: createPositionedTouchEvent(window, 'touchMove', 1, 2) }, true],
    [{ nativeEvent: createPositionedPointerEvent(window, 'pointerMove', 1, 2) }, false],

    [{ nativeEvent: new MouseEvent('mousedown') }, false],
    [{ nativeEvent: new TouchEvent('touchstart') }, true],
    [{ nativeEvent: new PointerEvent('pointerdown') }, false],
    [{ nativeEvent: new Event('blur') }, false],

    [{ nativeEvent: createEvent.mouseUp(window) }, false],
    [{ nativeEvent: createEvent.touchEnd(window) }, true],
    [{ nativeEvent: createEvent.pointerUp(window) }, false],
  ])('isTouchEvent treat %s as touch event: %s', (event, isProperEvent) => {
    expect(isTouchEvent(event as LongPressReactEvents)).toBe(isProperEvent);
  });

  test.each([
    [{ nativeEvent: new PointerEvent('pointerdown') }, true],
    [{ nativeEvent: new PointerEvent('pointermove') }, true],
    [{ nativeEvent: new PointerEvent('pointerup') }, true],

    [createMockedMouseEvent(), false],
    [createMockedTouchEvent(), false],
    [createMockedPointerEvent(), true],

    [{ nativeEvent: createPositionedMouseEvent(window, 'mouseMove', 1, 2) }, false],
    [{ nativeEvent: createPositionedTouchEvent(window, 'touchMove', 1, 2) }, false],
    [{ nativeEvent: createPositionedPointerEvent(window, 'pointerMove', 1, 2) }, true],

    [{ nativeEvent: new MouseEvent('mousedown') }, false],
    [{ nativeEvent: new TouchEvent('touchstart') }, false],
    [{ nativeEvent: new PointerEvent('pointerdown') }, true],
    [{ nativeEvent: new Event('blur') }, false],

    [{ nativeEvent: createEvent.mouseUp(window) }, false],
    [{ nativeEvent: createEvent.touchEnd(window) }, false],
    [{ nativeEvent: createEvent.pointerUp(window) }, true],
  ])('isPointerEvent treat %s as pointer event: %s', (event, isProperEvent) => {
    expect(isPointerEvent(event as LongPressReactEvents)).toBe(isProperEvent);
  });

  test.each([
    ['mouseDown' as const],
    ['mouseUp' as const],
    ['touchStart' as const],
    ['touchEnd' as const],
    ['pointerDown' as const],
    ['pointerUp' as const],
  ])('Create recognisable artificial %s react event', (eventName) => {
    const event = createEvent[eventName](window);
    const reactEvent = createArtificialReactEvent(event as LongPressDomEvents);
    expect(isRecognisableEvent(reactEvent)).toBe(true);
  });
});
