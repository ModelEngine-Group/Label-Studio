import { ProjectsPage } from "./Projects/Projects";
import { OrganizationPage } from "./Organization";
import { ModelsPage } from "./Organization/Models/ModelsPage";
import { AccountSettingsPage } from "@humansignal/core";
import { FF_AUTH_TOKENS, isFF } from "../utils/feature-flags";

export const Pages = [ProjectsPage, OrganizationPage, ModelsPage, isFF(FF_AUTH_TOKENS) && AccountSettingsPage].filter(
  Boolean,
);
