## [3.0.0-alpha.5](https://github.com/minwork/react/compare/use-long-press-v3.0.0-alpha.4...use-long-press-v3.0.0-alpha.5) (2023-04-17)


### Features

* **use-long-press:** Handle when mouse / touch / pointer is released outside element ([9e7381c](https://github.com/minwork/react/commit/9e7381c5082ab78b9e0d6f0e17b3331f496d31d8))

## [3.0.0-alpha.4](https://github.com/minwork/react/compare/use-long-press-v3.0.0-alpha.3...use-long-press-v3.0.0-alpha.4) (2023-04-17)


### Features

* **use-long-press:** Add support for PointerEvents ([ac315ec](https://github.com/minwork/react/commit/ac315ec56e8522c502ab39d02f47fce4219acc1b))


### Build config

* **use-long-press:** Create command for releasing use-long-press ([8c9d58e](https://github.com/minwork/react/commit/8c9d58ebf3a160c2d497897bfb7fbb0c501c5778))


### Refactors

* **use-long-press:** Change LongPressEventType enum key from upper case to sentence case ([c82f530](https://github.com/minwork/react/commit/c82f53012ed5714a15a839cfd5c64843bf563f37))

## [3.0.0-alpha.3](https://github.com/minwork/react/compare/use-long-press-v3.0.0-alpha.2...use-long-press-v3.0.0-alpha.3) (2023-04-15)


### Features

* **npm-publish:** Add npm-publish lib for publishing packages to npm using otp ([1de0c3c](https://github.com/minwork/react/commit/1de0c3c4dabbd0b25f8d50f3d2acf819d9f16099))


### Refactors

* **use-long-press:** Rename cancellation reason enum value ([3bc6f76](https://github.com/minwork/react/commit/3bc6f765aa2b3553f7810de80b8ef05061c5b24f))

## [3.0.0-alpha.3](https://github.com/minwork/react/compare/use-long-press-v3.0.0-alpha.2...use-long-press-v3.0.0-alpha.3) (2023-04-15)


### Refactors

* **use-long-press:** Rename cancellation reason enum value ([3bc6f76](https://github.com/minwork/react/commit/3bc6f765aa2b3553f7810de80b8ef05061c5b24f))

## [3.0.0-alpha.2](https://github.com/minwork/react/compare/use-long-press-v3.0.0-alpha.1...use-long-press-v3.0.0-alpha.2) (2023-04-14)


### Bug Fixes

* **use-long-press:** Fix util functions typings ([e6f7fc2](https://github.com/minwork/react/commit/e6f7fc2bd7b20a07e18660b46a4560a2377f617d))


### Build config

* **project:** [react-2] Add GitHub actions for PRs and Releases ([8130f2b](https://github.com/minwork/react/commit/8130f2b6a0c851f013f2a10dc45ed962c0dd9f55))

## [3.0.0-alpha.1](https://github.com/minwork/react/compare/use-long-press-v2.0.3...use-long-press-v3.0.0-alpha.1) (2023-04-12)


### ⚠ BREAKING CHANGES

* **use-long-press:** Hook option detect: 'both' was dropped because of edge cases it produces.
Detect option is using 'mouse' as a default instead.
Changed enum names and 'reason' enum values. Changed type names to be more consistent.

### Bug Fixes

* **use-long-press:** Bring back 100% code coverage ([40d6f8d](https://github.com/minwork/react/commit/40d6f8d8eb7357826411167b365b22b287e07c60))
* **use-long-press:** Fix lint errors ([11b7f2c](https://github.com/minwork/react/commit/11b7f2cb48df32c586c3566f87e366c81d0d0f7e))


### Chores

* **project:** Add commit linting ([8948367](https://github.com/minwork/react/commit/894836741f236d9f516dbe1df8cb401f426fb944))
* **project:** Migrate use-long-press to this repository ([b028e43](https://github.com/minwork/react/commit/b028e4399e77b04c0777ba2fe3ff4441cb5deaa2))


### Refactors

* **use-long-press:** Drop detect 'both' support, refactor typings, documentation and tests ([e806b55](https://github.com/minwork/react/commit/e806b55657574a2ea2068b2ac6881371427dc698))
* **use-long-press:** Migrate all tests from enzyme to react-testing-library ([9cc17aa](https://github.com/minwork/react/commit/9cc17aa5361a67a2e48226b60f80ff467fdd6e7e))


### Build config

* **use-long-press:** Improve and fix release pipeline ([14e2893](https://github.com/minwork/react/commit/14e28930fbe2eca2dff0aad187ec6178adf027b1))
* **use-long-press:** Setup semantic release automation ([43b8fde](https://github.com/minwork/react/commit/43b8fde88ccd76c37804e2dde84dedc08b9bd98b))
* **use-long-press:** Update release config to modify package.json version ([b5a057e](https://github.com/minwork/react/commit/b5a057e5ae51bbce7a3c25cf72ab1750bb3a5208))
