# MTGA Pro Tracker 2.0
MTGA Pro Tracker is an advanced Magic the Gathering: Arena tracking tool that automatically uploads collection, decks, battles, draft and inventory from your game client to our server. No manual collection input, no manual uploads. New cards, battles & drafts are added immediately based on in-game events.

## What can I do with MTGA Pro Tracker?
* Real Time Collection & Decks Import.
* Share Progress and Wins/Losses.
* Track your Wildcards, Boosters and Vault.
* Deckbuild using your current collection.
* Get in-game help with matches and draft using the Overlay tool.

## INSTALLATION STEP-BY-STEP GUIDE
* Download MTGA Pro Tracker from our Github repo Releases section (https://github.com/Razviar/mtgap/releases ). Antivirus software (including Windows Defender) could be alarmed because of the app's ability to upload data to remote server and automatic update feature. So if Antivirus is alarmed, you should add this App to exceptions.
* Unpack it and launch EXE Installer.
* Sync your account using respective button in the app interface.

## Windows protected your PC?
When you get mesage "Windows protected your PC", you should click "More Info..." and "Run Anyway". Defender gets alarmed because application is not known enough. After several scans, it will calm down and let you use Tracker. 

## TRACKER IS NOT UPDATING?
App crashes or not starting? No recent updates uploaded? Follow steps:

1. Make sure you have latest version. It's updated to be compatible with latest MTGA version.
2. Try to stop tracker and run it again
3. Try to wipe accounts data and sync again.
4. Try to locate log file manually (serach for output_log.txt, NOT the logs .log files in MTGA folder inside Program Files!)
5. Try to reboot your PC.
6. Check if antiviruses or firewalls are blocking app traffic, add app to exception.

## Changelog
v.2.0.19 released 19/12/2019
* More control over overlay: opacity, position and size

v.2.0.18 released 18/12/2019
* International MTGA date formats fix
* Overlay is dragable now (for now position is not being saved)
* Some bugs are fixed.

v.2.0.17 released 17/12/2019
* Fixed overlay: FINALLY it's showing up
* Impelmented most if overlay's settings
* Fixed some bugs

v.2.0.16 released 14/12/2019
* Rewritten log parser: less CPU usage, more stability, no missed data.
* Further upgrade of code quality.
* Update issues are resolved.
* Smoother authentication for users.
* Overal improved user expirience.
* Added logging of exceptions for better debugging.


v.2.0.15 released 30/11/2019
* Huge code quality improvements for better stability and debugging
* Better updates settings: you can now enable manual updates to avoid intrusive auto-update
* Improved stability
* Implemented experimental overlay. It's still in very early alpha quality, so don't freak out. If you can't stand unfinished stuff, it's better to disable overlay for you. 

v.2.0.11 released 25/11/2019
* Fixed bugs with parsing: increased speed, improved stability
* Settings tab implemented
* Old log scanning implemented
