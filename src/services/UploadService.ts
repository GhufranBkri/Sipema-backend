//fungsi untuk upload

import { createUploadErrorResponse, ServiceResponse } from "$entities/Service";
import { UploadResponse } from "$entities/UploadFile";
import Logger from "$pkg/logger";
import cloudinary from "$utils/cloudinary.utils";
import { ALLOWED_FORMATS, MAX_FILE_SIZE } from "$utils/format.utils";
import { UploadApiOptions, UploadApiResponse } from "cloudinary";

export async function uploadFile(
  file: any
): Promise<ServiceResponse<UploadResponse>> {
  try {
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

    // Validate file format
    if (!ALLOWED_FORMATS.includes(mimeType)) {
      throw new Error(
        `Unsupported file type. Allowed formats: ${ALLOWED_FORMATS.join(", ")}`
      );
    }

    // Validate file size
    const fileSize = fileData.size || file.size;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File size too large. Maximum size allowed is ${
          MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
    }
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

    // Upload to cloudinary with format-specific options
    const uploadOptions: UploadApiOptions = {
      folder: "UploadFile",
      public_id: `file_${Date.now()}`,
      resource_type: "auto" as const, // Type assertion to fix resource_type error
    };

    // Add PDF-specific options if the file is a PDF
    if (mimeType === "application/pdf") {
      Object.assign(uploadOptions, {
        resource_type: "raw",
        format: "pdf",
        use_filename: true,
        unique_filename: true,
      });
    }

    const result: UploadApiResponse = await cloudinary.uploader.upload(
      uploadPath,
      uploadOptions,
      (pages) => true
    );

    return {
      status: true,
      data: {
        secure_url: result.secure_url,
        public_id: result.public_id,
        // Remove format from response since it's not in UploadResponse type
        size: fileSize,
      },
    };
  } catch (err) {
    Logger.error(`UploadService.uploadFile: ${err}`);
    return createUploadErrorResponse(
      err instanceof Error ? err.message : "Failed to upload file"
    );
  }
}
