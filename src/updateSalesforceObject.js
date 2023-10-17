/**
 * Update a record in an SF CRM object
 * @param {string} type SF CRM object API name, i.e. 'Contact', 'ema_CustomObject__c'
 * @param {string} sfObjId SF CRM record id, i.e. 003... ContactKey
 * @param {object} props An object containing the fields to update and their new values
 * @returns {object | undefined}
 */
function updateSalesforceObject(type, sfObjId, props) {
  if (!props || !sfObjId || !type) {
    return undefined
  }

  var updateData = []

  for (var key in props) {
    updateData.push(key)
    updateData.push(props[key])
  }
  
  var updateSFObject = "";
    updateSFObject += "\%\%[";
    updateSFObject += "set @SFUpdateResults = UpdateSingleSalesforceObject('" + type + "',";
    updateSFObject += "'" + sfObjId + "','" + updateData.join("','") + "'";
    updateSFObject += ") ";
    updateSFObject += "output(concat(@SFUpdateResults))";
    updateSFObject += "]\%\%";

  var execUpdate = Platform.Function.TreatAsContent(updateSFObject)

  return Number(execUpdate) > 0
    ? { success: type + ' updated' }
    : { error: 'Error updating SF object' }
}