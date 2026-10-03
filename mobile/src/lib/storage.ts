import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[storage] save failed for", key, e);
  }
}

export const KEYS = {
  settings: "ten4.settings.v1",
  dictionary: "ten4.dictionary.v1",
  system: "ten4.system.v1",
};
