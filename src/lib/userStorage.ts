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
  status: string;
}

export const saveUserData = async (userData: UserData): Promise<void> => {
  try {
    await userStore.setItem("currentUser", {
      ...userData,
      lastSync: Date.now(),
    });
  } catch (error) {
    // Local cache is a convenience layer; Supabase remains the source of truth.
    console.warn("Failed to save cached user data (local storage may be corrupted):", error);
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  try {
    return await userStore.getItem<UserData>("currentUser");
  } catch (error) {
    console.warn("Failed to read cached user data (local storage may be corrupted):", error);
    return null;
  }
};

export const clearUserData = async (): Promise<void> => {
  try {
    await userStore.removeItem("currentUser");
  } catch (error) {
    console.warn("Failed to clear cached user data (local storage may be corrupted):", error);
  }
};
