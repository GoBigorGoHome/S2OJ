<!-- /blog/userName/slide/id 被路由到了这里 -->
<?php
requirePHPLib('form');

Auth::check() || redirectToLogin();
UOJBlog::init(UOJRequest::get('id')) || UOJResponse::page404();
UOJBlog::cur()->belongsToUserBlog() || UOJResponse::page404();
UOJBlog::cur()->userCanView(Auth::user()) || UOJResponse::page403();
UOJBlog::cur()->isTypeS() || UOJResponse::page404();
UOJUserBlog::userIsOwner(Auth::user()) || UOJUser::checkPermission(Auth::user(), 'blogs.view') || UOJResponse::page403();

$page_config = UOJContext::pageConfig();
$page_config += [
	'PageTitle' => HTML::stripTags(UOJBlog::info('title')) . ' - 幻灯片',
	'content_md' => UOJBlog::cur()->queryContent()['content_md']
];
uojIncludeView('slide', $page_config);
