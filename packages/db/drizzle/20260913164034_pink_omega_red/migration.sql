CREATE TABLE "lyric_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"song_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"segments" jsonb NOT NULL,
	"meaning" text,
	"start_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lyric_line_song_position_unique" UNIQUE("song_id","position")
);
--> statement-breakpoint
CREATE TABLE "lyric_song" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"meaning" text NOT NULL,
	"artist" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lyric_line_song_id_idx" ON "lyric_line" ("song_id");--> statement-breakpoint
CREATE INDEX "lyric_song_user_id_idx" ON "lyric_song" ("user_id");