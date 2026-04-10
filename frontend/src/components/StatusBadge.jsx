import React from 'react';

export default function StatusBadge({ status }) {
    // Normalize status to lowercase for matching
    const s = (status || '').toString().toLowerCase();

    // Default styling (Monochrome)
    let classes = 'bg-zinc-100 text-zinc-600 border border-zinc-200';
    let label = status;

    // Logic based on type or direct status matching
    // Logic based on type or direct status matching - STRICT MONOCHROME
    // Active/Good = Solid Black or Dark Zinc
    if (s === 'active' || s === 'published' || s === 'open' || s === 'completed' || s === 'verified' || s === 'live') {
        classes = 'bg-zinc-900 text-zinc-50 border border-zinc-900';
    }
    // Pending/Upcoming = Light Gray / Outline
    else if (s === 'pending' || s === 'draft' || s === 'paused' || s === 'upcoming') {
        classes = 'bg-white text-zinc-500 border border-zinc-200 border-dashed';
    }
    // Inactive/Error = Light Gray with Darker Text (Standard)
    else if (s === 'error' || s === 'inactive' || s === 'disabled' || s === 'closed' || s === 'stopped' || s === 'rejected') {
        classes = 'bg-zinc-100 text-zinc-500 border border-zinc-200';
    }
    // Processing = Lined/Striped or just bold text
    else if (s === 'processing' || s === 'ongoing') {
        classes = 'bg-white text-zinc-900 border border-zinc-300';
    }

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${classes}`}>
            {label}
        </span>
    );
}
