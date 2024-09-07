# React Double Tap Hook


[![codecov](https://codecov.io/gh/minwork/react/branch/main/graph/badge.svg?token=2KPMMSLDOM)](https://codecov.io/gh/minwork/react)
![npm type definitions](https://img.shields.io/npm/types/use-double-tap)
![NPM Downloads](https://img.shields.io/npm/dm/use-double-tap)
![npm](https://img.shields.io/npm/v/use-double-tap)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/use-double-tap)

![React Double Tap Hook](https://raw.githubusercontent.com/minwork/react/main/packages/use-double-tap/images/react-double-tap-hook.webp)

> React hook for handling double tap on mobile devices

# Main features
- Detect double tap on mobile devices
- Adjustable detection threshold
- Callback for single tap

# Installation

```bash
yarn add use-double-tap
```
or
```bash
npm install --save use-double-tap
```

# Basic usage

```tsx
import React from 'react'; // No longer necessary in newer React versions
import { useDoubleTap } from 'use-double-tap';

export const Example = () => {
    const bind = useDoubleTap((event) => {
      // Your action here
      console.log('Double tapped');
    });

    return <button {...bind}>Tap me</button>;
}
```

# Documentation

Full documentation can be found [here](https://minwork.gitbook.io/double-tap-hook/)

# Support

If you like my work, consider making a [donation](https://github.com/sponsors/minwork) through Github Sponsors.

# License

MIT © [minwork](https://github.com/minwork)
