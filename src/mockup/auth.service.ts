import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Session, AuthError, SignUpWithPasswordCredentials, Subscription } from '@supabase/supabase-js';
import { Profile } from './user.model';
import { SupabaseProvider } from '../supabase/provider';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseProvider = inject(SupabaseProvider);
  session = signal<Session | null>(null);
  profile = signal<Profile | null>(null);

  isAdmin = computed(() => this.profile()?.role === 'admin');
  isClient = computed(() => this.profile()?.role === 'client');

  constructor() {
    effect((onCleanup) => {
      const client = this.supabaseProvider.client();
      let authListener: Subscription | undefined;

      if (client) {
        // Pega a sessão atual quando o cliente se torna disponível
        client.auth.getSession().then(({ data }) => {
          this.session.set(data.session);
          if (data.session?.user) {
            this.getProfile(data.session.user.id);
          }
        });

        // Configura o listener para mudanças no estado de autenticação
        const { data } = client.auth.onAuthStateChange((event, session) => {
          this.session.set(session);
          if (session?.user) {
            this.getProfile(session.user.id);
          } else {
            this.profile.set(null);
          }
        });
        authListener = data.subscription;
        
      } else {
        // Se o cliente não estiver disponível, reseta o estado de autenticação
        this.session.set(null);
        this.profile.set(null);
      }

      // A função de limpeza do effect garante que o listener seja removido
      // antes da próxima execução do effect ou quando o componente for destruído.
      onCleanup(() => {
        authListener?.unsubscribe();
      });
    });
  }
  
  private generateNotConfiguredError(): AuthError {
    // FIX: The returned object literal did not conform to the AuthError type.
    // Instantiating AuthError directly creates a valid error object.
    return new AuthError(
      'O Supabase não está configurado. Por favor, inicialize o widget primeiro.',
      400
    );
  }

  async getProfile(userId: string): Promise<void> {
    const client = this.supabaseProvider.client();
    if (!client) return;
    
    const { data, error } = await client
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error.message);
      if (error.details) {
        console.error('Details:', error.details);
      }
      this.profile.set(null);
    } else {
      this.profile.set(data as Profile | null);
    }
  }

  async signUp(credentials: SignUpWithPasswordCredentials): Promise<{ error: AuthError | null }> {
    const client = this.supabaseProvider.client();
    if (!client) {
      return { error: this.generateNotConfiguredError() };
    }

    const { data, error } = await client.auth.signUp(credentials);
    if (data.user) {
      await this.getProfile(data.user.id);
    }
    return { error };
  }

  async signIn(credentials: SignUpWithPasswordCredentials): Promise<{ error: AuthError | null }> {
    const client = this.supabaseProvider.client();
    if (!client) {
      return { error: this.generateNotConfiguredError() };
    }
    
    const { data, error } = await client.auth.signInWithPassword(credentials);
    if (data.user) {
      await this.getProfile(data.user.id);
    }
    return { error };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const client = this.supabaseProvider.client();
    if (!client) {
      return { error: this.generateNotConfiguredError() };
    }

    const { error } = await client.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
    return { error };
  }
}
