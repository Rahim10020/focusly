/**
 * @fileoverview Reusable delete confirmation modal component
 */

"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/shared/Modal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  warningNote?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  warningNote,
}: DeleteConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={
        itemName
          ? `Are you sure you want to delete "${itemName}"? ${description}`
          : description
      }
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      }
    >
      <div className="py-4">
        <p className="text-sm text-muted-foreground">
          This will permanently remove the item.
          {warningNote && (
            <span className="block mt-2 font-medium text-foreground">
              {warningNote}
            </span>
          )}
        </p>
      </div>
    </Modal>
  );
}
