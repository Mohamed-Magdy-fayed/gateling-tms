import { db } from "@/server/db";
import { MaterialsTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getMaterialFolderPath(materialId: string) {
    const material = await db.query.MaterialsTable.findFirst({
        where: eq(MaterialsTable.id, materialId),
        with: {
            LevelsTable: {
                with: {
                    CoursesTable: {
                        columns: { id: true },
                    },
                },
            },
        },
    });
    if (!material) throw new Error("Material not found");

    return `courses/${material.LevelsTable.CoursesTable.id}/${material.levelId}/${materialId}`;
}