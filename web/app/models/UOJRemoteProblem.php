<?php

class UOJRemoteProblem {
	const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36 S2OJ/3.1.0';

	static $providers = [
		'codeforces' => [
			'name' => 'Codeforces',
			'short_name' => 'CF',
			'url' => 'https://codeforces.com',
			'not_exists_texts' => [
				'<th>Actions</th>',
				'Statement is not available on English language',
				'ограничение по времени на тест',
			],
			'languages' => ['C', 'C++17', 'C++20', 'Java17', 'Pascal', 'Python2', 'Python3'],
			'submit_type' => ['bot', 'my'],
		],
		'atcoder' => [
			'name' => 'AtCoder',
			'short_name' => 'AT',
			'url' => 'https://atcoder.jp',
			'not_exists_texts' => [
				'Task not found',
				'指定されたタスクが見つかりません',
			],
			'languages' => ['C', 'C++17', 'C++20', 'Python3'],
			'submit_type' => ['bot'],
		],
		'uoj' => [
			'name' => 'UniversalOJ',
			'short_name' => 'UOJ',
			'url' => 'https://uoj.ac',
			'not_exist_texts' => [
				'未找到该页面',
			],
			'languages' => ['C', 'C++03', 'C++11', 'C++', 'C++17', 'C++20', 'Python3', 'Python2.7', 'Java8', 'Java11', 'Java17', 'Pascal'],
			'submit_type' => ['bot', 'my'],
		],
		'loj' => [
			'name' => 'LibreOJ',
			'short_name' => 'LOJ',
			'url' => 'https://loj.ac',
			'languages' => ['C', 'C++03', 'C++11', 'C++', 'C++17', 'C++20', 'Python3', 'Python2.7', 'Java17', 'Pascal'],
			'submit_type' => ['bot', 'archive'],
		],
		'luogu' => [
			'name' => '洛谷',
			'short_name' => '洛谷',
			'url' => 'https://www.luogu.com.cn',
			'languages' => ['C', 'C++98', 'C++11', 'C++', 'C++17', 'C++20', 'Python3', 'Java8', 'Pascal'],
			'submit_type' => ['bot', 'my', 'archive'],
		],
		'qoj' => [
			'name' => 'Qingyu Online Judge',
			'short_name' => 'QOJ',
			'url' => 'https://qoj.ac',
			'not_exist_texts' => [
				'未找到该页面',
			],
			'languages' => ['C', 'C++98', 'C++11', 'C++', 'C++17', 'C++20', 'Python3', 'Python2.7', 'Java8', 'Java11', 'Pascal'],
			'submit_type' => ['bot'],
		],
	];

	private static function curl_get($url) {
		$curl = new Curl\Curl();
		$curl->setUserAgent(static::USER_AGENT);

		$res = retry_loop(function () use (&$curl, $url) {
			$curl->get($url);

			if ($curl->error) {
				return false;
			}

			return [
				'content-type' => $curl->responseHeaders['Content-Type'],
				'response' => $curl->response,
			];
		});

		return $res;
	}

	private static function getCodeforcesProblemUrl($id) {
		if (str_starts_with($id, 'GYM')) {
			return static::$providers['codeforces']['url'] . '/gym/' . preg_replace_callback('/GYM([1-9][0-9]{0,5})([A-Z][1-9]?)/', fn ($matches) => $matches[1] . '/problem/' . $matches[2], $id);
		}

		return static::$providers['codeforces']['url'] . '/problemset/problem/' . preg_replace_callback('/([1-9][0-9]{0,5})([A-Z][1-9]?)/', fn ($matches) => $matches[1] . '/' . $matches[2], $id);
	}

	private static function getAtcoderProblemUrl($id) {
		return static::$providers['atcoder']['url'] . '/contests/' . preg_replace_callback('/(\w+)_([a-z1-9][1-9]?)/', function ($matches) {
			$contest = str_replace('_', '-', $matches[1]);

			return "{$contest}/tasks/{$matches[1]}_{$matches[2]}";
		}, $id);
	}

	private static function getUojProblemUrl($id) {
		return static::$providers['uoj']['url'] . '/problem/' . $id;
	}

