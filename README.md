# Grafik Prosty

Statyczna aplikacja do wpisywania godzin pracy, liczenia godzin, podsumowań dla szefa i analizy kosztów dla managera.

## Jak uruchomić lokalnie

Otwórz plik `index.html` w przeglądarce.

Role są wybierane przez parametr w linku:

- `index.html?role=input` - osoba wpisująca godziny
- `index.html?role=owner` - dashboard dla wlasciciela ze stawkami i kosztami
- `index.html?role=boss` - stary link, nadal dziala i kieruje do trybu wlasciciela
- `index.html?role=manager` - pełny panel managera ze stawkami

## Co już działa

- uproszczone wpisywanie zmian: pracownik, data, start, koniec i notatka
- tworzenie planowanego grafiku pracy dla managera
- podglad grafiku dla wlasciciela i pracownikow
- druk grafiku do PDF przez przycisk `PDF`
- liczenie zmian przechodzących przez północ
- miesięczne podsumowanie dni pracy z możliwością rozwinięcia szczegółów pracowników
- dashboard z zakresem dat: dzien, tydzien, miesiac albo 3 miesiace
- panel stawek i norm miesięcznych
- koszt wynagrodzen widoczny w trybie managera i wlasciciela
- analiza norm, nadgodzin i kosztów
- mini wykres godzin i kosztow dzien po dniu
- raport CSV do Excela dla dnia, tygodnia albo miesiąca
- eksport JSON, import JSON i eksport CSV
- dane zapisywane lokalnie w przeglądarce

## Udostępnienie linkiem bez własnego serwera

Samą aplikację można wrzucić jako statyczną stronę, np. na GitHub Pages, Netlify albo Cloudflare Pages. To nie wymaga utrzymywania własnego serwera.

Najprostszy wariant synchronizacji to Google Sheets. Instrukcja krok po kroku jest w pliku `WDROZENIE_GOOGLE_SHEETS.md`.

Ważne: role w linku są proste i wygodne, ale nie są pełnym zabezpieczeniem. Do prawdziwej ochrony stawek trzeba później dodać logowanie.
