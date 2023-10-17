/**
 * Log row constructor
 * @param {string} env Environment key (dev/prod)
 * @param {object} data Parsed JSON from POST trigger
 */
function createLogRow(env, data) {
  return {
    A: env,
    B: data.A || '',
    C: ''
  }
}