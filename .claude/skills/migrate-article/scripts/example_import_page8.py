from importer import *
VBIB="Biblioteca statale Stelio Crise · Largo Papa Giovanni XXIII, 6 · Trieste"
VCS="Sala Paolo Alessi del Circolo della Stampa · Corso Italia, 13 · Trieste"
VVER="Sala Veruda di Palazzo Costanzi (piazza Piccola 2)"
VSAL="Salone d'Arte – Via della Zonta 2 · Trieste"
VCR="Palazzo del Consiglio Regionale · Piazza Oberdan, 6 Trieste"
VREV="Museo Revoltella · via Diaz 27 · Trieste"
VISO="Galleria d'arte Mario Di Iorio della Biblioteca Statale Isontina · Via Mameli 12 · Gorizia"
VDUINO="Castello di Duino (Trieste)"
CUR=('curator','Marianna Accerboni')
def I(open_,venue,ps=None,pe=None,time=None,cat=False,contacts=None,cur=True):
    r=[('openingDate',open_),('venue',venue)]
    if ps: r+= [('periodStart',ps),('periodEnd',pe)]
    if time: r.append(('time',time))
    if cur: r.append(CUR)
    r.append(('hasCatalog','true' if cat else 'false'))
    if contacts: r.append(('infoContacts',contacts))
    return r
which=sys.argv[1:] 
def go(i,*a,**k):
    if which and str(i) not in which: return
    do2(i,*a,**k)
go(319,'rupert-rebernig-la-sensazione-del-vedere-2019',"Rupert Rebernig: giovedì 9 maggio 2019 alla Sala Comunale d'Arte di Trieste inaugurazione della personale del pittore austriaco",
   I('2019-05-09 19:00',"Sala Comunale d'Arte",'2019-05-09','2019-05-30','tutti i giorni ore 10 · 13 e 17 · 20',False,'+39 335 6750946 · art@rebernig-rupert.at · www.rebernig-rupert.at · +43 664 5251858'),
   [('rebernig-visita-guidata-25-maggio-2019',"Sabato 25 maggio alla Sala Comunale d'Arte di Trieste visita guidata alla mostra dell'artista austriaco Rupert Rebernig",True),
    ('rebernig-visita-guidata-17-maggio-2019',"Venerdì 17 maggio alla Sala Comunale d'Arte di Trieste visita guidata alla mostra dell'artista austriaco Rupert Rebernig",True)])
go(318,'fityourbody-tour-2019',"Fitness e wellness d'avanguardia: alla Biblioteca statale S. Crise di Trieste lunedì 15 aprile presentazione e avvio del Fityourbody tour con il 1° meeting Fityourbody",
   I('2019-04-15 18:00',VBIB,contacts='+39 339 5881550 / info@fityourbody.it / ufficio stampa +39 335 6750946',cur=False),[])
go(317,'serena-zors-oltre-il-cielo-2019',"Serena Zors. Oltre il cielo, l'infinito",
   I('2019-04-13 20:00',VVER,'2019-04-14','2019-05-07','tutti i giorni 10.00 · 13.00 / 17.00 · 20.00',True,'+39 335 6750946'),
   [('zors-finissage-5-maggio-2019',"Domenica 5 maggio a Palazzo Costanzi ultimo appuntamento creativo alla mostra di Serena Zors: finissage con laboratorio di disegno e pittura e visita guidata",True),
    ('zors-visita-guidata-23-aprile-2019',"Martedì 23 aprile a Palazzo Costanzi visita guidata alla mostra Serena Zors. Oltre il cielo, l'infinito",True)])
go(316,'patrizia-schoss-antologica-2019',"Giovedì 28 marzo 2019 al Palazzo del Consiglio Regionale di Trieste inaugurazione dell'antologica della pittrice Patrizia Schoss",
   I('2019-03-28 13:30',VCR,'2019-03-28','2019-05-21','da lunedì a giovedì 9.30 - 12.30 e 14.30 - 17.30 / venerdì 9.30 - 13',True,'+39 335 6750946'),[])
