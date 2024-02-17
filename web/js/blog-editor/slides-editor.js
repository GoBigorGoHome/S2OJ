// 这个文件要和 slides-editor.php 联合起来看
function slides_editor_init(name) {
	var input_title = $('#input-' + name + '_title');
	var input_tags = $('#input-' + name + '_tags');
	var input_content_md = $('#input-' + name + '_content_md');
	var input_is_hidden = $('#input-' + name + '_is_hidden');
	var this_form = input_is_hidden[0].form;
	var div_container_editor = $('#div_container-' + name + '_content_md');

	var is_saved;
	var last_save_done = true;

	function set_saved(val) {
		is_saved = val;
		if (val) {
			save_btn.removeClass('btn-warning');
			save_btn.addClass('btn-success');
			save_btn.html('<i class="bi bi-save-fill"></i>');
			before_window_unload_message = null;
		} else {
			save_btn.removeClass('btn-success');
			save_btn.addClass('btn-warning');
			save_btn.html('<i class="bi bi-save"></i>');
			before_window_unload_message = '您所编辑的内容尚未保存';
		}
	}

	function set_preview_status(status) {
		// 0: normal
		// 1: loading
		// 2: loaded
		if (status == 0) {
			for (var i = 0; i < all_btn.length; i++) {
				all_btn[i].prop('disabled', false);
			}
		} else if (status == 1) {
			for (var i = 0; i < all_btn.length; i++) {
				all_btn[i].prop('disabled', true);
			}
		}
	}

	var save_btn;
	var slide_show_btn;
	var all_btn;

	// init buttons
	function onMounted() {
		var btn = $('#slides_editor_save_button');
		save_btn = $(btn[0]);
		var btn2 = $('#enter_slide_show_mode_button');
		slide_show_btn = $(btn2[0]);

		bootstrap.Tooltip.jQueryInterface.call(save_btn, {
			container: 'body',
			trigger: 'hover',
			title: '保存', //TODO：Ctrl-S 快捷键
		});

		// FIXME: 点击播放按钮进入 slide show mode 后，播放按钮的 tooltip 不消失。
		// bootstrap.Tooltip.jQueryInterface.call(slide_show_btn, {
		// 	container: 'body',
		// 	trigger: 'hover',
		// 	title: '播放 (Ctrl-D)',
		// });

		save_btn.click(function () {
			save();
		});

		all_btn = [save_btn, slide_show_btn];
		set_saved(true);
	}

	/* jQuery API:
    a.wrap(b) 是用b把a包住。
    a.prepend(b) 是把b放进a里面并且是放在最前面。
    a.append(b) 是把b放进a里面并且是放在最后面。
    */

	// init editor
	if (input_content_md[0]) {
		div_container_editor.empty();

		div_container_editor.wrap(
			'<div class="blog-content-md-editor border rounded" />'
		);

		div_container_editor.wrap(
			'<div class="blog-content-md-editor-in rounded-bottom overflow-hidden" />'
		);

		div_container_editor.append(
			$(
				'<div class="d-flex justify-content-center align-items-center" style="width: 100%; height: 500px;" />'
			).append(
				'<div class="spinner-border text-muted" style="width: 3rem; height: 3rem;" />'
			)
		);

		const on_change = (md_content) => {
			set_saved(false);
			input_content_md.val(md_content);
		};

		const on_enter_slide_show_mode = () => {
			save({ need_preview: true });
			$('#buttons-below-slides-editor').hide();
		};

		const on_exit_slide_show_mode = () => {
			$('#buttons-below-slides-editor').show();
		};

		MarkSlidesLibrary.edit_and_play(
			input_content_md.val(),
			div_container_editor[0],
			'calc(100vh - 440px)',
			on_change,
			on_enter_slide_show_mode,
			on_exit_slide_show_mode,
			onMounted
		);
	}

	function save(config) {
		if (config == undefined) {
			config = {};
		}
		config = $.extend(
			{
				need_preview: false,
				fail: function () {},
				done: function () {},
			},
			config
		);

		if (!last_save_done) {
			config.fail();
			config.done();
			return;
		}
		last_save_done = false;

		if (config.need_preview) {
			set_preview_status(1);
		}

		var post_data = {};
		$($(this_form).serializeArray()).each(function () {
			post_data[this['name']] = this['value'];
		});
		if (config.need_preview) {
			post_data['need_preview'] = 'on';
		}
		post_data['save-' + name] = '';

		$.ajax({
			type: 'POST',
			data: post_data,
			url: window.location.href,
			success: function (data) {
				try {
					data = JSON.parse(data);
				} catch (e) {
					alert(data);
					if (config.need_preview) {
						set_preview_status(0);
					}
					config.fail();
					return;
				}
				var ok = true;
				$(['title', 'content_md', 'tags']).each(function () {
					ok &= showErrorHelp(name + '_' + this, data[this]);
				});

				if (data.extra !== undefined) {
					alert(data.extra);
					ok = false;
				}

				if (!ok) {
					if (config.need_preview) {
						set_preview_status(0);
					}
					config.fail();
					return;
				}

				set_saved(true);

				if (data.blog_write_url) {
					window.history.replaceState({}, document.title, data.blog_write_url);
				}
				if (data.blog_url) {
					$('#a-' + name + '_view_blog')
						.attr('href', data.blog_url)
						.show();
				}
				if (data.blog_id) {
					$('#div-blog-id')
						.html('<small>博客 ID：<b>' + data.blog_id + '</b></small>')
						.show();
				}
			},
		})
			.fail(function () {
				if (config.need_preview) {
					set_preview_status(0);
				}
				config.fail();
			})
			.always(function () {
				last_save_done = true;
				config.done();
			});
	}

	// event
	$.merge(input_title, input_tags).on('input', function () {
		set_saved(false);
	});

	$('#a-' + name + '_save').click(function (e) {
		e.preventDefault();
		save({
			done: function () {
				location.reload();
			},
		});
	});

	input_is_hidden.on('switchChange.bootstrapSwitch', function (e, state) {
		var ok = true;
		if (!state && !confirm('你确定要公开吗？')) {
			ok = false;
		}
		if (!ok) {
			input_is_hidden.bootstrapSwitch('toggleState', true);
		} else {
			input_is_hidden.bootstrapSwitch('readonly', true);
			var succ = true;
			save({
				fail: function () {
					succ = false;
				},
				done: function () {
					input_is_hidden.bootstrapSwitch('readonly', false);
					if (!succ) {
						input_is_hidden.bootstrapSwitch('toggleState', true);
					}
				},
			});
		}
	});

	// init hot keys
	$(document).bind('keydown', 'ctrl+d', function () {
		slide_show_btn.click();
		return false;
	});

	$.merge(input_title, input_tags).bind('keydown', 'ctrl+s', function () {
		save_btn.click();
		return false;
	});

	if (this_form) {
		$(this_form).submit(function () {
			before_window_unload_message = null;
		});
	}
}