// JSON object of all the tabs
var allParentStepsJSON = {
  'getting-started': 'getting-started-tab',
  'high-level-folders': 'high-level-folders-tab',
  'organize-dataset': 'organize-dataset-tab',
  'metadata-files': 'metadata-files-tab',
  'manifest-file': 'manifest-file-tab',
  'generate-dataset': 'generate-dataset-tab'
}

var currentTab = 0; // Current tab is set to be the first tab (0)
showParentTab(0, 1)

function showParentTab(tabNow, nextOrPrev) {

  // check to show Save progress btn (only after step 2)
  if (tabNow >= 2) {
    document.getElementById("save-progress-btn").style.display = "block";
  } else {
    document.getElementById("save-progress-btn").style.display = "none";
  }

  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("parent-tabs");
  fixStepIndicator(tabNow)
  if (tabNow === 0) {
    fixStepDone(tabNow)
  } else {
    fixStepDone(tabNow - 1)
  }

  $(x[tabNow]).addClass('tab-active');

  var inActiveTabArray = [0, 1, 2, 3, 4, 5].filter(function (element) {
    return ![tabNow].includes(element);
  });

  for (var i of inActiveTabArray) {
    $(x[i]).removeClass('tab-active');
  }

  document.getElementById("nextBtn").style.display = "inline";
  document.getElementById("prevBtn").style.display = "inline";
  document.getElementById("nextBtn").innerHTML = "Continue";

  if (nextOrPrev === -1) {
    document.getElementById("nextBtn").disabled = false;
  }

  if (tabNow == 0) {
    document.getElementById("prevBtn").style.display = "none";
    if ($('input[name="getting-started-1"]:checked').length === 1) {
      document.getElementById("nextBtn").disabled = false;
    } else if ($('input[name="getting-started-1"]:checked').length === 0) {
      document.getElementById("nextBtn").disabled = true;
    }
  } else if (tabNow == 1){
    checkHighLevelFoldersInput();
    highLevelFoldersDisableOptions();
  } else {
    document.getElementById("nextBtn").disabled = false;
  }
  if (tabNow == (x.length - 1)) {
    document.getElementById("nextBtn").style.display = "none";
  }
}


// helper function to delete empty keys from objects
function deleteEmptyKeysFromObject(object) {
  for (var key in object) {
    if (object[key] === null || object[key] === undefined || object[key] === "" || JSON.stringify(object[key]) === "{}") {
      delete object[key];
    }
  }
}


function checkHighLevelFoldersInput() {
  document.getElementById("nextBtn").disabled = true;
  var optionCards = document.getElementsByClassName("option-card high-level-folders");
  var checked = false;
  for (var card of optionCards) {
    if ($(card).hasClass('checked')) {
      checked = true;
      break
    }
  }
  if (checked) {
    document.getElementById("nextBtn").disabled = false;
  }
  return checked
}

