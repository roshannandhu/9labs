/** A path into a nested object/array, e.g. `["site", "hero", "headline"]` or `["site", "services", 2, "title"]`. */
export type Path = (string | number)[];

export function getIn(obj: unknown, path: Path): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

/** Immutable deep-set: clones only the objects/arrays along `path`, everything else keeps its reference. */
export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[key as number] = rest.length ? setIn(copy[key as number], rest, value) : value;
    return copy as unknown as T;
  }
  const base = (obj ?? {}) as Record<string | number, unknown>;
  return { ...base, [key]: rest.length ? setIn(base[key], rest, value) : value } as unknown as T;
}

export function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function removeFromArray<T>(arr: T[], index: number): T[] {
  return arr.slice(0, index).concat(arr.slice(index + 1));
}

export function insertIntoArray<T>(arr: T[], index: number, item: T): T[] {
  const copy = arr.slice();
  copy.splice(index, 0, item);
  return copy;
}
