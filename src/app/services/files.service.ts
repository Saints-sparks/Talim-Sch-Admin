import { API_ENDPOINTS } from "../lib/api/config";

interface UploadResponse {
  url?: string;
  message?: string;
  error?: string;
}

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

const uploadWithProgress = (
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.withCredentials = true;

    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      let payload: UploadResponse = {};
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        payload = {};
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload.url) {
        resolve(payload.url);
        return;
      }

      reject(
        new Error(
          payload.message ||
            payload.error ||
            `Upload failed with status ${xhr.status}`
        )
      );
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading attachment"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error("Attachment upload timed out"));
    });

    xhr.timeout = 120000;
    xhr.send(formData);
  });
};

export const uploadImage = async (
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> => uploadWithProgress(API_ENDPOINTS.UPLOAD_IMAGE, imageFile, onProgress);

export const uploadFileAttachment = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => uploadWithProgress(API_ENDPOINTS.UPLOAD_FILE, file, onProgress);
