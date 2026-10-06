# Wochenbett – Produkt- & UX-Roadmap

> Ältere, technische Roadmap (Aufbau der PWA): [`docs/roadmap-archiv-v1.md`](docs/roadmap-archiv-v1.md)

**Ziel:** Die App soll sich wie ein ruhiger, sicherer Begleiter durch die erste Zeit nach der Geburt anfühlen, nicht wie ein Trainingsprogramm, das zusätzliche Entscheidungen verlangt.

**Priorisierung:** P0 = kritisch / zuerst, P1 = hoher Produktnutzen, P2 = sinnvoller Ausbau, P3 = später. Die Roadmap ist bewusst auf Vereinfachung, Sicherheit und Alltagstauglichkeit ausgerichtet.

Abgehakt ist nur, was umgesetzt **und** geprüft wurde. Hinweise zu Grenzen stehen am Punkt.

---

## 1. Produktvision

Kernversprechen: **„Dein sanfter Begleiter für Bewegung und Erholung nach der Geburt.“**

- Die Startseite beantwortet sofort: Was ist heute sinnvoll?
- Die Nutzerin muss möglichst wenig nachdenken und auswählen.
- Ruhe und Regeneration werden genauso positiv behandelt wie Bewegung.
- Empfehlungen werden verständlich erklärt, ohne Diagnosen vorzugeben.
- Sicherheitsgrenzen sind sichtbar, klar und professionell formuliert.

## 2. Roadmap auf einen Blick

| Phase | Zeitraum | Ziel | Priorität |
|-------|----------|------|-----------|
| Phase 0 | Woche 1 | Sicherheit, UX-Basis und Produktfokus | P0 |
| Phase 1 | Woche 2–3 | Heute + Check-in radikal vereinfachen | P0 |
| Phase 2 | Woche 4–6 | Personalisierte Mikro-Einheiten & Workout-UX | P0/P1 |
| Phase 3 | Woche 7–9 | Symptom-/Wissensbereich & mentale Erholung | P1 |
| Phase 4 | Woche 10–12 | Fortschritt, Ziele und Inhalte professionalisieren | P1/P2 |
| Phase 5 | danach | Sync, Daten, Qualität, Wachstum | P2/P3 |

---

## 3. Phase 0 – Sicherheit & Fundament

Ziel: Bevor neue Features hinzukommen, muss klar sein, was die App verspricht und wo ihre Grenzen liegen.

### P0 – Produktfokus

- [x] Kernnavigation auf den Hauptpfad konzentrieren: Heute → Check-in → Empfehlung → Workout/Erholung. _(vier Tabs (Heute, Übungen, Mein Weg, Mehr); Check-in und Empfehlung direkt auf Heute, im Browser getestet)_
- [x] Alles, was nicht direkt Bewegung, Erholung oder Orientierung unterstützt, nachrangig behandeln. _(Rezepte, Ernährung, Termine, Export und Daten unter Mehr; auf Heute stehen sie unterhalb der Empfehlung)_
- [x] Keine zusätzlichen Gamification-Features wie Streaks, Punkte oder Kalorienziele einführen. _(per Test geprüft: keine Streaks, Punkte, Kalorien)_
- [x] „Mehr“ als sekundären Bereich beibehalten, aber Inhalte klar gruppieren. _(fünf Gruppen nach Lebenssituation, getestet)_

### P0 – Medizinische Sicherheit

- [ ] Red-Flag-Texte fachlich prüfen lassen. _(manuell: Hebamme/Ärztin; Entwurf und Prüffelder liegen vor)_
- [x] Klare Unterscheidung zwischen: beobachten, Hebamme/Ärztin kontaktieren, dringend abklären. _(drei Stufen in „Ist das normal?“ und bei Warnzeichen (Beobachten / kontaktieren / dringend), getestet)_
- [x] Für wichtige Inhalte Quelle, fachliche Rolle des Reviewers, Prüfdatum und Aktualisierungsstatus hinterlegen. _(Felder, Anzeige an den Inhalten und Seite „Inhalte und Prüfstatus“ umgesetzt; alle Inhalte sind noch Entwurf ohne Prüfer)_
- [x] Keine Diagnose- oder Therapieaussagen; Empfehlungen als Orientierung formulieren. _(Orientierungstexte mit Hinweis, Test gegen Befundsprache; Inhalte ungeprüft)_
- [x] Bei Warnsignalen immer einen eindeutigen nächsten Schritt anbieten. _(Kontakt-, Bereitschaftsdienst- oder Notruf-Schritt mit Anruf-Link, getestet)_

## 4. Phase 1 – „Heute“ neu denken

Ziel: Die Nutzerin soll innerhalb weniger Sekunden verstehen, was heute möglich ist.

### Neue Startseite

