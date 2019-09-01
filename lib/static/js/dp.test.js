/* eslint-disable */

'use strict';

if (!dp) var dp = {};

dp.test = {
  failed: false,
  init() {
    const wait = 10;

    dp_assert(() => _el('#input-test').length, 'test-el');

    dp_assert(dp.helper.string.uniqid(), 'test-uniqid');
    dp_assert(dp.helper.string.uniqid('prefix_'), 'test-uniqid-with-prefix');
    dp_assert(dp.helper.string.uniqid('prefix_', true), 'test-uniqid-with-entropy');
    dp_assert(dp.helper.string.uniqid('prefix_', true, '-'), 'test-uniqid-with-entropy-separator');

    const temp_prefix = dp.vars.prefix;

    dp.vars.prefix = '/front';

    dp_assert(dp.helper.prefixize('/front') === '/', 'helper-prefixize-global-prefix');
    dp_assert(dp.helper.prefixize('/front/') === '/', 'helper-prefixize-global-prefix');
    dp_assert(dp.helper.prefixize('/front/foo/bar') === '/foo/bar', 'helper-prefixize-global-prefix');

    dp.vars.prefix = undefined;

    dp_assert(dp.helper.prefixize('/front/foo/bar') === '/front/foo/bar', 'helper-prefixize-no-prefix');
    dp_assert(dp.helper.prefixize('/front/foo/bar', '/front') === '/foo/bar', 'helper-prefixize-with-prefix');
    dp_assert(dp.helper.prefixize('/front/foo/bar', '/front/') === '/foo/bar', 'helper-prefixize-with-prefix-slash');
    dp_assert(dp.helper.prefixize('/front', '/front') === '/', 'helper-prefixize-with-prefix');
    dp_assert(dp.helper.prefixize('/front', '/front/') === '/', 'helper-prefixize-with-prefix-slash');

    dp.vars.prefix = temp_prefix;

    dp_assert(dp.helper.validator.email('email@valid.com'), 'helper-validator-email');
    dp_assert(dp.helper.validator.email('email@.invalid.com') == false, 'helper-validator-email');

    dp_assert(dp.helper.validator.url('http://www.google.com'), 'helper-validator-url');
    dp_assert(dp.helper.validator.url('http://www.google'), 'helper-validator-url');
    dp_assert(dp.helper.validator.url('http://123.123.123.123'), 'helper-validator-url');
    dp_assert(dp.helper.validator.url('http://123.123.123.256') == false, 'helper-validator-url');
    dp_assert(dp.helper.validator.url('https://www.google.') == false, 'helper-validator-url');

    dp_assert(dp.helper.string.replaceAll('abcd', 'a', '-') === '-bcd', 'helper-string-replaceAll');

    const a_wait = 280;
    const a_done = 550;
    const an_done = 700;

    // dp.req

    const r1 = dp.req(_el('#req-test-case-1'), {
      before() {
        return false;
      },
    });

    dp_assert(r1 == false, 'helper-req-before-false');

    //

    _el('#req-test-case-1 input[name="email"]').val('');

    const r2 = dp.req(_el('#req-test-case-1'));

    setTimeout(() => {
      dp_assert(r2.find('._msg').text() == _el('#req-test-case-1 input[name="email"]').attr('dp-req-missing'), 'helper-req-field-missing');
      dp_jqlib(r2.find('button').get(0)).trigger('click');
    }, a_done);

    //

    _el('#req-test-case-1 input[name="email"]').val('invalid@email@address.com');

    const r3 = dp.req(_el('#req-test-case-1'));

    setTimeout(() => {
      dp_assert(r3.find('._msg').text() == _el('#req-test-case-1 input[name="email"]').attr('dp-req-invalid'), 'helper-req-field-invalid');
      dp_jqlib(r3.find('button').get(0)).trigger('click');
    }, a_done);

    //

    _el('#req-test-case-1 input[name="email"]').val('john@email.com');

    const r4 = dp.req(_el('#req-test-case-1'), {
      success(data) {
        dp_assert(data.result, 'helper-req-field-confirm-response-success');
      },
      error() {
        dp_assert(false, 'helper-req-field-confirm-response-error');
      },
    });

    setTimeout(() => {
      dp_assert(r4.find('._msg').text() == _el('#req-test-case-1 button').attr('dp-req-confirm'), 'helper-req-field-confirm');
      dp_jqlib(r4.find('button').get(0)).trigger('click');
    }, a_done);

    //

    const r5 = dp.req(_el('#req-test-case-1'));

    dp_assert(r5 == false, 'helper-req-no-multiple');

    //

    _el('#req-test-case-1 button').attr('dp-req-multiple', 'yes');

    const r6 = dp.req(_el('#req-test-case-1'));
    const r7 = dp.req(_el('#req-test-case-1'));

    setTimeout(() => {
      dp_assert(r6.find('._msg').text() == _el('#req-test-case-1 button').attr('dp-req-confirm'), 'helper-req-multiple-first');
      dp_jqlib(r6.find('button').get(1)).trigger('click');
    }, a_done);

    setTimeout(() => {
      dp_assert(r7.find('._msg').text() == _el('#req-test-case-1 button').attr('dp-req-confirm'), 'helper-req-multiple-second');
      dp_jqlib(r7.find('button').get(1)).trigger('click');
    }, a_done);

    //

    const r8_id = dp.helper.string.uniqid();
    _el('#req-test-case-1').clone().attr('id', r8_id).appendTo(_el('body'));
    _el(`#${r8_id} input[name="name"]`).val('short');

    const r8 = dp.req(_el(`#${r8_id}`));

    setTimeout(() => {
      dp_assert(r8.find('._msg').text() == _el(`#${r8_id} input[name="name"]`).attr('dp-req-invalid'), 'helper-req-field-too-short');
      dp_jqlib(r8.find('button').get(0)).trigger('click');

      _el(`#${r8_id}`).remove();
    }, a_done);

    //

    const r9_id = dp.helper.string.uniqid();
    _el('#req-test-case-1').clone().attr('id', r9_id).appendTo(_el('body'));
    _el(`#${r9_id} input[name="name"]`).val('too loooooooooooooooooong');

    const r9 = dp.req(_el(`#${r8_id}`));

    setTimeout(() => {
      dp_assert(r9.find('._msg').text() == _el(`#${r9_id} input[name="name"]`).attr('dp-req-invalid'), 'helper-req-field-too-long');
      dp_jqlib(r9.find('button').get(0)).trigger('click');

      _el(`#${r9_id}`).remove();
    }, a_done);

    // dp.alert

    setTimeout(() => {
      const a1 = dp.alert('text message', 'Okay');

      setTimeout(() => {
        dp_assert(a1.length > 0, 'helper-alert-msg-confirm');
        dp_jqlib(a1.find('button').get(0)).trigger('click');
      }, a_done);
    }, 10);

    setTimeout(() => {
      let a2_done = false;
      const a2 = dp.alert('text message\nwith confirm delegate', () => {
        a2_done = true;
      });

      setTimeout(() => {
        dp_jqlib(a2.find('button').get(0)).trigger('click');

        setTimeout(() => {
          dp_assert(a2_done, 'helper-alert-msg-cf-delegate!');
        }, an_done);
      }, a_done);
    }, a_wait);

    setTimeout(() => {
      let a3_done = false;
      const a3 = dp.alert('text message with\nconfirm and dismiss delegate', () => {
        a3_done = false;
      }, () => {
        a3_done = true;
      });

      setTimeout(() => {
        dp_jqlib(a3.find('button').get(1)).trigger('click');

        setTimeout(() => {
          dp_assert(a3_done, 'helper-alert-msg-cf-delegate-ds-delegate');
        }, an_done);
      }, a_done);
    }, a_wait * 2);

    setTimeout(() => {
      let a4_done = false;
      const a4 = dp.alert('text message with\nconfirm text and delegate,\ndismiss delegate', () => {
        a4_done = true;
      }, 'Okay', () => {
        a4_done = false;
      });

      setTimeout(() => {
        a4.find('button').each((i, e) => {
          if (dp_jqlib(e).text() == 'Okay') {
            dp_jqlib(e).trigger('click');
            return false;
          }
        });

        setTimeout(() => {
          dp_assert(a4_done, 'helper-alert-msg-cf-text-delegate-ds-delegate');
        }, an_done);
      }, a_done);
    }, a_wait * 3);

    setTimeout(() => {
      let a5_done = false;
      const a5 = dp.alert('text message with\nconfirm text and delegate,\ndismiss text and delegate', () => {
        a5_done = false;
      }, 'Okay', () => {
        a5_done = true;
      }, 'Dismiss');

      setTimeout(() => {
        a5.find('button').each((i, e) => {
          if (dp_jqlib(e).text() == 'Dismiss') {
            dp_jqlib(e).trigger('click');
            return false;
          }
        });

        setTimeout(() => {
          dp_assert(a5_done, 'helper-alert-msg-cf-text-delegate-ds-text-delegate');
        }, an_done);
      }, a_done);
    }, a_wait * 4);

    setTimeout(() => {
      let a6_done = false;
      const a6 = dp.alert({
        message: 'html message <b>this is bold</b>',
        html: true,
        buttons: [
          ['button 1', function () {
            a6_done = false;
          }],
          ['button 2', function () {
            a6_done = true;
          }],
          ['button 3', function () {
            a6_done = false;
          }],
        ],
      });

      setTimeout(() => {
        a6.find('button').each((i, e) => {
          if (dp_jqlib(e).text() == 'button 2') {
            dp_jqlib(e).trigger('click');
            return false;
          }
        });

        setTimeout(() => {
          dp_assert(a6_done, 'helper-alert-custom');
        }, an_done);
      }, a_done);
    }, a_wait * 5);

    dp_assert(
      () => dp.test.ui.element.input.delegate.on_focus_called,
      'test-ui-element-input-delegate-on-focus',
      () => {
        _el('#input-test').focus();
      },
      wait,
    );

    dp_assert(
      () => dp.test.ui.element.input.delegate.on_focusout_called,
      'test-ui-element-input-delegate-on-focusout',
      () => {
        _el('#input-test').focus();
        _el('#input-test-2').focus();
      },
      wait,
    );

    dp_assert(
      () => dp.test.ui.element.input.delegate.on_return_called,
      'test-ui-element-input-delegate-on-return',
      () => {
        const e = dp_jqlib.Event('keypress');
        e.keyCode = 13;

        _el('#input-test').trigger(e);
      },
      wait,
    );

    dp_assert(
      () => dp.test.ui.element.input.delegate.on_keydown_called,
      'test-ui-element-input-delegate-on-keydown',
      () => {
        const e = dp_jqlib.Event('keydown');
        e.keyCode = 65;

        _el('#input-test').trigger(e);
      },
      wait,
    );

    setTimeout(() => {
      dp_assert(!dp.test.failed, 'all-test-cases');

      if (!dp.test.failed) {
        dp_jqlib('<h3 />').attr('id', 'result-message').text('succeed').appendTo('body');
      }
    }, wait * 500);
  },
  ui: {
    element: {
      input: {
        delegate: {
          on_return_called: false,
          on_return() {
            dp.test.ui.element.input.delegate.on_return_called = true;
            console.log('* dp.test.ui.element.input.delegate.on_return called.');
          },
          on_focus_called: false,
          on_focus() {
            dp.test.ui.element.input.delegate.on_focus_called = true;
            console.log('* dp.test.ui.element.input.delegate.on_focus called.');
          },
          on_focusout_called: false,
          on_focusout() {
            dp.test.ui.element.input.delegate.on_focusout_called = true;
            console.log('* dp.test.ui.element.input.delegate.on_focusout called.');
          },
          on_keydown_called: false,
          on_keydown() {
            dp.test.ui.element.input.delegate.on_keydown_called = true;
            console.log('* dp.test.ui.element.input.delegate.on_keydown called.');
          },
        },
      },
    },
  },
};

var dp_assert = function (eq, identifier, before, delay) {
  if (before) {
    before();
  }

  if (delay) {
    setTimeout(() => {
      dp_assert(eq, identifier);
    }, delay);
    return;
  }

  if (typeof eq === 'function') {
    eq = eq();
  }

  if (!eq) {
    if (dp.test.failed) return;

    console.log(`* Assertion Failed, ${identifier}`);
    dp_jqlib('body').append(dp_jqlib('<p />').addClass('assert').addClass('fail').text(`* Assertion Failed, ${identifier}`));
    dp.test.failed = true;

    throw new Error(`* Assertion Failed, ${identifier}`);
  } else {
    console.log(`* Assertion Succeed, ${identifier}`);
    dp_jqlib('body').append(dp_jqlib('<p />').addClass('assert').addClass('succ').text(`* Assertion Succeed, ${identifier}`));
  }
};

dp_init(() => {
  dp.test.init();
});
