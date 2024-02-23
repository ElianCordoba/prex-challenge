export async function exec<T>(
  promise: Promise<T>,
): Promise<[T, undefined] | [T, any]> {
  try {
    const result = await promise;
    return [result, undefined];
  } catch (error) {
    return [undefined!, error];
  }
}
