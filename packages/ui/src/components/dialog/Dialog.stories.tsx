import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Button } from '../button/Button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function DialogDefaultStory() {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Open filters</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>Search filters</DialogTitle>
              <DialogDescription>
                Update location, dates, guests, price, and sort.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close">
              Close
            </Button>
          </DialogHeader>
          <DialogBody>
            <p className="text-ink-muted text-sm">Filter form content goes here.</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Apply filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

export const Responsive: Story = {
  ...Default,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
