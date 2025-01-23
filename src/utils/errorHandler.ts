// src/utils/errorHandler.ts

import { z } from "zod";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  ServiceResponse,
  BadRequestWithMessage,
  ConflictResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// src/utils/errorHandler.ts

export class ErrorHandler {
  static handleServiceError(error: unknown): ServiceResponse<any> {
    if (error instanceof z.ZodError) {
      return {
        status: false,
        data: {},
        err: {
          message: this.formatZodErrorMessage(error),
          code: 400,
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
      };
    }

    if (error instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    if (error instanceof Error) {
      return this.handleBusinessError(error);
    }

    Logger.error(`Unexpected Error: ${JSON.stringify(error)}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }

  private static formatZodErrorMessage(error: z.ZodError): string {
    return error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
  }

  private static handlePrismaError(
    error: PrismaClientKnownRequestError
  ): ServiceResponse<any> {
    Logger.error(`Database Error: ${error.code} - ${error.message}`);

    switch (error.code) {
      case "P2002":
        return ConflictResponse(`Data ${error?.meta?.target} sudah ada`);
      case "P2025":
        return BadRequestWithMessage("Data tidak ditemukan");
      default:
        return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
    }
  }

  private static handleBusinessError(error: Error): ServiceResponse<any> {
    return BadRequestWithMessage(error.message);
  }
}
