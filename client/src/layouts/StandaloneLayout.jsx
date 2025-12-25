import React from 'react';
import { Outlet } from 'react-router-dom';

export default function StandaloneLayout() {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
            <Outlet />
        </div>
    );
}
