import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFileToStorage(file, folder = 'uploads') {
  if (!file) {
    throw new Error('No file selected');
  }

  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}