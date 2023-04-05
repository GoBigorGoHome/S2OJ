// locale
uojLocaleData = {
	"username": {
		"en": "Username",
		"zh-cn": "用户名"
	},
	"contests::total score": {
		"en": "Score",
		"zh-cn": "总分"
	},
	"contests::n participants": {
		"en": function(n) {
			return n + " participant" + (n <= 1 ? '' : 's');
		},
		"zh-cn": function(n) {
			return "共 " + n + " 名参赛者";
		}
	},
	"click-zan::good": {
		"en": "Good",
		"zh-cn": "好评"
	},
	"click-zan::bad": {
		"en": "Bad",
		"zh-cn": "差评"
	},
	"editor::language": {
		"en": "Language",
		"zh-cn": "语言"
	},
	"editor::browse": {
		"en": "Browse",
		"zh-cn": "浏览"
	},
	"editor::upload source": {
		"en": "Source",
		"zh-cn": "来源"
	},
	"editor::upload by editor": {
		"en": "Editor",
		"zh-cn": "编辑器"
	},
	"editor::upload from local": {
		"en": "Local file",
		"zh-cn": "本地文件",
	},
	"editor::edit": {
		"en": "Edit",
		"zh-cn": "编辑",
	},
	"editor::preview": {
		"en": "Preview",
		"zh-cn": "预览",
	},
};

function uojLocale(name) {
	locale = $.cookie('uoj_locale');
	if (uojLocaleData[name] === undefined) {
		return '';
	}
	if (uojLocaleData[name][locale] === undefined) {
		locale = 'zh-cn';
	}
	val = uojLocaleData[name][locale];
	if (!$.isFunction(val)) {
		return val;
	} else {
		var args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		return val.apply(this, args);
	}
}

// utility
function strToDate(str) {
	var a = str.split(/[^0-9]/);
	return new Date(
		parseInt(a[0]),
		parseInt(a[1]) - 1,
		parseInt(a[2]),
		parseInt(a[3]),
		parseInt(a[4]),
		parseInt(a[5]),
		0);
}
function dateToStr(date) {
	return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}
function toFilledStr(o, f, l) {
	var s = o.toString();
	while (s.length < l) {
		s = f.toString() + s;
	}
	return s;
}
function getPenaltyTimeStr(x) {
	var ss = toFilledStr(x % 60, '0', 2);
	x = Math.floor(x / 60);
	var mm = toFilledStr(x % 60, '0', 2);
	x = Math.floor(x / 60);
	var hh = x.toString();
	return hh + ':' + mm + ':' + ss;
}

