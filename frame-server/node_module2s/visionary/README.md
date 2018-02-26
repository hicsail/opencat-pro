# visionary

Views loader plugin for hapi.js.

[![Build Status](https://travis-ci.org/hapijs/visionary.svg?branch=master)](https://travis-ci.org/hapijs/visionary)
[![Dependency Status](https://david-dm.org/hapijs/visionary.svg?style=flat)](https://david-dm.org/hapijs/visionary)
[![Peer Dependency Status](https://david-dm.org/hapijs/visionary/peer-status.svg?style=flat)](https://david-dm.org/hapijs/visionary#info=peerDependencies)
[![Dev Dependency Status](https://david-dm.org/hapijs/visionary/dev-status.svg?style=flat)](https://david-dm.org/hapijs/visionary#info=devDependencies)

Used to configure a views engine when using
[rejoice](https://github.com/hapijs/rejoice) (the hapi CLI) or
[glue](https://github.com/hapijs/glue). This plugin allows configuring the
views manager from a manifest which is a plain JSON file and cannot contain
calls to `server.views()` or require the rendering engine.

If you are not loading your views manager from a static JSON manifest file, you
probably don't need this plugin. See [`vision`](https://github.com/hapijs/vision).

```json
{
    "connections": [
        {
            "port": 8080
        }
    ],
    "registrations": [
        {
            "plugin": "vision"
        },
        {
            "plugin": {
                "register": "visionary",
                "options": {
                    "engines": { "html": "handlebars" },
                    "path": "/where/my/template/file/are/located"
                }
            }
        }
    ]
}
```

Note: You need to include `vision` as a dependency in your project and define
it in your manifest. It's used as a peer dependency in `visionary`.

Lead Maintainer - [Reza Akhavan](https://github.com/jedireza)
