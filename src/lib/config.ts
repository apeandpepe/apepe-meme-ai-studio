/**
 * App-wide flags.
 *
 * TESTING:
 *   true  → all character slots are unlocked (for development / testing).
 *   false → only APEPE is unlocked; coin-1..coin-7 show as locked "Soon".
 *
 * Set this to false before deploying the public beta.
 */
export const TESTING = true;

// The single source of truth for which projects can generate.
// When TESTING is true, every slot is enabled.
export const ALL_PROJECT_IDS = [
  "apepe",
  "coin-1",
  "coin-2",
  "coin-3",
  "coin-4",
  "coin-5",
  "coin-6",
  "coin-7",
];

export const ENABLED_PROJECTS = TESTING ? ALL_PROJECT_IDS : ["apepe"];

export function isProjectEnabled(projectId: string): boolean {
  return ENABLED_PROJECTS.includes(projectId);
}
