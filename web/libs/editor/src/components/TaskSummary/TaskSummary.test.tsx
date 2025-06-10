import { render, screen } from "@testing-library/react";
import type { MSTAnnotation, MSTStore } from "../../stores/types";
import TaskSummary from "./TaskSummary";

// Mock external dependencies only
jest.mock("@humansignal/ui", () => ({
  Tooltip: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-tooltip={title}>{children}</div>
  ),
  Userpic: ({ user, children, className }: { user: any; children?: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="userpic">
      {children || user?.displayName?.[0] || "U"}
    </div>
  ),
}));

jest.mock("@humansignal/icons", () => ({
  IconInfoOutline: ({ size, style }: { size?: number; style?: any }) => (
    <span data-testid="info-icon" style={style}>
      ℹ
    </span>
  ),
  IconSparks: ({ style }: { style?: any }) => (
    <span data-testid="sparks-icon" style={style}>
      ✨
    </span>
  ),
}));

// Mock the labelings renderers module
jest.mock("./labelings", () => ({
  renderers: {
    choices: (results: any[], control: any) => {
      const choices = results.flatMap((r) => r.value?.choices || []);
      return choices.length > 0 ? choices.join(", ") : "-";
    },
    textarea: (results: any[], control: any) => {
      const texts = results.map((r) => r.value?.text).filter(Boolean);
      return texts.length > 0 ? texts.join(", ") : "-";
    },
  },
}));

