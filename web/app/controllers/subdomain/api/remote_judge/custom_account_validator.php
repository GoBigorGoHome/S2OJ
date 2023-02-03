<?php

Auth::check() || redirectToLogin();

$type = UOJRequest::get('type', 'is_string', null);
$curl = new Curl\Curl();
$curl->setUserAgent(UOJRemoteProblem::USER_AGENT);
$res = false;

function validateLuogu($response) {
	$response = json_decode(json_encode($response), true);

	return $response['currentTemplate'] !== 'AuthLogin';
}

if ($type == 'luogu') {
	$curl->setFollowLocation();
	$curl->setCookie('_uid', UOJRequest::post('_uid', 'is_string', ''));
	$curl->setCookie('__client_id', UOJRequest::post('__client_id', 'is_string', ''));

	retry_loop(function () use (&$curl, &$res) {
		$curl->get(UOJRemoteProblem::$providers['luogu']['url'] . '/user/setting?_contentOnly=1');

		if ($curl->error) {
			return false;
		}

		if ($curl->responseHeaders['Content-Type'] == 'text/html') {
			$sec = $curl->getResponseCookie('sec');

			if ($sec) {
				$curl->setCookie('sec', $sec);
				$curl->get(UOJRemoteProblem::$providers['luogu']['url'] . '/user/setting?_contentOnly=1');

				if ($curl->responseHeaders['Content-Type'] == 'application/json') {
					$res = validateLuogu($curl->response);

					return true;
				}

				return false;
			}

			return false;
		} else if ($curl->responseHeaders['Content-Type'] == 'application/json') {
			$res = validateLuogu($curl->response);

			return true;
		}

		return false;
	}, 3);

	die(json_encode(['ok' => $res === true]));
} else if ($type == 'codeforces') {
	$curl->setFollowLocation();
	$curl->setCookie('JSESSIONID', UOJRequest::post('JSESSIONID', 'is_string', ''));

	retry_loop(function () use (&$curl, &$res) {
		$curl->get(UOJRemoteProblem::$providers['codeforces']['url'] . '/enter');

		if ($curl->error) {
			return false;
		}

		if (str_starts_with($curl->responseHeaders['Content-Type'], 'text/html')) {
			if (str_contains($curl->response, 'Login into Codeforces')) {
				return false;
			}

			if (strlen($curl->response) < 1000 && str_contains($curl->response, 'Redirecting...')) {
				return false;
			}

			$res = true;

			return true;
		}

		return false;
	}, 3);
} else {
	UOJResponse::page406();
}

die(json_encode(['ok' => $res === true]));