	private static function getLojProblemUrl($id) {
		return static::$providers['loj']['url'] . '/p/' . $id;
	}

	private static function getLuoguProblemUrl($id) {
		return static::$providers['luogu']['url'] . '/problem/' . $id;
	}

	private static function getQojProblemUrl($id) {
		return static::$providers['qoj']['url'] . '/problem/' . $id;
	}

	private static function getCodeforcesProblemBasicInfoFromHtml($id, $html) {
		$remote_provider = static::$providers['codeforces'];

		$html = preg_replace('/\$\$\$/', '$', $html);
		$dom = new \IvoPetkov\HTML5DOMDocument();
		$dom->loadHTML($html);

		$judgestatement = $dom->querySelector('html')->innerHTML;

		foreach ($remote_provider['not_exists_texts'] as $text) {
			if (str_contains($judgestatement, $text)) {
				return null;
			}
		}

		$statement_dom = $dom->querySelector('.problem-statement');
		$title_prefix = str_starts_with($id, 'GYM') ? 'Gym' : 'CF';
		$title = explode('. ', trim($statement_dom->querySelector('.title')->innerHTML))[1];
		$title_id = str_starts_with($id, 'GYM') ? substr($id, 3) : $id;
		$title = "【{$title_prefix}{$title_id}】{$title}";
		$time_limit_string = substr($statement_dom->querySelector('.time-limit')->innerHTML, 53);
		$time_limit_matches = [];
		preg_match('/([0-9.]+).*/', $time_limit_string, $time_limit_matches);
		$time_limit = $time_limit_matches[1];
		$memory_limit = intval(substr($statement_dom->querySelector('.memory-limit')->innerHTML, 55));
		$difficulty = -1;

		foreach ($dom->querySelectorAll('.tag-box') as &$elem) {
			$matches = [];

			if (preg_match('/\*([0-9]{3,4})/', trim($elem->innerHTML), $matches)) {
				$difficulty = intval($matches[1]);

				break;
			}
		}

		if ($difficulty != -1) {
			$closest = null;

			foreach (UOJProblem::$difficulty as $val) {
				if ($closest === null || abs($val - $difficulty) < abs($closest - $difficulty)) {
					$closest = $val;
				}
			}

			$difficulty = $closest;
		}

		$statement_dom->removeChild($statement_dom->querySelector('.header'));
		$statement_dom->childNodes->item(0)->insertBefore($dom->createElement('h3', 'Description'), $statement_dom->childNodes->item(0)->childNodes->item(0));

		foreach ($statement_dom->querySelectorAll('.section-title') as &$elem) {
			$elem->outerHTML = '<h3>' . $elem->innerHTML . '</h3>';
		}

		$sample_input_cnt = 0;
		$sample_output_cnt = 0;

		foreach ($statement_dom->querySelectorAll('.input') as &$input_dom) {
			$sample_input_cnt++;
			$input_text = '';

			if ($input_dom->querySelector('.test-example-line')) {
				foreach ($input_dom->querySelectorAll('.test-example-line') as &$line) {
					$input_text .= HTML::stripTags($line->innerHTML) . "\n";
				}
			} else {
				$input_text = $input_dom->querySelector('pre')->innerHTML;
				$input_text = preg_replace('/<br>/', "\n", $input_text);
				$input_text = HTML::stripTags($input_text);
			}

			$input_dom->outerHTML = HTML::tag('h4', [], "Input #{$sample_input_cnt}") . HTML::tag('pre', [], HTML::tag('code', [], trim($input_text)));
		}

		foreach ($statement_dom->querySelectorAll('.output') as &$output_dom) {
			$sample_output_cnt++;
			$output_text = '';

			if ($output_dom->querySelector('.test-example-line')) {
				foreach ($output_dom->querySelectorAll('.test-example-line') as &$line) {
					$output_text .= HTML::stripTags($line->innerHTML) . "\n";
				}
			} else {
				$output_text = $output_dom->querySelector('pre')->innerHTML;
				$output_text = preg_replace('/<br>/', "\n", $output_text);
				$output_text = HTML::stripTags($output_text);
			}

			$output_dom->outerHTML = HTML::tag('h4', [], "Output #{$sample_output_cnt}") . HTML::tag('pre', [], HTML::tag('code', [], trim($output_text)));
		}

		return [
			'type' => 'html',
			'title' => $title,
			'time_limit' => $time_limit,
			'memory_limit' => $memory_limit,
			'difficulty' => $difficulty,
			'statement' => $statement_dom->innerHTML,
		];
	}

