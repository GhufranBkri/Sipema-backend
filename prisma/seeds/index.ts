import "../../src/paths"
import { seedAdmin } from "./seedAdmin";
import { prisma } from '../../src/utils/prisma.utils';
import { seedKategori } from "./seedKategori";
import {seedUnit} from "./seedUnit"


async function seed() {
    await seedAdmin(prisma)
    await seedKategori(prisma)
    await seedUnit(prisma)
}

seed().then(() => {
    console.log("ALL SEEDING DONE")
})