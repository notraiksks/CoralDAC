import React from 'react';
import { CLASS_META, CoralClass } from '../lib/types';

export const CoralLogo: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 44V26M24 32c-5-1-8-5-8-10M24 28c5-1 9-6 9-12M16 22c-3-1-5-4-5-8M33 16c1-3 4-5 6-5" stroke="#f26b6b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M11 14c0-3 2-5 4-5M39 11c1-2 0-4-2-5" stroke="#f5a34a" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="16" cy="22" r="3" fill="#f5a34a" />
    <circle cx="33" cy="16" r="3" fill="#f5a34a" />
    <circle cx="24" cy="26" r="3" fill="#ff8f8f" />
    <path d="M6 44h36" stroke="#9fd0ff" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3b6fe0] ${
      checked ? 'bg-[#3b6fe0]' : 'bg-[#c4c9d4]'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({
  icon,
  children,
  className = '',
  ...rest
}) => (
  <button
    {...rest}
    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4a44b5] to-[#3b6fe0] px-6 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_22px_-10px_rgba(59,70,200,.8)] transition hover:brightness-110 hover:shadow-[0_12px_26px_-10px_rgba(59,70,200,.9)] active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
  >
    {icon}
    {children}
  </button>
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({
  icon,
  children,
  className = '',
  ...rest
}) => (
  <button
    {...rest}
    className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#d9def0] bg-white px-4 py-2 text-[13px] font-medium text-[#2d3340] shadow-sm transition hover:bg-[#f3f5ff] active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6fe0] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
  >
    {icon}
    {children}
  </button>
);

export const ClassChip: React.FC<{ cls: CoralClass; full?: boolean }> = ({ cls, full }) => (
  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2d3340]">
    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLASS_META[cls].color }} />
    {full ? CLASS_META[cls].label : CLASS_META[cls].short}
  </span>
);

export const StatusBadge: React.FC<{ status: 'verified' | 'pending' }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      status === 'verified' ? 'bg-[#e3f4e3] text-[#237a23]' : 'bg-[#fff1cf] text-[#8a6100]'
    }`}
  >
    {status === 'verified' ? 'Verified' : 'Pending review'}
  </span>
);

export const CoverBar: React.FC<{ cover: Record<CoralClass, number>; height?: number }> = ({ cover, height = 10 }) => (
  <div className="flex w-full overflow-hidden rounded-full bg-[#e5e7ee]" style={{ height }} role="img" aria-label="Cover breakdown">
    {(['lc', 'pb', 'dc', 'dca'] as CoralClass[]).map((k) => (
      <div key={k} title={`${CLASS_META[k].label}: ${cover[k].toFixed(0)}%`} style={{ width: `${cover[k]}%`, background: CLASS_META[k].color }} />
    ))}
  </div>
);

export const Spinner: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <span
    className="inline-block animate-spin rounded-full border-2 border-[#c4c9d4] border-t-[#2d3340]"
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);
