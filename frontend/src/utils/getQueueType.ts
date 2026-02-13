export function getQueueType(queueId: number | null | undefined): string {
  if (queueId == null) return "Outro";
  switch (queueId) {
    case 420:
      return "Ranked Solo";
    case 430:
      return "Normal Draft";
    case 440:
      return "Ranked Flex";
    case 450:
      return "ARAM";
    case 400:
      return "Normal Blind";
    case 1020:
      return "One for All";
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
