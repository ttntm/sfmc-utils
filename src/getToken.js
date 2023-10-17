/**
 * Get an SFMC REST API token
 * @param {{
 *   client_id: string,
 *   client_secret: string
 * }} auth Client id/secret to use for the token request
 * @param {string?} mid Business unit MID; only included in the token request if available; falls back to private var `utilMID` if empty.
 * @returns {object | undefined}
 */
function getToken(auth, mid) {
  if (!auth || !auth-client_id || !auth.client_secret) {
    return undefined
  }

  var authEndpoint = 'https://1234.auth.marketingcloudapis.com/v2/token'
  var payload = {
    client_id: auth.client_id,
    client_secret: auth.client_secret,
    grant_type: 'client_credentials'
  }

  if (mid || utilMID) {
    payload.account_id = mid ? mid : utilMID
  }

  var accessTokenRequest = HTTP.Post(authEndpoint, 'application/json', Stringify(payload))

  if (accessTokenRequest.StatusCode == 200) {
    var tokenResponse = Platform.Function.ParseJSON(accessTokenRequest.Response[0])

    return {
      token: tokenResponse.access_token,
      restInstanceURL: tokenResponse.rest_instance_url
    }
  } else {
    return undefined
  }
}