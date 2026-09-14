export const SCROLL_TO_TOP_EVENT = "braza:scroll-to-top";

export function scrollToPageTop() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(SCROLL_TO_TOP_EVENT));
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}
