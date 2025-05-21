import { atom } from "jotai";

export const defaultConfig = "<View>\n  <!-- Paste your XML config here -->\n</View>";

export const configAtom = atom<string>(defaultConfig);
export const loadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);
export const interfacesAtom = atom<string[]>(["side-column"]);
export const showPreviewAtom = atom<boolean>(true);
export const sampleTaskAtom = atom<any>({});
export const annotationAtom = atom<any>([]);