// function associated with the Back/Continue buttons
function nextPrev(n) {
  var x = document.getElementsByClassName("parent-tabs");
  console.log(x);
  // update JSON structure
  updateOverallJSONStructure(x[currentTab].id);

  if (
    n === 1 &&
    x[currentTab].id === "organize-dataset-tab" &&
    sodaJSONObj["dataset-structure"] === { folders: {} }
  ) {
    bootbox.confirm({
      message:
        "The current dataset folder is empty. Are you sure you want to continue?",
      buttons: {
        confirm: {
          label: "Continue",
          className: "btn-success",
        },
        cancel: {
          label: "No",
          className: "btn-danger",
        },
      },
      centerVertical: true,
      callback: function (result) {
        if (result !== null && result === true) {
          // Hide the current tab:
          $(x[currentTab]).removeClass("tab-active");
          // Increase or decrease the current tab by 1:
          currentTab = currentTab + n;
          // For step 1,2,3, check for High level folders input to disable Continue button
          if (currentTab === 1 || currentTab === 2 || currentTab === 3) {
            highLevelFoldersDisableOptions();
          }
          // Display the correct tab:
          showParentTab(currentTab, n);
        }
      },
    });
    // check if required metadata files are included
  } else if (n === 1 && x[currentTab].id === "metadata-files-tab") {
    var requiredFiles = ["submission", "dataset_description", "subjects"];
    var withoutExtMetadataArray = [];
    if (!("metadata-files" in sodaJSONObj)) {
      sodaJSONObj["metadata-files"] = {};
    }
    Object.keys(sodaJSONObj["metadata-files"]).forEach((element) =>
      withoutExtMetadataArray.push(path.parse(element).name)
    );
    var subArrayBoolean = requiredFiles.every((val) =>
      withoutExtMetadataArray.includes(val)
    );
    if (!subArrayBoolean) {
      bootbox.confirm({
        message:
          "You did not include all of the following required metadata files: <br><ol><li> submission</li><li> dataset_description</li> <li> subjects</li> </ol>Are you sure you want to continue?",
        buttons: {
          confirm: {
            label: "Continue",
            className: "btn-success",
          },
          cancel: {
            label: "No",
            className: "btn-danger",
          },
        },
        centerVertical: true,
        callback: function (result) {
          if (result !== null && result === true) {
            // Hide the current tab:
            $(x[currentTab]).removeClass("tab-active");
            // Increase or decrease the current tab by 1:
            currentTab = currentTab + n;
            // Display the correct tab:
            showParentTab(currentTab, n);
          }
        },
      });
    } else {
      // Hide the current tab:
      $(x[currentTab]).removeClass("tab-active");
      // Increase or decrease the current tab by 1:
      currentTab = currentTab + n;
      // Display the correct tab:
      showParentTab(currentTab, n);
    }
  } else if (x[currentTab].id === "manifest-file-tab" && sodaJSONObj["starting-point"] == "bf")
  {
    console.log("hiding");
    $(x[currentTab]).removeClass("tab-active");
    currentTab = currentTab + n;
    // if bf existing, hide everything but the generate button, for now.
    $("#Question-generate-dataset").hide();
    $("#Question-generate-dataset").children().hide();
    $("#Question-generate-dataset-generate-div").show();
    $("#button-preview-dataset").hide();
    $("#button-generate").show();
    //var target = document.getElementById('Question-generate-dataset-generate-div');
    //$("#button-preview-dataset").css("display", "none");
    //document.getElementById("generate-dataset-tab").appendChild(target);
    showParentTab(currentTab, n);
  }
  else if (x[currentTab].id === "manifest-file-tab" && sodaJSONObj["starting-point"] == "new")
  {
    console.log("showing");
    $(x[currentTab]).removeClass("tab-active");
    currentTab = currentTab + n;
    $("#Question-generate-dataset").show();
    $("#Question-generate-dataset").children().show();
    $("#Question-generate-dataset-generate-div").hide();
    $("#Question-generate-dataset-generate-div").children().hide();
    //$("#button-preview-dataset").hide();
    //$("#button-generate").hide();
    //("#button-preview-dataset").show();
    //$("#button-generate").show();
    //$("#Question-generate-dataset-generate-div").removeClass('show');
    //$("#Question-generate-dataset-generate-div").children().removeClass('show');
    showParentTab(currentTab, n);
  }
  else {
    // Hide the current tab:
    $(x[currentTab]).removeClass("tab-active");
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // For step 1,2,3, check for High level folders input to disable Continue button
    if (currentTab === 1 || currentTab === 2 || currentTab === 3) {
      highLevelFoldersDisableOptions();
    }
    // Display the correct tab:
    showParentTab(currentTab, n);
    console.log(JSON.stringify(sodaJSONObj));
  }
}

function fixStepIndicator(n) {
  // This function removes the "is-current" class of all steps...
  var i,
    x = document.getElementsByClassName("vertical-progress-bar-step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" is-current", "");
  }
  //... and adds the "active" class to the current step:
  x[n].className += " is-current";
}

function fixStepDone(n) {
  var x = document.getElementsByClassName("vertical-progress-bar-step");
  $(x[n]).addClass('done');
}

//// High level folders check mark effect
$(".option-card.high-level-folders").click(function () {
  $(this).toggleClass('checked');
  if ($(this).hasClass('checked')) {
    $(this).children()[0].children[1].children[0].checked = true
  } else {
    $(this).children()[0].children[1].children[0].checked = false
  }
  checkHighLevelFoldersInput()
})

// Other radio buttons check mark effect
$(".option-card.radio-button").click(function () {
  $(this).removeClass('non-selected');
  $(this).addClass('checked');
  if ($(this).hasClass('checked')) {
    $(this).children()[0].children[0].children[0].checked = true;
    $(this).removeClass('non-selected')
  } else {
    $(this).children()[0].children[0].children[0].checked = false;
    $(this).addClass('non-selected')
  }
})

$(".folder-input-check").click(function () {
  var parentCard = $(this).parents()[2];
  $(parentCard).toggleClass('checked')
  if ($(this).checked) {
    $(this).checked = false;
    $(parentCard).removeClass('non-selected')
  } else {
    $(this).checked = true;
  }
  checkHighLevelFoldersInput()
})

// function associated with metadata files (show individual metadata file upload div on button click)
function showSubTab(section, tab, input) {
  var tabArray;
  if (section === "metadata") {
    tabArray = ["div-submission-metadata-file", "div-dataset-description-metadata-file", "div-subjects-metadata-file",
      "div-samples-metadata-file", "div-changes-metadata-file", "div-readme-metadata-file",
      "div-manifest-metadata-file"]
  }
  var inActiveTabArray = tabArray.filter(function (element) {
    return ![tab].includes(element);
  });
  for (var id of inActiveTabArray) {
    document.getElementById(id).style.display = "none";
  }
  document.getElementById(input).checked = true;
  document.getElementById(tab).style.display = "block";
}

