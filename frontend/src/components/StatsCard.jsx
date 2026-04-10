import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export default function StatsCard({ title, value, icon: Icon, trend, trendLabel, link, iconColor = 'text-zinc-600', iconBg = 'bg-zinc-100' }) {
    const hasIcon = Boolean(Icon);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group relative overflow-hidden">
            {/* Hover Indicator */}
            <div className="absolute top-0 left-0 w-1 h-full bg-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

            <div>
                <div className="flex justify-between items-start mb-4">
                    {hasIcon ? (
                        <div className={`p-3 rounded-lg ${iconBg} ${iconColor}`}>
                            <Icon size={22} strokeWidth={1.5} />
                        </div>
                    ) : null}
                </div>

                <div className="mb-1">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                        {value}
                    </h3>
                </div>
                <div className="text-sm font-medium text-slate-500">{title}</div>
            </div>

            {(trend || link) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    {trend && (
                        <div className={`text-xs font-semibold flex items-center gap-1 ${trend > 0 ? 'text-zinc-900' : 'text-zinc-500'
                            }`}>
                            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(trend)}%
                            <span className="text-slate-400 font-normal ml-1 hidden sm:inline">{trendLabel}</span>
                        </div>
                    )}

                    {link && (
                        <Link to={link} className="text-xs font-semibold text-zinc-600 flex items-center gap-1 group/link hover:text-zinc-900 ml-auto">
                            View Details
                            <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
