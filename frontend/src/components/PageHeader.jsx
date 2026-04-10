import React from 'react';

export default function PageHeader({ title, description, actions, children }) {
    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium text-zinc-900 tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm text-zinc-500 mt-1">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>

            {/* Optional children (e.g., search bars, tabs) */}
            {children && (
                <div className="mt-6">
                    {children}
                </div>
            )}
        </div>
    );
}
