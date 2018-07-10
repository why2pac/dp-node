const assert = require('assert')

module.exports = {
  get: async (controller) => {
    assert(controller.session.id())

    const val = 'val'

    assert(await controller.session.set('key', val))
    assert(await controller.session.get('key') === val)

    assert(await controller.session.set('key2', val, 1))

    await controller.model.test.sleep(2 * 1000)

    assert(await controller.session.get('key2') === null)

    return 'done'
  }
}
