<?php

function uojHandleAtSign($str, $uri) {
	$referrers = array();
	$res = preg_replace_callback('/@(@|[a-zA-Z0-9_]{1,20})/', function ($matches) use (&$referrers) {
		if ($matches[1] === '@') {
			return '@';
		} else {
			$user = UOJUser::query($matches[1]);
			if ($user == null) {
				return $matches[0];
			} else {
				$referrers[$user['username']] = '';
				return '<span class="uoj-username">@' . $user['username'] . '</span>';
			}
		}
	}, $str);

	$referrers_list = array();
	foreach ($referrers as $referrer => $val) {
		$referrers_list[] = $referrer;
	}

	return array($res, $referrers_list);
}

function uojStringPreview($str, $output_limit, $type = 'text') {
	switch ($type) {
		case 'text':
			return strOmit($str, $output_limit);
		case 'binary':
			return strOmit(chunk_split(chunk_split(bin2hex($str), 8, ' '), (8 + 1) * 8, "\n"), $output_limit * 2);
		default:
			return false;
	}
}

function uojFilePreview($file_name, $output_limit, $file_type = 'text') {
	return uojStringPreview(file_get_contents($file_name, false, null, 0, $output_limit + 4), $output_limit, $file_type);
}

function uojIncludeView($name, $view_params = array()) {
	extract($view_params);
	include $_SERVER['DOCUMENT_ROOT'] . '/app/views/' . $name . '.php';
}

function redirectTo(string $url) {
	header('Location: ' . $url);
	die();
}
function permanentlyRedirectTo(string $url) {
	header("HTTP/1.1 301 Moved Permanently");
	header('Location: ' . $url);
	die();
}
function permanentlyRedirectToHTTPS() {
	if (UOJContext::isUsingHttps()) {
		return false;
	}
	permanentlyRedirectTo('https://' . UOJContext::httpHost() . UOJContext::requestURI());
	die();
}
function permanentlyRedirectToHTTP() {
	if (!UOJContext::isUsingHttps()) {
		return false;
	}
	permanentlyRedirectTo('http://' . UOJContext::httpHost() . UOJContext::requestURI());
	die();
}
function redirectToLogin() {
	if (UOJContext::isAjax()) {
		die('please <a href="' . HTML::url('/login', ['params' => ['to' => UOJContext::requestPath()]]) . '">login</a>');
	} else {
		header('Location: ' . HTML::url('/login', ['params' => ['to' => UOJContext::requestPath()]]));
		die();
	}
}
function becomeMsgPage($msg, $title = '消息') {
	global $REQUIRE_LIB;

	if (UOJContext::isAjax()) {
		die($msg);
	} else {
		echoUOJPageHeader($title);
		echo $msg;
		echoUOJPageFooter();
		die();
	}
}
function become404Page($message = '未找到页面。') {
	header($_SERVER['SERVER_PROTOCOL'] . " 404 Not Found", true, 404);
	becomeMsgPage('<div class="text-center"><div style="font-size:150px">404</div><p>' . $message . '</p></div>', '404');
}
function become403Page($message = '访问被拒绝，您可能需要适当的权限以访问此页面。') {
	header($_SERVER['SERVER_PROTOCOL'] . " 403 Forbidden", true, 403);
	becomeMsgPage('<div class="text-center"><div style="font-size:150px">403</div><p>' . $message . '</p></div>', '403');
}

function getLongTablePageRawUri($page) {
	$path = strtok(UOJContext::requestURI(), '?');
	$query_string = strtok('?');
	parse_str($query_string, $param);

	$param['page'] = $page;
	if ($page == 1) {
		unset($param['page']);
	}

	return HTML::url($path, ['params' => $param]);
}

function getLongTablePageUri($page) {
	return HTML::escape(getLongTablePageRawUri($page));
}

