/**
 * Retrieves the specified fields from a Salesforce object
 * @param {string} objectName Salesforce object, i.e. 'Account'
 * @param {string[]} targetFields SF API names of the fields to retrieve
 * @param {string | string[]} lookupFields Query fields for the lookup, supports `AND` operator only (AMPScript limitation)
 * @param {string | string[]} lookupValues Query values for the lookup, supports `AND` operator only (AMPScript limitation)
 * @returns {object | undefined}
 */
function retrieveSalesforceObject(objectName, targetFields, lookupFields, lookupValues) {
  if (!objectName || !lookupFields || !lookupValues || !targetFields) {
    return undefined
  }

  var query = ''
  var responseVars = ''
  var rso = ''
  var tfl = targetFields.length

  if (typeof lookupFields !== 'string') {
    var tmp = []

    for (var i = 0; i < lookupFields.length; i++) {
      var condition = "'" + lookupFields[i] + "','=','" + lookupValues[i] + "'"
      tmp.push(condition)
    }

    query = tmp.join(',')
  } else {
    query = "'" + lookupFields + "','=','" + lookupValues + "'"
  }

  rso += "\%\%[\n";
  rso += "set @crmval = ''\n";
  rso += "set @rso = RetrieveSalesforceObjects('" + objectName + "','" + targetFields.join(',') + "'," + query + ")\n";
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

  try {
    var retrieved = Platform.Function.TreatAsContent(rso)

    if (!retrieved || retrieved.length <= 0) {
      throw 'Lookup failed'
    }

    var crmObject = {}
    var responseValues = retrieved.split('|')

    for (var j = 0; j < tfl; j++) {
      var cv = responseValues[j]
      if (cv === 'true') cv = true
      if (cv === 'false') cv = false
      crmObject[targetFields[j]] = cv
    }

    return crmObject
  } catch (ex) {
    return undefined
  }
}