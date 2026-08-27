import localforage from "localforage";

const deviceStore = localforage.createInstance({
  name: "EGC",
  storeName: "deviceData",
});

const DEVICE_ID_KEY = "deviceId";

// Stable per-install id, generated once and cached locally.
export const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await deviceStore.getItem<string>(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = crypto.randomUUID();
  await deviceStore.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};
