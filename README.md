# Catbox Fake

Catbox engine allowing you to use two engines, a primary and a secondary, and if the primary is down, the secondary takes over. After that, if the primary becomes ready it's gonna be used.

Lead maintainer: [Simon Lévesque](https://github.com/simlevesque)

Current version: [![Current Version](https://img.shields.io/npm/v/catbox-fake.svg)](https://www.npmjs.com/package/catbox-fake) [![Build Status](https://travis-ci.org/Tractr/catbox-fake.svg?branch=master)](https://travis-ci.org/Tractr/catbox-fake)

### Options

- `primary`
    - `engine` A catbox engine of any kind.
    - `options` The options you want to pass to the engine.
- `secondary`
    - `engine` A catbox engine of any kind.
    - `options` The options you want to pass to the engine.
