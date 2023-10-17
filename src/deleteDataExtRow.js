/**
 * Delete a row in an SFMC data extension
 * @param {string} ext Data extensions external key
 * @param {string} pkCol PK column name
 * @param {string} pkVal PK value, used to identify the row to delete
 * @returns {boolean}
 */
function deleteDataExtRow(ext, pkCol, pkVal) {
  if (!ext || !pkCol || !pkVal) {
    return false
  }
  
  var dataExt = DataExtension.Init(ext)
  var dataRows = dataExt.Rows.Remove([pkCol], [pkVal])
  
  return Number(dataRows) > 0
}