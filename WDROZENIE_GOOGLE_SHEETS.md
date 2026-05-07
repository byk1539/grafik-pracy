# Wdrozenie z Google Sheets - najprostsza wersja

Ta wersja nie wymaga wlasnego serwera. Dane beda trzymane w Google Sheets, a aplikacja bedzie je pobierac przez Google Apps Script.

## 1. Utworz arkusz

1. Wejdz na Google Drive.
2. Kliknij `Nowy` -> `Arkusze Google`.
3. Nazwij plik np. `Grafik pracownikow`.

## 2. Wklej skrypt

1. W arkuszu kliknij `Rozszerzenia` -> `Apps Script`.
2. Usun przykladowy kod.
3. Wklej caly kod z pliku `google-apps-script/Code.gs`.
4. Kliknij ikonke zapisu.

## 3. Opublikuj jako aplikacje internetowa

1. W Apps Script kliknij `Wdroż` -> `Nowe wdrożenie`.
2. Kliknij ikonke zebatki przy `Wybierz typ` i wybierz `Aplikacja internetowa`.
3. Ustaw:
   - `Wykonaj jako`: `Ja`
   - `Kto ma dostep`: `Kazdy`
4. Kliknij `Wdroż`.
5. Google poprosi o zgody. Wybierz swoje konto i zaakceptuj.
6. Skopiuj link konczacy sie na `/exec`.

## 4. Wklej link w aplikacji

1. Otworz `index.html?role=manager`.
2. Wejdz w zakladke `Ustawienia`.
3. Wklej link z Apps Script w pole `Link API z Google Apps Script`.
4. Kliknij `Zapisz ustawienia`.
5. Kliknij `Wyślij do arkusza`, zeby zapisac obecne dane.
6. Wejdz w zakladke `Linki` i skopiuj gotowe linki dla pracownicy, szefa i siebie.

## Gdy pokazuje sie: "Nie udalo sie wyslac do arkusza"

Najczestsze przyczyny:

1. Skrypt nie zostal wdrozony jako `Aplikacja internetowa`.
2. W polu `Kto ma dostep` nie wybrano `Kazdy`.
3. Wklejony link nie konczy sie na `/exec`.
4. Po zmianie kodu Apps Script nie zrobiono ponownego wdrozenia.

Jak naprawic po zmianie kodu:

1. Wejdz w Google Sheets.
2. Kliknij `Rozszerzenia` -> `Apps Script`.
3. Upewnij sie, ze kod jest taki sam jak w `google-apps-script/Code.gs`.
4. Kliknij `Wdroż` -> `Zarzadzaj wdrozeniami`.
5. Kliknij ikonke olowka przy wdrozeniu.
6. Przy `Wersja` wybierz `Nowa wersja`.
7. Kliknij `Wdroż`.
8. Skopiuj link `/exec` i wklej go ponownie w aplikacji w `Ustawienia`.

## 5. Udostepnianie osobom

Link dla osoby wpisujacej godziny:

`index.html?role=input`

Link dla wlasciciela:

`index.html?role=owner`

Link dla Ciebie:

`index.html?role=manager`

Po zapisaniu linku API w ustawieniach aplikacja sama dopisze do tych linkow parametr `api=...`, wiec druga osoba nie musi nic konfigurowac recznie.

Docelowo pliki `index.html`, `app.js` i `styles.css` najlepiej wrzucic na darmowy hosting statyczny, np. Netlify albo GitHub Pages. Wtedy kazdy dostaje normalny link w przegladarce.

## Wazne

To jest prosta wersja. Role w linku ukrywaja zakladki, ale nie sa pelnym systemem bezpieczenstwa. Jesli stawki pracownikow maja byc naprawde chronione, kolejnym krokiem powinno byc dodanie logowania.
