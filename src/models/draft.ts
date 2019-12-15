export class Draft {
  public PickNumber: number = 0;
  public PackNumber: number = 0;
  public isDrafting: boolean = false;
  public currentPack: number[] = [];

  public over(): void {
    this.PickNumber = 0;
    this.PackNumber = 0;
    this.isDrafting = false;
    this.currentPack = [];
  }

  public draftStep({
    DraftPack,
    PickNumber,
    PackNumber,
  }: {
    DraftPack: number[];
    PickNumber: number;
    PackNumber: number;
  }): void {
    this.PickNumber = PickNumber;
    this.PackNumber = PackNumber;
    this.currentPack = DraftPack;
    this.isDrafting = true;
  }
}
