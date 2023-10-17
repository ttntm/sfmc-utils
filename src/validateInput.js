/**
 * Checks and object for existence and value.length > 1 of the specified keys
 * @param {object} input A flat object
 * @param {string[]} requiredFields An array of required fields
 * @returns {boolean}
 */
function validateInput(input, requiredFields) {
  var count = 0

  for (var i = 0; i < requiredFields.length; i++) {
    var cf = requiredFields[i]

    if (!input.hasOwnProperty(cf) || !input[cf]) {
      count++
    }
  }

  return count <= 0
}