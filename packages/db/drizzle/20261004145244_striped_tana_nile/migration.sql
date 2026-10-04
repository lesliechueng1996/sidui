CREATE TYPE "cook_space_member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "cook_space_type" AS ENUM('personal', 'family');--> statement-breakpoint
CREATE TABLE "cook_space" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" "cook_space_type" NOT NULL,
	"name" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cook_space_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "cook_space_member_role" DEFAULT 'member'::"cook_space_member_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cook_space_member_space_id_user_id_unique" UNIQUE("space_id","user_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cook_space_personal_owner_user_id_unique" ON "cook_space" ("owner_user_id") WHERE "type" = 'personal';--> statement-breakpoint
CREATE INDEX "cook_space_member_user_id_index" ON "cook_space_member" ("user_id");