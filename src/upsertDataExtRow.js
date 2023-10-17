/**
 * Upsert a row into an SFMC data extension
 * @param {string} ext Data extensions external key
 * @param {object} data An object containing the data to write into the table 
 * @returns {boolean}
 */
function upsertDataExtRow(ext, data) {
  return processDataExtRow(ext, data, true)
}