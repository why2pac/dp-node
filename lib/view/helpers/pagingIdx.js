'use strict';

module.exports = (pager, index, rev) => {
  const reverse = rev === true;
  const count = pager && pager[0] ? pager[0] : 0;
  const page = pager && pager[2] ? pager[2] : 1;
  const rpp = pager && pager[3] ? pager[3] : 1;

  if (reverse) {
    return (page - 1) * rpp + index + 1; // eslint-disable-line no-mixed-operators
  }

  return count - ((page - 1) * rpp) - index; // eslint-disable-line no-mixed-operators
};
