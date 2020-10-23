var url = require('url'),
    patients = {},
    indexTemplate = require('./index.pug'),
    listTemplate = require('./list.pug'),
    viewTemplate = require('./view.pug'),
    dataTable = require('datatables'),
    FileSaver = require('file-saver'),
    results = {},
    userInfo = {},
    table;

$(document).ready(function() {
  loadIndex();
});

// TODO: add progress to main table, fill up results as you go, semi-autosave feature, etc, then done

/*** Functions ***/

/*
 * Show information gaining pop-up
 */
var showInfoPopup = function() {
  $("#infoModal").modal();
};

var saveUserInfo = function() {
  userInfo = {
    'name': $("#nameInput").val(),
    'gmc': $("#gmcInput").val(),
    'specialty': $("#specialtyInput").val()
  };
  
  $("#infoModal").modal('hide');

  //var rSplit = userInfo.range.split('-');
  //trimTable(rSplit[0], rSplit[0]);
};

/*
 * Load Index
 */
var loadIndex = function(cb) {
  document.getElementById("content").innerHTML = indexTemplate({});
  showInfoPopup();
}

var loadList = function(cb) {
  var u = url.parse(window.location.href, true).query;
  document.getElementById("content").innerHTML = listTemplate({
    patients: patients
  });

  document.getElementById("save").onclick = function() {
    saveText(JSON.stringify({ 'results': results }), "results.json");
  };


  $('#plist tfoot th').each(function() {
    var title = $(this).text();
    $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
  });

  // Create DataTable
  table = $('#plist').DataTable({ 'iDisplayLength': 100 });

  // TODO: mark done patients
  // I thought that was already done?

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
  
/*var trimTable = function(start, finish) {
    start = parseInt(start);
    finish = parseInt(finish);
    $('#plist').find('tr').each(function(i, e) {
      if(i < start || i > finish) {
        table.row(i).remove();
        console.log('ha!');
      }
    });
    table.draw();
};*/

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

module.exports = { 'loadView': loadView, 'saveUserInfo': saveUserInfo, 'loadIndex': loadIndex, 'results': results };

