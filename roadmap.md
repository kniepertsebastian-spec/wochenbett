# Postpartum Rückbildungs-PWA – Roadmap

## Ziel der Anwendung

Die Anwendung soll Frauen nach der Geburt dabei unterstützen, schrittweise wieder Bewegung, Körperwahrnehmung und Alltagsbelastbarkeit aufzubauen.

Die App ist **keine Diagnostik- oder Therapie-App**. Sie soll Übungen, Alltagstipps, Ernährungsideen und Recovery-Angebote bereitstellen und gleichzeitig erkennen, wann eine Nutzerin eine Pause machen oder medizinische bzw. therapeutische Unterstützung suchen sollte.

Grundprinzip:

> **Nicht „mehr Training“ ist das Ziel, sondern eine sichere und nachhaltige Rückkehr zu Belastbarkeit und Wohlbefinden.**

Die Empfehlungen sollten sich daher nicht ausschließlich an der Anzahl der Wochen seit der Geburt orientieren. Die WHO empfiehlt für die Zeit nach der Geburt einen schrittweisen Aufbau von Bewegung und weist insbesondere bei Komplikationen und nach Kaiserschnitt auf die Notwendigkeit individueller medizinischer Beratung hin.

---

# Phase 0 – Medical Safety, Konzept & fachliche Grundlage

Diese Phase kommt bewusst **vor die technische Implementierung**.

Die App bewegt sich im Gesundheitsbereich. Deshalb sollte zuerst definiert werden, welche Empfehlungen die App überhaupt geben darf und wann sie keine Empfehlung geben sollte.

## 0.1 Medizinisches Sicherheitskonzept

- [ ] **Red-Flag-System definieren** _(Entwurf liegt vor: docs/safety-concept.md, noch nicht geprüft)_
  - ungewöhnlich starke oder zunehmende Blutung
  - Fieber
  - zunehmender starker Schmerz
  - auffällige Probleme an einer Kaiserschnitt- oder Geburtsverletzungsstelle
  - Atemnot oder Brustschmerzen
  - einseitige Schwellung bzw. starke Schmerzen im Bein
  - ausgeprägtes Druck- oder Fremdkörpergefühl im Becken
  - neue oder deutliche Verschlechterung von Beschwerden

  **Erklärung:** Red Flags sind Situationen, bei denen die App nicht einfach eine leichtere Übung anbieten sollte. Stattdessen soll sie das Training stoppen und auf medizinische Abklärung hinweisen. Die konkrete Definition sollte fachlich geprüft werden.

- [ ] **Eskalationslogik definieren** _(Entwurf liegt vor: docs/safety-concept.md, noch nicht geprüft)_

  ```text
  Grün:
  normale Tagesform
      ↓
  normales Training

  Gelb:
  leichte Beschwerden / starke Erschöpfung
      ↓
  Recovery oder leichtere Variante

  Rot:
  Red Flag
      ↓
  Training abbrechen
      ↓
  medizinische Abklärung empfehlen
  ```

  **Erklärung:** Die App benötigt unterschiedliche Reaktionen auf unterschiedliche Belastungszustände.

- [ ] **Keine Diagnosen durch die App** _(Entwurf liegt vor: docs/safety-concept.md, noch nicht geprüft)_

  **Erklärung:** Die App darf beispielsweise nicht behaupten, dass eine Nutzerin eine Rektusdiastase oder andere Erkrankung hat. Sie darf nur Beobachtungen dokumentieren und auf mögliche Abklärungen hinweisen.

- [ ] **Kontraindikationen pro Übung definieren** _(Entwurf liegt vor: docs/safety-concept.md, noch nicht geprüft)_

  **Erklärung:** Jede Übung erhält Sicherheitsinformationen, Abbruchkriterien sowie mögliche Regressionen.

---

## 0.2 Medizinische Review-Struktur

- [ ] **Jeden medizinisch relevanten Content mit Quelle versehen** _(Entwurf liegt vor: docs/content-governance.md, noch nicht geprüft)_

  **Erklärung:** Übungen, Red Flags, Beckenbodeninformationen und Ernährungsempfehlungen sollten nachvollziehbar sein.

