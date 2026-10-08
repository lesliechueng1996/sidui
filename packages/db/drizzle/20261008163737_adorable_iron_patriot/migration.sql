CREATE TYPE "cook_tag_scope" AS ENUM('ingredient', 'utensil', 'recipe');--> statement-breakpoint
CREATE TABLE "cook_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"space_id" text NOT NULL,
	"scope" "cook_tag_scope" NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cook_tag_space_id_scope_name_unique" ON "cook_tag" ("space_id","scope","name");