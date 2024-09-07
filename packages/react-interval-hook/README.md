# React Interval Hook

[![codecov](https://codecov.io/gh/minwork/react/branch/main/graph/badge.svg?token=2KPMMSLDOM)](https://codecov.io/gh/minwork/react)
![npm type definitions](https://img.shields.io/npm/types/react-interval-hook)
![NPM Downloads](https://img.shields.io/npm/dm/react-interval-hook)
[![npm](https://img.shields.io/npm/v/react-interval-hook)](https://www.npmjs.com/package/react-interval-hook)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-interval-hook)

![React Interval Hook](https://raw.githubusercontent.com/minwork/react/main/packages/react-interval-hook/images/react-interval-hook.webp)

> React _self-correcting_ interval hook for precision timing, augmented by management methods

## Main features

-   Self-correcting ([explanation](https://stackoverflow.com/a/29972322/10322539))
-   Manageable (start, stop, isActive)
-   Thoroughly tested

## Installation

```bash
yarn add react-interval-hook
```

or

```bash
npm install --save react-interval-hook
```

# Basic usage

```tsx
import React from 'react'; // No longer necessary in newer React versions
import { useInterval } from 'react-interval-hook';

export const Example = () => {
    useInterval(() => {
        console.log('I am called every second');
    });
    
    return null;
};
```

# Documentation

Full documentation can be found [here](https://minwork.gitbook.io/react-interval-hook/)

# Support

If you like my work, consider making a [donation](https://github.com/sponsors/minwork) through Github Sponsors.

# License

MIT © [minwork](https://github.com/minwork)
