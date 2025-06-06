/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2024-2024. All rights reserved.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../assets/i18n/en-us/common.json";
import zh from "../assets/i18n/zh-cn/common.json";

const resources = {
  en: { translation: en },
  zh: { translation: zh }
};
i18n.use(initReactI18next).init({
  resources,
  fallbackLng: "zh_cn",
  interpolation: {
    escapeValue: false
  },
  returnNull: false
});
