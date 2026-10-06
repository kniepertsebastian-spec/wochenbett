# Erfolgsmetriken: was geht, was bewusst nicht

Die Roadmap nennt Produktmetriken (Abschlussraten, Wiederkehr, Abbruchgründe …). Die App ist bewusst **ohne Tracking und ohne Analytics** gebaut: Gesundheitsdaten bleiben lokal bzw. Ende-zu-Ende-verschlüsselt, der Server kann nichts lesen und nichts auswerten. Deshalb lassen sich die meisten Kennzahlen **nicht automatisch über alle Nutzerinnen** erheben, ohne das Datenschutzversprechen zu brechen.

| Metrik | Stand | Wie |
|--------|-------|-----|
| Time-to-value (wie schnell eine passende Empfehlung) | gemessen | Automatischer Test (`e2e/flow.mjs`): nach dem Onboarding genügen 2 Fingertipps bis zur Empfehlung |
| Check-in-Dauer (Ziel 10–15 s) | gemessen | gleicher Test: 2–3 Fingertipps; echte Dauer per Nutzertest |
| Anteil sinnvoller Empfehlungen nach dem Check-in | getestet | Unit-Tests (`recommend`, `summarize`): jede Eingabe ergibt eine Empfehlung, Warnzeichen ergeben eine Abklärungsanweisung |
| Check-in-Abschlussrate, Wiederkehr nach 1/7/28 Tagen, Abbruchrate und -gründe, „gut/okay“-Anteil, bewusst gewählte Erholung, eskalierte Fälle | nicht erhoben | Würden Tracking über Nutzerinnen hinweg erfordern |

## Wie man trotzdem lernt

- **Nutzertests mit 3 bis 5 Personen** (Partnerin, Freundinnen): Beobachten, wie lange der Check-in dauert, wo gezögert wird, und ob die Empfehlung verstanden wird. Beobachtung ersetzt hier Tracking.
- **Freiwilliges Feedback** im Gespräch oder per Hebamme statt automatischer Messung.
- **Lokale Sicht für die Nutzerin selbst**: „Mein Weg“ zeigt ihr eigene Zahlen (Einheiten, Verträglichkeit, bewusste Erholung). Sie verlassen das Gerät nie unverschlüsselt.
- Sollte später echte Aggregation nötig werden, dann nur **freiwillig, anonym und mit Datensparsamkeit** (z. B. einzelne Zähler ohne Bezug zu einer Person), nach ausdrücklicher Entscheidung.
