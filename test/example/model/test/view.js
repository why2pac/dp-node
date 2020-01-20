module.exports = {
  async helperCustom(params) {
    return this.view.render('view/helper_custom.html', params);
  },
};
