var url = require('url'),
    indexTemplate = require('./index.pug'),
    listTemplate = require('./list.pug'),
    viewTemplate = require('./view.pug'),
    dataTable = require('datatables'),
    FileSaver = require('file-saver'),
    _ = require('lodash')._,
    sample = {},
    results = {},
    questions = require('./questions.json'),
    qMap = {},
  userInfo = {},
    table,
    groupMode = false;


_.each(questions.groups, (groups) => {
  _.each(groups.questions, (g) => {
    _.each(g, (q) => {
        qMap[q.id] = q;
    })
  })
});

$(document).ready(function() {
  loadIndex();

  window.onbeforeunload = function() {
      return true;
  };
});

/*** Functions ***/

/*
 * Show information gaining pop-up
 */
var showInfoPopup = function() {
  $("#infoModal").modal();
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
    $("#" + $(this).attr("data-section")).show();
  });

  $('#newBtn').click(() => {
    userInfo = {
      'name': $("#nameInput").val(),
      'gmc': $("#gmcInput").val(),
      'specialty': $("#specialtyInput").val()
    };
    
    $("#infoModal").modal('hide');
    loadList();
  });

  $('#loadBtn').click(() => {
    // TODO check that we've actually loaded the stuff. not that it will work if not lmao
    $("#infoModal").modal('hide')
    loadList();
  })

  $('#progressFileInput').bind('change', readFileFactory((text) => {
    const r = JSON.parse(text); // TODO error checking
    results = r.results;
    sample = r.sample;
    userInfo = r.userInfo;
  }));
  $('#samFileInput').bind('change', readFileFactory((text) => {
    sample = text.split('\n');
  }));
};

const loadList = (cb) => {
  var u = url.parse(window.location.href, true).query;
  $('#content').html(listTemplate({ sample, results }));

  $('#save').bind('click', () => {
    saveText(JSON.stringify({ sample, results, userInfo }), 'results.json');
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
 * Load entry view 
 */
const changedAnswer = (id) => {
  console.log(id);
  refreshDisabled();
} 
const refreshDisabled = () => {
  $('select').each(function() {
    const qid = $(this).attr('id');
    const question = qMap[qid];

    console.log(qid)
    var disabled = false;
    if(question.askif) {
      _.each(question.askif, (aq) => {
        const select = document.getElementById(aq.id)
        const selected = select.options[select.selectedIndex].value
        const c = _.includes(aq.response, 
          selected);

        if(c == false) {
            disabled = true 
        }
      })
    }

    $(this).prop('disabled', disabled);
    if(disabled) {
      $(this).prop('selectedIndex', '0');
    }
  });

  $('tr').each(function() {
    if($(this).find('select').attr('disabled') == 'disabled') {
      $(this).hide();
    } else {
      $(this).show();
    }
  })
}
const loadView = (uid) => {
  $('#content').html(viewTemplate({ uid, questions }));

  resetScroll();
  refreshDisabled();

  // TODO: Reload the results
  if(_.has(results, uid)) {
    const r = results[uid];

    $('#comments').text(r.comments);
    $('select').each(function() {
      $(this).prop('value', r.answers[$(this).attr('id')])
    });
  }
 
  // on save
  $('#save').bind('click', () => {
    let result = {
      'uid': uid,
      'comments': $('#comments').val(),
      'answers': {}
    };

    $('select').each(function() {
      result.answers[$(this).attr('id')] = this.options[this.selectedIndex].value;
    });

    console.log(result)
  
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

module.exports = { 'loadView': loadView, 'loadIndex': loadIndex, 'loadList': loadList, 'changedAnswer': changedAnswer };
