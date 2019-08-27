module.exports = {
  get: async (controller) => {
    const basedate = new Date();
    basedate.setYear(2000);
    basedate.setMonth(1 - 1);
    basedate.setDate(1);
    basedate.setHours(20);
    basedate.setMinutes(0);

    const params = {
      basedate,
    };

    await controller.render('view/helper_date.html', params);
  },
};
