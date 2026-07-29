import { processTask } from "./example";
import { onContactMessageSubmitted } from "./on-contact-message-submitted";
import { onGroupScheduleChanged } from "./on-group-schedule-changed";
import { onOrganizationMemberInvited } from "./on-organization-member-invited";
import { onOrganizationZoomConnected } from "./on-organization-zoom-connected";
import { onSessionMeetingCancelled } from "./on-session-meeting-cancelled";
import { onSessionMeetingSyncRequested } from "./on-session-meeting-sync-requested";
import { onUserRegistered } from "./on-user-registered";
import { onZoomClientDisconnected } from "./on-zoom-client-disconnected";
import { onZoomWebhookReceived } from "./on-zoom-webhook-received";

export const functions = [
  processTask,
  onUserRegistered,
  onOrganizationMemberInvited,
  onContactMessageSubmitted,
  onGroupScheduleChanged,
  onZoomClientDisconnected,
  onOrganizationZoomConnected,
  onSessionMeetingSyncRequested,
  onSessionMeetingCancelled,
  onZoomWebhookReceived,
];
