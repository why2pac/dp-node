'use strict';

module.exports = {
  _get: '/it-is-a-replaced-path-alias', // _get is alias for getPath
  get: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  _post: '/it-is-a-replaced-path-for-post-alias', // _post is alias for postPath
  post: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  _delete: '/it-is-a-replaced-path-for-delete-alias', // _delete is alias for deletePath
  delete: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
  _put: '/it-is-a-replaced-path-for-put-alias', // _put is alias for putPath
  put: (controller) => {
    const path = controller.req.uri().slice(controller.req.url().length);
    controller.finish(path);
  },
};