- [ ] **Review-Datum hinterlegen** _(Entwurf liegt vor: docs/content-governance.md, noch nicht geprüft)_

  Beispiel:

  ```json
  {
    "reviewedAt": "2026-10-01",
    "reviewDue": "2027-10-01"
  }
  ```

- [ ] **Evidence-Level einführen** _(Entwurf liegt vor: docs/content-governance.md, noch nicht geprüft)_

  ```text
  strong
  moderate
  limited
  practical_tip
  ```

  **Erklärung:** Damit lässt sich unterscheiden zwischen gut belegten Empfehlungen und eher praktischen Alltagstipps.

- [ ] **Fachliche Prüfung organisieren** _(Checkliste: docs/content-governance.md §4, manuell)_

  **Erklärung:** Vor einer ernsthaften Nutzung sollten die medizinischen Inhalte idealerweise durch Hebamme, Physiotherapeutin mit Schwerpunkt Beckenboden/Rückbildung und ggf. Gynäkologin geprüft werden.

---

## 0.3 Grundprinzip der Trainingslogik

- [ ] **Zeit seit Geburt nicht als alleinige Freigabe verwenden** _(Entwurf liegt vor: docs/training-logic.md, noch nicht geprüft)_

  Nicht:

  ```text
  Woche 6 = automatisch nächste Phase
  ```

  Sondern:

  ```text
  Zeit seit Geburt
  +
  Geburtsart
  +
  Beschwerden
  +
  bisherige Belastbarkeit
  +
  ggf. medizinische Freigabe
  =
  heutige Trainingsoptionen
  ```

- [ ] **Readiness-System definieren** _(Entwurf liegt vor: docs/training-logic.md, noch nicht geprüft)_

  **Erklärung:** Vor dem Training werden Tagesform, Energie, Beschwerden und Reaktion auf die letzte Einheit abgefragt.

  Beispiel:

  ```text
  🟢 Heute normal
  🟡 Heute sanfter
  🔴 Heute kein Workout
  ```

---

# Phase 1 – Projektgrundgerüst & technische Basis

## 1.1 Frontend-Projekt initialisieren

- [x] **Vite + React + TypeScript aufsetzen** _(in `app/`, Build + Typecheck geprüft)_

  **Erklärung:** Vite übernimmt Development und Build-Prozess. React bildet die UI-Komponenten. TypeScript sorgt für typisierte Datenmodelle.

- [x] **Tailwind CSS integrieren** _(Tailwind v4 via Vite-Plugin; Safe-Area-Utilities, Dark Mode, Reduced Motion; Build + Lint geprüft)_

  **Erklärung:** Für schnelles Erstellen eines mobilen UI-Systems mit Safe Areas, Dark Mode, Accessibility und konsistenten Abständen.

- [ ] **UI-Grundsystem definieren**

  Wiederverwendbare Komponenten:

  ```text
  Button
  Card
  BottomNavigation
  ProgressBar
  ExerciseCard
  Timer
  Modal
  WarningBanner
  CheckIn
  ```

---

# Phase 2 – PWA & Docker-Infrastruktur

## 2.1 PWA einrichten

- [ ] **vite-plugin-pwa integrieren**

  **Erklärung:** Damit wird die Webanwendung installierbar und kann Offline-Funktionen nutzen.

- [ ] **Web App Manifest konfigurieren**

  ```text
  name
  short_name
  description
  icons
  theme_color
  background_color
  display: standalone
  ```

- [ ] **Maskable Icons erstellen**

  **Erklärung:** Sorgt für korrekte App-Icons auf unterschiedlichen Plattformen.

- [ ] **iOS-spezifische PWA-Anpassungen**

  - `viewport-fit=cover`
  - Safe Areas
  - Statusbar-Verhalten
  - Homescreen-Icon
  - Splashscreen-Verhalten

---

## 2.2 Docker-Containerisierung

- [ ] **Multi-Stage-Dockerfile**

  ```text
  Node
  ↓
  npm install
  ↓
  npm run build
  ↓
  Nginx Alpine
  ↓
  fertige statische Dateien
  ```

  **Erklärung:** Der Produktionscontainer bleibt dadurch klein und enthält nur die für den Betrieb benötigten Dateien.

- [ ] **Nginx konfigurieren**

  ```nginx
  try_files $uri $uri/ /index.html;
  ```

  **Erklärung:** Dadurch funktionieren SPA-Routen auch beim direkten Aufruf.

