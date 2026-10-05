# Medizinisches Sicherheitskonzept (Phase 0.1) – ENTWURF

> **Status: Entwurf, fachlich nicht geprüft.** Alle Inhalte müssen vor echter Nutzung von Hebamme, Beckenboden-Physiotherapeutin und ggf. Gynäkologin geprüft werden (siehe `content-governance.md`).

Die App ist **keine Diagnostik- oder Therapie-App**. Sie gibt Bewegungs- und Alltagsvorschläge und erkennt, wann sie *keine* Empfehlung geben soll.

## 1. Red-Flag-System

Red Flags sind Situationen, in denen die App **kein Training und keine „leichtere Übung“** anbietet, sondern stoppt und auf medizinische Abklärung hinweist.

| ID | Red Flag | Erfassung (Readiness-/Symptom-Check) | Kontext |
|----|----------|---------------------------------------|---------|
| `bleeding` | ungewöhnlich starke oder zunehmende Blutung | Ja/Nein | immer |
| `fever` | Fieber | Ja/Nein | immer |
| `pain_increasing` | zunehmender starker Schmerz | Schmerzskala „stark“ oder „zunehmend“ | immer |
| `wound_problem` | Auffälligkeiten an Kaiserschnitt- oder Geburtsverletzungsstelle | Ja/Nein | v. a. Kaiserschnitt / Dammverletzung |
| `breathing_chest` | Atemnot oder Brustschmerzen | Ja/Nein | immer, **Notruf-Hinweis** |
| `leg_swelling` | einseitige Schwellung / starke Schmerzen im Bein | Ja/Nein | immer, **dringend** |
| `pelvic_pressure_severe` | ausgeprägtes Druck- oder Fremdkörpergefühl im Becken | Ja/Nein | immer |
| `symptom_worsening` | neue oder deutliche Verschlechterung von Beschwerden | Ja/Nein / Verlauf | immer |

Dringlichkeitsstufen der Hinweise (Formulierung fachlich zu prüfen):

- `emergency` – `breathing_chest` (und ggf. starke Blutung): Hinweis auf Notruf.
- `urgent` – `leg_swelling`, `fever`, `bleeding`, `wound_problem`: zeitnah ärztlich abklären.
- `consult` – übrige: Hebamme/Ärztin ansprechen.

Regeln:

1. Eine einzige gemeldete Red Flag genügt für Status **Rot**.
2. Red Flags können nicht durch andere Eingaben (z. B. hohe Energie) übersteuert werden.
3. Nach Rot gibt es keine Trainingsvorschläge, bis die Nutzerin aktiv bestätigt, dass die Beschwerden abgeklärt bzw. abgeklungen sind (Wortlaut zu prüfen). Auch dann beginnt sie auf der niedrigsten Stufe.
4. Die App formuliert keine Diagnose („Das könnte eine Thrombose sein“), sondern nur: „Bitte lass das ärztlich abklären.“

## 2. Eskalationslogik

```text
Grün  → normale Tagesform                         → geplante Einheit
Gelb  → leichte Beschwerden / starke Erschöpfung  → Recovery oder leichtere Variante
Rot   → Red Flag                                  → Training abbrechen, Abklärung empfehlen
```

Zuordnung (Eingaben siehe Readiness Check, Phase 8.1):

| Eingabe | Beitrag |
|---------|---------|
| Red Flag gemeldet | **Rot** |
| Schmerzen „stark“ | **Rot** (`pain_increasing`) |
| Schmerzen „mittel“ | Gelb |
| Druckgefühl „ja“ (nicht ausgeprägt) | Gelb, **keine Progression** |
| Energie 1–2 | Gelb |
| letzte Einheit „Beschwerden“ | Gelb |
| sonst | Grün |

Der Gesamtstatus ist das **Maximum** der Einzelbeiträge (Rot > Gelb > Grün). Während eines Workouts löst eine gemeldete Red Flag oder starker Schmerz sofortigen Abbruch aus.

Die Logik gehört in die zentrale Recommendation Engine (siehe Architekturregel in `roadmap.md`), nicht in die UI.

## 3. Keine Diagnosen

- Die App benennt keine Erkrankungen als Befund der Nutzerin (z. B. Rektusdiastase, Senkung, Thrombose).
- Zulässig: Beobachtungen dokumentieren („Doming beobachtet“, Messwert), Verlauf anzeigen, auf mögliche Abklärung hinweisen.
- Texte verwenden „kann“, „bitte abklären lassen“ statt Befundsprache.
- Dauerhafter Hinweis in der App: keine Diagnostik, ersetzt keine Hebamme, Physiotherapeutin oder Ärztin.

## 4. Kontraindikationen pro Übung

Jede Übung enthält verpflichtend (Erweiterung des Modells aus Phase 3.2):

```ts
type ExerciseSafety = {
  contraindications: Contraindication[]; // wann die Übung nicht angezeigt wird
  stopCriteria: StopCriterion[];         // wann während der Übung abgebrochen wird
  redFlags: RedFlagId[];                 // relevante Red Flags für diese Übung
  regressions: ExerciseId[];             // leichtere Varianten
  domingWarning: boolean;                // Hinweis bei Bauchwölbung
};

type Contraindication = {
  condition: 'cesarean_early' | 'pelvic_pressure' | 'pain' | 'doming' | 'no_medical_clearance' | string;
  minDaysSinceBirth?: number; // nur zusätzliche Bedingung, nie alleinige Freigabe
  note: string;
};
```

Regeln:

- Fehlen Sicherheitsfelder, wird die Übung **nicht** ausgespielt (Fail-closed).
- Abbruchkriterien (mindestens): Schmerz, Druck-/Fremdkörpergefühl im Becken, Urinverlust, sichtbares Doming, Schwindel.
- Jede Übung mit höherer Schwierigkeit hat mindestens eine Regression.
