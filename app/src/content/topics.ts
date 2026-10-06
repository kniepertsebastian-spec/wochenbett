import type { ContentMeta } from '../domain/types'

/**
 * ENTWURF – "Ist das normal?" (Roadmap Phase 3). Orientierung und Entscheidungshilfe, KEINE Diagnose.
 * Alle Texte sind noch nicht fachlich geprüft. Zeitangaben und Schwellen sind typische Orientierungswerte
 * und müssen von Hebamme/Ärztin geprüft werden (siehe docs/content-governance.md).
 */
export type Topic = {
  id: string
  title: string
  icon: string
  /** Ein Satz, der beruhigt oder einordnet */
  intro: string
  /** Was kann vorkommen? */
  canOccur: string[]
  /** Was beobachten? */
  observe: string[]
  /** Wann professionelle Hilfe (Hebamme/Ärztin kontaktieren)? */
  contact: string[]
  /** Wann dringend abklären? */
  urgent: string[]
  meta: ContentMeta
}

const meta: ContentMeta = {
  evidenceLevel: 'practical_tip',
  sources: [],
  status: 'draft',
  draftedAt: '2026-10-06',
  reviewDue: '2027-10-06',
  note: 'Entwurf: Inhalte, Zeitangaben und Schwellen fachlich prüfen lassen (Hebamme, Ärztin).',
}

