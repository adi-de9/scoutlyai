# Database Schema

See also [[05-data-flow]] and [[14-open-questions]].

## Database Type

Supabase Auth, Postgres, private Storage, and Edge Functions are configured for the live-analysis flow.

## Tables Or Collections

Supabase-managed `auth.users` stores registered user accounts. Application tables are `notices`, `analysis_jobs`, `analyses`, `deadlines`, `tasks`, `reminders`, `activity_events`, and `ai_quota_windows`.

## Fields

Supabase-managed `auth.users` fields are managed by Supabase. The mobile app uses only the authenticated session returned by the client SDK.

## Relationships

All application records use `user_id`; notice sources use `notice_id`; plans, tasks, and reminders use their matching foreign keys.

## Required Fields

Owner-only RLS protects application rows and the private `notice-source` Storage bucket. `ai_quota_windows` has no client policy and is accessed only by Edge Functions through the service role.

## Optional Fields

None found.

## Indexes

None found.

## Security Rules

None found.

## Local Storage Keys

- Supabase session values use the Supabase JS storage key and are stored through Expo SecureStore.
- DeadlineOS local data uses `deadlineos-user-<user id>` in AsyncStorage. The old global key is removed because it cannot safely be assigned to a user.

## Data Validation

- The sign-in screen validates email shape and requires a password of at least six characters before requesting Supabase Auth.
- Private source files are capped at 10 MB; pasted text is capped at 50,000 characters. Edge Functions enforce the limits again.
- Gemini calls use fixed per-user quota windows: six analyses and fifteen blocker requests per ten minutes.

## Migration Files

`202607190001_deadlineos_hackathon.sql` created the live-analysis schema. `202607190002_harden_live_analysis.sql` adds server-side source constraints, AI quota windows, and private source cleanup when a notice is deleted.

## Entity Relationship Diagram

No ER diagram can be created yet because there are no database entities in the repository.

## Hackathon Schema Prepared

`supabase/migrations/202607190001_deadlineos_hackathon.sql` defines the core tables and private `notice-source` bucket. The applied hardening migration keeps sources private, validates size limits, restricts AI request frequency, and removes a Storage object when its owning notice is deleted.
