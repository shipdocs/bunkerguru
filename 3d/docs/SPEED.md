# Controle van snelheid en beeldsnelheid

De melding was: de meter toont 25,9 km/u, maar de kade kruipt voorbij. De oude animatielus gebruikte `Math.min(verstrekenTijd, 0.05)`. Daarmee liep de simulatie onder 20 FPS in slow motion, zonder dat de snelheidsmeter dat aangaf.

Bij een gelijkblijvende snelheid van 7,2 m/s (25,92 km/u), gedurende tien echte seconden:

| Beeldsnelheid | Oude verstreken simulatietijd | Oude afstand | Nieuwe afstand |
| ------------- | ----------------------------- | ------------ | -------------- |
| 10 FPS        | 5 s                           | 36 m         | 72 m           |
| 15 FPS        | 7,5 s                         | 54 m         | 72 m           |
| 30 FPS        | 10 s                          | 72 m         | 72 m           |
| 60 FPS        | 10 s                          | 72 m         | 72 m           |

De nieuwe klok bewaart de verstreken tijd en verwerkt die in stappen van 1/60 s. `tests/clock.test.mjs` meet afstand én simulatieklok met het echte spelmodel bij 5, 10, 15, 30, 60 en 120 FPS, plus onregelmatige frame-intervallen. De applicatie-integratietest controleert dit eveneens via de echte animatielus bij 10 FPS. De tests draaien ook op de publicatiebuild.

Pauze en verborgen tabbladen worden niet ingehaald. Een afzonderlijke browserblokkade wordt begrensd op 250 ms inhaalwerk om sprongen door kades en onbeperkte werkachterstand te voorkomen. Onder aanhoudend 4 FPS kan daarom nog vertraging optreden; deze wijziging garandeert geen hogere grafische FPS.

De cameraschaal is niet kunstmatig versneld. Eén wereld-eenheid blijft één meter. Bij 25 km/u is de afstand circa 69,4 m in tien seconden; een schip van 110 m passeert dan zijn eigen lengte in ongeveer 15,8 seconden. Een breed uitgezoomde volgcamera kan ook bij correcte snelheid rustig ogen. Het defect in de tijdstap is aangetoond; hoeveel FPS de telefoon uit de screenshot werkelijk haalde is niet gemeten.

## Sneller speeltempo

De gebruiker verduidelijkte daarna dat het renderen goed gaat, maar het varen te langzaam aanvoelt. Daarom is het standaard speeltempo nu 2×, zonder de beeldkwaliteit te verminderen. Bij 25,92 km/u op de scheepsmeter gaat in tien echte seconden twintig seconden speltijd voorbij: de afstand is 144 m. Verkeer, sturen, overslag en opdrachten volgen dezelfde tijdschaal. De HUD toont 2× en het menu biedt 1×, 2× en 3×. De vaarsnelheidsmeter blijft de snelheid per speluur aangeven. Dit is een bewuste tempoverhoging, naast de eerdere correctie van de klok.

De test voor de daadwerkelijke animatielus controleert nu 144 m op 2×; de afzonderlijke kloktests blijven 72 m op 1× verifiëren.

## Update: tempo zoals het 2D-spel

Standaard is nu 3× (gelijk aan `TIME = 3` in `engine.js`); de keuzes zijn 1×, 2×, 3× en 6× (T, snelvaart). Zie `src/game/time-scale.mjs`.
