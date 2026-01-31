import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./config";

export const storage = getStorage(app);

export const uploadImage = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteImage = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const uploadBlogImage = async (file, blogId) => {
  const path = `blogs/${blogId}/${Date.now()}_${file.name}`;
  return uploadImage(file, path);
};

export const uploadMangaCover = async (file, mangaId) => {
  const path = `manga/${mangaId}/cover_${Date.now()}`;
  return uploadImage(file, path);
};

export const uploadUserAvatar = async (file, userId) => {
  const path = `users/${userId}/avatar_${Date.now()}`;
  return uploadImage(file, path);
};
