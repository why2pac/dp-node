module.exports = (pager, index, reverse) => {
  reverse = reverse === true ? true : false;
  count = pager && pager[0] ? pager[0] : 0;
  page = pager && pager[2] ? pager[2] : 1;
  rpp = pager && pager[3] ? pager[3] : 1;

  if (reverse) {
    return (page - 1) * rpp + index + 1;
  }
  else {
    return count - ((page - 1) * rpp) - index;
  }
};
