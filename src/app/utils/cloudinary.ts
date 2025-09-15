/**
 * Cloudinary image upload utility
 */

// Cloudinary configuration
const CLOUD_NAME = "ddbs7m7nt";
const UPLOAD_PRESET = "presetOne";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface CloudinaryError {
  error: {
    message: string;
  };
}

/**
 * Upload an image file to Cloudinary
 * @param file - The image file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to the uploaded image URL or rejecting with error
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      reject(new Error("File must be an image"));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error("File size must be less than 10MB"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("cloud_name", CLOUD_NAME);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response: CloudinaryUploadResponse = JSON.parse(
            xhr.responseText
          );
          resolve(response.secure_url);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const errorResponse: CloudinaryError = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error.message || "Upload failed"));
        } catch (error) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error("Upload timeout"));
    });

    // Set timeout to 30 seconds
    xhr.timeout = 30000;

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    );
    xhr.send(formData);
  });
};

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of image files to upload
 * @param onProgress - Optional progress callback for each file
 * @returns Promise resolving to array of uploaded image URLs
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> => {
  const uploadPromises = files.map((file, index) =>
    uploadToCloudinary(
      file,
      onProgress ? (progress) => onProgress(index, progress) : undefined
    )
  );

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw error;
  }
};

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Validation result with success status and error message
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type must be JPEG, PNG, GIF, or WebP" };
  }

  return { valid: true };
};