export const topics: Topic[] = [
  {
    id: 'lochia',
    title: 'Wochenfluss und Blutungen',
    icon: '🩸',
    intro: 'Blutungen nach der Geburt sind normal. Wichtig ist, wie sie sich über die Zeit entwickeln.',
    canOccur: [
      'Der Wochenfluss dauert oft etwa vier bis sechs Wochen.',
      'Er ist anfangs hellrot und stärker, später bräunlich, dann gelblich und weniger.',
      'Nach dem Stillen, beim Aufstehen oder nach Anstrengung kann er kurz stärker werden.',
    ],
    observe: [
      'Wird die Menge insgesamt weniger und die Farbe heller?',
      'Wird er bei Anstrengung deutlich stärker? Dann pausiere und ruh dich aus.',
      'Ein leicht blutiger oder muffiger Geruch ist üblich.',
    ],
    contact: [
      'Der Wochenfluss wird nach einer Phase mit weniger Blut wieder hellrot und stärker.',
      'Er riecht deutlich unangenehm oder faulig.',
      'Er hört nach deutlich mehr als sechs Wochen nicht auf oder wird nicht weniger.',
      'Du hast Unterbauchschmerzen, die stärker werden.',
    ],
    urgent: [
      'Du durchtränkst mehr als eine Binde pro Stunde oder verlierst größere Blutklumpen.',
      'Zur Blutung kommen Schwindel, Herzrasen, Schwäche oder Fieber.',
    ],
    meta,
  },
  {
    id: 'pain-wound',
    title: 'Schmerzen und Wundgefühl',
    icon: '🩹',
    intro: 'Ziehen, Wundgefühl und Nachwehen können in den ersten Wochen vorkommen und werden meist besser.',
    canOccur: [
      'Nachwehen, besonders beim Stillen, in den ersten Tagen.',
      'Wundgefühl oder Ziehen am Damm oder an Nähten, vor allem beim Sitzen und Gehen.',
      'Muskelschmerzen nach der Geburt, zum Beispiel im Rücken oder in den Beinen.',
    ],
    observe: [
      'Werden die Schmerzen über die Tage weniger?',
      'Bei welchen Bewegungen sind sie stärker: Sitzen, Husten, Aufstehen?',
      'Schau, ob Rötung, Schwellung oder Nässe dazukommen.',
    ],
    contact: [
      'Die Schmerzen nehmen zu, statt abzunehmen.',
      'Eine Wunde ist gerötet, geschwollen, warm oder nässt.',
      'Das Wasserlassen oder der Stuhlgang bleibt stark schmerzhaft.',
    ],
    urgent: [
      'Starke Schmerzen, die sich nicht bessern.',
      'Fieber zusammen mit Schmerzen oder einer veränderten Wunde.',
      'Eiter oder eine sich öffnende Wunde.',
    ],
    meta,
  },
  {
    id: 'pelvic-floor',
    title: 'Beckenboden und Druckgefühl',
    icon: '🌸',
    intro: 'Nach der Geburt braucht der Beckenboden Zeit. Vieles bessert sich in Wochen bis Monaten.',
    canOccur: [
      'Ein Gefühl von Schwäche im Beckenboden.',
      'Kleine Mengen Urin beim Husten, Niesen, Lachen oder Heben.',
      'Ein Schweregefühl, besonders abends oder nach langem Stehen.',
    ],
    observe: [
      'Wann tritt es auf: bei bestimmten Bewegungen, abends, nach Anstrengung?',
      'Wird es besser, wenn du dich hinlegst oder pausierst?',
      'Verändert es sich über die Wochen?',
    ],
    contact: [
      'Der Urinverlust bessert sich nach einigen Wochen nicht oder stört dich im Alltag.',
      'Das Druck- oder Fremdkörpergefühl nimmt zu.',
      'Du hast Schmerzen im Beckenbereich, die anhalten.',
      'Eine Beckenboden-Physiotherapeutin kann helfen. Deine Hebamme oder Ärztin kann dich beraten.',
    ],
    urgent: [
      'Du kannst nicht mehr Wasser lassen.',
      'Ein deutliches Vorwölbungsgefühl zusammen mit Schmerzen oder Blutung.',
      'Plötzlicher Verlust der Kontrolle über den Stuhlgang.',
    ],
    meta,
  },
  {
    id: 'abdomen',
    title: 'Bauch, Diastase und Spannungsgefühl',
    icon: '🫶',
    intro: 'Der Bauch braucht Zeit, um sich zurückzubilden. Ein weicher Bauch und eine Lücke in der Mitte sind häufig.',
    canOccur: [
      'Ein weicher, lockerer Bauch.',
      'Eine Lücke zwischen den geraden Bauchmuskeln, die sich beim Aufrichten als Wölbung zeigen kann (Doming).',
      'Ein Spannungs- oder Ziehgefühl im Bauch bei Bewegung.',
    ],
    observe: [
      'Wölbt sich die Mitte beim Aufsetzen, Husten oder bei Übungen nach oben?',
      'Mit der Selbstbeobachtung in der App kannst du das über Wochen festhalten.',
      'Die App stellt keine Diagnose. Die Werte sind nur eine Orientierung für Gespräche.',
    ],
    contact: [
      'Die Wölbung bleibt oder ist stark ausgeprägt.',
      'Du hast Rücken- oder Beckenschmerzen, die dich einschränken.',
      'Du bist unsicher, welche Bauchübungen für dich passen. Frag deine Hebamme oder Physiotherapeutin.',
    ],
    urgent: ['Plötzliche starke Bauchschmerzen.', 'Ein harter, druckempfindlicher Bauch mit Fieber oder Erbrechen.'],
    meta,
  },
  {
    id: 'scar',
    title: 'Kaiserschnittnarbe und Geburtsverletzungen',
    icon: '🌿',
    intro: 'Narben und Nähte brauchen mehrere Wochen, um zu heilen. Ziehen und Empfindungen darum sind häufig.',
    canOccur: [
      'Ziehen, Taubheit oder Kribbeln rund um die Narbe.',
      'Ein Spannungsgefühl bei Bewegungen, beim Aufstehen oder Husten.',
      'Eine anfangs gerötete, leicht empfindliche Narbe.',
    ],
    observe: [
      'Wird die Narbe über die Tage ruhiger oder rötet sie sich stärker?',
      'Ist sie trocken und geschlossen, oder feucht und offen?',
      'Schmerzen bei Bewegungen: werden sie weniger?',
    ],
    contact: [
      'Die Rötung breitet sich aus, die Narbe ist geschwollen, warm oder nässt.',
      'Die Schmerzen nehmen zu.',
      'Die Narbe oder ein Dammbereich öffnet sich teilweise.',
    ],
    urgent: [
      'Fieber zusammen mit Schmerzen oder Rötung an der Wunde.',
      'Eiter oder starke Blutung aus der Wunde.',
      'Die Wunde klafft deutlich auseinander.',
    ],
    meta,
  },
  {
    id: 'back-neck',
    title: 'Rücken- und Nackenbeschwerden',
    icon: '🧘',
    intro: 'Stillen, Tragen und Wickeln belasten Rücken und Nacken. Vieles lässt sich durch Haltung und Pausen lindern.',
    canOccur: [
      'Verspannungen in Nacken und Schultern, besonders beim Stillen.',
      'Rückenschmerzen nach langem Tragen oder gebückter Haltung.',
    ],
    observe: [
      'Hilft es, die Haltung beim Stillen und Tragen zu verändern?',
      'Wird es mit Lockerungsübungen und Pausen besser?',
    ],
    contact: [
      'Die Schmerzen halten über mehrere Wochen trotz Entlastung an.',
      'Die Schmerzen strahlen in ein Bein aus oder du spürst Taubheit.',
    ],
    urgent: [
      'Lähmungsgefühle, Taubheit im Intimbereich oder Verlust der Kontrolle über Blase oder Darm.',
      'Sehr starke Schmerzen, die plötzlich einsetzen.',
    ],
    meta,
  },
  {
    id: 'breasts',
    title: 'Brüste und Stillen',
    icon: '🤱',
    intro: 'Am Anfang sind Spannen und wunde Brustwarzen häufig. Eine Stillberatung kann sehr helfen.',
    canOccur: [
      'Der Milcheinschuss in den ersten Tagen: die Brüste sind warm, schwer und gespannt.',
      'Wunde, empfindliche Brustwarzen am Anfang.',
      'Kleine Milchstaus, die sich nach Anlegen oder Wärme/Kühlung lösen.',
    ],
    observe: [
      'Löst sich das Spannungsgefühl nach dem Stillen?',
      'Gibt es eine gerötete oder harte Stelle, die nicht besser wird?',
      'Wie fühlen sich die Brustwarzen an: nur empfindlich oder verletzt?',
    ],
    contact: [
      'Ein harter, schmerzhafter Knoten oder eine gerötete Stelle, die sich nicht löst.',
      'Die Brustwarzen sind verletzt oder bluten, und das Stillen tut weiter sehr weh.',
      'Du brauchst Hilfe beim Anlegen: Hebamme oder Stillberaterin.',
    ],
    urgent: ['Fieber, Schüttelfrost oder Grippegefühl zusammen mit einer roten, schmerzhaften Brust.'],
    meta,
  },
  {
    id: 'fatigue',
    title: 'Müdigkeit und Erschöpfung',
    icon: '😴',
    intro: 'Müdigkeit ist nach der Geburt normal. Schlafmangel und Hormone fordern den Körper stark.',
    canOccur: [
      'Tiefe Müdigkeit, besonders durch unterbrochenen Schlaf.',
      'Wenig Antrieb und schnelles Erschöpfen bei Anstrengung.',
    ],
    observe: [
      'Hilft Ausruhen, wenn das Baby schläft?',
      'Trinkst und isst du regelmäßig?',
      'Ist die Erschöpfung an manchen Tagen besser?',
    ],
    contact: [
      'Die Erschöpfung hält trotz Ruhe an oder wird schlimmer.',
      'Du bist ungewöhnlich blass, hast Herzklopfen oder Atemnot schon bei leichter Anstrengung. Ein Blutbild kann klären, woran es liegt.',
      'Du kannst nicht schlafen, obwohl du Gelegenheit hättest.',
    ],
    urgent: ['Ohnmacht, Brustschmerzen oder starke Atemnot.'],
    meta,
  },
  {
    id: 'digestion',
    title: 'Verdauung und Wasserlassen',
    icon: '🚽',
    intro: 'Verdauung und Blase brauchen nach der Geburt oft einige Tage, um sich zu sortieren.',
    canOccur: [
      'Verstopfung in den ersten Tagen und Angst vor dem ersten Stuhlgang.',
      'Hämorrhoiden, die jucken oder brennen.',
      'Vermehrtes Wasserlassen und Schwitzen, weil der Körper Wasser ausscheidet.',
    ],
    observe: [
      'Trinkst du genug und isst du Ballaststoffe?',
      'Presst du beim Stuhlgang? Lass dir Zeit, nicht pressen.',
      'Brennt das Wasserlassen oder hast du ständig Drang?',
    ],
    contact: [
      'Brennen beim Wasserlassen mit häufigem Drang.',
      'Die Verstopfung hält mehrere Tage trotz Trinken und Ballaststoffen an.',
      'Wiederholt Blut im Stuhl oder stark schmerzhafte Hämorrhoiden.',
    ],
    urgent: [
      'Du kannst nicht Wasser lassen.',
      'Fieber zusammen mit Schmerzen in der Flanke.',
      'Starke Bauchschmerzen mit Erbrechen.',
    ],
    meta,
  },
  {
    id: 'dizziness',
    title: 'Schwindel und Kreislauf',
    icon: '💫',
    intro: 'Schwindel beim schnellen Aufstehen kommt nach der Geburt vor, besonders nach Blutverlust und bei wenig Essen oder Trinken.',
    canOccur: [
      'Kurzer Schwindel oder Schwarzwerden vor den Augen beim schnellen Aufstehen.',
      'Schwächegefühl nach langem Liegen oder wenig Essen.',
    ],
    observe: [
      'Steh langsam auf und setz dich kurz auf die Bettkante.',
      'Trink und iss regelmäßig. Verbessert das die Beschwerden?',
    ],
    contact: [
      'Der Schwindel kommt häufig oder hält länger an.',
      'Du hast Herzrasen oder fühlst dich dauerhaft schwach.',
    ],
    urgent: [
      'Ohnmacht.',
      'Atemnot oder Brustschmerzen (Notruf 112).',
      'Eine einseitig geschwollene, schmerzhafte Wade oder ein geschwollenes Bein.',
    ],
    meta,
  },
  {
    id: 'mood',
    title: 'Stimmung und emotionale Belastung',
    icon: '💛',
    intro: 'Nach der Geburt schwanken Gefühle oft stark. Das ist normal und hat nichts mit Schwäche zu tun.',
    canOccur: [
      'Weinen, Stimmungsschwankungen und Reizbarkeit in den ersten Tagen und Wochen („Babyblues“).',
      'Sorgen um das Baby und Unsicherheit, ob du alles richtig machst.',
      'Mischung aus Glück, Erschöpfung und Überforderung.',
    ],
    observe: [
      'Wie lange dauern die schweren Gefühle: einige Tage oder schon länger?',
      'Gibt es auch schöne Momente?',
      'Kannst du schlafen, wenn das Baby schläft?',
    ],
    contact: [
      'Die traurige, ängstliche oder leere Stimmung hält länger als etwa zwei Wochen an.',
      'Du hast kaum noch Freude, starke Ängste, Panik oder quälende Gedanken.',
      'Du fühlst dich allein oder überfordert. Sprich mit Partner, Familie, Hebamme oder Ärztin.',
    ],
    urgent: [
      'Du hast Gedanken, dir oder dem Baby etwas anzutun, oder du möchtest nicht mehr leben. Ruf 112 oder die Telefonseelsorge (0800 111 0 111, kostenlos, rund um die Uhr).',
    ],
    meta,
  },
]

export const topicById = (id: string) => topics.find((t) => t.id === id)
