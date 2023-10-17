/**
 * Used to trigger a journey entry event
 * @param {object} tokenData SFMC REST API token
 * @param {object} eventData Journey entry event as per API specification
 * @returns {object | undefined}
 */
function triggerEntryEvent(tokenData, eventData) {
  if (!tokenData || !tokenData.token || !tokenData.restInstanceURL) {
    return undefined
  }

  if (!eventData) {
    return undefined
  }
  
  var headerNames = ['Authorization']
  var headerValues = ['Bearer ' + tokenData.token]
  var requestUrl = tokenData.restInstanceURL + '/interaction/v1/events'
  var triggerEntryEvt = HTTP.Post(requestUrl, 'application/json; charset=utf-8', Stringify(eventData), headerNames, headerValues)

  return triggerEntryEvt.Response && triggerEntryEvt.Response[0]
    ? Platform.Function.ParseJSON(triggerEntryEvt.Response[0])
    : undefined
}