- [ ] **Caching-Regeln definieren**

  **Erklärung:** Statische Assets können lange gecacht werden. Service Worker und Manifest müssen dagegen kontrolliert aktualisiert werden.

- [ ] **docker-compose.yml**

  **Erklärung:** Ermöglicht einfachen lokalen Betrieb und späteres Deployment auf NAS oder Server.

---

## 2.3 HTTPS-Infrastruktur

- [ ] **HTTPS bereitstellen**

  Mögliche Lösungen:

  - Caddy
  - Traefik
  - Nginx Proxy Manager
  - Cloudflare Tunnel

- [ ] **PWA auf echtem Smartphone testen**

  **Erklärung:** Viele PWA-, Audio-, Wake-Lock- und Installationsfunktionen müssen auf einem echten Gerät getestet werden.

---

# Phase 3 – Datenbasis & Content-Pipeline

## 3.1 Übungs-Datensatz

- [ ] **Bestehendes Fitness-Repo bereinigen**

  Zunächst ungeeignete Übungen entfernen, beispielsweise:

  - Crunches
  - Full Planks
  - Leg Raises
  - Jumps
  - hochintensive Übungen

  **Erklärung:** Die konkrete Freigabe einzelner Übungen sollte fachlich geprüft werden.

- [ ] **20–25 Basisübungen kuratieren**

  Beispielsweise:

  - Glute Bridge
  - Clamshell
  - Bird Dog
  - Pelvic Tilt
  - sanfte Dead-Bug-Varianten
  - Mobilisationsübungen
  - Atem-/Koordinationsübungen

---

## 3.2 Übungen als strukturierte Daten modellieren

Jede Übung erhält beispielsweise:

```text
id
name
description
instructions
breathing
targetMuscles
difficulty
duration
repetitions
phase
regressions
progressions
contraindications
redFlags
domingWarning
equipment
oneHandFriendly
audioCues
```

**Erklärung:** Dadurch kann die App später automatisch passende Übungen auswählen und anhand von Nutzerzustand und Sicherheitslogik filtern.

---

## 3.3 Übungs-Progressionen

- [ ] **Regression → Basis → Progression modellieren**

  Beispiel:

  ```text
  Pelvic Tilt
      ↓
  Glute Bridge
      ↓
  Marching Bridge
  ```

- [ ] **Automatische Regression ermöglichen**

  **Erklärung:** Wenn die Nutzerin bei einer Übung Probleme meldet, kann automatisch eine leichtere Variante angeboten werden.

---

# Phase 4 – Beckenboden & Körperwahrnehmung

## 4.1 Beckenboden-Modul

- [ ] **Beckenboden-Wahrnehmung**

  **Erklärung:** Nicht nur Anspannung, sondern auch Wahrnehmung und Koordination sollen vermittelt werden.

- [ ] **Anspannung und Entspannung**

  **Erklärung:** Die App soll nicht ausschließlich möglichst starke Kontraktion fördern.

- [ ] **Atmung + Beckenboden**

  **Erklärung:** Atemmuster und Bewegung werden miteinander verbunden.

- [ ] **Alltagssituationen**

  - Husten
  - Niesen
  - Lachen
  - Heben
  - Aufstehen
  - Toilettengang

- [ ] **Symptom-Tracking**

  Beispielsweise:

  - Urinverlust
  - Druckgefühl
  - Schweregefühl
  - Schmerzen
  - Probleme beim Stuhlgang

---

# Phase 5 – Lokale Persistenz & Privacy by Design

## 5.1 IndexedDB

- [ ] **Dexie.js integrieren**

  **Erklärung:** IndexedDB dient als lokale Datenbank. Dexie vereinfacht die Arbeit mit IndexedDB.

- [ ] **Datenmodell definieren**

  ```text
  userProfile
  userProgress
  exerciseHistory
  workoutHistory
  readinessChecks
  symptomLogs
  diastasisLogs
  dailyHabits
  savedRecipes
  savedTips
  appSettings
  ```

---

## 5.2 Datenschutz

- [ ] **Gesundheitsdaten ausschließlich lokal speichern**

- [ ] **Keine Gesundheitsdaten in URLs**

