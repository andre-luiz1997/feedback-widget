import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FeedbackWidgetComponent } from './components/feedback-widget/feedback-widget.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AuthComponent } from './components/auth/auth.component';
import { FeedbackService } from './services/feedback.service';
import { AdminService } from './services/admin.service';
import { AuthService } from './services/auth.service';
import { NavigationTrackingService, View } from './services/navigation-tracking.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeedbackWidgetComponent, AdminDashboardComponent, AuthComponent]
})
export class AppComponent {
  feedbackService = inject(FeedbackService);
  adminService = inject(AdminService);
  authService = inject(AuthService);
  navigationTracker = inject(NavigationTrackingService); 

  currentView = this.navigationTracker.currentRoute;

  navigate(event: MouseEvent, view: View): void {
    event.preventDefault();
    this.navigationTracker.navigateTo(view);
  }

  openFeedbackWidget(): void {
    this.feedbackService.open();
  }

  simulateError(): void {
    const errorTitle = 'Erro Inesperado: Falha ao Carregar Dados';
    const errorDescription = `Ocorreu um erro em ${new Date().toISOString()} na página '${this.navigationTracker.currentRoute()}'.\n\nDetalhes do erro: Não foi possível buscar os dados do perfil do usuário do servidor. Por favor, verifique sua conexão ou tente novamente mais tarde.`;
    this.feedbackService.triggerForError(errorTitle, errorDescription);
  }

  openAdminDashboard(): void {
    this.adminService.open();
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
      this.navigationTracker.navigateTo('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}