# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun](https://img.shields.io/badge/make.fun-gta6--trophy--guide--01-ff4d7e)](https://make.fun/c/gta6-trophy-guide-01)
[![License: MIT](https://img.shields.io/badge/License-MIT-3fd8c2.svg)](LICENSE)

An offline web app that is the best guide and tracker for the **55 PlayStation 5 trophies of
Grand Theft Auto VI**: static files that open in a desktop browser and work with the network off.

## What it does

- **Checklist** of all 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with a
  guide to each one, saved in the browser (localStorage), with export and import of progress.
- **Filters** by grade, category and earned/unearned status, plus text search.
- **Spoiler setting** that hides story trophies until they are earned.
- **Roadmap to the platinum**: difficulty 4/10, about 200 hours, 1 playthrough, 0 online
  trophies, in three phases.
- **Missables**: exactly one — *Positive Mental Attitude* (the Chapter 1 meditation at Jason's
  house). Everything else can be finished in free-roam after the story.

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

Or open `app/index.html` directly in a desktop browser. No build step, no network.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # writes out/dossier.json
```

## Sources

Trophy names, descriptions and grades are the official PlayStation list, verified against the
Exophase trophy list. Guide text is original, written from the published PowerPyx trophy guide
and roadmap (facts drawn from it, text never copied). Counts (vehicles, animals, stunts,
challenges) are the numbers the published guides report.

An unofficial fan guide. No Rockstar logo or official artwork is used. License: MIT.