- [ ] **Keine unnötigen Analytics**

- [ ] **Keine Pflicht zur Registrierung**

- [ ] **Lokale Daten löschen können**

- [ ] **Export/Import**

  Beispiel:

  ```text
  Export
  ↓
  JSON/PDF
  ↓
  lokal speichern oder an Fachperson weitergeben
  ```

---

## 5.3 Datenbank-Versionierung

- [ ] **Schema-Versionen definieren**

  **Erklärung:** Bei Änderungen am Datenmodell werden bestehende Daten migriert, anstatt verloren zu gehen.

---

# Phase 6 – Offline-First

## 6.1 Service Worker

- [ ] **App Shell cachen**

- [ ] **Workout-Inhalte offline verfügbar**

- [ ] **Audio offline verfügbar**

- [ ] **Übungsbilder/GIFs/SVGs offline verfügbar**

- [ ] **Rezepte offline verfügbar**

---

## 6.2 Caching-Strategie

```text
App Shell
→ StaleWhileRevalidate

Übungsmedien
→ CacheFirst

Audio
→ CacheFirst

Content
→ StaleWhileRevalidate

Service Worker
→ kontrolliertes Update
```

- [ ] **Offline-Fallback**

  **Erklärung:** Die App soll bei fehlender Internetverbindung nicht einfach eine Browser-Fehlerseite anzeigen.

---

# Phase 7 – Core Workout Experience

## 7.1 Workout-Player

- [ ] **Workout starten**
- [ ] **Pause**
- [ ] **Überspringen**
- [ ] **Zurück**
- [ ] **Fortschrittsanzeige**
- [ ] **Übung wechseln**

---

## 7.2 Screen Wake Lock

- [ ] **Display während des Workouts aktiv halten**

  **Erklärung:** Das Smartphone soll sich während einer Übung nicht automatisch sperren.

- [ ] **Fallback implementieren**

  **Erklärung:** Falls der Browser Wake Lock nicht unterstützt, muss die App trotzdem benutzbar bleiben.

---

## 7.3 Hands-Free Audio

- [ ] **Audio-Cues**

  Beispiele:

  > „Einatmen.“

  > „Ausatmen und Bewegung starten.“

  > „Noch drei Wiederholungen.“

- [ ] **Timer und Gongs**
- [ ] **Vibration/Haptik optional**
- [ ] **Screenless Mode**

  **Erklärung:** Die Nutzerin soll ein Workout möglichst vollständig durchführen können, ohne ständig auf das Smartphone zu schauen.

---

## 7.4 One-Thumb UX

- [ ] **Alle Kernaktionen im unteren Bildschirmbereich**
- [ ] **Touch Targets ausreichend groß**
- [ ] **Keine wichtigen Funktionen ausschließlich über kleine Icons**

---

# Phase 8 – Adaptive Trainingslogik

## 8.1 Readiness Check

Beispiel:

```text
Wie fühlst du dich?

Energie:
○ 1 ○ 2 ○ 3 ○ 4 ○ 5

Schmerzen:
○ keine ○ leicht ○ mittel ○ stark

Druckgefühl:
○ nein ○ ja

Letzte Einheit:
○ gut ○ okay ○ Beschwerden
```

**Erklärung:** Der Tageszustand beeinflusst die Empfehlung.

---

## 8.2 Dynamische Trainingsintensität

```text
guter Tag
→ geplante Einheit

erschöpfter Tag
→ kurze Einheit

Beschwerden
→ Recovery

Red Flag
→ kein Workout
```

---

## 8.3 Post-Workout-Check

- [ ] **Direkte Reaktion erfassen**
- [ ] **Reaktion am nächsten Tag berücksichtigen**
- [ ] **Übungen automatisch regressieren**

**Erklärung:** Nicht nur die absolvierte Einheit zählt, sondern auch die Reaktion des Körpers darauf.

---

# Phase 9 – Wochenbett-Dailies & Recovery

## 9.1 Recovery-Bibliothek

### 2 Minuten

- Atemübung
- Positionierung
- Entspannung

### 5 Minuten

- Mobilität
- Beckenboden
- sanfte Core-Aktivierung

### 10 Minuten

- vollständige Recovery-Einheit

---

## 9.2 Anti-Streak-System