// function to check if certain high level folders already chosen and have files/sub-folders
// then disable the option (users cannot un-choose)
function highLevelFoldersDisableOptions() {
  console.log(datasetStructureJSONObj);
  var highLevelFolderOptions = datasetStructureJSONObj["folders"];
  if (highLevelFolderOptions) {
    for (var folder of highLevelFolders) {
      if (Object.keys(highLevelFolderOptions).includes(folder)) {
        var optionCard = $("#" + folder + "-check").parents()[2];
        $(optionCard).addClass('disabled');
        if (!$(optionCard).hasClass('checked')) {
          $(optionCard).addClass('checked');
        }
        if (!$("#"+folder+"-check").prop('checked')) {
          $("#"+folder+"-check").prop('checked', true);
        }
      } else {
        var optionCard = $("#" + folder + "-check").parents()[2];
        $(optionCard).removeClass('disabled');
        $(optionCard).removeClass('checked');
        $(optionCard).children()[0].children[1].children[0].checked = false
      }
    }
  }
}

// // High level folders check mark effect
$(".folder-input-check").click(function () {
  var highLevelFolderCard = $(this).parents()[2];
  $(highLevelFolderCard).toggleClass('checked')
  if ($(this).checked) {
    $(this).checked = false;
  } else {
    $(this).checked = true;
  }
})


// ////////////// THIS IS FOR THE SUB-TABS OF GETTING STARTED and GENERATE DATASET sections /////////////////////////

// transition between tabs under Step 1 and Step 6
var divList = [];
async function transitionSubQuestions(ev, currentDiv, parentDiv, button, category){
  // document.getElementById("nextBtn").disabled = true;
  $(ev).removeClass('non-selected');
  $(ev).children().find('.folder-input-check').prop('checked', true);

  // uncheck the other radio buttons
  $($(ev).parents()[0]).siblings().find('.option-card.radio-button').removeClass('checked');
  // $($(ev).parents()[0]).siblings().find('.option-card.radio-button').css('pointer-events', 'auto');
  $($(ev).parents()[0]).siblings().find('.option-card.radio-button').addClass('non-selected');

  // first, handle target or the next div to show
  var target = document.getElementById(ev.getAttribute('data-next'));
  hidePrevDivs(currentDiv, category);
  // display the target tab (data-next tab)
  if (!(target.classList.contains('show'))) {
    target.classList.add('show');
  }
  // here, handling existing folders and files tabs are independent of each other
  if (!(ev.getAttribute('data-next') === "Question-generate-dataset-existing-files-options"
  && target.classList.contains('prev'))) {
    // append to parentDiv
    document.getElementById(parentDiv).appendChild(target);
  }
  // if buttons: Add account and Confirm account were hidden, show them again here
  if (ev.getAttribute('data-next') === "Question-generate-dataset-BF-account") {
    $("#" + ev.getAttribute('data-next') + " button").show();
  }

  if (ev.getAttribute('data-next') === "Question-generate-dataset-generate-div")
  {
    $("#Question-generate-dataset-generate-div").show();
    $("#Question-generate-dataset-generate-div").children().show();
  }

  if (!(ev.getAttribute('data-next') === "Question-generate-dataset-generate-div")) {
    // create moving effects when new questions appear
    $("#Question-generate-dataset-generate-div").hide();
    $("#Question-generate-dataset-generate-div").children().hide();
    setTimeout(() => target.classList.add("test2"), 100);
  }

  document.getElementById(currentDiv).classList.add("prev");

  // handle buttons (if buttons are confirm buttons -> delete after users confirm)
  if (button === 'delete') {
    if ($(ev).siblings().length > 0) {
      $(ev).siblings().hide()
    }
    $(ev).hide();
  }
  // auto-scroll to bottom of div
  document.getElementById(parentDiv).scrollTop = document.getElementById(parentDiv).scrollHeight;
  // when we hit the last question under Step 1, hide and disable Next button
  if (ev.getAttribute('data-next') === "Question-getting-started-final") {
    // handle cases where
    if ($('#prepare-new').prop('checked')) {
      exitCurate();
      $('#prepare-new').prop("checked", true);
      $($('#prepare-new').parents()[2]).addClass("checked");
      // $($('#prepare-new').parents()[2]).css("pointer-events", "none");
      $($($($('#div-getting-started-prepare-new').parents()[0]).siblings()[0]).children()[0]).toggleClass('non-selected')
      document.getElementById('nextBtn').disabled = false;
      $("#nextBtn").click();
    } else {
      document.getElementById('nextBtn').disabled = true
    }
    if ($("#prepare-new").is(":checked")) {
      sodaJSONObj["starting-point"] = "new";
      sodaJSONObj["dataset-structure"] = {};
      datasetStructureJSONObj = { folders: {} };
      sodaJSONObj["metadata-files"] = {};
      reset_ui();
      document.getElementById("nextBtn").disabled = false;
    }

    else if ($("#existing-bf").is(":checked")) {
      console.log("here");
      $("#Question-getting-started-existing-BF-account").show();
      $("#Question-getting-started-existing-BF-account").children().show();
      sodaJSONObj = {
        "bf-account-selected": {
          "account-name": "homewindows"
        },
        "bf-dataset-selected": {
          "dataset-name": "testddataset"
        },
        "dataset-structure": {},
        "metadata-files": {},
        "manifest-files": {},
        "generate-dataset": {},
        "starting-point": "bf"
      };

      $('body').addClass('waiting');
      console.log("calling");
      //sodaJSONObj["bf-account-selected"]["account-name"] = document.getElementById('bfexistingallaccountlist').value;
      //sodaJSONObj["bf-dataset-selected"]["dataset-name"] = document.getElementById('curateexistingbfdatasetlist').value;
      document.getElementById("nextBtn").disabled = true;
      res = await bf_request_and_populate_dataset(sodaJSONObj);
      if (res == "error") {
        console.log(res);
        document.getElementById("nextBtn").disabled = true;
        $('body').removeClass('waiting');
      } else {
        sodaJSONObj = res;
        datasetStructureJSONObj = sodaJSONObj["dataset-structure"];
        console.log(datasetStructureJSONObj);
        populate_existing_folders(datasetStructureJSONObj);
        populate_existing_metadata(sodaJSONObj);
        $("#nextBtn").prop("disabled", false);
        $('body').removeClass('waiting');
      }
    }
  }
}

