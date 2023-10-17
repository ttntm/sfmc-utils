/**
 * Set subscriber status in the All Subscribers List
 * @param {object} listData Object containing the data to update ASL
 * @returns {boolean}
 */
function updateAllSubscribersList(listData) {
  var options = {
    SaveOptions: [{
      PropertyName: '*',
      SaveAction: 'UpdateAdd'
    }]
  }
  
  // returns: { Status: String, RequestID: String, Results: Array }
  var response = API.updateItem('Subscriber', listData, options)

  return response['Status'] == 'OK'
}