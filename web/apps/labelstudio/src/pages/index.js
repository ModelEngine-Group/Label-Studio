import { ProjectsPage } from "./Projects/Projects";
import { HomePage } from "./Home/HomePage";
import { OrganizationPage } from "./Organization";
import { ModelsPage } from "./Organization/Models/ModelsPage";
import { FF_HOMEPAGE, isFF } from "../utils/feature-flags";

export const Pages = [isFF(FF_HOMEPAGE) && HomePage, ProjectsPage, OrganizationPage, ModelsPage].filter(Boolean);