- [x] Header: „Heute“ + Woche nach Geburt.
- [x] Primäre Frage: „Wie geht es dir heute?“
- [x] Mini-Check-in statt Fragebogen. _(drei Fingertipps)_
- [x] Danach direkt eine Empfehlung: Bewegung, kurze Übung, Erholung oder professionelle Abklärung. _(direkt auf Heute, ohne Seitenwechsel)_
- [x] Kontext-Auswahl „Was ist gerade möglich?“ prominent platzieren. _(direkt in der Empfehlungskarte, wirkt sofort)_

### Kontext „Was ist gerade möglich?“

- [x] Baby schläft _(leise, ohne Ansagen und Gong, getestet)_
- [x] Baby auf dem Arm _(nur Einhand-Übungen, getestet)_
- [x] Eine Hand frei _(nur Einhand-Übungen)_
- [x] Ich habe 5 Minuten _(kurze Einheit)_
- [x] Ich bin komplett erschöpft _(kürzeste Erholung)_
- [x] Ich habe 10–20 Minuten und möchte etwas tun _(längere Einheit bei guter Energie, bei wenig Energie bleibt es sanft)_

### P0 – Mini-Check-in

- [x] Schritt 1: Energie 1–5.
- [x] Schritt 2: „Ist heute etwas anders oder auffällig?“ Ja/Nein.
- [x] Nur bei Ja: Schmerzen, Druckgefühl, Beschwerden und Red Flags vertiefen.
- [x] Letzte Einheit kurz bewerten: gut / okay / Beschwerden. _(wird nur gefragt, wenn es eine frühere Einheit gibt)_
- [x] Ziel: ca. 10–15 Sekunden für einen normalen Check-in. _(per Test: 2 bis 3 Fingertipps; echte Zeit per Nutzertest zu bestätigen)_

## 5. Phase 2 – Empfehlungen & Workout

Ziel: Die App soll nicht nur eine Einheit zeigen, sondern erklären, warum sie gerade passt.

### Empfehlungskarte

- [x] Klare Überschrift, z. B. „Heute passt eine sanfte 8-Minuten-Einheit.“ _(Dauer aus den gewählten Übungen berechnet)_
- [x] Darunter 1–2 verständliche Gründe: „Du hast wenig Energie“ / „Die letzte Einheit wurde gut vertragen“. _(höchstens zwei Gründe)_
- [x] Optional: „Warum?“ als aufklappbare Erklärung.
- [x] Alternative anbieten: „Heute nur 3 Minuten?“ oder „Heute lieber Erholung?“ _(höchstens zwei Alternativen)_

### Workout UX

- [x] „Übung wechseln“ und „Beschwerden“ nicht in einem Button kombinieren.
- [x] Separate Aktionen: „Leichtere Variante“, „Pause“, „Training beenden“, „Etwas stimmt nicht“. _(vier getrennte Knöpfe)_
- [x] Vor jeder Übung kurz erklären, worauf die Nutzerin achten soll. _(„Worauf du achten sollst“ für alle 33 Übungen (Entwurf))_
- [x] Bei Warnzeichen sofortige, ruhige Handlungsanweisung. _(Stopp, ruhige Ansage und Anweisung auf Heute, getestet)_
- [x] Nach dem Training: „Wie fühlt sich dein Körper jetzt an?“ statt nur Leistungsbewertung.
- [x] „Heute reicht das“ als positive Abschlussoption. _(auch beim vorzeitigen Beenden)_

## 6. Phase 3 – Fehlende Inhalte ergänzen

Ziel: Die App soll auch dann hilfreich sein, wenn die Nutzerin nicht trainieren möchte oder unsicher wegen eines Symptoms ist.

### P1 – „Ist das normal?“

Themen:

- [x] Wochenfluss / Blutungen _(Entwurf, ungeprüft)_
- [x] Schmerzen und Wundgefühl _(Entwurf, ungeprüft)_
- [x] Beckenboden und Druckgefühl _(Entwurf, ungeprüft)_
- [x] Bauch / Diastase / Spannungsgefühl _(Entwurf, ungeprüft)_
- [x] Kaiserschnittnarbe bzw. Geburtsverletzungen _(Entwurf, ungeprüft)_
- [x] Rücken- und Nackenbeschwerden _(Entwurf, ungeprüft)_
- [x] Brüste / Stillen _(Entwurf, ungeprüft)_
- [x] Müdigkeit und Erschöpfung _(Entwurf, ungeprüft)_
- [x] Verdauung und Wasserlassen _(Entwurf, ungeprüft)_
- [x] Schwindel / Kreislauf _(Entwurf, ungeprüft)_
- [x] Stimmung und emotionale Belastung _(Entwurf, ungeprüft)_

Muster und Haltung:

