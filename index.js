var url = require('url'),
    patients = {},
    indexTemplate = require('./index.pug'),
    listTemplate = require('./list.pug'),
    viewTemplate = require('./view.pug'),
    dataTable = require('datatables'),
    FileSaver = require('file-saver'),
    _ = require('lodash')._,
    results = {},
    userInfo = {},
    annotations = {},
    diagnoses = {},
    table;

$(document).ready(function() {
  loadIndex();
});

/*** Functions ***/

/*
 * Show information gaining pop-up
 */
var showInfoPopup = function() {
  $("#infoModal").modal();
};

const saveUserInfo = () => {
  userInfo = {
    'name': $("#nameInput").val(),
    'gmc': $("#gmcInput").val(),
    'specialty': $("#specialtyInput").val()
  };
  
  $("#infoModal").modal('hide')

  loadList();
};

let readFileFactory = (cb) => {
  return (event) => {
    const ourFile = event.target.files[0];

    let reader = new FileReader();
    reader.readAsText(ourFile);

    reader.onload = function() {
      cb(reader.result);
    };

    // TODO: make pop up
    reader.onerror = function() {
      console.log(reader.error);
    };
  }
}

/*
 * Load Index
 */
const loadIndex = (cb) => {
  $("#content").html(indexTemplate({}));
  showInfoPopup();

  // TODO should remove the file reading boilerplate here really
  $('#annFileInput').bind('change', readFileFactory((text) => {
    const lines = text.split('\n');
    _.each(lines, (l) => {
      const fields = l.split('\t');
      const uid = fields[0].split('.')[0];
      if(!_.has(annotations, uid)) {
        annotations[uid] = [];
      }
      annotations[uid].push({
        iri: fields[1],
        label: fields[2],
        matchedText: fields[3],
        group: fields[4],
        tags: fields[5],
        sid: fields[6],
        sentence: fields[7]
      });
    });
  }));
  $('#diaFileInput').bind('change', readFileFactory((text) => {
    const lines = text.split('\n');
    _.each(lines, (l) => {
      const fields = l.split('\t');
      const uid = fields[0].split('.')[0];
      if(!_.has(diagnoses, uid)) {
        diagnoses[uid] = [];
      }
      diagnoses[uid].push({
        iri: fields[1],
        label: fields[2],
        target: fields[3],
        status: fields[4]
      });
    });
  }));
};

const loadList = (cb) => {
  var u = url.parse(window.location.href, true).query;

  $('#content').html(listTemplate({ diagnoses }));
  $('#save').onclick = function() { // TODO we need to change this to the tsv with extras
    saveText(JSON.stringify({ 'results': results }), "results.json");
  };

  $('#plist tfoot th').each(function() {
    var title = $(this).text();
    $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
  });

  // Create DataTable
  table = $('#plist').DataTable({ 'iDisplayLength': 100 });

  // Apply the search
  table.columns().every(function() {
    var that = this;

    $('input', this.footer()).on('keyup change', function() {
      if(that.search() !== this.value) {
        that
          .search(this.value)
          .draw();
      }
    });
  });

  resetScroll();
};
 
/*
 * Load a patient view
 */
var loadView = function(pId) {
  document.getElementById("content").innerHTML = viewTemplate({
    patient: patients[pId]
  });
  resetScroll();

  $('[data-toggle="tooltip"]').tooltip();

  document.getElementById("save").onclick = function() {
    var result = {
      'uid': patients[pId].uid,
      'comments': document.getElementById("comments").value,
    //  'assertions': {},
    //  'eassertions': {},
      'statcheck': {}
    };

    // Patient property status 
    /*var assertions = document.getElementsByClassName("fcheck");
    for(var i = 0; i < assertions.length; i++) {
      result.assertions[assertions.item(i).id] = assertions.item(i).checked;
    }*/

    var sassertions = document.getElementsByClassName("statcheck");
    for(var i = 0; i < sassertions.length; i++) {
      result.statcheck[sassertions.item(i).id] = sassertions.item(i).checked;
    }

    // Patient evidence status
    /*var eassertions = document.getElementsByClassName("echeck");
    for(var i = 0; i < eassertions.length; i++) {
      result.eassertions[eassertions.item(i).id] = eassertions.item(i).checked;
    }*/

    results[patients[pId].uid] = result;
    //patients[pId].done = true;

    console.log(results);

    loadIndex();
  }
}

/**
 * Save results 
 */
function saveText(content, fileName){
  var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(blob, fileName);
}

function resetScroll() {
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

module.exports = { 'loadView': loadView, 'saveUserInfo': saveUserInfo, 'loadIndex': loadIndex, 'loadList': loadList, 'results': results };

