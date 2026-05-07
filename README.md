# Grafik Prosty

Statyczna aplikacja do wpisywania godzin pracy, liczenia godzin, podsumowań dla szefa i analizy kosztów dla managera.

## Jak uruchomić lokalnie

Otwórz plik `index.html` w przeglądarce.

Role są wybierane przez parametr w linku:

- `index.html?role=input` - osoba wpisująca godziny
- `index.html?role=boss` - dashboard dla szefa bez stawek i kosztów
- `index.html?role=manager` - pełny panel managera ze stawkami

## Co już działa

- dodawanie zmian z datą, godziną startu, końca, przerwą i mnożnikiem
- liczenie zmian przechodzących przez północ
- miesięczne podsumowanie godzin dla każdego pracownika
- panel stawek i norm miesięcznych
- koszt wynagrodzeń widoczny tylko w trybie managera
- analiza norm, nadgodzin i kosztów
- eksport JSON, import JSON i eksport CSV
- dane zapisywane lokalnie w przeglądarce

## Udostępnienie linkiem bez własnego serwera

Samą aplikację można wrzucić jako statyczną stronę, np. na GitHub Pages, Netlify albo Cloudflare Pages. To nie wymaga utrzymywania własnego serwera.

Najprostszy wariant synchronizacji to Google Sheets. Instrukcja krok po kroku jest w pliku `WDROZENIE_GOOGLE_SHEETS.md`.

Ważne: role w linku są proste i wygodne, ale nie są pełnym zabezpieczeniem. Do prawdziwej ochrony stawek trzeba później dodać logowanie.
