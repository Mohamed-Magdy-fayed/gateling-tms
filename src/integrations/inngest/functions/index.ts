import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onUserRegistered } from "./on-user-registered";

export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
];