function htmlspecialchars(str)
{
	var s = "";
	if (str.length == 0) return "";
	s = str.replace(/&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;");
	return s;
}

function getColOfScore(score) {
	if (score == 0) {
		return ColorConverter.toStr(ColorConverter.toRGB(new HSV(0, 76, 86)));
	} else if (score == 100) {
		return ColorConverter.toStr(ColorConverter.toRGB(new HSV(130, 89, 72)));
	} else {
		return ColorConverter.toStr(ColorConverter.toRGB(new HSV(30 + score * 60 / 100, 83, 89)));
	}
}

function getUserLink(username, realname, color) {
	if (!username) {
		return '';
	}
	var text = username;
	var className = 'uoj-username';
	if (username.charAt(0) == '@') {
		username = username.substr(1);
	}
	if (realname) {
		text = text + ' <span class="uoj-realname d-inline-block">(' + realname + ')</span>';
	}
	if (color) {
		className += ' uoj-username-' + color;
	}
	return '<a class="' + className + '" href="' + uojHome + '/user/' + username + '">' + text + '</a>';
}
function getUserSpan(username, realname, color) {
	if (!username) {
		return '';
	}
	var text = username;
	var className = 'uoj-username';
	if (username.charAt(0) == '@') {
		username = username.substr(1);
	}
	if (realname) {
		text = text + ' <span class="uoj-realname d-inline-block">(' + realname + ')</span>';
	}
	if (color) {
		className += ' uoj-username-' + color;
	}
	return '<span class="' + className + '">' + text + '</span>';
}

function replaceWithHighlightUsername() {
	var username = $(this).text();
	var realname = $(this).data("realname");
	var color = $(this).data("color");

	if ($(this).data("link") != 0) {
		$(this).replaceWith(getUserLink(username, realname, color));
	} else {
		$(this).replaceWith(getUserSpan(username, realname, color));
	}
}

$.fn.uoj_honor = function() {
	return this.each(function() {
		var honor = $(this).text();
		var realname = $(this).data("realname");
		if (realname) {
			honor = honor + ' (' + realname + ')';
		}
		$(this).css('color', '#007bff').html(honor);
	});
}

function getClickZanBlock(type, id, cnt, val) {
	return '<div class="uoj-click-zan-block" data-id="' + id + '" data-type="' + type + '" data-val="' + val + '" data-cnt="' + cnt + '"></div>';
}

function showErrorHelp(name, err) {
	if (err) {
		$('#div-' + name).addClass('has-validation has-error');
		$('#div-' + name).addClass('is-invalid');
		$('#input-' + name).addClass('is-invalid');
		$('#help-' + name).text(err);
		return false;
	} else {
		$('#div-' + name).removeClass('has-validation has-error');
		$('#div-' + name).removeClass('is-invalid');
		$('#input-' + name).removeClass('is-invalid');
		$('#help-' + name).text('');
		return true;
	}
}
function getFormErrorAndShowHelp(name, val) {
	var err = val($('#input-' + name).val());
	return showErrorHelp(name, err);
}

function validateSettingPassword(str) {
	if (str.length < 6) {
		return '密码长度不应小于6。';
	} else if (! /^[!-~]+$/.test(str)) {
		return '密码应只包含可见ASCII字符。';
	} else if (str != $('#input-confirm_password').val()) {
		return '两次输入的密码不一致。';
	} else {
		return '';
	}
}
function validatePassword(str) {
	if (str.length < 6) {
		return '密码长度不应小于6。';
	} else if (! /^[!-~]+$/.test(str)) {
		return '密码应只包含可见ASCII字符。';
	} else {
		return '';
	}
}
function validateEmail(str) {
	if (str.length > 50) {
		return '电子邮箱地址太长。';
	} else if (! /^(.+)@(.+)$/.test(str)) {
		return '电子邮箱地址非法。';
	} else {
		return '';
	}
}
function validateUsername(str) {
	if (str.length == 0) {
		return '用户名不能为空。';
	} else if (! /^[a-zA-Z0-9_]+$/.test(str)) {
		return '用户名应只包含大小写英文字母、数字和下划线。';
	} else {
		return '';
	}
}
function validateQQ(str) {
	if (str.length < 5) {
		return 'QQ的长度不应小于5。';
	} else if (str.length > 15) {
		return 'QQ的长度不应大于15。';
	} else if (/\D/.test(str)) {
		return 'QQ应只包含0~9的数字。';
	} else {
		return '';
	}
}
function validateMotto(str) {
	if (str.length > 1024) {
		return '不能超过 1024 个字符。';
	} else {
		return '';
	}
}

// tags
$.fn.uoj_problem_tag = function() {
	return this.each(function() {
		$(this).attr('href', uojHome + '/problems?tag=' + encodeURIComponent($(this).text()));
	});
}
$.fn.uoj_list_tag = function() {
	return this.each(function() {
		$(this).attr('href', uojHome + '/lists?tag=' + encodeURIComponent($(this).text()));
	});
}
$.fn.uoj_blog_tag = function() {
	return this.each(function() {
		$(this).attr('href', uojBlogUrl + '/archive?tag=' + encodeURIComponent($(this).text()));
	});
}

// click zan
function click_zan(zan_id, zan_type, zan_delta, node) {
	var loading_node = $('<div class="uoj-click-zan-block text-muted">loading...</div>');
	$(node).replaceWith(loading_node);
	$.post(zan_link + '/click-zan', {
		id : zan_id,
		delta : zan_delta,
		type : zan_type,
	}, function(ret) {
		$(loading_node).replaceWith($(ret).click_zan_block());
	}).fail(function() {
		$(loading_node).replaceWith('<div class="uoj-click-zan-block text-danger">failed</div>');
	});
}

$.fn.click_zan_block = function() {
	return this.each(function() {
		var id = $(this).data('id');
		var type = $(this).data('type');
		var val = parseInt($(this).data('val'));
		var cnt = parseInt($(this).data('cnt'));
		var rendered = $(this).attr('data-click-zan-rendered');

		if (rendered == 'true') {
			return;
		}
		if (isNaN(cnt)) {
			return;
		}

		var up_icon_html = '<i class="bi bi-hand-thumbs-up"></i>';
		var down_icon_html = '<i class="bi bi-hand-thumbs-down"></i>';

		if (val == 1) {
			$(this).addClass('uoj-click-zan-block-cur-up');
			up_icon_html = '<i class="bi bi-hand-thumbs-up-fill"></i>';
		} else if (val == 0) {
			$(this).addClass('uoj-click-zan-block-cur-zero');
		} else if (val == -1) {
			$(this).addClass('uoj-click-zan-block-cur-down');
			down_icon_html = '<i class="bi bi-hand-thumbs-down-fill"></i>';
		} else {
			return;
		}
		if (cnt > 0) {
			$(this).addClass('uoj-click-zan-block-positive');
		} else if (cnt == 0) {
			$(this).addClass('uoj-click-zan-block-neutral');
		} else {
			$(this).addClass('uoj-click-zan-block-negative');
		}

		var node = this;
		var up_node = $('<a href="#" class="uoj-click-zan-up">'+up_icon_html+uojLocale('click-zan::good')+'</a>').click(function(e) {
			e.preventDefault();
			click_zan(id, type, 1, node);
		});
		var down_node = $('<a href="#" class="uoj-click-zan-down">'+down_icon_html+uojLocale('click-zan::bad')+'</a>').click(function(e) {
			e.preventDefault();
			click_zan(id, type, -1, node);
		});

		var display_cnt = cnt > 0 ? '+' + cnt : cnt;

		if (cnt < 0) display_cnt = '-?';
	
		$(this)
			.attr('data-click-zan-rendered', 'true')
			.append(up_node)
			.append(down_node)
			.append($('<span class="uoj-click-zan-cnt" title="' + cnt + '">[<strong>' + display_cnt + '</strong>]</span>'));
	});
}

// count down
function getCountdownStr(t, config) {
	var x = Math.floor(t);
	var ss = toFilledStr(x % 60, '0', 2);
	x = Math.floor(x / 60);
	var mm = toFilledStr(x % 60, '0', 2);
	x = Math.floor(x / 60);
	var hh = x.toString();

	var style = '';

	if (config.font_size) {
		style += 'font-size: ' + config.font_size + ';';
	}
	
	var res = '<span style="' + style + '">';
	res += '<span>' + hh + '</span>';
	res += ':';
	res += '<span>' + mm + '</span>';
	res += ':';
	res += '<span>' + ss + '</span>';
	res += '</span>';
	return res;
}

$.fn.countdown = function(rest, config = {}) {
	return this.each(function() {
		var start = new Date().getTime();
		var cur_rest = rest != undefined ? rest : parseInt($(this).data('rest'));
		config = $.merge(config, JSON.parse($(this).data('config') || '{}'));
		var cur = this;
		var countdown = function() {
			var passed = Math.floor((new Date().getTime() - start) / 1000);
			if (passed >= cur_rest) {
				$(cur).html(getCountdownStr(0, config));
				if (config.callback != undefined) {
					callback();
				}
			} else {
				$(cur).html(getCountdownStr(cur_rest - passed, config));
				setTimeout(countdown, 500);
			}
		}
		countdown();
	});
};

// update_judgement_status
update_judgement_status_list = []
function update_judgement_status_details(id) {
	update_judgement_status_list.push(id);
};

$(document).ready(function() {
	function update() {
		$.get("/api/submission/submission_status_details", {
				get: update_judgement_status_list,
			},
			function(data) {
				for (var i = 0; i < update_judgement_status_list.length; i++) {
					$("#status_details_" + update_judgement_status_list[i]).html(data[i].html);
					if (data[i].judged) {
						location.reload();
					}
				}
			}, 'json').always(
			function() {
    			setTimeout(update, 500);
	    	}
	    );
	}
	if (update_judgement_status_list.length > 0) {
		setTimeout(update, 500);
	}
});

// highlight
$.fn.uoj_highlight = function() {
	return $(this).each(function() {
		$(this).find("span.uoj-username, span[data-uoj-username]").each(replaceWithHighlightUsername);
		$(this).find(".uoj-honor").uoj_honor();
		$(this).find(".uoj-score").each(function() {
			var score = parseFloat($(this).text());
			var maxscore = parseFloat($(this).data('max'));
			if (isNaN(score)) {
				return;
			}
			if (isNaN(maxscore)) {
				$(this).css("color", getColOfScore(score));
			} else {
				$(this).css("color", getColOfScore(score / maxscore * 100));
			}
		});
		$(this).find(".uoj-status").each(function() {
			var success = parseInt($(this).data("success"));
			if(isNaN(success)){
				return;
			}
			if (success == 1) {
				$(this).css("color", ColorConverter.toStr(ColorConverter.toRGB(new HSV(120, 100, 80))));
			}
			else {
				$(this).css("color", ColorConverter.toStr(ColorConverter.toRGB(new HSV(0, 100, 100))));
			}
		});
		$(this).find(".uoj-problem-tag").uoj_problem_tag();
		$(this).find(".uoj-list-tag").uoj_list_tag();
		$(this).find(".uoj-blog-tag").uoj_blog_tag();
		$(this).find(".uoj-click-zan-block").click_zan_block();
		$(this).find(".countdown").countdown();
		$(this).find(".uoj-readmore").readmore({
			moreLink: '<a href="#" class="text-right">more...</a>',
			lessLink: '<a href="#" class="text-right">close</a>',
		});
	});
};

$(document).ready(function() {
	$('body').uoj_highlight();
});

// contest notice
function checkNotice(lastTime) {
	$.post(uojHome + '/check-notice', {
			last_time : lastTime
		},
		function(data) {
            if (data === null) {
                return;
            }
			setTimeout(function() {
				checkNotice(data.time);
			}, 60000);
            for (var i = 0; i < data.msg.length; i++) {
                alert(data.msg[i]);
            }
		},
		'json'
	).fail(function() {
		setTimeout(function() {
			checkNotice(lastTime);
		}, 60000);
	});
}

// long table
$.fn.long_table = function(data, cur_page, header_row, get_row_str, config) {
	return this.each(function() {
		var table_div = this;
		
		$(table_div).html('');
		
		var page_len = config.page_len != undefined ? config.page_len : 10;
		
		if (!config.echo_full) {
			var n_rows = data.length;
			var n_pages = Math.max(Math.ceil(n_rows / page_len), 1);
			if (cur_page == undefined) {
				cur_page = 1;
			}
			if (cur_page < 1) {
				cur_page = 1;
			} else if (cur_page > n_pages) {
				cur_page = n_pages;
			}
			var cur_start = (cur_page - 1) * page_len;
		} else {
			var n_rows = data.length;
			var n_pages = 1;
			cur_page = 1;
			var cur_start = (cur_page - 1) * page_len;
		}
		
		var div_classes = config.div_classes != undefined ? config.div_classes : ['table-responsive'];
		var table_classes = config.table_classes != undefined ? config.table_classes : ['table', 'table-bordered', 'table-hover', 'table-striped', 'table-text-center'];
		
		var now_cnt = 0;
		var tbody = $('<tbody />')
		for (var i = 0; i < page_len && cur_start + i < n_rows; i++) {
			now_cnt++;
			if (config.get_row_index) {
				tbody.append(get_row_str(data[cur_start + i], cur_start + i));
			} else {
				tbody.append(get_row_str(data[cur_start + i]));
			}
		}
		if (now_cnt == 0) {
			tbody.append('<tr><td colspan="233">无</td></tr>');
		}
		
		$(table_div).append(
			$('<div class="' + div_classes.join(' ') + '" />')
				.append(typeof config.print_before_table === 'function' ? config.print_before_table() : '')
				.append(
					$('<table class="' + table_classes.join(' ') + '" />')
						.append($('<thead />').append(header_row))
						.append(tbody)
				)
				.append(typeof config.print_after_table === 'function' ? config.print_after_table() : '')
		);
		
		var get_page_li = function(p, h) {
			if (p == -1) {
				return $('<li class="page-item"></li>').addClass('disabled').append($('<a class="page-link"></a>').append(h));
			}
			
			var li = $('<li class="page-item"></li>');
			if (p == cur_page) {
				li.addClass('active');
			}
			li.append(
				$('<a class="page-link"></a>').attr('href', '#' + table_div.id).append(h).click(function(e) {
					if (config.prevent_focus_on_click) {
						e.preventDefault();
					}
					$(table_div).long_table(data, p, header_row, get_row_str, config);
				})
			);
			return li;
		};
		var get_pagination = function() {
			var pagination = $('<ul class="pagination top-buffer-no bot-buffer-sm justify-content-center"></ul>');
			if (cur_page > 1) {
				pagination.append(get_page_li(1, '<i class="bi bi-chevron-double-left"></i>'));
				pagination.append(get_page_li(cur_page - 1, '<i class="bi bi-chevron-left"></i>'));
			} else {
				pagination.append(get_page_li(-1, '<i class="bi bi-chevron-double-left"></i>'));
				pagination.append(get_page_li(-1, '<i class="bi bi-chevron-left"></i>'));
			}
			var max_extend = config.max_extend != undefined ? config.max_extend : 5;
			for (var i = Math.max(cur_page - max_extend, 1); i <= Math.min(cur_page + max_extend, n_pages); i++) {
				pagination.append(get_page_li(i, i.toString()));
			}
			if (cur_page < n_pages) {
				pagination.append(get_page_li(cur_page + 1, '<i class="bi bi-chevron-right"></i>'));
				pagination.append(get_page_li(n_pages, '<i class="bi bi-chevron-double-right"></i>'));
			} else {
				pagination.append(get_page_li(-1, '<i class="bi bi-chevron-right"></i>'));
				pagination.append(get_page_li(-1, '<i class="bi bi-chevron-double-right"></i>'));
			}
			return pagination;
		}
		
		if (n_pages > 1) {
			$(table_div).append($('<div class="text-center"></div>').append(get_pagination()));
			if (config.top_pagination) {
				$(table_div).prepend($('<div class="text-center"></div>').append(get_pagination()));
			}
		}
	});
};

// monaco editor
function require_monaco(config, callback) {
	window.require = {
		paths: {
			vs: '/js/monaco-editor/min/vs',
		},
		"vs/nls": {
			availableLanguages: {
				'*': 'zh-cn',
			},
		},
	};
	$LAB.script('/js/monaco-editor/min/vs/loader.js').wait()
		.script('/js/monaco-editor/min/vs/editor/editor.main.nls.js').wait()
		.script('/js/monaco-editor/min/vs/editor/editor.main.nls.zh-cn.js').wait()
		.script('/js/monaco-editor/min/vs/editor/editor.main.js').wait(function() {
			$LAB.script('/js/monaco-themes.js').wait(function() {
				update_monaco_theme(getPreferredTheme());

				if (config.markdown) {
					$LAB.script('/js/blog-editor/monaco-markdown.js').wait(callback);
				} else {
					callback();
				}
			});
		});
}

function update_monaco_theme(theme) {
	if (!('monaco' in window)) return;

	if (theme == 'dark') {
		monaco.editor.setTheme('github-dark');
	} else {
		monaco.editor.setTheme('github');
	}
}

function get_monaco_mode(lang) {
	switch (lang) {
		case 'C++':
		case 'C++11':
		case 'C++17':
		case 'C++20':
		case 'C++98':
		case 'C++03':
			return 'cpp';
		case 'C':
			return 'c';
		case 'Python2':
		case 'Python2.7':
		case 'Python3':
			return 'python';
		case 'Pascal':
			return 'pascal';
		case 'Java8':
		case 'Java11':
		case 'Java17':
			return 'java';
		case 'text':
			return 'text';
		default:
			return 'text';
	}
}

// auto save
function autosave_locally_monaco(interval, name, monaco_instance) {
	if (typeof(Storage) === "undefined") {
		console.log('autosave_locally_monaco: Sorry! No Web Storage support..');
		return;
	}
	var url = window.location.href;
	var hp = url.indexOf('#');
	var uri = hp == -1 ? url : url.substring(0, hp);
	var full_name = name + '@' + uri;

	monaco_instance.getModel().setValue(localStorage.getItem(full_name));
	var save = function() {
		localStorage.setItem(full_name, monaco_instance.getModel().getValue());
		setTimeout(save, interval);
	};
	setTimeout(save, interval);
}

// source code form group
$.fn.source_code_form_group = function(name, text, langs_options_html) {
	return this.each(function() {
		var input_upload_type_editor_id = 'input-' + name + '_upload_type_editor';
		var input_upload_type_file_id = 'input-' + name + '_upload_type_file';
		var input_upload_type_name = name + '_upload_type';
		var input_language_id = 'input-' + name + '_language';
		var input_language_name = name + '_language';
		var input_editor_id = 'input-' + name + '_editor';
		var input_editor_name = name + '_editor';
		var input_file_id = 'input-' + name + '_file';
		var input_file_name = name + '_file';
		var spinner_id = 'spinner-' + name + '_editor';
		var div_help_language_id = 'div-help-' + name + '_language';
		var div_help_forbidden_code_id = 'div-help-' + name + '_forbidden_code';
		var div_editor_id = 'div-' + name + '_editor';
		var div_file_id = 'div-' + name + '_file';
		var help_file_id = 'help-' + name + '_file';

		var input_language =
			$('<select id="' + input_language_id + '" name="' + input_language_name + '" class="form-select form-select-sm d-inline-block"/>')
				.html(langs_options_html);
		var input_upload_type_editor = $('<input class="form-check-input" type="radio" id="' + input_upload_type_editor_id + '" name="' + input_upload_type_name + '" value="editor" />');
		var input_upload_type_file = $('<input class="form-check-input" type="radio" id="' + input_upload_type_file_id + '" name="' + input_upload_type_name + '" value="file" />');
		var input_file = $('<input type="file" class="form-control" id="' + input_file_id + '" name="' + input_file_name + '" />');
		var div_editor =
			$('<div id="' + div_editor_id + '" style="height: 350px" />')
				.append(
					$('<div id="' + spinner_id + '" class="border d-flex justify-content-center align-items-center" style="width: 100%; height: 350px;" />')
						.append('<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />')
					);
		var div_file =
			$('<div id="' + div_file_id + '" />')
				.append(input_file)
				.append($('<span class="help-block" id="' + help_file_id + '"></span>'))
		
		var div_help_language = $('<div id="' + div_help_language_id + '" class="text-warning-emphasis mb-2">');
		var div_help_forbidden_code = $('<div id="' + div_help_forbidden_code_id + '" class="text-warning-emphasis mb-2">');

		var show_help_lang = function() {
			if ($(this).val().startsWith('Java')) {
				div_help_language.text('注意：Java 程序源代码中不应指定所在的 package。我们会在源代码中找到第一个被定义的类并以它的 main 函数为程序入口点。');
			} else {
				div_help_language.text('');
			}
		};

		var show_help_forbidden_code = function(lang, code) {
			if (lang == 'C' || lang.startsWith('C++')) {
				if (/\n\s*#pragma/.test('\n' + code)) {
					div_help_forbidden_code.text('注意：C/C++ 程序源代码中不应包含 #pragma 指令，这在正式比赛中是不被允许的。');
				}
			} else {
				//
			}
		};

		var monaco_editor_instance = null;
		var monaco_editor_init = function() {
			require_monaco({}, function() {
				if (monaco_editor_instance != null) {
					return;
				}

				$(div_editor).html('');

				var mode = get_monaco_mode(input_language.val());

				monaco_editor_instance = monaco.editor.create(div_editor[0], {
					language: mode,
					automaticLayout: true,
					fontSize: "16px",
				});

				$('#' + spinner_id).css('display', 'none !important');
				$(div_editor).addClass('border overflow-hidden').show();
				autosave_locally_monaco(2000, name, monaco_editor_instance);

				$('#' + input_editor_id).val(monaco_editor_instance.getModel().getValue());
				monaco_editor_instance.onDidChangeModelContent(function () {
					var lang = input_language.val();
					var new_val = monaco_editor_instance.getModel().getValue();

					$('#' + input_editor_id).val(new_val);
					show_help_forbidden_code(lang, new_val);
				});
				
				input_language.change(function() {
					var new_lang = input_language.val();
					var val = monaco_editor_instance.getModel().getValue();

					monaco.editor.setModelLanguage(monaco_editor_instance.getModel(), get_monaco_mode(new_lang));
					show_help_forbidden_code(new_lang, val);
				});
			});
		}

		var save_prefer_upload_type = function(type) {
			$.cookie('uoj_source_code_form_group_preferred_upload_type', type, { expires: 7, path: '/' });
		};

		var prefer_upload_type = $.cookie('uoj_source_code_form_group_preferred_upload_type');
		if (prefer_upload_type === null) {
			prefer_upload_type = 'editor';
		}
		if (prefer_upload_type == 'file') {
			input_upload_type_file[0].checked = true;
			div_editor.css('display', 'none');
		} else {
			input_upload_type_editor[0].checked = true;
			div_file.css('display', 'none');
		}

		input_language.each(show_help_lang);
		input_language.change(show_help_lang);

		input_upload_type_editor.click(function() {
			div_editor.show('fast');
			div_file.hide('fast');
			save_prefer_upload_type('editor');
		});
		input_upload_type_file.click(function() {
			div_file.show('fast');
			div_editor.hide('fast');
			save_prefer_upload_type('file');
		});

		$(this).append(
				$('<div class="row mb-2 align-items-center"/>')
					.append($('<div class="col-sm-4 text-start">' + text + '</div>'))
					.append(
						$('<div class="col-sm-4 row align-items-center"/>')
							.append($('<div class="col-auto" />').append('<label class="col-form-label px-1' +' " for="' + input_language_id + '">' + uojLocale('editor::language') + '</label>'))
							.append($('<div class="col-auto" />').append(input_language))
						)
					.append($('<div class="col-sm-4 text-end"/>')
						.append(uojLocale('editor::upload source') + ': ')
						.append($('<div class="form-check d-inline-block">')
							.append($('<label for="' + input_upload_type_editor_id + '" />')
								.append(input_upload_type_editor)
								.append(' ' + uojLocale('editor::upload by editor'))
							)
						)
						.append($('<div class="form-check d-inline-block ms-3"/>')
							.append(input_upload_type_file)
							.append($('<label for="' + input_upload_type_file_id +'" />')
								.append(' ' + uojLocale('editor::upload from local'))
							)
						))
					)
				.append(div_help_language)
				.append(div_help_forbidden_code)
				.append(div_editor)
				.append(div_file)
				.append($('<input type="hidden" name="' + input_editor_name + '" id="' + input_editor_id + '"/>'));

		var check_monaco_editor_init = function() {
			if (div_editor.is(':visible')) {
				monaco_editor_init();
			} else {
				setTimeout(check_monaco_editor_init, 1);
			}
		}
		check_monaco_editor_init();
	});
}

// text file form group
$.fn.text_file_form_group = function(name, text) {
	return this.each(function() {
		var input_upload_type_editor_id = 'input-' + name + '_upload_type_editor';
		var input_upload_type_file_id = 'input-' + name + '_upload_type_file';
		var input_upload_type_name = name + '_upload_type';
		var input_editor_id = 'input-' + name + '_editor';
		var input_editor_name = name + '_editor';
		var input_file_id = 'input-' + name + '_file';
		var input_file_name = name + '_file';
		var spinner_id = 'spinner-' + name + '_editor';
		var div_editor_id = 'div-' + name + '_editor';
		var div_file_id = 'div-' + name + '_file';

		var help_file_id = 'help-' + name + '_file';

		var input_upload_type_editor = $('<input class="form-check-input" type="radio" id="' + input_upload_type_editor_id + '" name="' + input_upload_type_name + '" value="editor" />');
		var input_upload_type_file = $('<input class="form-check-input" type="radio" id="' + input_upload_type_file_id + '" name="' + input_upload_type_name + '" value="file" />');
		var input_file = $('<input type="file" class="form-control" id="' + input_file_id + '" name="' + input_file_name + '" />');

		var div_editor = $('<div id="' + div_editor_id + '" style="height: 350px" />')
			.append(
				$('<div id="' + spinner_id + '" class="border d-flex justify-content-center align-items-center" style="width: 100%; height: 350px;" />')
					.append('<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />')
				);
		var div_file =
			$('<div id="' + div_file_id + '" />')
				.append(input_file)
				.append($('<span class="help-block" id="' + help_file_id + '"></span>'))

		var monaco_editor_instance = null;
		var monaco_editor_init = function() {
			require_monaco({}, function() {
				if (monaco_editor_instance != null) {
					return;
				}

				$(div_editor).html('');

				monaco_editor_instance = monaco.editor.create(div_editor[0], {
					language: 'text',
					automaticLayout: true,
					fontSize: "16px",
				});

				$('#' + spinner_id).css('display', 'none !important');
				$(div_editor).addClass('border overflow-hidden').show();
				autosave_locally_monaco(2000, name, monaco_editor_instance);

				$('#' + input_editor_id).val(monaco_editor_instance.getModel().getValue());
				monaco_editor_instance.onDidChangeModelContent(function () {
					$('#' + input_editor_id).val(monaco_editor_instance.getModel().getValue());
				});
			});
		}

		var save_prefer_upload_type = function(type) {
			$.cookie('uoj_text_file_form_group_preferred_upload_type', type, { expires: 7, path: '/' });
		};

		var prefer_upload_type = $.cookie('uoj_text_file_form_group_preferred_upload_type');
		if (prefer_upload_type === null) {
			prefer_upload_type = 'editor';
		}
		if (prefer_upload_type == 'file') {
			input_upload_type_file[0].checked = true;
			div_editor.css('display', 'none');
		} else {
			input_upload_type_editor[0].checked = true;
			div_file.css('display', 'none');
		}

		input_upload_type_editor.click(function() {
			div_editor.show('fast');
			div_file.hide('fast');
			save_prefer_upload_type('editor');
		});
		input_upload_type_file.click(function() {
			div_file.show('fast');
			div_editor.hide('fast');
			save_prefer_upload_type('file');
		});

		$(this)
			.append($('<div class="row justify-content-between mb-2" />')
			.append($('<div class="col text-start">' + text + '</div>'))
			.append($('<div class="col text-end"/>')
				.append(uojLocale('editor::upload source') + ': ')
				.append($('<div class="form-check d-inline-block">')
					.append($('<label for="' + input_upload_type_editor_id + '" />')
						.append(input_upload_type_editor)
						.append(' ' + uojLocale('editor::upload by editor'))
					)
				)
				.append($('<div class="form-check d-inline-block ms-3"/>')
					.append(input_upload_type_file)
					.append($('<label for="' + input_upload_type_file_id +'" />')
						.append(' ' + uojLocale('editor::upload from local'))
					)
				))
			)
			.append(div_editor)
			.append(div_file)
			.append($('<input type="hidden" name="' + input_editor_name + '" id="' + input_editor_id + '"/>'));

		var check_monaco_editor_init = function() {
			if (div_editor.is(':visible')) {
				monaco_editor_init();
			} else {
				setTimeout(check_monaco_editor_init, 1);
			}
		}
		check_monaco_editor_init();
	});
}

// remote judge submit type group
$.fn.remote_submit_type_group = function(oj, submit_type) {
	return this.each(function() {
		var input_submit_type_bot_id = 'input-submit_type_bot';
		var input_submit_type_my_id = 'input-submit_type_my';
		var input_submit_type_archive_id = 'input-submit_type_archive';
		var div_submit_type_bot_id = 'div-submit_type_bot';
		var div_submit_type_my_id = 'div-submit_type_my';
		var div_submit_type_archive_id = 'div-submit_type_archive';

		var input_submit_type_bot = $('<input class="form-check-input" type="radio" name="answer_remote_submit_type" id="' + input_submit_type_bot_id + '" value="bot" />');
		var input_submit_type_my = $('<input class="form-check-input" type="radio" name="answer_remote_submit_type" id="' + input_submit_type_my_id + '" value="my" />');
		var input_submit_type_archive = $('<input class="form-check-input" type="radio" name="answer_remote_submit_type" id="' + input_submit_type_archive_id + '" value="archive" />');
		var input_my_account_data = $('<input type="hidden" name="answer_remote_account_data" value="" />');
		
		var my_account_validation_status = $('<span />').append('<span class="text-secondary">待验证</span>');
		var my_account_validation_btn = $('<button type="button" class="btn btn-secondary btn-sm ms-2">验证</button>');

		var validate_my_account = function(data) {
			my_account_validation_btn.html('<span class="spinner-border spinner-border-sm" role="status"></span>');
			my_account_validation_btn.addClass('disabled');

			$.ajax({
				type: 'POST',
				url: '/api/remote_judge/custom_account_validator?type=' + oj,
				data: data,
				success: function(res) {
					my_account_validation_btn.html('验证');
					my_account_validation_btn.removeClass('disabled');

					console.log('Validation status', res);

					if (res.ok) {
						my_account_validation_status.html('<span class="text-success">可用</span>');
					} else {
						my_account_validation_status.html('<span class="text-danger">不可用</span>');
					}
				},
				error: function() {
					my_account_validation_btn.html('验证');
					my_account_validation_btn.removeClass('disabled');
					my_account_validation_status.html('<span class="text-secondary">待验证</span>');
				},
				dataType: 'json',
			});
		};

		var div_submit_type_bot = $('<div id="' + div_submit_type_bot_id + '" />')
			.append('<div class="mt-3">将使用公用账号提交本题。</div>');
		var div_submit_type_my = $('<div id="' + div_submit_type_my_id + '" />')
			.append($('<div class="mt-3" />')
				.append('<span>将使用您的账号提交本题。</span>')
				.append('<span>配置方法请查阅 <a href="https://s2oj.github.io/#/user/problem?id=remote-judge-%e9%a2%98%e7%9b%ae" target="_blank">使用教程</a>。</span>')
			);
		var div_submit_type_archive = $('<div id="' + div_submit_type_archive_id + '" />')
			.append($('<div class="mt-3" />')
				.append('<span>将从您给定的提交记录中抓取评测结果。</span>')
				.append('<span>配置方法请查阅 <a href="https://s2oj.github.io/#/user/problem?id=remote-judge-%e9%a2%98%e7%9b%ae" target="_blank">使用教程</a>。</span>')
			).append(
				$('<div class="row mt-3 align-items-center" />')
					.append($('<div class="col-sm-2" />').append('<label for="input-answer_remote_submission_id" class="col-form-label">提交记录 ID</label>'))
					.append($('<div class="col-sm-4" />').append('<input id="input-answer_remote_submission_id" name="answer_remote_submission_id" class="form-control font-monospace" autocomplete="off" />'))
					.append($('<div class="col-sm-6" />').append($('<div class="form-text mt-0" />').append('请填入远程 OJ 上的提交记录 ID。')))
			);
		var div_account_data = $('<div class="border px-3 py-2 mt-3" />')
			.append($('<div class="mt-2" />').append('<span class="fs-6 fw-bold">远程账号信息</span>'))
			.append($('<div class="mt-3" />')
				.append('<span>账号状态：</span>')
				.append(my_account_validation_status)
				.append(my_account_validation_btn)
			);

		if ('localStorage' in window) {
			var prefer_submit_type = localStorage.getItem('uoj_remote_judge_save_prefer_submit_type__' + oj) || null;
			var save_prefer_submit_type = function(type) {
				localStorage.setItem('uoj_remote_judge_save_prefer_submit_type__' + oj, type);
			}
		} else {
			var prefer_submit_type = null;
			var save_prefer_submit_type = function(type) {};
		}

		input_submit_type_bot.click(function() {
			div_account_data.hide('fast');
			div_submit_type_my.hide('fast');
			div_submit_type_archive.hide('fast');
			div_submit_type_bot.show('fast');
			$('#form-group-answer_answer').show('fast');
			save_prefer_submit_type('bot');
		});
		input_submit_type_my.click(function() {
			div_submit_type_bot.hide('fast');
			div_submit_type_archive.hide('fast');
			div_submit_type_my.show('fast');
			div_account_data.show('fast');
			$('#form-group-answer_answer').show('fast');
			save_prefer_submit_type('my');
		});
		input_submit_type_archive.click(function() {
			div_submit_type_bot.hide('fast');
			div_submit_type_my.hide('fast');
			div_submit_type_archive.show('fast');
			div_account_data.show('fast');
			$('#form-group-answer_answer').hide('fast');
			save_prefer_submit_type('archive');
		});

		if (submit_type[0] == 'bot') {
			div_account_data.hide();
			div_submit_type_my.hide();
			div_submit_type_archive.hide();
			div_submit_type_bot.show();
			$('#form-group-answer_answer').show();
			input_submit_type_bot[0].checked = true;
		} else if (submit_type[0] == 'my') {
			div_submit_type_bot.hide();
			div_submit_type_my.show();
			div_submit_type_archive.hide();
			div_account_data.show();
			$('#form-group-answer_answer').show();
			input_submit_type_my[0].checked = true;
		} else if (submit_type[0] == 'archive') {
			div_submit_type_bot.hide();
			div_submit_type_my.hide();
			div_submit_type_archive.show();
			div_account_data.show();
			$('#form-group-answer_answer').hide();
			input_submit_type_archive[0].checked = true;
		}

		if (submit_type.indexOf('bot') == -1) {
			input_submit_type_bot.attr('disabled', 'disabled');
		} else if (prefer_submit_type == 'bot') {
			div_account_data.hide();
			div_submit_type_my.hide();
			div_submit_type_archive.hide();
			div_submit_type_bot.show();
			$('#form-group-answer_answer').show();
			input_submit_type_bot[0].checked = true;
			input_submit_type_my[0].checked = false;
			input_submit_type_archive[0].checked = false;
		}

		if (submit_type.indexOf('my') == -1) {
			input_submit_type_my.attr('disabled', 'disabled');
		} else if (prefer_submit_type == 'my') {
			div_submit_type_bot.hide();
			div_submit_type_my.show();
			div_submit_type_archive.hide();
			div_account_data.show();
			$('#form-group-answer_answer').show();
			input_submit_type_bot[0].checked = false;
			input_submit_type_my[0].checked = true;
			input_submit_type_archive[0].checked = false;
		}

		if (submit_type.indexOf('archive') == -1) {
			input_submit_type_archive.attr('disabled', 'disabled');
		} else if (prefer_submit_type == 'archive') {
			div_submit_type_bot.hide();
			div_submit_type_my.hide();
			div_submit_type_archive.show();
			div_account_data.show();
			$('#form-group-answer_answer').hide();
			input_submit_type_bot[0].checked = false;
			input_submit_type_my[0].checked = false;
			input_submit_type_archive[0].checked = true;
		}

		if (oj == 'luogu') {
			var luogu_account_data = {"_uid": "", "__client_id": ""};
			var input_luogu_uid = $('<input class="form-control font-monospace" type="text" name="luogu_uid" id="input-luogu_uid" autocomplete="off" />');
			var input_luogu_client_id = $('<input class="form-control font-monospace" type="text" name="luogu_client_id" id="input-luogu_client_id" autocomplete="off" />');

			if ('localStorage' in window) {
				try {
					var luogu_account_data_str = localStorage.getItem('uoj_remote_judge_luogu_account_data');
					if (luogu_account_data_str) {
						luogu_account_data = JSON.parse(luogu_account_data_str);
					}
				} catch (e) {}

				var save_luogu_account_data = function() {
					localStorage.setItem('uoj_remote_judge_luogu_account_data', JSON.stringify(luogu_account_data));
				}
			} else {
				var save_luogu_account_data = function() {};
			}

			input_luogu_uid.change(function() {
				luogu_account_data._uid = $(this).val();
				input_my_account_data.val(JSON.stringify(luogu_account_data));
				save_luogu_account_data();
				my_account_validation_status.html('<span class="text-secondary">待验证</span>');
			});

			input_luogu_client_id.change(function() {
				luogu_account_data.__client_id = $(this).val();
				input_my_account_data.val(JSON.stringify(luogu_account_data));
				save_luogu_account_data();
				my_account_validation_status.html('<span class="text-secondary">待验证</span>');
			});

			my_account_validation_btn.click(function() {
				validate_my_account({
					type: 'luogu',
					_uid: input_luogu_uid.val(),
					__client_id: input_luogu_client_id.val(),
				});
			});

			input_my_account_data.val(JSON.stringify(luogu_account_data));
			input_luogu_uid.val(luogu_account_data._uid);
			input_luogu_client_id.val(luogu_account_data.__client_id);

			if (luogu_account_data._uid && luogu_account_data.__client_id){
				validate_my_account({
					type: 'luogu',
					_uid: luogu_account_data._uid,
					__client_id: luogu_account_data.__client_id,
				});
			}

			div_account_data.append(
				$('<div class="row mt-3 align-items-center" />')
					.append($('<div class="col-sm-2" />').append('<label for="input-luogu_uid" class="col-form-label">_uid</label>'))
					.append($('<div class="col-sm-4" />').append(input_luogu_uid))
					.append($('<div class="col-sm-6" />').append($('<div class="form-text mt-0" />').append('请填入 Cookie 中的 <code>_uid</code>。')))
			).append(
				$('<div class="row mt-3 align-items-center" />')
					.append($('<div class="col-sm-2" />').append('<label for="input-luogu_client_id" class="col-form-label">__client_id</label>'))
					.append($('<div class="col-sm-4" />').append(input_luogu_client_id))
					.append($('<div class="col-sm-6" />').append($('<div class="form-text mt-0" />').append('请填入 Cookie 中的 <code>__client_id</code>。')))
			);
		} else if (oj == 'codeforces') {
			var codeforces_account_data = {"JSESSIONID": ""};
			var input_codeforces_jsessionid = $('<input class="form-control font-monospace" type="text" name="codeforces_jsessionid" id="input-codeforces_jsessionid" autocomplete="off" />');

			if ('localStorage' in window) {
				try {
					var codeforces_account_data_str = localStorage.getItem('uoj_remote_judge_codeforces_account_data');
					if (codeforces_account_data_str) {
						codeforces_account_data = JSON.parse(codeforces_account_data_str);
					}
				} catch (e) {}

				var save_codeforces_account_data = function() {
					localStorage.setItem('uoj_remote_judge_codeforces_account_data', JSON.stringify(codeforces_account_data));
				}
			}

			input_codeforces_jsessionid.change(function() {
				codeforces_account_data.JSESSIONID = $(this).val();
				input_my_account_data.val(JSON.stringify(codeforces_account_data));
				save_codeforces_account_data();
				my_account_validation_status.html('<span class="text-secondary">待验证</span>');
			});

			my_account_validation_btn.click(function() {
				validate_my_account({
					type: 'codeforces',
					JSESSIONID: input_codeforces_jsessionid.val(),
				});
			});

			input_my_account_data.val(JSON.stringify(codeforces_account_data));
			input_codeforces_jsessionid.val(codeforces_account_data.JSESSIONID);

			if (codeforces_account_data.JSESSIONID) {
				validate_my_account({
					type: 'codeforces',
					JSESSIONID: codeforces_account_data.JSESSIONID,
				});
			}

			div_account_data.append(
				$('<div class="row mt-3 align-items-center" />')
					.append($('<div class="col-sm-2" />').append('<label for="input-codeforces_jsessionid" class="col-form-label">JSESSIONID</label>'))
					.append($('<div class="col-sm-4" />').append(input_codeforces_jsessionid))
					.append($('<div class="col-sm-6" />').append($('<div class="form-text mt-0" />').append('请填入 Cookie 中的 <code>JSESSIONID</code>。')))
			);
		} else if (oj == 'loj') {
			var loj_account_data = {username: "", token: ""};
			var input_loj_token = $('<input class="form-control font-monospace" type="text" name="loj_token" id="input-loj_token" autocomplete="off" />');

			if ('localStorage' in window) {
				try {
					var loj_account_data_str = localStorage.getItem('uoj_remote_judge_loj_account_data');
					if (loj_account_data_str) {
						loj_account_data = JSON.parse(loj_account_data_str);
					}
				} catch (e) {}

				var save_loj_account_data = function() {
					localStorage.setItem('uoj_remote_judge_loj_account_data', JSON.stringify(loj_account_data));
				}
			} else {
				var save_loj_account_data = function() {};
			}

			input_loj_token.change(function() {
				loj_account_data.token = $(this).val();
				input_my_account_data.val(JSON.stringify(loj_account_data));
				save_loj_account_data();
				my_account_validation_status.html('<span class="text-secondary">待验证</span>');
			});

			my_account_validation_btn.click(function() {
				validate_my_account({
					type: 'loj',
					token: input_loj_token.val(),
				});
			});

			input_my_account_data.val(JSON.stringify(loj_account_data));
			input_loj_token.val(loj_account_data.token);

			if (loj_account_data.token) {
				validate_my_account({
					type: 'loj',
					token: loj_account_data.token,
				});
			}

			div_account_data.append(
				$('<div class="row mt-3 align-items-center" />')
					.append($('<div class="col-sm-2" />').append('<label for="input-loj_token" class="col-form-label">Token</label>'))
					.append($('<div class="col-sm-4" />').append(input_loj_token))
					.append($('<div class="col-sm-6" />').append($('<div class="form-text mt-0" />').append('请前往 <a href="https://loj.ac" target="_blank">LibreOJ</a> 登录账号，然后输入在控制台中运行 <code>console.log(JSON.parse(localStorage.appState).token)</code> 的输出结果。')))
			);
		} else if (oj == 'uoj') {
			var uoj_account_data = {"UOJSESSID": ""};
			var input_uoj_uojsessid = $('<input class="form-control font-monospace" type="text" name="uoj_uojsessid" id="input-uoj_uojsessid" />');

			if ('localStorage' in window) {
				try {
					var uoj_account_data_str = localStorage.getItem('uoj_remote_judge_uoj_account_data');
					if (uoj_account_data_str) {
						uoj_account_data = JSON.parse(uoj_account_data_str);
					}
				} catch (e) {}

				var save_uoj_account_data = function() {
					localStorage.setItem('uoj_remote_judge_uoj_account_data', JSON.stringify(uoj_account_data));
				}
			}

			input_uoj_uojsessid.change(function() {
				uoj_account_data.UOJSESSID = $(this).val();
				input_my_account_data.val(JSON.stringify(uoj_account_data));
				save_uoj_account_data();
				my_account_validation_status.html('<span class="text-secondary">待验证</span>');
			});

			my_account_validation_btn.click(function() {
				validate_my_account({
					type: 'uoj',
					UOJSESSID: input_uoj_uojsessid.val(),
				});
			});

			input_my_account_data.val(JSON.stringify(uoj_account_data));
			input_uoj_uojsessid.val(uoj_account_data.UOJSESSID);

			if (uoj_account_data.UOJSESSID) {
				validate_my_account({
					type: 'uoj',
					UOJSESSID: uoj_account_data.UOJSESSID,
				});
			}

			div_account_data.append(
				$('<div class="row mt-3 align-items-center" />')
					.append($('<div class="col-sm-2" />').append('<label for="input-uoj_uojsessid" class="col-form-label">UOJSESSID</label>'))
					.append($('<div class="col-sm-4" />').append(input_uoj_uojsessid))
					.append($('<div class="col-sm-6" />').append($('<div class="form-text mt-0" />').append('请填入 Cookie 中的 <code>UOJSESSID</code>。')))
			);
		}

		$(this).append(
			$('<div class="mt-3" />').append(
					$('<div class="form-check d-inline-block" />')
						.append(input_submit_type_bot)
						.append($('<label class="form-check-label" for="' + input_submit_type_bot_id + '" />').append(' 公用账号'))
				).append(
					$('<div class="form-check d-inline-block ms-3" />')
						.append(input_submit_type_my)
						.append($('<label class="form-check-label" for="' + input_submit_type_my_id + '" />').append(' 自有账号'))
				).append(
					$('<div class="form-check d-inline-block ms-3" />')
						.append(input_submit_type_archive)
						.append($('<label class="form-check-label" for="' + input_submit_type_archive_id + '" />').append(' 归档'))
				)
		)
			.append(div_submit_type_bot)
			.append(div_submit_type_my)
			.append(div_submit_type_archive)
			.append(div_account_data)
			.append(input_my_account_data);
	});
}

// problem_configure: print problem.conf
$.fn.problem_conf_preview = function(problem_conf) {
	return $(this).each(function() {
		var keys = Object.keys(problem_conf);
		var res = '';

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = problem_conf[key];

			if (!value) {
				continue;
			}

			if (key == 'use_builtin_judger' && value == 'off') {
				continue;
			}

			if (key == 'use_builtin_checker' && value == 'ownchk') {
				continue;
			}

			res += key + ' ' + value + '\n';
		}

		$(this).html('<pre class="bg-body-tertiary mb-0 p-3"><code>' + res + '</code></pre>');
	});
}

