import React, { useState } from "react";
import type { Meta } from "@storybook/react";
import * as Icons from "./";

// Function to get SVG file name from component name
const getFileNameFromIcon = (iconName: string): string => {
  // Regular icons
  if (iconName.startsWith("Icon")) {
    // Convert IconCamelCase to kebab-case.svg
    const name = iconName.substring(4); // Remove 'Icon' prefix

    if (name === "HumanSignal") {
      return "humansignal.svg";
    }

    return `${name
      .replace(/([A-Z])/g, "-$1")
      .replace(/^-/, "")
      .toLowerCase()}.svg`;
  }

  return "unknown.svg";
};

// Function to get the category of an icon
const getIconCategory = (iconName: string): string => {
  const name = iconName.substring(4); // Remove 'Icon' prefix

  if (["Models", "Model", "ModelVersion", "BoundingBox", "Predictions", "LsLabeling", "LsReview"].includes(name)) {
    return "AI/ML";
  }

  if (["HumanSignal", "Slack", "Github", "Mastercard", "Visa"].includes(name)) {
    return "Brand";
  }

  if (
    [
      "Annotation",
      "AnnotationAccepted",
      "AnnotationRejected",
      "AnnotationSkipped",
      "AnnotationSkipped2",
      "AnnotationGroundTruth",
      "AnnotationImported",
      "AnnotationPrediction",
      "AnnotationPropagated",
      "AnnotationReviewRemoved",
      "AnnotationSubmitted",
      "Ban",
      "BanSquare",
      "DraftCreated",
      "DraftCreated2",
      "SparkSquare",
    ].includes(name)
  ) {
    return "Labeling Actions";
  }

  if (["ZoomIn", "ZoomOut", "BulkLabeling"].includes(name) || name.includes("Tool")) {
    return "Labeling Tools";
  }

  if (["RelationRight", "RelationLeft", "RelationBi", "RelationLink"].includes(name)) {
    return "Relations";
  }

  if (name.startsWith("Property")) {
    return "Properties";
  }

  if (
    ["ThumbsUp", "ThumbsDown", "ThumbsUpFill", "ThumbsDownFill", "ThumbsUpOutline", "ThumbsDownOutline"].includes(name)
  ) {
    return "Feedback";
  }

  if (name.includes("Comment") || ["Send"].includes(name)) {
    return "Comments";
  }

  if (
    name.includes("Check") ||
    name.includes("Cross") ||
    name.includes("Close") ||
    ["Remove", "Delete"].includes(name)
  ) {
    return "Check & Cross";
  }

  if (
    [
      "VolumeMute",
      "VolumeHalf",
      "VolumeFull",
      "SoundConfig",
      "SoundMutedConfig",
      "SoundMuted",
      "Play",
      "Pause",
      "Replay",
      "Rewind",
      "FastForward",
      "TimelinePlay",
      "TimelinePause",
      "TimelineRegion",
      "TimelineRewind",
      "TimelineFastForward",
      "TimelineRewind",
      "InterpolationAdd",
      "InterpolationRemove",
      "InterpolationDisabled",
      "KeypointAdd",
      "KeypointDelete",
      "KeypointDisabled",
      "Prev",
      "Next",
      "Fast",
      "Slow",
      "Speed",
    ].includes(name)
  ) {
    return "Audio & Video";
  }

  if (["Bouncing3Dots", "SoundBars"].includes(name)) {
    return "Animated";
  }

  if (["Star", "StarOutline", "StarSquare", "StarRectangle"].includes(name)) {
    return "Stars";
  }

  if (["AllProjects"].includes(name) || name.includes("Folder")) {
    return "Folders";
  }

  if (
    ["Document", "Text", "Pencil"].includes(name) ||
    name.includes("File") ||
    name.includes("Copy") ||
    name.includes("Undo") ||
    name.includes("Redo") ||
    name.includes("Upload") ||
    name.includes("Download") ||
    name.includes("Duplicate") ||
    name.includes("Paste") ||
    name.includes("Cut") ||
    name.includes("Delete") ||
    name.includes("Edit") ||
    name.includes("Trash") ||
    name.includes("Folder")
  ) {
    return "Content & Documents";
  }

  if (["Calendar"].includes(name) || name.includes("Date") || name.includes("Time") || name.includes("Clock")) {
    return "Calendar & Time";
  }

  if (["Forward", "Backward"].includes(name) || name.includes("Arrow") || name.includes("Chevron")) {
    return "Navigation";
  }

  if (
    ["Help", "QuestionOutline", "Warning", "WarningCircle", "WarningCircleFilled", "Error", "ErrorAlt"].includes(
      name,
    ) ||
    name.includes("Info")
  ) {
    return "Information";
  }

  // Default category
  return "Misc";
};

