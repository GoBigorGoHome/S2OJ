<?php

class UOJUserBlog {
	public static ?array $user = null;

	public static function init() {
		$username = blog_name_decode($_GET['blog_username']);
		if (!validateUsername($username) || !(self::$user = UOJUser::query($username))) {
			UOJResponse::page404();
		}
		if ($_GET['blog_username'] !== blog_name_encode(self::$user['username'])) {
			permanentlyRedirectTo(HTML::blog_url(self::$user['username'], '/'));
		}
	}

	public static function check() {
		return self::$user !== null;
	}
	public static function id() {
		if (self::$user === null) {
			return null;
		}
		return self::$user['username'];
	}
	public static function user() {
		return self::$user;
	}

	public static function userIsOwner(?array $user) {
		if ($user === null) {
			return false;
		}
		return self::$user['username'] === $user['username'];
	}

	public static function userHasManagePermission(?array $user) {
		if ($user === null) {
			return false;
		}

		return isSuperUser($user) || UOJUser::checkPermission($user, 'blogs.manage');
	}

	public static function userCanManage(?array $user, ?string $whose_blog = null) {
		if ($whose_blog === null) {
			$whose_blog = self::id();
		}
		return $user && (isSuperUser($user) || UOJUser::checkPermission($user, 'blogs.manage') || $user['username'] === $whose_blog);
	}
}
