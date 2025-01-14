<?php

class UOJProblemConf {
	public array $conf;

	static function getFromFile($file_name) {
		$reader = new StrictFileReader($file_name);
		if ($reader->failed()) {
			return -1;
		}

		$conf = [];

		while (!$reader->eof()) {
			$reader->ignoreWhite();

			$line = $reader->readLine();
			$line = explode(' ', $line);

			$key = array_shift($line);

			if (!$key) {
				break;
			}

			if (isset($conf[$key])) {
				return -2;
			}

			$conf[$key] = trim(implode(' ', $line));
		}

		$reader->close();

		return new UOJProblemConf($conf);
	}

	public function __construct($conf) {
		$this->conf = $conf;
	}

	public function putToFile($file_name) {
		$f = fopen($file_name, 'w');

		foreach ($this->conf as $key => $val) {
			fwrite($f, "{$key} {$val}\n");
		}

		fclose($f);
	}

	public function getVal($key, $default_val) {
		if (is_array($key)) {
			foreach ($key as $k) {
				if (isset($this->conf[$k])) {
					return $this->conf[$k];
				}
			}
		} else {
			if (isset($this->conf[$key])) {
				return $this->conf[$key];
			}
		}

		return $default_val;
	}

	public function getInputFileName($num) {
		return $this->getVal('input_pre', '') . $num . '.' . $this->getVal('input_suf', 'txt');
	}

	public function getOutputFileName($num) {
		return $this->getVal('output_pre', '') . $num . '.' . $this->getVal('output_suf', 'txt');
	}

	public function getExtraInputFileName($num) {
		return 'ex_' . $this->getInputFileName($num);
	}

	public function getExtraOutputFileName($num) {
		return 'ex_' . $this->getOutputFileName($num);
	}

	public function isOn($key) {
		return isset($this->conf[$key]) && $this->conf[$key] == 'on';
	}

	/**
	 * In what way this problem is non-traditional
	 */
	public function getNonTraditionalJudgeType() {
		if (!$this->isOn('use_builtin_judger')) {
			return 'custom_judger';
		} elseif ($this->isOn('submit_answer')) {
			return 'submit_answer';
		} elseif ($this->isOn('interaction_mode')) {
			return 'interaction';
		} elseif ($this->isOn('with_implementer')) {
			return 'with_implementer';
		} else {
			return 'traditional';
		}
	}
}
