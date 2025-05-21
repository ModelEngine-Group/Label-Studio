export const getParentUrl = () => {
  // Check if in iframe, fallback to labelstud.io playground if not able to determine parent url through ancestorOrigins
  if (window.self !== window.top) {
    return window.location.ancestorOrigins?.[0] ?? "https://labelstud.io/playground/";
  }
  return window.location.href;
};
