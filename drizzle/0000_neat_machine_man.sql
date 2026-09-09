CREATE TABLE "asrama" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"musyrif" text NOT NULL,
	"capacity" integer NOT NULL,
	"filled" integer DEFAULT 0 NOT NULL,
	"gender" text NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"action" text NOT NULL,
	"user" text NOT NULL,
	"user_id" text,
	"user_role" text,
	"details" text,
	"target_entity" text,
	"target_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_change_records" (
	"id" text PRIMARY KEY NOT NULL,
	"history_ledger_id" text NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text,
	"new_value" text NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gdrive_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer,
	"web_view_link" text,
	"download_url" text,
	"category" text NOT NULL,
	"related_entity" text,
	"related_id" text,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gdrive_documents_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
CREATE TABLE "governance_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"source_type" text NOT NULL,
	"submitted_by" text NOT NULL,
	"submitted_by_role" text,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"reason" text NOT NULL,
	"severity" text,
	"points" integer,
	"date" text NOT NULL,
	"notes" text,
	"master_pelanggaran_id" text,
	"master_pelanggaran_name" text,
	"related_entity_type" text,
	"related_entity_id" text,
	"review_status" text NOT NULL,
	"reviewed_by" text,
	"reviewed_by_role" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"violation_id" text,
	"warning_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guru" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"nip" text NOT NULL,
	"ranah_instansi" text NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"email" text,
	"no_wa" text,
	"alamat" text,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"alasan" text NOT NULL,
	"rumah_sakit" text,
	"tanggal_mulai" text NOT NULL,
	"tanggal_selesai" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"gdrive_file_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_visits" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"keluhan" text NOT NULL,
	"diagnosa" text,
	"tindakan" text,
	"obat" text,
	"tanggal" text NOT NULL,
	"petugas" text NOT NULL,
	"gdrive_file_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history_ledgers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hukuman" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"pelanggaran_id" text NOT NULL,
	"master_hukuman_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"executor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kamar" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"asrama_id" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kelas" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"jenjang" text NOT NULL,
	"tingkat" integer NOT NULL,
	"wali_kelas" text NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"academic_tab" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mapel" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"jenjang" text NOT NULL,
	"tingkat" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_hukuman" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"severity_scope" jsonb,
	"minimum_tingkat" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_jenjang" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"nama_jenjang" text NOT NULL,
	"instansi" text NOT NULL,
	"progression_indexes" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_pelanggaran" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"code" text NOT NULL,
	"ranah_instansi" text NOT NULL,
	"kategori" text NOT NULL,
	"name" text NOT NULL,
	"severity" text NOT NULL,
	"points" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_tingkat" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"instansi" text NOT NULL,
	"progression_index" integer NOT NULL,
	"tingkat_label" text NOT NULL,
	"jenjang_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"target_role" text,
	"target_santri_id" text,
	"target_asrama_id" text,
	"target_kelas" text,
	"target_angkatan" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pelanggaran" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"pelanggaran_id" text NOT NULL,
	"pelanggaran_name" text NOT NULL,
	"severity" text NOT NULL,
	"points" integer NOT NULL,
	"date" text NOT NULL,
	"reported_by" text NOT NULL,
	"reported_by_user_id" text,
	"reported_by_role" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"status_hukuman" text DEFAULT 'belum' NOT NULL,
	"punishment_id" text,
	"punishment_name" text,
	"notes" text,
	"governance_case_id" text,
	"gdrive_file_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"points_reward" integer NOT NULL,
	"status" text NOT NULL,
	"deadline" text NOT NULL,
	"progress" integer DEFAULT 0,
	"created_by" text,
	"approval_status" text,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "santri" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"nis" text NOT NULL,
	"name" text NOT NULL,
	"asrama" text NOT NULL,
	"kamar" text NOT NULL,
	"asrama_id" text,
	"kamar_id" text,
	"kelas" text NOT NULL,
	"status" text DEFAULT 'Aktif' NOT NULL,
	"gender" text NOT NULL,
	"photo_url" text,
	"wali_id" text,
	"wali_name" text NOT NULL,
	"wali_phone" text NOT NULL,
	"join_date" text NOT NULL,
	"asal_kota" text NOT NULL,
	"asal_provinsi" text NOT NULL,
	"angkatan_masuk" integer NOT NULL,
	"total_poin_pelanggaran" integer DEFAULT 0 NOT NULL,
	"total_prestasi" integer DEFAULT 0 NOT NULL,
	"status_karakter" text DEFAULT 'Baik' NOT NULL,
	"status_sp" text DEFAULT 'Tidak Ada' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "santri_nis_unique" UNIQUE("nis")
);
--> statement-breakpoint
CREATE TABLE "status_change_records" (
	"id" text PRIMARY KEY NOT NULL,
	"status_ledger_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"transition_type" text NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text NOT NULL,
	"reason" text NOT NULL,
	"effective_date" timestamp NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_ledgers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"current_state" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"mapel_id" text NOT NULL,
	"kelas_id" text NOT NULL,
	"kelas_name" text NOT NULL,
	"guru_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"gdrive_service_account_json" text,
	"flip_secret_key" text,
	"flip_validation_token" text,
	"wa_gateway_api_key" text,
	"custom_logo_url" text,
	"custom_bg_url" text,
	"primary_color" text DEFAULT '#0F766E',
	"tagline" text DEFAULT 'Sistem Informasi Pesantren Terpadu',
	"login_title" text,
	"login_subtitle" text,
	"login_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tolerance_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"type" text NOT NULL,
	"jenjang" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"limits" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"module" text NOT NULL,
	"scope" text DEFAULT 'TENANT' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "platform_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trp_role_perm_idx" UNIQUE("tenant_role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"role_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_roles_tenant_code_idx" UNIQUE("tenant_id","role_code")
);
--> statement-breakpoint
CREATE TABLE "user_additional_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"granted_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uap_member_perm_idx" UNIQUE("membership_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user_platform_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform_role_id" text NOT NULL,
	"granted_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_platform_roles_user_role_idx" UNIQUE("user_id","platform_role_id")
);
--> statement-breakpoint
CREATE TABLE "user_tenant_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"primary_role_id" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tenant_memberships_user_tenant_idx" UNIQUE("user_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"avatar" text,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"role" text DEFAULT 'orang_tua',
	"child_santri_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "wali_santri_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"wali_user_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"relationship_type" text DEFAULT 'AYAH' NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wsr_tenant_wali_santri_idx" UNIQUE("tenant_id","wali_user_id","santri_id")
);
--> statement-breakpoint
CREATE TABLE "canteen_items" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"canteen_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"category" text DEFAULT 'makanan' NOT NULL,
	"price" integer NOT NULL,
	"stock" integer DEFAULT 100 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canteen_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"canteen_id" text,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"card_uid" text NOT NULL,
	"amount" integer NOT NULL,
	"items_description" text,
	"vendor_name" text DEFAULT 'Kantin Utama' NOT NULL,
	"pos_cashier_id" text,
	"status" text DEFAULT 'SUCCESS' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canteens" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"location" text NOT NULL,
	"cashier_user_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"operating_hours" text DEFAULT '06:00 - 17:00' NOT NULL,
	"receipt_footer" text DEFAULT 'Terima kasih telah berbelanja di Pesantren' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"wali_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"amount_spp" integer DEFAULT 0 NOT NULL,
	"amount_uang_saku" integer DEFAULT 0 NOT NULL,
	"amount_tabungan" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"spp_month_period" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"flip_bill_id" text,
	"flip_payment_url" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "wallet_pockets" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"pocket_type" text NOT NULL,
	"mutation_type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"wali_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"balance_uang_saku" integer DEFAULT 0 NOT NULL,
	"balance_tabungan" integer DEFAULT 0 NOT NULL,
	"daily_limit" integer DEFAULT 20000 NOT NULL,
	"canteen_status" text DEFAULT 'active' NOT NULL,
	"suspended_reason" text,
	"suspended_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"card_uid" text NOT NULL,
	"location_type" text NOT NULL,
	"location_name" text NOT NULL,
	"status" text DEFAULT 'hadir' NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfid_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"card_uid" text NOT NULL,
	"hashed_pin" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paired_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rfid_cards_card_uid_unique" UNIQUE("card_uid")
);
--> statement-breakpoint
CREATE TABLE "gate_passes" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"santri_id" text NOT NULL,
	"santri_name" text NOT NULL,
	"jenis_izin" text NOT NULL,
	"alasan" text NOT NULL,
	"approved_by" text NOT NULL,
	"valid_until" timestamp NOT NULL,
	"check_out_time" timestamp,
	"check_in_time" timestamp,
	"actual_duration_minutes" integer,
	"status" text DEFAULT 'APPROVED' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppob_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"icon_name" text DEFAULT 'Zap' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ppob_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ppob_products" (
	"id" text PRIMARY KEY NOT NULL,
	"category_code" text NOT NULL,
	"buyer_sku_code" text NOT NULL,
	"product_name" text NOT NULL,
	"brand" text NOT NULL,
	"type" text DEFAULT 'prabayar' NOT NULL,
	"price_base" integer NOT NULL,
	"margin_fee_saas" integer DEFAULT 1500 NOT NULL,
	"price_selling" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ppob_products_buyer_sku_code_unique" UNIQUE("buyer_sku_code")
);
--> statement-breakpoint
CREATE TABLE "ppob_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"wali_id" text NOT NULL,
	"santri_id" text,
	"category_code" text NOT NULL,
	"buyer_sku_code" text NOT NULL,
	"product_name" text NOT NULL,
	"customer_no" text NOT NULL,
	"customer_name" text,
	"amount_base" integer NOT NULL,
	"fee_saas" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"sn" text,
	"digiflazz_ref_id" text,
	"saas_pg_ref_id" text,
	"qr_url" text,
	"failure_reason" text,
	"refunded_to_balance_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppob_wali_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"wali_id" text NOT NULL,
	"wali_name" text NOT NULL,
	"wali_phone" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ppob_wali_balances_wali_id_unique" UNIQUE("wali_id")
);
--> statement-breakpoint
CREATE TABLE "academic_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"academic_year_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_ledger_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"academic_term_id" text NOT NULL,
	"mapel_id" text DEFAULT 'all' NOT NULL,
	"source_group" text NOT NULL,
	"raw_score" real NOT NULL,
	"weighted_score" real NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_transcripts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text DEFAULT 'default' NOT NULL,
	"santri_id" text NOT NULL,
	"academic_term_id" text NOT NULL,
	"final_score" real NOT NULL,
	"predicate" text NOT NULL,
	"rank_in_class" integer,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_role_permissions" ADD CONSTRAINT "tenant_role_permissions_tenant_role_id_tenant_roles_id_fk" FOREIGN KEY ("tenant_role_id") REFERENCES "public"."tenant_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_role_permissions" ADD CONSTRAINT "tenant_role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_roles" ADD CONSTRAINT "tenant_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_additional_permissions" ADD CONSTRAINT "user_additional_permissions_membership_id_user_tenant_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."user_tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_additional_permissions" ADD CONSTRAINT "user_additional_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platform_roles" ADD CONSTRAINT "user_platform_roles_platform_role_id_platform_roles_id_fk" FOREIGN KEY ("platform_role_id") REFERENCES "public"."platform_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tenant_memberships" ADD CONSTRAINT "user_tenant_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tenant_memberships" ADD CONSTRAINT "user_tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tenant_memberships" ADD CONSTRAINT "user_tenant_memberships_primary_role_id_tenant_roles_id_fk" FOREIGN KEY ("primary_role_id") REFERENCES "public"."tenant_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_santri_relationships" ADD CONSTRAINT "wali_santri_relationships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_santri_relationships" ADD CONSTRAINT "wali_santri_relationships_wali_user_id_users_id_fk" FOREIGN KEY ("wali_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wali_santri_relationships" ADD CONSTRAINT "wali_santri_relationships_santri_id_santri_id_fk" FOREIGN KEY ("santri_id") REFERENCES "public"."santri"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trp_role_idx" ON "tenant_role_permissions" USING btree ("tenant_role_id");--> statement-breakpoint
CREATE INDEX "trp_perm_idx" ON "tenant_role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "tenant_roles_tenant_idx" ON "tenant_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "uap_member_idx" ON "user_additional_permissions" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "uap_perm_idx" ON "user_additional_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "upr_user_idx" ON "user_platform_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "utm_user_idx" ON "user_tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "utm_tenant_idx" ON "user_tenant_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "utm_role_idx" ON "user_tenant_memberships" USING btree ("primary_role_id");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wsr_wali_idx" ON "wali_santri_relationships" USING btree ("wali_user_id");--> statement-breakpoint
CREATE INDEX "wsr_santri_idx" ON "wali_santri_relationships" USING btree ("santri_id");--> statement-breakpoint
CREATE INDEX "wsr_tenant_idx" ON "wali_santri_relationships" USING btree ("tenant_id");