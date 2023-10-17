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