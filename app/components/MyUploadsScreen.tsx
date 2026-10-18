/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { UploadCloud } from 'lucide-react';
import { ReefImage } from '../lib/types';
import { dominantOf } from '../lib/reefMath';
import { getImageSrc } from '../lib/imageArt';
import { formatCaptured } from '../lib/geo';
import { ClassChip, GhostButton, PrimaryButton, StatusBadge } from './ui';

export const MyUploadsScreen: React.FC<{
  uploads: ReefImage[];
  onOpen: (id: string, ids: string[]) => void;
  onGoUpload: () => void;
  onClear: () => void;
}> = ({ uploads, onOpen, onGoUpload, onClear }) => {
  const sorted = [...uploads].reverse();
  return (
    <div className="reef-rise mx-auto w-full max-w-[1000px] px-4 pb-12 pt-8">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-[#1f2430]">My Uploads</h2>
          <p className="text-[12.5px] text-[#6b7280]">Images you uploaded in this browser and whether they have been verified. They are kept here when you refresh.</p>
        </div>
        <div className="flex items-center gap-2">
          {sorted.length > 0 && (
            <GhostButton onClick={() => window.confirm('Remove all of your uploads from this browser?') && onClear()}>Clear all</GhostButton>
          )}
          <PrimaryButton icon={<UploadCloud size={15} />} onClick={onGoUpload}>New upload</PrimaryButton>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-[28px] bg-[var(--card)] px-6 py-14 text-center shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)]">
          <p className="text-[14px] font-semibold text-[#1f2430]">You haven’t uploaded anything yet.</p>
          <p className="mt-1 text-[12.5px] text-[#6b7280]">Upload a quadrat photo and it will appear here and on the map.</p>
          <div className="mt-4"><PrimaryButton onClick={onGoUpload}>Upload an image</PrimaryButton></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[28px] bg-white shadow-[0_12px_30px_-14px_rgba(52,62,140,.4)] ring-1 ring-white">
          <table className="w-full min-w-[720px] text-left text-[12.5px]">
            <thead className="bg-[#eef1fb] text-[11.5px] uppercase tracking-wide text-[#4b5160]">
              <tr>
                <th className="px-3 py-2">Photo</th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Captured</th>
                <th className="px-3 py-2">Patches</th>
                <th className="px-3 py-2">Main class</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((img) => (
                <tr key={img.id} tabIndex={0} onClick={() => onOpen(img.id, sorted.map((i) => i.id))} onKeyDown={(e) => e.key === 'Enter' && onOpen(img.id, sorted.map((i) => i.id))} className="cursor-pointer border-t border-[#eceef3] hover:bg-[#eef2ff] focus:bg-[#eef2ff] focus:outline-none">
                  <td className="px-3 py-2"><img src={getImageSrc(img)} alt="" className="h-10 w-14 rounded-lg object-cover" /></td>
                  <td className="max-w-[200px] break-all px-3 py-2 font-semibold">{img.name}</td>
                  <td className="px-3 py-2">{img.location}<div className="text-[11px] text-[#6b7280]">{img.transect} · Q{img.quadrat}</div></td>
                  <td className="px-3 py-2">{formatCaptured(img.capturedAt)}</td>
                  <td className="px-3 py-2 tabular-nums">{img.patches.length}</td>
                  <td className="px-3 py-2"><ClassChip cls={dominantOf(img)} full /></td>
                  <td className="px-3 py-2"><StatusBadge status={img.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
