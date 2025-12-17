import { Injectable, signal } from '@angular/core';

const MAX_HISTORY_LENGTH = 10;
export type View = 'home' | 'profile' | 'settings';

@Injectable({
  providedIn: 'root'
})
export class NavigationTrackingService {
  currentRoute = signal<View>('home');
  history = signal<View[]>(['home']);

  constructor() {
    // All navigation is now internal state, no browser API interaction needed.
  }

  navigateTo(view: View): void {
    if (this.currentRoute() === view) {
      return; // Do nothing if already on the same view
    }

    this.currentRoute.set(view);
    
    this.history.update(currentHistory => {
      const newHistory = [...currentHistory, view];
      
      // Limit the history to the last MAX_HISTORY_LENGTH entries
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
      }
      
      return newHistory;
    });
  }
}
