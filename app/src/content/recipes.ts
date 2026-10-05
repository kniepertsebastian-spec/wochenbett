import type { ContentMeta } from '../domain/types'

/** ENTWURF – Rezepte (Phase 12.3). Keine Therapie- oder Mangel-Empfehlung. */
export type RecipeTag = 'warm' | 'simple' | 'oneHandFriendly' | 'quick' | 'freezerFriendly' | 'proteinRich' | 'ironRich'

export type Recipe = {
  id: string
  title: string
  minutes: number
  tags: RecipeTag[]
  ingredients: string[]
  steps: string[]
  /** Lebensmittel mit Eisenquelle + Vitamin-C-Quelle in diesem Gericht */
  synergy?: string
  meta: ContentMeta
}

const meta: ContentMeta = { evidenceLevel: 'practical_tip', sources: [], status: 'draft', draftedAt: '2026-10-05', reviewDue: '2027-10-05', note: 'Entwurf: Nährstoffangaben prüfen.' }
const r = (x: Omit<Recipe, 'meta'>): Recipe => ({ ...x, meta })

export const recipes: Recipe[] = [
  r({ id: 'linsensuppe', title: 'Rote-Linsen-Suppe mit Paprika', minutes: 25, tags: ['warm', 'simple', 'freezerFriendly', 'ironRich', 'proteinRich'], ingredients: ['200 g rote Linsen', '1 Zwiebel', '1 rote Paprika', '1 l Gemüsebrühe', '1 EL Rapsöl', 'Saft einer halben Zitrone'], steps: ['Zwiebel und Paprika würfeln und im Öl anschwitzen.', 'Linsen und Brühe zugeben, 15 Minuten köcheln.', 'Pürieren oder stückig lassen, mit Zitronensaft abschmecken.', 'Portionsweise einfrieren.'], synergy: 'Linsen (Eisen) + Paprika und Zitrone (Vitamin C)' }),
  r({ id: 'haferbrei', title: 'Warmer Haferbrei mit Beeren und Walnüssen', minutes: 10, tags: ['warm', 'simple', 'quick', 'ironRich'], ingredients: ['50 g Haferflocken', '250 ml Milch oder Pflanzendrink', 'Handvoll Beeren', '1 EL gehackte Walnüsse'], steps: ['Haferflocken mit Milch aufkochen und 3 Minuten quellen lassen.', 'Mit Beeren und Walnüssen toppen.'] }),
  r({ id: 'ruehrei-spinat', title: 'Rührei mit Spinat auf Vollkornbrot', minutes: 10, tags: ['warm', 'quick', 'simple', 'proteinRich', 'ironRich'], ingredients: ['2 Eier', 'Handvoll Spinat (auch TK)', '1 Scheibe Vollkornbrot', '1 Tomate'], steps: ['Spinat kurz in der Pfanne zusammenfallen lassen.', 'Eier zugeben und stocken lassen.', 'Auf Brot anrichten, Tomate dazu.'] }),
  r({ id: 'kichererbsen-curry', title: 'Kichererbsen-Curry', minutes: 25, tags: ['warm', 'simple', 'freezerFriendly', 'ironRich', 'proteinRich'], ingredients: ['1 Dose Kichererbsen', '1 Dose Tomaten', '200 ml Kokosmilch', '1 Zwiebel', '1 EL Currypulver', 'Handvoll Spinat'], steps: ['Zwiebel anschwitzen, Curry zugeben.', 'Tomaten, Kokosmilch und Kichererbsen zugeben, 15 Minuten köcheln.', 'Spinat unterheben.'], synergy: 'Kichererbsen (Eisen) + Tomaten (Vitamin C)' }),
  r({ id: 'skyr-bowl', title: 'Skyr mit Beeren und Kürbiskernen', minutes: 3, tags: ['quick', 'simple', 'oneHandFriendly', 'proteinRich'], ingredients: ['200 g Skyr', 'Handvoll Beeren', '1 EL Kürbiskerne'], steps: ['Alles in eine Schale geben.', 'Mit einem Löffel essen.'] }),
  r({ id: 'overnight-oats', title: 'Overnight Oats im Glas', minutes: 5, tags: ['quick', 'simple', 'oneHandFriendly', 'ironRich'], ingredients: ['50 g Haferflocken', '150 ml Milch oder Pflanzendrink', '2 EL Joghurt', '1 TL Chiasamen', 'Obst nach Wahl'], steps: ['Zutaten abends im Glas mischen.', 'Über Nacht kühl stellen.', 'Morgens mit Obst essen.'] }),
  r({ id: 'hirse-pfanne', title: 'Hirse-Gemüse-Pfanne', minutes: 25, tags: ['warm', 'simple', 'ironRich'], ingredients: ['150 g Hirse', 'Gemüse nach Wahl (Paprika, Zucchini)', '1 Zwiebel', '1 EL Öl', 'Kräuter'], steps: ['Hirse nach Packungsangabe kochen.', 'Gemüse anbraten.', 'Alles vermengen und würzen.'], synergy: 'Hirse (Eisen) + Paprika (Vitamin C)' }),
  r({ id: 'rindfleisch-eintopf', title: 'Rindfleisch-Gemüse-Eintopf', minutes: 60, tags: ['warm', 'freezerFriendly', 'ironRich', 'proteinRich'], ingredients: ['400 g Rindfleisch in Würfeln', '3 Karotten', '3 Kartoffeln', '1 Zwiebel', '1 l Brühe'], steps: ['Fleisch anbraten.', 'Gemüse und Brühe zugeben.', '45 Minuten köcheln, portionsweise einfrieren.'] }),
  r({ id: 'lachs-ofen', title: 'Ofenlachs mit Kartoffeln und Brokkoli', minutes: 30, tags: ['warm', 'simple', 'proteinRich'], ingredients: ['2 Lachsfilets', '400 g Kartoffeln', '1 Brokkoli', '1 EL Rapsöl', 'Zitrone'], steps: ['Kartoffeln würfeln und 15 Minuten vorbacken.', 'Lachs und Brokkoli dazugeben, 12 bis 15 Minuten backen.', 'Mit Zitrone servieren.'] }),
  r({ id: 'energy-balls', title: 'Haferflocken-Mandel-Bällchen', minutes: 15, tags: ['oneHandFriendly', 'quick', 'freezerFriendly'], ingredients: ['100 g Haferflocken', '50 g Mandelmus', '2 EL Honig oder Dattelsirup', '1 EL Kakao', 'Prise Salz'], steps: ['Alles verkneten.', 'Kugeln formen.', 'Kühl lagern oder einfrieren.'] }),
  r({ id: 'tofu-pfanne', title: 'Tofu-Gemüse-Pfanne', minutes: 20, tags: ['warm', 'simple', 'proteinRich', 'ironRich'], ingredients: ['200 g Tofu', '1 Paprika', '1 Zucchini', 'Sojasauce', 'Reis oder Hirse'], steps: ['Tofu würfeln und knusprig anbraten.', 'Gemüse zugeben.', 'Mit Sojasauce würzen und mit Reis servieren.'], synergy: 'Tofu (Eisen) + Paprika (Vitamin C)' }),
  r({ id: 'kuerbissuppe', title: 'Kürbissuppe mit Kürbiskernen', minutes: 30, tags: ['warm', 'simple', 'freezerFriendly'], ingredients: ['1 kleiner Hokkaido', '1 Zwiebel', '700 ml Brühe', '100 ml Kokosmilch', '1 EL Kürbiskerne'], steps: ['Kürbis würfeln und mit Zwiebel anschwitzen.', 'Mit Brühe 15 Minuten garen, pürieren.', 'Mit Kokosmilch und Kernen servieren.'] }),
  r({ id: 'huettenkaese-brot', title: 'Hüttenkäse-Brot mit Paprika', minutes: 5, tags: ['quick', 'simple', 'oneHandFriendly', 'proteinRich'], ingredients: ['1 Scheibe Vollkornbrot', '3 EL Hüttenkäse', '½ Paprika'], steps: ['Brot bestreichen.', 'Paprika in Streifen darauf legen.'] }),
]

/** Wöchentliche Auswahl: rotiert deterministisch durch den Rezept-Pool (keine zufällige Generierung). */
export function weeklyRecipes(week: number, count = 5): Recipe[] {
  const out: Recipe[] = []
  for (let i = 0; i < Math.min(count, recipes.length); i++) out.push(recipes[(week * count + i) % recipes.length])
  return out
}