- [ ] **Keine Bestrafung bei Pausentagen**

Nicht:

```text
🔥 Streak verloren
```

Sondern:

```text
12 Einheiten abgeschlossen
```

**Erklärung:** Pausentage sind ein normaler Bestandteil der Regeneration.

---

## 9.3 Energieabhängige Empfehlungen

```text
Energie 1/5
→ Recovery

Energie 3/5
→ 5-Minuten-Einheit

Energie 5/5
→ geplante Einheit
```

---

# Phase 10 – Sicherheits-Guardrails

## 10.1 Geburtsart

- [ ] **Spontangeburt / Kaiserschnitt**

**Erklärung:** Die Geburtsart ist ein Eingangssignal für die individuelle Trainingslogik, sollte aber nicht allein darüber entscheiden, was erlaubt ist.

---

## 10.2 Rektusdiastase

- [ ] **Selbstbeobachtung statt Diagnose**
- [ ] **Visuelle Anleitung**
- [ ] **Doming beobachten**
- [ ] **Messwerte dokumentieren**
- [ ] **Verlauf darstellen**

**Erklärung:** Die App unterstützt die Dokumentation, ersetzt aber keine professionelle Untersuchung.

---

## 10.3 Phasen-Lock

Nicht:

```text
6 Wochen → Phase 2
```

Sondern:

```text
Zeit seit Geburt
+
individuelle Voraussetzungen
+
Beschwerden
+
ggf. medizinische Freigabe
```

**Erklärung:** Phasen werden anhand mehrerer Kriterien freigeschaltet.

---

# Phase 11 – Baby- und Alltagssituationen

## 11.1 Baby-Modus

Eigene Einstiegsmöglichkeiten:

```text
👶 Baby schläft
🤱 Baby auf dem Arm
🖐 Eine Hand frei
😴 Komplett erschöpft
⏱ Nur 5 Minuten
```

**Erklärung:** Die App wird an den tatsächlichen Alltag mit Baby angepasst.

---

## 11.2 Einhand-Übungen

- [ ] Übungen nach `oneHandFriendly` filtern
- [ ] geeignete Übungen für Situationen mit Baby kennzeichnen

**Erklärung:** Für jede einzelne Übung muss separat geprüft werden, ob sie in dieser Situation sicher ist.

---

## 11.3 Alltags-Micro-Habits

Beispiele:

- über die Seite aufstehen
- ergonomisch heben
- beim Husten/Niesen bewusst reagieren
- Lasten näher am Körper halten
- Pausen einbauen

---

# Phase 12 – Ernährung & Rezepte

## 12.1 Mikronährstoff-Lexikon

- [ ] **50–60 Lebensmittel**

Mögliche Kategorien:

- Eisen
- Vitamin C
- Zink
- Magnesium
- Omega-3
- Protein
- weitere relevante Nährstoffe

---

## 12.2 Evidenzbasierte Content-Struktur

```text
food
nutrient
claim
evidenceLevel
source
preparationTip
reviewedAt
```

**Erklärung:** Ernährungstipps sollen nachvollziehbar sein und nicht versehentlich als medizinische Therapieempfehlung erscheinen.

---

## 12.3 Rezept-Pipeline

- [ ] **Wöchentliche Rezepte generieren**

Eigenschaften:

```text
warm
simple
oneHandFriendly
quick
freezerFriendly
proteinRich
ironRich
```

- [ ] **Nährstoff-Synergien kennzeichnen**

  Beispiel:

  ```text
  Eisenquelle
  +
  Vitamin-C-Quelle
  ```

  **Erklärung:** Solche Angaben sollten fachlich geprüft und nicht überinterpretiert werden.

---

# Phase 13 – Gamechanger / ProTips

## 13.1 ProTips-Datenbank

```text
protips.json
```

Kategorien:

```text
sneaky_exercise
toddler_hack
nutrition_shortcut
mindset
recovery
everyday_life
```

---

## 13.2 Personalisierung

Beispiel:

```text
Energie niedrig
→ 0-Minuten-Recovery-Tipp

Baby unruhig
→ Alltagstipp

wenig Zeit
→ 2-Minuten-Tipp
```

---

# Phase 14 – Kalender & Verlauf

## 14.1 Wochenbett-Timeline

