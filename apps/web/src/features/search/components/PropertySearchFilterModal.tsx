import type { PropertySearchFilters } from '@housing-platform/types';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@housing-platform/ui';

import { PropertySearchForm } from '@/features/search/components/PropertySearchForm';

interface PropertySearchFilterModalProps {
  open: boolean;
  filters: PropertySearchFilters;
  onClose: () => void;
  onSubmit: (filters: PropertySearchFilters) => void;
}

export function PropertySearchFilterModal({
  open,
  filters,
  onClose,
  onSubmit,
}: PropertySearchFilterModalProps) {
  const handleSubmit = (nextFilters: PropertySearchFilters) => {
    onSubmit(nextFilters);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>Search filters</DialogTitle>
            <DialogDescription>
              Update location, dates, guests, price, and sort.
            </DialogDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </DialogHeader>

        <DialogBody>
          <PropertySearchForm filters={filters} onSubmit={handleSubmit} variant="modal" />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