// problem_configure: point scores
$.fn.problem_configure_point_scores = function(problem_conf) {
	return $(this).each(function() {
		var _this = this;
		var n_tests = parseInt(problem_conf['n_tests']);

		$(this).empty();

		if (isNaN(n_tests) || n_tests <= 0) {
			$(this).html('不可用。');

			return;
		}

		for (var i = 1; i <= n_tests; i++) {
			var input_point_score = $('<input class="form-control form-control-sm uoj-problem-configure-point-score-input" type="number" name="point_score_' + i + '" id="input-point_score_' + i + '" min="0" max="100" />');

			if (problem_conf['point_score_' + i]) {
				input_point_score.val(problem_conf['point_score_' + i]);
			}

			(function(i){
				input_point_score.change(function() {
					problem_conf['point_score_' + i] = $(this).val();
					$('#problem-conf-preview').problem_conf_preview(problem_conf);
				});
			})(i);

			$(this).append(
				$('<div class="col-sm-6" />').append(
					$('<div class="" />')
						.append($('<div class="" />').append('<label for="input-point_score_' + i + '" class="col-form-label col-form-label-sm">测试点 #' + i + '</label>'))
						.append($('<div class="" />').append(input_point_score))
				)
			);
		}

		$('.uoj-problem-configure-point-score-input', this).change(function() {
			var full_score = 100;
			var rest_tests = parseInt(problem_conf['n_tests'] || '10');
			var score_type = problem_conf['score_type'] || 'int';

			$('.uoj-problem-configure-point-score-input', _this).each(function() {
				var point_score = parseInt($(this).val());
				if (!isNaN(point_score)) {
					full_score -= point_score;
					rest_tests--;
				}
			});

			$('.uoj-problem-configure-point-score-input', _this).each(function() {
				if ($(this).val() == '') {
					var val = full_score / rest_tests;

					if (score_type == 'int') {
						val = Math.floor(val);
					} else {
						var decimal_places = parseInt(score_type.substring(5));

						val = val.toFixed(decimal_places);
					}

					$(this).attr('placeholder', val);
				}
			});
		});

		$('.uoj-problem-configure-point-score-input', this).first().trigger('change');
	});
};

