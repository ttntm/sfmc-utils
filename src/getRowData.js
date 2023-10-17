/**
 * Query row data from an SFMC data extension
 * @param {string} ext Data extensions external key
 * @param {string[]} fieldNames Names of fields used to build the WHERE clause
 * @param {string[]} values Values used to build the WHERE clause
 * @returns {object | undefined}
 */
function getRowData(ext, fieldNames, values) {
  if (!ext || !fieldNames || !values) {
    return undefined
  }

  var de = DataExtension.Init(ext)
  var deLookup = de.Rows.Lookup(fieldNames, values, 1)
  
  return deLookup[0]
}