import React, { useState } from 'react';
import { NotebookPen } from 'lucide-react';

interface FieldNotesLedgerProps {
  initialNotes?: string;
  logRef?: string;
}

export const FieldNotesLedger: React.FC<FieldNotesLedgerProps> = ({
  initialNotes = 'Survey observation notes: Noticeable patch bleaching along the eastern edge of the 1m² quadrat frame. Hard coral framework displays signs of physical fracturing. Water clarity good.',
  logRef = 'LOG REF #V4-709',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);

  return (
    <div
      id="field-notes-ledger"
      className="bg-[#FEF9EB] border border-[#D1CBBF] p-4 relative overflow-hidden"
    >
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#1E5F74]/40" />

      <div className="flex items-center justify-between pb-2 border-b border-[#D1CBBF] mb-3">
        <div className="flex items-center gap-1.5">
          <NotebookPen className="text-[#00475A]" size={16} />
          <h3 className="font-mono text-xs uppercase font-bold text-[#1D1C13]">
            Marginalia Field Observation Notes
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="font-mono text-[10px] text-[#00475A] hover:underline"
          >
            {isEditing ? '[Save Note]' : '[Edit]'}
          </button>
          <span className="font-mono text-[10px] text-[#70787C]">{logRef}</span>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-[#FAF8F3] border border-[#C0C8CC] p-2 font-serif text-sm italic text-[#1D1C13] focus:outline-none focus:border-[#00475A] mb-2"
        />
      ) : (
        <p className="font-serif text-[13px] leading-relaxed italic text-[#1D1C13] mb-2 font-normal">
          &quot;{notes}&quot;
        </p>
      )}

      <div className="flex items-center justify-between font-mono text-[10px] text-[#53606D] pt-1">
        <span>Survey Notes Record</span>
        <span className="text-[#70787C]">Appended to survey submission</span>
      </div>
    </div>
  );
};
