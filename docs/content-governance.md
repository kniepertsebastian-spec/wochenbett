# Medizinische Review-Struktur (Phase 0.2) – ENTWURF

## 1. Quellen- und Review-Pflicht

Jeder medizinisch relevante Inhalt (Übungen, Red Flags, Beckenboden-Infos, Ernährungsaussagen) trägt Metadaten:

```ts
type EvidenceLevel = 'strong' | 'moderate' | 'limited' | 'practical_tip';

type ContentMeta = {
  evidenceLevel: EvidenceLevel;
  sources: { title: string; url?: string; publisher?: string }[]; // Pflicht außer bei practical_tip
  status: 'draft' | 'reviewed';
  draftedAt: string;   // ISO-Datum
  reviewDue: string;   // ISO-Datum
  reviewedAt?: string; // Pflicht bei status 'reviewed'
  reviewedBy?: string; // Rolle der prüfenden Person, Pflicht bei 'reviewed'
};
```

(Umgesetzt in `app/src/domain/types.ts`, Validierung in `app/src/content/validate.ts`.)

Beispiel:

```json
{
  "evidenceLevel": "moderate",
  "sources": [{ "title": "WHO Guidelines on physical activity and sedentary behaviour", "publisher": "WHO" }],
  "reviewedAt": "2026-10-01",
  "reviewDue": "2027-10-01"
}
```

## 2. Evidence-Level

| Level | Bedeutung |
|-------|-----------|
| `strong` | gut belegt, z. B. Leitlinien / systematische Reviews |
| `moderate` | Studienlage vorhanden, aber begrenzt oder indirekt |
| `limited` | schwache Evidenz oder Expertenmeinung |
| `practical_tip` | Alltagstipp ohne Studienbasis; wird als solcher gekennzeichnet |

## 3. Regeln (durch Build/Tests erzwingbar)

1. Content ohne `evidenceLevel`, `reviewedAt` und `reviewDue` besteht die Validierung nicht.
2. Nicht-`practical_tip`-Content ohne Quelle besteht die Validierung nicht.
3. Content mit abgelaufenem `reviewDue` wird im Build gewarnt; bei Safety-Content (Red Flags, Kontraindikationen) schlägt der Build fehl.
4. Content ohne fachliche Prüfung (`reviewedBy` leer) wird als **Entwurf** markiert und in Produktions-Builds nicht ausgespielt.
5. Übungsfreigaben und Red-Flag-Texte werden ausschließlich in versionierten Dateien im Repo gepflegt, damit Änderungen nachvollziehbar sind.

## 4. Fachliche Prüfung organisieren (offen, manuell)

Zu klären durch die Projektverantwortliche – kann nicht von der App oder von Claude erledigt werden:

- [ ] Hebamme gewinnen (Red Flags, Eskalationstexte, Wochenbett-Inhalte)
- [ ] Physiotherapeutin Beckenboden/Rückbildung (Übungen, Kontraindikationen, Progressionen)
- [ ] ggf. Gynäkologin (Geburtsart, Kaiserschnitt-Regeln)
- [ ] Prüfumfang festlegen: `safety-concept.md`, Übungskatalog, Ernährungsaussagen
- [ ] Prüfergebnis dokumentieren (`reviewedBy`, `reviewedAt`)
