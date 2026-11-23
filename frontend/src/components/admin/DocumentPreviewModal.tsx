import React from 'react';

interface DocumentPreviewModalProps {
  modalData: { title: string; url: string } | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  modalData,
  onClose
}) => {
  if (!modalData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
          <h4 className="font-bold text-sm text-charcoal-900">{modalData.title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-charcoal-900 font-bold text-sm px-2 py-1 rounded"
          >
            ✕ Close
          </button>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-center overflow-hidden max-h-[60vh]">
          <img
            src={modalData.url}
            alt={modalData.title}
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-charcoal-900 text-white font-bold text-xs rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
