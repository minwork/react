# :watch: React Interval Hook

> React hook for using **self-correcting** `setInterval`, augmented by management methods (start, stop, isActive)

[![Build Status](https://travis-ci.org/minwork/react-interval-hook.svg?branch=master)](https://travis-ci.org/minwork/react-interval-hook)
[![codecov](https://codecov.io/gh/minwork/react-interval-hook/branch/master/graph/badge.svg)](https://codecov.io/gh/minwork/react-interval-hook)
![npm type definitions](https://img.shields.io/npm/types/react-interval-hook)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-interval-hook)](https://bundlephobia.com/result?p=react-interval-hook)
[![npm](https://img.shields.io/npm/v/react-interval-hook)](https://www.npmjs.com/package/react-interval-hook)
[![GitHub](https://img.shields.io/github/license/minwork/react-interval-hook)](https://github.com/minwork/react-interval-hook/blob/master/LICENSE)

-   Self-correcting ([explanation](https://stackoverflow.com/a/29972322/10322539))
-   Manageable (start, stop, isActive)
-   Thoroughly tested

## Install

```bash
yarn add react-interval-hook
```

or

```bash
npm install --save react-interval-hook
```

## Basic Usage

```typescript jsx
import React from 'react';
import { useInterval } from 'react-interval-hook';

const Example = () => {
    useInterval(() => {
        console.log('I am called every second');
    });
};
```

## Advanced usage

Hook can accept various config option as well as return methods that allow you to control it behaviour.

### Definition

```
useInterval(callback [, intervalMs] [, options]): { start, stop, isActive }
```

### Example

[![Edit react-interval-hook](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-interval-hook-bi0kx?fontsize=14&hidenavigation=1&theme=dark)

```typescript jsx
import React, { useState } from 'react';
import { useInterval } from 'react-interval-hook';

const AdvancedExample = () => {
    const { start, stop, isActive } = useInterval(
        () => {
            console.log('Callback every 500 ms');
        },
        500,
        {
            autoStart: false,
            immediate: false,
            selfCorrecting: false,
            onFinish: () => {
                console.log('Callback when timer is stopped');
            },
        }
    );
    const [active, setActive] = useState(isActive());
    const [triggerFinishCallback, setTriggerFinishCallback] = useState(true);

    return (
        <div>
            <button type="button" onClick={start} id="start">
                Start
            </button>
            <button type="button" onClick={() => stop(triggerFinishCallback)} id="stop">
                Stop
            </button>
            <button type="button" onClick={() => setActive(isActive())} id="checkActive">
                Check active
            </button>
            <div id="active">Active: {active ? 1 : 0}</div>
            <div>
                <label htmlFor="trigger-finish-callback">
                    <input
                        id="trigger-finish-callback"
                        type="checkbox"
                        defaultChecked={triggerFinishCallback}
                        onChange={() => setTriggerFinishCallback(current => !current)}
                    />
                    Trigger finish callback
                </label>
            </div>
        </div>
    );
};
```

### Options

| Name        |   Type   | Default  | Description                                                                                                                                                           |
| ----------- | :------: | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| autoStart   | boolean  |   true   | Start interval timer right after component is mounted                                                                                                                 |
| immediate   | boolean  |  false   | Trigger _callback_ immediately after timer is started                                                                                                                 |
| selfCorrecting | boolean  |   true   | Self correct time intervals between subsequent _callback_ invocations to reflect actual time elapsed (setInterval and setTimeout are not accurate and tend to drift). |
| onFinish    | Function | () => {} | Called after timer is stopped (by _stop_ method or component unmount)                                                                                                 |

### Management methods

`useInterval` hook return object with various management methods

| Name     | Arguments                                                                     | Return  | Description                                                                                        |
| -------- | ----------------------------------------------------------------------------- | :-----: | -------------------------------------------------------------------------------------------------- |
| start    | None                                                                          |  void   | Starts timer when _autoStart_ is set to `false` or after timer was stopped using _stop_ method     |
| stop     | [optional]&nbsp;triggerFinishCallback<br/>- Type: boolean<br/>- Default: true |  void   | Stops timer (**not pause**) after it was started using either _autoStart_ option or _start_ method |
| isActive | None                                                                          | boolean | Return current timer status - is it running or not                                                 |

## License

MIT © [minwork](https://github.com/minwork)
