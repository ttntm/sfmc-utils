var API = new Script.Util.WSProxy()
var AUTH_BASE_SFDC = 'https://login.salesforce.com/services/oauth2/token'
var AUTH_BASE_SFMC = 'https://1234.auth.marketingcloudapis.com/v2/token'
var utilMID = ''

/**
 * Private method.
 * Insert/Upsert a value into an SFMC data extension
 * @param {string} ext Data extensions external key
 * @param {object} data An object containing the data to write into the table
 * @param {boolean} upsert Switches between operating modes; `upsert` == `false` means insert
 * @returns {boolean}
 */
function processDataExtRow(ext, data, upsert) {
  if (!ext || !data) {
    return false
  }

  var rowData = {
    CustomerKey: ext,
    Properties: []
  }

  for (var key in data) {
    rowData.Properties.push({
      Name: key,
      Value: data[key]
    })
  }

  var response = undefined

  if (upsert) {
    var options = {
      SaveOptions: [{
        PropertyName: '*',
        SaveAction: 'UpdateAdd'
      }]
    }

    response = API.updateItem('DataExtensionObject', rowData, options)
  } else {
    response = API.createItem('DataExtensionObject', rowData)
  }

  // { Status: String, RequestID: String, Results: Array }
  return response && response['Status'] == 'OK'
}