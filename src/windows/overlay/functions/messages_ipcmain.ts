import {sortcards} from 'root/lib/sortcards';
import {lz} from 'root/lib/utils';
import {Card} from 'root/models/cards';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';
import {dragger} from 'root/windows/overlay/functions/dragger';
import {drawDeck} from 'root/windows/overlay/functions/drawdeck';
import {drawDraft} from 'root/windows/overlay/functions/drawdraft';
import {opacityIncrement, scaleIncrement} from 'root/windows/overlay/functions/sethandlers';
import {opacitySetter, scalesetter} from 'root/windows/overlay/functions/setters';
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
  onMessageFromIpcMain('set-icosettings', (ico) => {
    if (ico !== undefined) {
      overlayConfig.icon = ico;
    }
    Object.keys(icons).forEach((i) => {
      overlayElements.LogoSpan.classList.remove(`ms-${icons[i]}`);
    });
    overlayElements.LogoSpan.classList.add(`ms-${icons[overlayConfig.icon]}`);
  });

  onMessageFromIpcMain('set-ovlsettings', (settings) => {
    overlayConfig.ovlSettings = settings;
    const smallpics = document.getElementsByClassName('CardSmallPic');
    if (!overlayConfig.ovlSettings?.showcardicon) {
      Array.from(smallpics).forEach((pic) => {
        pic.classList.add('picWithNoPic');
      });
    } else {
      Array.from(smallpics).forEach((pic) => {
        pic.classList.remove('picWithNoPic');
      });
    }

    if (overlayConfig.ovlSettings && overlayConfig.justcreated) {
      overlayConfig.currentScale = overlayConfig.ovlSettings.savescale !== 0 ? overlayConfig.ovlSettings.savescale : 1;
      scalesetter(false);
      if (overlayConfig.ovlSettings.savepositionleft !== 0) {
        overlayElements.MainDeckFrame.style.top = `${overlayConfig.ovlSettings.savepositiontop}%`;
        overlayElements.MainDeckFrame.style.left = `${overlayConfig.ovlSettings.savepositionleft}%`;
      }
      if (overlayConfig.ovlSettings.savepositionleftopp !== 0) {
        overlayElements.OpponentOutFrame.style.top = `${overlayConfig.ovlSettings.savepositiontopopp}%`;
        overlayElements.OpponentOutFrame.style.left = `${overlayConfig.ovlSettings.savepositionleftopp}%`;
      }
      dragger(overlayElements.MainDeckFrame, overlayElements.MoveHandle);
      dragger(overlayElements.OpponentOutFrame, overlayElements.OppMoveHandle);

      overlayConfig.currentOpacity = overlayConfig.ovlSettings.opacity !== 0 ? overlayConfig.ovlSettings.opacity : 1;
      opacitySetter(false);
    }

    if (
      overlayConfig.ovlSettings &&
      overlayConfig.ovlSettings.savepositionleft === 0 &&
      overlayConfig.ovlSettings.savepositiontop === 0
    ) {
      overlayElements.MainDeckFrame.style.top = '15%';
      overlayElements.MainDeckFrame.style.left = '0px';
    }

    if (
      overlayConfig.ovlSettings &&
      overlayConfig.ovlSettings.savepositionleftopp === 0 &&
      overlayConfig.ovlSettings.savepositiontopopp === 0
    ) {
      overlayElements.OpponentOutFrame.style.top = '15%';
      overlayElements.OpponentOutFrame.style.right = '0px';
    }

    if (overlayConfig.ovlSettings?.hidemain) {
      overlayElements.OverlayMenu.classList.add('hidden');
    } else {
      overlayElements.OverlayMenu.classList.remove('hidden');
    }

    if (currentDraft.isDrafting) {
      drawDraft();
    }
    if (currentMatch.matchId !== '') {
      updateDeck([]);
    }

    overlayConfig.justcreated = false;
  });

  onMessageFromIpcMain('set-zoom', (zoom) => {
    sendMessageToIpcMain('set-scale', zoom);
  });

  onMessageFromIpcMain('set-metadata', (meta) => {
    overlayConfig.metaData = meta;
    overlayConfig.allCards = new Map(meta.allcards);
    overlayConfig.metaData.allcards = [];
  });

  onMessageFromIpcMain('set-userdata', (umeta) => {
    Object.keys(umeta.collection).forEach((col) => {
      userCollection.set(+col, umeta.collection[+col].it);
    });

    Object.keys(umeta.coursedecks).forEach((eventName) => {
      playerDecks[eventName] = {
        mainDeck: umeta.coursedecks[eventName].deckstruct,
        deckId: umeta.coursedecks[eventName].udeck,
        deckName: umeta.coursedecks[eventName].humanname,
      };
    });
    //console.log(playerDecks);
  });

  onMessageFromIpcMain('match-started', (newMatch) => {
    let DeckToLoad = newMatch.eventId;
    if (!Object.keys(playerDecks).includes(newMatch.eventId)) {
      DeckToLoad = 'FromMessage';
    }
    if (!playerDecks[DeckToLoad]) {
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
    currentMatch.myFullDeck = playerDecks['FromMessage']
      ? playerDecks['FromMessage'].mainDeck
      : playerDecks[DeckToLoad].mainDeck;
    currentMatch.humanname = playerDecks[DeckToLoad].deckName;
    drawDeck();
  });

  onMessageFromIpcMain('turn-info', (dp) => {
    currentMatch.TurnNumber = dp.turnNumber !== undefined ? dp.turnNumber : 0;
    if (!overlayConfig.ovlSettings?.timers) {
      return;
    }
    currentMatch.switchTimer(dp.decisionPlayer);
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

  onMessageFromIpcMain('deck-message', (deck) => {
    if (!overlayConfig.metaData) {
      return;
    }

    if (!Object.keys(playerDecks).includes('FromMessage')) {
      playerDecks['FromMessage'] = {mainDeck: [], deckId: 'FromMessage', deckName: ''};
    } else {
      playerDecks['FromMessage'].mainDeck = [];
      playerDecks['FromMessage'].deckId = 'FromMessage';
      playerDecks['FromMessage'].deckName = '';
    }

    const SortLikeMTGA = 11;
    const meta = overlayConfig.metaData;
    const allcards = overlayConfig.allCards;
    const theDeck: {[index: number]: number} = {};
    const forsort: {[index: number]: Card} = {};

    //console.log(meta);

    Object.keys(deck).forEach((MtgaCid) => {
      const cid = meta.mtgatoinnerid[+MtgaCid];
      theDeck[+cid] = deck[+MtgaCid];
      forsort[+cid] = allcards.get(+cid) as Card;
    });
    sortcards(forsort, true, SortLikeMTGA).forEach((cid) => {
      playerDecks['FromMessage'].mainDeck.push({card: +cid[0], cardnum: theDeck[+cid[0]]});
    });
    console.log(playerDecks);
  });

  onMessageFromIpcMain('deck-submission', (deck) => {
    if (!overlayConfig.metaData) {
      return;
    }

    const PublicEventName = overlayConfig.metaData.formats.find((f) => f.format === deck.InternalEventName)
      ?.PublicEventName;

    if (PublicEventName === undefined) {
      return;
    }

    if (!Object.keys(playerDecks).includes(PublicEventName)) {
      playerDecks[PublicEventName] = {mainDeck: [], deckId: deck.deckId, deckName: deck.deckName};
    } else {
      playerDecks[PublicEventName].mainDeck = [];
      playerDecks[PublicEventName].deckId = deck.deckId;
      playerDecks[PublicEventName].deckName = deck.deckName;
    }

    const SortLikeMTGA = 11;
    const meta = overlayConfig.metaData;
    const allcards = overlayConfig.allCards;
    const theDeck: {[index: number]: number} = {};
    const forsort: {[index: number]: Card} = {};

    //console.log(meta);

    Object.keys(deck.mainDeck).forEach((MtgaCid) => {
      const cid = meta.mtgatoinnerid[+MtgaCid];
      theDeck[+cid] = deck.mainDeck[+MtgaCid];
      forsort[+cid] = allcards.get(+cid) as Card;
    });
    sortcards(forsort, true, SortLikeMTGA).forEach((cid) => {
      playerDecks[PublicEventName].mainDeck.push({card: +cid[0], cardnum: theDeck[+cid[0]]});
    });
  });

  onMessageFromIpcMain('mulligan', (res) => {
    if (res) {
      currentMatch.mulligan();
      const AllCards = document.getElementsByClassName('DcDrow');
      Array.from(AllCards).forEach((theCard) => theCard.classList.remove('outCard'));
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

  onMessageFromIpcMain('card-played', (arg) => {
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

  onMessageFromIpcMain('draft-turn', (draft) => {
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

  onMessageFromIpcMain('toggle-me', () => {
    overlayElements.MainDeckFrame.classList.contains('hidden')
      ? overlayElements.MainDeckFrame.classList.remove('hidden')
      : overlayElements.MainDeckFrame.classList.add('hidden');
    toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
  });

  onMessageFromIpcMain('toggle-opp', () => {
    overlayElements.OpponentOutFrame.classList.contains('hidden')
      ? overlayElements.OpponentOutFrame.classList.remove('hidden')
      : overlayElements.OpponentOutFrame.classList.add('hidden');
    toggleButtonClass(overlayElements.ToggleOpp, overlayElements.OpponentOutFrame.classList.contains('hidden'));
  });

  onMessageFromIpcMain('toggle-all', () => {
    if (overlayElements.Collapser.classList.contains('CollapserIco')) {
      overlayElements.Collapser.classList.remove('CollapserIco');
      overlayElements.Collapser.classList.add('ExpanderIco');
      overlayElements.CollapsibleMenu.classList.add('hidden');
    } else {
      overlayElements.Collapser.classList.remove('ExpanderIco');
      overlayElements.Collapser.classList.add('CollapserIco');
      overlayElements.CollapsibleMenu.classList.remove('hidden');
    }
  });

  onMessageFromIpcMain('scale-up', () => {
    overlayConfig.currentScale += scaleIncrement;
    scalesetter(true);
  });
  onMessageFromIpcMain('scale-down', () => {
    overlayConfig.currentScale -= scaleIncrement;
    scalesetter(true);
  });
  onMessageFromIpcMain('opacity-up', () => {
    if (overlayConfig.currentOpacity < 1) {
      overlayConfig.currentOpacity += opacityIncrement;
      opacitySetter(true);
    }
  });
  onMessageFromIpcMain('opacity-down', () => {
    const minOpacity = 0.3;
    if (overlayConfig.currentOpacity > minOpacity) {
      overlayConfig.currentOpacity -= opacityIncrement;
      opacitySetter(true);
    }
  });
}
