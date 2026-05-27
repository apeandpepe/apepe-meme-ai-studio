/**
 * App-wide flags. Two independent switches:
 *
 * UNLOCK_ALL:
 *   true  → all character slots (coin-1..coin-7) are selectable (for testing).
 *   false → only APEPE is unlocked; the rest show as locked "Soon".
 *
 * FREE_LIMIT_ON:
 *   true  → the daily free generation limit is enforced.
 *   false → unlimited generations (no limit, counter hidden).
 *
 * Before the public beta:
 *   UNLOCK_ALL = false   (APEPE only)
 *   FREE_LIMIT_ON = true (limit on)
 */
export const UNLOCK_ALL = true;
export const FREE_LIMIT_ON = true;

export const ALL_PROJECT_IDS = [
  "apepe",
  "coin-1",
  "coin-2",
  "coin-3",
  "coin-4",
  "coin-5",
  "coin-6",
  "coin-7",
  "coin-8",
  "coin-9",
  "coin-10",
];

export const ENABLED_PROJECTS = UNLOCK_ALL ? ALL_PROJECT_IDS : ["apepe"];

export function isProjectEnabled(projectId: string): boolean {
  return ENABLED_PROJECTS.includes(projectId);
}
