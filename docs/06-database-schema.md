# Database Schema

See also [[05-data-flow]] and [[14-open-questions]].

## Database Type

Supabase Auth is configured. No application database table is configured yet.

## Tables Or Collections

Supabase-managed `auth.users` stores registered user accounts. It is not queried directly by the mobile app.

## Fields

Supabase-managed `auth.users` fields are managed by Supabase. The mobile app uses only the authenticated session returned by the client SDK.

## Relationships

None found.

## Required Fields

None found.

## Optional Fields

None found.

## Indexes

None found.

## Security Rules

None found.

## Local Storage Keys

- Supabase session values use the Supabase JS storage key and are stored through Expo SecureStore.
- DeadlineOS demo data remains in AsyncStorage under `deadlineos-demo`.

## Data Validation

- The sign-in screen validates email shape and requires a password of at least six characters before requesting Supabase Auth.

## Migration Files

No migration files were found.

## Entity Relationship Diagram

No ER diagram can be created yet because there are no database entities in the repository.

## Hackathon Schema Prepared

`supabase/migrations/202607190001_deadlineos_hackathon.sql` defines `notices`, `analysis_jobs`, `analyses`, `deadlines`, `tasks`, `reminders`, and `activity_events`. Every row has `user_id`, timestamps, owner-only RLS, and user/job indexes. The private `notice-source` Storage bucket accepts PDF/JPEG/PNG/WebP up to 10 MB under `<user_id>/<notice_id>/...`; no public URL is created. The migration still needs applying to Supabase.

## Hackathon Schema Prepared

`supabase/migrations/202607190001_deadlineos_hackathon.sql` defines `notices`, `analysis_jobs`, `analyses`, `deadlines`, `tasks`, `reminders`, and `activity_events`. Every row has `user_id`, timestamps, owner-only RLS, and user/job indexes. The private `notice-source` Storage bucket accepts PDF/JPEG/PNG/WebP up to 10 MB under `<user_id>/<notice_id>/...`; no public URL is created. The migration still needs applying to Supabase.
