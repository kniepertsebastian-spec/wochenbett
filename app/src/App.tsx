import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './app/Layout'
import { SessionProvider } from './app/session'
import { UpdateBanner } from './app/UpdateBanner'
import { useProfile } from './hooks/useUserState'
import { CheckInPage } from './pages/CheckIn'
import { DiastasisPage } from './pages/Diastasis'
import { ExerciseDetailPage, LibraryPage } from './pages/Library'
import { AppointmentsPage } from './pages/Appointments'
import { ExportPage } from './pages/Export'
import { MorePage } from './pages/More'
import { NutritionPage } from './pages/Nutrition'
import { RecipeDetailPage, RecipesPage } from './pages/Recipes'
import { TimelinePage } from './pages/Timeline'
import { TipsPage } from './pages/Tips'
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
        <Route path="diastasis" element={<DiastasisPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="more/settings" element={<SettingsPage />} />
        <Route path="more/recipes" element={<RecipesPage />} />
        <Route path="more/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="more/nutrition" element={<NutritionPage />} />
        <Route path="more/tips" element={<TipsPage />} />
        <Route path="more/timeline" element={<TimelinePage />} />
        <Route path="more/appointments" element={<AppointmentsPage />} />
        <Route path="more/export" element={<ExportPage />} />
        <Route path="*" element={<TodayPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <UpdateBanner />
        <Gate />
      </SessionProvider>
    </BrowserRouter>
  )
}
