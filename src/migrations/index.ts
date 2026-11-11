import * as migration_20261111_170018_initial from './20261111_170018_initial';

export const migrations = [
  {
    up: migration_20261111_170018_initial.up,
    down: migration_20261111_170018_initial.down,
    name: '20261111_170018_initial'
  },
];