function echoLongTable($col_names, $table_name, $cond, $tail, $header_row, $print_row, $config) {
	$pag_config = $config;
	$pag_config['col_names'] = $col_names;
	$pag_config['table_name'] = $table_name;
	$pag_config['cond'] = $cond;
	$pag_config['tail'] = $tail;
	$pag = new Paginator($pag_config);

	$div_classes = isset($config['div_classes']) ? $config['div_classes'] : ['table-responsive'];
	$table_classes = isset($config['table_classes']) ? $config['table_classes'] : ['table', 'text-center', 'align-middle'];

	if (isset($config['head_pagination']) && $config['head_pagination']) {
		echo $pag->pagination();
	}

	echo '<div class="', implode(' ', $div_classes), '">';

	if (isset($config['print_before_table'])) {
		$fun = $config['print_before_table'];
		$fun();
	}

	echo '<table class="', implode(' ', $table_classes), '">';
	echo '<thead>';
	echo $header_row;
	echo '</thead>';
	echo '<tbody>';

	foreach ($pag->get() as $idx => $row) {
		if (isset($config['get_row_index'])) {
			$print_row($row, $idx);
		} else {
			$print_row($row);
		}
	}
	if ($pag->isEmpty()) {
		echo HTML::tr_none();
	}

	echo '</tbody>';
	echo '</table>';

	if (isset($config['print_after_table'])) {
		$fun = $config['print_after_table'];
		$fun();
	}

	echo '</div>';

	echo $pag->pagination();
}

function getSubmissionStatusDetails($submission) {
	$html = '<td class="text-center" colspan="233" style="vertical-align: middle">';

	$out_status = explode(', ', $submission['status'])[0];

	$fly = '<img src="/images/utility/qpx_n/b37.gif" alt="小熊像超人一样飞" class="img-rounded" />';
	$think = '<img src="/images/utility/qpx_n/b29.gif" alt="小熊像在思考" class="img-rounded" />';

	if ($out_status == 'Judged') {
		$status_text = '<strong>Judged!</strong>';
		$status_img = $fly;
	} else {
		if ($submission['status_details'] !== '') {
			$status_img = $fly;
			$status_text = HTML::escape($submission['status_details']);
		} else {
			$status_img = $think;
			$status_text = $out_status;
		}
	}
	$html .= '<div class="uoj-status-details-img-div">' . $status_img . '</div>';
	$html .= '<div class="uoj-status-details-text-div">' . $status_text . '</div>';

	$html .= '</td>';
	return $html;
}

function getSubmissionStatusDetailsHTML($status, $status_details) {
	$html = '<td class="text-center" colspan="233" style="vertical-align: middle">';

	$fly = '<img src="/images/utility/qpx_n/b37.gif" alt="小熊像超人一样飞" class="img-rounded" />';
	$think = '<img src="/images/utility/qpx_n/b29.gif" alt="小熊像在思考" class="img-rounded" />';

	if ($status == 'Judged') {
		$status_text = '<strong>Judged!</strong>';
		$status_img = $fly;
	} else {
		if ($status_details !== '') {
			$status_img = $fly;
			$status_text = HTML::escape($status_details);
		} else {
			$status_img = $think;
			$status_text = $status;
		}
	}
	$html .= '<div class="uoj-status-details-img-div">' . $status_img . '</div>';
	$html .= '<div class="uoj-status-details-text-div">' . $status_text . '</div>';

	$html .= '</td>';
	return $html;
}


function echoSubmission($submission, $config, $viewer) {
	$usubm = new UOJSubmission($submission);
	$usubm->setProblem();
	$usubm->echoStatusTableRow($config, $viewer);
}

