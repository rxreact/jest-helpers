import { Subject, Observable } from "rxjs";

import { watchSignal } from "./jest-helpers";

/**
 * Dummy test
 */
describe("jest helpers", () => {
  const subject$ = new Subject<string>();
  let hot$: Observable<string>;

  beforeEach(() => {
    hot$ = watchSignal(subject$);
  });

  describe("example use", () => {
    it("watches a cold signal", async () => {
      // Hasn't emitted yet
      await expect(hot$).not.toEmit();

      subject$.next("a");

      // Cold subject loses all values
      await expect(subject$).not.toEmitValue("a");
      // Hot watched signal remembers values
      await expect(hot$).toEmitValue("a");
    });

    it("checks for any value emitted", async () => {
      subject$.next("a");
      await expect(hot$).toEmitValue("a");
    });

    it("checks for specific values in a stream", async () => {
      subject$.next("a");
      subject$.next("b");
      subject$.next("c");
      await expect(hot$).toEmitValue("b");
    });

    it("catches missing commits", done => {
      expect(hot$)
        .toEmit()
        .catch(e => {
          expect(e.message).toMatch("Expected signal to emit");
          expect(e.message).toMatch("Signal did not emit");
          done();
        });
    });

    it("catches missing specific values", done => {
      subject$.next("a");

      expect(hot$)
        .toEmitValue("b")
        .catch(e => {
          // jest seems to be returning a unicode version of quotes
          // or something that normal quotes don't match
          expect(e.message).toMatch(/Expected: .+b.+/);
          expect(e.message).toMatch("Signal did not emit the expected value");
          done();
        });
    });

    it("catches unexpected emits", done => {
      subject$.next("a");

      expect(hot$)
        .not.toEmit()
        .catch(e => {
          expect(e.message).toMatch("Expected signal not to emit");
          expect(e.message).toMatch(/Received: .+a.+/);
          done();
        });
    });

    it("catches unexpected values", done => {
      subject$.next("a");

      expect(hot$)
        .not.toEmitValue("a")
        .catch(e => {
          expect(e.message).toMatch(/Expected signal not to emit .+a.+/);
          expect(e.message).toMatch(/Received: .+a.+/);
          done();
        });
    });
  });
});