```text
Geburt
│
├── Woche 1
├── Woche 2
├── Woche 3
├── ...
├── Woche 12
└── langfristiger Aufbau
```

**Erklärung:** Die Timeline dient als Orientierung und nicht als automatische medizinische Freigabe.

---

## 14.2 Termine

Optional:

- Hebammentermine
- gynäkologische Termine
- Nachuntersuchungen
- eigene Erinnerungen

---

## 14.3 Fortschrittsübersicht

Nicht primär:

```text
Gewicht
Kalorien
Streak
```

Sondern:

```text
Übungseinheiten
Recovery-Tage
Symptomverlauf
Alltagsbelastbarkeit
Körperwahrnehmung
abgeschlossene Micro-Habits
```

---

# Phase 15 – Accessibility

- [ ] **VoiceOver-Unterstützung**
- [ ] **TalkBack-Unterstützung**
- [ ] **Reduced Motion**
- [ ] **Kontrast prüfen**
- [ ] **Nicht ausschließlich Farbe verwenden**
- [ ] **Große Touchflächen**
- [ ] **Screenreader-kompatible Timer**
- [ ] **Audio vollständig optional**

---

# Phase 16 – Export & Kommunikation mit Fachpersonen

## 16.1 Diastase-/Symptom-Export

- [ ] **PDF/Text-Export**

Beispielsweise:

```text
Zeitraum
Übungen
Beschwerden
Messwerte
Verlauf
```

---

## 16.2 Datenschutzfreundlicher Export

**Erklärung:** Der Export wird ausschließlich auf Wunsch erzeugt. Es erfolgt kein automatisches Hochladen.

---

## 16.3 Fachpersonen-Ansicht

Optional:

> „Zeige meiner Hebamme meinen Verlauf.“

**Erklärung:** Die Nutzerin entscheidet vollständig, welche Informationen exportiert werden.

---

# Phase 17 – Testing

## 17.1 Unit Tests

Testen von:

- Trainingslogik
- Readiness
- Phasenfreigaben
- Red Flags
- Progressionen
- Datenbank-Migrationen

---

## 17.2 Safety Tests

Beispiele:

```text
Kaiserschnitt + frühe Phase
→ ungeeignete Übungen nicht anzeigen

Red Flag
→ Workout stoppen

Druckgefühl
→ keine automatische Progression

Doming
→ Regression anbieten

starke Erschöpfung
→ Recovery anbieten
```

---

## 17.3 Offline Testing

- [ ] Flugmodus
- [ ] App neu laden
- [ ] PWA komplett schließen
- [ ] wieder öffnen
- [ ] Workout starten
- [ ] Audio abspielen
- [ ] Daten speichern

**Erklärung:** Die App muss die vorgesehenen Offline-Funktionen auch ohne Internet zuverlässig ausführen.

---

## 17.4 Real-Life-Einhand-Test

Testablauf:

```text
Baby auf dem anderen Arm
↓
App öffnen
↓
Workout auswählen
↓
Start
↓
Pause
↓
Weiter
↓
Workout beenden
```

**Erklärung:** Jeder wichtige Vorgang muss mit einer Hand funktionieren.

---

## 17.5 Geräte-Testing

Mindestens:

```text
iPhone / Safari
Android / Chrome
kleines Smartphone
großes Smartphone
```

Zusätzlich:

- Dark Mode
- langsame Verbindung
- Offline
- installierte PWA
- nicht installierte Website

---

# Phase 18 – Performance & PWA Audit

- [ ] **Lighthouse Audit**
- [ ] **Bundle Size analysieren**
- [ ] **Lazy Loading**
- [ ] **Bilder optimieren**
- [ ] **Audio-Dateien optimieren**
- [ ] **Service-Worker-Cache überprüfen**
- [ ] **First Load optimieren**
- [ ] **Offline-Start testen**

---

# Phase 19 – Deployment

## 19.1 Produktionscontainer

```text
Source
 ↓
Docker Build
 ↓
Node Build Stage
 ↓
Nginx
 ↓
HTTPS Reverse Proxy
 ↓
PWA
```

---

## 19.2 Domain & HTTPS

- [ ] Domain konfigurieren
- [ ] SSL-Zertifikat
- [ ] Reverse Proxy
- [ ] HTTP → HTTPS Redirect
- [ ] Security Header

