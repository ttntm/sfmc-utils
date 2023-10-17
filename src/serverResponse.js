/**
 * Triggers a response via HTTP using Write()
 * @param {any} msg Message value
 */
function serverResponse(msg) {
  var svrMsg = typeof msg === 'string' ? msg : Stringify(msg)
  return Write(svrMsg)
}