	private static function getUojLikeProblemBasicInfoFromHtml($id, $html, $oj = 'uoj') {
		$remote_provider = static::$providers[$oj];

		$dom = new \IvoPetkov\HTML5DOMDocument();
		$dom->loadHTML($html);

		$title_dom = $dom->querySelector('.page-header');
		$title_matches = [];
		preg_match('/^#[1-9][0-9]*\. (.*)$/', trim($title_dom->textContent), $title_matches);
		$title = "【{$remote_provider['short_name']}{$id}】{$title_matches[1]}";

		$statement_dom = $dom->querySelector('.uoj-article');
		$statement = HTML::tag('h3', [], '题目描述');

		foreach ($statement_dom->querySelectorAll('a') as &$elem) {
			$href = $elem->getAttribute('href');
			$href = getAbsoluteUrl($href, $remote_provider['url']);
			$elem->setAttribute('href',  $href);
		}

		$statement .= $statement_dom->innerHTML;

		$res = [
			'type' => 'html',
			'title' => $title,
			'time_limit' => null,
			'memory_limit' => null,
			'difficulty' => -1,
			'statement' => $statement,
		];

		return $res;
	}

	private static function getCodeforcesProblemBasicInfo($id) {
		$res = static::curl_get(static::getCodeforcesProblemUrl($id));

		if (!$res) return null;

		if (str_starts_with($res['content-type'], 'text/html')) {
			return static::getCodeforcesProblemBasicInfoFromHtml($id, $res['response']);
		} else if (str_starts_with($res['content-type'], 'application/pdf')) {
			$title_prefix = str_starts_with($id, 'GYM') ? 'Gym' : 'CF';
			$title_id = str_starts_with($id, 'GYM') ? substr($id, 3) : $id;
			$title = "【{$title_prefix}{$title_id}】{$title_prefix}{$title_id}";

			return [
				'type' => 'pdf',
				'title' => $title,
				'time_limit' => null,
				'memory_limit' => null,
				'difficulty' => -1,
				'pdf_data' => $res['response'],
				'statement' => '',
			];
		} else {
			return null;
		}
	}

	private static function getAtcoderProblemBasicInfo($id) {
		$res = static::curl_get(static::getAtcoderProblemUrl($id));

		if (!$res) return null;

		$dom = new \IvoPetkov\HTML5DOMDocument();
		$dom->loadHTML($res['response'], \IvoPetkov\HTML5DOMDocument::ALLOW_DUPLICATE_IDS);
		$container_dom = $dom->querySelectorAll('#main-container > div.row > div.col-sm-12')->item(1);

		if (!$container_dom) return null;

		$title_dom = $container_dom->querySelector('span.h2');
		$title = '【' . strtoupper($id) . '】' . preg_replace('/([A-Z][1-9]?) - (.*)/', '$2', explode("\n", trim($title_dom->textContent))[0]);

		$limit_dom = $container_dom->querySelector('p');

		$time_limit_matches = [];
		preg_match('/Time Limit: ([0-9.]+)/', $limit_dom->textContent, $time_limit_matches);
		$time_limit = $time_limit_matches[1];

		$memory_limit_matches = [];
		preg_match('/Memory Limit: (\d+)/', $limit_dom->textContent, $memory_limit_matches);
		$memory_limit = intval($memory_limit_matches[1]);

		$statement_container_dom = $container_dom->querySelector('#task-statement');
		$statement_dom = $statement_container_dom->querySelector('.lang-en');

		if (!$statement_dom) {
			$statement_dom = $statement_container_dom->querySelector('.lang-ja');
		}
		if (!$statement_dom) {
			$statement_dom = $statement_container_dom;
		}
		$statement_first_child = $statement_dom->querySelector('p');
		if ($statement_first_child) {
			$first_child_content = trim($statement_first_child->textContent);
			if (str_starts_with($first_child_content, 'Score: ') || str_starts_with($first_child_content, '配点 :')) {
				$statement_dom->removeChild($statement_first_child);
			}
		}

		foreach ($statement_dom->querySelectorAll('var') as &$elem) {
			$html = $elem->innerHTML;

			// <sub> => _{
			$html = str_replace('<sub>', '_{', $html);

			// </sub> => }
			$html = str_replace('</sub>', '}', $html);

			// <sup> => ^{
			$html = str_replace('<sup>', '^{', $html);

			// </sup> => }
			$html = str_replace('</sup>', '}', $html);

			$elem->innerHTML = $html;
		}

		$statement = $statement_dom->innerHTML;

		// <var> => $
		$statement = str_replace('<var>', '$', $statement);

		// </var> => $
		$statement = str_replace('</var>', '$', $statement);

		return [
			'type' => 'html',
			'title' => $title,
			'time_limit' => $time_limit,
			'memory_limit' => $memory_limit,
			'difficulty' => -1,
			'statement' => $statement,
		];
	}

