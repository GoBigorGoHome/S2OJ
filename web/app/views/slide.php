<!DOCTYPE html>
<html lang="zh-cn">

<head>
	<meta charset="utf-8">

	<title><?= isset($PageTitle) ? $PageTitle : UOJConfig::$data['profile']['oj-name-short'] ?> - <?= isset($PageMainTitle) ? $PageMainTitle : UOJConfig::$data['profile']['oj-name'] ?></title>

	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, minimal-ui">


	<!--[if lt IE 9]>
			<script src="<?= HTML::url('/js/html5shiv.js') ?>"></script>
		<![endif]-->
</head>

<body>
	<div id="slides-root"></div>

	<script src="<?= HTML::url('/js/blog-editor/markslides-library.min.js') ?>"></script>

	<script>
		const rootElement = document.getElementById('slides-root');
		MarkSlidesLibrary.slide_show(rootElement, `<?= $content_md ?>`);
	</script>
</body>

</html>