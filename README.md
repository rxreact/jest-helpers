# RxReact/Jest Helpers

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/rxreact/jest-helpers.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.com/rxreact/jest-helpers.svg?branch=master)](https://travis-ci.com/rxreact/jest-helpers)
[![Coverage Status](https://coveralls.io/repos/github/rxreact/jest-helpers/badge.svg?branch=master)](https://coveralls.io/github/rxreact/jest-helpers?branch=master)

Development Sponsored By:  
[![Carbon Five](./assets/C5_final_logo_horiz.png)](http://www.carbonfive.com)

RxReact/Jest Helpers are simple tools for testing RxJS observables. This can be useful any project, not just React.

[Typedocs for Jest Helpers](https://rxreact.github.io/jest-helpers/)

## Installation

In your project:

```bash
npm install @rxreact/jest-helpers --save
```

or

```bash
yarn add @rxreact/jest-helpers
```

RxJS and Jest are peer dependencies and need to be installed separately.

Then import the library:

```typescript
import { watchSignal } from "@rxreact/jest-helpers";
```

## Basic Usage

This library adds a function for making an observable hot, and adds two matchers to Jest to checking if an observable has emitted a value.

If you have used `expect(jest.fn()).toHaveBeenCalled()` and `expect(jest.fn()).toHaveBeenCalledWith(value)`, these helpers should feel familiar.

### Checking if a observable emitted

To check if an observable emitted any value:

```typescript
await expect(of("a")).toEmit();
```

### Checking if a observable emitted a specific value

```typescript
await expect(of("a")).toEmitValue("a");
```

### Checking that a observable did not emit anything

```typescript
await expect(never()).not.toEmit();
```

### Checking that a observable did not emit a specific value

```typescript
await expect(of("a")).not.toEmitValue("b");
```

### Watching a cold observable

Often observables are cold - they will forget any values they might have emitted before something subscribes to them. To get around this, you can use `watchSignal` to get a hot version of the observable with `shareReplay`, which will record everything the observable emits.

`watchSignal` cleans up after itself after every test to prevent memory leaks. So, make sure to only call `watchSignal` in a `beforeEach` or a test body.

```typescript
import { Subject } from "rxjs";
import { watchSignal } from "./jest-helpers";

it("watches a cold signal", async () => {
  const subject$ = new Subject<string>();
  const hot$ = watchSignal(subject$);

  // Hasn't emitted yet
  await expect(hot$).not.toEmit();

  // Make subject$ emit a value.
  subject$.next("a");

  // A cold subject loses all values.
  await expect(subject$).not.toEmitValue("a");

  // A hot watched signal remembers values.
  await expect(hot$).toEmitValue("a");
});
```

### Loading the library

To use the `expect(observable$).toEmit()` and `expect(observable$).toEmitValue(value)` functions in your test, you must import the library in the test file.

If you need `watchSignal` (and you probably will), simply importing it will do the job:

```typescript
import { watchSignal } from "@rxreact/jest-helpers";
```

If you have a test that only tests hot signals, you will still need to import the library to you test file to get the jest extensions:

```typescript
import "@rxreact/jest-helpers";
```

### Awaiting Expectations

`.toEmit()` / `toEitValue()` work by waiting 100 ms for the observable to emit, to account for asynchronous observables. So you must `await` every expectation, to make sure you catch failures:

```typescript
await expect(o$).toEmit();
```
