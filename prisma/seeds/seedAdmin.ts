import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ulid } from "ulid";

export async function seedAdmin(prisma: PrismaClient) {
  // Admin seed
  const findAdmin = await prisma.userLevels.findUnique({
    where: {
      name: "ADMIN",
    },
  });

  if (findAdmin) {
    const countAdmin = await prisma.user.count({
      where: {
        userLevelId: findAdmin.id,
      },
    });
    if (countAdmin === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Admin",
          no_identitas: "1001",
          password: hashedPassword,
          email: "admin@test.com",
          userLevelId: findAdmin.id,
          program_studi: "ADMIN",
        },
      });
      console.log("Admin seeded");
    }
  }

  // Dosen seed
  const findDosen = await prisma.userLevels.findUnique({
    where: {
      name: "DOSEN",
    },
  });
  if (findDosen) {
    const countDosen = await prisma.user.count({
      where: {
        userLevelId: findDosen.id,
      },
    });
    if (countDosen === 0) {
      const hashedPassword = await bcrypt.hash("dosen123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Dosen",
          no_identitas: "2002",
          password: hashedPassword,
          email: "dosen@test.com",
          userLevelId: findDosen.id,
          program_studi: "Informatika",
        },
      });
      console.log("Dosen seeded");
    }
  }

  // Kepala WBS seed
  const findKepalaWBS = await prisma.userLevels.findUnique({
    where: {
      name: "KEPALA_WBS",
    },
  });
  if (findKepalaWBS) {
    const countKepalaWBS = await prisma.user.count({
      where: {
        userLevelId: findKepalaWBS.id,
      },
    });
    if (countKepalaWBS === 0) {
      const hashedPassword = await bcrypt.hash("kepala123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Kepala WBS",
          no_identitas: "5002",
          password: hashedPassword,
          email: "kepalaWBS@test.com",
          userLevelId: findKepalaWBS.id,
          program_studi: "KEPALA",
        },
      });
      console.log("Kepala WBS seeded");
    }
  }

  const findMahasiswa = await prisma.userLevels.findUnique({
    where: {
      name: "MAHASISWA",
    },
  });
  if (findMahasiswa) {
    const countMahasiswa = await prisma.user.count({
      where: {
        userLevelId: findMahasiswa.id,
      },
    });
    // Mahasiswa seed
    if (countMahasiswa === 0) {
      const hashedPassword = await bcrypt.hash("Mahasiswa123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Dosen",
          no_identitas: "2003",
          password: hashedPassword,
          email: "mahasiswa@test.com",
          userLevelId: findMahasiswa.id,
          program_studi: "Informatika",
        },
      });
      console.log("Dosen seeded");
    }
  }

  // Tenaga Kependidikan seed
  const findTenagaKependidikan = await prisma.userLevels.findUnique({
    where: {
      name: "TENAGA_KEPENDIDIKAN",
    },
  });
  if (findTenagaKependidikan) {
    const countTenagaKependidikan = await prisma.user.count({
      where: {
        userLevelId: findTenagaKependidikan.id,
      },
    });
    if (countTenagaKependidikan === 0) {
      const hashedPassword = await bcrypt.hash("tendik123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Tenaga Kependidikan",
          no_identitas: "2001",
          password: hashedPassword,
          email: "tendik@test.com",
          userLevelId: findTenagaKependidikan.id,
          program_studi: "Administrasi",
        },
      });
      console.log("Tenaga Kependidikan seeded");
    }
  }

  // Pimpinan Universitas seed
  const findPimpinanUniversitas = await prisma.userLevels.findUnique({
    where: {
      name: "PIMPINAN_UNIVERSITAS",
    },
  });
  if (findPimpinanUniversitas) {
    const countPimpinanUniversitas = await prisma.user.count({
      where: {
        userLevelId: findPimpinanUniversitas.id,
      },
    });
    if (countPimpinanUniversitas === 0) {
      const hashedPassword = await bcrypt.hash("pimpinan123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Pimpinan Universitas",
          no_identitas: "3002",
          password: hashedPassword,
          email: "pimpinan@test.com",
          userLevelId: findPimpinanUniversitas.id,
          program_studi: "PIMPINAN",
        },
      });
      console.log("Pimpinan Universitas seeded");
    }
  }

  // Petugas Super seed
  const findPetugasSuper = await prisma.userLevels.findUnique({
    where: {
      name: "PETUGAS_SUPER",
    },
  });
  if (findPetugasSuper) {
    const countPetugasSuper = await prisma.user.count({
      where: {
        userLevelId: findPetugasSuper.id,
      },
    });
    if (countPetugasSuper === 0) {
      const hashedPassword = await bcrypt.hash("super123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Petugas Super",
          no_identitas: "3001",
          password: hashedPassword,
          email: "super@test.com",
          userLevelId: findPetugasSuper.id,
          program_studi: "SUPER",
        },
      });
      console.log("Petugas Super seeded");
    }
  }

  // Kepala Unit seed
  const findKepalaPetugasUnit = await prisma.userLevels.findUnique({
    where: {
      name: "KEPALA_PETUGAS_UNIT",
    },
  });
  if (findKepalaPetugasUnit) {
    const countKepalaPetugasUnit = await prisma.user.count({
      where: {
        userLevelId: findKepalaPetugasUnit.id,
      },
    });
    if (countKepalaPetugasUnit === 0) {
      const hashedPassword = await bcrypt.hash("kepala123", 12);
      await prisma.user.create({
        data: {
          id: ulid(),
          name: "Kepala Unit",
          no_identitas: "5001",
          password: hashedPassword,
          email: "kepala@test.com",
          userLevelId: findKepalaPetugasUnit.id,
          program_studi: "KEPALA",
        },
      });
    }
  }

  // // Find Unit first
  // const findUnit = await prisma.unit.findUnique({
  //   where: {
  //     nama_unit: "Unit TI",
  //   },
  // });
  // if (!findUnit) {
  //   const findPetugas = await prisma.userLevels.findUnique({
  //     where: {
  //       name: "PETUGAS",
  //     },
  //   });
  //   if (findPetugas) {
  //     // Check if the specific user with no_identitas "4001" exists
  //     const existingPetugas = await prisma.user.findUnique({
  //       where: {
  //         no_identitas: "4001",
  //       },
  //     });

  //     // Create the unit first
  //     const unit = await prisma.unit.create({
  //       data: {
  //         id: ulid(),
  //         jenis_unit: jenisUnit.FAKULTAS,
  //         nama_unit: "Unit TI",
  //         kepalaUnitId: "5001",
  //       },
  //     });

  //     await prisma.user.update({
  //       where: {
  //         no_identitas: unit.kepalaUnitId,
  //       },
  //       data: {
  //         unitId: unit.id,
  //       },
  //     });

  //     // Only create the petugas user if it doesn't already exist
  //     if (!existingPetugas) {
  //       const hashedPassword = await bcrypt.hash("petugas123", 12);
  //       await prisma.user.create({
  //         data: {
  //           id: ulid(),
  //           name: "Petugas Unit TI",
  //           no_identitas: "4001",
  //           password: hashedPassword,
  //           email: "petugas@test.com",
  //           userLevelId: findPetugas.id,
  //           program_studi: "Teknik Informatika",
  //           unitId: unit.id,
  //         },
  //       });
  //       console.log("Petugas created and assigned to Unit TI");
  //     } else {
  //       // Update the existing petugas user with the unit if needed
  //       if (!existingPetugas.unitId) {
  //         await prisma.user.update({
  //           where: {
  //             no_identitas: "4001",
  //           },
  //           data: {
  //             unitId: unit.id,
  //           },
  //         });
  //         console.log("Existing Petugas updated with Unit TI assignment");
  //       }
  //     }
  //   }
  // }

  console.log("All user seeding completed");
}
