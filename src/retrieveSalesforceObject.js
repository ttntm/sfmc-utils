/**
 * Retrieves the specified fields from a Salesforce object based
 * on a specific field value (i.e. Account.Id)
 * @param {string} objectName Salesforce object, i.e. 'Account'
 * @param {string[]} targetFields SF API names of the fields to retrieve
 * @param {string} lookupField Field to use for the lookup, i.e. 'Id'
 * @param {string} lookupValue Value to check in `lookupField`
 * @returns {object | undefined}
 */
function retrieveSalesforceObject(objectName, targetFields, lookupField, lookupValue) {
  if (!objectName || !lookupField || !lookupValue || !targetFields) {
    return undefined
  }

  var responseVars = ''
  var rso = ''
  var tfl = targetFields.length

  rso += "\%\%[\n";
  rso += "set @crmval = ''\n";
  rso += "set @rso = RetrieveSalesforceObjects('" + objectName + "','" + targetFields.join(',') + "','" + lookupField + "','=','" + lookupValue + "')\n";
  rso += "set @rc = RowCount(@rso)\n";
  rso += "IF @rc > 0 THEN\n";
  rso += "set @row = ROW(@rso,1)\n";

  for (var i = 0; i < tfl; i++) {
    var cf = '@crmval' + [i];
    rso += "set " + cf + " = FIELD(@row,'" + targetFields[i] + "')\n";

    if (i !== tfl-1) {
      responseVars += cf + ",'|',";
    } else {
      responseVars += cf;
    }
  }

  rso += "ENDIF\n";
  rso += "output(Concat(" + responseVars + "))\n";
  rso += "]\%\%";

  var retrieved = Platform.Function.TreatAsContent(rso)

  if (retrieved && retrieved.length > 0) {
    var crmObject = {}
    var responseValues = retrieved.split('|')

    for (var j = 0; j < tfl; j++) {
      var cv = responseValues[j]
      if (cv === 'true') cv = true
      if (cv === 'false') cv = false
      crmObject[targetFields[j]] = cv
    }

    return crmObject
  } else {
    return undefined
  }
}