- [x] Jedes Thema nach demselben Muster: Was kann vorkommen? Was beobachten? Wann professionelle Hilfe? Wann dringend? _(per Test für alle 11 Themen)_
- [x] Nicht als Diagnose-Tool gestalten, sondern als Orientierung und Entscheidungshilfe. _(Hinweise und Test gegen Befundsprache; Inhalte ungeprüft)_

### P1 – Mentales Wohlbefinden

- [x] Kurzer optionaler Tagescheck: „Wie fühlst du dich heute?“ _(fünf Stufen, freiwillig)_
- [x] Gefühle normalisieren, ohne zu diagnostizieren. _(Seite „Wohlbefinden“ (Entwurf, ungeprüft))_
- [x] Hinweise auf Unterstützung durch Partner, Familie, Hebamme, Ärztin oder andere Vertrauenspersonen.
- [x] Bei auffälligen Antworten keine automatisierte Diagnose, sondern klarer Hinweis auf professionelle Unterstützung. _(bei drei schweren Tagen in Folge und jederzeit mit Notruf und Telefonseelsorge erreichbar, getestet)_

## 7. Phase 4 – Fortschritt & Personalisierung

### P1 – Persönliche Ziele

- [x] Beckenboden besser wahrnehmen _(sortiert Beckenboden-Übungen nach vorn)_
- [x] Rumpf/Core sanft stärken _(sortiert Rumpf-Übungen nach vorn)_
- [x] Rücken entlasten _(sortiert Rücken- und Nacken-Übungen nach vorn)_
- [x] Beweglichkeit verbessern _(sortiert Mobilisation nach vorn)_
- [x] Mehr Energie im Alltag _(sortiert Atmung und Alltagskraft nach vorn)_
- [x] Sicherheit und Vertrauen in den eigenen Körper _(sortiert leichte, vertraute Übungen nach vorn)_
- [x] Einfach wieder regelmäßig etwas für mich tun _(sortiert kurze Übungen nach vorn)_

### P1 – „Mein Weg“ statt Leistungsdashboard

- [x] Fortschritt als Entwicklung erzählen, nicht als Wettbewerb. _(Seite „Mein Weg“)_
- [x] Beispiele: Anzahl absolvierte Einheiten, Verträglichkeit, Bewegungsvielfalt, persönliche Meilensteine.
- [x] Keine Gewichtskurven oder Kalorien als zentrale Erfolgsmetriken. _(per Test geprüft)_
- [x] Streaks vermeiden, besonders im Wochenbett darf eine Pause ein Erfolg sein. _(„bewusst ausgeruht“ zählt als Erfolg)_

## 8. Phase 5 – Inhalte, Daten & Ausbau

### P2 – Inhalte

- [x] Tipps und Wochen-Orientierung in kurze, konkrete Karten umwandeln. _(„Diese Woche“ mit konkreten Schritten für heute; Tipps als Karten)_
- [x] Inhalte nach Lebenssituation statt nur nach Themen sortieren. _(Mehr gruppiert nach „Ich bin unsicher“, „Ich brauche Ruhe“ usw.)_
- [x] Rezepte und Ernährung als Unterstützung, nicht als zweites Hauptprodukt. _(nur unter Mehr, nicht in der Kernnavigation)_
- [ ] Termine und Export erst ausbauen, wenn der Kernpfad stabil ist. _(bewusst zurückgestellt, nicht ausgebaut)_

### P2 – Sync & Daten

- [x] Transparente Erklärung: Was wird gespeichert? Was wird synchronisiert? Was bleibt lokal? _(Seite „Deine Daten“)_
- [x] Export und Löschung leicht auffindbar machen. _(Mehr → Deine Daten, auch aus den Einstellungen verlinkt)_
- [x] Offline-Nutzung für den wichtigsten Kernpfad sicherstellen, soweit technisch möglich. _(Heute → Check-in → Empfehlung → Workout im Flugmodus getestet)_
- [x] Fehler beim Sync verständlich und handlungsorientiert erklären. _(Ursache und nächster Schritt je Fehlerklasse, getestet)_

---

## 9. Konkreter Ziel-Flow

```text
APP ÖFFNEN
↓
HEUTE
„Wie geht es dir?“
↓
MINI-CHECK-IN
↓
SICHERHEIT OK?
→ Nein: Orientierung + professionelle Hilfe
→ Ja: „Was ist gerade möglich?“
↓
3 / 5 / 10 / 20 MINUTEN
↓
PASSENDE EINHEIT ODER ERHOLUNG
↓
WORKOUT
↓
„Wie fühlt sich dein Körper jetzt an?“
↓
SPEICHERN + KLEINER FORTSCHRITT
↓
MORGEN WIEDER HEUTE
```

## 10. Backlog nach Priorität