	private static function getUojProblemBasicInfo($id) {
		$res = static::curl_get(static::getUojProblemUrl($id));

		if (!$res) return null;

		return static::getUojLikeProblemBasicInfoFromHtml($id, $res['response'], 'uoj');
	}

	private static function getQojProblemBasicInfo($id) {
		$res = static::curl_get(static::getQojProblemUrl($id));

		if (!$res) return null;

		$remote_provider = static::$providers['qoj'];

		$dom = new \IvoPetkov\HTML5DOMDocument();
		$dom->loadHTML($res['response']);

		$title_dom = $dom->querySelector('.page-header');
		$title_matches = [];
		preg_match('/^#\s*[1-9][0-9]*\.\s*(.*)$/', trim($title_dom->textContent), $title_matches);
		$title = "【{$remote_provider['short_name']}{$id}】{$title_matches[1]}";

		$limit_dom = $dom->querySelector('.uoj-content > .row');
		$limit_matches = [];
		preg_match('/^Time Limit:\s*([0-9.]+) s\s*Memory Limit:\s*([1-9][0-9]*) MB/', trim($limit_dom->textContent), $limit_matches);
		$time_limit = $limit_matches[1];
		$memory_limit = $limit_matches[2];
		$statement_dom = $dom->querySelector('.uoj-article');
		$statement = HTML::tag('h3', [], '题目描述');

		foreach ($statement_dom->querySelectorAll('a') as &$elem) {
			$href = $elem->getAttribute('href');
			$href = getAbsoluteUrl($href, $remote_provider['url']);
			$elem->setAttribute('href',  $href);
		}

		$statement .= $statement_dom->innerHTML;

		$res = [
			'type' => 'html',
			'title' => $title,
			'time_limit' => $time_limit,
			'memory_limit' => $memory_limit,
			'difficulty' => -1,
			'statement' => $statement,
		];

		// QOJ PDF
		$pdf_statement_dom = $dom->getElementById('statements-pdf');

		if ($pdf_statement_dom) {
			$pdf_url = $pdf_statement_dom->getAttribute('src');
			$pdf_res = static::curl_get(getAbsoluteUrl($pdf_url, $remote_provider['url']));

			if (str_starts_with($pdf_res['content-type'], 'application/pdf')) {
				$res['type'] = 'pdf';
				$res['pdf_data'] = $pdf_res['response'];
				$res['statement'] = '';
			}
		}

		return $res;
	}

