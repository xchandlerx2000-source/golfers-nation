const memoryStorage = new Map();
let asyncStorageModulePromise = null;

async function getAsyncStorage() {
  const isReactNativeRuntime = typeof navigator !== "undefined" && navigator.product === "ReactNative";
  if (!isReactNativeRuntime) {
    return null;
  }

  if (!asyncStorageModulePromise) {
    asyncStorageModulePromise = import("@react-native-async-storage/async-storage")
      .then((module) => module.default || module)
      .catch(() => null);
  }

  return asyncStorageModulePromise;
}

export async function readItem(key) {
  const storage = await getAsyncStorage();
  if (!storage?.getItem) {
    return memoryStorage.get(key) ?? null;
  }

  const value = await storage.getItem(key);
  if (value !== null && value !== undefined) {
    memoryStorage.set(key, value);
  }
  return value;
}

export async function writeItem(key, value) {
  memoryStorage.set(key, value);
  const storage = await getAsyncStorage();
  if (storage?.setItem) {
    await storage.setItem(key, value);
  }
}

export async function removeItem(key) {
  memoryStorage.delete(key);
  const storage = await getAsyncStorage();
  if (storage?.removeItem) {
    await storage.removeItem(key);
  }
}

export function readMemoryItem(key) {
  return memoryStorage.get(key) ?? null;
}

export function writeMemoryItem(key, value) {
  memoryStorage.set(key, value);
}

export function removeMemoryItem(key) {
  memoryStorage.delete(key);
}
