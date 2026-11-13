/**
 * Localised keyword sets.
 *
 * The English keywords were being emitted on every locale page, which tells a
 * search engine the same thing eight times in English. Each set below holds the
 * phrases people actually type in that language, so /ja/onlinecompass/ competes
 * for Japanese queries instead of repeating the English ones.
 *
 * Duplicate spellings are counted once, and the phrasing matches the keyword
 * style already used on the compass pages.
 */

export const compassKeywords: Record<string, string> = {
  en: 'online compass, online compass tool, free online compass, online compass free, compass online, compass direction, live compass, mobile compass, compass tool, digital compass, directions compass, online compass direction, online compass to find north, compass to find north, where is north, north direction, north, south, east, west, direction, online tool, online tool compass',
  es: 'brújula online, brújula en línea, brújula gratis, brújula para móvil, brújula digital, dirección de la brújula, brújula en vivo, herramienta de brújula, dónde está el norte, dirección norte, encontrar el norte, puntos cardinales, norte, sur, este, oeste, brújula online gratis',
  ja: 'オンラインコンパス, 方位磁針, 方位磁石, コンパス アプリ, スマホ コンパス, 無料 コンパス, 方位 調べる, 方角 調べる, 北 探す, 北はどっち, 東西南北, デジタルコンパス, ブラウザ コンパス, オンライン 方位磁針',
  fr: 'boussole en ligne, boussole gratuite, boussole sur téléphone, boussole numérique, orientation boussole, point cardinal, trouver le nord, où est le nord, direction nord, boussole en temps réel, outil boussole, nord sud est ouest',
  de: 'online kompass, kompass online, kostenloser kompass, kompass auf dem handy, digitaler kompass, himmelsrichtung, norden finden, wo ist norden, kompass app, kompass ohne installation, nord süd ost west, kompass browser',
  pt: 'bússola online, bússola grátis, bússola no celular, bússola digital, direção da bússola, encontrar o norte, onde fica o norte, direção norte, pontos cardeais, ferramenta de bússola, norte sul leste oeste, bússola online grátis',
  ko: '온라인 나침반, 나침반, 나침반 앱, 핸드폰 나침반, 휴대폰 나침반, 무료 나침반, 방위, 방향 찾기, 북쪽 찾기, 북쪽 어디, 동서남북, 디지털 나침반, 브라우저 나침반',
  it: 'bussola online, bussola gratis, bussola sul telefono, bussola digitale, direzione della bussola, trovare il nord, dovè il nord, direzione nord, punti cardinali, strumento bussola, nord sud est ovest, bussola online gratis',
};

export function getCompassKeywords(lang: string): string {
  return compassKeywords[lang] || compassKeywords.en;
}
