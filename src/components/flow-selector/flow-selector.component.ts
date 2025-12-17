import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowService, AppFlow } from '../../services/flow.service';

@Component({
  selector: 'app-flow-selector',
  templateUrl: './flow-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class FlowSelectorComponent {
  flowService = inject(FlowService);

  selectFlow(flow: AppFlow): void {
    this.flowService.selectFlow(flow);
  }
}
