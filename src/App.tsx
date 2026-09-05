import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { AdvancementPage } from './pages/AdvancementPage';
import { BowlingLanePage } from './pages/BowlingLanePage';
import { BowlingReseedPage } from './pages/BowlingReseedPage';
import { BowlingSetupPage } from './pages/BowlingSetupPage';
import { HistoryListPage } from './pages/HistoryListPage';
import { HomePage } from './pages/HomePage';
import { NewTournamentPage } from './pages/NewTournamentPage';
import { PersonvernPage } from './pages/PersonvernPage';
import { PlayerBankPage } from './pages/PlayerBankPage';
import { PodiumPage } from './pages/PodiumPage';
import { StageSetupPage } from './pages/StageSetupPage';
import { StageStandingsPage } from './pages/StageStandingsPage';
import { TablePage } from './pages/TablePage';
import { TournamentOverviewPage } from './pages/TournamentOverviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-ink">
        <div className="mx-auto min-h-screen max-w-md border-x-2 border-ink bg-cream pb-20">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/players" element={<PlayerBankPage />} />
            <Route path="/history" element={<HistoryListPage />} />
            <Route path="/personvern" element={<PersonvernPage />} />
            <Route path="/tournaments/new/:game" element={<NewTournamentPage />} />
            <Route path="/t/:tournamentId/setup" element={<StageSetupPage />} />
            <Route path="/t/:tournamentId/setup-bowling" element={<BowlingSetupPage />} />
            <Route path="/t/:tournamentId" element={<TournamentOverviewPage />} />
            <Route path="/t/:tournamentId/stages/:stageId/tables/:tableId" element={<TablePage />} />
            <Route path="/t/:tournamentId/stages/:stageId/lanes/:tableId" element={<BowlingLanePage />} />
            <Route path="/t/:tournamentId/stages/:stageId/standings" element={<StageStandingsPage />} />
            <Route path="/t/:tournamentId/stages/:stageId/advance" element={<AdvancementPage />} />
            <Route path="/t/:tournamentId/stages/:stageId/reseed" element={<BowlingReseedPage />} />
            <Route path="/t/:tournamentId/podium" element={<PodiumPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
