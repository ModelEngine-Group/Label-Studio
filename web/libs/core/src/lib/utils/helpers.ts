export const isFlagEnabled = (id: string, flagList: Record<string, boolean>, defaultValue = false) => {
  if (id in flagList) {
    return flagList[id] ?? defaultValue;
  }
  return defaultValue;
};

export const formDataToJPO = (formData: FormData) => {
  if (formData instanceof FormData) {
    return Object.fromEntries(formData.entries());
  }

  return formData;
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== null && value !== undefined;
};

export const userDisplayName = (user: Record<string, string> = {}) => {
  if (!user) return "";
  let { firstName, lastName, first_name, last_name, username, email } = user;

  if (first_name) {
    firstName = first_name;
  }
  if (last_name) {
    lastName = last_name;
  }

  return firstName || lastName
    ? [firstName, lastName]
        .filter((n) => !!n)
        .join(" ")
        .trim()
    : username || email;
};

export { cn } from "@humansignal/ui/shad/utils/index";
