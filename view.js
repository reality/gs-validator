var url = require('url');
var patients = require('../data/patients');
var template = require('./view.pug');

function saveText(text, filename){
  var a = document.createElement('a');
  a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.click();
}

var u = url.parse(window.location.href, true).query;
document.getElementById("content").innerHTML = template({
  patient: patients[u.id]
});

document.getElementById("save").onclick = function() {
  var result = {
    'uid': u.id,
    'diagnosis': document.getElementById("dcheck").checked,
    'comments': document.getElementById("comments").value
  };

  var assertions = document.getElementsByClassName("check");
  for(var i = 0; i < assertions.length; i++) {
    result[assertions.item(i).id] = assertions.item(i).checked;
  }

  saveText(JSON.stringify(result), u.id+".json");
}