	private static function getLojProblemBasicInfo($id) {
		$remote_provider = static::$providers['loj'];
		$curl = new Curl\Curl();
		$curl->setUserAgent(static::USER_AGENT);
		$curl->setHeader('Content-Type', 'application/json');

		$res = retry_loop(function () use (&$curl, $id) {
			$curl->post('https://api.loj.ac/api/problem/getProblem', json_encode([
				'displayId' => (int)$id,
				'localizedContentsOfLocale' => 'zh_CN',
				'samples' => true,
				'judgeInfo' => true,
			]));

			if ($curl->error) {
				return false;
			}

			return $curl->response;
		});

		if (!$res) return null;

		// Convert stdClass to array
		$res = json_decode(json_encode($res), true);

		if (isset($res['error'])) return null;

		$localized_contents = $res['localizedContentsOfLocale'];
		$statement = '';

		foreach ($localized_contents['contentSections'] as $section) {
			$statement .= "\n###" . $section['sectionTitle'] . "\n\n";

			if ($section['type'] === 'Text') {
				$statement .= $section['text'] . "\n";
			} else if ($section['type'] === 'Sample') {
				// assert($res['samples'][$section['sampleId']]);
				$display_sample_id = $section['sampleId'] + 1;
				$sample = $res['samples'][$section['sampleId']];

				$statement .= "\n#### 样例输入 #{$display_sample_id}\n\n";
				$statement .= "\n```text\n{$sample['inputData']}\n```\n\n";

				$statement .= "\n#### 样例输出 #{$display_sample_id}\n\n";
				$statement .= "\n```text\n{$sample['outputData']}\n```\n\n";

				if (trim($section['text'])) {
					$statement .= "\n#### 样例解释 #{$display_sample_id}\n\n";
					$statement .= $section['text'] . "\n";
				}
			} else {
				// do nothing...
			}
		}

		return [
			'type' => 'html',
			'title' => "【{$remote_provider['short_name']}{$id}】{$localized_contents['title']}",
			'time_limit' => (float)$res['judgeInfo']['timeLimit'] / 1000.0,
			'memory_limit' => $res['judgeInfo']['memoryLimit'],
			'difficulty' => -1,
			'statement' => HTML::parsedown()->text($statement),
		];
	}

	private static function getLuoguProblemBasicInfo($id) {
		$remote_provider = static::$providers['luogu'];
		$res = static::curl_get(static::getLuoguProblemUrl($id) . '?_contentOnly=1');

		if (!$res) return null;

		// Convert stdClass to array
		$res = json_decode(json_encode($res['response']), true);

		if (!isset($res['code']) || $res['code'] != 200) return null;

		$problem = $res['currentData']['problem'];
		$statement = '';

		if ($problem['background']) {
			$statement .= "\n### 题目背景\n\n";
			$statement .= $problem['background'] . "\n";
		}

		$statement .= "\n### 题目描述\n\n";
		$statement .= $problem['description'] . "\n";

		$statement .= "\n### 输入格式\n\n";
		$statement .= $problem['inputFormat'] . "\n";

		$statement .= "\n### 输出格式\n\n";
		$statement .= $problem['outputFormat'] . "\n";

		$statement .= "\n### 输入输出样例\n\n";

		foreach ($problem['samples'] as $id => $sample) {
			$display_sample_id = $id + 1;

			$statement .= "\n#### 样例输入 #{$display_sample_id}\n\n";
			$statement .= "\n```text\n{$sample[0]}\n```\n\n";

			$statement .= "\n#### 样例输出 #{$display_sample_id}\n\n";
			$statement .= "\n```text\n{$sample[1]}\n```\n\n";
		}

		$statement .= "\n### 说明/提示\n\n";
		$statement .= $problem['hint'] . "\n";

		return [
			'type' => 'html',
			'title' => "【{$remote_provider['short_name']}{$problem['pid']}】{$problem['title']}",
			'time_limit' => (float)max($problem['limits']['time']) / 1000.0,
			'memory_limit' => (float)max($problem['limits']['memory']) / 1024.0,
			'difficulty' => -1,
			'statement' => HTML::parsedown()->text($statement),
		];
	}

	public static function getSubmissionRequirements($oj) {
		$remote_provider = UOJRemoteProblem::$providers[$oj];

		return [
			[
				"name" => "answer",
				"type" => "source code",
				"file_name" => "answer.code",
				"languages" => $remote_provider['languages'],
			]
		];
	}

