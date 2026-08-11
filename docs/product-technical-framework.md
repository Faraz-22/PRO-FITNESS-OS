# ProFitness Product And Technical Framework

## North Star

Build ProFitness as a premium black-gold fitness operating system for members, trainers, and gym management.

The product should feel like a local fitness arena, not a normal gym portal. Members should return because the app gives them identity, progress, recognition, guidance, and belonging.

Core promise:

**Every day, ProFitness gives a member one clear action, one visible proof of progress, and one reason to return.**

## Product Framework

### The Member Loop

The app should be designed around a daily action loop:

1. Open the Arena.
2. See today's mission.
3. Complete one action.
4. Earn ProScore points.
5. Grow streak rings.
6. Receive feedback from AI, trainer, or community.
7. Return tomorrow to protect progress.

This is the main habit system.

### The Emotional Loop

The deeper psychology is:

**Stress zone -> small action -> visible proof -> recognition -> confidence -> consistency -> transformation.**

The app should not only measure gym activity. It should help members feel that they are becoming a stronger person.

### The Four Scoring Pillars

Members should score themselves across four pillars:

1. **Body**
   Workouts, attendance, strength, measurements, progress photos.

2. **Fuel**
   Meals, hydration, protein, nutrition consistency.

3. **Mind**
   mood, energy, sleep, discipline, stress reduction, confidence check-ins.

4. **Tribe**
   community posts, challenge participation, encouragement, trainer interaction.

This prevents ProFitness from becoming only a weight-loss tracker. It reflects the full founder vision: freedom from stress, hesitation, and inconsistency.

## ProScore Algorithm

### Weekly ProScore

ProScore should be a weekly score from 0 to 100.

Recommended weighting:

- Attendance: 25 points
- Workout logging: 20 points
- Challenge participation: 15 points
- Nutrition tracking: 15 points
- Progress check-in: 10 points
- Community engagement: 10 points
- Trainer or AI interaction: 5 points

### Score Formula

```text
weekly_pro_score =
  attendance_score +
  workout_score +
  challenge_score +
  nutrition_score +
  progress_score +
  tribe_score +
  coach_score
```

### Attendance Score

```text
attendance_score = min(days_checked_in / weekly_attendance_goal, 1) * 25
```

### Workout Score

```text
workout_score = min(workouts_logged / weekly_workout_goal, 1) * 20
```

### Challenge Score

```text
challenge_score = min(challenge_tasks_completed / challenge_tasks_available, 1) * 15
```

### Nutrition Score

```text
nutrition_score = min(nutrition_days_logged / nutrition_goal_days, 1) * 15
```

### Progress Score

```text
progress_score =
  5 points for weekly body/mood check-in +
  5 points for measurement/photo/strength progress update
```

### Tribe Score

```text
tribe_score =
  min(community_actions / weekly_tribe_goal, 1) * 10
```

Community actions include posting a win, joining a challenge discussion, reacting to a member, or encouraging someone.

### Coach Score

```text
coach_score =
  5 points if member asks a trainer question, uses AI guidance, or reviews a trainer note during the week
```

### Score Levels

- 0-24: Starter
- 25-49: Building
- 50-69: Consistent
- 70-84: Strong
- 85-94: Elite
- 95-100: Gold Standard

### Anti-Demotivation Rule

Never shame the user for a low score.

Low score message:

**Your week is still open. Complete one small mission today.**

Broken streak message:

**Your comeback starts with one check-in.**

## Streak Rings

Each member profile should show four rings:

- Training ring
- Nutrition ring
- Mind ring
- Tribe ring

Each ring grows independently. This makes the system inclusive: a beginner who cannot train hard yet can still build confidence through consistency, check-ins, and nutrition.

## Confidence Mode

Confidence Mode is a private, supportive experience for hesitant beginners, women, and young girls.

Features:

- Private profile by default
- Private progress photos
- Beginner-safe missions
- No public leaderboard pressure
- Women-friendly challenges
- Comfort-level onboarding
- Ask anonymously option
- Trainer-safe escalation

Confidence Mode should make ProFitness feel emotionally safe without making it feel less premium.

## Core Product Modules

### 1. Public Website

Purpose:

Generate leads and make ProFitness feel aspirational.

Pages:

- Home
- Memberships
- Transformations
- Women and beginners
- Trainers
- Contact and visit

### 2. Member Arena

Purpose:

Daily mission and habit loop.

Features:

- Today's mission
- ProScore
- Streak rings
- Check-in
- Quick workout log
- Current challenge
- Trainer note
- AI prompt card
- Community pulse

### 3. Journey

Purpose:

Transformation timeline.

Features:

- Body stats
- Progress photos
- Measurements
- Strength records
- Mood and energy history
- Milestones
- Badges
- Trainer reviews

### 4. Tribe

Purpose:

Community and belonging.

Features:

- Structured feed
- Daily wins
- Transformation posts
- Challenge entries
- Meal posts
- Questions
- Reactions and comments
- Circles for beginners, women, students, and batches

### 5. Challenges

Purpose:

Retention engine.

Features:

- 7-day streak challenges
- 21-day transformation sprints
- Women starter challenge
- Student consistency challenge
- Leaderboards
- Completion certificates
- Gold Drop recognition

### 6. Fuel

Purpose:

Personalized nutrition guidance.

Features:

- Goal-based meal plans
- Indian/local food awareness
- Budget filters
- Veg/non-veg preference
- Protein target
- Hydration
- AI meal suggestions
- Trainer review

### 7. Coach

Purpose:

Guidance layer.

Features:

- AI trainer
- AI nutrition planner
- AI habit coach
- Human trainer chat
- Question routing
- Trainer notes
- Safety escalation

### 8. Admin Console

Purpose:

Gym management and retention.

Features:

- Member directory
- Membership plans
- Attendance
- Payment status
- Expiry reminders
- Inactive member alerts
- Challenge manager
- Community moderation
- Trainer assignment
- Retention dashboard
- Female activation dashboard

## Recommended Tech Stack

### Frontend

- **Next.js App Router**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui or Radix UI primitives**
- **Lucide React icons**
- **Framer Motion** for restrained premium motion
- **Recharts** for admin analytics
- **TanStack Query** only for client-side interactive data that needs refetching

Why:

Next.js gives server-rendered routes, streaming, image optimization, fast navigation, and a smooth path to Vercel hosting.

### Backend

- **Next.js Server Actions and Route Handlers**
- **Supabase Postgres**
- **Supabase Auth**
- **Supabase Storage**
- **Supabase Realtime**
- **Postgres Row Level Security**
- **Drizzle ORM** for typed schema and migrations, or direct Supabase SQL for first MVP

Recommendation:

Use Supabase directly for the MVP, then add Drizzle when the schema stabilizes.

### AI

- **OpenAI Responses API**
- **GPT-5.6 Terra** for balanced trainer and nutrition responses
- **GPT-5.6 Luna** for high-volume lightweight prompts
- **GPT-5.6 Sol** only for premium plan generation, deeper analysis, or admin insights

AI should be used for:

- Meal suggestions
- Workout guidance
- Habit coaching
- Member Q&A
- Admin insights

AI should not be used for:

- Medical diagnosis
- Injury treatment without trainer escalation
- Emergency health advice
- Unreviewed extreme diet prescriptions

### Image And File Management

- **Supabase Storage** for progress photos, post images, transformation media, and documents.
- **Private buckets** for progress photos.
- **Public bucket** for approved marketing images and public transformation posts.
- **Signed URLs** for private member images.
- **Next/Image on Vercel** for optimized rendering and responsive delivery.

Recommended buckets:

- `avatars`
- `progress-private`
- `community-posts`
- `transformations-approved`
- `challenge-certificates`
- `gym-assets`

### Email

- **Resend**
- **React Email templates**

Email types:

- Welcome email
- Login/magic link email if needed
- Membership expiry reminder
- Challenge start reminder
- Comeback email
- Trainer reply notification
- Payment/renewal confirmation

### Realtime

- **Supabase Realtime Broadcast** for scalable live events.
- Use Postgres Changes only for MVP testing and low-volume internal screens.

Realtime events:

- New community post
- New reaction
- Trainer reply
- Challenge leaderboard update
- Gold Drop announcement
- Admin moderation status

### Caching And Rate Limiting

- **Upstash Redis**
- **Upstash Rate Limit**

Use for:

- AI request rate limiting
- Login abuse protection
- Public lead form protection
- Fast leaderboard cache
- Daily mission cache
- Streak counter cache

### Hosting

- **Vercel**
- Production domain: `profitness.in` or similar
- Preview deployments for every branch
- Vercel environment variables
- Vercel Analytics and Speed Insights

## Required Accounts And Services

Before full development:

