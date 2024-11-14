export type Tip = {
  title: string;
  content: string;
  closable?: boolean;
  link: {
    url: string;
    label: string;
    params?: Record<string, string>;
  };
};

export type TipCollectionKey = "projectCreation" | "organizationPage" | "projectSettings";

export type TipsCollection = Record<TipCollectionKey, Tip[]>;

export type HeidiTipsProps = {
  collection: keyof TipsCollection;
};

export type HeidiTipProps = {
  tip: Tip;
  onDismiss: () => void;
};
