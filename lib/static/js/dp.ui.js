'use strict';

/* eslint-disable */

if (!dp) var dp = {};

dp.ui = {
  _initiated: false,
  init(obj) {
    if (!obj && dp.ui._initiated) return;
    dp.ui._initiated = true;
    dp.ui.element.init(obj);
  },
  util: {
    _alert_template: undefined,
    alert_focus: undefined,
    alert(a, b, c, d, e) {
      if (dp.ui.util._alert_template == undefined) {
        dp.ui.util._alert_template = dp_jqlib('<div />').addClass('dp4css-alert');
        dp.ui.util._alert_template.append(dp_jqlib('<div />').addClass('_bg'));

        const _box = dp_jqlib('<div />').addClass('_box');

        _box.append(dp_jqlib('<div />').addClass('_msg'));
        _box.append(dp_jqlib('<div />').addClass('_ico').text('!'));
        _box.append(dp_jqlib('<div />').addClass('_btn'));

        dp.ui.util._alert_template.append(_box);
      }

      const template = dp.ui.util._alert_template.clone();
      template.attr('id', `uniqid-${dp.helper.string.uniqid()}`);

      const bg = template.find('._bg');
      const message = template.find('._msg');
      const button = template.find('._btn');
      const box = template.find('._box');

      let _msg;
      let _msg_html;
      const _buttons = [];

      if (typeof a === 'object' && !b && !c && !d && !e) {
        if (a.message && a.html) {
          _msg_html = a.message;
        } else if (a.message) {
          _msg = a.message;
        }

        if (a.buttons) {
          for (const i in a.buttons) {
            _buttons.push([a.buttons[i][0], a.buttons[i][1]]);
          }
        }
      } else if (typeof a === 'string' && !b && !c && !d && !e) {
        _msg = a;

        if (b === null) {

        } else {
          _buttons.push(['OK', undefined]);
        }
      } else if (typeof a === 'string' && typeof b === 'string' && !c && !d && !e) {
        _msg = a;
        _buttons.push([b, undefined]);
      } else if (typeof a === 'string' && typeof b === 'function' && !c && !d && !e) {
        _msg = a;
        _buttons.push(['OK', b]);
      } else if (typeof a === 'string' && typeof b === 'function' && typeof c === 'string' && !d && !e) {
        _msg = a;
        _buttons.push([c, b]);
      } else if (typeof a === 'string' && typeof b === 'function' && typeof c === 'function' && !d && !e) {
        _msg = a;
        _buttons.push(['OK', b]);
        _buttons.push(['Cancel', c]);
      } else if (typeof a === 'string' && typeof b === 'function' && typeof c === 'string' && typeof d === 'function' && !e) {
        _msg = a;
        _buttons.push([c, b]);
        _buttons.push(['Cancel', d]);
      } else if (typeof a === 'string' && typeof b === 'function' && typeof c === 'string' && typeof d === 'function' && typeof e === 'string') {
        _msg = a;
        _buttons.push([c, b]);
        _buttons.push([e, d]);
      }

      if (_msg_html) {
        message.html(_msg_html);
      } else if (_msg) {
        message.text(_msg);
        message.html(message.text().replace(/\n/gi, '<br />'));
      }

      let box_height = 0;
      const pongdang = 15;
      let delegate;

      const _dismiss = function () {
        box.animate({
          'margin-top': `${((box_height / 2) + 30) * -1}px`,
        }, 150, () => {
          box.animate({
            'margin-top': `${((box_height / 2) - 70) * -1}px`,
            opacity: 0,
          }, 150);

          bg.fadeTo(300, 0, () => {
            template.remove();

            if (dp.ui.util.alert_focus) {
              dp.ui.util.alert_focus.focus();
              dp.ui.util.alert_focus = undefined;
            }

            if (delegate) {
              delegate(template);
            }
          });
        });
      };

      dp_jqlib(_buttons).each((k, e) => {
        const btn = dp_jqlib('<button />');
        btn.addClass(`_i-${k}`);
        btn.text(e[0]);
        btn.click(() => {
          if (e[1] && typeof e[1] === 'function') {
            delegate = e[1];
          }

          _dismiss();
        });

        button.append(btn);
      });

      dp_jqlib('body').append(template);

      box_height = box.height();

      const bg_opacity = parseFloat(bg.css('opacity'));

      bg.fadeTo(0, 0.001);
      box.fadeTo(0, 0.001);
      box.css('margin-top', `${((box_height / 2) + 70) * -1}px`);

      bg.fadeTo(200, bg_opacity);
      box.delay(50).animate({
        'margin-top': `${((box_height / 2) - 10) * -1}px`,
        opacity: 1.0,
      }, 200, () => {
        box.animate({
          'margin-top': `${(box_height / 2 + 5) * -1}px`,
        }, 150, () => {
          box.animate({
            'margin-top': `${(box_height / 2) * -1}px`,
          }, 150);
        });
      });

      if (button) {
        button.find('._i-0').focus();
      }

      return template;
    },
    noti(a, b, c, d) {
      alert('not implemented yet.');
    },
  },
  element: {
    init(obj) {
      dp.ui.element.input.delegate.on_return(obj);
      dp.ui.element.input.delegate.on_focus(obj);
      dp.ui.element.input.delegate.on_focusout(obj);
      dp.ui.element.input.delegate.on_keyup(obj);
      dp.ui.element.input.delegate.on_keydown(obj);
      dp.ui.element.input.delegate.on_paste(obj);
    },
    input: {
      delegate: {
        on_return(obj) {
          if (!obj) obj = dp_jqlib('body');
          obj.find('input[dp-on-return][dp-on-return-installed!=yes]').each(function () {
            const _id = dp_jqlib(this).attr('id') || `uniqid-${dp.helper.string.uniqid()}`;

            dp_jqlib(this).attr('id', _id);
            dp_jqlib(this).attr('dp-on-return-installed', 'yes');

            dp_jqlib(this).keypress(function (e) {
              if (dp_jqlib(this).attr('dp-on-return-busy') == 'yes') {
                return;
              }

              if (e.keyCode == 13) {
                let delegate;

                try {
                  delegate = eval(dp_jqlib(this).attr('dp-on-return'));
                } catch (_) {}

                if (delegate && typeof delegate === 'function') {
                  dp_jqlib(this).attr('dp-on-return-busy', 'yes');
                  setTimeout(delegate(dp_jqlib(this)), 0);
                  setTimeout(`dp_jqlib('#${_id}').attr('dp-on-return-busy', 'no');`, 150);

                  e.preventDefault();
                }
              }
            });
          });
        },
        on_focus(obj) {
          if (!obj) obj = dp_jqlib('body');
          obj.find('input[dp-on-focus][dp-on-focus-installed!=yes],textarea[dp-on-focus][dp-on-focus-installed!=yes]').each(function () {
            const _id = dp_jqlib(this).attr('id') || `uniqid-${dp.helper.string.uniqid()}`;

            dp_jqlib(this).attr('id', _id);
            dp_jqlib(this).attr('dp-on-focus-installed', 'yes');

            dp_jqlib(this).focus(function (e) {
              let delegate;

              try {
                delegate = eval(dp_jqlib(this).attr('dp-on-focus'));
              } catch (_) {}

              if (delegate && typeof delegate === 'function') {
                setTimeout(delegate(dp_jqlib(this), e), 0);
              }
            });
          });
        },
        on_focusout(obj) {
          if (!obj) obj = dp_jqlib('body');
          obj.find('input[dp-on-focusout][dp-on-focusout-installed!=yes],textarea[dp-on-focusout][dp-on-focusout-installed!=yes]').each(function () {
            const _id = dp_jqlib(this).attr('id') || `uniqid-${dp.helper.string.uniqid()}`;

            dp_jqlib(this).attr('id', _id);
            dp_jqlib(this).attr('dp-on-focusout-installed', 'yes');

            dp_jqlib(this).focusout(function (e) {
              let delegate;

              try {
                delegate = eval(dp_jqlib(this).attr('dp-on-focusout'));
              } catch (_) {}

              if (delegate && typeof delegate === 'function') {
                setTimeout(delegate(dp_jqlib(this), e), 0);
              }
            });
          });
        },
        on_keyup(obj) {
          if (!obj) obj = dp_jqlib('body');
          obj.find('input[dp-on-keyup][dp-on-keyup-installed!=yes],textarea[dp-on-keyup][dp-on-keyup-installed!=yes]').each(function () {
            const _id = dp_jqlib(this).attr('id') || `uniqid-${dp.helper.string.uniqid()}`;

            dp_jqlib(this).attr('id', _id);
            dp_jqlib(this).attr('dp-on-keyup-installed', 'yes');

            dp_jqlib(this).keyup(function (e) {
              let delegate;
              try {
                delegate = eval(dp_jqlib(this).attr('dp-on-keyup'));
              } catch (_) {}

              if (delegate && typeof delegate === 'function') {
                setTimeout(delegate(dp_jqlib(this), e), 0);
              }
            });
          });
        },
        on_keydown(obj) {
          if (!obj) obj = dp_jqlib('body');
          obj.find('input[dp-on-keydown][dp-on-keydown-installed!=yes],textarea[dp-on-keydown][dp-on-keydown-installed!=yes]').each(function () {
            const _id = dp_jqlib(this).attr('id') || `uniqid-${dp.helper.string.uniqid()}`;

            dp_jqlib(this).attr('id', _id);
            dp_jqlib(this).attr('dp-on-keydown-installed', 'yes');

            dp_jqlib(this).keydown(function (e) {
              let delegate;
              try {
                delegate = eval(dp_jqlib(this).attr('dp-on-keydown'));
              } catch (_) {}

              if (delegate && typeof delegate === 'function') {
                setTimeout(delegate(dp_jqlib(this), e), 0);
              }
            });
          });
        },
        on_paste(obj) {
          if (!obj) obj = dp_jqlib('body');
          obj.find('input[dp-on-paste][dp-on-paste-installed!=yes],textarea[dp-on-paste][dp-on-paste-installed!=yes]').each(function () {
            const _id = dp_jqlib(this).attr('id') || `uniqid-${dp.helper.string.uniqid()}`;

            dp_jqlib(this).attr('id', _id);
            dp_jqlib(this).attr('dp-on-paste-installed', 'yes');

            this.addEventListener('paste', function (e) {
              let delegate;
              try {
                delegate = eval(dp_jqlib(this).attr('dp-on-paste'));
              } catch (_) {}

              if (delegate && typeof delegate === 'function') {
                let clipboardData; let pastedData;

                try {
                  clipboardData = e.clipboardData || window.clipboardData;
                  pastedData = clipboardData.getData('Text');
                } catch (_) {}

                delegate(dp_jqlib(this), e, pastedData);
              }
            });
          });
        },
      },
    },
  },
};

dp_init(() => {
  dp.init();
});
