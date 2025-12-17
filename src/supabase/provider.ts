import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseProvider {
  client = signal<SupabaseClient | null>(null);

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa ou re-inicializa o cliente Supabase com base nas credenciais
   * armazenadas no localStorage. Atualiza o signal do cliente.
   */
  initialize(): void {
    if (typeof window !== 'undefined') {
      const url = localStorage.getItem('supabaseUrl');
      const key = localStorage.getItem('supabaseApiKey');
      
      if (url && key) {
        this.client.set(createClient(url, key));
      } else {
        this.client.set(null);
      }
    }
  }
}
