import { Component, ChangeDetectionStrategy, inject, signal, computed, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../mockup/auth.service';
import { FeedbackType, FeedbackSeverity } from '../../models/feedback.model';
import { NavigationTrackingService } from '../../mockup/navigation-tracking.service';
import { AdminService } from '../../admin/admin.service';

// Declaração de variáveis globais para as bibliotecas carregadas via CDN
declare var html2canvas: any;
declare var Cropper: any;

@Component({
  selector: 'app-feedback-widget',
  templateUrl: './feedback-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class FeedbackWidgetComponent {
  feedbackService = inject(FeedbackService);
  supabaseService = inject(SupabaseService);
  authService = inject(AuthService);
  navigationService = inject(NavigationTrackingService);
  adminService = inject(AdminService);
  
  view = signal<'form' | 'success'>('form');
  isSubmitting = signal(false);
  isDragging = signal(false);
  trackingId = signal('');
  submissionError = signal<string | null>(null);

  // Form fields as signals
  title = signal('');
  description = signal('');
  type = signal<FeedbackType>('bug_report');
  severity = signal<FeedbackSeverity>('low');
  email = signal('');
  name = signal('');
  attachments = signal<File[]>([]);
  isEmailDisabled = signal(false);

  // Screenshot and Cropper state
  hideWidgetForCapture = signal(false);
  capturedImage = signal<string | null>(null);
  cropperImage = viewChild<ElementRef<HTMLImageElement>>('cropperImage');
  private cropper: any;

  feedbackTypes: { value: FeedbackType, label: string }[] = [
    { value: 'bug_report', label: 'Relatar Bug' },
    { value: 'feature_request', label: 'Sugestão' },
    { value: 'satisfaction', label: 'Satisfação' },
    { value: 'other', label: 'Outro' }
  ];

  constructor() {
    effect(() => {
      const session = this.authService.session();
      if (session?.user?.email) {
        this.email.set(session.user.email);
        this.isEmailDisabled.set(true);
      } else {
        this.isEmailDisabled.set(false);
      }
    });

    // Effect to pre-fill form when triggered by an error
    effect(() => {
      if (this.feedbackService.isOpen()) {
        const prefilledTitle = this.feedbackService.prefilledTitle();
        if (prefilledTitle) {
          this.title.set(prefilledTitle);
          this.feedbackService.prefilledTitle.set(null); // Clear after use to prevent re-filling
        }

        const prefilledDescription = this.feedbackService.prefilledDescription();
        if (prefilledDescription) {
          this.description.set(prefilledDescription);
          this.feedbackService.prefilledDescription.set(null); // Clear after use
        }
      }
    });

    // Effect to initialize or destroy the Cropper.js instance
    effect(() => {
      const imgElement = this.cropperImage()?.nativeElement;
      if (imgElement && this.capturedImage()) {
        if (this.cropper) {
          this.cropper.destroy();
        }
        this.cropper = new Cropper(imgElement, {
          aspectRatio: NaN, // Free ratio
          viewMode: 1, // Restrict crop box to be within the canvas
          background: false,
          autoCropArea: 0.8,
          movable: true,
          zoomable: true,
          rotatable: false,
          scalable: false,
        });
      } else if (this.cropper) {
        this.cropper.destroy();
        this.cropper = null;
      }
    });
  }

  // Form validation
  isDescriptionValid = computed(() => this.description().length >= 10 && this.description().length <= 5000);
  isFormValid = computed(() => this.isDescriptionValid());

  closeWidget(): void {
    this.feedbackService.close();
    this.cancelCrop(); // Ensure cropper is reset if widget is closed
  }
  
  async submitFeedback(): Promise<void> {
    if (!this.isFormValid() || this.isSubmitting()) {
      return;
    }
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    const session = this.authService.session();
    const feedbackData = {
      title: this.title(),
      description: this.description(),
      type: this.type(),
      severity: this.type() === 'bug_report' ? this.severity() : undefined,
      email: this.email(),
      name: this.name(),
      attachment_names: this.attachments().map(f => f.name),
      user_id: session?.user?.id,
      current_route: this.navigationService.currentRoute(),
      navigation_history: this.navigationService.history(),
    };
    
    try {
      const { trackingId, error } = await this.supabaseService.addFeedback(feedbackData);

      if (error) {
        throw error;
      }

      const filesToUpload = this.attachments();
      if (filesToUpload.length > 0 && trackingId) {
        const { error: uploadError } = await this.supabaseService.uploadAttachments(filesToUpload, trackingId);
        if (uploadError) {
          console.error('Failed to upload attachments:', uploadError);
          // Set a non-blocking error message
          this.submissionError.set('Seu feedback foi salvo, mas houve um erro ao enviar os anexos.');
        }
      }
      
      this.trackingId.set(trackingId);
      this.view.set('success');

    } catch (error: unknown) {
      console.error('Feedback submission failed', error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Supabase not configured')) {
         this.submissionError.set('As credenciais do Supabase não foram configuradas corretamente.');
      } else {
         this.submissionError.set('Ocorreu um erro ao enviar seu feedback. Tente novamente.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm(): void {
    this.title.set('');
    this.description.set('');
    this.type.set('bug_report');
    this.severity.set('low');
    this.attachments.set([]);
    this.submissionError.set(null);
    this.view.set('form');
    // Don't reset email if user is logged in
    if (!this.authService.session()) {
      this.email.set('');
      this.name.set('');
    }
  }

  // --- Screenshot Handling ---

  async captureScreen(mode: 'visible' | 'full'): Promise<void> {
    this.hideWidgetForCapture.set(true);
    await new Promise(resolve => setTimeout(resolve, 150)); // Wait for UI to hide

    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        ...(mode === 'full' && {
          width: document.body.scrollWidth,
          height: document.body.scrollHeight,
          windowWidth: document.body.scrollWidth,
          windowHeight: document.body.scrollHeight,
        })
      });

      if (mode === 'full') {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            const file = new File([blob], `screenshot-full-${Date.now()}.png`, { type: 'image/png' });
            this.addAttachments([file]);
          }
        }, 'image/png');
      } else {
        this.capturedImage.set(canvas.toDataURL());
      }
    } catch (err) {
      console.error('Error taking screenshot:', err);
      this.submissionError.set('Falha ao capturar a tela.');
    } finally {
      this.hideWidgetForCapture.set(false);
    }
  }

  confirmCrop(): void {
    if (!this.cropper) return;
    this.cropper.getCroppedCanvas().toBlob((blob: Blob | null) => {
      if (blob) {
        const file = new File([blob], `screenshot-cropped-${Date.now()}.png`, { type: 'image/png' });
        this.addAttachments([file]);
      }
      this.cancelCrop();
    }, 'image/png');
  }

  cancelCrop(): void {
    this.capturedImage.set(null);
  }

  // --- Drag and Drop file handling ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) {
      this.addAttachments(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addAttachments(Array.from(input.files));
      input.value = ''; // Reset input to allow selecting the same file again
    }
  }

  private addAttachments(files: File[]): void {
    this.attachments.update(currentFiles => {
      const combined = [...currentFiles, ...files];
      const unique = combined.filter((file, index, self) =>
        index === self.findIndex(f => f.name === file.name && f.size === file.size)
      );
      return unique.slice(0, 5);
    });
  }

  removeAttachment(fileToRemove: File): void {
    this.attachments.update(currentFiles => currentFiles.filter(file => file !== fileToRemove));
  }
  
  getFormattedFileSize(size: number): string {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}