import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`services\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`n\` numeric NOT NULL,
  	\`icon\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`short\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`whatsapp_number\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`services_n_idx\` ON \`services\` (\`n\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`services_slug_idx\` ON \`services\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`services_updated_at_idx\` ON \`services\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`services_created_at_idx\` ON \`services\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`services_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`services_texts_order_parent\` ON \`services_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_services_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_n\` numeric NOT NULL,
  	\`version_icon\` text NOT NULL,
  	\`version_slug\` text NOT NULL,
  	\`version_title\` text NOT NULL,
  	\`version_short\` text NOT NULL,
  	\`version_description\` text NOT NULL,
  	\`version_whatsapp_number\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_services_v_parent_idx\` ON \`_services_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_services_v_version_version_n_idx\` ON \`_services_v\` (\`version_n\`);`)
  await db.run(sql`CREATE INDEX \`_services_v_version_version_slug_idx\` ON \`_services_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_services_v_version_version_updated_at_idx\` ON \`_services_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_services_v_version_version_created_at_idx\` ON \`_services_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_services_v_created_at_idx\` ON \`_services_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_services_v_updated_at_idx\` ON \`_services_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_services_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_services_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_services_v_texts_order_parent\` ON \`_services_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`enquiries\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`company\` text,
  	\`service\` text,
  	\`budget\` text,
  	\`timeline\` text,
  	\`message\` text,
  	\`channel\` text DEFAULT 'whatsapp',
  	\`status\` text DEFAULT 'new',
  	\`notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`enquiries_updated_at_idx\` ON \`enquiries\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`enquiries_created_at_idx\` ON \`enquiries\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`enquiries_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`enquiries\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`enquiries_texts_order_parent\` ON \`enquiries_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ebooks\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text NOT NULL,
  	\`subtitle\` text,
  	\`one_liner\` text,
  	\`pages\` numeric,
  	\`read_time\` text,
  	\`tone\` text DEFAULT 'blue',
  	\`cover_id\` integer,
  	\`file_id\` integer,
  	\`approval_mode\` text DEFAULT 'inherit',
  	\`delivery_mode\` text DEFAULT 'inherit',
  	\`enabled\` integer DEFAULT true,
  	\`slug\` text,
  	\`requests\` numeric DEFAULT 0,
  	\`sent\` numeric DEFAULT 0,
  	\`downloads\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`ebook_files\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`ebooks__order_idx\` ON \`ebooks\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ebooks_cover_idx\` ON \`ebooks\` (\`cover_id\`);`)
  await db.run(sql`CREATE INDEX \`ebooks_file_idx\` ON \`ebooks\` (\`file_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`ebooks_slug_idx\` ON \`ebooks\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`ebooks_updated_at_idx\` ON \`ebooks\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`ebooks_created_at_idx\` ON \`ebooks\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ebooks_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`ebooks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ebooks_texts_order_parent\` ON \`ebooks_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_ebooks_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_title\` text NOT NULL,
  	\`version_subtitle\` text,
  	\`version_one_liner\` text,
  	\`version_pages\` numeric,
  	\`version_read_time\` text,
  	\`version_tone\` text DEFAULT 'blue',
  	\`version_cover_id\` integer,
  	\`version_file_id\` integer,
  	\`version_approval_mode\` text DEFAULT 'inherit',
  	\`version_delivery_mode\` text DEFAULT 'inherit',
  	\`version_enabled\` integer DEFAULT true,
  	\`version_slug\` text,
  	\`version_requests\` numeric DEFAULT 0,
  	\`version_sent\` numeric DEFAULT 0,
  	\`version_downloads\` numeric DEFAULT 0,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`ebooks\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_file_id\`) REFERENCES \`ebook_files\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_ebooks_v_parent_idx\` ON \`_ebooks_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_version_version__order_idx\` ON \`_ebooks_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_version_version_cover_idx\` ON \`_ebooks_v\` (\`version_cover_id\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_version_version_file_idx\` ON \`_ebooks_v\` (\`version_file_id\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_version_version_slug_idx\` ON \`_ebooks_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_version_version_updated_at_idx\` ON \`_ebooks_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_version_version_created_at_idx\` ON \`_ebooks_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_created_at_idx\` ON \`_ebooks_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_ebooks_v_updated_at_idx\` ON \`_ebooks_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_ebooks_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_ebooks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ebooks_v_texts_order_parent\` ON \`_ebooks_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`leads\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`company\` text,
  	\`book_id\` integer NOT NULL,
  	\`notes\` text,
  	\`status\` text DEFAULT 'pending',
  	\`delivery_used\` text,
  	\`sent_at\` text,
  	\`expires_at\` text,
  	\`downloads\` numeric DEFAULT 0,
  	\`error\` text,
  	\`consent\` integer DEFAULT false,
  	\`source\` text,
  	\`token_version\` numeric DEFAULT 1,
  	\`link_downloads\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`book_id\`) REFERENCES \`ebooks\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`leads_email_idx\` ON \`leads\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`leads_book_idx\` ON \`leads\` (\`book_id\`);`)
  await db.run(sql`CREATE INDEX \`leads_status_idx\` ON \`leads\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`leads_updated_at_idx\` ON \`leads\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`leads_created_at_idx\` ON \`leads\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ebook_files\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`ebook_files_updated_at_idx\` ON \`ebook_files\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`ebook_files_created_at_idx\` ON \`ebook_files\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`ebook_files_filename_idx\` ON \`ebook_files\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`quiz_submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`top\` text,
  	\`matches\` text,
  	\`summary\` text,
  	\`action\` text DEFAULT 'none',
  	\`email\` text,
  	\`status\` text DEFAULT 'new',
  	\`notes\` text,
  	\`answers\` text,
  	\`ref\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`quiz_submissions_ref_idx\` ON \`quiz_submissions\` (\`ref\`);`)
  await db.run(sql`CREATE INDEX \`quiz_submissions_updated_at_idx\` ON \`quiz_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`quiz_submissions_created_at_idx\` ON \`quiz_submissions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`values\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text NOT NULL,
  	\`key\` text DEFAULT 'partnership' NOT NULL,
  	\`line\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`values__order_idx\` ON \`values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`values_updated_at_idx\` ON \`values\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`values_created_at_idx\` ON \`values\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`faqs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	\`category\` text,
  	\`enabled\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`faqs__order_idx\` ON \`faqs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`faqs_updated_at_idx\` ON \`faqs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`faqs_created_at_idx\` ON \`faqs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`_faqs_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_question\` text NOT NULL,
  	\`version_answer\` text NOT NULL,
  	\`version_category\` text,
  	\`version_enabled\` integer DEFAULT true,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`faqs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_faqs_v_parent_idx\` ON \`_faqs_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_faqs_v_version_version__order_idx\` ON \`_faqs_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_faqs_v_version_version_updated_at_idx\` ON \`_faqs_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_faqs_v_version_version_created_at_idx\` ON \`_faqs_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_faqs_v_created_at_idx\` ON \`_faqs_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_faqs_v_updated_at_idx\` ON \`_faqs_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`eyebrow\` text,
  	\`intro\` text,
  	\`body\` text,
  	\`show_stats\` integer DEFAULT false,
  	\`show_steps\` integer DEFAULT false,
  	\`show_values\` integer DEFAULT false,
  	\`show_services\` integer DEFAULT false,
  	\`show_cta\` integer DEFAULT true,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text NOT NULL,
  	\`version_slug\` text NOT NULL,
  	\`version_eyebrow\` text,
  	\`version_intro\` text,
  	\`version_body\` text,
  	\`version_show_stats\` integer DEFAULT false,
  	\`version_show_steps\` integer DEFAULT false,
  	\`version_show_values\` integer DEFAULT false,
  	\`version_show_services\` integer DEFAULT false,
  	\`version_show_cta\` integer DEFAULT true,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumb_url\` text,
  	\`sizes_thumb_width\` numeric,
  	\`sizes_thumb_height\` numeric,
  	\`sizes_thumb_mime_type\` text,
  	\`sizes_thumb_filesize\` numeric,
  	\`sizes_thumb_filename\` text,
  	\`sizes_cover_url\` text,
  	\`sizes_cover_width\` numeric,
  	\`sizes_cover_height\` numeric,
  	\`sizes_cover_mime_type\` text,
  	\`sizes_cover_filesize\` numeric,
  	\`sizes_cover_filename\` text,
  	\`sizes_wide_url\` text,
  	\`sizes_wide_width\` numeric,
  	\`sizes_wide_height\` numeric,
  	\`sizes_wide_mime_type\` text,
  	\`sizes_wide_filesize\` numeric,
  	\`sizes_wide_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumb_sizes_thumb_filename_idx\` ON \`media\` (\`sizes_thumb_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_cover_sizes_cover_filename_idx\` ON \`media\` (\`sizes_cover_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_wide_sizes_wide_filename_idx\` ON \`media\` (\`sizes_wide_filename\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text NOT NULL,
  	\`name\` text,
  	\`role\` text DEFAULT 'editor' NOT NULL,
  	\`active\` integer DEFAULT true,
  	\`last_login_at\` text,
  	\`session_version\` numeric DEFAULT 1,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`login_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text,
  	\`result\` text,
  	\`device\` text,
  	\`ip\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`login_events_updated_at_idx\` ON \`login_events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`login_events_created_at_idx\` ON \`login_events\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`rate_hits\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`window_start\` text NOT NULL,
  	\`count\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`rate_hits_key_idx\` ON \`rate_hits\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`rate_hits_updated_at_idx\` ON \`rate_hits\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`rate_hits_created_at_idx\` ON \`rate_hits\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`services_id\` integer,
  	\`enquiries_id\` integer,
  	\`ebooks_id\` integer,
  	\`leads_id\` integer,
  	\`ebook_files_id\` integer,
  	\`quiz_submissions_id\` integer,
  	\`values_id\` integer,
  	\`faqs_id\` integer,
  	\`pages_id\` integer,
  	\`media_id\` integer,
  	\`users_id\` integer,
  	\`login_events_id\` integer,
  	\`rate_hits_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`services_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`enquiries_id\`) REFERENCES \`enquiries\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`ebooks_id\`) REFERENCES \`ebooks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`leads_id\`) REFERENCES \`leads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`ebook_files_id\`) REFERENCES \`ebook_files\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`quiz_submissions_id\`) REFERENCES \`quiz_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`values_id\`) REFERENCES \`values\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faqs_id\`) REFERENCES \`faqs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`login_events_id\`) REFERENCES \`login_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`rate_hits_id\`) REFERENCES \`rate_hits\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_services_id_idx\` ON \`payload_locked_documents_rels\` (\`services_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_enquiries_id_idx\` ON \`payload_locked_documents_rels\` (\`enquiries_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_ebooks_id_idx\` ON \`payload_locked_documents_rels\` (\`ebooks_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_leads_id_idx\` ON \`payload_locked_documents_rels\` (\`leads_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_ebook_files_id_idx\` ON \`payload_locked_documents_rels\` (\`ebook_files_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quiz_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`quiz_submissions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_values_id_idx\` ON \`payload_locked_documents_rels\` (\`values_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_faqs_id_idx\` ON \`payload_locked_documents_rels\` (\`faqs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_login_events_id_idx\` ON \`payload_locked_documents_rels\` (\`login_events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_rate_hits_id_idx\` ON \`payload_locked_documents_rels\` (\`rate_hits_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`company_socials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`href\` text,
  	\`enabled\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`company\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`company_socials_order_idx\` ON \`company_socials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`company_socials_parent_id_idx\` ON \`company_socials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`company\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`short_name\` text,
  	\`type\` text,
  	\`tagline\` text,
  	\`location\` text,
  	\`map_url\` text,
  	\`logo_id\` integer,
  	\`favicon_id\` integer,
  	\`geo_locality\` text,
  	\`geo_region\` text,
  	\`geo_country\` text,
  	\`geo_latitude\` numeric,
  	\`geo_longitude\` numeric,
  	\`contact_email\` text,
  	\`contact_phone\` text,
  	\`contact_whatsapp_number\` text,
  	\`contact_whatsapp_text\` text,
  	\`contact_whatsapp_fab\` integer DEFAULT true,
  	\`contact_fab_label\` text,
  	\`contact_chat_label\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`favicon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`company_logo_idx\` ON \`company\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`company_favicon_idx\` ON \`company\` (\`favicon_id\`);`)
  await db.run(sql`CREATE TABLE \`_company_v_version_socials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`href\` text,
  	\`enabled\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_company_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_company_v_version_socials_order_idx\` ON \`_company_v_version_socials\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_company_v_version_socials_parent_id_idx\` ON \`_company_v_version_socials\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_company_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_name\` text,
  	\`version_short_name\` text,
  	\`version_type\` text,
  	\`version_tagline\` text,
  	\`version_location\` text,
  	\`version_map_url\` text,
  	\`version_logo_id\` integer,
  	\`version_favicon_id\` integer,
  	\`version_geo_locality\` text,
  	\`version_geo_region\` text,
  	\`version_geo_country\` text,
  	\`version_geo_latitude\` numeric,
  	\`version_geo_longitude\` numeric,
  	\`version_contact_email\` text,
  	\`version_contact_phone\` text,
  	\`version_contact_whatsapp_number\` text,
  	\`version_contact_whatsapp_text\` text,
  	\`version_contact_whatsapp_fab\` integer DEFAULT true,
  	\`version_contact_fab_label\` text,
  	\`version_contact_chat_label\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`version_logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_favicon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_company_v_version_version_logo_idx\` ON \`_company_v\` (\`version_logo_id\`);`)
  await db.run(sql`CREATE INDEX \`_company_v_version_version_favicon_idx\` ON \`_company_v\` (\`version_favicon_id\`);`)
  await db.run(sql`CREATE INDEX \`_company_v_created_at_idx\` ON \`_company_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_company_v_updated_at_idx\` ON \`_company_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`navigation_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`kind\` text DEFAULT 'section',
  	\`section\` text DEFAULT 'home',
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`navigation\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`navigation_items_order_idx\` ON \`navigation_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`navigation_items_parent_id_idx\` ON \`navigation_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`navigation\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`cta_label\` text,
  	\`cta_action\` text DEFAULT 'quiz',
  	\`cta_href\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`_navigation_v_version_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`kind\` text DEFAULT 'section',
  	\`section\` text DEFAULT 'home',
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_navigation_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_items_order_idx\` ON \`_navigation_v_version_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_version_items_parent_id_idx\` ON \`_navigation_v_version_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_navigation_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_cta_label\` text,
  	\`version_cta_action\` text DEFAULT 'quiz',
  	\`version_cta_href\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_navigation_v_created_at_idx\` ON \`_navigation_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_navigation_v_updated_at_idx\` ON \`_navigation_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`homepage_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section\` text NOT NULL,
  	\`enabled\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`homepage\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`homepage_sections_order_idx\` ON \`homepage_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`homepage_sections_parent_id_idx\` ON \`homepage_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`homepage_about_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` numeric NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`homepage\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`homepage_about_stats_order_idx\` ON \`homepage_about_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`homepage_about_stats_parent_id_idx\` ON \`homepage_about_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`homepage_about_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`n\` text,
  	\`title\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`homepage\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`homepage_about_steps_order_idx\` ON \`homepage_about_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`homepage_about_steps_parent_id_idx\` ON \`homepage_about_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`homepage\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hero_eyebrow\` text,
  	\`hero_eyebrow_extra\` text,
  	\`hero_headline\` text,
  	\`hero_headline_accent\` text,
  	\`hero_sub\` text,
  	\`hero_primary_label\` text,
  	\`hero_primary_action\` text DEFAULT 'quiz',
  	\`hero_primary_href\` text,
  	\`hero_secondary_label\` text,
  	\`hero_secondary_action\` text DEFAULT 'quiz',
  	\`hero_secondary_href\` text,
  	\`hero_caption\` text,
  	\`services_section_label\` text,
  	\`services_section_heading\` text,
  	\`services_section_accent\` text,
  	\`services_section_intro\` text,
  	\`services_section_outro\` text,
  	\`services_section_outro_accent\` text,
  	\`services_section_card_cta\` text,
  	\`about_label\` text,
  	\`about_statement\` text,
  	\`about_body\` text,
  	\`about_philosophy\` text,
  	\`about_strip\` text,
  	\`about_story_label\` text,
  	\`about_story_heading\` text,
  	\`about_story_accent\` text,
  	\`about_story_your_side_label\` text,
  	\`about_story_your_side_title\` text,
  	\`about_story_our_side_label\` text,
  	\`about_story_our_side_title\` text,
  	\`about_story_middle_label\` text,
  	\`about_story_pill_out\` text,
  	\`about_story_pill_in\` text,
  	\`about_story_result\` text,
  	\`about_values_label\` text,
  	\`about_values_heading\` text,
  	\`about_values_intro\` text,
  	\`closing_label\` text,
  	\`closing_heading\` text,
  	\`closing_accent\` text,
  	\`closing_text\` text,
  	\`closing_cta\` text,
  	\`closing_loop\` text,
  	\`closing_email_label\` text,
  	\`closing_phone_label\` text,
  	\`closing_visit_label\` text,
  	\`faq_preview_enabled\` integer DEFAULT false,
  	\`faq_preview_count\` numeric DEFAULT 4,
  	\`faq_preview_label\` text,
  	\`faq_preview_heading\` text,
  	\`faq_preview_accent\` text,
  	\`faq_preview_cta\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`homepage_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`homepage\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`homepage_texts_order_parent\` ON \`homepage_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_homepage_v_version_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section\` text NOT NULL,
  	\`enabled\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_homepage_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_homepage_v_version_sections_order_idx\` ON \`_homepage_v_version_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_homepage_v_version_sections_parent_id_idx\` ON \`_homepage_v_version_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_homepage_v_version_about_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` numeric NOT NULL,
  	\`label\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_homepage_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_homepage_v_version_about_stats_order_idx\` ON \`_homepage_v_version_about_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_homepage_v_version_about_stats_parent_id_idx\` ON \`_homepage_v_version_about_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_homepage_v_version_about_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`n\` text,
  	\`title\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_homepage_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_homepage_v_version_about_steps_order_idx\` ON \`_homepage_v_version_about_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_homepage_v_version_about_steps_parent_id_idx\` ON \`_homepage_v_version_about_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_homepage_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_hero_eyebrow\` text,
  	\`version_hero_eyebrow_extra\` text,
  	\`version_hero_headline\` text,
  	\`version_hero_headline_accent\` text,
  	\`version_hero_sub\` text,
  	\`version_hero_primary_label\` text,
  	\`version_hero_primary_action\` text DEFAULT 'quiz',
  	\`version_hero_primary_href\` text,
  	\`version_hero_secondary_label\` text,
  	\`version_hero_secondary_action\` text DEFAULT 'quiz',
  	\`version_hero_secondary_href\` text,
  	\`version_hero_caption\` text,
  	\`version_services_section_label\` text,
  	\`version_services_section_heading\` text,
  	\`version_services_section_accent\` text,
  	\`version_services_section_intro\` text,
  	\`version_services_section_outro\` text,
  	\`version_services_section_outro_accent\` text,
  	\`version_services_section_card_cta\` text,
  	\`version_about_label\` text,
  	\`version_about_statement\` text,
  	\`version_about_body\` text,
  	\`version_about_philosophy\` text,
  	\`version_about_strip\` text,
  	\`version_about_story_label\` text,
  	\`version_about_story_heading\` text,
  	\`version_about_story_accent\` text,
  	\`version_about_story_your_side_label\` text,
  	\`version_about_story_your_side_title\` text,
  	\`version_about_story_our_side_label\` text,
  	\`version_about_story_our_side_title\` text,
  	\`version_about_story_middle_label\` text,
  	\`version_about_story_pill_out\` text,
  	\`version_about_story_pill_in\` text,
  	\`version_about_story_result\` text,
  	\`version_about_values_label\` text,
  	\`version_about_values_heading\` text,
  	\`version_about_values_intro\` text,
  	\`version_closing_label\` text,
  	\`version_closing_heading\` text,
  	\`version_closing_accent\` text,
  	\`version_closing_text\` text,
  	\`version_closing_cta\` text,
  	\`version_closing_loop\` text,
  	\`version_closing_email_label\` text,
  	\`version_closing_phone_label\` text,
  	\`version_closing_visit_label\` text,
  	\`version_faq_preview_enabled\` integer DEFAULT false,
  	\`version_faq_preview_count\` numeric DEFAULT 4,
  	\`version_faq_preview_label\` text,
  	\`version_faq_preview_heading\` text,
  	\`version_faq_preview_accent\` text,
  	\`version_faq_preview_cta\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_homepage_v_created_at_idx\` ON \`_homepage_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_homepage_v_updated_at_idx\` ON \`_homepage_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_homepage_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_homepage_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_homepage_v_texts_order_parent\` ON \`_homepage_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`href\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_links_order_idx\` ON \`footer_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_links_parent_id_idx\` ON \`footer_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`copyright\` text,
  	\`nav_title\` text,
  	\`activities_title\` text,
  	\`contact_title\` text,
  	\`pages_title\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`_footer_v_version_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`href\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_footer_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_footer_v_version_links_order_idx\` ON \`_footer_v_version_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_footer_v_version_links_parent_id_idx\` ON \`_footer_v_version_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_footer_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_copyright\` text,
  	\`version_nav_title\` text,
  	\`version_activities_title\` text,
  	\`version_contact_title\` text,
  	\`version_pages_title\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_footer_v_created_at_idx\` ON \`_footer_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_footer_v_updated_at_idx\` ON \`_footer_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`theme_default\` text DEFAULT 'light',
  	\`theme_toggle\` integer DEFAULT true,
  	\`theme_intro\` integer DEFAULT true,
  	\`theme_grid\` numeric DEFAULT 0.06,
  	\`theme_colors_blue\` text,
  	\`theme_colors_purple\` text,
  	\`theme_colors_indigo\` text,
  	\`theme_colors_bg\` text,
  	\`theme_colors_dark_bg\` text,
  	\`theme_colors_logo_from\` text,
  	\`theme_colors_logo_to\` text,
  	\`seo_title\` text,
  	\`seo_title_template\` text,
  	\`seo_description\` text,
  	\`seo_og_image_id\` integer,
  	\`seo_index\` integer DEFAULT true,
  	\`seo_google_verification\` text,
  	\`integrations_ga4\` text,
  	\`integrations_gtm\` text,
  	\`integrations_meta_pixel\` text,
  	\`integrations_cookie_text\` text,
  	\`integrations_cookie_accept\` text,
  	\`integrations_cookie_decline\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_seo_seo_og_image_idx\` ON \`site_settings\` (\`seo_og_image_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_texts_order_parent\` ON \`site_settings_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_site_settings_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_theme_default\` text DEFAULT 'light',
  	\`version_theme_toggle\` integer DEFAULT true,
  	\`version_theme_intro\` integer DEFAULT true,
  	\`version_theme_grid\` numeric DEFAULT 0.06,
  	\`version_theme_colors_blue\` text,
  	\`version_theme_colors_purple\` text,
  	\`version_theme_colors_indigo\` text,
  	\`version_theme_colors_bg\` text,
  	\`version_theme_colors_dark_bg\` text,
  	\`version_theme_colors_logo_from\` text,
  	\`version_theme_colors_logo_to\` text,
  	\`version_seo_title\` text,
  	\`version_seo_title_template\` text,
  	\`version_seo_description\` text,
  	\`version_seo_og_image_id\` integer,
  	\`version_seo_index\` integer DEFAULT true,
  	\`version_seo_google_verification\` text,
  	\`version_integrations_ga4\` text,
  	\`version_integrations_gtm\` text,
  	\`version_integrations_meta_pixel\` text,
  	\`version_integrations_cookie_text\` text,
  	\`version_integrations_cookie_accept\` text,
  	\`version_integrations_cookie_decline\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_settings_v_version_seo_version_seo_og_image_idx\` ON \`_site_settings_v\` (\`version_seo_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_site_settings_v_created_at_idx\` ON \`_site_settings_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_site_settings_v_updated_at_idx\` ON \`_site_settings_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_site_settings_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_site_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_site_settings_v_texts_order_parent\` ON \`_site_settings_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`enquiry_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`show_budget\` integer DEFAULT true,
  	\`show_timeline\` integer DEFAULT true,
  	\`show_company\` integer DEFAULT true,
  	\`show_message\` integer DEFAULT true,
  	\`title\` text,
  	\`intro\` text,
  	\`activity_label\` text,
  	\`needs_label\` text,
  	\`budget_label\` text,
  	\`timeline_label\` text,
  	\`name_label\` text,
  	\`name_placeholder\` text,
  	\`name_error\` text,
  	\`company_label\` text,
  	\`company_placeholder\` text,
  	\`message_label\` text,
  	\`message_placeholder\` text,
  	\`whatsapp_cta\` text,
  	\`email_enabled\` integer DEFAULT true,
  	\`email_cta\` text,
  	\`greeting\` text,
  	\`signature\` text,
  	\`thanks_title\` text,
  	\`thanks_text\` text,
  	\`again\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`enquiry_settings_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`enquiry_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`enquiry_settings_texts_order_parent\` ON \`enquiry_settings_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_enquiry_settings_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_show_budget\` integer DEFAULT true,
  	\`version_show_timeline\` integer DEFAULT true,
  	\`version_show_company\` integer DEFAULT true,
  	\`version_show_message\` integer DEFAULT true,
  	\`version_title\` text,
  	\`version_intro\` text,
  	\`version_activity_label\` text,
  	\`version_needs_label\` text,
  	\`version_budget_label\` text,
  	\`version_timeline_label\` text,
  	\`version_name_label\` text,
  	\`version_name_placeholder\` text,
  	\`version_name_error\` text,
  	\`version_company_label\` text,
  	\`version_company_placeholder\` text,
  	\`version_message_label\` text,
  	\`version_message_placeholder\` text,
  	\`version_whatsapp_cta\` text,
  	\`version_email_enabled\` integer DEFAULT true,
  	\`version_email_cta\` text,
  	\`version_greeting\` text,
  	\`version_signature\` text,
  	\`version_thanks_title\` text,
  	\`version_thanks_text\` text,
  	\`version_again\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_enquiry_settings_v_created_at_idx\` ON \`_enquiry_settings_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_enquiry_settings_v_updated_at_idx\` ON \`_enquiry_settings_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`_enquiry_settings_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_enquiry_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_enquiry_settings_v_texts_order_parent\` ON \`_enquiry_settings_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ebook_settings_form_codes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`code\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`ebook_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`ebook_settings_form_codes_order_idx\` ON \`ebook_settings_form_codes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`ebook_settings_form_codes_parent_id_idx\` ON \`ebook_settings_form_codes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`ebook_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`delivery_approval_mode\` text DEFAULT 'manual',
  	\`delivery_delivery_mode\` text DEFAULT 'link',
  	\`delivery_attachment_max_mb\` numeric DEFAULT 15,
  	\`delivery_link_days\` numeric DEFAULT 7,
  	\`delivery_max_downloads\` numeric DEFAULT 5,
  	\`delivery_sender_name\` text,
  	\`delivery_reply_to\` text,
  	\`delivery_admin_alert\` integer DEFAULT true,
  	\`delivery_admin_alert_to\` text,
  	\`email_subject\` text,
  	\`email_body\` text,
  	\`email_button_label\` text,
  	\`email_footer\` text,
  	\`section_label\` text,
  	\`section_heading\` text,
  	\`section_accent\` text,
  	\`section_intro\` text,
  	\`section_card_label\` text,
  	\`section_card_cta\` text,
  	\`section_inside_label\` text,
  	\`form_eyebrow\` text,
  	\`form_title\` text,
  	\`form_text\` text,
  	\`form_name_label\` text,
  	\`form_name_placeholder\` text,
  	\`form_email_label\` text,
  	\`form_email_placeholder\` text,
  	\`form_phone_label\` text,
  	\`form_phone_placeholder\` text,
  	\`form_phone_required\` integer DEFAULT true,
  	\`form_company_label\` text,
  	\`form_company_placeholder\` text,
  	\`form_show_company\` integer DEFAULT true,
  	\`form_consent\` text,
  	\`form_submit\` text,
  	\`form_sending\` text,
  	\`form_back\` text,
  	\`form_default_code\` text,
  	\`form_success_title\` text,
  	\`form_success_pending\` text,
  	\`form_success_sent\` text,
  	\`form_error\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`_ebook_settings_v_version_form_codes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_ebook_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_ebook_settings_v_version_form_codes_order_idx\` ON \`_ebook_settings_v_version_form_codes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_ebook_settings_v_version_form_codes_parent_id_idx\` ON \`_ebook_settings_v_version_form_codes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_ebook_settings_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_delivery_approval_mode\` text DEFAULT 'manual',
  	\`version_delivery_delivery_mode\` text DEFAULT 'link',
  	\`version_delivery_attachment_max_mb\` numeric DEFAULT 15,
  	\`version_delivery_link_days\` numeric DEFAULT 7,
  	\`version_delivery_max_downloads\` numeric DEFAULT 5,
  	\`version_delivery_sender_name\` text,
  	\`version_delivery_reply_to\` text,
  	\`version_delivery_admin_alert\` integer DEFAULT true,
  	\`version_delivery_admin_alert_to\` text,
  	\`version_email_subject\` text,
  	\`version_email_body\` text,
  	\`version_email_button_label\` text,
  	\`version_email_footer\` text,
  	\`version_section_label\` text,
  	\`version_section_heading\` text,
  	\`version_section_accent\` text,
  	\`version_section_intro\` text,
  	\`version_section_card_label\` text,
  	\`version_section_card_cta\` text,
  	\`version_section_inside_label\` text,
  	\`version_form_eyebrow\` text,
  	\`version_form_title\` text,
  	\`version_form_text\` text,
  	\`version_form_name_label\` text,
  	\`version_form_name_placeholder\` text,
  	\`version_form_email_label\` text,
  	\`version_form_email_placeholder\` text,
  	\`version_form_phone_label\` text,
  	\`version_form_phone_placeholder\` text,
  	\`version_form_phone_required\` integer DEFAULT true,
  	\`version_form_company_label\` text,
  	\`version_form_company_placeholder\` text,
  	\`version_form_show_company\` integer DEFAULT true,
  	\`version_form_consent\` text,
  	\`version_form_submit\` text,
  	\`version_form_sending\` text,
  	\`version_form_back\` text,
  	\`version_form_default_code\` text,
  	\`version_form_success_title\` text,
  	\`version_form_success_pending\` text,
  	\`version_form_success_sent\` text,
  	\`version_form_error\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_ebook_settings_v_created_at_idx\` ON \`_ebook_settings_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_ebook_settings_v_updated_at_idx\` ON \`_ebook_settings_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`quiz_settings_questions_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`only\` integer DEFAULT false,
  	\`points_social\` numeric DEFAULT 0,
  	\`points_advertising\` numeric DEFAULT 0,
  	\`points_content\` numeric DEFAULT 0,
  	\`points_photo\` numeric DEFAULT 0,
  	\`points_events\` numeric DEFAULT 0,
  	\`points_pr\` numeric DEFAULT 0,
  	\`points_strategy\` numeric DEFAULT 0,
  	\`points_ai\` numeric DEFAULT 0,
  	\`points_it\` numeric DEFAULT 0,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quiz_settings_questions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quiz_settings_questions_options_order_idx\` ON \`quiz_settings_questions_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quiz_settings_questions_options_parent_id_idx\` ON \`quiz_settings_questions_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quiz_settings_questions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`q\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`role\` text DEFAULT 'none',
  	\`multi\` integer DEFAULT false,
  	\`hint\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quiz_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quiz_settings_questions_order_idx\` ON \`quiz_settings_questions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quiz_settings_questions_parent_id_idx\` ON \`quiz_settings_questions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quiz_settings_result_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quiz_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quiz_settings_result_steps_order_idx\` ON \`quiz_settings_result_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quiz_settings_result_steps_parent_id_idx\` ON \`quiz_settings_result_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quiz_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`accent\` text,
  	\`text\` text,
  	\`cta\` text,
  	\`meta\` text,
  	\`result_label\` text,
  	\`result_heading\` text,
  	\`result_summary\` text,
  	\`result_why\` text,
  	\`result_matches\` numeric DEFAULT 3,
  	\`result_whatsapp_cta\` text,
  	\`result_retake\` text,
  	\`result_ebooks_cta\` text,
  	\`result_whatsapp_intro\` text,
  	\`result_whatsapp_outro\` text,
  	\`result_email_enabled\` integer DEFAULT true,
  	\`result_email_placeholder\` text,
  	\`result_email_cta\` text,
  	\`result_email_sent\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`_quiz_settings_v_version_questions_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`only\` integer DEFAULT false,
  	\`points_social\` numeric DEFAULT 0,
  	\`points_advertising\` numeric DEFAULT 0,
  	\`points_content\` numeric DEFAULT 0,
  	\`points_photo\` numeric DEFAULT 0,
  	\`points_events\` numeric DEFAULT 0,
  	\`points_pr\` numeric DEFAULT 0,
  	\`points_strategy\` numeric DEFAULT 0,
  	\`points_ai\` numeric DEFAULT 0,
  	\`points_it\` numeric DEFAULT 0,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_quiz_settings_v_version_questions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_version_questions_options_order_idx\` ON \`_quiz_settings_v_version_questions_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_version_questions_options_parent_id_idx\` ON \`_quiz_settings_v_version_questions_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quiz_settings_v_version_questions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`q\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`role\` text DEFAULT 'none',
  	\`multi\` integer DEFAULT false,
  	\`hint\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_quiz_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_version_questions_order_idx\` ON \`_quiz_settings_v_version_questions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_version_questions_parent_id_idx\` ON \`_quiz_settings_v_version_questions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quiz_settings_v_version_result_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_quiz_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_version_result_steps_order_idx\` ON \`_quiz_settings_v_version_result_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_version_result_steps_parent_id_idx\` ON \`_quiz_settings_v_version_result_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quiz_settings_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_label\` text,
  	\`version_heading\` text,
  	\`version_accent\` text,
  	\`version_text\` text,
  	\`version_cta\` text,
  	\`version_meta\` text,
  	\`version_result_label\` text,
  	\`version_result_heading\` text,
  	\`version_result_summary\` text,
  	\`version_result_why\` text,
  	\`version_result_matches\` numeric DEFAULT 3,
  	\`version_result_whatsapp_cta\` text,
  	\`version_result_retake\` text,
  	\`version_result_ebooks_cta\` text,
  	\`version_result_whatsapp_intro\` text,
  	\`version_result_whatsapp_outro\` text,
  	\`version_result_email_enabled\` integer DEFAULT true,
  	\`version_result_email_placeholder\` text,
  	\`version_result_email_cta\` text,
  	\`version_result_email_sent\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_created_at_idx\` ON \`_quiz_settings_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_quiz_settings_v_updated_at_idx\` ON \`_quiz_settings_v\` (\`updated_at\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`services\`;`)
  await db.run(sql`DROP TABLE \`services_texts\`;`)
  await db.run(sql`DROP TABLE \`_services_v\`;`)
  await db.run(sql`DROP TABLE \`_services_v_texts\`;`)
  await db.run(sql`DROP TABLE \`enquiries\`;`)
  await db.run(sql`DROP TABLE \`enquiries_texts\`;`)
  await db.run(sql`DROP TABLE \`ebooks\`;`)
  await db.run(sql`DROP TABLE \`ebooks_texts\`;`)
  await db.run(sql`DROP TABLE \`_ebooks_v\`;`)
  await db.run(sql`DROP TABLE \`_ebooks_v_texts\`;`)
  await db.run(sql`DROP TABLE \`leads\`;`)
  await db.run(sql`DROP TABLE \`ebook_files\`;`)
  await db.run(sql`DROP TABLE \`quiz_submissions\`;`)
  await db.run(sql`DROP TABLE \`values\`;`)
  await db.run(sql`DROP TABLE \`faqs\`;`)
  await db.run(sql`DROP TABLE \`_faqs_v\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`login_events\`;`)
  await db.run(sql`DROP TABLE \`rate_hits\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`company_socials\`;`)
  await db.run(sql`DROP TABLE \`company\`;`)
  await db.run(sql`DROP TABLE \`_company_v_version_socials\`;`)
  await db.run(sql`DROP TABLE \`_company_v\`;`)
  await db.run(sql`DROP TABLE \`navigation_items\`;`)
  await db.run(sql`DROP TABLE \`navigation\`;`)
  await db.run(sql`DROP TABLE \`_navigation_v_version_items\`;`)
  await db.run(sql`DROP TABLE \`_navigation_v\`;`)
  await db.run(sql`DROP TABLE \`homepage_sections\`;`)
  await db.run(sql`DROP TABLE \`homepage_about_stats\`;`)
  await db.run(sql`DROP TABLE \`homepage_about_steps\`;`)
  await db.run(sql`DROP TABLE \`homepage\`;`)
  await db.run(sql`DROP TABLE \`homepage_texts\`;`)
  await db.run(sql`DROP TABLE \`_homepage_v_version_sections\`;`)
  await db.run(sql`DROP TABLE \`_homepage_v_version_about_stats\`;`)
  await db.run(sql`DROP TABLE \`_homepage_v_version_about_steps\`;`)
  await db.run(sql`DROP TABLE \`_homepage_v\`;`)
  await db.run(sql`DROP TABLE \`_homepage_v_texts\`;`)
  await db.run(sql`DROP TABLE \`footer_links\`;`)
  await db.run(sql`DROP TABLE \`footer\`;`)
  await db.run(sql`DROP TABLE \`_footer_v_version_links\`;`)
  await db.run(sql`DROP TABLE \`_footer_v\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`site_settings_texts\`;`)
  await db.run(sql`DROP TABLE \`_site_settings_v\`;`)
  await db.run(sql`DROP TABLE \`_site_settings_v_texts\`;`)
  await db.run(sql`DROP TABLE \`enquiry_settings\`;`)
  await db.run(sql`DROP TABLE \`enquiry_settings_texts\`;`)
  await db.run(sql`DROP TABLE \`_enquiry_settings_v\`;`)
  await db.run(sql`DROP TABLE \`_enquiry_settings_v_texts\`;`)
  await db.run(sql`DROP TABLE \`ebook_settings_form_codes\`;`)
  await db.run(sql`DROP TABLE \`ebook_settings\`;`)
  await db.run(sql`DROP TABLE \`_ebook_settings_v_version_form_codes\`;`)
  await db.run(sql`DROP TABLE \`_ebook_settings_v\`;`)
  await db.run(sql`DROP TABLE \`quiz_settings_questions_options\`;`)
  await db.run(sql`DROP TABLE \`quiz_settings_questions\`;`)
  await db.run(sql`DROP TABLE \`quiz_settings_result_steps\`;`)
  await db.run(sql`DROP TABLE \`quiz_settings\`;`)
  await db.run(sql`DROP TABLE \`_quiz_settings_v_version_questions_options\`;`)
  await db.run(sql`DROP TABLE \`_quiz_settings_v_version_questions\`;`)
  await db.run(sql`DROP TABLE \`_quiz_settings_v_version_result_steps\`;`)
  await db.run(sql`DROP TABLE \`_quiz_settings_v\`;`)
}
