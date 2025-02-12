import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

export async function seedUnit(prisma: PrismaClient) {
    const countUnit = await prisma.unit.count();
    if (countUnit === 0){
        await prisma.unit.create({
            data: {
                id: ulid(),
                nama_unit: "Fakultas Ekonomi dan Bisnis",
                kepalaUnitId: ""
            }
        });
    
    }

    console.log("Unit seeded");
}