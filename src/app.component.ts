import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MockupComponent } from './mockup/mockup.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MockupComponent]
})
export class AppComponent {}