// problem_configure: subtasks
$.fn.problem_configure_subtasks = function(problem_conf) {
	return $(this).each(function() {
		var _this = this;
		var n_subtasks = parseInt(problem_conf['n_subtasks'] || '0');

		$(this).empty();

		if (isNaN(n_subtasks)) {
			$(this).html('不可用。');

			return;
		}

		var input_n_subtasks = $('<input class="form-control" type="number" name="n_subtasks" id="input-n_subtasks" />');
		var div_subtasks = $('<div class="list-group list-group-flush border-top" />');

		if (n_subtasks) {
			input_n_subtasks.val(n_subtasks);
		}

		$(this).append(
			$('<div class="m-3" />').append(
				$('<div class="row" />').append(
					$('<div class="col-4" />').append('<label for="input-n_subtasks" class="col-form-label">子任务数</label>')
				).append(
					$('<div class="col-8" />').append(input_n_subtasks)
				)
			)
		).append(div_subtasks);

		input_n_subtasks.change(function() {
			div_subtasks.empty();

			var n_subtasks = parseInt(input_n_subtasks.val() || '0');
			var n_tests = parseInt(problem_conf['n_tests'] || '10');
			problem_conf['n_subtasks'] = input_n_subtasks.val();

			for (var i = 1; i <= n_subtasks; i++) {
				var input_subtask_type = $('<select class="form-select form-select-sm" name="subtask_type_' + i + '" id="input-subtask_type_' + i + '" />');
				var input_subtask_end = $('<input class="form-control form-control-sm uoj-problem-configure-subtask-end-input" type="number" name="subtask_end_' + i + '" id="input-subtask_end_' + i + '" min="0" max="' + n_tests + '" />');
				var input_subtask_score = $('<input class="form-control form-control-sm uoj-problem-configure-subtask-score-input" type="number" name="subtask_score_' + i + '" id="input-subtask_score_' + i + '" min="0" max="100" />');
				var input_subtask_used_time_type = $('<select class="form-select form-select-sm" name="subtask_used_time_type_' + i + '" id="input-subtask_used_time_type_' + i + '" />');

				input_subtask_type
					.append($('<option value="packed" />').text('错一个就零分'))
					.append($('<option value="min" />').text('取所有测试点中的最小值'));
				input_subtask_used_time_type
					.append($('<option value="sum" />').text('全部相加'))
					.append($('<option value="max" />').text('取所有测试点中的最大值'));

				(function(i) {
					input_subtask_type.change(function() {
						problem_conf['subtask_type_' + i] = $(this).val();
						$('#problem-conf-preview').problem_conf_preview(problem_conf);
					});

					input_subtask_end.change(function() {
						problem_conf['subtask_end_' + i] = $(this).val();
						$('#problem-conf-preview').problem_conf_preview(problem_conf);
					})

					input_subtask_score.change(function() {
						problem_conf['subtask_score_' + i] = $(this).val();
						$('#problem-conf-preview').problem_conf_preview(problem_conf);
					});

					input_subtask_used_time_type.change(function() {
						problem_conf['subtask_used_time_type_' + i] = $(this).val();
						$('#problem-conf-preview').problem_conf_preview(problem_conf);
					});
				})(i);

				if (problem_conf['subtask_type_' + i]) {
					input_subtask_type.val(problem_conf['subtask_type_' + i]);
				}

				if (problem_conf['subtask_end_' + i]) {
					input_subtask_end.val(problem_conf['subtask_end_' + i]);
				}

				if (problem_conf['subtask_score_' + i]) {
					input_subtask_score.val(problem_conf['subtask_score_' + i]);
				}

				if (problem_conf['subtask_used_time_type_' + i]) {
					input_subtask_used_time_type.val(problem_conf['subtask_used_time_type_' + i]);
				}

				div_subtasks.append(
					$('<div class="list-group-item" />').append(
						$('<div class="fw-bold" />').text('Subtask #' + i)
					).append(
						$('<div />').append(
							$('<div class="row mt-2" />').append(
								$('<div class="col-sm-6" />').append('<label for="input-subtask_type_' + i + '" class="col-form-label col-form-label-sm">评分类型</label>')
							).append(
								$('<div class="col-sm-6" />').append(input_subtask_type)
							)
						).append(
							$('<div class="row mt-2" />').append(
								$('<div class="col-sm-6" />').append('<label for="input-subtask_end_' + i + '" class="col-form-label col-form-label-sm">最后一个测试点的编号</label>')
							).append(
								$('<div class="col-sm-6" />').append(input_subtask_end)
							)
						).append(
							$('<div class="row mt-2" />').append(
								$('<div class="col-sm-6" />').append('<label for="input-subtask_score_' + i + '" class="col-form-label col-form-label-sm">分数</label>')
							).append(
								$('<div class="col-sm-6" />').append(input_subtask_score)
							)
						).append(
							$('<div class="row mt-2" />').append(
								$('<div class="col-sm-6" />').append('<label for="input-subtask_used_time_type_' + i + '" class="col-form-label col-form-label-sm">程序用时统计方式</label>')
							).append(
								$('<div class="col-sm-6" />').append(input_subtask_used_time_type)
							)
						)
					)
				);
			}

			$('.uoj-problem-configure-subtask-score-input', _this).change(function() {
				var full_score = 100;
				var rest_subtasks = parseInt(problem_conf['n_subtasks'] || '10');
				var score_type = problem_conf['score_type'] || 'int';
	
				$('.uoj-problem-configure-subtask-score-input', _this).each(function() {
					var subtask_score = parseInt($(this).val());
	
					if (!isNaN(subtask_score)) {
						full_score -= subtask_score;
						rest_subtasks--;
					}
				});
	
				$('.uoj-problem-configure-subtask-score-input', _this).each(function() {
					if ($(this).val() == '') {
						var val = full_score / rest_subtasks;
	
						if (score_type == 'int') {
							val = Math.floor(val);
						} else {
							var decimal_places = parseInt(score_type.substring(5));
	
							val = val.toFixed(decimal_places);
						}
	
						$(this).attr('placeholder', val);
					}
				});
			});

			$('.uoj-problem-configure-subtask-score-input', _this).first().trigger('change');
			$('#problem-conf-preview').problem_conf_preview(problem_conf);
		});

		input_n_subtasks.trigger('change');
	});
};

