-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nickname" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "provider_id" TEXT,
    "agree_terms" BOOLEAN NOT NULL DEFAULT false,
    "agree_privacy" BOOLEAN NOT NULL DEFAULT false,
    "agree_marketing" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performances" (
    "id" TEXT NOT NULL,
    "kopis_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "venue_address" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "poster_url" TEXT,
    "price" TEXT NOT NULL DEFAULT '',
    "min_price" INTEGER,
    "max_price" INTEGER,
    "age_limit" TEXT NOT NULL DEFAULT '',
    "runtime" TEXT,
    "cast" TEXT,
    "synopsis" TEXT,
    "ticket_urls" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "performance_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_performances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "performance_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "review" TEXT,
    "seat_info" TEXT,
    "ticket_site" TEXT,
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "my_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_posts" (
    "id" TEXT NOT NULL,
    "board_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT,
    "author_nickname" TEXT NOT NULL,
    "anonymous_password" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author_nickname" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "anonymous_password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common_codes" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "common_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "performances_kopis_id_key" ON "performances"("kopis_id");

-- CreateIndex
CREATE INDEX "performances_genre_idx" ON "performances"("genre");

-- CreateIndex
CREATE INDEX "performances_status_idx" ON "performances"("status");

-- CreateIndex
CREATE INDEX "performances_start_date_idx" ON "performances"("start_date");

-- CreateIndex
CREATE INDEX "performances_min_price_idx" ON "performances"("min_price");

-- CreateIndex
CREATE INDEX "performances_title_idx" ON "performances"("title");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_performance_id_key" ON "favorites"("user_id", "performance_id");

-- CreateIndex
CREATE UNIQUE INDEX "my_performances_user_id_performance_id_key" ON "my_performances"("user_id", "performance_id");

-- CreateIndex
CREATE INDEX "board_posts_board_type_category_idx" ON "board_posts"("board_type", "category");

-- CreateIndex
CREATE INDEX "board_posts_created_at_idx" ON "board_posts"("created_at");

-- CreateIndex
CREATE INDEX "board_comments_post_id_idx" ON "board_comments"("post_id");

-- CreateIndex
CREATE INDEX "common_codes_group_idx" ON "common_codes"("group");

-- CreateIndex
CREATE UNIQUE INDEX "common_codes_group_code_key" ON "common_codes"("group", "code");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "performances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_performances" ADD CONSTRAINT "my_performances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_performances" ADD CONSTRAINT "my_performances_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "performances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_comments" ADD CONSTRAINT "board_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "board_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_comments" ADD CONSTRAINT "board_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
