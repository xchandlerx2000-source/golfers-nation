export * from "./config.js";
export * from "./utils/formatters.js";
export * from "./domain/course-requests.js";
export * from "./domain/round-sync.js";
export * from "./domain/factories.js";
export * from "./domain/scoring.js";

export const CORE_SHARED_BOUNDARIES = Object.freeze({
  config: "Shared product constants, labels, and mode definitions.",
  formatters: "Pure utility helpers used by both clients.",
  courseRequests: "Shared tee-time and course-service request lifecycle helpers.",
  roundSync: "Round sync metadata and reconciliation helpers.",
  factories: "Round, profile, social, and conversation factory functions.",
  scoring: "Scoring, leaderboard, summary, and competitive calculations.",
});
