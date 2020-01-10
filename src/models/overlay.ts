import {OverlaySettings} from 'root/app/settings-store/settings_store';
import {Card} from 'root/models/cards';
import {Metadata} from 'root/models/metadata';

export interface OverlayConfig {
  ovlSettings: OverlaySettings | undefined;
  metaData: Metadata | undefined;
  allCards: Map<number, Card>;
  currentScale: number;
  currentOpacity: number;
  dopplerOpacity: number;
  justcreated: boolean;
  icon: string;
  highlightTimeout: number;
  timer?: NodeJS.Timeout;
}
