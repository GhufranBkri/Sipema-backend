export interface UploadResponse {
  secure_url: string;
  public_id: string;
  size: number;
  // Add format if you need it in the response
  format?: string;
}
