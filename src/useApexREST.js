/**
 * Wrapper for SFDC Apex REST usage.
 * @param {{
 *  auth: {
 *    client_id: string,
 *    client_secret: string,
 *    username: string,
 *    password: string
 *  },
 *  endpoint: string,
 *  payload: object
 * }} config SFDC configuration object; `payload` must be an object
 * @returns {{
 *  apx_status: 'Success' | 'Error',
 *  apx_data: object?,
 *  apx_message: string?
 * }} SFDC API result; depends on the endpoint; object, any[], etc.
 */
function useApexREST(config) {
  if (!config.auth || !config.endpoint || !config.payload || typeof config.payload !== 'object') {
    return {
      apx_status: 'Error',
      apx_message: 'useApexREST: invalid configuration object'
    }
  }

  /**
   * `Script.Util.HttpRequest` returns the response in a .NET (?) CLR format.
   * This function makes the response usable for JS.
   * @returns {object | undefined}
   */
  function processResponse(res) {
    if (!res || !res.content) {
      return undefined
    }
    var resContent = String(res.content)
    return Platform.Function.ParseJSON(resContent)
  }

  var authEndpointCRM = 'https://login.salesforce.com/services/oauth2/token'
  var CA = config.auth
  var tokenStr = '?grant_type=password&client_id=' + CA.client_id + '&client_secret=' + CA.client_secret + '&username=' + CA.username + '&password=' + CA.password
  var tk_url = authEndpointCRM + tokenStr
  
  try {
    // 1. auth call
    var tk_request = new Script.Util.HttpRequest(tk_url)
    tk_request.emptyContentHandling = 0
    tk_request.retries = 2
    tk_request.continueOnError = true
    tk_request.contentType = 'multipart/form-data; charset=utf-8;'
    tk_request.method = 'POST'
    
    var tk_response = tk_request.send()
    var tk_resContent = processResponse(tk_response)

    var instanceCRM = tk_resContent.instance_url || undefined
    var tokenCRM = tk_resContent.access_token || undefined

    if (!instanceCRM || !tokenCRM) {
      throw 'useApexREST: token error'
    }
    
    // 2. endpoint call
    var apx_url = instanceCRM + config.endpoint

    var apx_request = new Script.Util.HttpRequest(apx_url)
    apx_request.emptyContentHandling = 0
    apx_request.retries = 2
    apx_request.continueOnError = true
    apx_request.contentType = 'application/json; charset=utf-8;'
    apx_request.setHeader('Authorization', 'Bearer ' + tokenCRM)
    apx_request.method = 'POST'
    apx_request.postData = Stringify(config.payload)
    
    var apx_response = apx_request.send()
    var apx_resContent = processResponse(apx_response)

    if (typeof apx_resContent === 'object') {
      return {
        apx_status: 'Success',
        apx_data: apx_resContent
      }
    } else {
      throw 'useApexREST: endpoint response is not an object'
    }
  } catch (error) {
    return {
      apx_status: 'Error',
      apx_message: error.message || error
    }
  }
}