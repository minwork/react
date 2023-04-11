# React Long Press Hook :point_down:

> React hook for detecting click (or tap) and hold event.

[![Build Status](https://travis-ci.com/minwork/use-long-press.svg?branch=master)](https://travis-ci.com/minwork/use-long-press)
![Codecov](https://img.shields.io/codecov/c/gh/minwork/use-long-press)
![npm type definitions](https://img.shields.io/npm/types/use-long-press)
![npm bundle size](https://img.shields.io/bundlephobia/min/use-long-press)
[![npm](https://img.shields.io/npm/v/use-long-press)](https://www.npmjs.com/package/use-long-press)
[![Github Stars](https://img.shields.io/github/stars/minwork/use-long-press?style=social)](https://github.com/minwork/use-long-press)

- Easy to use
- Highly customizable options
- Thoroughly tested

# Table of Contents
1. [Installation](#installation)
2. [Live Examples](#live-examples)
3. [Basic Usage](#basic-usage)
4. [Advanced Usage](#advanced-usage) 
   1. [Definition](#definition)
   2. [Options](#options)
   3. [Example](#example)
5. [Migration](#migration)
   1. [v1 to v2](#v1-to-v2)
6. [License](#license)

## Installation

```bash
yarn add use-long-press
```

or

```bash
npm install --save use-long-press
```

## Basic Usage

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

## Live Examples

### Version 1

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-gnej6?fontsize=14&hidenavigation=1&theme=dark)

### Version 2

[![Edit useLongPress](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/uselongpress-v2-ekqecn?fontsize=14&hidenavigation=1&theme=dark)

### Version 3

_Coming soon..._

## Advanced usage

Hook first parameter, _callback_, can be either function or `null` (if you want to disable the hook).

Additionally, you can supply _options_ object as a second parameter.

As a result hook returns object with various handlers (depending on _detect_ option), which can be spread to some element.

You can supply custom context to the `bind` function like `bind(context)` and then access it from callbacks (`onStart`, `onFinish`, `onCancel`, `onMove`) second argument e.g.: `onStart: (event, { context }) => ...`.

### Definition

```
useLongPress(callback [, options]): handlers
```

### Options

Long press hook can be adjusted using options object, which allow you to fit it to your needs.

| Name             |                    Type                    |  Default  | Description                                                                                                                                                                                                                                                                                               |
|------------------|:------------------------------------------:|:---------:|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| threshold        |                   number                   |    400    | Time user need to hold click or tap before long press _callback_ is triggered                                                                                                                                                                                                                             |
| captureEvent     |                  boolean                   |   false   | If React MouseEvent (or TouchEvent) should be supplied as first argument to callbacks                                                                                                                                                                                                                     |
| detect           | Enum('mouse' &#x7c; 'touch' &#x7c; 'both') |  'both'   | Which event handlers should be returned in `bind` object. In TS this enum is accessible through `LongPressDetectEvents`                                                                                                                                                                                   |
| cancelOnMovement |           boolean &#x7c; number            |   false   | If long press should be cancelled when detected movement while pressing. Use _boolean_ value to turn it on / off or _number_ value to specify move tolerance in pixels.<br><br>For more information on how this prop work check JSDoc.                                                                    |
| filterEvents     |             (event) => boolean             | undefined | If provided, it gives you the ability to ignore long press detection on specified conditions (for example on right mouse click). <br><br>When function returns `false`, it will prevent ANY callbacks from triggering (including _onStart_ and _onCancel_) as well as capturing event.                    |
| onStart          |                  Function                  | undefined | Called when element is initially pressed (before starting timer which detects long press).<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`.                                                                                                                             |
| onFinish         |                  Function                  | undefined | Called when press is released (after triggering _callback_).<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`.                                                                                                                                                           |
| onCancel         |                  Function                  | undefined | Called when press is released before _threshold_ time elapses, therefore before long press occurs.<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`. You can obtain reason for cancellation from a second callback argument e.g.: `onCancel: (event, { reason }) => ...` |
| onMove           |                  Function                  | undefined | Handler for `onTouchMove` and `onMouseMove` props, also allowing to make some operations on event before triggering _cancelOnMovement_.<br><br>Can accept mouse or touch event if _captureEvents_ option is set to `true`.                                                                                |

### Example

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
    filterEvents: event => true, // All events can potentially trigger long press
    threshold: 500,
    captureEvent: true,
    cancelOnMovement: false,
    detect: 'both',
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

## Migration

### v1 to v2
#### [BREAKING CHANGE] Context support
Now hook returns function which can be called with any context in order to access it in callbacks

*Before*

```typescript jsx
const bind = useLongPress(() => console.log('Long pressed'));
// ...
return <button {...bind}>Click me</button>;
```

*After*
```typescript jsx
const bind = useLongPress((event, { context }) => console.log('Long pressed with', context));
// ...
return <button {...bind('I am context')}>Click me</button>;
// Or just empty function call if you don't want to pass any context
return <button {...bind()}>Click me</button>;
```

#### [NEW] Reason for cancellation
Now `onCancel` receives cancellation context which can be either:
- `LongPressEventReason.CANCELED_BY_TIMEOUT` (`'canceled-by-timeout'`)
- `LongPressEventReason.CANCELED_BY_MOVEMENT` (`'canceled-by-movement'`)

You can access it like this:

```typescript jsx
import { useLongPress } from "./use-long-press";

const bind = useLongPress(() => console.log('Long pressed'), {
  onCancel: (event, { reason }) => console.log('Cancellation reason:', reason) 
})
```

### v2 to v3

_Coming soon..._

## License

MIT © [minwork](https://github.com/minwork)
