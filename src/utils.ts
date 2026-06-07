/**
 * Throws an error if the supplied test is falsy.
 */
export function assert<T>(test: T, message: unknown): asserts test is NonNullable<T> {
  if (test == void 0) {
    throw message
  }
}