// custom test
function custom_test_onsubmit(response_text, div_result, url) {
	if (response_text != '') {
		$(div_result).html('<div class="text-danger">' + response_text + '</div>');
		return;
	}
	var update = function() {
		var can_next = true;
		$.get(url,
			function(data) {
				if (data.judged === undefined) {
					$(div_result).html('<div class="text-danger">error</div>');
				} else {
					var judge_status = $('<table class="table table-bordered table-text-center"><tr class="info">' + data.html + '</tr></table>');
					$(div_result).empty();
					$(div_result).append(judge_status);
					if (data.judged) {
						var judge_result = $(data.result);
						judge_result.css('display', 'none');
						$(div_result).append(judge_result);
						judge_status.hide(500);
						judge_result.slideDown(500);
						can_next = false;
					}
				}
			}, 'json')
		.always(function() {
			if (can_next) {
				setTimeout(update, 500);
			}
		});
	};
	setTimeout(update, 500);
}

// markdown input editor
$.fn.markdown_input_editor = function(name, type, text) {
	return this.each(function() {
		var input_editor_name = name;
		var input_editor_id = 'input-' + name + '_editor';
		var spinner_id = 'spinner-' + name + '_editor';
		var div_editor_id = 'div-' + name + '_editor';
		var div_preview_id = 'div-' + name + '_preview';

		var btn_editor = $('<button class="nav-link" type="button" />').attr('data-bs-target', '#' + div_editor_id + '_edit').attr('data-bs-toggle', 'tab').text(uojLocale('editor::edit')).addClass('active');
		var btn_preview = $('<button class="nav-link" type="button" />').attr('data-bs-target', '#' + div_editor_id + '_preview').attr('data-bs-toggle', 'tab').text(uojLocale('editor::preview'));

		var div_editor = $('<div id="' + div_editor_id + '" style="height: 350px" />')
			.append(
				$('<div id="' + spinner_id + '" class="d-flex justify-content-center align-items-center" style="width: 100%; height: 350px;" />')
					.append('<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />')
				);
		var div_preview = $('<div id="' + div_preview_id + '" style="min-height: 350px" />');

		var monaco_editor_instance = null;
		var monaco_editor_init = function() {
			require_monaco({ markdown: true }, function() {
				if (monaco_editor_instance != null) {
					return;
				}

				$(div_editor).empty();

				monaco_editor_instance = monaco.editor.create(div_editor[0], {
					language: 'markdown-math',
					automaticLayout: true,
					fontSize: "16px",
					minimap: {
						enabled: false,
					},
					wordWrap: 'on',
					unicodeHighlight: {
						ambiguousCharacters: false,
					},
				});

				$('#' + spinner_id).css('display', 'none !important');
				$(div_editor).addClass('overflow-hidden rounded-bottom').show();

				monaco_editor_instance.getModel().setValue(text);
				monaco_editor_instance.onDidChangeModelContent(function () {
					$('#' + input_editor_id).val(monaco_editor_instance.getModel().getValue());
				});

				require(['MonacoMarkdown'], function(MonacoMarkdown) {
					var extension = new MonacoMarkdown.MonacoMarkdownExtension();
					extension.activate(monaco_editor_instance);
				});
			});
		}

		$(this)
			.append(
				$('<div class="card" />')
					.append(
						$('<div class="card-header" />').append(
							$('<ul class="nav nav-tabs card-header-tabs">')
								.append($('<li class="nav-item" />').append(btn_editor))
								.append($('<li class="nav-item" />').append(btn_preview))
						)
					)
					.append(
						$('<div class="card-body tab-content p-0" />')
							.append(
								$('<div class="tab-pane active" />')
									.attr('id', div_editor_id + '_edit')
									.append(div_editor)
							)
							.append(
								$('<div class="tab-pane" />')
									.attr('id', div_editor_id + '_preview')
									.append(div_preview)
							)
					)
			)
			.append($('<input type="hidden" name="' + input_editor_name + '" id="' + input_editor_id + '"/>').val(text));

		bootstrap.Tab.jQueryInterface.call(btn_editor);
		bootstrap.Tab.jQueryInterface.call(btn_preview).on('shown.bs.tab', function () {
			$(div_preview)
				.empty()
				.append(
					$('<div class="d-flex justify-content-center align-items-center" style="width: 100%; height: 350px;" />')
						.append('<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />')
				);
			
			var render = function () {
				$.ajax({
					url: '/api/markdown',
					type: 'POST',
					dataType: 'text',
					data: {
						markdown: $('#' + input_editor_id).val(),
						purifier_type: type,
						parsedown_type: type,
					},
					success: function (html) {
						$(div_preview).empty().append($('<div class="markdown-body p-3" />').html(html)).uoj_highlight();
						if (window.MathJax) window.MathJax.typeset();
					},
					error: function () {
						var btn_retry = $('<button type="button" class="btn btn-link p-0 alert-link" />').text('retry').click(function() {
							$(div_preview)
								.empty()
								.append(
									$('<div class="d-flex justify-content-center align-items-center" style="width: 100%; height: 350px;" />')
										.append('<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />')
								);
							
							render();
						});
	
						$(div_preview).empty().append(
							$('<div class="m-3 alert alert-danger" />')
								.append('<span>Render failed, </span>')
								.append('<span>please </span>')
								.append(btn_retry)
						);
					},
				});
			}

			render();
		});

		var check_monaco_editor_init = function() {
			if (div_editor.is(':visible')) {
				monaco_editor_init();
			} else {
				setTimeout(check_monaco_editor_init, 1);
			}
		}

		check_monaco_editor_init();
	});
}

