import Enzyme, { mount } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { AnnotationsCarousel } from "../AnnotationsCarousel";
// eslint-disable-next-line
// @ts-ignore
import { annotationStore, store } from "./sampleData.js";
import { Provider } from "mobx-react";

Enzyme.configure({ adapter: new Adapter() });

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useLayoutEffect: jest.requireActual("react").useEffect,
}));

jest.mock("@humansignal/ui/lib/Toast/Toast", () => ({
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
  const view = mount(
    <Provider store={mockStore}>
      <AnnotationsCarousel annotationStore={annotationStore} store={store} />
    </Provider>,
  );

  expect(view.find(".dm-annotations-carousel__carosel").children().length).toBe(9);
});
