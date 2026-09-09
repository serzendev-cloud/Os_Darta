CREATE TABLE IF NOT EXISTS "master_institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"label" varchar(255),
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tenant_institution_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "violation_severity_levels" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"badge_color" varchar(50) DEFAULT 'gray',
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tenant_severity_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "violation_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tenant_category_code" UNIQUE("tenant_id","code")
);
--> statement-breakpoint
ALTER TABLE "master_institutions" ADD CONSTRAINT "master_institutions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "violation_severity_levels" ADD CONSTRAINT "violation_severity_levels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "violation_categories" ADD CONSTRAINT "violation_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_master_institutions_tenant" ON "master_institutions" USING btree ("tenant_id","is_active","sort_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_severity_levels_tenant" ON "violation_severity_levels" USING btree ("tenant_id","is_active","sort_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_violation_categories_tenant" ON "violation_categories" USING btree ("tenant_id","status","sort_order");
--> statement-breakpoint
ALTER TABLE "master_institutions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "master_institutions_tenant_isolation" ON "master_institutions" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'));
--> statement-breakpoint
ALTER TABLE "violation_severity_levels" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "violation_severity_levels_tenant_isolation" ON "violation_severity_levels" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'));
--> statement-breakpoint
ALTER TABLE "violation_categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "violation_categories_tenant_isolation" ON "violation_categories" FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'));
