import {
  createContext,
  forwardRef,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ErrorWrapper } from "../components/Error/Error";
import { modal } from "../components/Modal/Modal";
import { API_CONFIG } from "../config/ApiConfig";
import { type ApiParams, APIProxy } from "@humansignal/core/lib/api-proxy";
import { absoluteURL, isDefined } from "../utils/helpers";
import type { ApiResponse, WrappedResponse } from "@humansignal/core/lib/api-proxy/types";

export const API = new APIProxy(API_CONFIG);

export type ApiEndpoints = keyof typeof API.methods;

let apiLocked = false;

export type ApiCallOptions = {
  params?: any;
  suppressError?: boolean;
  errorFilter?: (response: ApiResponse) => boolean;
} & ApiParams;

export type ApiContextType = {
  api: typeof API;
  callApi: <T>(method: keyof (typeof API)["methods"], options?: ApiCallOptions) => Promise<WrappedResponse<T>>;
  handleError: (response: any, showModal?: boolean) => Promise<boolean>;
  resetError: () => void;
  error: any;
  showModal: true;
  errorFormatter: (result: any) => any;
  isValidMethod: (name: string) => boolean;
};

export type FormattedError = {
  title: string;
  message: string;
  stacktrace: string;
  version: string;
  validation: [string, string[]][];
  isShutdown: boolean;
};

export const ApiContext = createContext<ApiContextType | null>(null);
ApiContext.displayName = "ApiContext";

export const errorFormatter = (result: ApiResponse): FormattedError => {
  const response = "response" in result ? result.response : null;
  // we should not block app because of some network issue
  const isShutdown = false;

  return {
    isShutdown,
    title: result.error ? "Runtime error" : "Server error",
    message: response?.detail ?? result?.error,
    stacktrace: response?.exc_info ?? null,
    version: response?.version,
    validation: Object.entries<string[]>(response?.validation_errors ?? {}),
  };
};

const handleError = async (response: Response, showModal = true) => {
  let result: ApiResponse = response;

  if (result instanceof Response) {
    result = await API.generateError(response);
  }

  const { isShutdown, ...formattedError } = errorFormatter(result);

  if (showModal) {
    modal({
      unique: "network-error",
      allowClose: !isShutdown,
      body: isShutdown ? (
        <ErrorWrapper
          possum={false}
          title={"Connection refused"}
          message={"Server not responding. Is it still running?"}
        />
      ) : (
        <ErrorWrapper {...formattedError} />
      ),
      simple: true,
      style: { width: 680 },
    });
  }

  return isShutdown;
};

export const ApiProvider = forwardRef<ApiContextType, PropsWithChildren<any>>(({ children }, ref) => {
  const [error, setError] = useState(null);

  const resetError = () => setError(null);

  const callApi = useCallback(
    async (method: keyof (typeof API)["methods"], { params = {}, errorFilter, ...rest } = {}) => {
      if (apiLocked) return;

      setError(null);

      const result = await API.invoke(method, params, rest);

      if (result?.status === 401) {
        apiLocked = true;
        location.href = absoluteURL("/");
        return;
      }

      if (result?.error) {
        const shouldShowModalError =
          (!isDefined(errorFilter) || errorFilter(result) === false) && !result.error?.includes("aborted");

        if (shouldShowModalError && rest.suppressError !== true) {
          setError(result);
          const isShutdown = await handleError(result, contextValue.showModal);

          apiLocked = apiLocked || isShutdown;

          return null;
        }
      }

      return result;
    },
    [],
  );

  const contextValue: ApiContextType = useMemo(
    () => ({
      api: API,
      callApi,
      handleError,
      resetError,
      error,
      showModal: true,
      errorFormatter,
      isValidMethod(name: string) {
        return API.isValidMethod(name);
      },
    }),
    [error],
  );
  useEffect(() => {
    if (ref && !(ref instanceof Function)) ref.current = contextValue;
  }, [ref]);

  return <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>;
});

export const useAPI = () => {
  return useContext(ApiContext)!;
};
