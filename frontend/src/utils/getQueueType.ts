export function getQueueType(queueId: number | null | undefined): string {
  if (queueId == null) return "Outro";
  switch (queueId) {
    case 420:
      return "Ranqueada Solo/Duo";
    case 430:
      return "Normal com escolha";
    case 440:
      return "Ranqueada Flex";
    case 450:
      return "ARAM";
    case 400:
      return "Normal às cegas";
    case 1020:
      return "Um por Todos";
    case 1300:
      return "Nexus Blitz";
    case 1400:
      return "Ultimate Spellbook";
    case 1700:
      return "Arena";
    default:
      return "Outro";
  }
}

/** Label for ranked queueType from League-v4 (e.g. RANKED_SOLO_5x5 → "Solo/Duo"). */
export function getRankQueueLabel(queueType: string): string {
  switch (queueType) {
    case "RANKED_SOLO_5x5":
      return "Solo/Duo";
    case "RANKED_FLEX_SR":
      return "Flex";
    default:
      return queueType || "Ranqueada";
  }
}

/** Lane label for teamPosition (TOP, MID, JG, ADC, SUP). Returns empty string if not a lane role (e.g. ARAM). */
export function getLaneLabel(teamPosition: string | null | undefined): string {
  if (teamPosition == null || teamPosition === "") return "";
  const p = teamPosition.toUpperCase();
  switch (p) {
    case "TOP":
      return "TOP";
    case "MID":
    case "MIDDLE":
      return "MID";
    case "JUNGLE":
      return "JG";
    case "BOTTOM":
    case "ADC":
      return "ADC";
    case "UTILITY":
    case "SUPPORT":
      return "SUP";
    default:
      return "";
  }
}
