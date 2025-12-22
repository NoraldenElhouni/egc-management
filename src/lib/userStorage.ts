import localforage from "localforage";

const userStore = localforage.createInstance({
  name: "EGC",
  storeName: "userData",
});

export interface UserData {
  id: string;
  name: string;
  role: string;
  email?: string;
  lastSync?: number;
  first_login: boolean;
}

export const saveUserData = async (userData: UserData): Promise<void> => {
  await userStore.setItem("currentUser", {
    ...userData,
    lastSync: Date.now(),
  });
};

export const getUserData = async (): Promise<UserData | null> => {
  return await userStore.getItem<UserData>("currentUser");
};

export const clearUserData = async (): Promise<void> => {
  await userStore.removeItem("currentUser");
};
