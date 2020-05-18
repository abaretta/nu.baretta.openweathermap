Ontvang OpenWeatherMap data en weersvooruitzichten in Homey

Deze app maakt het mogelijk om data en weersvooruitzichten in Homey te ontvangen en te gebruiken in flows. De data wordt als een soort weerstation (dus als een apparaat) aan Homey toegevoegd. Er kunnen zoveel weerstations toegevoegd worden als Homey aan kan. Denk hierbij aan verschillende locaties of tijd intervallen. Dit kan ingesteld worden door in plaats van Homey's locatie te gebruiken handmatig een locatie in te vullen in de settings. 

Het gebruik van de app vereist een (gratis) API key, zie https://home.openweathermap.org/users/sign_up. 

OpenWeatherMap beperkt de toegang tot steeds API's tot betalende klanten. Als gevolg kan het zijn dat een nieuwe API key niet werkt voor de tabellen met het huidige weer en de 5- en 16 daagse voorspelling.

Gelukkig heeft OWM een nieuwe API beschikbaar gemaakt: de "Onecall API". In de eerste versie van de Homey OpenWeatherMap app met ondersteuning voor de Onecall API wordt alleen nog het huidige weer weergegeven. In komende versies zullen ook de voorspelling per uur en per dag toegevoegd worden.

De OpenWeatherMap API heeft verschillende tabellen:

Onecall API (nieuw)

Dit is een tabel met data voor zowel het huidige weer als de voorspelling voor de komende uren en dagen. De tabel bevat ook data met de UV index en de gevoelstemperatuur. In de huidige versie van de app zit alleen data voor het huidige weer, in komende versie zullen ook de voorspellingen toegevoegd worden.

Huidige weer ('current weather')

De data in de 'current weather' tabel (zie http://openweathermap.org/current) bevat data met betrekking to zichtbaarheid, zonsopgang en zonsondergang (alleen via deze tabel beschikbaar), naast temperatuur, wind en neerslag. Let op, hoewel de tabel ook 'min' en 'max' temperaturen bevat heeft dit betrekking op de variatie van de huidige temperatuur in het meetgebied, het is niet de maximum en minimum temperatuur in een tijdinterval. Om deze reden worden de waarden niet in de app gebruikt.

Voorspelling vijf dagen

De tabel met de weersvoorspelling voor de komende vijf dagen (zie http://openweathermap.org/forecast5) bestaat uit data in intervallen van drie uur, tot vijf dagen vooruit. Bij het toevoegen van een 'weerstation' met de voorspelling voor de komende vijf dagen kan ingevuld worden voor hoeveel intervallen van drie uur vooruit in de tijd de data opgehaald moeten worden. 8 intervallen geven bijvoorbeeld de data 24 uur vooruit in de tijd (oftewel morgen). Ook deze dataset bevat een minimum en maximum temperatuur, helaas gaat het ook in dit geval niet om de verwachte minimum/maximum temperatuur in een interval. 

Voorspelling lange termijn

De langetermijnsvoorspelling bevat data tot 16 dagen vooruit in intervallen van een dag (zie http://openweathermap.org/forecast16). De data bevat de maximum, minimum, ochtend, avond en dag temperatuur. 

Forum

Voor vragen over de app zie het community forum: https://forum.athom.com/discussion/4225/.

Een OWM weerstation toevoegen aan Homey

Een OpenWeatherMap device wordt dezelfde manier als een apparaat toegevoegd. Selecteer de app, voeg het gewenste 'apparaat' toe, en volg de aanwijzingen. Instellingen kunnen na toevoegen aangepast worden. 

Standaard gebruikt de app de locatie van Homey. Als dit OK is, vul dan verder geen locatie details in. Mocht een andere locatie gewenst zijn, let dan goed op het invullen, dit wordt momenteel niet gechecked, en blijkt vrij vaak fout te gaan. Er verschijnt dan geen data in de app. Het is mogelijk om bijvoorbeel 'Amsterdam,NL' in te vullen, of een postcode zonder de letters. Beide methoden kunnen getest worden op de OpenWeatherMap site door zelf de URL als volgt samen te stellen (met stad, landencode, en API key):

`https://api.openweathermap.org/data/2.5/weather?q=<stad,landencode>&APPID=<API key>`

Een postcode kan als volgt getest worden (vul postcode, landencode en API key in):
`https://api.openweathermap.org/data/2.5/weather?zip=<postcode,landencode>&APPID=<API key>`

Flow cards

For nearly all parameters trigger and condition cards are included, temperature, precipitation (rain as well as snow), winddirection (beaufort, m/s as well as text), extreme weather events and more.

Vereisten voor gebruik van de app

Zoals eerder vermeld vereist de app een (gratis) OpenWeatherMap API sleutel, zie https://home.openweathermap.org/users/sign_up. Met een enkel sleutel kunnen zoveel virtuele weerstations aangemaakt worden als Homey aan kan (tientallen). De toegang tot de verschillende tabel is aan verandering onderhevig. Het lijkt erop dat in het verleden aangevraagde API sleutels hun rechten behouden, maar dat nieuwe sleutels inmiddels minder toegang geven. Voor de lange termijnsvoorspelling werken nieuwe API sleutels schijnbaar niet meer.