describe("TaskSummary", () => {
  const createMockAnnotation = (overrides: Partial<MSTAnnotation> = {}): MSTAnnotation =>
    ({
      id: "1",
      pk: 1,
      type: "annotation",
      user: { id: 1, displayName: "John Doe" },
      createdBy: "John Doe",
      versions: {
        result: [{ from_name: "label", to_name: "text", type: "choices", value: { choices: ["positive"] } }],
      },
      results: [],
      ...overrides,
    }) as MSTAnnotation;

  const createMockControlTag = (name: string, type = "choices") => [
    name,
    {
      isControlTag: true,
      type,
      toname: "text",
      perregion: false,
      children: [
        { value: "positive", background: "#ff0000" },
        { value: "negative", background: "#00ff00" },
      ],
    },
  ];

  const createMockObjectTag = (name: string, type = "text") => [
    name,
    {
      isObjectTag: true,
      type,
      value: "$text",
      _value: "Sample text content",
    },
  ];

  const createMockStore = (overrides: any = {}): MSTStore["annotationStore"] =>
    ({
      store: {
        task: {
          dataObj: { text: "Sample text", id: 1 },
          agreement: 85.5,
          ...overrides.task,
        },
        project: {
          review_settings: {
            show_agreement_to_reviewers: true,
          },
          ...overrides.project,
        },
        ...overrides.store,
      },
      names: new Map([createMockControlTag("label"), createMockObjectTag("text"), ...(overrides.names || [])]),
      ...overrides,
    }) as MSTStore["annotationStore"];

  it("renders the review summary heading", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Review Summary")).toBeInTheDocument();
  });

  it("renders the task data heading", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Task Data")).toBeInTheDocument();
  });

  it("displays agreement when show_agreement_to_reviewers is true", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      store: {
        project: {
          review_settings: {
            show_agreement_to_reviewers: true,
          },
        },
      },
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Agreement")).toBeInTheDocument();
    expect(screen.getByText("85.50%")).toBeInTheDocument();
    expect(screen.getByText("Overall agreement over all submitted annotations")).toBeInTheDocument();
  });

  it("hides agreement when show_agreement_to_reviewers is false", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      store: {
        project: {
          review_settings: {
            show_agreement_to_reviewers: false,
          },
        },
      },
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.queryByText("Agreement")).not.toBeInTheDocument();
    expect(screen.queryByText("85.50%")).not.toBeInTheDocument();
  });

  it("hides agreement when project settings are not available", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      store: {
        project: null,
      },
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.queryByText("Agreement")).not.toBeInTheDocument();
  });

  it("counts submitted annotations correctly", () => {
    const annotations = [
      createMockAnnotation({ pk: 1, type: "annotation" }),
      createMockAnnotation({ pk: 2, type: "annotation" }),
      createMockAnnotation({ pk: 0, type: "annotation" }), // draft (pk: 0)
    ];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Annotations")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Only submitted annotations
    expect(screen.getByText("Number of submitted annotations")).toBeInTheDocument();
  });

  it("excludes annotations without results from count", () => {
    const annotations = [
      createMockAnnotation({ pk: 1, type: "annotation" }),
      createMockAnnotation({ pk: 2, type: "annotation", versions: { result: [] } }), // no results
      createMockAnnotation({ pk: 3, type: "annotation", versions: { result: undefined } }), // undefined results
    ];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("1")).toBeInTheDocument(); // Only annotation with results
  });

  it("counts predictions correctly", () => {
    const annotations = [
      createMockAnnotation({ pk: 1, type: "annotation" }),
      createMockAnnotation({ pk: 2, type: "prediction" }),
      createMockAnnotation({ pk: 3, type: "prediction" }),
    ];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Predictions")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Only predictions
    expect(screen.getByText("Number of predictions")).toBeInTheDocument();
  });

  it("filters out annotations without pk (drafts)", () => {
    const annotations = [
      createMockAnnotation({ pk: 1 }),
      createMockAnnotation({ pk: 0 }), // draft
      createMockAnnotation({ pk: undefined }), // draft
    ];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    // Should only show one annotation in the labeling summary table
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("renders labeling summary table with correct headers", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      names: new Map([
        createMockControlTag("sentiment", "choices"),
        createMockControlTag("category", "choices"),
        createMockObjectTag("text"),
      ]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Annotation ID")).toBeInTheDocument();
    expect(screen.getByText("sentiment")).toBeInTheDocument();
    expect(screen.getByText("category")).toBeInTheDocument();
    expect(screen.getByText("choices")).toBeInTheDocument(); // badge type
  });

  it("displays annotation results in labeling summary", () => {
    const annotations = [
      createMockAnnotation({
        pk: 1,
        user: { id: 1, displayName: "Alice" },
        versions: {
          result: [{ from_name: "sentiment", to_name: "text", type: "choices", value: { choices: ["positive"] } }],
        },
      }),
    ];
    const store = createMockStore({
      names: new Map([createMockControlTag("sentiment", "choices"), createMockObjectTag("text")]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("positive")).toBeInTheDocument();
  });

  it("shows prediction icon for prediction annotations", () => {
    const annotations = [
      createMockAnnotation({
        pk: 1,
        type: "prediction",
        user: { id: 1, displayName: "Model" },
        results: [{ toJSON: () => ({ from_name: "sentiment", type: "choices", value: { choices: ["positive"] } }) }],
      }),
    ];
    const store = createMockStore({
      names: new Map([createMockControlTag("sentiment", "choices"), createMockObjectTag("text")]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByTestId("sparks-icon")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
  });

  it("renders data summary table correctly", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      store: {
        task: {
          dataObj: { text: "Sample text", image: "image.jpg" },
        },
      },
      names: new Map([
        createMockControlTag("label"),
        createMockObjectTag("text", "text"),
        createMockObjectTag("image", "image"),
      ]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText("image")).toBeInTheDocument();
  });

  it("handles control tags with per_region setting", () => {
    const annotations = [createMockAnnotation()];
    const controlWithPerRegion = createMockControlTag("regionLabel");
    controlWithPerRegion[1].perregion = true;

    const store = createMockStore({
      names: new Map([controlWithPerRegion]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("regionLabel")).toBeInTheDocument();
  });

  it("handles control tags without children", () => {
    const annotations = [createMockAnnotation()];
    const controlWithoutChildren = createMockControlTag("simpleLabel");
    controlWithoutChildren[1].children = undefined;

    const store = createMockStore({
      names: new Map([controlWithoutChildren]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("simpleLabel")).toBeInTheDocument();
  });

  it("handles object tags with parsedValue", () => {
    const annotations = [createMockAnnotation()];
    const objectWithParsedValue = createMockObjectTag("image", "image");
    objectWithParsedValue[1].parsedValue = "parsed-image-url.jpg";

    const store = createMockStore({
      names: new Map([objectWithParsedValue]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("image")).toBeInTheDocument();
  });

  it("handles empty annotations array", () => {
    const annotations: MSTAnnotation[] = [];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("0")).toBeInTheDocument(); // annotations count should be 0
  });

  it("handles missing task agreement", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      store: {
        task: {
          agreement: undefined,
        },
        project: {
          review_settings: {
            show_agreement_to_reviewers: true,
          },
        },
      },
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    // Should not display agreement when it's undefined
    expect(screen.queryByText("Agreement")).not.toBeInTheDocument();
  });

  it("displays correct info messages with tooltips", () => {
    const annotations = [createMockAnnotation({ type: "annotation" }), createMockAnnotation({ type: "prediction" })];
    const store = createMockStore();

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("Number of submitted annotations")).toBeInTheDocument();
    expect(screen.getByText("Number of predictions")).toBeInTheDocument();
    expect(screen.getAllByTestId("info-icon")).toHaveLength(2); // Two info icons for tooltips
  });

  it("shows dash when no results for a control tag", () => {
    const annotations = [
      createMockAnnotation({
        versions: {
          result: [], // no results for any control
        },
      }),
    ];
    const store = createMockStore({
      names: new Map([createMockControlTag("sentiment", "choices"), createMockObjectTag("text")]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("processes object tags correctly for data types", () => {
    const annotations = [createMockAnnotation()];
    const store = createMockStore({
      names: new Map([
        createMockControlTag("label"),
        createMockObjectTag("text", "text"),
        createMockObjectTag("image", "image"),
        ["nonObjectTag", { isObjectTag: false }], // should be filtered out
        ["objectWithoutDollar", { isObjectTag: true, value: "noDollar" }], // should be filtered out
      ]),
    });

    render(<TaskSummary annotations={annotations} store={store} />);

    // Should only show object tags that have $ in their value
    expect(screen.getByText("text")).toBeInTheDocument();
    expect(screen.getByText("image")).toBeInTheDocument();
    expect(screen.queryByText("nonObjectTag")).not.toBeInTheDocument();
    expect(screen.queryByText("objectWithoutDollar")).not.toBeInTheDocument();
  });
});
