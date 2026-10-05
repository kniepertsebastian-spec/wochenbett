import type { ContentMeta } from '../domain/types'

/**
 * ENTWURF – Mikronährstoff-Lexikon (Phase 12). Nicht fachlich/ernährungswissenschaftlich geprüft.
 * Aussagen beschreiben typische Nährstoffquellen, KEINE Therapie- oder Dosisempfehlung.
 */
export type Nutrient = 'Eisen' | 'Vitamin C' | 'Zink' | 'Magnesium' | 'Omega-3' | 'Protein' | 'Calcium' | 'Jod' | 'Folat' | 'Ballaststoffe'

export type FoodEntry = {
  food: string
  nutrient: Nutrient
  claim: string
  preparationTip: string
  meta: ContentMeta
}

const meta: ContentMeta = {
  evidenceLevel: 'practical_tip',
  sources: [],
  status: 'draft',
  draftedAt: '2026-10-05',
  reviewDue: '2027-10-05',
  note: 'Entwurf: Werte und Quelle (z. B. Lebensmittelschlüssel) vor Veröffentlichung prüfen.',
}

const claims: Record<Nutrient, string> = {
  Eisen: 'Kann zur Eisenzufuhr beitragen.',
  'Vitamin C': 'Kann zur Vitamin-C-Zufuhr beitragen.',
  Zink: 'Kann zur Zinkzufuhr beitragen.',
  Magnesium: 'Kann zur Magnesiumzufuhr beitragen.',
  'Omega-3': 'Kann zur Zufuhr von Omega-3-Fettsäuren beitragen.',
  Protein: 'Kann zur Eiweißzufuhr beitragen.',
  Calcium: 'Kann zur Calciumzufuhr beitragen.',
  Jod: 'Kann zur Jodzufuhr beitragen.',
  Folat: 'Kann zur Folatzufuhr beitragen.',
  Ballaststoffe: 'Kann zur Ballaststoffzufuhr beitragen.',
}

