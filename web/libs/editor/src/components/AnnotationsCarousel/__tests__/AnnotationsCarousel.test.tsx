import { render } from "@testing-library/react";
import { AnnotationsCarousel } from "../AnnotationsCarousel";
// eslint-disable-next-line
// @ts-ignore
import { annotationStore, store } from "./sampleData.js";
import { Provider } from "mobx-react";

jest.mock("@humansignal/ui", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => {
    return <div data-testid="tooltip">{children}</div>;
  },
  Userpic: ({ children }: { children: React.ReactNode }) => {
    return (
      <div
        data-testid="userpic"
        className="userpic--tBKCQ"
        style={{ background: "rgb(155, 166, 211)", color: "rgb(0, 0, 0)" }}
      >
        {children}
      </div>
    );
  },
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  ToastViewport: ({ children }: { children: React.ReactNode }) => children,
  Toast: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    show: jest.fn(),
  }),
}));

const mockStore = {
  hasInterface: jest.fn().mockReturnValue(true),
};

test("AnnotationsCarousel", async () => {
  const { container } = render(
    <Provider store={mockStore}>
      <AnnotationsCarousel annotationStore={annotationStore} store={store} />
    </Provider>,
  );

  expect(container.querySelectorAll(".dm-annotations-carousel__carosel  > *").length).toBe(9);
});
