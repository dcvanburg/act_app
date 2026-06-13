/** Shared bottom chrome layout — keep tab bar and floating buttons aligned. */

export const BOTTOM_CHROME = {
  edgePadding: 16,
  noodknopSize: 44,
  chatFabSize: 56,
  tabBarHeight: 56,
  tabGap: 48,
} as const;

const CHATBOT_ENABLED = (process.env.EXPO_PUBLIC_ENABLE_CHATBOT ?? 'true') !== 'false';

export function leftChromeReserve(): number {
  return BOTTOM_CHROME.edgePadding + BOTTOM_CHROME.noodknopSize;
}

export function rightChromeReserve(): number {
  if (!CHATBOT_ENABLED) {
    return BOTTOM_CHROME.edgePadding;
  }
  return BOTTOM_CHROME.edgePadding + BOTTOM_CHROME.chatFabSize;
}

/** Bottom offset so a FAB's vertical center aligns with the tab bar row. */
export function fabBottomOffset(bottomInset: number, fabSize: number): number {
  const tabCenter = bottomInset + BOTTOM_CHROME.tabBarHeight / 2;
  return tabCenter - fabSize / 2;
}
