GOAL: Der Zuschauer weiß, was ein Radlager tut, woran er ein kaputtes erkennt (Brummen mit dem Tempo) und dass er es prüfen lassen soll.
OUTPUT: HyperFrames, 1920 x 1080, 30 fps
TIME: ~55 s (folgt der Sprecherspur: letztes Wort + 3 s)
VOICE: Deutsch, ElevenLabs eleven_multilingual_v2, Text in script.json; Untertitel aus den Wortzeiten
LOOK: Low-Poly, flat shading (MeshLambert, flatShading), keine Glows/Bloom.
Straßenwelt: Sonnenuntergang, Himmel #d9685a→#f08f5e→Horizont/Nebel #f6b47a, Wiese #5f8a49–#82a85c, Asphalt #4b4853, Auto #2a9d8f.
Lagerwelt: facettierte Kuppel #ea9662→#cc6b50→#7a3a48, Stahl #b9bec8/#d0d4dc, Kugeln #eef0f4, Käfig #c9a14a, Dichtung #2c2a30, ABS-Ring #2c2a30/#d9483b.
Akzent #ffd24a nur für Labels, Pfeile, Brumm-Ringe, Titelbalken. Tinte #1f1a24.
Schrift: Montserrat 900 (Titel 120 px / 96 px), 800 (Labels 40 px, Untertitel 60 px).
OBJECTS: Auto (Kabine aus Seitenprofil, Scheiben, Lichter, 4 Räder mit Radkappe), Radlager doppelreihig: Außenring mit Flansch,
Innenring, 2 x 13 Kugeln mit Käfig, Dichtung außen, ABS-Encoder-Ring innen, Radnabe mit 5 Bolzen.
MOTION: Kamera: eine Fahrt, Keyframes mit io/io2/out3/in3; Eintauchen durch die Radkappe (in3) mit Blende in Radkappenfarbe #44444c.
Labels: Pop 0.32 s back.out(2); Titel: Maske von unten 0.45 s power4.out + Balken 0.5 s.
SHOTS: l1 Straße (Front-3/4 → Seite) · l2 Fahrt ins Rad, Eintauchen, Titel „Das Radlager“ auf dem Wort ·
l3 Rückzug: Nabe, Gewicht-Pfeil, Kurvenkräfte-Pfeil · l4 Explosionsansicht mit Labels ·
l5 Zusammenbau, Schlagloch-Stoß, Schnittansicht, Wasser, Rost, Fett, Funken ·
l6 Brumm-Ringe, Spiel (Wackeln), Hitze (Außenring rot), ABS-Leuchte · l7 Lager blockiert, zurück zur Straße, Auto hält, Schlusszeile.
SOUND: Sprecher; selbst erzeugtes Brummen (assets/audio/hum.mp3) auf Straße und bei den Symptomen; Whoosh beim Ein-/Austauchen,
Bass-Impact bei Schlagloch und Blockieren, Pop bei der ABS-Leuchte. Keine Musik (kein Katalogzugang).
BANNED: dunkle Leere, Glow/Bloom, Partikel als Deko, Pillen-Chips, drei Karten nebeneinander, Logo in der Ecke, Labels mit will-change (Compositing-Loch).
QA: 1 s Auto lesbar · 9.2 s Radkappe füllt das Bild · 13.5 s Titel · 26.5 s alle Teile getrennt · 37 s Schnitt zeigt Kugeln · 45 s ABS · Ende Schlusszeile ≥ 2 s.
