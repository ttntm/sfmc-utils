/**
 * Triggers SFMC contact deletion via API
 * @param {object} tokenData SFMC REST API token
 * @param {string[]} contactKeys An array of contact keys deletion should be triggered for
 * @returns {object | undefined}
 */
function deleteContactsByKey(tokenData, contactKeys) {
  if (!tokenData || !tokenData.token || !tokenData.restInstanceURL) {
    return undefined
  }

  if (!contactKeys || contactKeys.length <= 0) {
    return undefined
  }

  var headerNames = ['Authorization']
  var headerValues = ['Bearer ' + tokenData.token]
  var requestData = {
    values: contactKeys,
    DeleteOperationType: 'ContactAndAttributes'
  }
  var requestUrl = tokenData.restInstanceURL + '/contacts/v1/contacts/actions/delete?type=keys'
  var triggerDelete = HTTP.Post(requestUrl, 'application/json; charset=utf-8', Stringify(requestData), headerNames, headerValues)

  return triggerDelete.Response && triggerDelete.Response[0]
    ? Platform.Function.ParseJSON(triggerDelete.Response[0])
    : undefined
}