import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { UserProfile, UserState } from '../domain/types'

export const daysBetween = (isoDate: string, now = new Date()) =>
  Math.max(0, Math.floor((now.getTime() - new Date(isoDate).getTime()) / 86_400_000))

export const todayISO = () => new Date().toISOString().slice(0, 10)

/** null = noch kein Profil, undefined = lädt. */
export function useProfile(): UserProfile | null | undefined {
  return useLiveQuery(async () => (await db.userProfile.get('me')) ?? null, [])
}

export function useUserState(): { profile: UserProfile | null; user: UserState | null; loading: boolean } {
  const data = useLiveQuery(async () => {
    const profile = (await db.userProfile.get('me')) ?? null
    const progress = await db.userProgress.get('me')
    const lastDiastasis = await db.diastasisLogs.orderBy('date').last()
    return { profile, phase: progress?.currentPhase ?? 1, doming: lastDiastasis?.doming ?? false }
  }, [])
  if (!data) return { profile: null, user: null, loading: true }
  if (!data.profile) return { profile: null, user: null, loading: false }
  return {
    profile: data.profile,
    loading: false,
    user: {
      daysSinceBirth: daysBetween(data.profile.birthDate),
      birthType: data.profile.birthType,
      medicalClearance: data.profile.medicalClearance,
      currentPhase: data.phase,
      doming: data.doming,
    },
  }
}
