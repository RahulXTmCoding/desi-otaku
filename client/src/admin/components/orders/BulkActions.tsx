import React from 'react';
import { Settings } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  showActions: boolean;
  onToggleActions: () => void;
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: string) => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  showActions,
  onToggleActions,
  onClearSelection,
  onBulkStatusUpdate
}) => {
  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6 flex items-center justify-between">
        <p className="text-yellow-400">
          {selectedCount} order{selectedCount > 1 ? 's' : ''} selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={onToggleActions}
            className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Bulk Actions
          </button>
          <button
            onClick={onClearSelection}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {showActions && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Update Status for Selected Orders</h3>
          <div className="flex flex-wrap gap-2">
            {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => onBulkStatusUpdate(status)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Mark as {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;
