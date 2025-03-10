//fungsi untuk upload

import { createUploadErrorResponse, ServiceResponse } from "$entities/Service";
import { UploadResponse } from "$entities/UploadFile";
import Logger from "$pkg/logger";
import cloudinary from "$utils/cloudinary.utils";

export async function uploadFile(
  file: any
): Promise<ServiceResponse<UploadResponse>> {
  try {
    // Handle Hono file upload format
    const fileData = file instanceof File ? file : file.file;
    const mimeType = fileData.type || file.mimetype;
    const fileName = fileData.name || file.originalname;

    // Debug file object
    Logger.info("File object:", {
      type: mimeType,
      size: fileData.size,
      name: fileName,
    });

    // Convert file to buffer if needed
    let uploadPath;
    if (file.tempFilePath) {
      uploadPath = file.tempFilePath;
    } else if (fileData instanceof File) {
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      uploadPath = `data:${mimeType};base64,${buffer.toString("base64")}`;
    } else {
      uploadPath = file.path;
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
