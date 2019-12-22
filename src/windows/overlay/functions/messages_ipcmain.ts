import {sortcards} from 'root/lib/sortcards';
import {lz} from 'root/lib/utils';
import {Card} from 'root/models/cards';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';
import {dragger} from 'root/windows/overlay/functions/dragger';
import {drawDeck} from 'root/windows/overlay/functions/drawdeck';
import {drawDraft} from 'root/windows/overlay/functions/drawdraft';
import {updateDeck} from 'root/windows/overlay/functions/updatedeck';
import {updateOppDeck} from 'root/windows/overlay/functions/updateoppdeck';
import {
  currentDraft,
  currentMatch,
  icons,
  overlayConfig,
  overlayElements,
  playerDecks,
  toggleButtonClass,
  userCollection,
} from 'root/windows/overlay/overlay';

export function SetMessages(): void {
  onMessageFromIpcMain('set-icosettings', ico => {
    if (ico !== undefined) {
      overlayConfig.icon = ico;
    }
    Object.keys(icons).forEach(i => {
      overlayElements.LogoSpan.classList.remove(`ms-${icons[i]}`);
    });
    overlayElements.LogoSpan.classList.add(`ms-${icons[overlayConfig.icon]}`);
  });

  onMessageFromIpcMain('set-ovlsettings', settings => {
    overlayConfig.ovlSettings = settings;
    const smallpics = document.getElementsByClassName('CardSmallPic');
    if (!overlayConfig.ovlSettings?.showcardicon) {
      Array.from(smallpics).forEach(pic => {
        pic.classList.add('picWithNoPic');
      });
    } else {
      Array.from(smallpics).forEach(pic => {
        pic.classList.remove('picWithNoPic');
      });
    }

    if (overlayConfig.ovlSettings && overlayConfig.justcreated) {
      overlayConfig.currentScale = overlayConfig.ovlSettings.savescale !== 0 ? overlayConfig.ovlSettings.savescale : 1;
      overlayElements.MainDeckFrame.style.transform = `scale(${overlayConfig.currentScale})`;
      overlayElements.OpponentOutFrame.style.transform = `scale(${overlayConfig.currentScale})`;
      overlayElements.CardHint.style.transform = `scale(${overlayConfig.currentScale})`;
      if (overlayConfig.ovlSettings.savepositionleft !== 0) {
        overlayElements.MainDeckFrame.style.top = `${overlayConfig.ovlSettings.savepositiontop}%`;
        overlayElements.MainDeckFrame.style.left = `${overlayConfig.ovlSettings.savepositionleft}%`;
      }
      if (overlayConfig.ovlSettings.savepositionleftopp !== 0) {
        overlayElements.OpponentOutFrame.style.top = `${overlayConfig.ovlSettings.savepositiontopopp}%`;
        overlayElements.OpponentOutFrame.style.left = `${overlayConfig.ovlSettings.savepositionleftopp}%`;
      }
      dragger(overlayElements.MainDeckFrame, overlayElements.MoveHandle, overlayConfig.currentScale);
      dragger(overlayElements.OpponentOutFrame, overlayElements.OppMoveHandle, overlayConfig.currentScale);

      overlayConfig.currentOpacity = overlayConfig.ovlSettings.opacity !== 0 ? overlayConfig.ovlSettings.opacity : 1;
      overlayElements.MainDeckFrame.style.opacity = `${overlayConfig.currentOpacity}`;
      overlayElements.OpponentOutFrame.style.opacity = `${overlayConfig.currentOpacity}`;
      overlayElements.CardHint.style.opacity = `${overlayConfig.currentOpacity}`;
    }

    if (currentDraft.isDrafting) {
      drawDraft();
    }
    if (currentMatch.matchId !== '') {
      updateDeck([]);
    }

    overlayConfig.justcreated = false;
  });

  onMessageFromIpcMain('set-zoom', zoom => {
    sendMessageToIpcMain('set-scale', zoom);
  });

  onMessageFromIpcMain('set-metadata', meta => {
    overlayConfig.metaData = meta;
    //console.log(metaData);
  });

  onMessageFromIpcMain('set-userdata', umeta => {
    Object.keys(umeta.collection).forEach(col => {
      userCollection.set(+col, umeta.collection[+col].it);
    });

    Object.keys(umeta.coursedecks).forEach(eventName => {
      playerDecks[eventName] = {
        mainDeck: umeta.coursedecks[eventName].deckstruct,
        deckId: umeta.coursedecks[eventName].udeck,
        deckName: umeta.coursedecks[eventName].humanname,
      };
    });
    //console.log(playerDecks);
  });

  onMessageFromIpcMain('match-started', newMatch => {
    /*console.log('match-started');
    console.log(newMatch.eventId);
    console.log(playerDecks);*/
    if (!Object.keys(playerDecks).includes(newMatch.eventId)) {
      return;
    }
    currentDraft.isDrafting = false;
    overlayElements.MainDeckFrame.classList.add('hidden');
    toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
    currentMatch.matchId = newMatch.matchId;
    currentMatch.ourUid = newMatch.uid;
    currentMatch.myTeamId = newMatch.seatId;
    currentMatch.eventId = newMatch.eventId;
    currentMatch.GameNumber = newMatch.gameNumber;
    currentMatch.myFullDeck = playerDecks[newMatch.eventId].mainDeck;
    currentMatch.humanname = playerDecks[newMatch.eventId].deckName;
    drawDeck();
    //console.log('match-initiated!');
  });

  onMessageFromIpcMain('turn-info', dp => {
    currentMatch.switchTimer(dp);
    if (!overlayConfig.timer) {
      overlayConfig.timer = setInterval(() => {
        currentMatch.tick();
        const me = `${lz(Math.floor(currentMatch.timers.me / 60))}:${lz(currentMatch.timers.me % 60)}`;
        const opponent = `${lz(Math.floor(currentMatch.timers.opponent / 60))}:${lz(
          currentMatch.timers.opponent % 60
        )}`;

        if (overlayElements.myTimer.innerHTML !== me) {
          overlayElements.myTimer.innerHTML = me;
          overlayElements.myTimer.classList.add('timerActive');
          overlayElements.oppTimer.classList.remove('timerActive');
        }
        if (overlayElements.oppTimer.innerHTML !== opponent) {
          overlayElements.oppTimer.innerHTML = opponent;
          overlayElements.oppTimer.classList.add('timerActive');
          overlayElements.myTimer.classList.remove('timerActive');
        }
      }, 1000);
    }
  });

  onMessageFromIpcMain('deck-submission', deck => {
    if (!overlayConfig.metaData) {
      return '';
    }
    if (!Object.keys(playerDecks).includes(deck.InternalEventName)) {
      playerDecks[deck.InternalEventName] = {mainDeck: [], deckId: deck.deckId, deckName: deck.deckName};
    } else {
      playerDecks[deck.InternalEventName].mainDeck = [];
      playerDecks[deck.InternalEventName].deckId = deck.deckId;
      playerDecks[deck.InternalEventName].deckName = deck.deckName;
    }

    const SortLikeMTGA = 11;
    const meta = overlayConfig.metaData;
    const theDeck: {[index: number]: number} = {};
    const forsort: {[index: number]: Card} = {};

    Object.keys(deck.mainDeck).forEach(MtgaCid => {
      const cid = meta.mtgatoinnerid[+MtgaCid];
      theDeck[+cid] = deck.mainDeck[+MtgaCid];
      forsort[+cid] = meta.allcards[+cid];
    });
    sortcards(forsort, true, SortLikeMTGA).forEach(cid => {
      playerDecks[deck.InternalEventName].mainDeck.push({card: +cid[0], cardnum: theDeck[+cid[0]]});
    });
  });

  onMessageFromIpcMain('mulligan', res => {
    if (res) {
      currentMatch.mulligan();
      const AllCards = document.getElementsByClassName('DcDrow');
      Array.from(AllCards).forEach(theCard => theCard.classList.remove('outCard'));
      updateDeck([]);
    }
  });

  onMessageFromIpcMain('match-over', () => {
    currentMatch.over();
    drawDeck();
    updateOppDeck([]);
    overlayElements.MainDeckFrame.classList.add('hidden');
    toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
    overlayElements.OpponentOutFrame.classList.add('hidden');
    toggleButtonClass(overlayElements.ToggleOpp, overlayElements.OpponentOutFrame.classList.contains('hidden'));
    overlayElements.CardHint.classList.add('hidden');
    if (overlayConfig.timer) {
      clearInterval(overlayConfig.timer);
      overlayConfig.timer = undefined;
      overlayElements.myTimer.innerHTML = '';
      overlayElements.oppTimer.innerHTML = '';
    }
  });

  onMessageFromIpcMain('card-played', arg => {
    //console.log(arg);
    const res = currentMatch.cardplayed({
      grpId: arg.grpId,
      instanceId: arg.instanceId,
      ownerSeatId: arg.ownerSeatId,
      zoneId: arg.zoneId,
    });
    if (res.myDeck) {
      if (res.affectedcards.length > 0) {
        updateDeck(res.affectedcards);
      }
    } else {
      updateOppDeck(res.affectedcards);
    }
  });

  onMessageFromIpcMain('draft-turn', draft => {
    //console.log(draft);
    currentDraft.isDrafting = true;
    currentDraft.draftStep(draft);
    drawDraft();
  });

  onMessageFromIpcMain('draft-complete', () => {
    //console.log(draft);
    currentDraft.isDrafting = false;
    overlayElements.MainDeckFrame.classList.add('hidden');
    toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
  });
}
