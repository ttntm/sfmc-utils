/**
 * Verify a Google ReCaptcha payload.
 * See: https://developers.google.com/recaptcha/docs/verify#api-response
 * @param {string} grcToken 
 * @returns {boolean}
 */
function verifyGRC(grcToken) {
  if (!grcToken) {
    return false
  }

  var grcPayload = 'secret=YOUR_SECRET' + '&response=' + grcToken
  var target = 'https://www.google.com/recaptcha/api/siteverify'
  
  var res = HTTP.Post(target, 'application/x-www-form-urlencoded', grcPayload)
  
  if (res.StatusCode == 200) {
    var parsed = Platform.Function.ParseJSON(res.Response[0])
    return parsed && parsed.success
      ? parsed.success
      : false
  } else {
    return false
  }
}