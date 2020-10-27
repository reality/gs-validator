var url = require('url'),
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
    iriLabels = {},
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

  // Interesting, needs to be function rather than closure syntax because it uses their scope!
  $('.cbtn').click(function() {
    $('.content-section').hide() ;
    console.log($(this).attr('data-section'))
    $("#" + $(this).attr("data-section")).show();
  });

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
      const iri = fields[1];
      const label = fields[2];
      const target = fields[3];
      const status = fields[4];

      if(!_.has(diagnoses, uid)) {
        diagnoses[uid] = {};
      }
      if(!_.has(diagnoses[uid], iri)) {
        diagnoses[uid][iri] = {};
      }

      diagnoses[uid][iri][target] = {
        iri, label, target, status
      };

      if(!_.has(iriLabels, iri)) { iriLabels[iri] = label; }
    });
  }));
};

const loadList = (cb) => {
  var u = url.parse(window.location.href, true).query;

  $('#content').html(listTemplate({ diagnoses }));
  $('#save').bind('click', () => {
    saveText(JSON.stringify({ 
      diagnoses, annotations, results, userInfo
    }), 'results.json');
  });

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
const loadView = (uid) => {
  $('#content').html(viewTemplate({
    uid,
    diagnoses: diagnoses[uid],
    annotations: annotations[uid],
    iriLabels
  }));

  resetScroll();

  console.log(results);
  if(_.has(results, uid)) {
    const r = results[uid];
    $('#comments').text(r.comments);
    
    var sassertions = document.getElementsByClassName("statcheck");
    for(var i = 0; i < sassertions.length; i++) {
      sassertions.item(i).checked = r.statcheck[sassertions.item(i).id];
    }
  }

  $('[data-toggle="tooltip"]').tooltip();
  $('#save').bind('click', () => {
    let result = {
      'uid': uid,
      'comments': $('#comments').val(),
      'statcheck': {}
    };

    var sassertions = document.getElementsByClassName("statcheck");
    for(var i = 0; i < sassertions.length; i++) {
      result.statcheck[sassertions.item(i).id] = sassertions.item(i).checked;
    }
  
    results[uid] = result;
    loadList();
  });
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

