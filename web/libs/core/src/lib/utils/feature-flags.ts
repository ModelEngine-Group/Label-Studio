import { isFlagEnabled } from "./helpers";

const FEATURE_FLAGS = window.APP_SETTINGS?.feature_flags || {};

// Fix displaying of created_at in the review mode
export const FF_DEV_1480 = "ff_front_dev_1480_created_on_in_review_180122_short";
// Notifications
export const FF_DEV_1658 = "ff_front_dev_1658_notification_center_170222_short";
// Model version selector per model backend
export const FF_DEV_1682 = "ff_front_dev_1682_model_version_dropdown_070622_short";

// Fixes how presigned urls are generated and accessed to remove possibility of CORS errors.
export const FF_LSDV_4711 = "fflag_fix_all_lsdv_4711_cors_errors_accessing_task_data_short";
// Enables "Enterprise Awareness" features
export const FF_LSDV_E_297 = "fflag_feat_front_lsdv_e_297_increase_oss_to_enterprise_adoption_short";
/**
 * Improve load time performance of Dashboard Members page
 */
export const FF_OPTIC_2 = "fflag_feat_optic_2_ensure_draft_saved_short";

/**
 * Prompter workflow
 */
export const FF_DIA_835 = "fflag_feat_all_dia_835_prompter_workflow_long";

/**
 * Joyride
 */
export const FF_PRODUCT_TOUR = "fflag_feat_dia_1697_product_tour_short";
/**
 * It adds an unsaved changes warning and fix some caching problems on a saving project
 */
export const FF_UNSAVED_CHANGES = "fflag_feat_front_leap_1198_unsaved_changes_180724";

/**
 * Enables JWT tokens
 */
export const FF_AUTH_TOKENS = "fflag__feature_develop__prompts__dia_1829_jwt_token_auth";

/**
 * Enable new home page for LSO and LSE
 */
export const FF_HOMEPAGE = "fflag_all_feat_dia_1777_ls_homepage_short";

export function isFF(id: string) {
  // TODO: remove the override + if statement once LSE and LSO start building react the same way and fflag_fix_front_lsdv_4620_memory_leaks_100723_short is removed
  const override: Record<string, boolean> = {};
  if (window?.APP_SETTINGS?.sentry_environment === "opensource" && id in override) {
    return override[id];
  }
  return isFlagEnabled(id, FEATURE_FLAGS, window.APP_SETTINGS?.feature_flags_default_value === true);
}
