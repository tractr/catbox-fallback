# Catbox Fallback

Catbox engine allowing you to use two engines, a primary and a secondary, and if the primary is down, the secondary takes over. After that, if the primary becomes ready it's gonna be used.

Lead maintainer: [Simon Lévesque](https://github.com/simlevesque) and [Edouard Demotes-Mainard](https://github.com/EdouardDem)

Current version: [![Current Version](https://img.shields.io/npm/v/catbox-fallback.svg)](https://www.npmjs.com/package/catbox-fallback)

### Options

- `primary`
    - `engine` A Catbox engine of any kind.
    - `options` The options you want to pass to the engine.
    - `timeout` (number) A timeout (in ms) for the primary engine. After this timeout, the primary will be considered as unhealthy and we will use the secondary.
    - `recoveryDelay` (number) If defined and if the primary fails, it will wait this delay then try to recover the primary.
- `secondary`
    - `engine` A Catbox engine of any kind.
    - `options` The options you want to pass to the engine.

### Examples

Basic usage, Redis with Memory as fallback.

```javascript
const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    cache: {
        name: 'fallback',
        provider: {
            constructor: require('catbox-fallback'),
            options: {
                primary: {
                    engine: require('catbox-redis'),
                    options: {
                        partition: 'example',
                        host: '127.0.0.1',
                        port: 6379
                    },
                    timeout: 5000,
                    recoveryDelay: 30000
                },
                secondary: {
                    engine: require('catbox-memory')
                }
            }
        }
    }
});
```

For more details, see [examples](./examples).
