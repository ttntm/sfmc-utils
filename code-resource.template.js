/**
 * This code is also available as a VS Code snippet in the `./.vscode/` folder of this repository
 */

Platform.Load('core', '1.1.1')

function sfmcUtils() {
  // replace with freshly built utils
}

var method = Platform.Request.Method
var posted = Platform.Request.GetPostData('utf-8')
var parsed = Platform.Function.ParseJSON(posted)
var util = sfmcUtils()

if (method == 'POST') {
  try {
    
  } catch (error) {
    
  } finally {

  }
} else {
  util.serverResponse({
    Status: 'Error',
    Message: 'Invalid HTTP method or secret.'
  })
}