CREATE TABLE "llm_model_price" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"dimension" text NOT NULL,
	"unit" text NOT NULL,
	"amount" numeric(14,8) NOT NULL,
	"currency" text DEFAULT 'CNY' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "llm_model_price_dimension_from_unique" UNIQUE("provider","model_id","dimension","effective_from")
);
--> statement-breakpoint
CREATE TABLE "llm_usage_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"feature" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"reasoning_tokens" integer DEFAULT 0 NOT NULL,
	"web_search_calls" integer DEFAULT 0 NOT NULL,
	"estimated_cost" numeric(14,8) NOT NULL,
	"currency" text DEFAULT 'CNY' NOT NULL,
	"price_snapshot" jsonb NOT NULL,
	"usage_raw" jsonb,
	"duration_ms" integer,
	"provider_response_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "llm_model_price_current_unique" ON "llm_model_price" ("provider","model_id","dimension") WHERE ("effective_to" is null);--> statement-breakpoint
CREATE INDEX "llm_usage_event_created_at_idx" ON "llm_usage_event" ("created_at");--> statement-breakpoint
CREATE INDEX "llm_usage_event_user_id_created_at_idx" ON "llm_usage_event" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "llm_usage_event_feature_created_at_idx" ON "llm_usage_event" ("feature","created_at");