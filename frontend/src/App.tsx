import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { NewIncidentPage } from './pages/NewIncidentPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { IncidentTimelinePage } from './pages/IncidentTimelinePage';
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';
import { LearningEvolutionPage } from './pages/LearningEvolutionPage';
import { BeforeAfterPage } from './pages/BeforeAfterPage';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage';
import { PostMortemPage } from './pages/PostMortemPage';
import { SettingsPage } from './pages/SettingsPage';
import { DemoModeModal } from './components/DemoModeModal';
import { DashboardStats, Incident } from './types';
import { api } from './api';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-8401');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [statsRes, incList] = await Promise.all([
        api.getDashboardStats(),
        api.listIncidents(),
      ]);
      setStats(statsRes);
      setIncidents(incList);
      if (incList.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incList[0].id);
      }
    } catch (err) {
      console.error('Error fetching app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh telemetry every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: PageId, incidentId?: string) => {
    setActivePage(page);
    if (incidentId) {
      setSelectedIncidentId(incidentId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIncidentCreated = (newId: string) => {
    setSelectedIncidentId(newId);
    setActivePage('investigation');
    loadData();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans`}>
      {/* Top Navigation Bar */}
      <Navbar
        stats={stats}
        onOpenDemo={() => setShowDemoModal(true)}
        onRefresh={loadData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          activeIncidentsCount={incidents.filter((i) => i.status !== 'RESOLVED').length}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activePage === 'dashboard' && (
            <DashboardPage
              stats={stats}
              incidents={incidents}
              onNavigate={handleNavigate}
              onOpenDemo={() => setShowDemoModal(true)}
            />
          )}

          {activePage === 'new-incident' && (
            <NewIncidentPage onIncidentCreated={handleIncidentCreated} />
          )}

          {activePage === 'investigation' && (
            <InvestigationPage
              incidentId={selectedIncidentId || incidents[0]?.id || 'INC-8401'}
              onNavigate={handleNavigate}
              onRefreshData={loadData}
            />
          )}

          {activePage === 'timeline' && (
            <IncidentTimelinePage
              incidents={incidents}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'memory' && <MemoryExplorerPage />}

          {activePage === 'evolution' && <LearningEvolutionPage />}

          {activePage === 'before-after' && <BeforeAfterPage />}

          {activePage === 'history' && (
            <IncidentHistoryPage
              incidents={incidents}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'postmortem' && (
            <PostMortemPage
              incidentId={selectedIncidentId}
              incidents={incidents}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage onRefreshData={loadData} />
          )}
        </main>
      </div>

      {/* 1-Click Hackathon Demo Mode Modal */}
      {showDemoModal && (
        <DemoModeModal
          onClose={() => setShowDemoModal(false)}
          onNavigateTo={handleNavigate}
          onRefreshData={loadData}
        />
      )}
    </div>
  );
};

export default App;