// Description for each category
const categoryDescriptions: Record<string, string> = {
  Misc: "Miscellaneous icons",
  Special: "Special case icons with unique names",
  "AI/ML": "Icons related to AI and ML",
  Brand: "Icons related to brands/companies",
  "Labeling Tools": "Icons related to tools used for interactions and editing",
  "Labeling Actions": "Icons related to actions performed during labeling",
  Comments: "Icons for comments and feedback",
  Relations: "Icons representing different types of relations",
  Properties: "Icons for properties and attributes",
  Feedback: "Icons representing user feedback (thumbs up/down, etc.)",
  "Check & Cross": "Icons for indicating success, completion, or rejection",
  "Audio & Video": "Icons related to audio and video controls and volume",
  Stars: "Star-related icons for ratings and favorites",
  Folders: "Icons for folders and project management",
  "Content & Documents": "Icons for files and content management",
  "Calendar & Time": "Icons for calendar and time",
  Navigation: "Icons for navigation and direction indicators",
  Information: "Icons for information, warnings, errors, and help",
  Animated: "Animated icons",
};

// Component for a single icon
const IconItem = ({ name, Icon }: { name: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) => {
  const fileName = getFileNameFromIcon(name);

  return (
    <div
      className="icon-item"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "15px",
        border: "1px solid #eee",
        borderRadius: "8px",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onClick={() => {
        navigator.clipboard.writeText(name);
      }}
      title={`Click to copy: ${name}`}
    >
      <div
        className="icon-preview"
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        {React.createElement(Icon, {
          width: 24,
          height: 24,
        })}
      </div>
      <div
        className="icon-name"
        style={{
          fontSize: "12px",
          textAlign: "center",
          wordBreak: "break-word",
          fontWeight: "bold",
          marginBottom: "4px",
        }}
      >
        {name}
      </div>
      <div
        className="icon-file-name"
        style={{
          fontSize: "10px",
          textAlign: "center",
          wordBreak: "break-word",
          color: "#666",
        }}
      >
        {fileName}
      </div>
    </div>
  );
};

// Create a component to display a grid of all icons
const IconCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Get all icons from the imported icons
  const iconEntries = Object.entries(Icons);

  // Filter icons based on search term (component name or file name)
  const filteredIcons = iconEntries.filter(([name]) => {
    const fileName = getFileNameFromIcon(name);
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) || fileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="icon-catalog p-8 flex flex-col gap-4">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search icons by name or file name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded-md border border-gray-300 w-full"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "20px",
        }}
        className="icons-grid"
      >
        {filteredIcons.map(([name, Icon]) => {
          // Don't render exports that aren't components
          if (typeof Icon !== "function" && typeof Icon !== "object") return null;

          return <IconItem key={name} name={name} Icon={Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>} />;
        })}
      </div>
      {filteredIcons.length === 0 && (
        <div style={{ textAlign: "center", margin: "40px 0", color: "#666" }}>
          No icons found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

// Component to display icons grouped by category
const IconCatalogByCategory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Get all icons from the imported icons
  const iconEntries = Object.entries(Icons);

  // Group icons by category
  const categorizedIcons: Record<string, Array<[string, unknown]>> = Object.keys(categoryDescriptions).reduce(
    (acc, category) => {
      acc[category] = [];
      return acc;
    },
    {} as Record<string, Array<[string, unknown]>>,
  );

  iconEntries.forEach((entry) => {
    const [name, Icon] = entry;
    if (typeof Icon !== "object" && typeof Icon !== "function") return;

    const category = getIconCategory(name);
    if (!categorizedIcons[category]) {
      categorizedIcons[category] = [];
    }

    categorizedIcons[category].push(entry);
  });

  // Filter categories and icons based on search term
  const filteredCategories = Object.entries(categorizedIcons)
    .map(([category, icons]) => {
      const filteredIcons = icons.filter(([name]) => {
        const fileName = getFileNameFromIcon(name);
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      return { category, icons: filteredIcons };
    })
    .filter(({ icons }) => icons.length > 0);

  return (
    <div className="icon-catalog-by-category p-8 flex flex-col gap-4">
      <div className="search-container" style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search icons by name, file name, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            fontSize: "14px",
          }}
        />
      </div>

      {filteredCategories.map(({ category, icons }) => (
        <div key={category} className="category-section" style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "18px",
              margin: "0 0 8px 0",
              padding: "0 0 8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            {category} ({icons.length})
          </h2>
          <p
            style={{
              fontSize: "14px",
              margin: "0 0 16px 0",
              color: "#666",
            }}
          >
            {categoryDescriptions[category] || "Icons in this category"}
          </p>

          <div
            className="icons-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "20px",
            }}
          >
            {icons.map(([name, Icon]) => (
              <IconItem key={name} name={name} Icon={Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>} />
            ))}
          </div>
        </div>
      ))}

      {filteredCategories.length === 0 && (
        <div style={{ textAlign: "center", margin: "40px 0", color: "#666" }}>
          No icons found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

const meta: Meta = {
  title: "UI/Icons",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A catalog of all available icons in the system. Click on any icon to copy its component name. The file name is displayed below each icon.",
      },
    },
  },
};

export default meta;

export const AllIcons = {
  render: () => <IconCatalog />,
  name: "All Icons",
  parameters: {
    docs: {
      description: {
        story: "All icons displayed in a grid, searchable by name or file name.",
      },
    },
  },
};

export const CategorizedIcons = {
  render: () => <IconCatalogByCategory />,
  name: "Categorized",
  parameters: {
    docs: {
      description: {
        story: "Icons grouped by categories, making it easier to find related icons.",
      },
    },
  },
};
