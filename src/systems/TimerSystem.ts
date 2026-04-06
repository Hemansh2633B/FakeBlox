export class TimerSystem {
  private startTime: number = 0;
  private currentTime: number = 0;
  private isRunning: boolean = false;

  constructor() {}

  public start(): void {
    this.startTime = Date.now();
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
    this.currentTime = Date.now() - this.startTime;
  }

  public reset(): void {
    this.startTime = 0;
    this.currentTime = 0;
    this.isRunning = false;
  }

  public update(): void {
    if (this.isRunning) {
      this.currentTime = Date.now() - this.startTime;
    }
  }

  public getTime(): number {
    return this.currentTime;
  }

  public getFormattedTime(): string {
    const totalMs = this.currentTime;
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor(totalMs % 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}