| Priorität | Feature | Nutzen |
|-----------|---------|--------|
| P0 | Mini-Check-in | Weniger Aufwand täglich |
| P0 | Red-Flag-Flow | Sicherheit + klare nächste Schritte |
| P0 | Heute als zentraler Einstieg | Weniger Navigation |
| P0 | „Was ist gerade möglich?“ | Passt zum echten Alltag |
| P0 | Workout-Aktionen trennen | Weniger Fehlbedienung |
| P0 | Fachliche Prüfung der Sicherheitstexte | Vertrauen + Risikoreduktion |
| P1 | „Ist das normal?“ | Orientierung bei Beschwerden |
| P1 | Mentales Wohlbefinden | Ganzheitlichere Begleitung |
| P1 | Persönliche Ziele | Bessere Personalisierung |
| P1 | „Mein Weg“ | Motivation ohne Leistungsdruck |
| P2 | Inhalts-Redesign | Bessere Auffindbarkeit |
| P2 | Sync/Daten-UX | Vertrauen und Kontrolle |
| P3 | Social/Gamification | Nicht notwendig für Kernnutzen |

## 11. Erfolgsmetriken

- [x] Time-to-value: Wie schnell erreicht eine neue Nutzerin eine passende Empfehlung? _(per Test: 2 Fingertipps nach dem Onboarding; siehe docs/metrics.md)_
- [ ] Check-in-Abschlussrate. _(nicht erhoben, siehe docs/metrics.md (kein Tracking))_
- [ ] Anteil der Nutzerinnen, die nach dem Check-in eine sinnvolle Empfehlung erhalten. _(als Unit-Test abgesichert; Messung über Nutzerinnen nicht erhoben, siehe docs/metrics.md)_
- [ ] Workout-Abbruchrate und Grund des Abbruchs. _(nicht erhoben, siehe docs/metrics.md)_
- [ ] Anteil der Nutzerinnen, die nach einer Einheit „gut/okay“ angeben. _(nicht erhoben, siehe docs/metrics.md)_
- [ ] Wiederkehr nach 1, 7 und 28 Tagen. _(nicht erhoben, siehe docs/metrics.md)_
- [ ] Anteil der Tage, an denen Erholung bewusst gewählt wird (nicht als Misserfolg werten). _(für die Nutzerin selbst in „Mein Weg“ sichtbar; Auswertung über Nutzerinnen nicht erhoben)_
- [ ] Anzahl sicher eskalierter Red-Flag-Fälle. _(nicht erhoben, siehe docs/metrics.md)_

## 12. Definition of Done für den nächsten großen Release

- [ ] Eine neue Nutzerin versteht die App nach dem ersten Öffnen ohne Erklärung. _(nur per Nutzertest zu bestätigen)_
- [x] Ein normaler Check-in dauert ungefähr 10–15 Sekunden. _(2 bis 3 Fingertipps; echte Zeit per Nutzertest zu bestätigen)_
- [x] Die App bietet nach dem Check-in genau eine klare Hauptempfehlung plus maximal zwei Alternativen. _(getestet)_
- [x] Bei Warnzeichen ist der nächste Schritt eindeutig. _(getestet)_
- [x] Jede Übung kann sicher vereinfacht oder beendet werden. _(„Leichtere Variante“ (oder einfachste Stufe) und „Training beenden“ immer möglich)_
- [x] Erholung wird als legitime Empfehlung behandelt. _(„Heute lieber Erholung?“, Erholung zählt in „Mein Weg“)_
- [ ] Sicherheitstexte und zentrale Inhalte sind fachlich geprüft und versioniert. _(versioniert (Git, Prüffelder), aber noch nicht fachlich geprüft)_
- [x] Die Nutzerin versteht, warum sie eine Empfehlung erhält. _(Gründe auf der Karte plus „Warum?“)_
- [ ] Die App fühlt sich auch an einem chaotischen Tag mit Baby hilfreich an. _(Baby-Kontexte, kurze Einheiten und Erholung umgesetzt; Urteil nur per Nutzertest)_

## 13. Was bewusst NICHT auf die nächste Roadmap gehört

- Streaks und tägliche Pflichtziele
- Kalorien- und Gewichtsoptimierung
- Komplexe Leistungsrankings
- Social Feed / Community als Selbstzweck
- Noch mehr Inhalte ohne bessere Auffindbarkeit
- Komplexe KI-Trainingspläne vor einer stabilen Sicherheits- und UX-Basis
- Weitere Navigationsebenen, bevor der Kernpfad vereinfacht ist

**Empfohlene Reihenfolge:** erst Sicherheit und Vereinfachung, dann Personalisierung, danach Inhalte und Ausbau. Der größte Produktgewinn liegt aktuell nicht in mehr Funktionen, sondern darin, vorhandene Funktionen im richtigen Moment automatisch und verständlich anzubieten.
