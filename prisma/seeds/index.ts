import "../../src/paths";
import { seedAdmin } from "./seedAdmin";
import { prisma } from "../../src/utils/prisma.utils";
import { seedKategori } from "./seedKategori";
import { seedKategoriWBS } from "./seedKategori";
import { seedUserLevels } from "./seedUserLevel";
import { seedAcl } from "./seedACL";
import { seedUnit } from "./seedUnit";

async function seed() {
  await seedUserLevels(prisma);
  await seedAdmin(prisma);
  await seedAcl(prisma);
  await seedKategori(prisma);
  await seedUnit(prisma);
  await seedKategoriWBS(prisma);
}

seed().then(() => {
  console.log("ALL SEEDING DONE");
});
