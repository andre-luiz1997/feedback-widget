import { Component, ChangeDetectionStrategy, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';
import { AppFlow, FlowService } from '../../services/flow.service';
import { createClient } from '@supabase/supabase-js';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class SetupComponent {
  configService = inject(ConfigService);
  flowService = inject(FlowService);

  flow = input.required<AppFlow>();

  setupUrl = signal('');
  setupKey = signal('');
  setupError = signal<string | null>(null);
  isConnecting = signal(false);

  async connectToSupabase(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isConnecting()) return;

    this.isConnecting.set(true);
    this.setupError.set(null);

    const url = this.setupUrl();
    const key = this.setupKey();

    if (!url || !key) {
      this.setupError.set('Por favor, preencha ambos os campos.');
      this.isConnecting.set(false);
      return;
    }
    // Basic validation
    try {
        new URL(url);
    } catch(e) {
        this.setupError.set('A URL do projeto Supabase parece ser inválida.');
        this.isConnecting.set(false);
        return;
    }
    
    if (!key.startsWith('sbp_') && !key.startsWith('ey') && !key.startsWith('sb_publishable_')) {
        this.setupError.set('A chave pública do Supabase parece ser inválida. Deve começar com "sbp_", "sb_publishable_", ou "ey".');
        this.isConnecting.set(false);
        return;
    }

    // Tenta conectar e executar uma consulta de teste antes de salvar.
    try {
      const tempSupabaseClient = createClient(url, key);
      // Esta é uma consulta leve para verificar se a conexão e a chave são válidas.
      // Tenta obter a contagem de feedbacks, o que falhará se a chave anônima estiver errada
      // ou se a URL estiver incorreta.
      const { error } = await tempSupabaseClient.from('feedbacks').select('id', { count: 'exact', head: true });
      
      if (error && (error.message.includes('JWT') || error.message.includes('Unauthorized'))) {
         throw new Error('A chave pública (anon) do Supabase é inválida ou expirou.');
      } else if (error && error.message.includes('relation "public.feedbacks" does not exist')) {
         // Isso significa que a tabela 'feedbacks' não existe.
         throw new Error("Conectado com sucesso, mas a tabela 'feedbacks' não foi encontrada. Você executou o script de configuração do banco de dados?");
      } else if (error) {
        // Outros erros potenciais (rede, RLS, etc.)
        throw error;
      }
      
      // Se chegarmos aqui, a conexão é válida.
      this.configService.saveCredentials(url, key);
      // O serviço recarrega a página, que irá reavaliar o estado do aplicativo.

    } catch (e: unknown) {
      const err = e as Error;
      console.error("Falha no teste de conexão:", err);
      // Fornece uma mensagem de erro amigável.
      if (err.message.includes("Failed to fetch")) {
        this.setupError.set('Falha ao conectar. Verifique a URL do projeto e sua conexão de rede.');
      } else {
        this.setupError.set(err.message || 'Falha ao conectar. Verifique se as credenciais estão corretas.');
      }
      this.isConnecting.set(false);
    }
  }
  
  goBack(): void {
    this.flowService.resetFlow();
  }
}
