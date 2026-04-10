import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({ title, description, actionLabel, actionLink, icon: Icon, illustration }) {
    const showFallbackIcon = !illustration && Boolean(Icon);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
            {illustration ? (
                <div className="mb-6">
                    {illustration}
                </div>
            ) : showFallbackIcon ? (
                <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-400">
                    <Icon size={32} strokeWidth={1.5} />
                </div>
            ) : null}

            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-6 text-sm leading-relaxed">{description}</p>

            {actionLabel && actionLink && (
                <Link
                    to={actionLink}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-all duration-200 bg-primary-600 border border-transparent rounded-lg shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
