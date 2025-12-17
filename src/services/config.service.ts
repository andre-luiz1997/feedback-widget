import { Injectable, signal, inject, computed } from '@angular/core';
import { SupabaseProvider } from '../supabase/provider';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private supabaseProvider = inject(SupabaseProvider);

  /**
   * Um signal computado que determina se o aplicativo está configurado.
   * A configuração é considerada completa se o cliente Supabase no provider não for nulo.
   */
  isConfigured = computed(() => !!this.supabaseProvider.client());

  /**
   * Salva as credenciais do Supabase no localStorage e reinicializa o provider
   * para criar um novo cliente Supabase com as novas chaves.
   * @param url A URL do projeto Supabase.
   * @param key A chave pública (anon) do Supabase.
   */
  saveCredentials(url: string, key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabaseUrl', url);
      localStorage.setItem('supabaseApiKey', key);
      // Reinicializa o provider para que o cliente Supabase seja atualizado com as novas credenciais.
      // Isso irá acionar o signal 'isConfigured' e atualizar a UI.
      this.supabaseProvider.initialize();
    }
  }
}
