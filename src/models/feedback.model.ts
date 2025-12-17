export type FeedbackType = 'bug_report' | 'feature_request' | 'satisfaction' | 'other';
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'new' | 'acknowledged' | 'in_review' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate';

export interface Feedback {
  title: string;
  description: string;
  type: FeedbackType;
  severity?: FeedbackSeverity;
  email?: string;
  name?: string;
  attachments?: File[];
  current_route?: string;
  navigation_history?: string[];
}

export interface FeedbackRecord extends Feedback {
    id: number;
    created_at: string;
    status: FeedbackStatus;
    tracking_id: string;
    attachment_names?: string[];
    user_id?: string;
}