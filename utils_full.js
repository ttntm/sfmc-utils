function sfmcUtils() {
  var API = new Script.Util.WSProxy()
  var utilMID = ''

  /**
   * Private method.
   * Insert/Upsert a value into an SFMC data extension
   * @param {string} ext Data extensions external key
   * @param {object} data An object containing the data to write into the table
   * @param {boolean} upsert Switches between operating modes; `upsert` == `false` means insert
   * @returns {boolean}
   */
  function processDataExtRow(ext, data, upsert) {
    if (!ext || !data) {
      return false
    }

    var rowData = {
      CustomerKey: ext,
      Properties: []
    }

    for (var key in data) {
      rowData.Properties.push({
        Name: key,
        Value: data[key]
      })
    }

    var response = undefined

    if (upsert) {
      var options = {
        SaveOptions: [{
          PropertyName: '*',
          SaveAction: 'UpdateAdd'
        }]
      }

      response = API.updateItem('DataExtensionObject', rowData, options)
    } else {
      response = API.createItem('DataExtensionObject', rowData)
    }

    // { Status: String, RequestID: String, Results: Array }
    return response && response['Status'] == 'OK'
  }

  /**
   * Log row constructor
   * @param {string} env Environment key (dev/prod)
   * @param {object} data Parsed JSON from POST trigger
   */
  function createLogRow(env, data) {
    return {
      A: env,
      B: data.A || '',
      C: ''
    }
  }

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

  /**
   * Get an SFMC REST API token
   * @param {{
   *   client_id: string,
   *   client_secret: string
   * }} auth Client id/secret to use for the token request
   * @param {string?} mid Business unit MID; only included in the token request if available; falls back to private var `utilMID` if empty.
   * @returns {object | undefined}
   */
  function getToken(auth, mid) {
    if (!auth || !auth - client_id || !auth.client_secret) {
      return undefined
    }

    var authEndpoint = 'https://1234.auth.marketingcloudapis.com/v2/token'
    var payload = {
      client_id: auth.client_id,
      client_secret: auth.client_secret,
      grant_type: 'client_credentials'
    }

    if (mid || utilMID) {
      payload.account_id = mid ? mid : utilMID
    }

    var accessTokenRequest = HTTP.Post(authEndpoint, 'application/json', Stringify(payload))

    if (accessTokenRequest.StatusCode == 200) {
      var tokenResponse = Platform.Function.ParseJSON(accessTokenRequest.Response[0])

      return {
        token: tokenResponse.access_token,
        restInstanceURL: tokenResponse.rest_instance_url
      }
    } else {
      return undefined
    }
  }

  /**
   * Insert a row into an SFMC data extension
   * @param {string} ext Data extensions external key
   * @param {object} data An object containing the data to write into the table
   * @returns {boolean}
   */
  function insertDataExtRow(ext, data) {
    return processDataExtRow(ext, data, false)
  }

  /**
   * Logs an unsubscribe event in SFMC
   * @param {string} subscriberKey SFMC SubscriberKey
   * @param {string} email Subscriber's email address
   * @param {number} asListId List Id for AllSubscribers
   * @returns {boolean} true | false
   */
  function logUnsubEvent(subscriberKey, email, asListId) {
    var lueProps = [
      { Name: 'SubscriberKey', Value: subscriberKey },
      { Name: 'EmailAddress', Value: email },
      { Name: 'JobID', Value: 0 },
      { Name: 'ListID', Value: asListId },
      { Name: 'BatchID', Value: 0 },
      { Name: 'Reason', Value: 'Unsubscribe' }
    ]

    var response = API.execute(lueProps, 'LogUnsubEvent')

    if (response['Status'] == 'OK') {
      return true
    } else {
      // EMERGENCY FALLBACK
      // missing a logged event is acceptable if the alternative is subscribers staying active!
      // see: - https://stackoverflow.com/questions/70704643/wsproxy-unsubscribe
      //      - https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ssjs_subscriberUnsubscribe.html
      var subObj = Subscriber.Init(subscriberKey)
      var fallbackResult = subObj.Unsubscribe()
      return fallbackResult == 'OK'
    }
  }

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

      if (i !== tfl - 1) {
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

  /**
   * Triggers a response via HTTP using Write()
   * @param {any} msg Message value
   */
  function serverResponse(msg) {
    var svrMsg = typeof msg === 'string' ? msg : Stringify(msg)
    return Write(svrMsg)
  }

  /**
   * Set MID for the private instance of Script.Util.WSProxy
   * @param {string} mid
   */
  function setMID(mid) {
    API.setClientId({ ID: mid })
    utilMID = mid
  }

  /**
   * Used to trigger a journey entry event
   * @param {object} tokenData SFMC REST API token
   * @param {object} eventData Journey entry event as per API specification
   * @returns {object | undefined}
   */
  function triggerEntryEvent(tokenData, eventData) {
    if (!tokenData || !tokenData.token || !tokenData.restInstanceURL) {
      return undefined
    }

    if (!eventData) {
      return undefined
    }

    var headerNames = ['Authorization']
    var headerValues = ['Bearer ' + tokenData.token]
    var requestUrl = tokenData.restInstanceURL + '/interaction/v1/events'
    var triggerEntryEvt = HTTP.Post(requestUrl, 'application/json; charset=utf-8', Stringify(eventData), headerNames, headerValues)

    return triggerEntryEvt.Response && triggerEntryEvt.Response[0]
      ? Platform.Function.ParseJSON(triggerEntryEvt.Response[0])
      : undefined
  }

  /**
   * Set subscriber status in the All Subscribers List
   * @param {object} listData Object containing the data to update ASL
   * @returns {boolean}
   */
  function updateAllSubscribersList(listData) {
    var options = {
      SaveOptions: [{
        PropertyName: '*',
        SaveAction: 'UpdateAdd'
      }]
    }

    // returns: { Status: String, RequestID: String, Results: Array }
    var response = API.updateItem('Subscriber', listData, options)

    return response['Status'] == 'OK'
  }

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
    updateSFObject += ")";
    updateSFObject += "output(concat(@SFUpdateResults))";
    updateSFObject += "]\%\%";

    var execUpdate = Platform.Function.TreatAsContent(updateSFObject)

    return Number(execUpdate) > 0
      ? { success: type + ' updated' }
      : { error: 'Error updating SF record' }
  }

  /**
   * Upsert a row into an SFMC data extension
   * @param {string} ext Data extensions external key
   * @param {object} data An object containing the data to write into the table 
   * @returns {boolean}
   */
  function upsertDataExtRow(ext, data) {
    return processDataExtRow(ext, data, true)
  }

  /**
   * Wrapper for SFDC Apex REST usage.
   * @param {{
   *  auth: {
   *    client_id: string,
   *    client_secret: string,
   *    username: string,
   *    password: string
   *  },
   *  endpoint: string,
   *  payload: object
   * }} config SFDC configuration object; `payload` must be an object
   * @returns {{
   *  apx_status: 'Success' | 'Error',
   *  apx_data: object?,
   *  apx_message: string?
   * }} SFDC API result; depends on the endpoint; object, any[], etc.
   */
  function useApexREST(config) {
    if (!config.auth || !config.endpoint || !config.payload || typeof config.payload !== 'object') {
      return {
        apx_status: 'Error',
        apx_message: 'useApexREST: invalid configuration object'
      }
    }

    /**
     * `Script.Util.HttpRequest` returns the response in a .NET (?) CLR format.
     * This function makes the response usable for JS.
     * @returns {object | undefined}
     */
    function processResponse(res) {
      if (!res || !res.content) {
        return undefined
      }
      var resContent = String(res.content)
      return Platform.Function.ParseJSON(resContent)
    }

    var authEndpointCRM = 'https://login.salesforce.com/services/oauth2/token'
    var CA = config.auth
    var tokenStr = '?grant_type=password&client_id=' + CA.client_id + '&client_secret=' + CA.client_secret + '&username=' + CA.username + '&password=' + CA.password
    var tk_url = authEndpointCRM + tokenStr

    try {
      // 1. auth call
      var tk_request = new Script.Util.HttpRequest(tk_url)
      tk_request.emptyContentHandling = 0
      tk_request.retries = 2
      tk_request.continueOnError = true
      tk_request.contentType = 'multipart/form-data; charset=utf-8;'
      tk_request.method = 'POST'

      var tk_response = tk_request.send()
      var tk_resContent = processResponse(tk_response)

      var instanceCRM = tk_resContent.instance_url || undefined
      var tokenCRM = tk_resContent.access_token || undefined

      if (!instanceCRM || !tokenCRM) {
        throw 'useApexREST: token error'
      }

      // 2. endpoint call
      var apx_url = instanceCRM + config.endpoint

      var apx_request = new Script.Util.HttpRequest(apx_url)
      apx_request.emptyContentHandling = 0
      apx_request.retries = 2
      apx_request.continueOnError = true
      apx_request.contentType = 'application/json; charset=utf-8;'
      apx_request.setHeader('Authorization', 'Bearer ' + tokenCRM)
      apx_request.method = 'POST'
      apx_request.postData = Stringify(config.payload)

      var apx_response = apx_request.send()
      var apx_resContent = processResponse(apx_response)

      if (typeof apx_resContent === 'object') {
        return {
          apx_status: 'Success',
          apx_data: apx_resContent
        }
      } else {
        throw 'useApexREST: endpoint response is not an object'
      }
    } catch (error) {
      return {
        apx_status: 'Error',
        apx_message: error.message || error
      }
    }
  }

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

  /**
   * Verify a Google ReCaptcha payload.
   * See: https://developers.google.com/recaptcha/docs/verify#api-response
   * @param {string} grcToken A ReCaptcha token from the front end
   * @returns {boolean}
   */
  function verifyGRC(grcToken) {
    if (!grcToken) {
      return false
    }

    var grcPayload = 'secret=YOUR_SECRET' + '&response=' + grcToken
    var target = 'https://www.google.com/recaptcha/api/siteverify'

    var res = HTTP.Post(target, 'application/x-www-form-urlencoded', grcPayload)

    if (res && res.StatusCode == 200) {
      var parsed = Platform.Function.ParseJSON(res.Response[0])
      return parsed && parsed.success
        ? parsed.success
        : false
    } else {
      return false
    }
  }

  return {
    createLogRow: createLogRow
    , createSalesforceObject: createSalesforceObject
    , deleteDataExtRow: deleteDataExtRow
    , getAllRows: getAllRows
    , getRowData: getRowData
    , getToken: getToken
    , insertDataExtRow: insertDataExtRow
    , logUnsubEvent: logUnsubEvent
    , retrieveSalesforceObject: retrieveSalesforceObject
    , salesforceFieldsToNull: salesforceFieldsToNull
    , serverResponse: serverResponse
    , setMID: setMID
    , triggerEntryEvent: triggerEntryEvent
    , updateAllSubscribersList: updateAllSubscribersList
    , updateSalesforceObject: updateSalesforceObject
    , upsertDataExtRow: upsertDataExtRow
    , useApexREST: useApexREST
    , validateInput: validateInput
    , verifyGRC: verifyGRC
  }
}
