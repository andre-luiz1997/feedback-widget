import { Injectable, signal } from '@angular/core';

export type AppFlow = 'admin' | 'widget';

@Injectable({
  providedIn: 'root'
})
export class FlowService {
  currentFlow = signal<AppFlow | null>(null);

  selectFlow(flow: AppFlow): void {
    this.currentFlow.set(flow);
  }

  resetFlow(): void {
    this.currentFlow.set(null);
  }
}