go(315,'lin-delija-in-viaggio-verso-casa-2019',"La mostra “Lin Delija. In viaggio verso casa. Gorizia - Zagabria - Scutari”",
   I('2019-03-23 17:30',VISO,'2019-03-23','2019-04-09','da lunedì a venerdì dalle 10.30 alle 18.30; sabato dalle 10.30 alle 13.00 / domenica e festivi chiuso / ingresso libero',True,'+39 335 6750946 · +39 0481 580211 · bs-ison@beniculturali.it · isontina.beniculturali.it'),[],vname=VISO)
go(314,'aldo-fama-lo-stato-dell-arte-2019',"Aldo Famà. Lo stato dell'arte. Mostra antologica",
   I('2019-02-15 19:00',VVER,'2019-02-16','2019-03-11','tutti i giorni 10.00 · 13.00 / 17.00 · 20.00',True,'+39 335 6750946'),[],
   invs=('invito.pdf','cs-fama.pdf','vg-fama1.pdf','vg-fama2.pdf','vg-fama3.pdf'),
   press_suffix="[Scarica Comunicato Stampa del Comune di Trieste]({M}cs-fama.pdf)",
   manual_subs=[('fama-laboratorio-visita-guidata-23-24-febbraio-2019',"Sabato 23 e domenica 24 febbraio a Palazzo Costanzi laboratorio e visita guidata alla mostra “Aldo Famà. Lo stato dell'arte”","[Ufficio Stampa Comune di Trieste: Visita guidata alla mostra di Famà]({M}vg-fama1.pdf)"),
                ('fama-laboratorio-visita-guidata-2-3-marzo-2019',"Sabato 2 e domenica 3 marzo a Palazzo Costanzi laboratorio e visita guidata alla mostra “Aldo Famà. Lo stato dell'arte”","[Ufficio Stampa Comune di Trieste: Visita guidata alla mostra di Famà]({M}vg-fama2.pdf)"),
                ('fama-gran-finale-9-10-11-marzo-2019',"Gran finale per la mostra di Aldo Famà al Palazzo Costanzi di Trieste: sabato 9 laboratorio, domenica 10 e lunedì 11 visite guidate","[Ufficio Stampa Comune di Trieste: Ultimi giorni. Visita guidata alla mostra di Famà]({M}vg-fama3.pdf)")])
go(313,'alessandra-scarino-il-preferito-della-strada-2019',"Venerdì 1 febbraio 2019 al Museo Revoltella di Trieste presentazione del libro “Il preferito della strada. Il magico viaggio di Vito Timmel” della giornalista Alessandra Scarino",
   I('2019-02-01 18:30',VREV,time='ore 18.30',contacts='+39 339 3315372'),[],vname=VREV)
go(312,'franco-viezzoli-viaggio-in-dalmazia-2019',"Venerdì 18 gennaio al Circolo della Stampa di Trieste presentazione del video “Viaggio in Dalmazia” di Franco Viezzoli",
   I('2019-01-18 17:30',VCS,time='ore 17.30',contacts='+39 335 6750946'),[])
go(311,'fabio-colussi-salone-darte-2018',"Fabio Colussi: da sabato 8 dicembre 2018 la mostra personale del pittore triestino al Salone d'Arte di Trieste",
   I('2018-12-08 18:00',VSAL,'2018-12-08','2018-12-31','tutti i giorni 10 - 12 e 16.30 - 19',True,'+39 335 6750946 · +39 348 8965899'),
   [('colussi-proroga-28-febbraio-2019',"Fabio Colussi: prorogata fino al 28 febbraio la mostra personale del pittore triestino al Salone d'Arte di Trieste",True),
    ('colussi-articolo-sole-24-ore-2018',"Articolo de Il Sole 24 Ore",False)],invs=('invito.pdf','Sole24_def.pdf'))
go(310,'bellezza-per-la-bonta-2018',"XIX edizione della mostra di pittura La bellezza per la bontà – L'arte aiuta la vita",
   I('2018-10-27 11:00',VDUINO,'2018-10-27','2018-11-04','orario di apertura del Castello',True,'+39 335 6750946'),[],dlkind='download',
   press_prefix="**2° inaugurazione: 5 novembre 2018, ore 17.30**, nella Sede della Comunità Greco-Orientale di Trieste (Riva 3 Novembre, 9). **Quando:** 5 - 11 novembre 2018. **Orario:** tutti i giorni ore 11 - 13 / 17 - 19.")
