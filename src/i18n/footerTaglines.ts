/**
 * Localised footer taglines.
 *
 * The footer sits on every page, so an English tagline meant one untranslated
 * paragraph on all eight locales — including /ja/onlinecompass/.
 */

type Tool = 'onlinecompass' | 'onlinebubblelevel' | 'onlinespeedometer' | 'onlineqibla';

const taglines: Record<string, Record<Tool, string>> = {
  en: {
    onlinecompass:
      'A live compass in your browser — find north, read your heading, and measure bearing in degrees. Built with modern web sensors, no download and no account.',
    onlinebubblelevel:
      'A bubble level in your browser — check level and plumb, read tilt in degrees. Built with modern web sensors, no download and no account.',
    onlinespeedometer:
      'A speedometer in your browser — GPS speed with max, average, altitude and trip time. Built with modern web sensors, no download and no account.',
    onlineqibla:
      'A Qibla finder in your browser — the bearing to the Kaaba from your own location. Built with modern web sensors, no download and no account.',
  },
  es: {
    onlinecompass:
      'Una brújula en vivo en tu navegador: encuentra el norte, lee tu rumbo y mide la orientación en grados. Hecha con sensores web modernos, sin descargas ni cuentas.',
    onlinebubblelevel:
      'Un nivel de burbuja en tu navegador: comprueba nivel y plomada y lee la inclinación en grados. Hecho con sensores web modernos, sin descargas ni cuentas.',
    onlinespeedometer:
      'Un velocímetro en tu navegador: velocidad por GPS con máxima, media, altitud y tiempo de viaje. Hecho con sensores web modernos, sin descargas ni cuentas.',
    onlineqibla:
      'Un buscador de alquibla en tu navegador: el rumbo a la Kaaba desde tu propia ubicación. Hecho con sensores web modernos, sin descargas ni cuentas.',
  },
  ja: {
    onlinecompass:
      'ブラウザで動く方位磁針。北を探し、方位を読み、角度で測れます。最新のウェブセンサーで動作し、ダウンロードもアカウントも不要です。',
    onlinebubblelevel:
      'ブラウザで使える水準器。水平と垂直を確認し、傾きを度数で読めます。最新のウェブセンサーで動作し、ダウンロードもアカウントも不要です。',
    onlinespeedometer:
      'ブラウザで使えるスピードメーター。GPSで速度、最高速、平均、標高、走行時間を表示します。ダウンロードもアカウントも不要です。',
    onlineqibla:
      'ブラウザで使えるキブラ方位。現在地からカアバへの方位を示します。ダウンロードもアカウントも不要です。',
  },
  fr: {
    onlinecompass:
      'Une boussole en direct dans votre navigateur : trouvez le nord, lisez votre cap et mesurez le relèvement en degrés. Conçue avec les capteurs web modernes, sans téléchargement ni compte.',
    onlinebubblelevel:
      'Un niveau à bulle dans votre navigateur : vérifiez l’horizontal et la verticale, lisez l’inclinaison en degrés. Conçu avec les capteurs web modernes, sans téléchargement ni compte.',
    onlinespeedometer:
      'Un compteur de vitesse dans votre navigateur : vitesse GPS avec maximum, moyenne, altitude et durée du trajet. Conçu avec les capteurs web modernes, sans téléchargement ni compte.',
    onlineqibla:
      'Un chercheur de Qibla dans votre navigateur : le relèvement vers la Kaaba depuis votre position. Conçu avec les capteurs web modernes, sans téléchargement ni compte.',
  },
  de: {
    onlinecompass:
      'Ein Live-Kompass im Browser — finde Norden, lies deine Peilung und miss die Richtung in Grad. Gebaut mit modernen Web-Sensoren, ohne Download und ohne Konto.',
    onlinebubblelevel:
      'Eine Wasserwaage im Browser — prüfe Waage und Lot, lies die Neigung in Grad. Gebaut mit modernen Web-Sensoren, ohne Download und ohne Konto.',
    onlinespeedometer:
      'Ein Tacho im Browser — GPS-Geschwindigkeit mit Maximum, Durchschnitt, Höhe und Fahrzeit. Gebaut mit modernen Web-Sensoren, ohne Download und ohne Konto.',
    onlineqibla:
      'Ein Qibla-Finder im Browser — die Richtung zur Kaaba von deinem Standort. Gebaut mit modernen Web-Sensoren, ohne Download und ohne Konto.',
  },
  pt: {
    onlinecompass:
      'Uma bússola ao vivo no navegador: encontre o norte, leia seu rumo e meça a direção em graus. Feita com sensores web modernos, sem download e sem conta.',
    onlinebubblelevel:
      'Um nível de bolha no navegador: confira nível e prumo e leia a inclinação em graus. Feito com sensores web modernos, sem download e sem conta.',
    onlinespeedometer:
      'Um velocímetro no navegador: velocidade por GPS com máxima, média, altitude e tempo de viagem. Feito com sensores web modernos, sem download e sem conta.',
    onlineqibla:
      'Um localizador de Qibla no navegador: o rumo até a Caaba a partir da sua localização. Feito com sensores web modernos, sem download e sem conta.',
  },
  ko: {
    onlinecompass:
      '브라우저에서 동작하는 실시간 나침반입니다. 북쪽을 찾고 방위를 읽고 각도로 방향을 잽니다. 최신 웹 센서로 만들어졌으며 다운로드와 계정이 필요 없습니다.',
    onlinebubblelevel:
      '브라우저에서 쓰는 수평계입니다. 수평과 수직을 확인하고 기울기를 도수로 읽습니다. 최신 웹 센서로 만들어졌으며 다운로드와 계정이 필요 없습니다.',
    onlinespeedometer:
      '브라우저에서 쓰는 속도계입니다. GPS 속도와 최고 속도, 평균, 고도, 주행 시간을 보여 줍니다. 다운로드와 계정이 필요 없습니다.',
    onlineqibla:
      '브라우저에서 쓰는 키블라 방향 안내입니다. 현재 위치에서 카바까지의 방위를 알려 줍니다. 다운로드와 계정이 필요 없습니다.',
  },
  it: {
    onlinecompass:
      'Una bussola in tempo reale nel tuo browser: trova il nord, leggi la tua prua e misura la direzione in gradi. Costruita con i moderni sensori web, senza download e senza account.',
    onlinebubblelevel:
      'Una livella a bolla nel tuo browser: controlla piano e piombo e leggi l’inclinazione in gradi. Costruita con i moderni sensori web, senza download e senza account.',
    onlinespeedometer:
      'Un tachimetro nel tuo browser: velocità GPS con massima, media, altitudine e durata del viaggio. Costruito con i moderni sensori web, senza download e senza account.',
    onlineqibla:
      'Un cercatore di Qibla nel tuo browser: la direzione verso la Kaaba dalla tua posizione. Costruito con i moderni sensori web, senza download e senza account.',
  },
};

export function getToolTagline(lang: string, tool: Tool): string {
  const set = taglines[lang] || taglines.en;
  return set[tool] || taglines.en[tool];
}
