# Felhasználói Kézikönyv – VaultX Pontozórendszer

## 1. Bevezetés és Rendszerkövetelmények
A VaultX egy modern, felhőalapú sportinformatikai rendszer, amely a lovastorna versenyek papíralapú pontozását hivatott kiváltani. A rendszer valós időben számolja a rész- és végeredményeket, így felgyorsítja a versenyiroda és a bírói panel munkáját, minimalizálva az emberi hibafaktort.

**Hardveres és szoftveres követelmények:**
* **Eszközök:** A rendszer reszponzív, így asztali számítógépen, laptopon és tableten is használható. A bírói asztaloknál a fizikai billentyűzettel rendelkező laptop vagy nagyobb méretű tablet használata javasolt a kényelmes adatbevitel érdekében.
* **Böngésző:** Bármilyen modern webböngésző (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge) naprakész verziója.
* **Hálózat:** A pontok zökkenőmentes beküldéséhez folyamatos, stabil internetkapcsolat (Wi-Fi vagy mobilnet) szükséges.


---

## 2. Hozzáférés és Bejelentkezés
A rendszer szigorú jogosultsági hierarchiára épül, így a biztonság és az adatintegritás érdekében **nyilvános regisztrációra nincs lehetőség**.

1. **Fiók igénylése:** Minden bíró, írnok és versenyirodai munkatárs számára a Rendszergazda (Admin) hozza létre a felhasználói fiókot a verseny előtt, a megfelelő jogosultságok előzetes beállításával.
2. **Bejelentkezés menete:** * Nyissa meg a böngészőben a versenyiroda által megadott webcímet (URL-t).
   * A bejelentkezési képernyőn adja meg a Rendszergazdától kapott **Felhasználónevét** és **Jelszavát**.
   * Kattintson a **Bejelentkezés** gombra.

---

## 3. Az Irányítópultok (Dashboards)
Sikeres bejelentkezés után a felhasználó a fő Irányítópultra (Dashboard) érkezik. A felület modern, "kártyás" elrendezést használ a könnyű navigáció érdekében. **Minden felhasználó kizárólag azokat a funkciókártyákat látja, amelyekhez a szerepköre alapján jogosultsága van.**

* **Rendszergazdák (Admin):** Látják az *Admin dashboard* és *User manager* kártyákat.
* **Versenyiroda (Office):** Látják a *Result calculation manager* és *Result group generator* kártyákat.
* **Bírók és Írnokok:** A legfontosabb kártya számukra a **Scoring View** (Pontozási felület).

---
## 3.1 Help funkció
Minden oldal fejlécében található ? jellel az adott oldalról információt szerezhet a használathoz.


## 4. Szerepkör-specifikus funkciók és modulok

A VaultX rendszer funkciói a bejelentkezett felhasználó jogosultságai alapján három fő kategóriára oszlanak. Kérjük, azt a bekezdést tanulmányozza, amely az Ön pozíciójára vonatkozik.

### 4.1. Írnoki és Bírói Funkciók (Scoring)
Ez a modul felelős a versenyzők éles pontozásáért. A felület ergonómiája szándékosan a hagyományos, papíralapú pontozólapok elrendezését követi, így használata vizuálisan is ismerős és intuitív.

**A pontozás lépései:**
1. **Belépés a modulba:** Az Irányítópulton kattintson a **Scoring View** feliratú kártyára.
2. **Program kiválasztása:** Amennyiben a versenyhez tartozik rögzített napi időrend (Timetable), a képernyőn kilistázódnak az aznapi programok. Válassza ki az éppen zajló versenyszámot.
3. **Versenyző azonosítása:** A szoftver a hivatalos startlista sorrendjében automatikusan betölti a soron következő versenyző/csapat nevét és a hozzá tartozó pontozólapot.
   > ⚠️ **FONTOS FIGYELMEZTETÉS:** Mielőtt elkezdené a pontozást, ellenőrizze, hogy a képernyőn a megfelelő versenyző neve és kategóriája szerepel-e! Amennyiben bármilyen hiba miatt (pl. visszalépés, csere) nem a megfelelő pontozólap jelenik meg, **adatbevitel nélkül azonnal értesítse a versenyirodát!**
4. **Adatbevitel:** Gépelje be a bíró által diktált részpontokat és levonásokat a megfelelő beviteli mezőkbe. A rendszer a háttérben valós időben számítja és frissíti a képernyőn látható részeredményeket.
5. **Véglegesítés:** A gyakorlat végén, az adatok gyors átnézése után kattintson a **Mentés / Beküldés** gombra. Ezt követően a rendszer rögzíti az adatokat, és automatikusan a startlista következő indulójára ugrik.

## 4. Részletes Modulleírások és Kártyák (Dashboard)

A VaultX rendszer funkciói logikai modulokba (kártyákba) vannak szervezve az Irányítópulton. A bejelentkezett felhasználó kizárólag a jogosultsági szintjének (szerepkörének) megfelelő kártyákat látja. Az alábbiakban bemutatjuk a rendszer moduljait és azok funkcióját.

### 4.1. Bírói és Írnoki Modul (Scoring)
* **Scoring View (Pontozó felület):** Az írnokok egyetlen és legfontosabb adatbeviteli felülete. Itt történik a versenyzők gyakorlatainak valós idejű, elemenkénti pontozása a hivatalos startlista alapján. A felület vizuálisan a papíralapú pontozólapokat imitálja.

