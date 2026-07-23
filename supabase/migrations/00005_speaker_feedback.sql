alter table speak_requests
  add column if not exists speaker_ghosted boolean,
  add column if not exists speaker_feedback text,
  add column if not exists speaker_feedback_at timestamptz;
