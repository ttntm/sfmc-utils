/**
 * Verify a Google ReCaptcha payload.
 * See: https://developers.google.com/recaptcha/docs/verify#api-response
 * @param {string} apiKey Google API key
 * @param {string} grcToken A ReCaptcha token from the front end
 * @returns {boolean}
 */
function verifyGRC(apiKey, grcToken) {
  if (!apiKey || !grcToken) {
    return false
  }

  var grcPayload = 'secret=' + apiKey + '&response=' + grcToken
  var target = 'https://www.google.com/recaptcha/api/siteverify'
  
  var res = HTTP.Post(target, 'application/x-www-form-urlencoded', grcPayload)
  
  if (res && res.StatusCode == 200) {
    var parsed = Platform.Function.ParseJSON(res.Response[0])
    return parsed && parsed.success
      ? parsed.success
      : false
  } else {
    return false
  }
}