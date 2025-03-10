//fungsi untuk upload

import { createUploadErrorResponse, ServiceResponse } from "$entities/Service";
import { UploadResponse } from "$entities/UploadFile";
import Logger from "$pkg/logger";
import cloudinary from "$utils/cloudinary.utils";

export async function uploadFile(
  file: any
): Promise<ServiceResponse<UploadResponse>> {
  try {
    // Handle different file upload formats without relying on File constructor
    let mimeType: string;
    let fileName: string;
    let fileData = file;

    // Check if we're dealing with a Hono-like file structure
    if (file.file) {
      fileData = file.file;
    }

    // Determine file properties based on available fields
    mimeType = fileData.type || file.mimetype || "application/octet-stream";
    fileName = fileData.name || file.originalname || `file_${Date.now()}`;

    // Debug file object
    Logger.info("File object:", {
      type: mimeType,
      size: fileData.size,
      name: fileName,
    });

    // Determine upload path based on available properties
    let uploadPath;
    if (file.tempFilePath) {
      uploadPath = file.tempFilePath;
    } else if (fileData.arrayBuffer) {
      // Handle Blob-like objects with arrayBuffer method
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      uploadPath = `data:${mimeType};base64,${buffer.toString("base64")}`;
    } else if (file.buffer) {
      // Handle Express-like multipart file uploads
      uploadPath = `data:${mimeType};base64,${file.buffer.toString("base64")}`;
    } else if (file.path) {
      // Handle file path
      uploadPath = file.path;
    } else {
      throw new Error("Unsupported file format");
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(uploadPath, {
      folder: "UploadFile",
      public_id: `file_${Date.now()}`,
      resource_type: "auto",
    });

    return {
      status: true,
      data: {
        secure_url: result.secure_url,
        public_id: result.public_id,
      },
    };
  } catch (err) {
    Logger.error(`UploadService.uploadFile: ${err}`);
    return createUploadErrorResponse(
      err instanceof Error ? err.message : "Failed to upload file"
    );
  }
}
