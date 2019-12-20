import {OverlaySettings} from 'root/app/settings_store';
import {Metadata} from 'root/models/metadata';

export interface OverlayConfig {
  ovlSettings: OverlaySettings | undefined;
  metaData: Metadata | undefined;
  currentScale: number;
  currentOpacity: number;
  dopplerOpacity: number;
  justcreated: boolean;
  icon: string;
  highlightTimeout: number;
}
