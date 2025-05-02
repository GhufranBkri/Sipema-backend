import axios from "axios";
import {
  ServiceResponse,
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { Pengaduan } from "@prisma/client";
import { getStatusMessage } from "$utils/whatsaapp.utils";
import { PengaduanDTO } from "$entities/Pengaduan";

export type SendMessageResponse = { success: boolean } | {};
// test aja

class WaService {
  private apiUrl: string;
  private token?: string;

  constructor() {
    this.apiUrl =
      process.env.API_URL_WA ||
      "https://app.wanotifier.com/api/v1/notifications/U7atx3kihB?key=pLsUzESipNW7qzpum3u4OjOvH8m7os";
  }
  public async sendMessage(
    to: string,
    data: PengaduanDTO,
    id: string
  ): Promise<ServiceResponse<SendMessageResponse>> {
    const cleanNumber = to.replace(/\D/g, "");
    const formattedNumber = cleanNumber.startsWith("62")
      ? cleanNumber
      : `62${cleanNumber.substring(1)}`;

    // Ensure all values have fallbacks to prevent "missing text value" errors
    const nama = data.nama || "Pelapor";
    // const id = data.id || "ID-UNKNOWN";
    const judul = data.judul || "Tidak ada judul";
    const deskripsi = data.deskripsi || "Tidak ada deskripsi";
    const tanggal = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const datatemplate = {
      data: {
        body_variables: [nama, id, judul, deskripsi, tanggal],
      },
      recipients: [
        {
          whatsapp_number: formattedNumber,
          first_name: nama,
          last_name: "", // Separate last name to prevent undefined
          attributes: {
            id,
            judul: judul,
            deskripsi: deskripsi,
          },
          lists: ["Default"],
          tags: ["new lead", "notification sent"],
          replace: false,
        },
      ],
    };

    try {
      const response = await axios.post(this.apiUrl, datatemplate, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      Logger.info("Message sent successfully:", response.data);
      return {
        status: true,
        data: { success: true },
      };
    } catch (error: any) {
      Logger.error("WhatsApp API Error:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        requestData: JSON.stringify(data, null, 2),
      });
      return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
    }
  }

  public async sendStatusUpdate(
    to: string,
    templateData: Pengaduan
  ): Promise<ServiceResponse<SendMessageResponse>> {
    const data = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: "update_status",
        language: {
          code: "id",
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: templateData.nama },
              { type: "text", text: templateData.id },
              { type: "text", text: getStatusMessage(templateData.status) },
              { type: "text", text: templateData.judul },
              { type: "text", text: templateData.deskripsi },
              {
                type: "text",
                text: new Date(templateData.createdAt).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                ),
              },
              {
                type: "text",
                text: templateData.response || "Laporan Anda sedang diproses",
              },
            ],
          },
        ],
      },
    };

    try {
      const response = await axios.post(this.apiUrl, data, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
      Logger.info("Status update sent successfully:", response.data);
      return {
        status: true,
        data: { success: true },
      };
    } catch (error) {
      Logger.error(`whatsAppService.sendStatusUpdate: ${error}`);
      return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
    }
  }
}

export default WaService;
