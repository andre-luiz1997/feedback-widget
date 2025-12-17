import { Component, ChangeDetectionStrategy, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminView } from '../../admin.service';
import { SupabaseService } from '../../../services/supabase.service';
import { FeedbackRecord, FeedbackSeverity, FeedbackStatus, FeedbackType } from '../../../models/feedback.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, FormsModule]
})
export class DashboardComponent {
  adminService = inject(AdminService);
  supabaseService = inject(SupabaseService);

  feedbacks = signal<FeedbackRecord[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Modal states
  selectedFeedback = signal<FeedbackRecord | null>(null);
  feedbackToEdit = signal<FeedbackRecord | null>(null);
  feedbackToDelete = signal<FeedbackRecord | null>(null);

  attachmentUrls = signal<{ name: string; url: string; isImage: boolean }[]>([]);
  isFetchingAttachments = signal(false);

  // Edit modal state
  isSaving = signal(false);
  editStatus = signal<FeedbackStatus>('new');
  editSeverity = signal<FeedbackSeverity | undefined>(undefined);
  editError = signal<string | null>(null);

  // Delete modal state
  isDeleting = signal(false);
  deleteError = signal<string | null>(null);
  
  // Settings page state
  localButtonColor = signal(this.adminService.buttonColor());
  localButtonText = signal(this.adminService.buttonText());
  dbUrl = signal('');
  dbApiKey = signal('');
  settingsMessage = signal('');

  // Filters
  filterType = signal<'all' | FeedbackType>('all');
  filterStatus = signal<'all' | FeedbackStatus>('all');
  filterSeverity = signal<'all' | FeedbackSeverity>('all');
  
  typeOptions = [
    { value: 'all', label: 'Todos os Tipos' }, { value: 'bug_report', label: 'Relato de Bug' }, { value: 'feature_request', label: 'Sugestão' }, { value: 'satisfaction', label: 'Satisfação' }, { value: 'other', label: 'Outro' }
  ];
  statusOptions = [
    { value: 'all', label: 'Todos os Status' }, { value: 'new', label: 'Novo' }, { value: 'acknowledged', label: 'Confirmado' }, { value: 'in_review', label: 'Em Análise' }, { value: 'in_progress', label: 'Em Progresso' }, { value: 'resolved', label: 'Resolvido' }, { value: 'wont_fix', label: 'Não Será Corrigido' }, { value: 'duplicate', label: 'Duplicado' }
  ];
  severityOptions = [
    { value: 'all', label: 'Toda Severidade' }, { value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' }, { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' }
  ];

  filteredFeedbacks = computed(() => {
    return this.feedbacks().filter(fb => {
      const type = this.filterType();
      const status = this.filterStatus();
      const severity = this.filterSeverity();
      const typeMatch = type === 'all' || fb.type === type;
      const statusMatch = status === 'all' || fb.status === status;
      const severityMatch = severity === 'all' || fb.severity === severity;
      return typeMatch && statusMatch && severityMatch;
    });
  });

  constructor() {
    effect(() => {
      if (this.adminService.isOpen()) {
        this.adminService.setView('dashboard');
        this.loadFeedbacks();
        this.loadSettings();
      } else {
        this.feedbacks.set([]);
        this.error.set(null);
        this.closeAllModals();
      }
    });
  }
  
  loadSettings(): void {
    if (typeof window !== 'undefined') {
        this.dbUrl.set(localStorage.getItem('supabaseUrl') || '');
        this.dbApiKey.set(localStorage.getItem('supabaseApiKey') || '');
    }
  }

  async loadFeedbacks(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const { feedbacks, error } = await this.supabaseService.getFeedbacks();
      if (error) throw error;
      this.feedbacks.set(feedbacks);
    } catch (e) {
      this.error.set('Falha ao carregar os feedbacks. Verifique se as credenciais do Supabase estão corretas e se o RLS está configurado.');
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  closeDashboard(): void {
    this.adminService.close();
  }
  
  setView(view: AdminView): void {
    this.adminService.setView(view);
  }

  async viewFeedback(feedback: FeedbackRecord): Promise<void> {
    this.selectedFeedback.set(feedback);
    this.attachmentUrls.set([]);
    if (feedback.attachment_names && feedback.attachment_names.length > 0) {
      this.isFetchingAttachments.set(true);
      try {
        const urls = await this.supabaseService.getAttachmentUrls(feedback.tracking_id, feedback.attachment_names);
        this.attachmentUrls.set(urls.map(u => ({ ...u, isImage: this.isImageFile(u.name) })));
      } catch (error) {
        console.error("Error fetching attachment URLs:", error);
      } finally {
        this.isFetchingAttachments.set(false);
      }
    }
  }

  openEditModal(feedback: FeedbackRecord): void {
    this.feedbackToEdit.set(feedback);
    this.editStatus.set(feedback.status);
    this.editSeverity.set(feedback.severity);
    this.editError.set(null);
  }

  async updateFeedback(): Promise<void> {
    const feedback = this.feedbackToEdit();
    if (!feedback) return;
    this.isSaving.set(true);
    this.editError.set(null);
    const updates = { status: this.editStatus(), severity: this.editSeverity() };
    const { error } = await this.supabaseService.updateFeedback(feedback.id, updates);
    if (error) {
      this.editError.set(`Falha ao atualizar: ${error.message}`);
    } else {
      this.feedbacks.update(current => current.map(fb => fb.id === feedback.id ? { ...fb, ...updates } : fb));
      this.closeEditModal();
    }
    this.isSaving.set(false);
  }

  openDeleteModal(feedback: FeedbackRecord): void {
    this.feedbackToDelete.set(feedback);
    this.deleteError.set(null);
  }

  async deleteFeedback(): Promise<void> {
    const feedback = this.feedbackToDelete();
    if (!feedback) return;
    this.isDeleting.set(true);
    this.deleteError.set(null);
    const { error } = await this.supabaseService.deleteFeedback(feedback.id);
    if (error) {
      this.deleteError.set(`Falha ao deletar: ${error.message}`);
    } else {
      this.feedbacks.update(current => current.filter(fb => fb.id !== feedback.id));
      this.closeDeleteModal();
    }
    this.isDeleting.set(false);
  }
  
  saveSettings(): void {
    this.adminService.buttonColor.set(this.localButtonColor());
    this.adminService.buttonText.set(this.localButtonText());
    if (this.dbUrl() && this.dbApiKey()) {
        // Since this component is only loaded when configured, this logic is for *updating* credentials.
        const configService = new (window as any).FeedbackWidget.ConfigService();
        configService.saveCredentials(this.dbUrl(), this.dbApiKey());
        this.settingsMessage.set('Configurações salvas! A página será recarregada.');
    } else {
        this.settingsMessage.set('Configurações de aparência salvas.');
         setTimeout(() => this.settingsMessage.set(''), 2000);
    }
  }

  private closeAllModals(): void {
    this.selectedFeedback.set(null);
    this.feedbackToEdit.set(null);
    this.feedbackToDelete.set(null);
    this.attachmentUrls.set([]);
  }
  closeFeedbackModal(): void { this.selectedFeedback.set(null); }
  closeEditModal(): void { this.feedbackToEdit.set(null); }
  closeDeleteModal(): void { this.feedbackToDelete.set(null); }
  
  private isImageFile(fileName: string): boolean {
    return /\.(jpe?g|png|gif|webp)$/i.test(fileName);
  }

  translateType(type: FeedbackType): string { return this.typeOptions.find(o => o.value === type)?.label ?? type; }
  translateStatus(status: FeedbackStatus): string { return this.statusOptions.find(o => o.value === status)?.label ?? status; }
  translateSeverity(severity?: FeedbackSeverity): string {
    if (!severity) return '-';
    return this.severityOptions.find(o => o.value === severity)?.label ?? severity;
  }
  getStatusClass(status: FeedbackStatus): string {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-300';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300';
      case 'resolved': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  }
  getSeverityClass(severity?: FeedbackSeverity): string {
    switch (severity) {
      case 'low': return 'bg-gray-500/20 text-gray-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'high': return 'bg-orange-500/20 text-orange-300';
      case 'critical': return 'bg-red-500/20 text-red-300';
      default: return 'hidden';
    }
  }
  preventDefault(event: Event) {
    event.stopPropagation();
    event.preventDefault();
  }
}
