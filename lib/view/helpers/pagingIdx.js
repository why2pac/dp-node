'use strict';

module.exports = (pager, index, rev) => {
  const reverse = rev == null || rev;
  const count = (pager && pager[0]) || 0;
  const page = (pager && pager[2]) || 1;
  const rpp = (pager && pager[3]) || 1;
  const base = (page - 1) * rpp + index;

  return reverse ? base + 1 : count - base;
};
