<?php

class UOJSlidesEditor {
	public $name;
	public $blog_url;
	public $save;
	public $cur_data = [];
	public $post_data = [];
	public $show_editor = true;
	public $show_tags = true;

	public $label_text = [
		'title' => '标题',
		'tags' => '标签（多个标签用逗号隔开）',
		'content' => '内容',
		'view blog' => '查看博客',
		'blog visibility' => '博客可见性',
		'private' => '未公开',
		'public' => '公开'
	];

	public $validator = array();

	function __construct() {
		global $REQUIRE_LIB;
		// 通过设置 $REQUIRE_LIB 加载 js 文件
		$REQUIRE_LIB['slides-editor'] = '';

		$this->validator = [
			'title' => function (&$title) {
				if ($title == '') {
					return '标题不能为空';
				}
				if (strlen($title) > 100) {
					return '标题不能超过 100 个字节';
				}
				if (HTML::escape($title) === '') {
					return '无效编码';
				}
				return '';
			},
			'content_md' => function (&$content_md) {
				if (strlen($content_md) > 1000000) {
					return '内容过长';
				}
				return '';
			},
			'tags' => function (&$tags) {
				$tags = str_replace('，', ',', $tags);
				$tags_raw = explode(',', $tags);
				if (count($tags_raw) > 10) {
					return '标签个数不能超过10';
				}
				$tags = array();
				foreach ($tags_raw as $tag) {
					$tag = trim($tag);
					if (strlen($tag) == 0) {
						continue;
					}
					if (strlen($tag) > 30) {
						return '标签 “' . HTML::escape($tag) . '” 太长';
					}
					if (in_array($tag, $tags, true)) {
						return '标签 “' . HTML::escape($tag) . '” 重复出现';
					}
					$tags[] = $tag;
				}
				return '';
			}
		];
	}

	public function validate($name) {
		if (!isset($_POST["{$this->name}_{$name}"])) {
			return '不能为空';
		}
		$this->post_data[$name] = $_POST["{$this->name}_{$name}"];
		$val = $this->validator[$name];
		return $val($this->post_data[$name]);
	}

	private function receivePostData() {
		$errors = array();

		$keys = array('title');
		if ($this->show_tags) {
			$keys[] = 'tags';
		}
		if ($this->show_editor) {
			$keys[] = 'content_md';
		}
		foreach ($keys as $name) {
			$cur_err = $this->validate($name);
			if ($cur_err) {
				$errors[$name] = $cur_err;
			}
		}
		if ($errors) {
			die(json_encode($errors));
		}
		crsf_defend();

		$this->post_data['is_hidden'] = isset($_POST["{$this->name}_is_hidden"]) ? 1 : 0;

		$this->post_data['title'] = HTML::escape($this->post_data['title']);

		//只需要存 'content_md' 需要存 'content'（即html）。
		$this->post_data['content'] = '';
	}

	public function handleSave() {
		$save = $this->save;
		$this->receivePostData();
		$ret = $save($this->post_data);
		if (!$ret) {
			$ret = array();
		}

		die(json_encode($ret));
	}

	public function runAtServer() {
		if (isset($_POST["save-{$this->name}"])) {
			$this->handleSave();
		}
	}

	public function printHTML() {
		global $REQUIRE_LIB;
		uojIncludeView('slides-editor', ['editor' => $this, 'REQUIRE_LIB' => $REQUIRE_LIB]);
	}
}
