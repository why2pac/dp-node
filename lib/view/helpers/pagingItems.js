module.exports = (pager) => {
  return pager && pager.length >= 2 ? pager[1] : null
}
