import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class AuthComponent {
  authService = inject(AuthService);

  isLoginView = signal(true);
  email = signal('');
  password = signal('');
  role = signal<'client' | 'admin'>('client');
  loading = signal(false);
  error = signal<string | null>(null);

  async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.isLoginView()) {
        const { error } = await this.authService.signIn({
          email: this.email(),
          password: this.password()
        });
        if (error) throw error;
      } else {
        const { error } = await this.authService.signUp({
          email: this.email(),
          password: this.password(),
          options: {
            data: {
              role: this.role()
            }
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      this.error.set(err.message || 'Ocorreu um erro.');
    } finally {
      this.loading.set(false);
    }
  }

  toggleView(): void {
    this.isLoginView.update(v => !v);
    this.error.set(null);
  }
}