---

## 19.3 Installation auf Zielgeräten

- [ ] iPhone Safari → Zum Home-Bildschirm
- [ ] Android Chrome → App installieren
- [ ] App-Icon überprüfen
- [ ] Standalone-Modus überprüfen
- [ ] Safe Areas überprüfen

---

# Phase 20 – MVP-Abgrenzung

Für die erste funktionierende Version bewusst nicht alles gleichzeitig bauen.

## MVP

```text
✓ PWA
✓ Docker
✓ HTTPS
✓ IndexedDB
✓ Offline
✓ 15–20 Übungen
✓ Workout Player
✓ Audio-Cues
✓ Wake Lock
✓ Readiness Check
✓ Recovery-Modus
✓ Sicherheitslogik
✓ Basis-Beckenboden
✓ einfacher Fortschritt
✓ lokale Daten
```

## Version 1.1

```text
○ Rezepte
○ Ernährung
○ ProTips
○ Kalender
○ Baby-Modus
○ PDF-Export
```

## Version 1.2+

```text
○ adaptive Progression
○ umfangreiches Symptomtracking
○ Fachpersonen-Export
○ erweiterte Auswertungen
○ zusätzliche Trainingsprogramme
```

---

# Übergeordnete Architektur

Die App sollte konzeptionell aus fünf Schichten bestehen:

```text
┌──────────────────────────────────┐
│              UI                  │
│  Workout / Dashboard / Rezepte   │
└────────────────┬─────────────────┘
                 │
┌────────────────▼─────────────────┐
│       Recommendation Engine      │
│ Readiness / Progression / Safety │
└────────────────┬─────────────────┘
                 │
┌────────────────▼─────────────────┐
│          Domain Model            │
│ Exercise / Workout / Symptoms    │
│ Recipe / Progress / User State   │
└────────────────┬─────────────────┘
                 │
┌────────────────▼─────────────────┐
│        Local Persistence         │
│             Dexie                │
└────────────────┬─────────────────┘
                 │
┌────────────────▼─────────────────┐
│         PWA / Service Worker     │
│       Offline / Cache / Update   │
└──────────────────────────────────┘
```

## Zentrale Architekturregel

Die UI sollte **nicht selbst entscheiden**, ob eine Übung erlaubt ist.

Nicht:

```text
if (week > 6) showExercise()
```

Sondern:

```text
userState
+
exercise
+
readiness
+
symptoms
+
phase
↓
recommendation
```

Dadurch bleibt die Anwendung erweiterbar, testbar und die Sicherheitslogik ist zentral kontrollierbar.

---

# Leitprinzipien

### 1. Recovery vor Performance

Die Nutzerin soll nicht das Gefühl bekommen, sie müsse möglichst schnell wieder „fit“ werden.

### 2. Symptome vor Kalender

Eine Woche im Wochenbett ist kein ausreichender Indikator für individuelle Belastbarkeit.

### 3. Kleine Einheiten zählen

2 Minuten Bewegung sind besser als eine App, die nur 30-Minuten-Workouts anbietet.

### 4. Pausieren ist kein Versagen

Keine Streak-Bestrafung.

### 5. Lokale Daten

Gesundheitsinformationen bleiben möglichst auf dem Gerät.

### 6. Safety by Design

Sicherheit wird nicht nachträglich ergänzt, sondern ist Bestandteil des Datenmodells und der Recommendation Engine.

### 7. Fachperson statt App-Diagnose

Die App unterstützt die Nutzerin, ersetzt aber keine Hebamme, Physiotherapeutin oder Ärztin.

### 8. Alltag statt Fitnessstudio

Die App sollte für Situationen funktionieren, in denen ein Baby auf dem Arm liegt, nur fünf Minuten Zeit vorhanden sind oder die Nutzerin extrem müde ist.

### 9. Adaptiv statt linear

Die Nutzerin soll nicht einfach einen starren Trainingsplan abarbeiten. Die App soll auf ihren aktuellen Zustand reagieren.

### 10. Kein Druck

Der wichtigste Fortschritt ist nicht die Anzahl der absolvierten Workouts, sondern dass sich die Nutzerin im Alltag wieder sicherer und belastbarer fühlt.
