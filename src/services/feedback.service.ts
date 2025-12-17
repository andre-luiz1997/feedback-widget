
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  isOpen = signal<boolean>(false);
  isTriggered = signal<boolean>(false);
  prefilledTitle = signal<string | null>(null);
  prefilledDescription = signal<string | null>(null);

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  triggerForError(title: string, description: string) {
    this.prefilledTitle.set(title);
    this.prefilledDescription.set(description);
    
    // Trigger animation, but do not open the widget automatically.
    this.isTriggered.set(true);
    // Reset the trigger after the animation duration (820ms) + buffer
    setTimeout(() => this.isTriggered.set(false), 1000); 
  }
}