// hide comment
function toggleModalHideComment(id, content) {
	$('#input-comment_hide_id').val(id);
	$('#span-comment_hide_id').text(id);
	$('#HideCommentModalOriginalComment').html(content);
	$('#HideCommentModal').modal('show');
}

// comment
function showCommentReplies(id, replies) {
	var toggleFormReply = function(from, text) {
		if (text == undefined) {
			text = '';
		}
		
		var p = '#comment-body-' + id;
		var q = '#div-form-reply';
		var r = '#input-reply_comment';
		var t = '#input-reply_id';
		if ($(q).data('from') != from) {
			$(q).data('from', from);
			$(q).hide('fast', function() {
				$(this).appendTo(p).show('fast', function() {
					$(t).val(id);
					$(r).val(text).focus();
				});
			});
		} else if ($(q).css('display') != 'none') {
			$(q).appendTo(p).hide('fast');
		} else {
			$(q).appendTo(p).show('fast', function() {
				$(t).val(id);
				$(r).val(text).focus();
			});
		}
	}

	$('#reply-to-' + id).click(function(e) {
		e.preventDefault();
		toggleFormReply(id);
	});
	
	if (replies.length == 0) {
		return;
	}
	
	$("#replies-" + id).long_table(
		replies,
		1,
		'<tr>' +
			'<th>评论回复</th>' +
		'</tr>',
		function(reply) {
			return $('<tr id="' + 'comment-' + reply.id + '" />').append(
				$('<td />').append(
					$('<div class="d-flex" />').append(
						$('<div class="d-none d-sm-block mr-3 flex-shrink-0" />').append(
							$('<a />').append(
								$('<img class="rounded uoj-user-avatar" width="64" height="64" />').attr('src', reply.poster_avatar)
							).attr('href', uojHome + '/user/' + reply.poster)
						)
					).append(
						$('<div id="comment-body-' + reply.id + '" class="flex-grow-1 ms-3" />').append(
							$('<div class="row justify-content-between flex-wrap g-0" />').append(
								$('<div class="col-auto" />').append(getUserLink(reply.poster, reply.poster_realname, reply.poster_username_color))
							).append(
								$('<div class="col-auto" />').append(reply.click_zan_block)
							)
						).append(
							$('<div class="comment-content markdown-body my-2" />').attr('id', 'comment-content-' + reply.id).html(reply.content)
						).append(
							$('<ul class="text-end mb-0 list-inline" />').append(
								'<li class="list-inline-item small text-muted">' + reply.post_time + '</li>'
							).append(
								user_can_hide_comment
									? $('<li class="list-inline-item" />').append(
										$('<a href="#" class="text-warning-emphasis text-decoration-none p-0" />').data('comment-id', reply.id).text('隐藏').click(function(event) {
											event.preventDefault();
											toggleModalHideComment(reply.id, reply.content);
										})
									)
									: ''
							).append(
								$('<li class="list-inline-item" />').append(
									$('<a href="#">回复</a>').click(function (e) {
										e.preventDefault();
										toggleFormReply(reply.id, '回复 @' + reply.poster + '：');
									})
								)
							)
						)
					)
				)
			).uoj_highlight();
		}, {
			table_classes: ['table'],
			page_len: 5,
			prevent_focus_on_click: true
		}
	);
}