function echoSubmissionsList($cond, $tail, $config, $user) {
	$header_row = '<tr>';
	$col_names = [
		'submissions.status_details',
		'submissions.status',
		'submissions.result_error',
		'submissions.score',
		'submissions.hide_score_to_others',
		'submissions.hidden_score',
	];

	if (!isset($config['problem'])) {
		$config['problem'] = null;
	}
	if (!isset($config['id_hidden'])) {
		$header_row .= '<th>ID</th>';
		$col_names[] = 'submissions.id';
	}
	if (!isset($config['problem_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::problem') . '</th>';
		$col_names[] = 'submissions.problem_id';
		$col_names[] = 'submissions.contest_id';
	}
	if (!isset($config['submitter_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::submitter') . '</th>';
		$col_names[] = 'submissions.submitter';
	}
	if (!isset($config['result_hidden'])) {
		$header_row .= '<th style="min-width:3em">' . UOJLocale::get('problems::result') . '</th>';
	}
	if (!isset($config['used_time_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::used time') . '</th>';
		$col_names[] = 'submissions.used_time';
	}
	if (!isset($config['used_memory_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::used memory') . '</th>';
		$col_names[] = 'submissions.used_memory';
	}
	$header_row .= '<th style="min-width:5em">' . UOJLocale::get('problems::language') . '</th>';
	$col_names[] = 'submissions.language';
	$header_row .= '<th style="min-width:5em">' . UOJLocale::get('problems::file size') . '</th>';
	$col_names[] = 'submissions.tot_size';

	if (!isset($config['submit_time_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::submit time') . '</th>';
		$col_names[] = 'submissions.submit_time';
	}
	if (!isset($config['judge_time_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::judge time') . '</th>';
		$col_names[] = 'submissions.judge_time';
	}
	$header_row .= '</tr>';

	$table_name = isset($config['table_name']) ? $config['table_name'] : 'submissions';

	$cond = $cond === '1' ? [] : [DB::conds($cond)];
	$cond[] = UOJSubmission::sqlForUserCanView($user, $config['problem']);
	if ($config['problem']) {
		$cond[] = ['submissions.problem_id', '=', $config['problem']->info['id']];
	}
	if (count($cond) == 1) {
		$cond = $cond[0];
	} else {
		$cond = DB::land($cond);
	}

	$table_config = isset($config['table_config']) ? $config['table_config'] : null;

	echoLongTable(
		$col_names,
		$table_name,
		$cond,
		$tail,
		$header_row,
		function ($submission) use ($config, $user) {
			echoSubmission($submission, $config, $user);
		},
		$table_config
	);
}

function echoSubmissionContent($submission, $requirement) {
	$zip_file = new ZipArchive();
	$submission_content = json_decode($submission['content'], true);
	$zip_file->open(UOJContext::storagePath() . $submission_content['file_name']);

	$config = array();
	foreach ($submission_content['config'] as $config_key => $config_val) {
		$config[$config_val[0]] = $config_val[1];
	}

	foreach ($requirement as $req) {
		if ($req['type'] == "source code") {
			$file_content = $zip_file->getFromName("{$req['name']}.code");
			$file_content = uojTextEncode($file_content, array('allow_CR' => true, 'html_escape' => true));
			$file_language = htmlspecialchars($config["{$req['name']}_language"]);
			$footer_text = UOJLocale::get('problems::source code') . ', ' . UOJLocale::get('problems::language') . ': ' . $file_language;
			switch ($file_language) {
				case 'C++':
				case 'C++11':
				case 'C++17':
				case 'C++20':
				case 'C++98':
				case 'C++03':
					$sh_class = 'sh_cpp language-cpp';
					break;
				case 'Python2':
				case 'Python2.7':
				case 'Python3':
					$sh_class = 'sh_python language-python';
					break;
				case 'Java8':
				case 'Java11':
				case 'Java17':
					$sh_class = 'sh_java language-java';
					break;
				case 'C':
					$sh_class = 'sh_c language-c';
					break;
				case 'Pascal':
					$sh_class = 'sh_pascal language-pascal';
					break;
				default:
					$sh_class = '';
					break;
			}
			echo '<div class="card border-info mb-3">';
			echo '<div class="card-header bg-info">';
			echo '<h4 class="card-title">' . $req['name'] . '</h4>';
			echo '</div>';
			echo '<div class="card-body">';
			echo '<pre><code class="' . $sh_class . ' bg-body-tertiary rounded p-3">' . $file_content . "\n" . '</code></pre>';
			echo '</div>';
			echo '<div class="card-footer">' . $footer_text . '</div>';
			echo '</div>';
		} else if ($req['type'] == "text") {
			$file_content = $zip_file->getFromName("{$req['file_name']}", 504);
			$file_content = strOmit($file_content, 500);
			$file_content = uojTextEncode($file_content, array('allow_CR' => true, 'html_escape' => true));
			$footer_text = UOJLocale::get('problems::text file');
			echo '<div class="card border-info mb-3">';
			echo '<div class="card-header bg-info">';
			echo '<h4 class="card-title">' . $req['file_name'] . '</h4>';
			echo '</div>';
			echo '<div class="card-body">';
			echo '<pre class="bg-body-tertiary rounded p-3 ">', "\n" . $file_content . "\n" . '</pre>';
			echo '</div>';
			echo '<div class="card-footer">' . $footer_text . '</div>';
			echo '</div>';
		}
	}

	$zip_file->close();
}


class JudgmentDetailsPrinter {
	private $name;
	private $styler;
	private DOMDocument $dom;

	private $subtask_num;

	private function _get_attr(DOMElement $node, string $attr, $default = '') {
		$val = $node->getAttribute($attr);
		if ($val === '') {
			$val = $default;
		}
		return $val;
	}

	private function _print_c(DOMElement $node) {
		foreach ($node->childNodes as $child) {
			if ($child->nodeName == '#text') {
				echo htmlspecialchars($child->nodeValue);
			} else {
				$this->_print($child);
			}
		}
	}
	private function _print(DOMElement $node) {
		if ($node->nodeName == 'error') {
			echo '<pre class="bg-body-tertiary rounded p-3">', "\n";
			$this->_print_c($node);
			echo "\n</pre>";
		} elseif ($node->nodeName == 'remote-result-container') {
			echo '<div class="border-bottom p-3">';
			$this->_print_c($node);
			echo '</div>';
		} elseif ($node->nodeName == 'remote-result-table') {
			echo '<table class="table w-auto mb-0 caption-top">';
			echo '<caption class="fw-bold text-body mb-1 pt-0">远端信息</caption>';
			echo '<tbody class="border-top">';
			$this->_print_c($node);
			echo '</tbody>';
			echo '</table>';
		} elseif ($node->nodeName == 'remote-result-tr') {
			$name = $node->getAttribute("name");
			echo '<tr>';
			echo '<td class="fw-bold">', $name, '</td>';
			echo '<td>';
			$this->_print_c($node);
			echo '</td>';
			echo '</tr>';
		} elseif ($node->nodeName == 'remote-source-code') {
			$language = $node->getAttribute("language");
			echo '<div class="border-bottom p-3 copy-button-container">';
			echo '<div class="fw-bold mb-2">源代码</div>';
			echo '<pre class="mb-0"><code class="language-', $language, ' bg-body-tertiary rounded p-3">';
			$this->_print_c($node);
			echo "</code></pre>";
			echo '</div>';
		} elseif ($node->nodeName == 'tests') {
			if ($node->hasAttribute("errcode")) {
				echo "<pre>", "Judgment Failed. Error Code: ", $node->getAttribute("errcode"), ".</pre>";
			}
			if ($this->styler->accordion_flush) {
				echo '<div id="', $this->name, '_details_accordion" class="accordion accordion-flush">';
			} else {
				echo '<div id="', $this->name, '_details_accordion" class="accordion">';
			}
			$this->_print_c($node);
			if ($this->styler->show_small_tip) {
				echo '<div class="my-2 px-2 text-end text-muted">', '小提示：点击横条可展开更详细的信息', '</div>';
			}
			echo '</div>';
		} elseif ($node->nodeName == 'subtask') {
			$subtask_info = $node->getAttribute('info');
			$subtask_title = $node->getAttribute('title');
			$subtask_num = $node->getAttribute('num');
			$subtask_score = $node->getAttribute('score');
			$subtask_time = $this->_get_attr($node, 'time', -1);
			$subtask_memory = $this->_get_attr($node, 'memory', -1);

			$subtask_type = $this->_get_attr($node, 'type', 'packed');
			$subtask_used_time_type = $this->_get_attr($node, 'used-time-type', 'sum');

			echo '<div class="accordion accordion-flush border-bottom">';
			echo '<div class="accordion-item ', $this->styler->getTestInfoClass($subtask_info), '">';

			$accordion_parent = "{$this->name}_details_accordion";
			$accordion_collapse =  "{$accordion_parent}_collapse_subtask_{$subtask_num}";
			$accordion_collapse_accordion =  "{$accordion_collapse}_accordion";

			echo  	'<div class="accordion-header">';
			echo  	'<button type="button" class="accordion-button py-2 px-3 collapsed uoj-submission-result-item" data-bs-toggle="collapse" data-bs-parent="#', $accordion_parent, '" data-bs-target="#', $accordion_collapse, '">';

			echo 		'<div class="row w-100">';
			echo 			'<div class="col-sm-3">';
			if ($subtask_title !== '') {
				echo 		    '<h3 class="fs-5 mb-0">', $subtask_title, ': ', '</h3>';
			} else {
				echo 			'<h3 class="fs-5 mb-0">', 'Subtask #', $subtask_num, ': ', '</h3>';
			}
			echo 			'</div>';

			if ($this->styler->show_score && $subtask_score !== '') {
				echo 		'<div class="col-sm-2">';
				echo        '<i class="bi bi-clipboard-check"></i> ', $subtask_score, ' pts';
				echo 		'</div>';
				echo 		'<div class="col-sm uoj-status-text">';
				echo 		$this->styler->getTestInfoIcon($subtask_info);
				echo 			htmlspecialchars($subtask_info);
				echo 		'</div>';
			} else {
				echo 		'<div class="col-sm-4 uoj-status-text">';
				echo		$this->styler->getTestInfoIcon($subtask_info);
				echo 			htmlspecialchars($subtask_info);
				echo 		'</div>';
			}

			if ($subtask_time >= 0) {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-hourglass-split"></i> ', $subtask_time, ' ms';
				echo '</div>';
			}

			if ($subtask_memory >= 0) {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-memory"></i> ', $subtask_memory, ' KB';
				echo '</div>';
			}

			echo 		'</div>';
			echo 	'</button>';
			echo 	'</div>';

			echo 	'<div id="', $accordion_collapse, '" class="accordion-collapse collapse" data-bs-parent="#', $accordion_parent, '">';
			echo 		'<div class="accordion-body">';

			echo 			'<div id="', $accordion_collapse_accordion, '" class="accordion uoj-subtask-test-item">';
			$this->subtask_num = $subtask_num;
			$this->_print_c($node);
			$this->subtask_num = null;
			echo 			'</div>';

			echo 		'</div>';
			echo 	'</div>';
			echo '</div>';
			echo '</div>';
		} elseif ($node->nodeName == 'test') {
			$test_info = $node->getAttribute('info');
			$test_num = $node->getAttribute('num');
			$test_score = $node->getAttribute('score');
			$test_time = $this->_get_attr($node, 'time', -1);
			$test_memory = $this->_get_attr($node, 'memory', -1);

			echo '<div class="accordion-item ', $this->styler->getTestInfoClass($test_info), '">';

			$accordion_parent = "{$this->name}_details_accordion";
			if ($this->subtask_num != null) {
				$accordion_parent .= "_collapse_subtask_{$this->subtask_num}_accordion";
			}
			$accordion_collapse = "{$accordion_parent}_collapse_test_{$test_num}";
			if ($this->subtask_num != null) {
				$accordion_collapse .= "_in_subtask_{$this->subtask_num}";
			}
			if (!$this->styler->shouldFadeDetails($test_info)) {
				echo '<div class="accordion-header">';
				echo '<button class="accordion-button py-2 px-3 collapsed uoj-submission-result-item" data-bs-toggle="collapse" data-bs-parent="#', $accordion_parent, '" data-bs-target="#', $accordion_collapse, '">';
			} else {
				echo '<div class="accordion-header">';
				echo '<button type="button" class="accordion-button py-2 px-3 collapsed uoj-submission-result-item">';
			}
			echo '<div class="row w-100">';
			echo '<div class="col-sm-3">';
			if ($test_num > 0) {
				echo '<h4 class="fs-5 mb-0">', 'Test #', $test_num, '</h4>';
			} else {
				echo '<h4 class="fs-5 mb-0">', 'Extra Test', '</h4>';
			}
			echo '</div>';

			if ($this->styler->show_score && $test_score !== '') {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-clipboard-check"></i> ', $test_score, ' pts';
				echo '</div>';
				echo '<div class="col-sm uoj-status-text">';
				echo $this->styler->getTestInfoIcon($test_info);
				echo htmlspecialchars($test_info);
				echo '</div>';
			} else {
				echo '<div class="col-sm uoj-status-text">';
				echo $this->styler->getTestInfoIcon($test_info);
				echo htmlspecialchars($test_info);
				echo '</div>';
			}

			if ($test_time >= 0) {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-hourglass-split"></i> ', $test_time, ' ms';
				echo '</div>';
			}

			if ($test_memory >= 0) {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-memory"></i> ', $test_memory, ' KB';
				echo '</div>';
			}

			echo '</div>';
			echo '</button>';
			echo '</div>';

			if (!$this->styler->shouldFadeDetails($test_info)) {
				$accordion_collapse_class = 'accordion-collapse collapse';
				if ($this->styler->collapse_in) {
					$accordion_collapse_class .= ' in';
				}
				echo '<div id="', $accordion_collapse, '" class="uoj-testcase ', $accordion_collapse_class, '" data-test="', $test_num, '" data-bs-parent="#', $accordion_parent, '">';
				echo '<div class="accordion-body">';

				$this->_print_c($node);

				echo '</div>';
				echo '</div>';
			}

			echo '</div>';
		} elseif ($node->nodeName == 'custom-test') {
			$test_info = $node->getAttribute('info');
			$test_time = $this->_get_attr($node, 'time', -1);
			$test_memory = $this->_get_attr($node, 'memory', -1);

			echo '<div class="accordion-item ', $this->styler->getTestInfoClass($test_info), ' mb-3">';

			$accordion_parent = "{$this->name}_details_accordion";
			$accordion_collapse = "{$accordion_parent}_collapse_custom_test";
			if (!$this->styler->shouldFadeDetails($test_info)) {
				echo '<div class="accordion-header">';
				echo '<button type="button" class="accordion-button py-2 px-3 collapsed uoj-submission-result-item" data-bs-toggle="collapse" data-bs-parent="#', $accordion_parent, '" data-bs-target="#', $accordion_collapse, '">';
			} else {
				echo '<div class="accordion-header">';
				echo '<button class="accordion-button py-2 px-3 collapsed uoj-submission-result-item">';
			}
			echo '<div class="row w-100">';
			echo '<div class="col-sm-3">';
			echo '<h4 class="fs-5 mb-0">', 'Custom Test', '</h4>';
			echo '</div>';

			echo '<div class="col-sm uoj-status-text">';
			echo $this->styler->getTestInfoIcon($test_info);
			echo htmlspecialchars($test_info);
			echo '</div>';

			if ($test_time >= 0) {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-hourglass-split"></i> ', $test_time, ' ms';
				echo '</div>';
			}

			if ($test_memory >= 0) {
				echo '<div class="col-sm-2">';
				echo '<i class="bi bi-memory"></i> ', $test_memory, ' KB';
				echo '</div>';
			}

			echo '</div>';
			echo '</button>';
			echo '</div>';

			if (!$this->styler->shouldFadeDetails($test_info)) {
				$accordion_collapse_class = 'accordion-collapse collapse';
				if ($this->styler->collapse_in) {
					$accordion_collapse_class .= ' in';
				}
				echo '<div id="', $accordion_collapse, '" class="', $accordion_collapse_class, '" data-bs-parent="#', $accordion_parent, '">';
				echo '<div class="accordion-body">';

				$this->_print_c($node);

				echo '</div>';
				echo '</div>';

				echo '</div>';
			}
		} elseif ($node->nodeName == 'in') {
			echo '<h4 class="fs-6 fw-bold">输入文件</h4>';
			echo '<pre class="bg-body-tertiary p-3 rounded">', "\n";
			$this->_print_c($node);
			echo "\n</pre>";
		} elseif ($node->nodeName == 'out') {
			echo '<h4 class="fs-6 fw-bold">程序输出</h4>';
			echo '<pre class="bg-body-tertiary p-3 rounded">', "\n";
			$this->_print_c($node);
			echo "\n</pre>";
		} elseif ($node->nodeName == 'ans') {
			echo '<h4 class="fs-6 fw-bold">答案文件</h4>';
			echo '<pre class="bg-body-tertiary p-3 rounded">', "\n";
			$this->_print_c($node);
			echo "\n</pre>";
		} elseif ($node->nodeName == 'res') {
			echo '<h4 class="fs-6 fw-bold"><span>检查器信息</span></h4>';
			echo '<pre class="bg-body-tertiary p-3 rounded">', "\n";
			if ($node->hasChildNodes()) {
				$this->_print_c($node);
			} else {
				echo "\n";
			}
			echo "</pre>";
		} elseif ($node->nodeName == "info-block") {
			echo '<div>';
			if ($node->hasAttribute("title")) {
				if ($node->hasAttribute("size")) {
					echo '<div class="float-end text-muted">';
					if ($node->getAttribute("size") <= 1) {
						echo '(', $node->getAttribute("size"), ' byte)';
					} else {
						echo '(', $node->getAttribute("size"), ' bytes)';
					}
					echo '</div>';
				}
				echo '<h4 class="mb-2">', $node->getAttribute("title"), ":</h4>";
			}
			echo '<pre class="bg-body-tertiary p-3 rounded">', "\n";
			$this->_print_c($node);
			echo "\n</pre>";
			echo '</div>';
		} else {
			echo '<', $node->nodeName;
			foreach ($node->attributes as $attr) {
				echo ' ', $attr->name, '="', htmlspecialchars($attr->value), '"';
			}
			echo '>';
			$this->_print_c($node);
			echo '</', $node->nodeName, '>';
		}
	}

	public function __construct($details, $styler, $name) {
		$this->name = $name;
		$this->styler = $styler;
		$this->dom = new DOMDocument();
		if (!$this->dom->loadXML($details)) {
			throw new Exception("XML syntax error");
		}
	}
	public function printHTML() {
		$this->subtask_num = null;
		$this->_print($this->dom->documentElement);
	}
}

function echoJudgementDetails($raw_details, $styler, $name) {
	try {
		$printer = new JudgmentDetailsPrinter($raw_details, $styler, $name);
		$printer->printHTML();
	} catch (Exception $e) {
		echo 'Failed to show details';
	}
}

class SubmissionDetailsStyler {
	public $show_score = true;
	public $show_small_tip = true;
	public $accordion_flush = true;
	public $collapse_in = false;
	public $fade_all_details = false;
	public function getTestInfoClass($info) {
		if ($info == 'Accepted' || $info == 'Extra Test Passed') {
			return 'uoj-status-accepted';
		} elseif ($info == 'Time Limit Exceeded') {
			return 'uoj-status-tle';
		} elseif ($info == 'Acceptable Answer') {
			return 'uoj-status-acceptable-answer';
		} else {
			return 'uoj-status-wrong';
		}
	}
	public function getTestInfoIcon($test_info) {
		if ($test_info == 'Accepted' || $test_info == 'Extra Test Passed') {
			return '<i class="bi bi-check-lg"></i> ';
		} elseif ($test_info == 'Time Limit Exceeded') {
			return '<i class="bi bi-clock"></i> ';
		} elseif ($test_info == 'Acceptable Answer') {
			return '<i class="bi bi-dash-square"></i> ';
		} elseif ($test_info == 'Wrong Answer') {
			return '<i class="bi bi-x-lg"></i> ';
		} else {
			return '<i class="bi bi-slash-circle"></i> ';
		}
	}
	public function shouldFadeDetails($info) {
		return $this->fade_all_details || $info == 'Extra Test Passed' || $info == 'Skipped';
	}
}
class CustomTestSubmissionDetailsStyler {
	public $show_score = true;
	public $show_small_tip = false;
	public $accordion_flush = false;
	public $collapse_in = true;
	public $fade_all_details = false;
	public function getTestInfoClass($info) {
		if ($info == 'Success') {
			return 'uoj-status-accepted';
		} elseif ($info == 'Time Limit Exceeded') {
			return 'uoj-status-tle';
		} elseif ($info == 'Acceptable Answer') {
			return 'uoj-status-acceptable-answer';
		} else {
			return 'uoj-status-wrong';
		}
	}
	public function getTestInfoIcon($test_info) {
		if ($test_info == 'Success') {
			return '<i class="bi bi-check-lg"></i> ';
		} elseif ($test_info == 'Time Limit Exceeded') {
			return '<i class="bi bi-clock"></i> ';
		} elseif ($test_info == 'Acceptable Answer') {
			return '<i class="bi bi-dash-square"></i> ';
		} elseif ($test_info == 'Wrong Answer') {
			return '<i class="bi bi-x-lg"></i> ';
		} else {
			return '<i class="bi bi-slash-circle"></i> ';
		}
	}
	public function shouldFadeDetails($info) {
		return $this->fade_all_details;
	}
}
class HackDetailsStyler {
	public $show_score = false;
	public $show_small_tip = false;
	public $collapse_in = true;
	public $accordion_flush = true;
	public $fade_all_details = false;
	public function getTestInfoClass($info) {
		if ($info == 'Accepted' || $info == 'Extra Test Passed') {
			return 'uoj-status-accepted';
		} elseif ($info == 'Time Limit Exceeded') {
			return 'uoj-status-tle';
		} elseif ($info == 'Acceptable Answer') {
			return 'uoj-status-acceptable-answer';
		} else {
			return 'uoj-status-wrong';
		}
	}
	public function getTestInfoIcon($test_info) {
		if ($test_info == 'Accepted' || $test_info == 'Extra Test Passed') {
			return '<i class="bi bi-check-lg"></i> ';
		} elseif ($test_info == 'Time Limit Exceeded') {
			return '<i class="bi bi-clock"></i> ';
		} elseif ($test_info == 'Acceptable Answer') {
			return '<i class="bi bi-dash-square"></i> ';
		} elseif ($test_info == 'Wrong Answer') {
			return '<i class="bi bi-x-lg"></i> ';
		} else {
			return '<i class="bi bi-slash-circle"></i> ';
		}
	}
	public function shouldFadeDetails($info) {
		return $this->fade_all_details;
	}
}

function echoSubmissionDetails($submission_details, $name) {
	echoJudgementDetails($submission_details, new SubmissionDetailsStyler(), $name);
}
function echoCustomTestSubmissionDetails($submission_details, $name) {
	echoJudgementDetails($submission_details, new CustomTestSubmissionDetailsStyler(), $name);
}
function echoHackDetails($hack_details, $name) {
	echoJudgementDetails($hack_details, new HackDetailsStyler(), $name);
}

function echoHack($hack, $config, $viewer) {
	$uhack = new UOJHack($hack);
	$uhack->setProblem();
	$uhack->setSubmission();
	$uhack->echoStatusTableRow($config, $viewer);
}

function echoHackListOnlyOne($hack, $config, $user) {
	echo '<div class="card mb-3 table-responsive">';
	echo '<table class="table text-center uoj-table mb-0">';
	echo '<thead>';
	echo '<tr>';
	if (!isset($config['id_hidden'])) {
		echo '<th>ID</th>';
	}
	if (!isset($config['submission_id_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::submission id') . '</th>';
	}
	if (!isset($config['problem_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::problem') . '</th>';
	}
	if (!isset($config['hacker_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::hacker') . '</th>';
	}
	if (!isset($config['owner_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::owner') . '</th>';
	}
	if (!isset($config['result_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::result') . '</th>';
	}
	if (!isset($config['submit_time_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::submit time') . '</th>';
	}
	if (!isset($config['judge_time_hidden'])) {
		echo '<th>' . UOJLocale::get('problems::judge time') . '</th>';
	}
	echo '</tr>';
	echo '</thead>';
	echo '<tbody>';
	echoHack($hack, $config, $user);
	echo '</tbody>';
	echo '</table>';
	echo '</div>';
}
function echoHacksList($cond, $tail, $config, $user) {
	$header_row = '<tr>';
	$col_names = [];

	$col_names[] = 'id';
	$col_names[] = 'success';
	$col_names[] = 'status';
	$col_names[] = 'judge_time';

	if (!isset($config['id_hidden'])) {
		$header_row .= '<th>ID</th>';
	}
	if (!isset($config['submission_id_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::submission id') . '</th>';
		$col_names[] = 'submission_id';
	}
	if (!isset($config['problem_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::problem') . '</th>';
		$col_names[] = 'problem_id';
	}
	if (!isset($config['hacker_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::hacker') . '</th>';
		$col_names[] = 'hacker';
	}
	if (!isset($config['owner_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::owner') . '</th>';
		$col_names[] = 'owner';
	}
	if (!isset($config['result_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::result') . '</th>';
	}
	if (!isset($config['submit_time_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::submit time') . '</th>';
		$col_names[] = 'submit_time';
	}
	if (!isset($config['judge_time_hidden'])) {
		$header_row .= '<th>' . UOJLocale::get('problems::judge time') . '</th>';
	}
	$header_row .= '</tr>';

	if (!isSuperUser($user)) {
		if ($user != null) {
			$permission_cond = DB::lor([
				'is_hidden' => false,
				DB::land([
					'is_hidden' => true,
					DB::lor([
						[
							'problem_id', 'in', DB::rawbracket([
								'select problem_id from problems_permissions',
								'where', ['username' => $user['username']]
							])
						],
						[
							'problem_id', 'in', DB::rawbracket([
								'select problem_id from problems',
								'where', ['uploader' => $user['username']]
							])
						]
					])
				])
			]);
		} else {
			$permission_cond = ['is_hidden' => false];
		}
		if ($cond !== '1') {
			$cond = [
				DB::conds($cond),
				DB::conds($permission_cond)
			];
		} else {
			$cond = $permission_cond;
		}
	}

	$table_config = isset($config['table_config']) ? $config['table_config'] : null;

	echoLongTable(
		$col_names,
		'hacks',
		$cond,
		$tail,
		$header_row,
		function ($hacks) use ($config, $user) {
			echoHack($hacks, $config, $user);
		},
		$table_config
	);
}

function echoBlogTag($tag) {
	echo ' <a class="uoj-blog-tag">', '<span class="badge bg-secondary">', HTML::escape($tag), '</span></a> ';
}

function echoUOJPageHeader($page_title, $extra_config = array()) {
	global $REQUIRE_LIB;
	$config = UOJContext::pageConfig();
	$config['REQUIRE_LIB'] = $REQUIRE_LIB;
	$config['PageTitle'] = $page_title;
	$config = array_merge($config, $extra_config);
	uojIncludeView('page-header', $config);
}
function echoUOJPageFooter($config = array()) {
	global $REQUIRE_LIB;
	$config['REQUIRE_LIB'] = $REQUIRE_LIB;

	uojIncludeView('page-footer', $config);
}

// ===== uoj.ac =====

function echoJudgmentDetails($raw_details, $styler, $name) {
	try {
		$printer = new JudgmentDetailsPrinter($raw_details, $styler, $name);
		$printer->printHTML();
	} catch (Exception $e) {
		echo 'Failed to show details';
	}
}
