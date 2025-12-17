import { Injectable, signal } from '@angular/core';

export type AdminView = 'dashboard' | 'feedbacks' | 'settings';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  isOpen = signal<boolean>(false);
  currentView = signal<AdminView>('dashboard');

  // Settings for the feedback button
  buttonColor = signal<string>('#3b82f6'); // Tailwind blue-600
  buttonText = signal<string>('Feedback');

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  setView(view: AdminView) {
    this.currentView.set(view);
  }
}