1. GitHub account and repository
2. Vercel account
3. Supabase account and project
4. OpenAI API account and key
5. Resend account and verified sending domain
6. Upstash account and Redis database
7. Domain name and DNS access
8. Optional: Razorpay account for Indian payments
9. Optional: WhatsApp Business API provider for WhatsApp reminders

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

OPENAI_API_KEY=
OPENAI_DEFAULT_MODEL=gpt-5.6-terra
OPENAI_FAST_MODEL=gpt-5.6-luna
OPENAI_PREMIUM_MODEL=gpt-5.6-sol

RESEND_API_KEY=
EMAIL_FROM=ProFitness <hello@yourdomain.com>

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

ADMIN_SEED_EMAIL=
```

Only variables prefixed with `NEXT_PUBLIC_` should be exposed to the browser.

## Suggested Repository Structure

```text
profitness/
  app/
    (public)/
      page.tsx
      memberships/
      transformations/
      women-and-beginners/
      contact/
    (member)/
      arena/
      journey/
      tribe/
      challenges/
      fuel/
      coach/
      club-pass/
    (trainer)/
      trainer/
    (admin)/
      admin/
    api/
      ai/
      webhooks/
      uploads/
      emails/
  components/
    arena/
    journey/
    tribe/
    challenges/
    fuel/
    coach/
    admin/
    ui/
  lib/
    auth/
    supabase/
    ai/
    email/
    scoring/
    storage/
    rate-limit/
    validations/
  db/
    migrations/
    schema/
    seed/
  emails/
    welcome.tsx
    renewal-reminder.tsx
    challenge-start.tsx
    comeback.tsx
  public/
    brand/
    images/
  docs/
