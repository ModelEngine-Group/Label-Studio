import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@humansignal/shad/components/ui/button";

const meta: Meta<typeof Button> = {
  component: Button,
  render: ({ form, ...args }) => {
    return <Button {...args}>Hello</Button>;
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "default",
  },
};
