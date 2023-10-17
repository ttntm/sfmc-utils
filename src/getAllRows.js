/**
 * Get all rows from an SFMC data extension
 * @param {string} ext Data extension external key
 * @param {string[]} cols An array of columns to retrieve from the DE
 * @param {object} filter Filter definition object
 * @returns object[]
 */
function getAllRows(ext, cols, filter) {
  if (!ext || !cols || !filter) {
    return []
  }
  
  var data = []
  var nextPage = true
  var reqId = null
  var target = 'DataExtensionObject[' + ext + ']'

  /**
   * Creates a single object based on an array of individual Name-Value Objects
   * @param {object[]} arr An array of individual { Name: 'Name', Value: 'Value' } Objects
   */
  function formatResult(arr) {
    if (!arr || arr.length <= 0) {
      return null
    }

    var formatted = {}
    
    for (var i = 0; i < arr.length; i++) {
      formatted[arr[i]['Name']] = arr[i]['Value']
    }
    
    return formatted
  }

  while (nextPage) {
    var currentPage = reqId == null
      ? API.retrieve(target, cols, filter)
      : API.getNextBatch(target, reqId)
    nextPage = false
    
    if (currentPage) {
      nextPage = currentPage.HasMoreRows
      reqId = currentPage.RequestID
      
      if (currentPage.Results) {
        // unpack the data so we can return a simple 1-dimensional array of objects
        var resultsLength = currentPage.Results.length
        
        for (var i = 0; i < resultsLength; i++) {
          data.push(formatResult(currentPage.Results[i].Properties))
        }
      }
    }
  }

  return data
}