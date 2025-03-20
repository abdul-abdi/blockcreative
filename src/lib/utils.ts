/**
 * Recursively transforms BigInt values to strings in an object
 * to make it safe for JSON serialization
 */
export function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result as T;
  }
  
  return obj;
} 