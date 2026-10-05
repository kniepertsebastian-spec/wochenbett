import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './app/Layout'
import { SessionProvider } from './app/session'
import { UpdateBanner } from './app/UpdateBanner'
import { useProfile } from './hooks/useUserState'
import { CheckInPage } from './pages/CheckIn'
import { ExerciseDetailPage, LibraryPage } from './pages/Library'
import { MorePage } from './pages/More'
import { Onboarding } from './pages/Onboarding'
import { PlanPage } from './pages/Plan'
import { TodayPage } from './pages/Today'
import { WorkoutPage } from './pages/Workout'

const DiastasisPage = lazy(() => import('./pages/Diastasis').then((m) => ({ default: m.DiastasisPage })))
const AppointmentsPage = lazy(() => import('./pages/Appointments').then((m) => ({ default: m.AppointmentsPage })))
const ExportPage = lazy(() => import('./pages/Export').then((m) => ({ default: m.ExportPage })))
const NutritionPage = lazy(() => import('./pages/Nutrition').then((m) => ({ default: m.NutritionPage })))
const RecipeDetailPage = lazy(() => import('./pages/Recipes').then((m) => ({ default: m.RecipeDetailPage })))
const RecipesPage = lazy(() => import('./pages/Recipes').then((m) => ({ default: m.RecipesPage })))
const TimelinePage = lazy(() => import('./pages/Timeline').then((m) => ({ default: m.TimelinePage })))
const TipsPage = lazy(() => import('./pages/Tips').then((m) => ({ default: m.TipsPage })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))
const ProgressPage = lazy(() => import('./pages/Progress').then((m) => ({ default: m.ProgressPage })))
const PelvicFloorPage = lazy(() => import('./pages/PelvicFloor').then((m) => ({ default: m.PelvicFloorPage })))

function Gate() {
  const profile = useProfile()
  if (profile === undefined) return null
  if (profile === null) return <Onboarding />
  return (
    <Suspense fallback={<p className="p-4" role="status">Lädt …</p>}>
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
    </Suspense>
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
