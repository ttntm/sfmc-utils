/**
 * Create a record in an SF CRM object
 * @param {string} type SF CRM object API name, i.e. 'Contact', 'ema_CustomObject__c'
 * @param {object} props An object containing the new record's fields and values
 * @returns {object | undefined}
 */
function createSalesforceObject(type, props) {
  if (!props || !type) {
    return undefined
  }

  var fieldsCount = 0
  var recordData = []

  for (var key in props) {
    fieldsCount++
    recordData.push(key)
    recordData.push(props[key])
  }
  
  var createSFObject = "";
    createSFObject += "\%\%[";
    createSFObject += "set @SFCreate = CreateSalesforceObject('" + type + "',";
    createSFObject += fieldsCount + ",'" + recordData.join("','") + "'";
    createSFObject += ")";
    createSFObject += "output(concat(@SFCreate))";
    createSFObject += "]\%\%";

  var execCreate = Platform.Function.TreatAsContent(createSFObject)

  return execCreate && typeof execCreate === 'string' && execCreate.length === 18
    ? { id: execCreate }
    : { error: 'Error creating SF record' }
}