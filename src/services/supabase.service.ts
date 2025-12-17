import { Injectable } from '@angular/core';
import { supabase } from '../supabase/client';
import { Feedback, FeedbackRecord, FeedbackStatus, FeedbackSeverity } from '../models/feedback.model';

type FeedbackPayload = Omit<Feedback, 'attachments'> & {
    attachment_names?: string[];
    user_id?: string;
};

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  async addFeedback(feedback: FeedbackPayload): Promise<{ trackingId: string; error: Error | null }> {
    const trackingId = `FB-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([
        { 
          title: feedback.title,
          description: feedback.description,
          type: feedback.type,
          severity: feedback.severity,
          email: feedback.email || null,
          name: feedback.name || null,
          attachment_names: feedback.attachment_names,
          status: 'new',
          tracking_id: trackingId,
          user_id: feedback.user_id,
          current_route: feedback.current_route,
          navigation_history: feedback.navigation_history,
        }
      ])
      .select('tracking_id')
      .single();

    if (error) {
      console.error('Error inserting feedback:', error.message);
      if (error.details) console.error('Details:', error.details);
      if (error.hint) console.error('Hint:', error.hint);
      
      let userMessage = 'Ocorreu um erro ao enviar seu feedback. Tente novamente.';
      if (error.message.includes('violates row-level security policy')) {
        userMessage = 'O envio do feedback falhou devido a uma política de segurança. Verifique se você está logado e tente novamente.';
      } else if (error.message.includes('foreign key constraint')) {
        userMessage = 'O envio do feedback falhou devido a um problema de dados. Por favor, recarregue a página e tente novamente.';
      }
      
      return { trackingId: '', error: new Error(userMessage) };
    }

    return { trackingId: data?.tracking_id ?? trackingId, error: null };
  }

  async getFeedbacks(): Promise<{ feedbacks: FeedbackRecord[]; error: Error | null }> {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedbacks:', error);
      return { feedbacks: [], error: new Error(error.message) };
    }

    return { feedbacks: (data as FeedbackRecord[]) ?? [], error: null };
  }
  
  async uploadAttachments(files: File[], trackingId: string): Promise<{ error: Error | null }> {
    const uploadPromises = files.map(file => 
      supabase.storage.from('test').upload(`public/${trackingId}/${file.name}`, file)
    );

    const results = await Promise.all(uploadPromises);
    const errors = results.map(result => result.error).filter(Boolean);

    if (errors.length > 0) {
      console.error('Errors uploading attachments:', errors);
      return { error: new Error(errors.map(e => e.message).join(', ')) };
    }

    return { error: null };
  }

  async getAttachmentUrls(trackingId: string, attachmentNames: string[]): Promise<{ name: string; url: string }[]> {
    const urls = attachmentNames.map(name => {
      const { data } = supabase.storage.from('test').getPublicUrl(`public/${trackingId}/${name}`);
      return { name, url: data.publicUrl };
    });
    return urls;
  }

  async updateFeedback(id: number, updates: { status?: FeedbackStatus; severity?: FeedbackSeverity }): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('feedbacks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating feedback:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  }

  async deleteFeedback(id: number): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting feedback:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  }
}