```

## Database Structure

### Identity And Roles

- `profiles`
- `member_profiles`
- `trainer_profiles`
- `admin_profiles`
- `role_assignments`

### Gym Operations

- `memberships`
- `membership_plans`
- `payments`
- `attendance`
- `batches`
- `trainer_assignments`

### Progress

- `workout_logs`
- `exercise_logs`
- `body_measurements`
- `progress_photos`
- `mood_checkins`
- `milestones`

### Scoring

- `score_events`
- `weekly_scores`
- `streaks`
- `badges`
- `member_badges`

### Community

- `community_posts`
- `post_media`
- `post_comments`
- `post_reactions`
- `circles`
- `circle_members`
- `moderation_actions`

### Challenges

- `challenges`
- `challenge_tasks`
- `challenge_participants`
- `challenge_entries`
- `challenge_leaderboards`

### Nutrition And AI

- `meal_preferences`
- `meal_plans`
- `meal_logs`
- `trainer_questions`
- `ai_conversations`
- `ai_messages`
- `ai_safety_flags`

### Notifications

- `notifications`
- `email_events`
- `push_subscriptions`

## Event-Based Scoring System

Use an event ledger instead of directly editing scores everywhere.

Example events:

- `ATTENDANCE_CHECK_IN`
- `WORKOUT_LOGGED`
- `MEAL_LOGGED`
- `PROGRESS_UPDATED`
- `POST_CREATED`
- `COMMENT_CREATED`
- `CHALLENGE_TASK_COMPLETED`
- `TRAINER_QUESTION_ASKED`
- `AI_COACH_USED`

Every event creates a row in `score_events`.

Then a scoring job aggregates events into `weekly_scores`.

Why:

- Easier to debug.
- Prevents score manipulation.
- Allows future score changes without losing history.
- Supports admin audits.

## Low-Latency Architecture

### Page Loading

- Use Server Components for data-heavy pages.
- Use Client Components only for interactive pieces.
- Stream slow sections with Suspense.
- Use skeleton states that match the final layout.
- Keep the Arena route extremely fast.

### Data Fetching

- Fetch member identity, score, mission, and streaks in parallel.
- Use small queries for the Arena.
- Avoid fetching the full feed on the home screen.
- Use cursor pagination for community posts.
- Use denormalized counters for likes, comments, and leaderboard totals.

### Database

Important indexes:

```sql
profiles(user_id)
attendance(member_id, checked_in_at)
score_events(member_id, occurred_at)
weekly_scores(member_id, week_start)
community_posts(created_at)
community_posts(author_id, created_at)
post_comments(post_id, created_at)
post_reactions(post_id, member_id)
challenge_participants(challenge_id, member_id)
trainer_questions(member_id, status, created_at)
memberships(member_id, expires_at)
```

### Realtime

- Use realtime only where it makes the app feel alive.
- Do not make every dashboard number realtime.
- Broadcast community and challenge events.
- Cache leaderboard results and refresh on intervals.

### AI Latency

- Stream AI responses.
- Use short structured prompts.
- Cache repeated nutrition answers by goal, diet preference, budget, and meal type.
- Use the fast model for simple answers.
- Use the premium model only when the user requests a full plan.
- Generate long meal/workout plans in the background when possible.

### Images

- Upload directly from browser to Supabase Storage with signed upload rules.
- Compress large images before upload.
- Store image metadata in Postgres.
- Use thumbnails for feeds.
- Load full images only in detail views.

## Security Framework

### Authentication

- Supabase Auth
- Email OTP or password login for MVP
- Phone OTP can be added later if needed

### Authorization

Use Row Level Security:

- Members can read and update their own private profile.
- Members can read public community posts.
- Members can only edit their own posts.
- Trainers can read assigned member progress.
- Admins can manage all gym data.
- Private progress photos are visible only to member, assigned trainer, and admin.

### AI Safety

- Add disclaimers for nutrition and training suggestions.
- Escalate injury, illness, pregnancy, eating disorder, or medical questions to a human trainer or professional.
- Store AI conversations for member history and admin review only where privacy policy allows.
- Rate limit AI usage.

## Design System

### Theme

Use black and gold, but keep it refined.

Design tokens:

```css
--background: #050505;
--surface: #111111;
--surface-raised: #1A1A1A;
--gold: #D6A01D;
--gold-soft: #F2C75C;
--text-main: #F5F1E8;
--text-muted: #8B8B8B;
--success: #32C766;
--danger: #E04848;
```

### Interface Feel

- Premium
- Fast
- Touch-friendly
- Mobile-first
- Cinematic but usable
- Strong visual hierarchy
- Low clutter

### Motion

Use motion for:

- Streak ring growth
- Mission completion
- Badge unlock
- Gold Drop recognition
- Page transitions

Avoid excessive animation in admin screens.

## MVP Build Roadmap

### Sprint 1: Foundation

- Next.js app setup
- Tailwind and design tokens
- Supabase project
- Auth
- Database schema
- Storage buckets
- RLS policies
- Vercel deployment

### Sprint 2: Public Website

- Home page
- Memberships
- Women and beginners page
- Transformations page
- Lead capture
- Email notification to admin

### Sprint 3: Member Arena

- Onboarding
- Arena home
- Daily mission
- Attendance check-in
- ProScore display
- Streak rings

### Sprint 4: Journey And Progress

- Measurements
- Workout logs
- Progress photos
- Mood check-ins
- Timeline

### Sprint 5: Tribe And Challenges

- Community feed
- Posts and reactions
- Challenges
- Leaderboard
- Gold Drop

### Sprint 6: Fuel And Coach

- AI meal planner
- AI trainer Q&A
- Human trainer questions
- Email notifications
- Safety escalation

### Sprint 7: Admin Console

- Members
- Memberships
- Attendance
- Inactive alerts
- Challenge management
- Moderation
- Retention dashboard

## Vercel Deployment Path

1. Push repo to GitHub.
2. Create Supabase project.
3. Create storage buckets.
4. Add database migrations.
5. Configure RLS policies.
6. Create Resend account and verify domain.
7. Create Upstash Redis database.
8. Add environment variables to Vercel.
9. Connect GitHub repo to Vercel.
10. Deploy preview.
11. Run smoke tests.
12. Add production domain.
13. Configure DNS.
14. Deploy production.

## Operational Dashboard

Admin should see:

- Active members
- New members this month
- Members at risk
- Expiring memberships
- Female member activation
- Weekly active members
- Challenge participation
- Trainer response time
- AI usage
- Community posts
- Renewal rate

## What Makes This Mind-Blowing

The magic is not one feature. It is the system:

- Daily missions create action.
- ProScore creates self-awareness.
- Streak Rings create identity.
- Journey creates emotional proof.
- Tribe creates belonging.
- Challenges create energy.
- Fuel creates practical lifestyle change.
- Coach creates confidence.
- Admin analytics creates retention.

This is how ProFitness becomes more than a gym app. It becomes a transformation culture that members carry in their pocket.

## Official Reference Sources

- Next.js App Router and Server Components: https://nextjs.org/docs/app
- Vercel Next.js hosting and image optimization: https://vercel.com/docs/frameworks/full-stack/nextjs
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Resend email API: https://resend.com/docs/api-reference/emails/send-email
- Upstash Rate Limit: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- OpenAI model guidance: https://developers.openai.com/api/docs/models