// [Lebensmittel, Nährstoff, Zubereitungstipp]
const rows: [string, Nutrient, string][] = [
  ['Linsen', 'Eisen', 'Als Suppe oder Eintopf vorkochen und portionsweise einfrieren.'],
  ['Kichererbsen', 'Eisen', 'Aus der Dose abspülen und in Curry oder als Salat verwenden.'],
  ['Haferflocken', 'Eisen', 'Als warmer Brei oder Overnight Oats, mit Obst kombinieren.'],
  ['Kürbiskerne', 'Eisen', 'Über Suppe, Müsli oder Joghurt streuen.'],
  ['Tofu', 'Eisen', 'Gewürfelt anbraten, auch gut vorzubereiten.'],
  ['Hirse', 'Eisen', 'Wie Reis kochen, schnell und warm.'],
  ['Rindfleisch', 'Eisen', 'Als Eintopf schmoren und portionsweise einfrieren.'],
  ['Spinat', 'Eisen', 'Tiefgefroren ist er schnell in Eierspeisen oder Suppen.'],
  ['Eier', 'Eisen', 'Hartgekocht vorbereiten, gut zum Snacken.'],
  ['Quinoa', 'Eisen', 'Als Beilage oder Bowl-Basis, in größerer Menge kochen.'],
  ['Paprika', 'Vitamin C', 'Roh als Snack oder mit eisenhaltigen Gerichten kombinieren.'],
  ['Kiwi', 'Vitamin C', 'Halbieren und auslöffeln, einhändig machbar.'],
  ['Orange', 'Vitamin C', 'Als Obststück oder frisch gepresst.'],
  ['Brokkoli', 'Vitamin C', 'Kurz dämpfen, damit er nicht verkocht.'],
  ['Erdbeeren', 'Vitamin C', 'Zu Haferbrei oder Joghurt.'],
  ['Grünkohl', 'Vitamin C', 'Gedünstet oder im Eintopf.'],
  ['Petersilie', 'Vitamin C', 'Frisch über warme Gerichte geben.'],
  ['Kartoffeln', 'Vitamin C', 'Als Ofenkartoffeln, gut vorzubereiten.'],
  ['Sanddorn', 'Vitamin C', 'Als Saft verdünnt oder in Joghurt.'],
  ['Zitrone', 'Vitamin C', 'Saft über Linsen oder Salat geben.'],
  ['Emmentaler', 'Zink', 'Als Snack oder auf Brot.'],
  ['Cashewkerne', 'Zink', 'Als Snack oder im Müsli.'],
  ['Vollkornbrot', 'Zink', 'Mit Käse oder Hummus belegen.'],
  ['Haferkleie', 'Zink', 'Unter Joghurt oder Brei rühren.'],
  ['Mandeln', 'Magnesium', 'Handvoll als Snack, einhändig essbar.'],
  ['Banane', 'Magnesium', 'Ohne Zubereitung, auch für unterwegs.'],
  ['Schwarze Bohnen', 'Magnesium', 'In Bowls oder Suppe.'],
  ['Sonnenblumenkerne', 'Magnesium', 'Aufs Brot oder in Müsli.'],
  ['Kakao (ungesüßt)', 'Magnesium', 'In Haferbrei oder Smoothies.'],
  ['Lachs', 'Omega-3', 'Im Ofen garen, einfach und wenig Arbeit.'],
  ['Hering', 'Omega-3', 'Als Fischbrötchen oder Salat.'],
  ['Walnüsse', 'Omega-3', 'Ins Müsli oder als Snack.'],
  ['Leinöl', 'Omega-3', 'Kalt über Quark oder Salat, nicht erhitzen.'],
  ['Chiasamen', 'Omega-3', 'Als Chia-Pudding vorbereiten.'],
  ['Rapsöl', 'Omega-3', 'Zum Braten bei mittlerer Hitze und für Dressings.'],
  ['Skyr', 'Protein', 'Mit Obst, ohne Zubereitung.'],
  ['Magerquark', 'Protein', 'Mit Obst oder herzhaft mit Kräutern.'],
  ['Griechischer Joghurt', 'Protein', 'Mit Nüssen und Beeren.'],
  ['Hüttenkäse', 'Protein', 'Aufs Brot oder mit Paprika.'],
  ['Hähnchenbrust', 'Protein', 'Im Ofen garen und in Portionen aufteilen.'],
  ['Edamame', 'Protein', 'Tiefgekühlt kurz kochen, als Snack.'],
  ['Räuchertofu', 'Protein', 'In Streifen aufs Brot oder in die Pfanne.'],
  ['Natur-Joghurt', 'Calcium', 'Mit Obst oder als Dip.'],
  ['Sesam', 'Calcium', 'Über Gemüse oder als Tahini.'],
  ['Mozzarella', 'Calcium', 'Mit Tomate als schneller Snack.'],
  ['Mineralwasser (calciumreich)', 'Calcium', 'Etikett auf den Calciumgehalt prüfen.'],
  ['Seefisch', 'Jod', 'Gedünstet oder aus dem Ofen.'],
  ['Milch', 'Jod', 'Im Haferbrei oder im Kaffee.'],
  ['Jodsalz', 'Jod', 'Sparsam zum Würzen verwenden.'],
  ['Feldsalat', 'Folat', 'Als schneller Salat.'],
  ['Spargel', 'Folat', 'In der Saison dämpfen oder braten.'],
  ['Rote Linsen', 'Folat', 'Garen in 10 bis 15 Minuten, ideal für Suppe.'],
  ['Weiße Bohnen', 'Ballaststoffe', 'In Eintopf oder als Aufstrich.'],
  ['Heidelbeeren', 'Ballaststoffe', 'Tiefgekühlt in Haferbrei geben.'],
  ['Vollkornnudeln', 'Ballaststoffe', 'In größerer Menge kochen und portionieren.'],
  ['Leinsamen', 'Ballaststoffe', 'Geschrotet ins Müsli, dazu ausreichend trinken.'],
]

export const foods: FoodEntry[] = rows.map(([food, nutrient, preparationTip]) => ({ food, nutrient, claim: claims[nutrient], preparationTip, meta }))
export const nutrients = Object.keys(claims) as Nutrient[]

/** Kombination nur als Hinweis, nicht überinterpretieren. */
export const synergyNote = 'Pflanzliches Eisen wird zusammen mit einer Vitamin-C-Quelle oft besser aufgenommen. Das ist ein Hinweis, kein Rezept gegen einen Mangel.'
