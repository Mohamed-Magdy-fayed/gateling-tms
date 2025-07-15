import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    content: {
    courses: {
      name: "Course Name",
      searchPlaceholder: "Search courses...",
      createdAt: "Created At",
      actionBar: {
        exportTooltip: "Export selected courses",
        deleteTooltip: "Delete selected courses",
      },
    },
        courseForm: {
            name: "Course Name",
            namePlaceholder: "Begginers Course",
            description: "Description",
            image: "Course Image",
            privatePrice: "Private Price",
            groupPrice: "Group Price",
            instructorPrice: "Instructor Price",
            pricePlaceholder: "EX. 99.99",
            cancel: "Cancel",
            reset: "Reset",
            submit: "Submit",
            new: "New Course",
            update: "Edit Course",
            courses: "Courses",
            create: "Create Course",
            createdSuccess: dt("Course with name: {name} created successfully!", {}),
            title: "Create a new course",
            formDescription: "Fill in the details below to add a new course.",
            formDescriptionUpdate: "Update the course details below.",
        },
        courseSheet: {
            updateTitle: "Edit Course",
            createTitle: "Create Course",
            updateDescription: "Update the course details and save the changes.",
            createDescription: "Fill in the details below to add a new course.",
            cancel: "Cancel",
            save: "Save",
            create: "Create",
            updateSuccess: "Course updated successfully!",
            createSuccess: "Course created successfully!",
        },
        deleteCoursesDialog: {
            title: "Are you absolutely sure?",
            description: dt("This action cannot be undone. This will permanently delete your {count:plural} from our servers.", {
                plural: { count: { one: "{?} course", other: "{?} courses" } }
            }),
            triggerButton: dt("Delete {count}", {}),
            cancel: "Cancel",
            delete: "Delete",
            ariaLabel: "Delete selected rows",
            deleteSuccess: dt("{count:plural} deleted}", {
                plural: { count: { one: "Course", other: "Courses" } }
            }),
            deleteError: "Failed to delete courses. Please try again."
        }
    }
} as const satisfies LanguageMessages;
