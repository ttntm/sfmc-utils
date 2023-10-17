/**
 * Wrapper for `fieldsToNull` calls.
 * They are special `UpdateSingleSalesforceObject()` calls
 * with a slightly different order of arguments
 * @param {string} sfObject SF object, i.e. 'account'
 * @param {string} sfId SF object id
 * @param {string[]} fields List of fields to process
 */
function salesforceFieldsToNull(sfObject, sfId, fields) {
  if (fields.length <= 0) return
  
  for (var n = 0; n < fields.length; n++) {
    var currentNull = {
      fieldsToNull: fields[n]
    }

    updateSalesforceObject(sfObject, sfId, currentNull)
  }
}    