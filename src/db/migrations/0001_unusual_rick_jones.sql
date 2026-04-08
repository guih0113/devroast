CREATE TYPE "public"."roast_status" AS ENUM('pending', 'complete', 'failed');--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "roast_quote" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "issues_found" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "errors" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ADD COLUMN "status" "roast_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX "roasts_status_idx" ON "roasts" USING btree ("status");