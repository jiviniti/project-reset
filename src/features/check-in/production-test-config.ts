import {
  baseAutomatedTestScreeningConfig,
} from "@/features/check-in/base-screening-fixture";
import type { ScreeningConfig } from "@/types/screening";

export const PROJECT_RESET_SCREENING_SLUG = "project-reset";
export const CLIMATE_WEEK_SCREENING_SLUG = "climate-week-nyc-2026";
export const COLUMBIA_SCREENING_SLUG = "columbia-climate-school-2026";

const projectResetScreeningConfig: ScreeningConfig = {
  ...baseAutomatedTestScreeningConfig,
  slug: PROJECT_RESET_SCREENING_SLUG,
  name: "Project RESET Learning Lab",
};

const climateWeekScreeningConfig: ScreeningConfig = {
  ...projectResetScreeningConfig,
  slug: CLIMATE_WEEK_SCREENING_SLUG,
  name: "Third Degree Burnout: Climate Week NYC 2026",
  entryPathway: "event",
  rewardType: "film_access",
  eventWindowStatus: "active_event",
  checkInOpensAt: "2026-09-22T04:00:00.000Z",
  checkInClosesAt: "2026-10-07T04:00:00.000Z",
  accessEndsAt: "2026-10-07T04:00:00.000Z",
};

const columbiaScreeningConfig: ScreeningConfig = {
  ...projectResetScreeningConfig,
  slug: COLUMBIA_SCREENING_SLUG,
  name: "Third Degree Burnout: Columbia Climate School 2026",
  institution: "Columbia Climate School",
  entryPathway: "event",
  eventWindowStatus: "event_not_started",
  rewardType: "trailer_access",
  checkInOpensAt: "2026-10-07T04:00:00.000Z",
  checkInClosesAt: "2026-10-22T04:00:00.000Z",
  accessEndsAt: "2026-10-22T04:00:00.000Z",
};

export const automatedTestScreenings: Record<string, ScreeningConfig> = {
  [PROJECT_RESET_SCREENING_SLUG]: projectResetScreeningConfig,
  [CLIMATE_WEEK_SCREENING_SLUG]: climateWeekScreeningConfig,
  [COLUMBIA_SCREENING_SLUG]: columbiaScreeningConfig,
};
