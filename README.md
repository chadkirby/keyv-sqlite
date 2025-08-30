# SQLite store for keyv

A new SQLite cache store for [keyv](https://github.com/chadkirby/keyv).

## Featuring:

- using Node's built-in sqlite

## Requirements

- Node 22+

## Usage

```js
import { KeyvSqlite } from '@resolid/keyv-sqlite';
import Keyv from "keyv";
import { join } from 'node:path';

// SQLite :memory: cache store
const keyv = new Keyv(new KeyvSqlite());

// On disk cache on caches table
const keyv = new Keyv(new KeyvSqlite({uri: join(process.cwd(), 'cache.sqlite3')}));
```

## License

[MIT](./LICENSE).
