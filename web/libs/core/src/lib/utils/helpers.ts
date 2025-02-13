export const isFlagEnabled = (id: string, flagList: Record<string, boolean>, defaultValue = false) => {
  if (id in flagList) {
    return flagList[id] === true || defaultValue;
  }
  return defaultValue;
};

export const formDataToJPO = (formData: FormData) => {
  if (formData instanceof FormData) {
    return Object.fromEntries(formData.entries());
  }

  return formData;
};
