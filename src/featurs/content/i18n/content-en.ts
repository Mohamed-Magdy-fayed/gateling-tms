import { dt, type LanguageMessages } from "@/i18n/lib";

export default {
    content: {
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
        }
    }
} as const satisfies LanguageMessages;
