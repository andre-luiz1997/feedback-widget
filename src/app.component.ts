import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockupComponent } from './mockup/mockup.component';
import { ConfigService } from './services/config.service';
import { FlowService } from './services/flow.service';
import { FlowSelectorComponent } from './components/flow-selector/flow-selector.component';
import { SetupComponent } from './components/setup/setup.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MockupComponent, FlowSelectorComponent, SetupComponent]
})
export class AppComponent {
  configService = inject(ConfigService);
  flowService = inject(FlowService);

  // A inicialização programática foi removida para dar lugar ao novo fluxo de configuração da interface do usuário.
}
