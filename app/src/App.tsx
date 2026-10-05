import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './app/Layout'
import { SessionProvider } from './app/session'
import { useProfile } from './hooks/useUserState'
import { CheckInPage } from './pages/CheckIn'
import { ExerciseDetailPage, LibraryPage } from './pages/Library'
import { Onboarding } from './pages/Onboarding'
import { PelvicFloorPage } from './pages/PelvicFloor'
import { PlanPage } from './pages/Plan'
import { ProgressPage } from './pages/Progress'
import { SettingsPage } from './pages/Settings'
import { TodayPage } from './pages/Today'
import { WorkoutPage } from './pages/Workout'

function Gate() {
  const profile = useProfile()
  if (profile === undefined) return null
  if (profile === null) return <Onboarding />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="library/:id" element={<ExerciseDetailPage />} />
        <Route path="pelvic-floor" element={<PelvicFloorPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="more" element={<SettingsPage />} />
        <Route path="*" element={<TodayPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </BrowserRouter>
  )
}
