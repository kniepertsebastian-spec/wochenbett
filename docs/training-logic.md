# Grundprinzip der Trainingslogik (Phase 0.3) – ENTWURF

## 1. Zeit seit Geburt ist keine alleinige Freigabe

Nicht: `Woche 6 = automatisch nächste Phase`.

```text
Zeit seit Geburt
+ Geburtsart
+ Beschwerden
+ bisherige Belastbarkeit
+ ggf. medizinische Freigabe
= heutige Trainingsoptionen
```

Die Zeit seit Geburt ist ein **Mindest-Kriterium** (Untergrenze), nie ein hinreichendes. Sie kann Optionen einschränken, aber nie allein erweitern.

## 2. Eingaben der Recommendation Engine

```ts
type UserState = {
  daysSinceBirth: number;
  birthType: 'vaginal' | 'cesarean' | 'unknown';
  medicalClearance: boolean;        // Freigabe durch Fachperson, selbst angegeben
  currentPhase: PhaseId;            // bisher erreichte Phase
  recentSymptoms: SymptomLog[];
  recentWorkouts: WorkoutResult[];  // inkl. Reaktion nach dem Training
};

type Readiness = {
  energy: 1 | 2 | 3 | 4 | 5;
  pain: 'none' | 'mild' | 'moderate' | 'severe';
  pelvicPressure: boolean;
  lastSession: 'good' | 'ok' | 'symptoms';
  redFlags: RedFlagId[];
};

type Recommendation =
  | { kind: 'stop'; reason: RedFlagId[] }            // Rot
  | { kind: 'recovery'; durationMin: 2 | 5 | 10 }    // Gelb / niedrige Energie
  | { kind: 'workout'; exercises: Exercise[]; allowProgression: boolean };

function recommend(user: UserState, readiness: Readiness, catalog: Exercise[]): Recommendation;
```

Architekturregel: `recommend()` ist eine reine Funktion in der Recommendation-Schicht, vollständig unit-testbar. Die UI entscheidet nie selbst über Freigaben.

## 3. Readiness-System

Vor dem Training (Details Phase 8.1):

```text
🟢 Heute normal       → geplante Einheit
🟡 Heute sanfter      → Recovery / leichtere Variante
🔴 Heute kein Workout → keine Einheit; bei Red Flag Abklärungshinweis
```

Die Ampel ergibt sich aus `safety-concept.md` §2 (Maximum der Einzelbeiträge). Die Nutzerin darf selbst immer **herabstufen**, nie eine Red-Flag-Sperre aufheben.

## 4. Regeln

1. Red Flag → `stop`, keine Übungen.
2. Druckgefühl → `allowProgression = false`.
3. Energie 1 → Recovery; Energie 3 → 5-Minuten-Einheit; Energie 5 → geplante Einheit (nur bei Grün).
4. Phasenwechsel braucht Zeit-Untergrenze **und** beschwerdefreie Einheiten **und** (falls nötig) Freigabe.
5. Unbekannte/fehlende Eingaben werden konservativ behandelt (Fail-closed).
