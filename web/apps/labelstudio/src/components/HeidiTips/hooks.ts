import { useCallback, useState } from "react";
import { dismissTip, getRandomTip } from "./utils";
import type { Tip, TipsCollection } from "./types";

export const useRandomTip = (collection: keyof TipsCollection) => {
  const [tip, setTip] = useState<Tip | null>(() => getRandomTip(collection));
  const dismiss = useCallback(() => {
    dismissTip(collection);
    setTip(null);
  }, []);

  return [tip, dismiss] as const;
};