reset_ui = () => {
  $(".option-card.high-level-folders").each(function (i, obj) {
    $(obj).removeClass("checked");
    $(obj).removeClass("disabled");
  });
  $(".metadata-button.button-generate-dataset").each(function (i, obj) {
    $(obj).removeClass("done");
  });
  $(".button-individual-metadata.remove").each(function (i, obj) {
    $(obj).click();
  });
  $("#Question-getting-started-existing-BF-account").hide();
  $("#Question-getting-started-existing-BF-account").children().hide();
  $("#Question-getting-started-existing-BF-dataset").hide();
  $("#Question-getting-started-existing-BF-dataset").children().hide();
  document.getElementById("nextBtn").disabled = true;
};

var populate_existing_folders = (datasetStructureJSONObj) => {
  // currently handled by old function
}

var populate_existing_metadata = (datasetStructureJSONObj) => {
  let target = null;
  let metadataobject = datasetStructureJSONObj["metadata-files"];
  for (var key of Object.keys(metadataobject)) {
    let file_name = require("path").parse(key).name;
    switch (file_name) {
      case "submission":
        target = $(".metadata-button[data-next='submissionUpload']");
        $(target).addClass("done");
        $("#para-submission-file-path").html(
          "File present Blackfynn. <br> Online path: " +
            metadataobject[key].path
        );
        $($("#para-submission-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-submission-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        break;
      case "dataset_description":
        target = $(".metadata-button[data-next='datasetDescriptionUpload']");
        $(target).addClass("done");
        $("#para-ds-description-file-path").html(
          "File present Blackfynn. <br> Online path: " +
            metadataobject[key].path
        );
        $($("#para-ds-description-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-ds-description-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        break;
      case "subjects":
        target = $(".metadata-button[data-next='subjectsUpload']");
        $(target).addClass("done");
        $("#para-subjects-file-path").html(
          "File present Blackfynn. <br> Online path: " +
            metadataobject[key].path
        );
        $($("#para-subjects-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-subjects-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        break;
      case "samples":
        target = $(".metadata-button[data-next='samplesUpload']");
        $(target).addClass("done");
        $("#para-samples-file-path").html(
          "File present Blackfynn. <br> Online path: " +
            metadataobject[key].path
        );
        $($("#para-samples-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-samples-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        break;
      case "README":
        target = $(".metadata-button[data-next='readmeUpload']");
        $(target).addClass("done");
        $("#para-readme-file-path").html(
          "File present Blackfynn. <br> Online path: " +
            metadataobject[key].path
        );
        $($("#para-readme-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-readme-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        break;
      case "CHANGES":
        target = $(".metadata-button[data-next='changesUpload']");
        $(target).addClass("done");
        $("#para-changes-file-path").html(
          "File present Blackfynn. <br> Online path: " +
            metadataobject[key].path
        );
        $($("#para-changes-file-path").parents()[1])
          .find(".div-metadata-confirm")
          .css("display", "flex");
        $($("#para-changes-file-path").parents()[1])
          .find(".div-metadata-go-back")
          .css("display", "none");
        break;
      default:
        break;
    }
  }
};


  function obtainDivsbyCategory(category) {
    var individualQuestions = document.getElementsByClassName('individual-question');
  var categoryQuestionList = [];
  for (var i = 0; i < individualQuestions.length; i++) {
    var question = individualQuestions[i];

    if (question.getAttribute('data-id') !== null) {
      if (question.getAttribute('data-id').includes(category)) {
        categoryQuestionList.push(question.id);
      }
    }
  }
  return categoryQuestionList
}

// Hide showing divs when users click on different option
function hidePrevDivs(currentDiv, category) {
  var individualQuestions = document.getElementsByClassName(category);
  // hide all other div siblings
  for (var i = 0; i < individualQuestions.length; i++) {
    if (currentDiv === individualQuestions[i].id) {
      if (!(currentDiv === 'Question-generate-dataset-existing-folders-options')) {
        $("#" + currentDiv).nextAll().removeClass("show");
        $("#" + currentDiv).nextAll().removeClass("prev");
        $("#" + currentDiv).nextAll().removeClass("test2");

        // /// remove all checkmarks and previous data input
        $("#" + currentDiv).nextAll().find('.option-card.radio-button').removeClass('checked');
        // $("#"+currentDiv).nextAll().find('.option-card.radio-button').css('pointer-events', 'auto');
        $("#" + currentDiv).nextAll().find('.option-card.radio-button').removeClass('non-selected');
        $("#" + currentDiv).nextAll().find('.folder-input-check').prop('checked', false);
        $("#" + currentDiv).nextAll().find('#curatebfdatasetlist').prop("selectedIndex", 0);

        var childElements2 = $("#" + currentDiv).nextAll().find('.form-control');

        for (var child of childElements2) {
          if (child.id === "inputNewNameDataset") {
            document.getElementById(child.id).value = "";
            document.getElementById(child.id).placeholder = "Type here";
          } else {
            document.getElementById(child.id).value = "";
            document.getElementById(child.id).placeholder = "Browse here";
          }
        };
      }
      break
    }
  }
}

function updateJSONStructureGettingStarted() {
  document.getElementById('input-global-path').value = "My_dataset_folder/"
  // if ($('input[name="getting-started-1"]:checked')[0].id === "prepare-new") {
  //   sodaJSONObj["generate-dataset"] = {'path':'', 'destination':'', 'dataset-name': "", "if-existing": "", "generate-option": "new", "if-existing-files": ""}
  // }
  //   var newDatasetName = $('#inputNewNameDataset').val().trim();
  //   sodaJSONObj["bf-account-selected"]["account-name"] = "";
  //   sodaJSONObj["bf-dataset-selected"]["dataset-name"] = "";
  //   sodaJSONObj["generate-dataset"] = {'path':'', 'destination':'', 'dataset-name': newDatasetName, "if-existing": "", "generate-option": "new", "if-existing-files": ""}
  // } else if ($('input[name="getting-started-1"]:checked')[0].id === "previous-progress") {
  //
  // }
  //
  // } else if ($('input[name="getting-started-1"]:checked')[0].id === "modify-existing") {
  //     if ($('input[name="getting-started-2"]:checked')[0].id === "existing-location") {
  //       var localPath = $('#location-new-dataset')[0].placeholder;
  //       sodaJSONObj["generate-dataset"]["path"] = localPath;
  //       sodaJSONObj["generate-dataset"]["dataset-name"] = path.basename(localPath);
  //       // populateOrganizeDatasetUI(sodaJSONObj['dataset-structure'], sodaJSONObj['generate-dataset']['path']);
  //
  //     } else if ($('input[name="getting-started-2"]:checked')[0].id === "existing-BF") {
  //       sodaJSONObj["bf-account-selected"]["account-name"] = $($('#bfallaccountlist').find('option:selected')[0]).val();
  //       sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $($('#curatebfdatasetlist').find('option:selected')[0]).val();
  //       sodaJSONObj["generate-dataset"]["destination"] = "bf";
  //     }
  // }
  // if (sodaJSONObj["generate-dataset"]["dataset-name"] !== "") {
  // if (document.getElementById('input-global-path').value === "/") {
  //   document.getElementById('input-global-path').value = "Mydatasetfolder/"
  // }
  // }
}

// function to populate metadata files
function populateMetadataObject(
  optionList,
  metadataFilePath,
  metadataFile,
  object
) {
  if (!("metadata-files" in object)) {
    object["metadata-files"] = {};
  }
  for (let item in object["metadata-files"]) {
    if (
      item.search(metadataFile) != -1 &&
      object["metadata-files"][item]["type"] == "bf"
    ) {
      if (metadataFilePath == "")
      {
        object["metadata-files"][item]["action"].push("deleted");
      }
      return;
    }
  }
  if (!optionList.includes(metadataFilePath)) {
    var mypath = path.basename(metadataFilePath);
    object["metadata-files"][mypath] = {
      type: "local",
      action: "new",
      path: metadataFilePath,
      destination: "generate-dataset",
    };
  } else {
    for (var key in object["metadata-files"]) {
      if (key.includes(metadataFile)) {
        delete object["metadata-files"][key];
      }
    }
  }
}

// under Generate dataset step: not needed for now
// function checkJSONObjGenerate() {
//   var optionShown = "";
//   if (sodaJSONObj["generate-dataset"]["path"] === "" && sodaJSONObj["bf-account-selected"]["account-name"] === ""  && sodaJSONObj["bf-dataset-selected"]["dataset-name"] === "") {
//     optionShown = "curate-new"
//   } else if (sodaJSONObj["generate-dataset"]["path"] !== "") {
//     optionShown = "modify-existing-local-dataset"
//   } else if (sodaJSONObj["bf-account-selected"]["account-name"] !== "") {
//     optionShown = "modify-existing-bf-dataset"
//   }
//   // show modify local existing dataset or create dataset under a new folder
//  if (optionShown === "modify-existing-local-dataset") {
//     document.getElementById("div-modify-current-local-dataset").style.display = "block";
//     document.getElementById('Question-generate-dataset').classList.add('show');
//     document.getElementById('modify-current-confirmation').innerHTML = "SODA will modify this dataset: <b style='color:var(--color-bg-plum)'>" +sodaJSONObj["generate-dataset"]["path"]+"</b>.<br>Please click the button below to confirm."
//   } else if (optionShown === "modify-existing-bf-dataset") {
//     document.getElementById('Question-generate-dataset').classList.remove('show');
//     document.getElementById('Question-generate-dataset-bf-confirmation').classList.add('show');
//     document.getElementById("generate-bf-confirmation").innerHTML = "SODA will modify this dataset: <b style='color:var(--color-bg-plum)'>" + sodaJSONObj["bf-dataset-selected"] + "</b><br>You specify this Blackfynn account: <b style='color:var(--color-bg-plum)'>" + sodaJSONObj["bf-account-selected"]["account-name"] + "</b>.<br> Please confirm by clicking the button below."
//   } else {
//     document.getElementById('Question-generate-dataset').classList.add('show');
//   }
// }

/// function to populate/reload Organize dataset UI when users move around between tabs and make changes
// (to high-level folders)
function populateOrganizeDatasetUI(currentLocation, datasetFolder) {
  var baseName = path.basename(datasetFolder)
  currentLocation = { "type": "local", "folders": {}, "files": {}, 'action': ['existing'] }

  var myitems = fs.readdirSync(datasetFolder)
  myitems.forEach(element => {
    var statsObj = fs.statSync(path.join(datasetFolder, element))
    var addedElement = path.join(datasetFolder, element)
    if (statsObj.isDirectory()) {
      currentLocation["folders"][element] = { "type": "local", "folders": {}, "files": {}, 'action': ['existing'] }
      populateJSONObjFolder(jsonObject["folders"][element], addedElement)
    } else if (statsObj.isFile()) {
      currentLocation["files"][element] = { "path": addedElement, "description": "", "additional-metadata": "", "type": "local", 'action': ['existing'] }
    }
    var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' + element + '</div></div>'
    $('#items').html(appendString)

    listItems(currentLocation, '#items')
    getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  });
}

////////////////////// Functions to update JSON object after each step //////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Step 3: Dataset structure

function updateJSONStructureDSstructure() {
  sodaJSONObj["dataset-structure"] = datasetStructureJSONObj;
  // check if dataset-structure key is empty (no high-level folders are included)
  if (JSON.stringify(sodaJSONObj["dataset-structure"]) === "{}" ||
    JSON.stringify(sodaJSONObj["dataset-structure"]["folders"]) === "{}") {
    delete sodaJSONObj["dataset-structure"]
  }
  console.log(sodaJSONObj["dataset-structure"])
}

// Step 4: Metadata files
/// function to obtain metadata file paths from UI and then populate JSON obj
function updateJSONStructureMetadataFiles() {
  var submissionFilePath = document.getElementById('para-submission-file-path').innerHTML;
  var dsDescriptionFilePath = document.getElementById('para-ds-description-file-path').innerHTML;
  var subjectsFilePath = document.getElementById('para-subjects-file-path').innerHTML;
  var samplesFilePath = document.getElementById('para-samples-file-path').innerHTML;
  var readmeFilePath = document.getElementById('para-readme-file-path').innerHTML;
  var changesFilePath = document.getElementById('para-changes-file-path').innerHTML;
  var invalidOptionsList = ["Please drag a file!", "Please only import SPARC metadata files!", "", "Your SPARC metadata file must be in one of the formats listed above!", "Your SPARC metadata file must be named and formatted exactly as listed above!"];

  populateMetadataObject(invalidOptionsList, submissionFilePath, "submission", sodaJSONObj);
  populateMetadataObject(invalidOptionsList, dsDescriptionFilePath, "dataset_description", sodaJSONObj);
  populateMetadataObject(invalidOptionsList, subjectsFilePath, "subjects", sodaJSONObj);
  populateMetadataObject(invalidOptionsList, samplesFilePath, "samples", sodaJSONObj);
  populateMetadataObject(invalidOptionsList, readmeFilePath, "README", sodaJSONObj);
  populateMetadataObject(invalidOptionsList, changesFilePath, "CHANGES", sodaJSONObj);

  if (JSON.stringify(sodaJSONObj["metadata-files"]) === "{}") {
    delete sodaJSONObj["metadata-files"]
  }
}

// Step 5: Manifest file
// update JSON object with manifest file information
function updateJSONStructureManifest() {
  if (manifestFileCheck.checked) {
    if ("manifest-files" in sodaJSONObj) {
      // cj this might need to be changed
      sodaJSONObj["manifest-files"]["destination"] = "generate-dataset"
    } else {
      sodaJSONObj["manifest-files"] = { "destination": "generate-dataset" }
    }
  } else {
    delete sodaJSONObj["manifest-files"]
  }
}

// Step 6: Generate dataset
// update JSON object after users finish Generate dataset step
function updateJSONStructureGenerate() {
  //cj - add code here to update the json structure to account for the new stuff
  // answer to Question 1: where to generate: locally or BF
  if (sodaJSONObj["starting-point"] == "bf") {
    if (!("bf-account-selected" in sodaJSONObj)) {
      console.log("bf-account-selected not in structure");
    }
    if (!("bf-dataset-selected" in sodaJSONObj)) {
      console.log("bf-dataset-selected not in structure");
    }
    sodaJSONObj["generate-dataset"] = {
      destination: "bf",
      "generate-option": "existing",
    };
  }
  if (sodaJSONObj["starting-point"] == "new") {
    if (
      $('input[name="generate-1"]:checked')[0].id === "generate-local-desktop"
    ) {
      var localDestination = $("#input-destination-generate-dataset-locally")[0]
        .placeholder;
      var newDatasetName = $("#inputNewNameDataset").val().trim();
      sodaJSONObj["generate-dataset"] = {
        destination: "local",
        path: localDestination,
        "dataset-name": newDatasetName,
        "generate-option": "new",
        "if-existing": "new",
      };
      // delete bf account and dataset keys
      if ("bf-account-selected" in sodaJSONObj) {
        delete sodaJSONObj["bf-account-selected"];
      }
      if ("bf-dataset-selected" in sodaJSONObj) {
        delete sodaJSONObj["bf-dataset-selected"];
      }
    } else if (
      $('input[name="generate-1"]:checked')[0].id === "generate-upload-BF"
    ) {
      sodaJSONObj["generate-dataset"] = {
        destination: "bf",
        "generate-option": "new",
      };

      if ("bf-account-selected" in sodaJSONObj) {
        sodaJSONObj["bf-account-selected"]["account-name"] = $(
          $("#bfallaccountlist").find("option:selected")[0]
        ).val();
      } else {
        sodaJSONObj["bf-account-selected"] = {
          "account-name": $(
            $("#bfallaccountlist").find("option:selected")[0]
          ).val(),
        };
      }
      // answer to Question if generate on BF, then: how to handle existing files and folders
      if (
        $('input[name="generate-4"]:checked')[0].id ===
        "generate-BF-dataset-options-existing"
      ) {
        if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-duplicate"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
        } else if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-replace"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing"] = "replace";
        } else if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-merge"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing"] = "merge";
        } else if (
          $('input[name="generate-5"]:checked')[0].id ===
          "existing-folders-skip"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing"] = "skip";
        }
        if (
          $('input[name="generate-6"]:checked')[0].id ===
          "existing-files-duplicate"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing-files"] =
            "create-duplicate";
        } else if (
          $('input[name="generate-6"]:checked')[0].id ===
          "existing-files-replace"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing-files"] = "replace";
        } else if (
          $('input[name="generate-6"]:checked')[0].id === "existing-files-skip"
        ) {
          sodaJSONObj["generate-dataset"]["if-existing-files"] = "skip";
        }
        // populate JSON obj with BF dataset and account
        if ("bf-dataset-selected" in sodaJSONObj) {
          sodaJSONObj["bf-dataset-selected"]["dataset-name"] = $(
            $("#curatebfdatasetlist").find("option:selected")[0]
          ).val();
        } else {
          sodaJSONObj["bf-dataset-selected"] = {
            "dataset-name": $(
              $("#curatebfdatasetlist").find("option:selected")[0]
            ).val(),
          };
        }
        // if generate to a new dataset, then update JSON object with a new dataset
      } else if (
        $('input[name="generate-4"]:checked')[0].id ===
        "generate-BF-dataset-options-new"
      ) {
        var newDatasetName = $("#inputNewNameDataset").val().trim();
        sodaJSONObj["generate-dataset"]["dataset-name"] = newDatasetName;
        sodaJSONObj["generate-dataset"]["if-existing"] = "create-duplicate";
        sodaJSONObj["generate-dataset"]["if-existing-files"] =
          "create-duplicate";
        // if upload to a new bf dataset, then delete key below from JSON object
        if ("bf-dataset-selected" in sodaJSONObj) {
          delete sodaJSONObj["bf-dataset-selected"];
        }
      }
    }
  }
}

// function to call when users click on Continue at each step
function updateOverallJSONStructure(id) {
  if (id === allParentStepsJSON["high-level-folders"]) {
    document.getElementById("input-global-path").value = "My_dataset_folder/";
    var optionCards = document.getElementsByClassName(
      "option-card high-level-folders"
    );
    var newDatasetStructureJSONObj = { folders: {} };
    var keys = [];
    for (var card of optionCards) {
      if ($(card).hasClass("checked")) {
        keys.push($(card).children()[0].innerText);
      }
    }
    keys.forEach((folder) => {
      if (Object.keys(datasetStructureJSONObj["folders"]).includes(folder)) {
        // clone a new json object
        newDatasetStructureJSONObj["folders"][folder] =
          datasetStructureJSONObj["folders"][folder];
      } else {
        newDatasetStructureJSONObj["folders"][folder] = {
          folders: {},
          files: {},
          type: "",
        };
      }
    });
    datasetStructureJSONObj = newDatasetStructureJSONObj;
    listItems(datasetStructureJSONObj, "#items");
    getInFolder(
      ".single-item",
      "#items",
      organizeDSglobalPath,
      datasetStructureJSONObj
    );
  } else if (id === allParentStepsJSON["getting-started"]) {
    updateJSONStructureGettingStarted();
  } else if (id === allParentStepsJSON["metadata-files"]) {
    updateJSONStructureMetadataFiles();
  } else if (id === allParentStepsJSON["manifest-file"]) {
    updateJSONStructureManifest();
  } else if (id === allParentStepsJSON["organize-dataset"]) {
    updateJSONStructureDSstructure();
  }
}
//////////////////////////////// END OF Functions to update JSON object //////////////////////////////////////////

// function associated with the Exit button (Step 6: Generate dataset -> Generate div)
function exitCurate() {
  document.getElementById('generate-dataset-progress-tab').style.display = "none";
  // set SODA json object back
  sodaJSONObj = {};
  // uncheck all radio buttons and checkboxes
  $(".option-card").removeClass('checked');
  $(".option-card.radio-button").removeClass('non-selected');
  $(".option-card.high-level-folders").removeClass('disabled');
  $(".option-card, .folder-input-check").prop('checked', false);
  $('.metadata-button.button-generate-dataset').removeClass('done');
  $('#organize-section input:checkbox').prop('checked', false);
  $('#organize-section input:radio').prop('checked', false);
  // set metadata file paths to empty
  $('.para-metadata-file-status').text("");
  // un-show all divs from Generate dataset step
  $($('#Question-generate-dataset').siblings()).removeClass('show');
  $('.generate-dataset').removeClass('prev');
  $('.generate-dataset').removeClass('show');
  $('.generate-dataset').removeClass('test2');
  // reset dataset structure JSON
  datasetStructureJSONObj = { "folders": {} }
  // uncheck auto-generated manifest checkbox
  $("#generate-manifest-curate").prop('checked', false);
  // reset Curate's vertical progress bar step
  $('.vertical-progress-bar-step').removeClass('is-current')
  $('.vertical-progress-bar-step').removeClass('done')
}

// once users click on option card: Organize dataset
document.getElementById('button-section-organize-dataset').addEventListener('click', function () {
  $('.vertical-progress-bar').css('display', 'flex');
  document.getElementById('generate-dataset-progress-tab').style.display = "none";
  if (!($('#getting-started-tab').hasClass('tab-active'))) {
    $('#getting-started-tab').addClass('tab-active');
  }
  currentTab = 0
  showParentTab(0, 1)
})

// function exitOrganizeSection() {
//   bootbox.confirm({
//     title: "Exit section",
//     message: "<p>Are you sure you want to exit the current section and clear the current file organization?</p>",
//     centerVertical: true,
//     callback: function(r) {
//       if (r!==null) {
//         bootbox.confirm({
//           title: "Exit section",
//           message: "<p>Would you like to save your progress?</p>",
//           centerVertical: true,
//           callback: function(result) {
//             if (result!==null) {
//
//             }
//       }
// }
//
// function saveOrganizeProgress() {
//
// }

function hideNextDivs(currentDiv) {
  // make currentDiv current class
  $('#' + currentDiv).removeClass('prev')
  $('#' + currentDiv).removeClass('test2')
  // hide subsequent divs
  $($('#' + currentDiv).nextAll()).removeClass('prev');
  $($('#' + currentDiv).nextAll()).removeClass('show');
  $($('#' + currentDiv).nextAll()).removeClass('test2');
}

// save progress up until step 5 for now
function updateJSONObjectProgress() {
  updateJSONStructureGettingStarted()
  updateJSONStructureMetadataFiles()
  updateJSONStructureManifest()
  updateJSONStructureDSstructure()
  updateJSONStructureGenerate()
}

function saveSODAJSONProgress(progressFileName) {
  try {
    fs.mkdirSync(progressFilePath, { recursive: true });
  } catch (error) {
    log.error(error)
    console.log(error)
  }
  var filePath = path.join(progressFilePath, progressFileName + ".json");
  // record all information listed in SODA JSON Object before saving
  updateJSONObjectProgress()
  console.log(sodaJSONObj)
  fs.writeFileSync(filePath, JSON.stringify(sodaJSONObj))
  bootbox.alert({
    message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully saved progress.",
    centerVertical: true
  })
}

// function to save Progress
function saveOrganizeProgressPrompt() {
  // check if "save-progress" key is in JSON object
  // if yes, keep saving to that file
  if ("save-progress" in sodaJSONObj) {
    // save to file
    saveSODAJSONProgress(sodaJSONObj["save-progress"]);
    // if no, ask users what to name it, and create file
  } else {
    bootbox.prompt({
      title: "Saving progress as...",
      message: "Enter a name for your progress below:",
      centerVertical: true,
      callback: function (result) {
        if (result !== null && result !== "") {
          sodaJSONObj["save-progress"] = result.trim();
          saveSODAJSONProgress(result.trim())
        }
      }
    })
  }
}
