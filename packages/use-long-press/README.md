# React Long Press Hook

[![codecov](https://codecov.io/gh/minwork/react/branch/main/graph/badge.svg?token=2KPMMSLDOM)](https://codecov.io/gh/minwork/react)
![npm type definitions](https://img.shields.io/npm/types/use-long-press)
![npm bundle size](https://img.shields.io/bundlephobia/min/use-long-press)
[![npm](https://img.shields.io/npm/v/use-long-press)](https://www.npmjs.com/package/use-long-press)

![Logo horizontal](https://raw.githubusercontent.com/minwork/react/main/packages/use-long-press/images/logo-horizontal.png)

> React hook for detecting _click_ / _tap_ / _point_ and _hold_ event

# Main features
- Mouse, Touch and Pointer events support
- Pass custom context and access it in callback
- Cancel long press if moved too far from the target
- Flexible callbacks: `onStart`, `onMove`, `onFinish`, `onCancel`
- Disable hook when necessary
- Adjustable long press detection threshold

# Table of Contents
1. [Installation](#installation)
2. [Basic Usage](#basic-usage)
3. [Advanced Usage](#advanced-usage) 
   1. [Definition](#hook-definition)
   2. [Callback](#callback)
   3. [Options](#options)
   4. [Additional callbacks](#additional-callbacks)
   5. [Result](#result)
   6. [Context](#context)
   7. [Handlers](#handlers)
4. [Examples](#examples)
   1. [Advanced usage example](#advanced-usage-example)
   2. [Live Examples](#live-examples)
      1. [Version 1](#version-1--deprecated-)
      2. [Version 2](#version-2--deprecated-)
      3. [Version 3](#version-3)
5. [Migration](#migration)
   1. [v1 to v2](#v1-to-v2)
   2. [v2 to v3](#v2-to-v3)
6. [Changelog](#changelog)
7. [FAQ](#faq)
8. [Support us](#support-us)
9. [License](#license)

# Installation

```bash
yarn add use-long-press
```

or

```bash
npm install --save use-long-press
```

# Basic Usage

```tsx
import React from 'react';
import { useLongPress } from 'use-long-press';

const Example = () => {
  const bind = useLongPress(() => {
    console.log('Long pressed!');
  });

  return <button {...bind()}>Press me</button>;
};
```

# Advanced usage

## Hook definition

_Pseudocode_
```
useLongPress(callback [, options]): bindFn
```
_TypeScript_
```ts
declare function useLongPress<
  Target extends Element = Element,
  Context = unknown,
  Callback extends LongPressCallback<Target, Context> = LongPressCallback<Target, Context>
>(
  callback: Callback | null,
  options?: LongPressOptions<Target, Context>
): LongPressResult<LongPressHandlers<Target>, Context>;
```

## Callback
Hook first parameter, _callback_, can be either function or `null` (if you want to disable the hook).

## Options
You can supply _options_ object as a hook second parameter. All options inside the object are optional.

| Name             |                     Type                      |   Default   | Description                                                                                                                                                                                                                                                                       |
|------------------|:---------------------------------------------:|:-----------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| threshold        |                   _number_                    |    _400_    | Time user need to hold click or tap before long press _callback_ is triggered                                                                                                                                                                                                     |
| captureEvent     |                   _boolean_                   |   _false_   | If React MouseEvent (or TouchEvent) should be supplied as first argument to callbacks                                                                                                                                                                                             |
| detect           | _'mouse'_ &#x7c; _'touch'_ &#x7c; _'pointer'_ | _'pointer'_ | Which event handlers should be returned from `bind` function. <br/><br/>TS enum: `LongPressEventType`                                                                                                                                                                             |
| cancelOnMovement |           _boolean_ &#x7c; _number_           |   _false_   | If long press should be cancelled when detected movement while pressing. Use _boolean_ value to turn it on / off or _number_ value to specify move tolerance in pixels.<br/><br/>For more information on how this option work check JSDoc.                                        |
| filterEvents     |             _(event) => boolean_              | _undefined_ | If provided, it gives you the ability to ignore long press detection on specified conditions (e.g. on right mouse click). <br/><br/>When function returns `false`, it will prevent ANY callbacks from triggering (including _onStart_ and _onCancel_) as well as capturing event. |
| onStart          |            _(event, meta) => void_            | _undefined_ | Called when element is initially pressed (before starting timer which detects long press)                                                                                                                                                                                         |
| onMove           |            _(event, meta) => void_            | _undefined_ | Called on move after pressing element. Since position is extracted from event after this callback is called, you can potentially make changes to event position.<br/><br/> Position is extracted using _getCurrentPosition_ method from `use-long-press.utils.ts`                 |
| onFinish         |            _(event, meta) => void_            | _undefined_ | Called when press is released AFTER _threshold_ time elapses, therefore after long press occurs and _callback_ is called.                                                                                                                                                         |
| onCancel         |            _(event, meta) => void_            | _undefined_ | Called when press is released BEFORE _threshold_ time elapses, therefore before long press could occur.                                                                                                                                                                           |

## Additional callbacks
All callbacks (including main _callback_ function) has same structure.

_Pseudocode_
```
callbackFn(event, meta): void
```
_TypeScript_
```ts
type LongPressCallback<Target extends Element = Element, Context = unknown> = (
  event: LongPressEvent<Target>,
  meta: LongPressCallbackMeta<Context>
) => void
```

As a first argument callback receives event from proper handler (e.g. `onMouseDown`) and as second receives _meta_ object with following structure:

_Pseudocode_
```
{ [context: any], [reason: string] }
```

_TypeScript_
```ts
export type LongPressCallbackMeta<Context = unknown> = { context?: Context; reason?: LongPressCallbackReason };
```

Both object properties are optional.
- `context` will be present if you pass it to _bind_ function. See [context](#context) for more info.
- `reason` will be present in _onCancel_ callback to indicate why long press was cancelled
  - `'cancelled-by-movement'` (TS: `LongPressCallbackReason.CancelledByMovement`) - when _cancelOnMovement_ option is enabled and moved outside specified tolerance
  - `'cancelled-by-release'` (TS: `LongPressCallbackReason.CancelledByRelease`) - when press was released before _threshold_ time elapsed


## Result

As a result hook returns callable function (also referred as `bind`) in order to pass _context_ if necessary.
`bind` function return object with various [handlers](#handlers).

## Context

You can supply custom context to the `bind` function like `bind(context)` and then access it from callbacks (`onStart`, `onFinish`, `onCancel`, `onMove`) second argument e.g.: `onStart: (event, { context }) => ...`.

## Handlers

Handlers are returned from `bind` function in a form of object which can be spread to react element. Contents of this object depend on _detect_ option value:

- `'mouse'`
  - `onMouseDown`
  - `onMouseMove`
  - `onMouseUp`
- `'touch'`
  - `onTouchStart`
  - `onTouchMove`
  - `onTouchEnd`
- `'pointer'`
  - `onPointerDown`
  - `onPointerMove`
  - `onPointerUp`

# Examples

## Advanced usage example
```jsx harmony
import React, { useState, useCallback } from 'react';
import { useLongPress } from 'use-long-press';

export default function AdvancedExample() {
  const [enabled, setEnabled] = useState(true);
  const callback = useCallback(event => {
    alert('Long pressed!');
  }, []);
  const bind = useLongPress(enabled ? callback : null, {
    onStart: event => console.log('Press started'),
    onFinish: event => console.log('Long press finished'),
    onCancel: event => console.log('Press cancelled'),
    onMove: event => console.log('Detected mouse or touch movement'),
    filterEvents: event => true, // All events can potentially trigger long press (same as 'undefined')
    threshold: 500, // In milliseconds
    captureEvent: true, // Event won't get cleared after React finish processing it
    cancelOnMovement: 25, // Square side size (in pixels) inside which movement won't cancel long press
    detect: 'pointer', // Default option
  });

  return (
    <div>
      <button {...bind()}>Press and hold</button>
      <div>
        <label htmlFor="enabled">
          <input type="checkbox" id="enabled" checked={enabled} onChange={() => setEnabled(current => !current)} />
          Hook enabled
        </label>
      </div>
    </div>
  );
}
```

## Live Examples

### Version 1 (deprecated)

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-gnej6?fontsize=14&hidenavigation=1&theme=dark)

### Version 2 (deprecated)

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-v2-ekqecn?fontsize=14&hidenavigation=1&theme=dark)

### Version 3

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-v3-y5m335?fontsize=14&hidenavigation=1&theme=dark)


# Migration

## v1 to v2
### [BREAKING CHANGE] Context support
Now hook returns function which can be called with any context in order to access it in callbacks

*Before*

```tsx
const bind = useLongPress(() => console.log('Long pressed'));
// ...
return <button {...bind}>Click me</button>;
```

*After*
```tsx
const bind = useLongPress((event, { context }) => console.log('Long pressed with', context));
// ...
return <button {...bind('I am context')}>Click me</button>;
// Or just empty function call if you don't want to pass any context
return <button {...bind()}>Click me</button>;
```

### [NEW] Reason for cancellation
Now `onCancel` receives cancellation context which can be either:
- `LongPressEventReason.CANCELED_BY_TIMEOUT` (`'canceled-by-timeout'`)
- `LongPressEventReason.CANCELED_BY_MOVEMENT` (`'canceled-by-movement'`)

You can access it like this:

```tsx
const bind = useLongPress(() => console.log('Long pressed'), {
  onCancel: (event, { reason }) => console.log('Cancellation reason:', reason) 
})
```

## v2 to v3

### [BREAKING CHANGE] Drop support for `'both'` option in `detect` param
Returning both mouse and touch handlers as a hook result caused unintended edge cases on touch devices that emulated clicks. Therefore `'both'` value was removed and hook is now using `'pointer'` as a default value for `detect` param.

This also enables to support more type of events in the future.

Pointer events should be sufficient replacement for `'both'` option, but you can also programmatically detect if current device support touch events and set proper `detect` value based on that.

*Before*
```tsx
const bind = useLongPress(() => console.log('Long pressed'), {
  detect: 'both',
})
```
*After*
```tsx
const bind = useLongPress(() => console.log('Long pressed'), {
  detect: 'pointer',
})
```

### [BREAKING CHANGE] Typings and param values
TypeScript's typings were refactored to use more consistent and precise names. Also changed callback _reason_ values (see `LongPressEventReason`)

- Changed generics order from `useLongPress<Target, Callback, Context>` to `useLongPress<Target, Context, Callback>`
- Renamed `LongPressDetectEvents` enum to `LongPressEventType`
  - `LongPressDetectEvents.MOUSE` -> `LongPressEventType.Mouse`
  - `LongPressDetectEvents.TOUCH` -> `LongPressEventType.Touch`
- Added `LongPressEventType.Pointer`
- Renamed `LongPressEventReason` enum to `LongPressCallbackReason`
  - `LongPressEventReason.CANCELED_BY_MOVEMENT` ('cance**l**ed-by-movement') -> `LongPressCallbackReason.CancelledByMovement` ('cance**ll**ed-by-movement')
  - `LongPressEventReason.CANCELED_BY_TIMEOUT` ('cance**l**ed-by-timeout') -> `LongPressCallbackReason.CancelledByRelease` ('cance**ll**ed-by-release')
- Removed `Coordinates` type
- Renamed `EmptyObject` type to `LongPressEmptyHandlers`
- Renamed `CallableContextResult` type to `LongPressResult`
- Renamed `LongPressResult` type to `LongPressHandlers`
- Added mouse and touch handlers types - `LongPressMouseHandlers` and `LongPressTouchHandlers` 

# Changelog

List of changes made with each version can be found [here](https://github.com/minwork/react/blob/main/packages/use-long-press/CHANGELOG.md)

# FAQ

## Why deprecate v1 and v2 and move to new repo?

### v1 and v2 deprecation
Using both mouse and touch handlers on same element was a good idea at the beginning to enable out of the box support for all device types without the need to manually control which events should be detected. After adding support for pointer events that is no longer necessary because they are better suited to handle this case. 

All tests had to be rewritten because while supporting React 17 and 18, using Enzyme for tests was no longer possible due to the lack of official adapters. Therefore, every test was rewritten to `react-testing-library` and generalised in order to be able to test each type of events (mouse, touch and pointer) without repeating the same code all over again. 

Overall considering the reasons mentioned above, maintaining old versions was no longer a viable option hence why the deprecation. If you want to upgrade from v1 or v2 see [migration guide](#migration).

### Moving to new repository

Old repository structure was causing false positives on package vulnerabilities because of building / testing tools in dev dependencies. New monorepo architecture solves that problem by separating repository package.json from `use-long-press` package.json

Using monorepo is much easier for maintaining multiple packages and I plan to move `use-double-tap` and `react-interval-hook` to this repository as well as add new packages in the future.

# Support us

If you like my work, consider making a [donation](https://github.com/sponsors/minwork) through Github Sponsors.

# License

MIT © [minwork](https://github.com/minwork)
