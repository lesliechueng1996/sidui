CREATE TABLE "game_dungeon_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"dungeon_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_dungeon_item_dungeon_id_item_id_unique" UNIQUE("dungeon_id","item_id")
);
--> statement-breakpoint
CREATE INDEX "game_dungeon_item_dungeon_id_idx" ON "game_dungeon_item" ("dungeon_id");--> statement-breakpoint
CREATE INDEX "game_dungeon_item_item_id_idx" ON "game_dungeon_item" ("item_id");