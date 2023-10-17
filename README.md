# General Remarks

This is collection of reusable [SSJS](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ssjs_serverSideJavaScript.html) utility functions for SFMC.

The code should cover most of the use cases that will eventually come up in almost every marketing cloud project.

**Questions?**

Please use [GitHub Discussions](https://github.com/ttntm/sfmc-utils/discussions).

# Usage

1. Run `./build.sh input_list_file merge_file` to build the library
2. Place the code from the merged file between the usual `<script runat="server">` and the closing `</script>` tags
3. Initialize the wrapper class, i.e. `var util = sfmcUtils()`
4. Use the utility you need in your CloudPage, Code Resource or Script Activity

The default `include.txt` files contains 100% of the utility functions; it can be built using the following command:

`./build.sh include.txt util_full.js`

You can change the files pulled in from `include.txt` at any time, but it's probably better to just create a new file if/when you want to build a smaller version of the library.

When creating a new Code Resource: `code-resource.template.js`, a boilerplate file for HTTP `POST` triggered endpoints, can be found in the root directory.

## VS Code

A (project/workspace) scoped snippet based on `code-resource.template.js` can be found in the `./.vscode/` folder. IntelliSense should be able to work with it in JS/TS files.

# Functional Documentation

The following sections lists the individual untility functions and briefly describes what they do and how to use them.

## [_private](./src/_private.js)

This files contains private variables and methods that are not exposed in the object that the initialization call returns.

### Variables

#### `api`

Stores an instance of [WSProxy](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ssjs_WSProxy_useSSJS.html) which is used in the following functions:

- `processDataExtRow()`
- `getAllRows()`
- `logUnsubEvent()`
- `setMID()`
- `updateAllSubscribersList()`

#### `utilMID`

Stores the SFMC Business Unit MID once set using the function `setMID()`.

### Functions

#### `processDataExtRow()`

Private method used to insert/upsert a value into an SFMC data extension. 

Uses `API.updateItem()` for upsert operations and `API.createItem()` for insert operations.

##### Params

- `ext`: _string_ - Data extensions external key
- `data`: _object_ -An object containing the data to write into the table
- `upsert`: _boolean_ - Switches between operating modes; `upsert` == `false` means insert

##### Returns

_Boolean_

## [createLogRow](./src/createLogRow.js)

Helper function for log row generation.

### Params

- `env`: _string_ - Environment marker, i.e. "dev", "prod" etc.
- `data`: _object_ - Any kind of input data, i.e. an object received by the endpoint via incoming `POST` requests

### Returns

_Object_

## [deleteDataExtRow](./src/deleteDataExtRow.js)

This function deletes a row in an SFMC data extension. 

The target data extension must have a Primary Key column.

### Params

- `ext`: _string_ - Data extensions external key
- `pkCol`: _string_ - Primary Key column name
- `pkVal`: _string_ - Primary Key value, used to identify the row to delete

### Returns

_Boolean_

## [getAllRows](./src/getAllRows.js)

Get all rows from an SFMC data extension.

Use this one for bigg/er tables - regular lookups have a hard 2000 row limit.

### Params

- `ext`: _string_ - Data extension external key
- `cols`: _string[]_ - An array of columns to retrieve from the DE
- `filter`: _object_ - Filter definition object (see: [ssjsdocs/complex-filters](https://www.ssjsdocs.xyz/reference/complex-filters.html))

### Returns

_Object[]_

## [getRowData](./src/getRowData.js)

A function to query row data from an SFMC data extension. Wraps the DE `Lookup()` function.

NB: _This function is hard-coded to return only one result. Use [getAllRows()](./src/getAllRows.js) if you want to retrieve multiple rows._

### Params

- `ext`: _string_ - Data extensions external key
- `fieldNames`: _string[]_ - Names of fields used to build the `WHERE` clause
- `values`: _string[]_ - Values used to build the `WHERE` clause

### Returns

_Object_ | `undefined`

## [getToken](./src/getToken.js)

Used to obtain an SFMC REST API token via REST API at `/v2/token` (more info: [official docs](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/access-token-s2s.html)).

### Params

- `auth`: _object_ - Client id/secret to use for the token request; expects an object of the following type: `{ client_id: string,
client_secret: string }`
  - _Recommendation: retrieve the credentials from a DE, do not hard-code them in the SSJS code_
- `mid`: _string?_ - Business unit MID; only included in the token request if available; falls back to private var `utilMID` if empty

### Returns

_Object_ | `undefined`

## [insertDataExtRow](./src/insertDataExtRow.js)

This function inserts a row into an SFMC data extension.

Uses the private method `processDataExtRow()`.

### Params

- `ext`: _string_ - Data extensions external key
- `data`: _object_ - An object containing the data to write into the table 

### Returns

_Boolean_

## [logUnsubEvent](./src/logUnsubEvent.js)

This function logs an unsubscribe event in SFMC.

It uses `API.execute()` and falls back to `Subscriber.Unsubscribe()` if the WSProxy call didn't succeed.

### Params

- `subscriberKey`: _string_ - An SFMC SubscriberKey
- `email`: _string_ - The subscriber's email address
- `asListId`: _number_ - List Id for AllSubscribers

### Returns

_Boolean_

## [retrieveSalesforceObject](./src/retrieveSalesforceObject.js)

Retrieves the specified fields from a Salesforce object based on a specific field value (i.e. `PersonContactId`).

Wraps the AMPScript function `RetrieveSalesforceObjects()` and calls it using `Platform.Function.TreatAsContent()`.

### Params

`objectName`: _string_ - Salesforce object, i.e. 'Account'
`targetFields`: _string[]_ - SF API names of the fields to retrieve
`lookupField`: _string_ - Field to use for the lookup, i.e. 'Id'
`lookupValue`: _string_ - Value to check in `lookupField`

### Returns

_Object_ | `undefined`

## [salesforceFieldsToNull](./src/salesforceFieldsToNull.js)

Wrapper for `fieldsToNull` calls, using [updateSalesforceObject()](./src/updateSalesforceObject.js) internally.

They are special `UpdateSingleSalesforceObject()` calls with a slightly different order of arguments.

### Params

- `sfObject`: _string_ - SF object, i.e. 'account'
- `sfId`: _string_ - SF object id
- `fields`: _string[]_ - List of fields to process

### Returns

_Void_

## [serverResponse](./src/serverResponse.js)

Triggers a response via HTTP using the plaform library function `Write()`.

### Params

- `msg`: _any_ - Message value

### Returns

HTTP response body; `content-type` depends on which kind on Code Resource was used.

## [setMID](./src/setMID.js)

Sets a Business Unit MID for the private instance of `Script.Util.WSProxy()`.

### Params

- `mid`: _string_ - SFMC Business Unit MID

### Returns

_Void_

## [triggerEntryEvent](./src/triggerEntryEvent.js)

Triggers a Journey Builder entry event using SFMC's REST API at `/interaction/v1/events` (more info: [official docs](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/postEvent.html)).

Requires valid token data obtained from a [getToken()](./src/getToken.js) call.

### Params

- `tokenData`: _object_ - SFMC REST API token
- `eventData`: _object_ - Journey entry event as per API specification

### Returns

_Object_ | `undefined`

## [updateAllSubscribersList](./src/updateAllSubscribersList.js)

Used to set a subscriber's status in the All Subscribers List.

### Params

- `listData`: _object_ - Object containing the data to update the list with

`listData` example:

```js
{
  SubscriberKey: 'abc_myKey',
  EmailAddress: 'bob@example.com',
  Status: 'Active',
  Lists: [
    {
      ID: '123',
      Status: 'Active'
    }
  ]
}
```

### Returns

_Boolean_

## [updateSalesforceObject](./src/updateSalesforceObject.js)

Used to update a record in an SF CRM object.

### Params

- `type`: _string_ - SF CRM object API name, i.e. "Contact", "ema_CustomObject__c"
- `sfObjId`: _string_ - SF CRM record id, i.e. 003... for a ContactKey
- `props`: _object_ - An object containing the fields to update and their new values

### Returns

_Object | `undefined`_

## [upsertDataExtRow](./src/upsertDataExtRow.js)

Used to insert/update (upsert) a row into an SFMC data extension.

### Params

- `ext`: _string_ - Data extensions external key
- `data`: _object_ - An object containing the row data to write into the table

### Returns

_Boolean_

## [useApexREST](./src/useApexREST.js)

Wrapper for SFDC Apex REST usage.

Can also be used to interact with the Salesforce standard API endpoints.

### Params

- `config`: _object_ - SFDC configuration object; `payload` must be an object

```ts
{
  auth: {
    client_id: string
    client_secret: string
    username: string
    password: string
  },
  endpoint: string
  payload: object
}
```

### Returns

SFDC API result; depends on the endpoint; object, any[], etc.

```ts
{
  apx_status: 'Success' | 'Error'
  apx_data: object?
  apx_message: string?
}
```

## [validateInput](./src/validateInput.js)

Checks and object for existence and value.length > 1 of the specified keys.

### Params

- `input`: _object_ - A flat object
- `requiredFields`: _string[]_ - An array of required fields

### Returns

_Boolean_

# License

MIT; see [./LICENSE](./LICENSE)

# Credits

Large parts of the build script are based on this project: [MERGEJS](https://github.com/eloone/mergejs)
