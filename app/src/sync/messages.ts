import { ApiError } from './api'

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
