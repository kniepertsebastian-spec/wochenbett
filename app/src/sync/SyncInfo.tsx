import { Card, WarningBanner } from '../components'

/** Erklärung für Nutzerinnen: warum das Sinn macht und warum das Passwort wichtig ist. */
export function SyncInfo() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="font-semibold">Warum ein Sync-Konto?</h2>
        <p>
          Ohne Konto liegen deine Daten nur auf diesem Gerät. Wechselst du das Handy oder werden die Browserdaten gelöscht, ist deine Historie weg. Mit einem Konto bleibt sie erhalten, und du bekommst sie auf jedem neuen Gerät mit einer Anmeldung zurück.
        </p>
        <p>Das Konto ist freiwillig. Die App funktioniert auch ohne und auch offline.</p>
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold">Wie sicher sind meine Daten?</h2>
        <p>
          Deine Daten werden auf deinem Gerät mit deinem Passwort verschlüsselt, bevor sie zum Server gehen. Der Server speichert nur unlesbare Zeichenfolgen. <strong>Niemand kann sie lesen, auch nicht die Person, die den Server betreibt.</strong> Dein Passwort verlässt dein Gerät nie.
        </p>
      </Card>
      <WarningBanner level="red">
        <p className="font-semibold">Bitte vergiss dein Passwort nicht!</p>
        <p className="mt-1">
          Genau weil niemand deine Daten lesen kann, kann sie auch niemand für dich zurückholen. Es gibt kein „Passwort vergessen“ per E-Mail. Ohne dein Passwort und ohne den Wiederherstellungscode sind die Daten auf dem Server <strong>für immer verloren</strong>.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Schreibe das Passwort auf oder speichere es in einem Passwortmanager.</li>
          <li>Bewahre den Wiederherstellungscode getrennt davon auf, zum Beispiel ausgedruckt.</li>
          <li>Exportiere deine Daten ab und zu unter Einstellungen als zusätzliche Sicherung.</li>
        </ul>
      </WarningBanner>
    </div>
  )
}
