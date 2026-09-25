export { resetAcademySetting, updateAcademySetting } from "./academy-mutations";
export {
  type AcademySettingRow,
  type AcademySettingValue,
  listAcademySettings,
  readAcademySettings,
} from "./academy-queries";
export { updateSystemSetting } from "./mutations";
export {
  listSystemSettings,
  readSystemSettingValues,
  type SystemSettingRow,
} from "./queries";
export { settingsRouter } from "./router";
export {
  type ResetAcademySettingInput,
  resetAcademySettingSchema,
  type UpdateAcademySettingInput,
  type UpdateSystemSettingInput,
  updateAcademySettingSchema,
  updateSystemSettingSchema,
} from "./schemas";
export type { OrgAdminTRPCContext, PlatformOwnerTRPCContext } from "./types";
