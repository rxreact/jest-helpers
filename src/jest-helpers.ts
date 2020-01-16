import { Observable } from "rxjs";
import { shareReplay } from "rxjs/operators";

type Result<T> = OkResult<T> | ErrorResult;

interface OkResult<T> {
  ok: true;
  data: T;
}

interface ErrorResult {
  ok: false;
  message: string;
}

function ok<T>(data: T): OkResult<T> {
  return {
    ok: true,
    data
  };
}

function err(message: string): ErrorResult {
  return {
    ok: false,
    message
  };
}

function isOk<T>(result: OkResult<T> | ErrorResult): result is OkResult<T> {
  return result.ok;
}

/**
 * Subscribe to the given signal,
 * so you can use `expect(signal$).toEmit()` on it later.
 * @param o$ - the observable to watch
 * @returns a hot observable to test against
 */
export const watchSignal = <T>(o$: Observable<T>) => {
  // Share so the signal records all values emitted.
  const hot$ = o$.pipe(shareReplay());

  // Subscribe to the signal so it starts emitting.
  const subscription = hot$.subscribe();

  // Clean up after the test is finished.
  afterEach(() => {
    subscription.unsubscribe();
  });

  // Return the hot signal for testing.
  return hot$;
};

const resolveObservable = <T>(o: Observable<T>): Promise<Result<T>> =>
  new Promise(resolve => {
    const timeout = setTimeout(() => resolve(err("timeout")), 100);

    o.subscribe((value: T) => {
      clearTimeout(timeout);
      resolve(ok(value));
    });
  });

const resolveObservableOnValue = <T>(
  utils: jest.MatcherUtils,
  o: Observable<T>,
  expected: T
): Promise<Result<T>> =>
  new Promise(resolve => {
    const timeout = setTimeout(() => resolve(err("timeout")), 100);

    o.subscribe((value: T) => {
      if (utils.equals(value, expected)) {
        clearTimeout(timeout);
        resolve(ok(value));
      }
    });
  });

/** Test that an observable did (or did not) emit anything */
const toEmit: jest.CustomMatcher = async function toEmit<T>(
  this: jest.MatcherUtils,
  o: Observable<T>
) {
  const result = await resolveObservable(o);

  const pass = isOk(result);

  const message = isOk(result)
    ? () =>
        // This error message will show if `pass === true`,
        // but the user called `.not.toEmit()`
        `${this.utils.matcherHint("toEmit")}\n\n` +
        "Expected signal not to emit\n" +
        `Received: ${this.utils.printReceived(result.data)}`
    : () =>
        // This error message will show if `pass === false`,
        // and the user called `.toEmit()`
        `${this.utils.matcherHint("toEmit")}\n\n` +
        "Expected signal to emit\n" +
        "Signal did not emit";

  return { pass, message };
};

/** Test that an observable did (or did not) emit a specific value */
const toEmitValue: jest.CustomMatcher = async function toEmitValue<T>(
  this: jest.MatcherUtils,
  o: Observable<T>,
  expected: T
) {
  const result = await resolveObservableOnValue(this, o, expected);

  let actual: T | undefined;
  let pass = false;
  let message = "";

  if (isOk(result)) {
    actual = result.data;
    pass = this.equals(result.data, expected);

    message =
      `${this.utils.matcherHint("toEmit")}\n\n` +
      `Expected signal not to emit ${this.utils.printReceived(expected)}\n` +
      `Received: ${this.utils.printReceived(actual)}`;
  } else {
    message =
      `${this.utils.matcherHint("toEmit")}\n\n` +
      `Expected: ${this.utils.printExpected(expected)}\n` +
      `Signal did not emit the expected value`;
  }

  return { actual, pass, message: () => message };
};

expect.extend({ toEmit, toEmitValue });

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toEmit<T>(): Promise<R>;
      toEmitValue<T>(expectedValue: T): Promise<R>;
    }
  }
}