	public static function getStatementMarkdown($remote_oj, $remote_content) {
		$converter = new \League\HTMLToMarkdown\HtmlConverter(array('strip_tags' => true, 'italic_style' => '*'));
		$converter->getEnvironment()->addConverter(new \League\HTMLToMarkdown\Converter\TableConverter());
		$statement_md = $converter->convert($remote_content);
		$statement_md = str_replace("\\\\", "\\", $statement_md);
		$statement_md = str_replace("\\_", "_", $statement_md);

		// 翻译 atcoder 题面关键词
		if ($remote_oj == "atcoder") {
			$statement_md = str_replace("### Input", "### 输入", $statement_md);
			$statement_md = str_replace("### Output", "### 输出", $statement_md);
			$statement_md = str_replace("### Constraints", "### 限制", $statement_md);
			$statement_md = str_replace("### Sample Input", "### 样例输入", $statement_md);
			$statement_md = str_replace("### Sample Output", "### 样例输出", $statement_md);
			$statement_md = str_replace("All input values are integers.", "输入的值都是整数。", $statement_md);
			$statement_md = str_replace("All values in the input are integers.", "输入的值都是整数。", $statement_md);
			$statement_md = str_replace("All values in input are integers.", "输入的值都是整数。", $statement_md);
			$statement_md = str_replace("Print the answer as an integer.", "输出答案。", $statement_md);
			$statement_md = str_replace("Print the answer.", "输出答案。", $statement_md);
			// html 特殊字符
			$statement_md = str_replace("&lt;", "<", $statement_md);
			$statement_md = str_replace("&gt;", ">", $statement_md);
			// 删除一些句子
			$statement_md = str_replace("The input is given from Standard Input in the following format:\n", "", $statement_md);
			$statement_md = str_replace("Input is given from Standard Input in the following format:\n", "", $statement_md);
			$statement_md = str_replace("### Problem Statement\n", "", $statement_md);
			$statement_md = str_replace("<pre class=\"prettyprint linenums\">\n", "", $statement_md);
			// 给输入格式加上语言标记
			$statement_md = str_replace("### 输入\n\n\n```", "### 输入\n\n\n```format", $statement_md);
		}
		return $statement_md;
	}

	public static function getProblemRemoteUrl($oj, $id) {
		if ($oj === 'codeforces') {
			return static::getCodeforcesProblemUrl($id);
		} else if ($oj === 'atcoder') {
			return static::getAtcoderProblemUrl($id);
		} else if ($oj === 'uoj') {
			return static::getUojProblemUrl($id);
		} else if ($oj === 'loj') {
			return static::getLojProblemUrl($id);
		} else if ($oj === 'luogu') {
			return static::getLuoguProblemUrl($id);
		} else if ($oj === 'qoj') {
			return static::getQojProblemUrl($id);
		}

		return null;
	}

	// 传入 ID 需确保有效
	public static function getProblemBasicInfo($oj, $id) {
		if ($oj === 'codeforces') {
			return static::getCodeforcesProblemBasicInfo($id);
		} else if ($oj === 'atcoder') {
			return static::getAtcoderProblemBasicInfo($id);
		} else if ($oj === 'uoj') {
			return static::getUojProblemBasicInfo($id);
		} else if ($oj === 'loj') {
			return static::getLojProblemBasicInfo($id);
		} else if ($oj === 'luogu') {
			return static::getLuoguProblemBasicInfo($id);
		} else if ($oj === 'qoj') {
			return static::getQojProblemBasicInfo($id);
		}

		return null;
	}

	public static function downloadImagesInRemoteContent($problem_id, $remote_content) {
		$curl = new Curl\Curl();
		$curl->setUserAgent(static::USER_AGENT);
		$curl->setRetry(5);

		$problem = UOJProblem::query($problem_id);

		if ($problem->info['type'] != 'remote') return;

		$remote_provider = static::$providers[$problem->getExtraConfig('remote_online_judge')];

		$dom = new IvoPetkov\HTML5DOMDocument();
		$dom->loadHTML($remote_content);

		foreach ($dom->querySelectorAll('img') as &$elem) {
			$src = $elem->getAttribute('src');
			$url = getAbsoluteUrl($src, $remote_provider['url']);
			$filename = 'remote_image_' . hash('md5', $url);
			$curl->download($url, $problem->getResourcesPath($filename));
			$elem->setAttribute('src', $problem->getResourcesUri($filename));
		}
		return HTML::purifier(['a' => ['target' => 'Enum#_blank']])->purify($dom->saveHTML());
	}
}
