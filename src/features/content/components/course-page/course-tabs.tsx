"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LevelsClient } from "@/features/content/components/levels/level-client";
import { MaterialsClient } from "@/features/content/components/materials/materials-client";

const tabs = [
    { value: "levels", label: "Levels" },
    { value: "materials", label: "Materials" },
    { value: "assignments", label: "Assignments" },
    { value: "quizzes", label: "Quizzes" },
    { value: "waiting_list", label: "Waiting list" },
    { value: "groups", label: "Groups" },
    { value: "placement_tests", label: "Placement tests" },
    { value: "final_tests", label: "Final tests" },
]

export function CourseTabs({ courseId }: { courseId: string }) {
    return (
        <Tabs className="w-full" defaultValue="levels" id={courseId}>
            <TabsList className="w-full" >
                {tabs.map(tab => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            <TabsContent value="levels">
                <LevelsClient />
            </TabsContent>
            <TabsContent value="materials">
                <MaterialsClient />
            </TabsContent>
            <TabsContent value="assignments">
            </TabsContent>
            <TabsContent value="quizzes">
            </TabsContent>
            <TabsContent value="waiting_list">
            </TabsContent>
            <TabsContent value="groups">
            </TabsContent>
            <TabsContent value="placement_tests">
            </TabsContent>
            <TabsContent value="final_tests">
            </TabsContent>
        </Tabs>
    );
};
