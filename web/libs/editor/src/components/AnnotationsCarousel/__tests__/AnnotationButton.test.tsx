/* global test, expect, jest, describe */
import Enzyme, { mount } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { AnnotationButton } from "../AnnotationButton";
// eslint-disable-next-line
// @ts-ignore
import { annotationStore } from "./sampleData.js";
import { Provider } from "mobx-react";

Enzyme.configure({ adapter: new Adapter() });

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useLayoutEffect: jest.requireActual("react").useEffect,
}));

jest.mock("@humansignal/ui", () => ({
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

describe("AnnotationsButton", () => {
  test("Annotation", () => {
    const entity = annotationStore.annotations[0];
    const view = mount(
      <Provider store={mockStore}>
        <AnnotationButton entity={entity} capabilities={{}} annotationStore={annotationStore} />
      </Provider>,
    );

    expect(view.find(".dm-annotation-button__entity-id").text()).toBe(`#${entity.pk}`);
  });

  test("Prediction", () => {
    const entity = annotationStore.predictions[0];
    const view = mount(
      <Provider store={mockStore}>
        <AnnotationButton entity={entity} capabilities={{}} annotationStore={annotationStore} />
      </Provider>,
    );

    expect(view.find(".dm-annotation-button__entity-id").text()).toBe(`#${entity.pk}`);
  });
});
