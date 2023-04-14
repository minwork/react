import { act, renderHook } from "@testing-library/react-hooks";
import { fireEvent, render } from "@testing-library/react";
import { useLongPress } from "../use-long-press";
import {
  LongPressCallback,
  LongPressCallbackReason,
  LongPressEventType,
  LongPressMouseHandlers,
  LongPressTouchHandlers
} from "../use-long-press.types";
import {
  createTestComponent,
  createTestElement,
  getComponentElement,
  TestComponent,
  TestComponentProps
} from "./TestComponent";
import React from "react";
import { describe, expect, MockedFunction } from "vitest";
import {
  emptyContext,
  expectSpecificEvent,
  expectTouchEvent,
  longPressExpectedEventMap,
  longPressMockedEventCreatorMap,
  noop
} from "./use-long-press.test.consts";
import {
  createMockedMouseEvent,
  createMockedTouchEvent,
  createPositionedEventFactory,
  getDOMTestHandlersMap,
  getTestHandlersMap
} from "./use-long-press.test.utils";
import { LongPressReactEvents } from "./use-long-press.test.types";

/*
 ⌜‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
 ⎹ Common
 ⌞____________________________________________________________________________________________________
*/
afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

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

  test('Return object with mouse handlers when options are not specified', () => {
    const { result } = renderHook(() => useLongPress(noop));
    expect(result.current()).toStrictEqual<LongPressMouseHandlers>({
      onMouseDown: expect.any(Function),
      onMouseMove: expect.any(Function),
      onMouseUp: expect.any(Function),
    });
  });

  test('Return appropriate handlers when called with detect param', () => {
    const { result: resultMouse } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressEventType.MOUSE,
      })
    );
    expect(resultMouse.current()).toStrictEqual<LongPressMouseHandlers>({
      onMouseDown: expect.any(Function),
      onMouseUp: expect.any(Function),
      onMouseMove: expect.any(Function),
    });

    const { result: resultTouch } = renderHook(() =>
      useLongPress(noop, {
        detect: LongPressEventType.TOUCH,
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
    [LongPressEventType.MOUSE, new ErrorEvent('invalid') as unknown as React.MouseEvent],
    [LongPressEventType.TOUCH, new ErrorEvent('invalid') as unknown as React.TouchEvent],
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
describe('Browsers compatibility', () => {
  const originalTouchEvent = window.TouchEvent;

  let touchEvent: React.TouchEvent;

  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();

    touchEvent = createMockedTouchEvent();

    // Temporary remove TouchEvent from window to check if test will be properly handled
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

  test('Properly detect TouchEvent event if browser doesnt provide test', () => {
    const component = createTestElement({
      callback,
      onStart,
      onFinish,
      onCancel,
      captureEvent: true,
      detect: LongPressEventType.TOUCH,
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

describe('Detecting long press', () => {
  let threshold: number;

  let callback: MockedFunction<LongPressCallback>;
  let onStart: MockedFunction<LongPressCallback>;
  let onFinish: MockedFunction<LongPressCallback>;
  let onCancel: MockedFunction<LongPressCallback>;

  beforeEach(() => {
    // Use fake timers for detecting long press
    vi.useFakeTimers();

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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

    test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
      [LongPressEventType.MOUSE, true],
      [LongPressEventType.MOUSE, false],
      [LongPressEventType.TOUCH, true],
      [LongPressEventType.TOUCH, false],
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
    test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
    test.each([[LongPressEventType.TOUCH], [LongPressEventType.MOUSE]])(
      'Do not cancel on movement when "cancelOnMovement" is set to false and using "%s" events',
      (eventType) => {
        const callback = vi.fn();
        const component = createTestElement({
          callback,
          cancelOnMovement: false,
          detect: eventType,
        });
        const eventFactory = createPositionedEventFactory(eventType, component);

        fireEvent(component, eventFactory.start(0, 0));
        fireEvent(component, eventFactory.move(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
        vi.runOnlyPendingTimers();
        fireEvent(component, eventFactory.stop(0, 0));

        expect(callback).toBeCalledTimes(1);
      }
    );

    test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

        const eventFactory = createPositionedEventFactory(eventType, component);

        const moveEvent = eventFactory.move(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

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

    test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
        const eventFactory = createPositionedEventFactory(eventType, component);

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

    test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
          detect: eventType
        });
        const eventFactory = createPositionedEventFactory(eventType, component);

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
  describe('filterEvents', () => {
    const filterEvents = (event: LongPressReactEvents) => {
      if ('button' in event && event.button === 2) {
        return false;
      }
      return !event.altKey;
    };

    test.each([
      [LongPressEventType.MOUSE, createMockedMouseEvent({ button: 2 })],
      [LongPressEventType.TOUCH, createMockedTouchEvent({ altKey: true })],
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
        filterEvents,
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

    test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
    threshold = Math.round(Math.random() * 1000);
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
      const element = getComponentElement(component);
      const longPressEvent = getDOMTestHandlersMap(eventType, element);

      longPressEvent.start(event);

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context2 }} />);

      longPressEvent.move(event);
      vi.runOnlyPendingTimers();

      // Update context
      component.rerender(<TestComponent {...{ ...props, context: context3 }} />);

      longPressEvent.stop(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining(event), { context: context1 });

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining(event), { context: context1 });

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(expect.objectContaining(event), { context: context2 });

      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining(event), { context: context3 });

      expect(onCancel).toHaveBeenCalledTimes(0);
    }
  );

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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
      const eventsFactory = createPositionedEventFactory(eventType, component);
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
    vi.clearAllMocks();
  });

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([[LongPressEventType.MOUSE], [LongPressEventType.TOUCH]])(
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

  test.each([
    [LongPressEventType.MOUSE],
    [LongPressEventType.TOUCH],
  ])('Suppress multiple start callback calls, while using "%s" events', (eventType) => {
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
  })
});