### 4.2. Verseny és Törzsadat-kezelés (Event & Master Data)
Ezek a kártyák a versenyiroda számára érhetők el. Itt történik a versenyek kiírásához és a nevezésekhez szükséges alapvető entitások rögzítése.
* **Event Manager (Versenykezelő):** Új versenyek létrehozása, alapadataik beállítása és az aktuálisan aktív verseny kiválasztása.
* **Vaulter Manager (Lovastornászok):** A versenyen induló sportolók (vaulters) adatbázisa és regisztrációs felülete.
* **Horse Manager (Lovak):** A lovak regisztrációja és azonosítóik kezelése.
* **Lunger Manager (Futószárasok):** A lovakat irányító futószárasok nyilvántartása.
* **Entries (Nevezések):** A sportolók, a lovak és a futószárasok összerendelése egy adott kategóriában és versenyen. Ez a modul generálja a hivatalos indulói listát.
* **Daily Timetable (Napi időrend):** A verseny programjának percre pontos beosztása. A rendszer ez alapján tudja, hogy a "Scoring View" felületen kinek a pontozólapját kell betöltenie. Továbbá ezen a felületen lehetséges elvégezni a versenyzők sorsolásának menetét az "Order manager" funkciót kiválasztva.

### 4.3. Eredménykezelés (Results)
 > ⚠️ **FONTOS FIGYELMEZTETÉS:** Egy felvitt pontozólap esetén nem számol a rendszer pontszámokat, minden esetben szükséges a programban meghatározott számú leadott pontozólap.
A matematikai háttér és a hivatalos végeredmények aggregálásáért felelős modulok.
* **Result Calculation Manager (Kalkulációkezelő):** A sportági szabályzatnak megfelelő számítási sablonok beállítása (a fordulók közötti százalékos súlyozások).
* **Result Group Generator (Eredménycsoport-generátor):** A kategóriák és a számítási sablonok logikai összekapcsolása a végeredmények kiszámításához.
* **Result Groups (Eredménycsoportok):** A legenerált eredménycsoportok kezelése és áttekintése.
* **Result  (Eredmények):** Az eredménycsoportok alapján megjelenített eredmények.



### 4.4. Rendszergazdai Funkciók (Admin & System)
Kizárólag a legmagasabb (Admin) jogosultsággal rendelkező felhasználók számára látható, a rendszer működését biztosító kártyák.
* **Category Manager (Kategóriakezelő):** A versenyen belüli kategóriák (pl. egyéni, csapat, kötelező, kűr) definiálása a lovastorna szabályzatának megfelelően.
* **User Manager (Felhasználók):** Új felhasználók fiókjainak létrehozása és jelszavak kiosztása.
* **Role Manager (Szerepkörök):** A rendszerben elérhető felhasználói szerepkörök (pl. Admin, Office, Judge) definiálása.
* **Permission Manager (Jogosultságok):** A szerepkörökhöz tartozó finomhangolt hozzáférési jogok (pl. URL végpontok elérése) kezelése.
* **Dashcards Manager (Kártyakezelő):** Maguknak a Dashboard kártyáknak a dinamikus kezelése (láthatóság, stílus, prioritás).
* **Alert Manager (Rendszerüzenetek):** Globális figyelmeztetések és értesítések (Alerts) létrehozása és kiküldése a felhasználók számára.
* **Help Manager (Rendszerüzenetek):** Oldal specifikus segédletek a könnyebb kezelés érdekében.


## 5. Gyakori Kérdések és Hibaelhárítás (GYIK)

**1. Mit tegyek, ha elfelejtettem a jelszavamat vagy nem tudok bejelentkezni?**
A rendszer biztonsági okokból nem küld automatikus jelszó-emlékeztető e-maileket. Kérjük, ellenőrizze, hogy helyesen írta-e be a kis- és nagybetűket! Ha továbbra sem tud belépni, forduljon a Rendszergazdához (Admin), aki azonnal új jelszót tud generálni Önnek.

**2. Beküldés előtt elgépeltem egy pontszámot. Hogyan javíthatom?**
Amíg nem kattintott a "Mentés / Beküldés" gombra, a beviteli mezőbe kattintva bármikor átírhatja az értéket. A rendszer automatikusan újraszámolja a részeredményt a javított adat alapján.

**3. Beküldés *után* vettem észre, hogy rossz pontot adtam le!**
A már véglegesített és elmentett pontozólapokat az írnok biztonsági okokból utólag nem módosíthatja. Ilyen esetben azonnal jelezze a hibát a versenyirodának, akik megfelelő jogosultsággal és hozzáféréssel rendelkeznek a hiba hivatalos, naplózott javításához.

**4. Piros hibaüzenetet kapok mentéskor, vagy eltűnt az internetkapcsolat.**
A rendszer folyamatos hálózati kapcsolatot igényel a szerverrel való kommunikációhoz. Ha megszakad az internet (Wi-Fi), **semmiképpen ne frissítse az oldalt és ne zárja be a böngészőt**, különben az addig beírt pontok elveszhetnek! Várja meg, amíg az eszköz újra csatlakozik a hálózathoz, majd próbálja meg újra a beküldést. Értesítse a verseny rendszergazdáját, amelyet legkönnyebben a versenyirodán keresztül ér el.

**5. Nem a megfelelő versenyző neve jelent meg a képernyőn.**
A szoftver szigorúan a hivatalos startlistát követi. Ha a valóságban más lépett a pályára (például programcsere vagy visszalépés miatt), semmiképp ne írja be a pontokat a rossz névhez! Értesítse a versenyirodát a startlista szinkronizálása és az eltérés tisztázása érdekében.