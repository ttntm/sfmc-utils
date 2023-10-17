/**
 * Set MID for the private instance of Script.Util.WSProxy
 * @param {string} mid
 */
function setMID(mid) {
  API.setClientId({ ID: mid })
  utilMID = mid
}