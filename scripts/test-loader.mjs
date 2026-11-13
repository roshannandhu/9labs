// For plain `node --test` runs only: resolves the `@/` alias (webpack/Next-only) to `src/`, and
// falls back to appending `.ts` for any extensionless relative import (source files are written
// for the bundler, which doesn't need either of these).
const root = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  const target = specifier.startsWith("@/") ? new URL(`${specifier.slice(2)}`, root).href : specifier;
  try {
    return await nextResolve(target, context);
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND" && !/\.[a-z]+$/i.test(target)) {
      return nextResolve(`${target}.ts`, context);
    }
    throw err;
  }
}
