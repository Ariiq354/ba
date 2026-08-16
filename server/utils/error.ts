export async function catchError<T, E = Error>(
  promise: Promise<T>,
): Promise<[E, undefined] | [undefined, T]> {
  return promise
    .then(data => [undefined, data] as [undefined, T])
    .catch((error: E) => [error, undefined] as [E, undefined]);
}