function getACMStandingsMeta() {
	var stat = {};
	var full_score = 0;

	for (var k = 0; k < problems.length; k++) {
		var pid = problems[k];
		stat[pid] = {};
		stat[pid].cnt = 0;
		stat[pid].ac_cnt = 0;
		stat[pid].earliest = null;
		if (("problem_" + pid) in bonus) {
			for (var j in score) {
				if (score[j][k] != undefined) {
					stat[pid].cnt += score[j][k][3];
					if (score[j][k][1] === -1200) {
						stat[pid].ac_cnt++;
					}
				}
			}
		} else {
			full_score += 100;
			for (var j in score) {
				if (score[j][k] != undefined) {
					stat[pid].cnt += score[j][k][3];
					if (score[j][k][0] === 100) {
						stat[pid].ac_cnt++;
						if (stat[pid].earliest === null || score[j][k][2] < stat[pid].earliest) {
							stat[pid].earliest = score[j][k][2];
						}
					}
				}
			}
		}
	}
	return { stat, full_score };
}

function setACMStandingsTH(th, i, meta) {
	if (i == -3) {
		return $(th).css('width', '3em').text('#');
	} else if (i == -2) {
		return $(th).css('width', '14em').text(uojLocale('username'));
	} else if (i == -1) {
		return $(th).css('width', '5em').text(uojLocale('contests::total score'));
	}

	var pid = problems[i];
	
	$(th).css('width', '5em');
	if (("problem_" + pid) in bonus) {
		$(th).attr('title', '附加题，通过后减免 20 分钟罚时');
	}
	var th_str = '<div><a href="/contest/' + contest_id + '/problem/' + pid + '">' + String.fromCharCode('A'.charCodeAt(0) + i);
	if (("problem_" + pid) in bonus) {
		th_str += '*';
	}
	th_str += '</a></div>';
	if (meta && pid in meta.stat) {
		th_str += '<div>' + meta.stat[pid].ac_cnt + '/' + meta.stat[pid].cnt + '</div>';
	}
	return $(th).html(th_str);
}

function setACMStandingsTD(td, row, i, meta) {
	if (i == -3) {
		return $(td).attr('class', '').html(row[3]);
	} else if (i == -2) {
		if (2 in row[2] && row[2][2]) {
			let td_title = row[2][2]['team_name'] + "\n";
			for (var i = 0; i < row[2][2]['members'].length; i++) {
				td_title += row[2][2]['members'][i]['name'];
				td_title += "  （";
				td_title += row[2][2]['members'][i]['organization'];
				td_title += "）";
				if (i < row[2][2]['members'].length - 1) {
					td_title += "\n";
				}
			}
			return $(td).attr('class', '').attr('title', td_title).html(
				'<div class="text-center" style="overflow-wrap:anywhere;">' +
					'<small><strong>' + htmlspecialchars(row[2][2]['team_name']) + '</strong></small>' +
				'</div>' +
				'<div>' +
					'<small>' + getUserLink(row[2][0], row[2][1], row[2][3]) + '</small>' +
				'</div>'
			);
		} else {
			return $(td).attr('class', '').html(getUserLink(row[2][0], row[2][1], row[2][3]));
		}
	} else if (i == -1) {
		let td_title = "总分：" + row[0] + "\n";
		td_title += "罚时：" + row[1] + "，即 " + getPenaltyTimeStr(row[1]);
		return $(td).attr('class', 'standings-score-td').attr('title', td_title).html(
			'<div>' +
				'<span class="uoj-score" data-max="' + meta.full_score + '" style="color:' + getColOfScore(row[0] * 100 / meta.full_score) + '">' +
					row[0] +
				'</span>' +
			'</div>' +
			'<div>' +
				'<small>' + getPenaltyTimeStr(row[1]) + '</small>' +
			'</div>'
		);
	}

	var col = score[row[2][0]][i];

	$(td).attr('class', 'standings-score-td');
	
	if (col === undefined) {
		return $(td).html('');
	}

	var td_title = String.fromCharCode('A'.charCodeAt(0) + i) + "题\n";
	var td_content = '';

	if (("problem_" + problems[i]) in bonus) {
		td_content += '<div>';
		if (col[0] !== null) {
			if (col[1] == -1200) {
				td_content += '<a href="/submission/' + col[2] + '" class="uoj-score" data-score="100" style="color:' + getColOfScore(100) + '">';
				td_content += '+';
				td_content += '</a>';

				td_title += col[3] + " 次有效提交后通过，减免罚时 20 分钟";
			} else {
				td_content += '<a href="/submission/' + col[2] + '" class="uoj-score" data-score="0" style="color:' + getColOfScore(0) + '">';
				td_content += 0;
				td_content += '</a>';

				td_title += "尚未通过，未减免罚时";
				td_title += "\n" + col[3] + " 次有效提交";
			}
			if (col[5] > 0) {
				td_content += ' + ';
				td_title += "\n" + "因封榜有 " + col[5] + " 次提交结果未知";
			}
		} else {
			td_title += "封榜后提交了 " + col[5] + " 次，结果未知";
		}

		if (col[5] > 0) {
			td_content += '<strong class="text-muted">?</strong>';
		}
		td_content += '</div>';

		if (col[4] > 0) {
			td_content += '<div><small>';
			td_content += '(+' + col[4] + ')';
			td_content += '</small></div>';
		}
	} else {
		td_content += '<div>';
		if (col[0] !== null) {
			td_content += '<a href="/submission/' + col[2] + '" class="uoj-score" style="color:' + getColOfScore(col[0]) + '">';
			td_content += col[0];
			td_content += '</a>';

			td_title += "得分：" + col[0] + " 分";
			td_title += "\n" + col[3] + " 次有效提交";

			if (col[5] > 0) {
				td_content += ' + ';
				td_title += "\n" + "因封榜有 " + col[5] + " 次提交结果未知";
			}
		} else {
			td_title += "封榜后提交了 " + col[5] + " 次，结果未知";
		}
		if (col[5] > 0) {
			td_content += '<strong class="text-muted">?</strong>';
		}
		td_content += '</div>';
		
		if (col[0] > 0) {
			let orig_penalty = col[1] - col[4] * 60 * 20;
			td_content += '<div><small>' + getPenaltyTimeStr(orig_penalty) + '</small></div>';

			if (col[4] > 0) {
				td_title += "\n" + col[4] + " 次提交计入罚时";
			}
			td_title += "\n" + "罚时：" + orig_penalty;
			if (col[4] > 0) {
				td_title += " + " + col[4] + " × 1200 = " + col[1];
			}
			td_title += "，即 " + getPenaltyTimeStr(orig_penalty);
		}

		if (col[4] > 0) {
			td_content += '<div><small>';
			td_content += '(+' + col[4] + ')';
			td_content += '</small></div>';
		}
	}

	if (meta.stat[problems[i]].earliest === col[2]) {
		$(td).addClass('first-blood table-success');
	}

	return $(td).attr('title', td_title).html(td_content);
}

