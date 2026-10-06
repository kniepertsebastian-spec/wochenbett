import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './app/Layout'
import { SessionProvider } from './app/session'
import { UpdateBanner } from './app/UpdateBanner'
import { SyncProvider } from './sync/SyncProvider'
import { useProfile } from './hooks/useUserState'
import { ExerciseDetailPage, LibraryPage } from './pages/Library'
import { MorePage } from './pages/More'
import { Onboarding } from './pages/Onboarding'
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
const NormalPage = lazy(() => import('./pages/Normal').then((m) => ({ default: m.NormalPage })))
const NormalDetailPage = lazy(() => import('./pages/Normal').then((m) => ({ default: m.NormalDetailPage })))
const WellbeingPage = lazy(() => import('./pages/Wellbeing').then((m) => ({ default: m.WellbeingPage })))
const DataPage = lazy(() => import('./pages/Data').then((m) => ({ default: m.DataPage })))
const ReviewPage = lazy(() => import('./pages/Review').then((m) => ({ default: m.ReviewPage })))
const SyncPage = lazy(() => import('./pages/Sync').then((m) => ({ default: m.SyncPage })))
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
        <Route path="check-in" element={<Navigate to="/" replace />} />
        <Route path="plan" element={<Navigate to="/" replace />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="library/:id" element={<ExerciseDetailPage />} />
        <Route path="pelvic-floor" element={<PelvicFloorPage />} />
        <Route path="diastasis" element={<DiastasisPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="more/normal" element={<NormalPage />} />
        <Route path="more/normal/:id" element={<NormalDetailPage />} />
        <Route path="more/wellbeing" element={<WellbeingPage />} />
        <Route path="more/data" element={<DataPage />} />
        <Route path="more/review" element={<ReviewPage />} />
        <Route path="more/sync" element={<SyncPage />} />
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
      <SyncProvider>
        <SessionProvider>
          <UpdateBanner />
          <Gate />
        </SessionProvider>
      </SyncProvider>
    </BrowserRouter>
  )
}
