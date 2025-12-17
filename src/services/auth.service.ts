import { Injectable, signal, computed } from '@angular/core';
import { supabase } from '../supabase/client';
import { Session, AuthError, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { Profile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  session = signal<Session | null>(null);
  profile = signal<Profile | null>(null);

  isAdmin = computed(() => this.profile()?.role === 'admin');
  isClient = computed(() => this.profile()?.role === 'client');

  constructor() {
    supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      if (data.session?.user) {
        this.getProfile(data.session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      this.session.set(session);
      if (session?.user) {
        this.getProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
    });
  }

  async getProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase.auth.signUp(credentials);
    if (data.user) {
      // The trigger will create the profile, but we can try to fetch it right away
      // It might fail if replication is slow, but onAuthStateChange will catch it.
      await this.getProfile(data.user.id);
    }
    return { error };
  }

  async signIn(credentials: SignUpWithPasswordCredentials): Promise<{ error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (data.user) {
      await this.getProfile(data.user.id);
    }
    return { error };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
    return { error };
  }
}