Please note, that this project, while following numbering syntax, it DOES NOT adhere to Semantic Versioning rules.
## v.v2.1.26 released 09/07/2021
- Updated deps
- Fixed account sync issue

## v.2.1.10 released 30/09/2020

- Fixed multiple users bugs
- Resolved numerous issues
- Updated deps

## v.2.1.6 released 07/07/2020

- Implemented macOS X support and fixed numerous Mac compatibility issues
- Fixed regressions connected to Mac implementation
- Fixed human draft
- Fixed hotkeys issue with hiding own or opponent deck with hotkeys

## v.2.0.49 released 07/06/2020

- Human draft support
- Deps update
- Bug fixes

## v.2.0.48 released 15/05/2020

- New log filename support
- Ai Bot Matches and Direc Challenge support
- Deps update (Electron 9)
- Bug fixes
- Overall stability improvement

## v.2.0.45 released 05/05/2020

- Fixed Mulligan handling
- Fixed Accounts tab to display actual data
- Updated deps

## v.2.0.44 released 04/05/2020

- Fixed multiple accounts handling
- Fixed critical bugs
- Updated deps

## v.2.0.39 released 01/04/2020

- Fixed critical bugs
- Updated deps
- Added multi-game support (preparation for next releases)

## v.2.0.37 released 10/02/2020

- NEW: starting hand analysis with color indication of good and bad cards
- Improved new user expirience. Now if your browser for some reason isn't able to open Sync screen automatically, you will be able to copy the link manually and open it.
- Better aligment of interface elements.

## v.2.0.36 released 08/02/2020

- Custom re-binding of hotkeys implemented

## v.2.0.35 released 06/02/2020

- Electron upgraded to v8
- Reduced CPU usage in idle state to ~0%
- Bugfixes and improvements

## v.2.0.32 released 24/01/2020

- Turn number tracking. Now tracker will log matches in more detailed way. Frontend update upcoming.
- Electron & other deps update
- Some bugfixes

## v.2.0.30 released 10/01/2019

- Basic lands grouping: now if you have 10 different lands in your deck, overlay will show only one row for them.
- No more desktop shortcut recreation
- Fixes and optimizations.

## v.2.0.29 released 04/01/2019

- Shadow old logs parsing: now all new users will automatically get synced all logs in MTGA Logs directory, so it will result in getting about month of tracked data right from tracker start.
- Better multiple accounts handling.
- More control over old logs parsing.
- Improved stability of old logs parsing.
- Improved errors telemetry: now we will definitely know if your tracked does something weird.

## v.2.0.28 released 31/12/2019

- Better old logs parsing: now skips empty logs without error and correctly works with user switch events.
- Better timestamp acquisition using stats of log files.
- Faster collection updates and overall faster sync for new users.
- Added settings to locate MTGA installation dir to avoid errors if it's non-standard.

## v.2.0.27 released 26/12/2019

- Now you can detach overlay from MTGA window and place it wherever you like. Especially useful for users with several monitors.
- More hotkeys
- Hotkey map on General tab to make it easier to memorize them.
- Bunch of bugfixes

## v.2.0.26 released 25/12/2019

- Better Hotkeys handling: they work only when overlay is active and can be disabled globally
- Implemented automated MTGA data uploads to minimize time required to update MTGA Pro serviced for new MTGA features
- Bunch of bugfixes

## v.2.0.25 released 24/12/2019

- Hotkeys enabled (ALT+Q, ALT+W, ALT+~)
- Better errors handling for improved stability

## v.2.0.24 released 23/12/2019

- Overlay fixes
- Improved card images on hover
- Visual improvements of overlay

## v.2.0.22 released 22/12/2019

- Now you can adjust font color of the overlay
- Overlay shows draw probablilities of lands of specific colors
- Big background cleanup which should lead to performance update and reduce of bugs

## v.2.0.21 released 20/12/2019

- Tracker controls are collapsible to avoid blocking Opponent's name.
- Cards hover images are affected by transparency and zoom settings.
- Hide my/opp deck settings in Overlay settings are working now.
- Not implemented settings are disabled in the menu.
- Timers are available.
- Fixed some bugs and made tiny visuals improvements.

## v.2.0.19 released 19/12/2019

- More control over overlay: opacity, position and size

## v.2.0.18 released 18/12/2019

- International MTGA date formats fix
- Overlay is dragable now (for now position is not being saved)
- Some bugs are fixed.

## v.2.0.17 released 17/12/2019

- Fixed overlay: FINALLY it's showing up
- Impelmented most if overlay's settings
- Fixed some bugs

## v.2.0.16 released 14/12/2019

- Rewritten log parser: less CPU usage, more stability, no missed data.
- Further upgrade of code quality.
- Update issues are resolved.
- Smoother authentication for users.
- Overal improved user expirience.
- Added logging of exceptions for better debugging.

## v.2.0.15 released 30/11/2019

- Huge code quality improvements for better stability and debugging
- Better updates settings: you can now enable manual updates to avoid intrusive auto-update
- Improved stability
- Implemented experimental overlay. It's still in very early alpha quality, so don't freak out. If you can't stand unfinished stuff, it's better to disable overlay for you.

## v.2.0.11 released 25/11/2019

- Fixed bugs with parsing: increased speed, improved stability
- Settings tab implemented
- Old log scanning implemented