// standings
function showStandings() {
	if (contest_rule == 'OI' || contest_rule == 'IOI' || after_contest) {
		$("#standings").long_table(
			standings,
			1,
			'<tr>' +
				'<th style="width:5em">#</th>' +
				'<th style="width:14em">'+uojLocale('username')+'</th>' +
				'<th style="width:5em">'+uojLocale('contests::total score')+'</th>' +
				$.map(problems, function(col, idx) {
					return '<th style="width:8em;">' + '<a href="/contest/' + contest_id + '/problem/' + col + '">' + String.fromCharCode('A'.charCodeAt(0) + idx) + '</a>' + '</th>';
				}).join('') +
			'</tr>',
			function(row) {
				var col_tr = '';
				if (myname != row[2][0]) {
					col_tr += '<tr>';
				} else {
					col_tr += '<tr class="table-warning">';
				}
				col_tr += '<td>' + row[3] + '</td>';
				col_tr += '<td>' + getUserLink(row[2][0], row[2][1], row[2][3]) + '</td>';
				col_tr += '<td>' + '<div><span class="uoj-score" data-max="' + problems.length * 100 + '" style="color:' + getColOfScore(row[0] / problems.length) + '">' + row[0] + '</span></div>' + (after_contest ? '' : '<div class="small">' + getPenaltyTimeStr(row[1]) + '</div>') + '</td>';
				for (var i = 0; i < problems.length; i++) {
					col_tr += '<td>';
					col = score[row[2][0]][i];
					if (col != undefined) {
						col_tr += '<div><a href="/submission/' + col[2] + '" class="uoj-score" style="color:' + getColOfScore(col[0]) + '">' + col[0] + '</a></div>';
						if (!after_contest) {
							if (standings_version < 2) {
								col_tr += '<div class="small">' + getPenaltyTimeStr(col[1]) + '</div>';
							} else {
								if (col[0] > 0) {
									col_tr += '<div class="small">' + getPenaltyTimeStr(col[1]) + '</div>';
								}
							}
						}
					}
					col_tr += '</td>';
				}
				col_tr += '</tr>';
				return col_tr;
			}, {
				div_classes: standings_config.div_classes ? standings_config.div_classes : ['table-responsive', 'card', 'my-3'],
				table_classes: standings_config.table_classes ? standings_config.table_classes : ['table', 'table-bordered', 'text-center', 'align-middle', 'uoj-table', 'uoj-standings-table', 'mb-0'],
				page_len: standings_config.page_len ? standings_config.page_len : 50,
				top_pagination: true,
				print_after_table: function() {
					return '<div class="card-footer bg-transparent text-end text-muted">' + uojLocale("contests::n participants", standings.length) + '</div>';
				}
			}
		);
	} else if (contest_rule == 'ACM') {
		var meta = getACMStandingsMeta();
		var header = $('<tr />');
		for (let i = -3; i < problems.length; i++) {
			header.append(setACMStandingsTH(document.createElement('th'), i, meta));
		}

		$("#standings").long_table(
			standings,
			1,
			header,
			function(row) {
				var tr = $('<tr />'); // .css('height', '57px');
				if (myname == row[2][0]) {
					tr.addClass('table-warning');
				}
				for (let i = -3; i < problems.length; i++) {
					tr.append(setACMStandingsTD(document.createElement('td'), row, i, meta));
				}
				return tr;
			}, {
				div_classes: standings_config.div_classes ? standings_config.div_classes : ['table-responsive', 'card', 'my-3'],
				table_classes: standings_config.table_classes ? standings_config.table_classes : ['table', 'table-bordered', 'text-center', 'align-middle', 'uoj-table', 'uoj-standings-table', 'mb-0'],
				page_len: standings_config.page_len ? standings_config.page_len : 50,
				top_pagination: true,
				print_after_table: function() {
					return '<div class="card-footer bg-transparent text-end text-muted">' + uojLocale("contests::n participants", standings.length) + '</div>';
				}
			}
		);
	}
}

// PDF
$(document).ready(function() {
	$('div[data-pdf]').each(function() {
		$(this).append(
			$('<div class="uoj-pdf-loading-spinner border d-flex flex-column justify-content-center align-items-center" style="width: 100%; height: 350px;" />')
				.append('<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />')
				.append('<div class="mt-3">Loading PDF...</div>')
			);
	});

	if ($('div[data-pdf]').length > 0) {
		$LAB.script('/js/pdf.js').wait(function() {
			pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.js';

			// Support HiDPI-screens.
			var outputScale = window.devicePixelRatio || 1;

			$('div[data-pdf]').each(function() {
				var _this = $(this);
				var pdf_src = $(this).data('src');

				$(this).css('width', '100%').css('height', '100%');

				var task = pdfjsLib.getDocument({
					url: pdf_src,
					cMapUrl: '/fonts/pdfjs-cmaps/',
					cMapPacked: true,
				});
				var id = 'pdf_' + task.docId;

				$(this).attr('id', id + '_container');

				task.promise.then(function(pdf) {
					for (var i = 1; i <= pdf.numPages; i++) {
						$(_this).append('<canvas id="' + id + '_page_' + i + '" class="pdf-page-canvas"></canvas>');

						pdf.getPage(i).then(function(page) {
							var viewport = page.getViewport({
								scale: 2.5,
							});

							var canvas = document.getElementById(id + '_page_' + page.pageNumber);

							canvas.height = Math.floor(viewport.height * outputScale);
							canvas.width = Math.floor(viewport.width * outputScale);

							var transform = outputScale !== 1
								? [outputScale, 0, 0, outputScale, 0, 0]
								: null;

							page.render({
								canvasContext: canvas.getContext('2d'),
								viewport: viewport,
								transform: transform,
							});
						});
					}

					$('.uoj-pdf-loading-spinner', _this).remove();
				});
			});
		});
	}
});

// Tooltip
$(document).ready(function() {
	bootstrap.Tooltip.jQueryInterface.call($('[data-bs-toggle="tooltip"]'));
});

// Popovers
$(document).ready(function() {
	bootstrap.Popover.jQueryInterface.call($('[data-bs-toggle="popover"]'));
});

// Copy button
$(document).ready(function() {
	$('.markdown-body pre:not(:has(code.language-format)), .copy-button-container pre').each(function () {
		var thisEl = $(this);

		$(this).wrap(
			$('<div class="wrapped-copy-button-container" style="position: relative;"></div>')
		).parent().prepend(
			$(
				'<div style="position: absolute; right: 0; top: 0; margin-top: 0.75rem; margin-right: 0.75rem; font-size: 0.85em;"></div>'
			).append(
				$('<button style="position: relative; background: transparent; border: 0;"></button>')
					.click(function () {
						navigator.clipboard
							.writeText($(thisEl).text())
							.then(() => {
								$(this).html('<i class="bi bi-check2 text-success"></i>');
	
								setTimeout(() => {
									$(this).html('<i class="bi bi-clipboard text-muted"></i>');
								}, 1000);
							})
							.catch(() => {
								$(this).html('<i class="bi bi-x-lg text-danger"></i>');
	
								setTimeout(() => {
									$(this).html('<i class="bi bi-clipboard text-muted"></i>');
								}, 1000);
							});
					})
					.append('<i class="bi bi-clipboard text-muted"></i>')
			)
		);
	});	
});

/**
 * Fallback user avatar
 */
$(document).ready(function() {
	$('img.uoj-user-avatar').on('error', function() {
		// same as gravatar d=mm
		$(this).attr('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4NzIgODcyIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMCAwaDg3MnY4NzJIMHoiLz48cGF0aCBmaWxsPSIjYzVjNWM1IiBkPSJNMCAwdjg3MmgxMTBhMzI3IDM4MyAwIDAxMjM2LTM0NSAxOTUgMTk1IDAgMDEtMTA0LTE3MiAxOTUgMTk1IDAgMDExOTUtMTk1IDE5NSAxOTUgMCAwMTE5NSAxOTUgMTk1IDE5NSAwIDAxLTEwNiAxNzMgMzI3IDM4MyAwIDAxMjM2IDM0NGgxMTBWMHoiLz48L3N2Zz4=');
	});
});

function getPreferredTheme() {
	if (!('localStorage' in window)) return 'light';

	var storedTheme = localStorage.getItem('theme');

	if (storedTheme) {
		return storedTheme;
	}

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Theme toggler
 */
(function() {
	if (!('localStorage' in window)) return;

	var storedTheme = localStorage.getItem('theme');

	function setTheme(theme) {
		if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.setAttribute('data-bs-theme', 'dark');
			update_monaco_theme('dark');
		} else {
			document.documentElement.setAttribute('data-bs-theme', theme);
			update_monaco_theme(theme == 'auto' ? 'light' : theme);
		}
	}

	setTheme(getPreferredTheme());

	function showActiveTheme(theme) {
		var currentIcon = $('.theme-icon-active').attr('data-icon');
		var newIcon = $('[data-bs-theme-value="' + theme +'"] .theme-icon').attr('data-icon');

		$('[data-bs-theme-value]').removeClass('active');
		$('[data-bs-theme-value="' + theme +'"]').addClass('active');
		$('.theme-icon-active')
			.removeClass(currentIcon)
			.addClass(newIcon)
			.attr('data-icon', newIcon);
	}

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
		if (storedTheme !== 'light' || storedTheme !== 'dark') {
			setTheme(getPreferredTheme());
		}
	});

	$(document).ready(function() {
		showActiveTheme(getPreferredTheme());

		$('[data-bs-theme-value]').click(function() {
			var theme = $(this).data('bs-theme-value');

			localStorage.setItem('theme', theme);
			setTheme(theme);
			showActiveTheme(theme);
		});
	});
})();
