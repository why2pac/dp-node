const assert = require('assert');

module.exports = {
  async test() {
    await this.knex(global.stage).insert({
      value: '1234',
    }).into('simple_test');

    const res = await this.knex(global.stage)
      .select(['id AS id', 'value as val'], 'pfx')
      .from('simple_test');

    assert(res[0]);
    assert(res[0].pfx_id);
    assert(res[0].pfx_val);

    const rows = this.grouping('pfx', res);

    assert(rows[0].pfx.id);
    assert(rows[0].pfx.val);

    const row = this.grouping('pfx', res[0]);

    assert(row.pfx.id);
    assert(row.pfx.val);

    const resPromised = this.knex(global.stage)
      .select(['id AS id', 'value as val'], 'pfx')
      .from('simple_test');

    const pgPage = 1;
    const pgRpp = 10;

    const pg = await this.paginate(
      resPromised,
      pgPage,
      pgRpp,
      this.grouping(['pfx'])
    );

    assert(pg[0]);
    assert(pg[1][0].pfx);
    assert(pg[1][0].pfx.id);
    assert(pg[1][0].pfx.val);
    assert(pg[2] === pgPage);
    assert(pg[3] === pgRpp);

    return res;
  },
};
