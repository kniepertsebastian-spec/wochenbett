import type { SyncProblem } from '../db/db'
import { ApiError } from './api'

/** Was ist passiert, und was kann die Nutzerin jetzt tun? Immer mit klarem nächsten Schritt. */
export const syncProblemHelp: Record<SyncProblem, { text: string; action: string }> = {
  server: { text: 'Der Sync-Server antwortet gerade nicht richtig. Deine Daten sind auf diesem Gerät sicher.', action: 'Warte kurz und tippe auf „Erneut versuchen“. Bleibt es so, sag der Person Bescheid, die den Server betreibt.' },
  too_large: { text: 'Deine Daten sind für den Sync zu groß geworden.', action: 'Exportiere deine Daten unter „Deine Daten“ als Sicherung und frag die Person, die den Server betreibt.' },
  rate_limited: { text: 'Es gab zu viele Anfragen in kurzer Zeit.', action: 'Warte ein paar Minuten und versuche es dann noch einmal.' },
  decrypt: { text: 'Die Daten auf dem Server lassen sich mit diesem Gerät nicht entschlüsseln.', action: 'Melde dich ab und mit deinem Passwort neu an. Hilft das nicht, nutze den Wiederherstellungscode oder deinen Export.' },
  unknown: { text: 'Der Abgleich hat nicht geklappt, der Grund ist unklar.', action: 'Tippe auf „Erneut versuchen“. Deine Daten bleiben auf diesem Gerät erhalten.' },
}

/** Verständliche Fehlermeldungen statt technischer Codes. */
export function describeSyncError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'offline':
        return 'Keine Verbindung zum Server. Bitte prüfe dein Internet und versuche es noch einmal.'
      case 'invalid_credentials':
        return 'Name und Passwort passen nicht zusammen. Achte auf Groß- und Kleinschreibung.'
      case 'invalid_invite':
        return 'Der Einladungscode stimmt nicht.'
      case 'registration_closed':
        return 'Neue Konten sind auf diesem Server gerade nicht möglich.'
      case 'username_taken':
        return 'Dieser Name ist schon vergeben. Bitte wähle einen anderen.'
      case 'invalid_username':
        return 'Der Name darf 3 bis 32 Zeichen haben: Buchstaben, Ziffern, Punkt, Binde- und Unterstrich.'
      case 'too_many_requests':
        return 'Zu viele Versuche. Bitte warte ein paar Minuten.'
    }
    if (e.status === 429) return 'Zu viele Versuche. Bitte warte ein paar Minuten.'
  }
  if (e instanceof Error && e.message === 'invalid_recovery_code') return 'Der Wiederherstellungscode ist nicht gültig. Er hat 26 Zeichen aus Buchstaben und den Ziffern 2 bis 7.'
  return 'Das hat nicht geklappt. Bitte versuche es noch einmal.'
}
