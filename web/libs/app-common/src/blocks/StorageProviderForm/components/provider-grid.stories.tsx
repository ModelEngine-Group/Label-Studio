import type { Meta, StoryObj } from "@storybook/react";
import { ProviderGrid } from "./provider-grid";

const meta: Meta<typeof ProviderGrid> = {
  title: "Storage/ProviderGrid",
  component: ProviderGrid,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onProviderSelect: { action: "provider-selected" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultProviders = [
  {
    name: "s3",
    title: "AWS S3",
  },
  {
    name: "gcs",
    title: "Google Cloud Storage",
  },
  {
    name: "azure",
    title: "Microsoft Azure",
  },
  {
    name: "redis",
    title: "Redis",
  },
  {
    name: "localfiles",
    title: "Local files",
  },
];

export const Default: Story = {
  args: {
    providers: defaultProviders,
  },
};

export const WithSelectedProvider: Story = {
  args: {
    providers: defaultProviders,
    selectedProvider: "s3",
  },
};

export const Disabled: Story = {
  args: {
    providers: defaultProviders,
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    providers: defaultProviders,
    error: "Please select a storage provider",
  },
};

export const Loading: Story = {
  args: {
    providers: [],
    disabled: true,
  },
};
