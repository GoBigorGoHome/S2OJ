ALTER TABLE `user_info` ADD COLUMN `codeforces_handle` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';
ALTER TABLE `user_info` ADD COLUMN `github` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';
ALTER TABLE `user_info` ADD COLUMN `website` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '';
ALTER TABLE `user_info` ADD COLUMN `avatar_source` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gravatar';
