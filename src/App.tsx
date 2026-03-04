import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WebsiteBuilder } from './pages/WebsiteBuilder';
import { Home } from './pages/Home';
import { Toaster } from 'sonner';
import { checkAndSeed } from './modules/webBuilder/seed';
import { AutoUpdater } from './components/AutoUpdater';
import { demoMode } from './pages/builder/framepro/demo';


const AppContent: React.FC = () => {
    const location = useLocation();
    const isDemo = location.search.includes('demo=1') || location.pathname.includes('/demo');

    useEffect(() => {
        checkAndSeed();
    }, []);

    return (
        <div className="relative">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/demo/*" element={<WebsiteBuilder />} />
                <Route path="/website-builder" element={<Navigate to="/demo/" replace />} />
            </Routes>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <Toaster position="top-center" expand={true} richColors />
            <AutoUpdater />
            <AppContent />
        </Router>
    );
};

export default App;
