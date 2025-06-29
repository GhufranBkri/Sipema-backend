// PengaduanMasyarakatValidation.ts
import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";
// import { PengaduanMasyarakatDTO } from '$entities/PengaduanMasyarakat'
import { prisma } from "$utils/prisma.utils";

export async function validatePengaduanMasyarakatDTO(c: Context, next: Next) {
  const data = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  // Form fields validation
  if (!data.deskripsi)
    invalidFields.push(generateErrorStructure("deskripsi", "cannot be empty"));
  if (!data.judul)
    invalidFields.push(generateErrorStructure("judul", "cannot be empty"));
  if (!data.NIK)
    invalidFields.push(generateErrorStructure("NIK", "cannot be empty"));
  if (!data.unitId)
    invalidFields.push(generateErrorStructure("unitId", "cannot be empty"));
  if (!data.kategoriId)
    invalidFields.push(generateErrorStructure("kategoriId", "cannot be empty"));
  if (!data.nama)
    invalidFields.push(generateErrorStructure("nama", "cannot be empty"));
  if (!data.unitId)
    invalidFields.push(generateErrorStructure("unitId", "cannot be empty"));
  if (!data.no_telphone)
    invalidFields.push(
      generateErrorStructure("no_telphone", "cannot be empty")
    );

  // Character length validation
  if (data.judul && String(data.judul).length > 50) {
    invalidFields.push(
      generateErrorStructure("judul", "cannot exceed 50 characters")
    );
  }

  if (data.deskripsi && String(data.deskripsi).length > 150) {
    invalidFields.push(
      generateErrorStructure("deskripsi", "cannot exceed 150 characters")
    );
  }

  if (data.harapan_pelapor && String(data.harapan_pelapor).length > 100) {
    invalidFields.push(
      generateErrorStructure("harapan_pelapor", "cannot exceed 100 characters")
    );
  }

  // NIK format validation
  if (data.NIK) {
    const nikValidationResult = validateNIKFormat(String(data.NIK));
    if (!nikValidationResult.isValid) {
      invalidFields.push(
        generateErrorStructure("NIK", nikValidationResult.message)
      );
    }
  }

  // Phone number validation
  if (data.no_telphone) {
    const phoneValidationResult = validatePhoneNumber(String(data.no_telphone));
    if (!phoneValidationResult.isValid) {
      invalidFields.push(
        generateErrorStructure("no_telphone", phoneValidationResult.message)
      );
    }
  }

  // Optimized parallel validation queries
  const validationPromises: Promise<any>[] = [];

  // Add kategori validation to parallel queries
  if (data.kategoriId) {
    validationPromises.push(
      prisma.kategori.findUnique({
        where: { id: String(data.kategoriId) },
        select: { id: true }, // Only select what we need
      })
    );
  }

  // Add unit validation to parallel queries
  if (data.unitId) {
    validationPromises.push(
      prisma.unit.findUnique({
        where: { id: String(data.unitId) },
        select: { id: true }, // Only select what we need
      })
    );
  }

  // Single optimized query for all pengaduan-related checks
  if (data.NIK) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    validationPromises.push(
      prisma.pengaduan.findMany({
        where: {
          OR: [
            // Check for exact duplicates
            data.judul && data.deskripsi && data.kategoriId
              ? {
                  AND: [
                    { judul: String(data.judul) },
                    { deskripsi: String(data.deskripsi) },
                    { unitId: String(data.unitId) },
                    { kategoriId: String(data.kategoriId) },
                    { nama: String(data.nama) },
                  ],
                }
              : {},
            // Check for spam and similar reports
            {
              NIK: String(data.NIK),
              createdAt: {
                gte: twentyFourHoursAgo,
              },
            },
          ],
        },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          unitId: true,
          kategoriId: true,
          nama: true,
          NIK: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );
  }

  // Execute all queries in parallel
  const results = await Promise.all(validationPromises);

  let resultIndex = 0;

  // Process kategori validation result
  if (data.kategoriId) {
    const kategori = results[resultIndex++];
    if (!kategori) {
      invalidFields.push(
        generateErrorStructure("kategoriId", "is not valid. Category not found")
      );
    }
  }

  // Process unit validation result
  if (data.unitId) {
    const unit = results[resultIndex++];
    if (!unit) {
      invalidFields.push(
        generateErrorStructure("unitId", "is not valid. Unit not found")
      );
    }
  }

  // Process pengaduan-related validation results
  if (data.NIK) {
    const reports = results[resultIndex++] as any[];

    // Check for exact duplicates
    const exactDuplicate = reports.find(
      (report) =>
        report.judul === String(data.judul) &&
        report.deskripsi === String(data.deskripsi) &&
        report.unitId === String(data.unitId) &&
        report.kategoriId === String(data.kategoriId) &&
        report.nama === String(data.nama)
    );

    if (exactDuplicate) {
      invalidFields.push(
        generateErrorStructure("report", "duplicate report found")
      );
    }

    // Filter reports from the same NIK in last 24 hours
    const userReports = reports.filter(
      (report) => report.NIK === String(data.NIK)
    );

    // Check for similar titles (optimized)
    if (data.judul && userReports.length > 0) {
      const currentTitle = String(data.judul).toLowerCase().trim();

      // Use a more efficient similarity check
      const hasSimilarTitle = userReports.some((report) => {
        const existingTitle = report.judul.toLowerCase().trim();

        // Quick checks first (more efficient)
        if (currentTitle === existingTitle) return true;

        // Check if one title contains the other (substring check)
        if (
          currentTitle.includes(existingTitle) ||
          existingTitle.includes(currentTitle)
        ) {
          return true;
        }

        // Only do expensive similarity calculation if needed
        if (
          Math.abs(currentTitle.length - existingTitle.length) <=
          currentTitle.length * 0.3
        ) {
          const similarity = calculateJaccardSimilarity(
            currentTitle,
            existingTitle
          );
          return similarity > 0.7;
        }

        return false;
      });

      if (hasSimilarTitle) {
        invalidFields.push(
          generateErrorStructure(
            "judul",
            "similar report title found in the last 24 hours"
          )
        );
      }
    }
  }

  // Helper function for NIK validation
  function validateNIKFormat(nik: string): {
    isValid: boolean;
    message: string;
  } {
    // Remove any spaces or non-numeric characters
    const cleanNIK = nik.replace(/\D/g, "");

    // Check if NIK has exactly 16 digits
    if (cleanNIK.length !== 16) {
      return {
        isValid: false,
        message: "NIK must be exactly 16 digits",
      };
    }

    // Check if NIK contains only numbers
    if (!/^\d{16}$/.test(cleanNIK)) {
      return {
        isValid: false,
        message: "NIK must contain only numbers",
      };
    }

    // Extract components of NIK
    const provinceCode = cleanNIK.substring(0, 2);
    const cityCode = cleanNIK.substring(2, 4);
    const districtCode = cleanNIK.substring(4, 6);
    const birthDate = cleanNIK.substring(6, 8);
    const birthMonth = cleanNIK.substring(8, 10);
    const birthYear = cleanNIK.substring(10, 12);
    // Serial number (12-16) not validated as it's unique identifier

    // Validate province code (01-99, but not 00)
    const provinceNum = parseInt(provinceCode);
    if (provinceNum < 1 || provinceNum > 99) {
      return {
        isValid: false,
        message: "Invalid province code in NIK",
      };
    }

    // Validate city/regency code (01-99, but not 00)
    const cityNum = parseInt(cityCode);
    if (cityNum < 1 || cityNum > 99) {
      return {
        isValid: false,
        message: "Invalid city/regency code in NIK",
      };
    }

    // Validate district code (01-99, but not 00)
    const districtNum = parseInt(districtCode);
    if (districtNum < 1 || districtNum > 99) {
      return {
        isValid: false,
        message: "Invalid district code in NIK",
      };
    }

    // Validate birth date (01-71 for male, 41-71 for female)
    const birthDateNum = parseInt(birthDate);
    if (birthDateNum < 1 || birthDateNum > 71) {
      return {
        isValid: false,
        message: "Invalid birth date in NIK",
      };
    }

    // Validate birth month (01-12)
    const birthMonthNum = parseInt(birthMonth);
    if (birthMonthNum < 1 || birthMonthNum > 12) {
      return {
        isValid: false,
        message: "Invalid birth month in NIK",
      };
    }

    // Validate birth year (reasonable range)
    const birthYearNum = parseInt(birthYear);

    // Assume years 00-30 are 2000s, 31-99 are 1900s
    let fullBirthYear;
    if (birthYearNum <= 30) {
      fullBirthYear = 2000 + birthYearNum;
    } else {
      fullBirthYear = 1900 + birthYearNum;
    }

    const currentFullYear = new Date().getFullYear();
    if (fullBirthYear > currentFullYear || fullBirthYear < 1900) {
      return {
        isValid: false,
        message: "Invalid birth year in NIK",
      };
    }

    // Check for obvious fake patterns
    if (/^(.)\1{15}$/.test(cleanNIK)) {
      return {
        isValid: false,
        message: "NIK cannot contain repeated digits",
      };
    }

    // Check for sequential patterns
    if (cleanNIK === "1234567890123456" || cleanNIK === "0123456789012345") {
      return {
        isValid: false,
        message: "NIK cannot be sequential numbers",
      };
    }

    return {
      isValid: true,
      message: "NIK is valid",
    };
  }

  // Helper function for phone number validation
  function validatePhoneNumber(phone: string): {
    isValid: boolean;
    message: string;
  } {
    // Remove any spaces, dashes, or other non-numeric characters except +
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Check if phone starts with +62 (Indonesia country code)
    if (cleanPhone.startsWith("+62")) {
      const phoneNumber = cleanPhone.substring(3);

      // Check if remaining digits are valid
      if (!/^\d{8,13}$/.test(phoneNumber)) {
        return {
          isValid: false,
          message:
            "Phone number with +62 must have 8-13 digits after country code",
        };
      }

      // Check if it starts with valid Indonesian mobile prefixes
      const validPrefixes = ["8", "81", "82", "83", "85", "87", "88", "89"];
      const hasValidPrefix = validPrefixes.some((prefix) =>
        phoneNumber.startsWith(prefix)
      );

      if (!hasValidPrefix) {
        return {
          isValid: false,
          message: "Invalid Indonesian mobile number prefix",
        };
      }

      return { isValid: true, message: "Phone number is valid" };
    }

    // Check if phone starts with 08 (Indonesian mobile format)
    if (cleanPhone.startsWith("08")) {
      if (!/^08\d{8,11}$/.test(cleanPhone)) {
        return {
          isValid: false,
          message:
            "Indonesian mobile number must have 10-13 digits starting with 08",
        };
      }

      // Check valid mobile operator prefixes
      const validOperatorPrefixes = [
        "081",
        "082",
        "083",
        "085",
        "087",
        "088",
        "089",
      ];
      const hasValidOperatorPrefix = validOperatorPrefixes.some((prefix) =>
        cleanPhone.startsWith(prefix)
      );

      if (!hasValidOperatorPrefix) {
        return {
          isValid: false,
          message: "Invalid Indonesian mobile operator prefix",
        };
      }

      return { isValid: true, message: "Phone number is valid" };
    }

    // Check if phone starts with 62 (without +)
    if (cleanPhone.startsWith("62")) {
      const phoneNumber = cleanPhone.substring(2);

      if (!/^\d{8,13}$/.test(phoneNumber)) {
        return {
          isValid: false,
          message:
            "Phone number with 62 prefix must have 8-13 digits after country code",
        };
      }

      // Check if it starts with valid Indonesian mobile prefixes
      const validPrefixes = ["8", "81", "82", "83", "85", "87", "88", "89"];
      const hasValidPrefix = validPrefixes.some((prefix) =>
        phoneNumber.startsWith(prefix)
      );

      if (!hasValidPrefix) {
        return {
          isValid: false,
          message: "Invalid Indonesian mobile number prefix",
        };
      }

      return { isValid: true, message: "Phone number is valid" };
    }

    return {
      isValid: false,
      message: "Phone number must be in Indonesian format (+62, 62, or 08)",
    };
  }

  // More efficient similarity calculation using Jaccard similarity
  function calculateJaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(" "));
    const set2 = new Set(str2.split(" "));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  if (invalidFields.length > 0) {
    return response_bad_request(c, "Invalid Fields", invalidFields);
  }

  await next();
}

export async function validationPelaporanMasyarakatUpdate(
  c: Context,
  next: Next
) {
  const invalidFields: ErrorStructure[] = [];
  const id = c.req.param("id");

  const findPengaduan = await prisma.pengaduan.findUnique({
    where: { id },
  });

  if (!findPengaduan) {
    invalidFields.push(generateErrorStructure("id", "Pengaduan not found"));
  }

  if (findPengaduan?.status === "COMPLETED") {
    invalidFields.push(
      generateErrorStructure("status", "cannot update COMPLATED complaint")
    );
  }

  if (invalidFields.length > 0) {
    return response_bad_request(c, "Invalid Fields", invalidFields);
  }

  await next();
}
