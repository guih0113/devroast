CREATE TYPE "public"."severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TABLE "analysis_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roast_id" uuid NOT NULL,
	"severity" "severity" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"lang" varchar(64) NOT NULL,
	"file_name" varchar(255),
	"score" numeric(4, 2) NOT NULL,
	"roast_quote" text NOT NULL,
	"issues_found" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"roast_mode" boolean DEFAULT false NOT NULL,
	"diff" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_items" ADD CONSTRAINT "analysis_items_roast_id_roasts_id_fk" FOREIGN KEY ("roast_id") REFERENCES "public"."roasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roasts_score_idx" ON "roasts" USING btree ("score");--> statement-breakpoint
CREATE INDEX "roasts_code_hash_idx" ON "roasts" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "roasts_created_at_idx" ON "roasts" USING btree ("created_at");