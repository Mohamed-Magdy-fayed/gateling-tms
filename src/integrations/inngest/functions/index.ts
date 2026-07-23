import { processTask } from "./example";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onUserRegistered } from "./on-user-registered";

export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
];
