export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') {
    return { shortCircuit: true, url: new URL('./three-stub.mjs', import.meta.url).href };
  }
  return nextResolve(specifier, context);
}
