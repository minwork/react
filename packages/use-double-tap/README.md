# :point_up_2: React Double Tap Hook :point_up_2:

> React hook for handling double tap on mobile devices

![Travis (.org)](https://img.shields.io/travis/minwork/use-double-tap)
![Codecov](https://img.shields.io/codecov/c/gh/minwork/use-double-tap)
![npm type definitions](https://img.shields.io/npm/types/use-double-tap)
![npm bundle size](https://img.shields.io/bundlephobia/min/use-double-tap)
![npm](https://img.shields.io/npm/v/use-double-tap)
![GitHub](https://img.shields.io/github/license/minwork/use-double-tap)
## Install

```bash
npm install --save use-double-tap
```
or
```bash
yarn add use-double-tap
```

## Basic Usage

```javascript
import React from 'react';

import { useDoubleTap } from 'use-double-tap';

const Example = () => {
    const bind = useDoubleTap((event) => {
      // Your action here
      console.log('Double tapped');
    });

    return <button {...bind}>Tap me</button>;
}

export default Example;
```

**[Live demo](https://codesandbox.io/s/usedoubletap-d2exl)**

## Advanced usage
### Custom capture threshold
You can also manually specify time threshold for capturing double tap event (default: 300ms).
```javascript
useDoubleTap(() => {
  // Your action here
}, 500);
```
In the example above, second tap must occur within 500ms period to register double tap.

### Additional options
Supplied as third argument.
```typescript
useDoubleTap(() => {
  // Actions on double tap
}, 300, {
  // Options here
})
```

List of possible options:

| Option        | Type            | Description  |
| ------------- |:---------------:| -----|
| onSingleTap   | Function | Callback for handling case when double tap is not triggered,<br> because of capture timeout.<br><br>For example if `threshold` parameter is *300ms* and second tap occurs after *400ms*<br> then `onSingleTap` is triggered **after** capture interval (*300ms*) expires. |

### Disable event binding
If you pass falsy value as callback (like `null`) double tap will not bind to the component.
```javascript
useDoubleTap(null);
```
This allows you to dynamically control if event should be bound. For example:

```javascript
const bind = useDoubleTap(isMobile ? () => {
  console.log('Double tapped');
} : null);
```

## :warning: Warning
This hook internally use `onClick` event to detect double tap, so be careful not to override your existing event listener.

This is where disabling listener binding may come handy - you can use double tap detection only when necessary.

## Why `onClick`?
Because it leverages built in event listener which can also detect mobile tap event.

This way we can get rid of complicated edge cases when combining `onTouchStart onTouchEnd onTouchCancel onTouchMove` events.

Also this approach greatly reduce package size as well as increase speed and flexibility.

## License

MIT © [minwork](https://github.com/minwork)
