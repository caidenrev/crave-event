-- ==============================================================================
-- CRAVE EVENT — INITIAL SEED DATA
-- ==============================================================================

-- 1. PLAYLISTS
insert into public.playlists (id, title, description, slug, icon, sort_order)
values
  ('pl_english', 'English Club', 'Webinar dan praktik interaktif percakapan bahasa Inggris bersama native speaker.', 'english-club', 'Globe2', 1),
  ('pl_techtalk', 'Tech & AI Talks', 'Eksplorasi teknologi modern, AI engineering, fullstack web, dan cloud computing.', 'tech-talks', 'Sparkles', 2),
  ('pl_career', 'Career Acceleration', 'Strategi interview global, pembuatan CV ATS-friendly, dan remote work tips.', 'career-acceleration', 'Briefcase', 3)
on conflict (slug) do nothing;

-- 2. EVENTS
insert into public.events (
  id, title, description, category, type, price, date, time, duration_minutes,
  location, speaker_name, speaker_role, quota, zoom_link, playlist,
  attendance_code, status, rundown
)
values
  (
    'evt_eng_01',
    'Mastering Casual English: Slang, Idioms & Natural Flow',
    'Pelajari cara berbicara bahasa Inggris seluwes native speaker tanpa terbata-bata. Kupas tuntas idiom harian, phrasal verbs, dan aksen natural dalam situasi sosial nyata.',
    'English Fluency',
    'free',
    0,
    current_date + interval '2 days',
    '19:30 - 21:00 WIB',
    90,
    'Online via Zoom Meeting',
    'Eka Revandi',
    'Host & Native Speaker Practitioner',
    250,
    'https://zoom.us/j/9823412345?pwd=crave_event_secret',
    'English Club',
    'SLANG24',
    'upcoming',
    '[
      {"time": "19:30 - 19:40", "activity": "Welcome & Warmup Quick Poll"},
      {"time": "19:40 - 20:25", "activity": "Core Session: Top 25 Idioms & Modern Slang"},
      {"time": "20:25 - 20:50", "activity": "Breakout Rooms & Live Roleplay"},
      {"time": "20:50 - 21:00", "activity": "Q&A, Presensi QR & Penutup"}
    ]'::jsonb
  ),
  (
    'evt_eng_02',
    'Job Interview in English: Conquer Any Global Tech Screening',
    'Bedah formula STAR framework dalam menjawab pertanyaan perilaku interview, negosiasi gaji dalam USD, dan simulasi mock interview langsung bersama mentor.',
    'Career & English',
    'paid',
    49000,
    current_date + interval '5 days',
    '15:00 - 17:00 WIB',
    120,
    'Online via Zoom Meeting',
    'Eka Revandi',
    'Host & Global Career Mentor',
    100,
    'https://zoom.us/j/9123456789?pwd=crave_interview_pass',
    'English Club',
    'STAR26',
    'upcoming',
    '[
      {"time": "15:00 - 15:15", "activity": "Introduction to Global Hiring Standards"},
      {"time": "15:15 - 16:15", "activity": "The STAR Framework & Tough Questions Drill"},
      {"time": "16:15 - 16:45", "activity": "Live Volunteer Mock Interview"},
      {"time": "16:45 - 17:00", "activity": "Action Items & Certificate Unlock"}
    ]'::jsonb
  ),
  (
    'evt_ai_01',
    'Fullstack Agentic AI: Building Modern Web Apps in 2026',
    'Panduan praktis membangun antarmuka web modern dengan arsitektur TanStack, Nitro Server, dan agen kecerdasan buatan otonom untuk efisiensi coding 10x lipat.',
    'Technology & AI',
    'free',
    0,
    current_date + interval '8 days',
    '20:00 - 21:30 WIB',
    90,
    'Online via Zoom Meeting',
    'Alex Pratama',
    'Principal AI Engineer',
    300,
    'https://zoom.us/j/8472918374?pwd=crave_ai_session',
    'Tech & AI Talks',
    'AGENT99',
    'upcoming',
    '[
      {"time": "20:00 - 20:15", "activity": "Evolution of Agentic Coding in 2026"},
      {"time": "20:15 - 21:00", "activity": "Live Demo: Zero-to-Production Deploy"},
      {"time": "21:00 - 21:30", "activity": "Interactive Q&A & Code Presensi"}
    ]'::jsonb
  ),
  (
    'evt_past_01',
    'English Pronunciation & Accent Reduction Workshop',
    'Sesi intensif pembenahan artikulasi fonetik bahasa Inggris, vowel length, dan intonasi suara agar percakapan terdengar jelas dan profesional.',
    'English Fluency',
    'free',
    0,
    current_date - interval '4 days',
    '19:30 - 21:00 WIB',
    90,
    'Online via Zoom Meeting',
    'Eka Revandi',
    'Host & Native Speaker Practitioner',
    200,
    'https://zoom.us/j/7654321980?pwd=past_recording',
    'English Club',
    'ACCENT',
    'past',
    '[
      {"time": "19:30 - 20:30", "activity": "Phonetics & Mouth Shape Practice"},
      {"time": "20:30 - 21:00", "activity": "Feedback & Certificate Generation"}
    ]'::jsonb
  )
on conflict (id) do nothing;
