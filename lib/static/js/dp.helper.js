'use strict';

/* eslint-disable */

if (!dp) var dp = {};

dp.helper = {
  prefixize(path, prefix) {
    prefix = prefix || dp.vars.prefix;

    if (prefix) {
      if (dp.helper.string.endsWith(prefix, '/')) {
        prefix = prefix.substr(0, prefix.length - 1);
      }
    } else {
      prefix = '';
    }

    if (dp.helper.string.startsWith(path, prefix)) {
      path = path.substr(prefix.length) || '/';
    }

    return path;
  },
  req_busy: {},
  req(obj, obj_add) {
    if (obj instanceof dp_jqlib) {
      const _obj = obj;
      obj = {
        url: _obj.attr('action'),
        type: _obj.attr('method'),
        dataType: obj.attr('dp-req-res-type') || 'json',
        prefixize: obj.attr('dp-req-prefixize') != 'no' && obj.attr('dp-req-prefixize') != 'false',
        fields: {},
      };

      const objSucc = _obj.attr('dp-req-success');
      const objError = _obj.attr('dp-req-error');

      if (objSucc) {
        obj.success = eval(objSucc);
      }

      if (objError) {
        obj.error = eval(objError);
      }

      if (_obj.find('*[dp-req-type="button"]').length > 0) {
        const _btn = dp_jqlib(_obj.find('*[dp-req-type="button"]').get(0));

        obj.button = _btn;
        obj.fade = _btn.attr('dp-req-fade') != 'no' && _btn.attr('dp-req-fade') != 'false';
        obj.multiple = _btn.attr('dp-req-multiple') != 'no' && _btn.attr('dp-req-multiple') != 'false';

        if (!_btn.attr('dp-req-identifier')) {
          _btn.attr('dp-req-identifier', `req-${dp.helper.string.uniqid()}`);
        }

        if (_btn.attr('dp-req-identifier')) {
          obj.identifier = _btn.attr('dp-req-identifier');
        }
      }

      _obj.find('*[dp-req-type]').each(function (i, e) {
        const _this = dp_jqlib(this);
        const key = _this.attr('name') || _this.attr('id');
        const payload = {
          obj: _this,
          required: _this.attr('dp-req-required') == 'yes' || _this.attr('dp-req-required') == 'true',
          focus: _this.attr('dp-req-required') == 'yes' || _this.attr('dp-req-required') == 'true',
          validate: _this.attr('dp-req-type'),
          length: _this.attr('dp-req-length') ? dp_jqlib.map(_this.attr('dp-req-length').split(','), (v, i) => parseInt(v, 10)) : undefined,
          message: {
            missing: _this.attr('dp-req-missing'),
            invalid: _this.attr('dp-req-invalid'),
            confirm: _this.attr('dp-req-confirm'),
            confirmYes: _this.attr('dp-req-confirm-yes'),
            confirmNo: _this.attr('dp-req-confirm-no'),
          },
        };

        if (_this.attr('dp-req-type') == 'checkbox') {
          payload.val = _this.prop('checked') ? _this.val() : '';
        }

        if (!payload.val && _this.attr('dp-req-val-alter')) {
          payload.val = _this.attr(_this.attr('dp-req-val-alter'));
        }

        obj.fields[key] = payload;
      });
    }

    if (obj_add) {
      dp_jqlib.extend(obj, obj_add);
    }

    const btn = obj.button || undefined;
    const multiple = obj.multiple || false;
    const fields = obj.fields || [];
    const url = obj.url || undefined;
    const headers = obj.headers || undefined;
    const type = obj.type || 'POST';
    const data = obj.data || {};
    const dataType = obj.dataType || 'json';
    const fade = obj.fade != undefined ? obj.fade : true;
    const prefixize = obj.prefixize != undefined ? obj.prefixize : true;
    const prefix = obj.prefix != undefined ? obj.prefix : dp.vars.prefix;
    let identifier = obj.identifier || undefined;
    const opacity_origin = btn ? btn.css('opacity') : 1.0;

    if (btn && !btn.attr('id')) {
      btn.attr('id', `temp-${dp.helper.string.uniqid()}`);
    }

    if (!identifier) {
      identifier = btn ? btn.attr('id') : dp.helper.string.uniqid();
    }

    if (!multiple && dp.helper.req_busy[identifier]) return false;
    dp.helper.req_busy[identifier] = true;

    let no_finalize = false;
    const fn_finalize = function () {
      if (no_finalize) {
        no_finalize = false;
        return;
      }

      dp.helper.req_busy[identifier] = false;
      if (btn) {
        btn.fadeTo(100, opacity_origin);
      }
    };

    if (obj.before) {
      if (obj.before() == false) {
        fn_finalize();
        return false;
      }
    }

    let fields_checked = true;
    let output = false;

    dp_jqlib.each(fields, (key, e) => {
      let val = e.val;

      if (val === undefined && e.obj) {
        val = e.obj.val();
      }

      let skip = false;

      // Required
      if (fields_checked && e.required && !val) {
        if (e.message && e.message.missing) {
          output = dp.alert(e.message.missing);
        }

        fields_checked = false;
      }

      // Button - SKIP
      if (fields_checked && e.validate == 'button') {
        skip = true;
      }
      // E-Mail validation
      else if (fields_checked && e.validate == 'email' && val && !dp.helper.validator.email(val)) {
        if (e.message && e.message.invalid) {
          output = dp.alert(e.message.invalid);
        }

        fields_checked = false;
      }
      // URL validation
      else if (fields_checked && e.validate == 'url' && !dp.helper.validator.url(val)) {
        if (e.message && e.message.invalid) {
          output = dp.alert(e.message.invalid);
        }

        fields_checked = false;
      }

      if (fields_checked && e.length) {
        if ((e.length.length >= 1 && val.length < e.length[0]) || (e.length.length >= 2 && val.length > e.length[1])) {
          if (e.message && e.message.invalid) {
            output = dp.alert(e.message.invalid);
          }

          fields_checked = false;
        }
      }

      // Confirm (alert)
      if (fields_checked && e.message && e.message.confirm && !e.message.confirming) {
        e.message.confirming = true;

        const confirmYes = e.message.confirmYes || 'OK';
        const confirmNo = e.message.confirmNo || 'Cancel';

        output = dp.alert(
          e.message.confirm,
          () => {
            fn_finalize();
            dp.req(obj);
          }, confirmYes,
          () => {
            fn_finalize();
          }, confirmNo,
        );

        no_finalize = true;
        fields_checked = false;
      }

      if (!fields_checked) {
        dp.ui.util.alert_focus = e.obj;
        return false;
      }

      if (!skip && key) {
        data[key] = val;
      }
    });

    if (!fields_checked) {
      fn_finalize();
      return output;
    }

    const finalize = function (data) {
      if (data && typeof data === 'object') {
        const finalizePage = function () {
          if (data.redirect) {
            document.location.href = data.redirect;
          } else if (data.reload) {
            document.location.reload();
          }
        };

        if (data.message) {
          dp.alert(data.message, () => {
            finalizePage();
          });
        } else {
          finalizePage();
        }
      }
    };

    const success = function (res) {
      if (dataType && dataType.toLowerCase() == 'json') {
        if (res.result != undefined && !res.result) {
          error(undefined, undefined, undefined, res);
          return;
        }
      }

      fn_finalize();

      if (obj.success) {
        obj.success(res, data);
      }

      finalize(res);
    };

    var error = function (a, b, c, res) {
      fn_finalize();

      if (obj.error) {
        obj.error(res, a, b, c);
      }

      finalize(res);
    };

    const ajax_req = function () {
      const payload = {
        url: prefixize ? dp.helper.prefixize(url, prefix) : url,
        headers,
        type,
        data,
        dataType,
        success,
        error,
      };

      dp_jqlib.ajax(payload);
    };

    if (btn && fade) {
      btn.stop().clearQueue().fadeTo(100, 0.3, () => {
        ajax_req();
      });
    } else {
      ajax_req();
    }

    return true;
  },
  validator: {
    email(e) {
      const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(e);
    },
    url(e, i) {
      if (!i && e.indexOf('http')) {
        return false;
      }

      const re = new RegExp('^(?:(?:https?|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:22[0-3]|2[01]\\d|[1-9]\\d?|1\\d\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1?\\d{1,2})){2}(?:\\.(?:25[0-4]|2[0-4]\\d|1\\d\\d|[1-9]\\d?))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:/\\S*)?$', 'i');
      return re.test(e);
    },
  },
  string: {
    _uniqid_seed: 0,
    uniqid(prefix, more_entropy, more_entropy_separator) {
      /* This code has extracted from php.js */

      if (!prefix) {
        prefix = '';
      }

      if (!more_entropy_separator) {
        more_entropy_separator = '';
      }

      let retId;
      const formatSeed = (function (seed, reqWidth) {
        seed = parseInt(seed, 10).toString(16);

        if (reqWidth < seed.length) {
          return seed.slice(seed.length - reqWidth);
        }

        if (reqWidth > seed.length) {
          const arr = new Array(1 + (reqWidth - seed.length));
          return arr.join('0') + seed;
        }

        return seed;
      });

      if (!dp.helper.string._uniqid_seed) {
        dp.helper.string._uniqid_seed = Math.floor(Math.random() * 0x75bcd15);
      }

      dp.helper.string._uniqid_seed++;

      retId = prefix; // start with prefix, add current milliseconds hex string
      retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
      retId += formatSeed(dp.helper.string._uniqid_seed, 5); // add seed hex string

      // for more entropy we add a float lower to 10
      if (more_entropy) {
        retId += (Math.random() * 10).toFixed(8).toString();
      }

      return dp.helper.string.replaceAll(retId, '.', more_entropy_separator);
    },
    replaceAll(text, find, replace) {
      return text.split(find).join(replace);
    },
    startsWith(str, prefix) {
      return str ? str.indexOf(prefix, 0) !== -1 : false;
    },
    endsWith(str, suffix) {
      return str ? str.indexOf(suffix, str.length - suffix.length) !== -1 : false;
    },
    extractNumbers(val) {
      const replace = /[^0-9]/gi;
      return (val.substring(0, 1) == '-' ? '-' : '') + val.replace(replace, '');
    },
    numberFormat(val) {
      return val.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    },
  },
};
