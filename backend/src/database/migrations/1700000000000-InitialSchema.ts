import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255),
        "phone_number" character varying(20),
        "password_hash" character varying(255),
        "full_name" character varying(100) NOT NULL,
        "avatar_url" character varying(500),
        "role" character varying NOT NULL DEFAULT 'user',
        "user_type" character varying NOT NULL DEFAULT 'free',
        "credits_balance" integer NOT NULL DEFAULT 5,
        "email_verified" boolean NOT NULL DEFAULT false,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "otp_code" character varying(10),
        "otp_expires_at" TIMESTAMP,
        "refresh_token" character varying(500),
        "last_login_at" TIMESTAMP,
        "last_login_ip" character varying(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone_number" ON "users" ("phone_number")`);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'draft',
        "room_type" character varying,
        "original_image_url" character varying(500),
        "generated_image_url" character varying(500),
        "style_preset_id" character varying(100),
        "settings" jsonb,
        "is_favorite" boolean NOT NULL DEFAULT false,
        "view_count" integer NOT NULL DEFAULT 0,
        "share_count" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_projects_user_id" ON "projects" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_projects_status" ON "projects" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_projects_created_at" ON "projects" ("created_at")`);

    // Create generation_jobs table
    await queryRunner.query(`
      CREATE TABLE "generation_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "project_id" uuid,
        "generation_mode" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'queued',
        "input_image_url" character varying(500),
        "output_image_url" character varying(500),
        "style_preset_id" character varying(100),
        "prompt" text,
        "negative_prompt" text,
        "creative_freedom" real NOT NULL DEFAULT 0.5,
        "credits_cost" integer NOT NULL DEFAULT 1,
        "external_job_id" character varying(255),
        "error_message" text,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "processing_time_ms" integer,
        "generation_params" jsonb,
        "ai_analysis" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_generation_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_generation_jobs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_generation_jobs_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_generation_jobs_user_id" ON "generation_jobs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_generation_jobs_project_id" ON "generation_jobs" ("project_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_generation_jobs_status" ON "generation_jobs" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_generation_jobs_created_at" ON "generation_jobs" ("created_at")`);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "reference" character varying(255) NOT NULL,
        "transaction_type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "payment_provider" character varying,
        "amount" decimal(10,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'NGN',
        "credits_amount" integer,
        "external_reference" character varying(255),
        "payment_url" character varying(500),
        "description" text,
        "payment_metadata" jsonb,
        "paid_at" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transactions_reference" UNIQUE ("reference"),
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_transactions_user_id" ON "transactions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_type" ON "transactions" ("transaction_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_reference" ON "transactions" ("reference")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("created_at")`);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "plan" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "billing_cycle" character varying NOT NULL DEFAULT 'monthly',
        "price" decimal(10,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'NGN',
        "monthly_credits" integer NOT NULL,
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end" TIMESTAMP NOT NULL,
        "auto_renew" boolean NOT NULL DEFAULT true,
        "external_subscription_id" character varying(255),
        "payment_provider" character varying(255),
        "cancelled_at" TIMESTAMP,
        "trial_ends_at" TIMESTAMP,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_plan" ON "subscriptions" ("plan")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_period_end" ON "subscriptions" ("current_period_end")`);

    // Create credit_packages table
    await queryRunner.query(`
      CREATE TABLE "credit_packages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "credits_amount" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'NGN',
        "bonus_credits" integer,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_credit_packages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_credit_packages_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_credit_packages_active" ON "credit_packages" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_credit_packages_credits" ON "credit_packages" ("credits_amount")`);

    // Create style_presets table
    await queryRunner.query(`
      CREATE TABLE "style_presets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying(100) NOT NULL,
        "name" character varying(100) NOT NULL,
        "category" character varying NOT NULL,
        "description" text,
        "keywords" text NOT NULL,
        "thumbnail_url" character varying(500),
        "is_premium" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "popularity" integer NOT NULL DEFAULT 0,
        "usage_count" integer NOT NULL DEFAULT 0,
        "advanced_params" jsonb,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_style_presets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_style_presets_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_style_presets_slug" ON "style_presets" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_style_presets_category" ON "style_presets" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_style_presets_premium" ON "style_presets" ("is_premium")`);
    await queryRunner.query(`CREATE INDEX "IDX_style_presets_active" ON "style_presets" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_style_presets_popularity" ON "style_presets" ("popularity")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "style_presets"`);
    await queryRunner.query(`DROP TABLE "credit_packages"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "generation_jobs"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
