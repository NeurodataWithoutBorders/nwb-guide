// //////////////////////////////////
// // Import required modules
// //////////////////////////////////

// const fs = require("fs-extra");
// const os = require("os");
// const path = require("path");
// const { ipcRenderer } = require("electron");
// const remote = require("@electron/remote");
import { Notyf } from "notyf";
// import imageDataURI from "image-data-uri";
// import log from "electron-log";
// import Airtable from "airtable";
// import "v8-compile-cache";
import Tagify from "@yaireo/tagify";
// import https from "https";
// const electron = require("electron");
// import Jimp from "jimp";
import tippy from "tippy.js";
import introJs from "intro.js";
import "bootstrap-select"; // Provides a method on certain HTML Elements

import validator from "validator";
import doiRegex from "doi-regex";
import lottie from "lottie-web";
import DragSort from "@yaireo/dragsort";

import { datasetUploadSession } from "./analytics/upload-session-tracker.js";

import {
  logCurationErrorsToAnalytics,
  logCurationSuccessToAnalytics,
} from "./analytics/curation-analytics.js";

import { determineDatasetLocation } from "./analytics/analytics-utils.js";
import { clientError, userErrorMessage } from "./http-error-handler/error-handler.js";
import api from "./api/api.js";

import axios from "axios";
import DatePicker from "tui-date-picker"; /* CommonJS */

import globals, { port } from "./globals";

import Swal from "sweetalert2"
import Cropper from "cropperjs"
import { isElectron } from "./electron/check.js";


// Home Page Behaviors
const directToGuidedMode = () => {
  const guidedModeLinkButton = document.getElementById("guided_mode_view");
  guidedModeLinkButton.click();
};
const directToFreeFormMode = () => {
  const freeFormModeLinkButton = document.getElementById("main_tabs_view");
  freeFormModeLinkButton.click();
};

document
  .getElementById("home-button-guided-mode-link")
  .addEventListener("click", directToGuidedMode);
document
  .getElementById("home-button-free-form-mode-link")
  .addEventListener("click", directToFreeFormMode);


// -----------------------------------------------------------------------------------
// ------------------------------ Previously manage-dataset.js ------------------------------
// -----------------------------------------------------------------------------------

// event listeners for opening dataset or account selection dropdown
document.querySelectorAll(".ds-dd").forEach((dropdownElement) => {
  dropdownElement.addEventListener("click", function () {
    openDropdownPrompt(this, "dataset");
  });
});

document.querySelectorAll(".md-change-current-account").forEach((dropdownElement) => {
  dropdownElement.addEventListener("click", function () {
    openDropdownPrompt(this, "bf");
  });
});

var forbidden_characters_bf = '/:*?"<>';

const check_forbidden_characters_bf = (my_string) => {
  // Args:
  // my_string: string with characters (string)
  // Returns:
  // False: no forbidden character
  // True: presence of forbidden character(s)
  let check = false;

  for (let i = 0; i < forbidden_characters_bf.length; i++) {
    if (my_string.indexOf(forbidden_characters_bf[i]) > -1) {
      return true;
    }
  }

  return check;
};

const determineSwalLoadingMessage = (addEditButton) => {
  let loadingMessage = "";
  switch (addEditButton.text()) {
    case "Add subtitle":
      loadingMessage = "Adding subtitle to dataset";
      break;
    case "Edit subtitle":
      loadingMessage = "Editing your dataset's subtitle";
      break;
    case "Add description":
      loadingMessage = "Adding description to dataset";
      break;
    case "Edit description":
      loadingMessage = "Editing your dataset's description";
      break;
    case "Add tags":
      loadingMessage = "Adding tags to dataset";
      break;
    case "Edit tags":
      loadingMessage = "Editing your dataset's tags";
      break;
  }
  return loadingMessage;
};

const determineSwalSuccessMessage = (addEditButton) => {
  let successMessage = "";
  switch (addEditButton.text()) {
    case "Add subtitle":
      successMessage = "Successfully added subtitle to dataset";
      break;
    case "Edit subtitle":
      successMessage = "Successfully edited dataset's subtitle";
      break;
    case "Add description":
      successMessage = "Successfully added description to dataset";
      break;
    case "Edit description":
      successMessage = "Successfully edited dataset's description";
      break;
    case "Add tags":
      successMessage = "Successfully added tags to dataset";
      break;
    case "Edit tags":
      successMessage = "Successfully edited dataset's tags";
      break;
  }
  return successMessage;
};

// illegal character name warning for new dataset names
$("#bf-new-dataset-name").on("keyup", () => {
  let newName = $("#bf-new-dataset-name").val().trim();

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      Swal.fire({
        title: "A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>.",
        icon: "error",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });

      $("#button-create-bf-new-dataset").hide();
    } else {
      $("#button-create-bf-new-dataset").show();
    }
  } else {
    $("#button-create-bf-new-dataset").hide();
  }
});

$("#bf-rename-dataset-name").on("keyup", () => {
  let newName = $("#bf-rename-dataset-name").val().trim();

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      Swal.fire({
        title: "A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>.",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
      });

      $("#button-rename-dataset").hide();
    } else {
      $("#button-rename-dataset").show();
    }
  } else {
    $("#button-rename-dataset").hide();
  }
});

// Add new dataset folder (empty) on bf //
$("#button-create-bf-new-dataset").click(async () => {
  setTimeout(async () => {
    let selectedbfaccount = defaultBfAccount;
    let bfNewDatasetName = $("#bf-new-dataset-name").val();



    $("#button-create-bf-new-dataset").prop("disabled", true);

    Swal.fire({
      title: `Creating a new dataset named: ${bfNewDatasetName}`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      let bf_new_dataset = await client.post(
        `/manage_datasets/datasets`,
        {
          input_dataset_name: bfNewDatasetName,
        },
        {
          params: {
            selected_account: selectedbfaccount,
          },
        }
      );
      let res = bf_new_dataset.data.id;

      Swal.fire({
        title: `Dataset ${bfNewDatasetName} was created successfully`,
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      });



      $("#button-create-bf-new-dataset").hide();

      defaultBfDataset = bfNewDatasetName;
      defaultBfDatasetId = res;
      // log a map of datasetId to dataset name to analytics
      // this will be used to help us track private datasets which are not trackable using a datasetId alone
      ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        defaultBfDatasetId,
        defaultBfDataset
      );
      refreshDatasetList();
      currentDatasetPermission.innerHTML = "";
      currentAddEditDatasetPermission.innerHTML = "";
      $("#button-create-bf-new-dataset").prop("disabled", false);

      addNewDatasetToList(bfNewDatasetName);
      ipcRenderer.send(
        "track-event",
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CREATE_DATASET,
        bfNewDatasetName
      );



      datasetList = [];
      datasetList = await api.getDatasetsForAccount(defaultBfAccount);


      $(".bf-dataset-span").html(bfNewDatasetName);

      refreshDatasetList();
      updateDatasetList();

      $(".confirm-button").click();
      $("#bf-new-dataset-name").val("");
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      Swal.fire({
        title: `Failed to create a new dataset.`,
        text: emessage,
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      $("#button-create-bf-new-dataset").prop("disabled", false);

      ipcRenderer.send(
        "track-event",
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CREATE_DATASET,
        bfNewDatasetName
      );
    }
  }, delayAnimation);
});

/// add new datasets to dataset List without calling Python to retrieve new list from Pennsieve
const addNewDatasetToList = (newDataset) => {
  datasetList.push({ name: newDataset, role: "owner" });
};

// Rename dataset on pennsieve
$("#button-rename-dataset").on("click", async () => {
  setTimeout(async function () {
    var selectedbfaccount = defaultBfAccount;
    var currentDatasetName = defaultBfDataset;
    var renamedDatasetName = $("#bf-rename-dataset-name").val();

    Swal.fire({
      title: `Renaming dataset ${currentDatasetName} to ${renamedDatasetName}`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (currentDatasetName === "Select dataset") {
      emessage = "Please select a valid dataset";
      Swal.fire({
        title: "Failed to rename dataset",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    } else {
      $("#button-rename-dataset").prop("disabled", true);

      try {
        await client.put(
          `/manage_datasets/bf_rename_dataset`,
          {
            input_new_name: renamedDatasetName,
          },
          {
            params: {
              selected_account: selectedbfaccount,
              selected_dataset: currentDatasetName,
            },
          }
        );
      } catch (error) {
        clientError(error);
        Swal.fire({
          title: "Failed to rename dataset",
          text: userErrorMessage(error),
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
        $("#button-rename-dataset").prop("disabled", false);

        ipcRenderer.send(
          "track-event",
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_RENAME_DATASET,
          `${defaultBfDatasetId}: ` + currentDatasetName + " to " + renamedDatasetName
        );

        return;
      }


      defaultBfDataset = renamedDatasetName;
      $(".bf-dataset-span").html(renamedDatasetName);
      refreshDatasetList();
      $("#bf-rename-dataset-name").val(renamedDatasetName);
      Swal.fire({
        title: `Renamed dataset ${currentDatasetName} to ${renamedDatasetName}`,
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          Swal.hideLoading();
        },
      });
      $("#button-rename-dataset").prop("disabled", false);

      ipcRenderer.send(
        "track-event",
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_RENAME_DATASET,
        `${defaultBfDatasetId}: ` + currentDatasetName + " to " + renamedDatasetName
      );

      // in case the user does not select a dataset after changing the name add the new datasetID to name mapping
      ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        defaultBfDatasetId,
        renamedDatasetName
      );



      try {
        datasetList = [];
        datasetList = await api.getDatasetsForAccount(defaultBfAccount);
        refreshDatasetList();
      } catch (error) {
        clientError(error);
      }
    }
  }, delayAnimation);
});

// Make PI owner //
$("#button-add-permission-pi").click(async () => {
  Swal.fire({
    icon: "warning",
    text: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    heightAuto: false,
    showCancelButton: true,
    cancelButtonText: "No",
    focusCancel: true,
    confirmButtonText: "Yes",
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    preConfirm: () => {
      let userVal = document.getElementById("bf_list_users_pi").value;
      if (userVal === "Select PI") {
        Swal.showValidationMessage("Please choose a valid user");
      }
    },
  }).then(async (result) => {
    if (result.isConfirmed) {


      Swal.fire({
        title: "Changing PI Owner of dataset",
        html: "Please wait...",
        // timer: 5000,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let selectedBfAccount = defaultBfAccount;
      let selectedBfDataset = defaultBfDataset;
      let selectedUser = $("#bf_list_users_pi").val();
      let selectedRole = "owner";

      try {
        let bf_change_owner = await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: selectedRole,
          },
          {
            params: {
              selected_account: selectedBfAccount,
              selected_dataset: selectedBfDataset,
              scope: "user",
              name: selectedUser,
            },
          }
        );

        let res = bf_change_owner.data.message;


        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_MAKE_PI_OWNER,
          defaultBfDatasetId
        );

        showCurrentPermission();
        changeDatasetRolePI(selectedBfDataset);

        Swal.fire({
          title: "Successfully changed PI Owner of dataset",
          text: res,
          icon: "success",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } catch (error) {
        clientError(error);
        ipcRenderer.send(
          "track-event",
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_MAKE_PI_OWNER,
          defaultBfDatasetId
        );

        let emessage = userErrorMessage(error);
        Swal.fire({
          title: "Failed to change PI permission!",
          text: emessage,
          icon: "error",
          showConfirmButton: true,
          heightAuto: false,
          backdrop: "rgba(0, 0, 0, 0.4)",
        });
      }
    }
  });
});

/// change PI owner status to manager
const changeDatasetRolePI = (selectedDataset) => {
  for (var i = 0; i < datasetList.length; i++) {
    if (datasetList[i].name === selectedDataset) {
      datasetList[i].role = "manager";
    }
  }
};

const showCurrentPermission = async () => {
  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  currentDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;
  currentAddEditDatasetPermission.innerHTML = `Loading current permissions... <div class="ui active green inline loader tiny"></div>`;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    currentDatasetPermission.innerHTML = "None";
    currentAddEditDatasetPermission.innerHTML = "None";
    return;
  }



  try {
    let permissions = await api.getDatasetPermissions(selectedBfAccount, selectedBfDataset);
    let permissionList = "";
    let datasetOwner = "";

    for (let i in permissions) {
      permissionList = permissionList + permissions[i] + "<br>";

      if (permissions[i].indexOf("owner") != -1) {
        let first_position = permissions[i].indexOf(":");
        let second_position = permissions[i].indexOf(",");

        datasetOwner = permissions[i].substring(first_position + 2, second_position);
      }
    }

    currentDatasetPermission.innerHTML = datasetOwner;
    currentAddEditDatasetPermission.innerHTML = permissionList;

    curation_consortium_check();
  } catch (error) {
    clientError(error);
  }
};

const addPermissionUser = async (
  selectedBfAccount,
  selectedBfDataset,
  selectedUser,
  selectedRole
) => {


  let bf_add_permission;
  try {
    bf_add_permission = await client.patch(
      `/manage_datasets/bf_dataset_permissions`,
      {
        input_role: selectedRole,
      },
      {
        params: {
          selected_account: selectedBfAccount,
          selected_dataset: selectedBfDataset,
          scope: "user",
          name: selectedUser,
        },
      }
    );
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
    Swal.fire({
      title: "Failed to change permission!",
      text: emessage,
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
      AnalyticsGranularity.ALL_LEVELS,
      ["Add User Permissions"]
    );

    return;
  }

  let res = bf_add_permission.data.message;

  Swal.fire({
    title: "Successfully changed permission!",
    text: res,
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });



  logGeneralOperationsForAnalytics(
    "Success",
    ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
    AnalyticsGranularity.ALL_LEVELS,
    ["Add User Permissions"]
  );

  showCurrentPermission();

  try {
    // refresh dataset lists with filter
    let get_username = await client.get(`/manage_datasets/account/username`, {
      params: {
        selected_account: selectedBfAccount,
      },
    });
    let { username } = get_username.data;

    if (selectedRole === "owner") {
      for (var i = 0; i < datasetList.length; i++) {
        if (datasetList[i].name === selectedBfDataset) {
          datasetList[i].role = "manager";
        }
      }
    }
    if (selectedUser === username) {
      // then change role of dataset and refresh dataset list
      for (var i = 0; i < datasetList.length; i++) {
        if (datasetList[i].name === selectedBfDataset) {
          datasetList[i].role = selectedRole.toLowerCase();
        }
      }
    }
  } catch (error) {
    clientError(error);
  }
};

// Add permission for user //
$("#button-add-permission-user").click(() => {
  setTimeout(() => {


    Swal.fire({
      title: `Adding a permission for your selected user`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let selectedUser = $("#bf_list_users").val();
    let selectedRole = $("#bf_list_roles_user").val();

    addPermissionUser(selectedBfAccount, selectedBfDataset, selectedUser, selectedRole);
  }, delayAnimation);
});

// Add permission for team
$("#button-add-permission-team").click(async () => {
  setTimeout(async () => {


    Swal.fire({
      title: `Adding a permission for your selected team`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let selectedTeam = $("#bf_list_teams").val();
    let selectedRole = $("#bf_list_roles_team").val();

    try {
      let bf_add_team_permission = await client.patch(
        `/manage_datasets/bf_dataset_permissions`,
        {
          input_role: selectedRole,
        },
        {
          params: {
            selected_account: selectedBfAccount,
            selected_dataset: selectedBfDataset,
            scope: "team",
            name: selectedTeam,
          },
        }
      );

      let res = bf_add_team_permission.data.message;

      logGeneralOperationsForAnalytics(
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
        AnalyticsGranularity.ALL_LEVELS,
        ["Add Team Permissions"]
      );

      Swal.fire({
        title: "Successfully changed permission",
        text: res,
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      showCurrentPermission();
    } catch (error) {
      clientError(error);

      let emessage = userErrorMessage(error);
      Swal.fire({
        title: "Failed to change permission",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      logGeneralOperationsForAnalytics(
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_PERMISSIONS,
        AnalyticsGranularity.ALL_LEVELS,
        ["Add Team Permissions"]
      );
    }
  }, delayAnimation);
});

// Character count for subtitle //
function countCharacters(textelement, pelement) {
  var textEntered = textelement.value;
  var counter = 255 - textEntered.length;
  pelement.innerHTML = counter + " characters remaining";
  return textEntered.length;
}

$(document).ready(() => {
  bfDatasetSubtitle.addEventListener("keyup", function () {
    countCharacters(bfDatasetSubtitle, bfDatasetSubtitleCharCount);
  });
});

// Add subtitle //
$("#button-add-subtitle").click(async () => {
  setTimeout(async function () {
    Swal.fire({
      title: determineSwalLoadingMessage($("#button-add-subtitle")),
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let inputSubtitle = $("#bf-dataset-subtitle").val().trim();




    try {
      await client.put(
        `/manage_datasets/bf_dataset_subtitle`,
        {
          input_subtitle: inputSubtitle,
        },
        {
          params: {
            selected_account: selectedBfAccount,
            selected_dataset: selectedBfDataset,
          },
        }
      );



      $("#ds-description").val(inputSubtitle);

      Swal.fire({
        title: determineSwalSuccessMessage($("#button-add-subtitle")),
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      }).then(
        //check if subtitle text is empty and set Add/Edit button appropriately
        !$("#bf-dataset-subtitle").val()
          ? $("#button-add-subtitle").html("Add subtitle")
          : $("#button-add-subtitle").html("Edit subtitle")
      );

      ipcRenderer.send(
        "track-event",
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
        defaultBfDatasetId
      );

      // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
      showPrePublishingStatus();
    } catch (error) {
      clientError(error);

      let emessage = userErrorMessage(error);
      Swal.fire({
        title: "Failed to add subtitle!",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      $("#ds-description").val("");

      ipcRenderer.send(
        "track-event",
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
        defaultBfDatasetId
      );
    }
  }, delayAnimation);
});

const showCurrentSubtitle = async () => {
  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    $("#bf-dataset-subtitle").val("");
    return;
  }



  document.getElementById("ds-description").innerHTML = "Loading...";
  document.getElementById("ds-description").disabled = true;

  try {
    let subtitle = await api.getDatasetSubtitle(selectedBfAccount, selectedBfDataset);
    logGeneralOperationsForAnalytics(
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
      AnalyticsGranularity.ACTION,
      ["Get Subtitle"]
    );
    $("#bf-dataset-subtitle").val(subtitle);
    $("#ds-description").val(subtitle);
    let result = countCharacters(bfDatasetSubtitle, bfDatasetSubtitleCharCount);
    if (result === 0) {
      $("#button-add-subtitle > .btn_animated-inside").html("Add subtitle");
    } else {
      $("#button-add-subtitle > .btn_animated-inside").html("Edit subtitle");
    }
  } catch (error) {
    clientError(error);
    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get Subtitle"]
    );
    $("#ds-description").val("");
  }

  document.getElementById("ds-description").disabled = false;
};

// Add description //

const requiredSections = {
  studyPurpose: "study purpose",
  dataCollection: "data collection",
  primaryConclusion: "primary conclusion",
  invalidText: "invalid text",
};

// open the first section of the accordion for first time user navigation to the section
let dsAccordion = $("#dd-accordion").accordion();
dsAccordion.accordion("open", 0);

// fires whenever a user selects a dataset, from any card
const showCurrentDescription = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset" || selectedBfDataset === null) {
    return;
  }

  // check if the warning message for invalid text is showing on the page
  let warningDisplayProperty = $("#ds-isa-warning").css("display");
  if (warningDisplayProperty === "flex") {
    // hide the warning message to prevent the user from seeing the warning for a new dataset
    $("#ds-isa-warning").css("display", "none");
  }



  // get the dataset readme
  let readme;
  try {
    readme = await api.getDatasetReadme(selectedBfAccount, selectedBfDataset);
  } catch (error) {
    clientError(error);
    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get Readme"]
    );
    return;
  }

  logGeneralOperationsForAnalytics(
    "Success",
    ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
    AnalyticsGranularity.ACTION,
    ["Get Readme"]
  );

  // create the parsed dataset read me object
  let parsedReadme;
  try {
    parsedReadme = createParsedReadme(readme);
  } catch (error) {
    // log the error and send it to analytics

    console.error(error);

    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      AnalyticsGranularity.ALL_LEVELS,
      ["Parse Readme"]
    );
    return;
  }

  logGeneralOperationsForAnalytics(
    "Success",
    ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
    AnalyticsGranularity.ACTION,
    ["Parse Readme"]
  );

  // check if any of the fields have data
  if (
    parsedReadme[requiredSections.studyPurpose] ||
    parsedReadme[requiredSections.dataCollection] ||
    parsedReadme[requiredSections.primaryConclusion]
  ) {
    //if so make the button say edit description
    $("#button-add-description > .btn_animated-inside").html("Edit description");
  } else {
    //make the button say add description
    $("#button-add-description > .btn_animated-inside").html("Add description");
  }

  // remove any text that was already in the section
  $("#ds-description-study-purpose").val("");
  $("#ds-description-data-collection").val("");
  $("#ds-description-primary-conclusion").val("");

  // place the text into the text area for that field
  $("#ds-description-study-purpose").val(
    parsedReadme[requiredSections.studyPurpose].replace(/\r?\n|\r/g, "")
  );

  // place the text into the text area for that field
  $("#ds-description-data-collection").val(
    parsedReadme[requiredSections.dataCollection].replace(/\r?\n|\r/g, "")
  );

  // place the text into the text area for that field
  $("#ds-description-primary-conclusion").val(
    parsedReadme[requiredSections.primaryConclusion].replace(/\r?\n|\r/g, "")
  );

  // check if there is any invalid text remaining
  if (parsedReadme[requiredSections.invalidText]) {
    // show the UI warning message
    // that informs the user their invalid data has been added to
    // the first section so they can place it in the correct section
    $("#ds-isa-warning").css("display", "flex");

    // make the study purpose section visible instead of whatever section the user has open
    // this ensures when they come back to the description after loading a dataset in a different card
    // that the warning is visible
    $("#dd-accordion").accordion("open", 0);

    // if so add it to the first section
    $("#ds-description-study-purpose").val(
      parsedReadme[requiredSections.studyPurpose].replace(/\r?\n|\r/g, "") +
        parsedReadme[requiredSections.invalidText].replace(/\r?\n|\r/g, "")
    );
  }
};

$("#button-add-description").click(() => {
  setTimeout(async () => {
    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;

    // get the text from the three boxes and store them in their own variables
    let requiredFields = [];

    // read and sanatize the input for spaces and reintroduced bolded keywords
    let studyPurpose = $("#ds-description-study-purpose").val().trim();
    studyPurpose.replace("**Study Purpose:**", "");
    if (studyPurpose.length) {
      requiredFields.push("**Study Purpose:** " + studyPurpose + "\n");
    }

    let dataCollection = $("#ds-description-data-collection").val().trim();
    dataCollection.replace("**Data Collection:**", "");
    if (dataCollection.length) {
      requiredFields.push("**Data Collection:** " + dataCollection + "\n");
    }
    let primaryConclusion = $("#ds-description-primary-conclusion").val().trim();
    primaryConclusion.replace("**Primary Conclusion:**", "");
    if (primaryConclusion.length) {
      requiredFields.push("**Primary Conclusion:** " + primaryConclusion + "\n");
    }
    // validate the new markdown description the user created
    let response = validateDescription(requiredFields.join(""));

    if (!response) {
      Swal.fire({
        icon: "warning",
        title: "This description does not follow SPARC guidelines.",
        html: `
        Your description should include all of the mandatory sections. Additionally, each section should be no longer than one paragraph.
        <br>
        <br>
        Are you sure you want to continue?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Continue",
        cancelButtonText: "No, I want to edit my description",
        reverseButtons: true,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then(async (result) => {
        if (!result.isConfirmed) {
          return;
        }
        // hide the warning message if it exists
        $("#ds-isa-warning").css("display", "none");
        await addDescription(selectedBfDataset, requiredFields.join("\n"));
        // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
        showPrePublishingStatus();
      });
    } else {
      // hide the warning message if it exists
      $("#ds-isa-warning").css("display", "none");
      // add the user's description to Pennsieve
      await addDescription(selectedBfDataset, requiredFields.join("\n"));
      // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
      showPrePublishingStatus();
    }
  }, delayAnimation);
});

// closes the warning message that appears when a user has invalid text
$("#ds-close-btn").click(() => {
  $("#ds-isa-warning").css("display", "none");
});

// I: user_markdown_input: A string that holds the user's markdown text.
// Merges user readme file changes with the original readme file.
const addDescription = async (selectedBfDataset, userMarkdownInput) => {


  Swal.fire({
    title: determineSwalLoadingMessage($("#button-add-description")),
    html: "Please wait...",
    // timer: 5000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // get the dataset readme
  let readme;
  try {
    readme = await api.getDatasetReadme(defaultBfAccount, selectedBfDataset);
  } catch (err) {
    clientError(err);
    Swal.fire({
      title: "Failed to get description!",
      text: userErrorMessage(err),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get Readme"]
    );
    return;
  }

  // strip out the required sections (don't check for errors here because we check for them in showCurrentDescription for the same functions and the same readme)
  readme = stripRequiredSectionFromReadme(readme, requiredSections.studyPurpose);

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  readme = stripRequiredSectionFromReadme(readme, requiredSections.dataCollection);

  // search for the "Primary Conclusion" and basic variations of spacing
  readme = stripRequiredSectionFromReadme(readme, requiredSections.primaryConclusion);

  // remove any invalid text
  readme = stripInvalidTextFromReadme(readme);

  // join the user_markdown_input with untouched sections of the original readme
  // because markdown on the Pennsieve side is strange add two spaces so the curator's notes section does not bold the section directly above it
  let completeReadme = userMarkdownInput + "\n" + "\n" + readme;

  // update the readme file
  try {
    await client.put(
      `/manage_datasets/datasets/${selectedBfDataset}/readme`,
      { updated_readme: completeReadme },
      { params: { selected_account: defaultBfAccount } }
    );
  } catch (error) {
    clientError(error);

    // TODO: Fix the error message since this won't be good I don't think
    let emessage = userError(error);

    Swal.fire({
      title: "Failed to add description!",
      text: emessage,
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
      defaultBfDatasetId
    );

    return;
  }

  ipcRenderer.send(
    "track-event",
    "Success",
    ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_README,
    defaultBfDatasetId
  );

  // alert the user the data was uploaded successfully
  Swal.fire({
    title: determineSwalSuccessMessage($("#button-add-description")),
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then(
    //check if subtitle text is empty and set Add/Edit button appropriately
    !$("#ds-description-study-purpose").val() &&
      !$("#ds-description-data-collection").val() &&
      !$("#ds-description-primary-conclusion").val()
      ? $("#button-add-description").html("Add description")
      : $("#button-add-description").html("Edit description")
  );
};

// searches the markdown for key sections and returns them as an easily digestible object
// returns: {Study Purpose: text/markdown | "", Data Collection: text/markdown | "", Primary Conclusion: text/markdown | "", invalidText: text/markdown | ""}
const createParsedReadme = (readme) => {
  // read in the readme file and store it in a variable ( it is in markdown )
  let mutableReadme = readme;

  // create the return object
  const parsedReadme = {
    "study purpose": "",
    "data collection": "",
    "primary conclusion": "",
    "invalid text": "",
  };

  // remove the "Study Purpose" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "study purpose", parsedReadme);

  // remove the "Data Collection" section from the readme file and place its value in the parsed readme
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "data collection", parsedReadme);

  // search for the "Primary Conclusion" and basic variations of spacing
  mutableReadme = stripRequiredSectionFromReadme(mutableReadme, "primary conclusion", parsedReadme);

  // remove the invalid text from the readme contents
  mutableReadme = stripInvalidTextFromReadme(mutableReadme, parsedReadme);

  // return the parsed readme
  return parsedReadme;
};

// strips the required section starting with the given section name from a copy of the given readme string. Returns the mutated string. If given a parsed readme object
// it will also place the section text in that object.
// Inputs:
//      readme: A string with the users dataset description
//      sectionName: The name of the section the user wants to strip from the readme
//      parsedReadme: Optional object that gets the stripped section text if provided
const stripRequiredSectionFromReadme = (readme, sectionName, parsedReadme = undefined) => {
  // lowercase the readme file text to avoid casing issues with pattern matching
  let mutableReadme = readme.trim().toLowerCase();

  // serch for the start of the given section -- it can have one or more whitespace between the colon
  let searchRegExp = new RegExp(`[*][*]${sectionName}[ ]*:[*][*]`);
  let altSearchRegExp = new RegExp(`[*][*]${sectionName}[*][*][ ]*:`);
  let sectionIdx = mutableReadme.search(searchRegExp);
  if (sectionIdx === -1) {
    sectionIdx = mutableReadme.search(altSearchRegExp);
  }
  // if the section is not found return the readme unchanged
  if (sectionIdx === -1) {
    return mutableReadme;
  }

  // remove the section title text
  mutableReadme = mutableReadme.replace(searchRegExp, "");
  mutableReadme = mutableReadme.replace(altSearchRegExp, "");
  // search for the end of the removed section's text
  let endOfSectionIdx;
  // curator's section is designated by three hyphens in a row
  let curatorsSectionIdx = mutableReadme.search("---");

  for (endOfSectionIdx = sectionIdx; endOfSectionIdx < mutableReadme.length; endOfSectionIdx++) {
    // check if we found the start of a new section
    if (mutableReadme[endOfSectionIdx] === "*" || endOfSectionIdx === curatorsSectionIdx) {
      // if so stop
      break;
    }
  }

  // store the value of the given section in the parsed readme if one was provided
  if (parsedReadme) {
    parsedReadme[`${sectionName}`] = mutableReadme.slice(
      sectionIdx,
      endOfSectionIdx >= mutableReadme.length ? undefined : endOfSectionIdx
    );
  }

  // strip the section text from the readme
  mutableReadme = mutableReadme.slice(0, sectionIdx) + mutableReadme.slice(endOfSectionIdx);

  return mutableReadme;
};

// find invalid text and strip it from a copy of the given readme string. returns the mutated readme.
// Text is invalid in these scenarios:
//   1. any text that occurs before an auxillary section is invalid text because we cannot assume it belongs to one of the auxillary sections below
//   2. any text in a string where there are no sections
const stripInvalidTextFromReadme = (readme, parsedReadme = undefined) => {
  // ensure the required sections have been taken out
  if (
    readme.search(`[*][*]${requiredSections.studyPurpose}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.studyPurpose}[*][*][ ]*:`) !== -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.dataCollection}[*][*][ ]*:`) !== -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[ ]*:[*][*]`) !== -1 ||
    readme.search(`[*][*]${requiredSections.primaryConclusion}[*][*][ ]*:`) !== -1
  ) {
    throw new Error("There was a problem with reading your description file.");
  }

  // search for the first occurring auxillary section -- this is a user defined section
  let auxillarySectionIdx = readme.search("[*][*].*[ ]*:[*][*]");

  // check if there was an auxillary section found that has a colon before the markdown ends
  if (auxillarySectionIdx !== -1) {
    let auxillarySectionIdxAltFormat = readme.search("[*][*].*[ ]*[*][*][ ]*:");
    // check if there is an auxillary section that comes before the current section that uses alternative common syntax
    if (auxillarySectionIdxAltFormat !== -1 && auxillarySectionIdx > auxillarySectionIdxAltFormat)
      auxillarySectionIdx = auxillarySectionIdxAltFormat;
  } else {
    // no auxillary section could be found using the colon before the closing markdown sytnatx so try the alternative common syntax
    auxillarySectionIdx = readme.search("[*][*].*[ ]*[*][*][ ]*:");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    let curatorsSectionIdx = readme.search("(---)");
    // check if the curator's section appears before the auxillary section that was found
    if (curatorsSectionIdx !== -1 && auxillarySectionIdx > curatorsSectionIdx)
      auxillarySectionIdx = curatorsSectionIdx;
  } else {
    // set the auxillary section idx to the start of the curator's section idx
    auxillarySectionIdx = readme.search("(---)");
  }

  // check if there is an auxillary section
  if (auxillarySectionIdx !== -1) {
    // get the text that comes before the auxillary seciton idx
    let invalidText = readme.slice(0, auxillarySectionIdx);

    // if there is no invalid text then parsing is done
    if (!invalidText.length) return readme;

    // check if the user wants to store the invalid text in a parsed readme
    if (parsedReadme) {
      // place the invalid text into the parsed readme
      parsedReadme[requiredSections.invalidText] = invalidText;
    }

    // remove the text from the readme
    readme = readme.slice(auxillarySectionIdx);

    // return the readme file
    return readme;
  } else {
    // there are no auxillary sections so the rest of the string is invalid text -- if there is any string left
    if (parsedReadme) {
      parsedReadme[requiredSections.invalidText] = readme;
    }

    // remove the text from the readme === return an empty string
    return "";
  }
};

const validateDescription = () => {
  let studyPurpose = $("#ds-description-study-purpose").val().trim();
  let dataCollection = $("#ds-description-data-collection").val().trim();
  let primaryConclusion = $("#ds-description-primary-conclusion").val().trim();

  if (!studyPurpose.length || !dataCollection.length || !primaryConclusion.length) {
    return false;
  }

  function hasLineBreak(sectionText) {
    if (
      sectionText.indexOf("\n") !== -1 ||
      sectionText.indexOf("\r") !== -1 ||
      sectionText.indexOf("\r\n") !== -1
    ) {
      return true;
    }

    return false;
  }

  // if one of the sections has a line break it is invalid by SPARC Guidelines
  return (
    !hasLineBreak(studyPurpose) && !hasLineBreak(dataCollection) && !hasLineBreak(primaryConclusion)
  );
};

const changeDatasetUnderDD = () => {
  datasetDescriptionFileDataset.value = defaultBfDataset;
  showDatasetDescription();
};

///// grab dataset name and auto-load current description
const showDatasetDescription = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    $("#ds-description").html("");

    setTimeout(() => {
      document.getElementById("description_header_label").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 5);

    return;
  }

  try {
    let subtitle = await api.getDatasetSubtitle(selectedBfAccount, selectedBfDataset);
    ipcRenderer.send(
      "track-event",
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE + " - Get Subtitle",
      defaultBfDatasetId
    );
    $("#ds-description").html(subtitle);

    setTimeout(() => {
      document.getElementById("description_header_label").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 5);
  } catch (error) {
    clientError(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_SUBTITLE + " - Get Subtitle",
      defaultBfDatasetId
    );
  }

  $("#ds-description").prop("disabled", false);
};

const getBase64 = async (url) => {
  const axios = require("axios");
  return axios
    .get(url, {
      responseType: "arraybuffer",
    })
    .then((response) => Buffer.from(response.data, "binary").toString("base64"));
};

// function for importing a banner image if one already exists
$("#edit_banner_image_button").click(async () => {
  $("#edit_banner_image_modal").modal("show");
  if ($("#para-current-banner-img").text() === "None") {
    //Do nothing... regular import
  } else {
    let img_src = $("#current-banner-img").attr("src");
    let img_base64 = await getBase64(img_src); // encode image to base64

    $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
    $("#save-banner-image").css("visibility", "visible");
    $("#div-img-container-holder").css("display", "none");
    $("#div-img-container").css("display", "block");
    $("#para-path-image").html("path");

    // Look for the security token in the URL. If this this doesn't exist, something went wrong with the aws bucket link.
    let position = img_src.search("X-Amz-Security-Token");

    if (position != -1) {
      // The image url will be before the security token
      let new_img_src = img_src.substring(0, position - 1);
      let new_position = new_img_src.lastIndexOf("."); //

      if (new_position != -1) {
        imageExtension = new_img_src.substring(new_position + 1);

        if (imageExtension.toLowerCase() == "png") {
          $("#image-banner").attr("src", "data:image/png;base64," + img_base64);
        } else if (imageExtension.toLowerCase() == "jpeg") {
          $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
        } else if (imageExtension.toLowerCase() == "jpg") {
          $("#image-banner").attr("src", "data:image/jpg;base64," + img_base64);
        } else {

          Swal.fire({
            icon: "error",
            text: "An error occurred when importing the image. Please try again later.",
            showConfirmButton: "OK",
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
          });

          logGeneralOperationsForAnalytics(
            "Error",
            ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
            AnalyticsGranularity.ALL_LEVELS,
            ["Importing Banner Image"]
          );

          return;
        }
      } else {


        Swal.fire({
          icon: "error",
          text: "An error occurred when importing the image. Please try again later.",
          showConfirmButton: "OK",
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
        });

        logGeneralOperationsForAnalytics(
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          AnalyticsGranularity.ALL_LEVELS,
          ["Importing Banner Image"]
        );

        return;
      }
    } else {


      Swal.fire({
        icon: "error",
        text: "An error occurred when importing the image. Please try again later.",
        showConfirmButton: "OK",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
      });

      logGeneralOperationsForAnalytics(
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
        AnalyticsGranularity.ALL_LEVELS,
        ["Importing Banner Image"]
      );

      return;
    }

    logGeneralOperationsForAnalytics(
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      AnalyticsGranularity.ACTION,
      ["Importing Banner Image"]
    );

    myCropper.destroy();
    myCropper = new Cropper(document.getElementById("image-banner"), cropOptions);
  }
});

// displays the user selected banner image using Jimp in the edit banner image modal
const displayBannerImage = async (path) => {
  if (path.length > 0) {
    let original_image_path = path[0];
    let image_path = original_image_path;
    let destination_image_path = require("path").join(
      homeDirectory,
      "SODA",
      "banner-image-conversion"
    );
    let converted_image_file = require("path").join(destination_image_path, "converted-tiff.jpg");
    let conversion_success = true;
    imageExtension = path[0].split(".").pop();

    if (imageExtension.toLowerCase() == "tiff") {
      $("body").addClass("waiting");
      Swal.fire({
        title: "Image conversion in progress!",
        html: "Pennsieve does not support .tiff banner images. Please wait while SODA converts your image to the appropriate format required.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await Jimp.read(original_image_path)
        .then(async (file) => {
          if (!fs.existsSync(destination_image_path)) {
            fs.mkdirSync(destination_image_path);
          }

          try {
            if (fs.existsSync(converted_image_file)) {
              fs.unlinkSync(converted_image_file);
            }
          } catch (err) {
            conversion_success = false;
            console.error(err);
          }

          return file.write(converted_image_file, async () => {
            if (fs.existsSync(converted_image_file)) {
              let stats = fs.statSync(converted_image_file);
              let fileSizeInBytes = stats.size;
              let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

              if (fileSizeInMegabytes > 5) {
                fs.unlinkSync(converted_image_file);

                await Jimp.read(original_image_path)
                  .then((file) => {
                    return file.resize(1024, 1024).write(converted_image_file, () => {
                      document.getElementById("div-img-container-holder").style.display = "none";
                      document.getElementById("div-img-container").style.display = "block";

                      $("#para-path-image").html(image_path);
                      bfViewImportedImage.src = converted_image_file;
                      myCropper.destroy();
                      myCropper = new Cropper(bfViewImportedImage, cropOptions);
                      $("#save-banner-image").css("visibility", "visible");
                      $("body").removeClass("waiting");
                    });
                  })
                  .catch((err) => {
                    conversion_success = false;
                    console.error(err);
                  });
                if (fs.existsSync(converted_image_file)) {
                  let stats = fs.statSync(converted_image_file);
                  let fileSizeInBytes = stats.size;
                  let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                  if (fileSizeInMegabytes > 5) {
                    conversion_success = false;
                    // SHOW ERROR
                  }
                }
              }
              image_path = converted_image_file;
              imageExtension = "jpg";
              $("#para-path-image").html(image_path);
              bfViewImportedImage.src = image_path;
              myCropper.destroy();
              myCropper = new Cropper(bfViewImportedImage, cropOptions);
              $("#save-banner-image").css("visibility", "visible");
            }
          });
        })
        .catch((err) => {
          conversion_success = false;
          console.error(err);
          Swal.fire({
            icon: "error",
            text: "Something went wrong",
            confirmButtonText: "OK",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
        });
      if (conversion_success == false) {
        $("body").removeClass("waiting");
        return;
      } else {
        Swal.close();
      }
    } else {
      document.getElementById("div-img-container-holder").style.display = "none";
      document.getElementById("div-img-container").style.display = "block";

      $("#para-path-image").html(image_path);
      bfViewImportedImage.src = image_path;
      myCropper.destroy();
      myCropper = new Cropper(bfViewImportedImage, cropOptions);

      $("#save-banner-image").css("visibility", "visible");
    }
  } else {
    if ($("#para-current-banner-img").text() === "None") {
      $("#save-banner-image").css("visibility", "hidden");
    } else {
      $("#save-banner-image").css("visibility", "visible");
    }
  }
};

// Action when user click on "Import image" button for banner image
$("#button-import-banner-image").click(async () => {
  $("#para-dataset-banner-image-status").html("");
  let filePaths = await ipcRenderer.invoke("open-file-dialog-import-banner-image");
  displayBannerImage(filePaths);
});

const uploadBannerImage = async () => {
  $("#para-dataset-banner-image-status").html("Please wait...");
  //Save cropped image locally and check size
  let imageFolder = path.join(homeDirectory, "SODA", "banner-image"); //banner will be saved in $HOME/SODA/banner-image
  let imageType = "";

  if (!fs.existsSync(imageFolder)) {
    fs.mkdirSync(imageFolder, { recursive: true });
  }

  if (imageExtension == "png") {
    imageType = "image/png";
  } else {
    imageType = "image/jpeg";
  }

  //creating path of the image and then getting cropped image information
  let imagePath = path.join(imageFolder, "banner-image-SODA." + imageExtension);
  let croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);

  imageDataURI.outputFile(croppedImageDataURI, imagePath).then(async () => {
    //image is created here into temp folder
    let image_file_size = fs.statSync(imagePath)["size"];

    if (image_file_size < 5 * 1024 * 1024) {
      let selectedBfAccount = defaultBfAccount;
      let selectedBfDataset = defaultBfDataset;

      try {
        let bf_add_banner = await client.put(
          `/manage_datasets/bf_banner_image`,
          {
            input_banner_image_path: imagePath,
          },
          {
            params: {
              selected_account: selectedBfAccount,
              selected_dataset: selectedBfDataset,
            },
          }
        );
        let res = bf_add_banner.data.message;
        $("#para-dataset-banner-image-status").html(res);

        showCurrentBannerImage();

        $("#edit_banner_image_modal").modal("hide");

        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          defaultBfDatasetId
        );

        // track the size for all dataset banner uploads
        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          "Size",
          image_file_size
        );

        // track the size for the given dataset
        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          defaultBfDatasetId,
          image_file_size
        );
        //add success toast here
        // create a success notyf for api version check
        notyf.open({
          message: "Banner image uploaded",
          type: "success",
        });

        // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
        showPrePublishingStatus();
      } catch (error) {
        clientError(error);
        let emessage = userErrorMessage(error);
        $("#para-dataset-banner-image-status").html(
          "<span style='color: red;'> " + emessage + "</span>"
        );

        ipcRenderer.send(
          "track-event",
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          defaultBfDatasetId
        );
      }
    } else {
      //final size is greater than 5mb so compress image here (image already created and stored in temp file)
      let scaledImagePath = await scaleBannerImage(imagePath); //scaled image will be in temp folder
      let image_file_size = fs.statSync(scaledImagePath)["size"]; //update size for analytics
      try {
        let uploadBannerImage = await client.put(
          `/manage_datasets/bf_banner_image`,
          {
            input_banner_image_path: scaledImagePath,
          },
          {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: defaultBfDataset,
            },
          }
        );
        let bannerImage = uploadBannerImage.data.message;
        $("#para-dataset-banner-image-status").html(bannerImage);

        showCurrentBannerImage();

        $("#edit_banner_image_modal").modal("hide");

        notyf.open({
          message: "Banner image uploaded",
          type: "success",
        });

        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          defaultBfDatasetId
        );

        // track the size for all dataset banner uploads
        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          "Size",
          image_file_size
        );

        // track the size for the given dataset
        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER + " - Size",
          defaultBfDatasetId,
          image_file_size
        );
      } catch (error) {
        clientError(error);

        ipcRenderer.send(
          "track-event",
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
          defaultBfDatasetId
        );
      }
    }
  });
};

$("#save-banner-image").click((event) => {
  //save button for banner image (need on the size of the cropped image)
  //bfViewImportedImage holds the entire image
  $("#para-dataset-banner-image-status").html("");
  if (bfViewImportedImage.src.length > 0) {
    if (formBannerHeight.value > 511) {
      Swal.fire({
        icon: "warning",
        text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        focusCancel: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        reverseButtons: reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        //then check if height is more than 2048 and handle accordingly
        if (formBannerHeight.value < 1024) {
          Swal.fire({
            icon: "warning",
            text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${formBannerHeight.value} px. Would you like to continue?`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            reverseButtons: reverseSwalButtons,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          }).then((result) => {
            if (result.isConfirmed) {
              uploadBannerImage();
            }
          });
        } else if (formBannerHeight.value > 2048) {
          Swal.fire({
            icon: "warning",
            text: `Your cropped image is ${formBannerHeight.value} px and is bigger than the 2048px standard. Would you like to scale this image down to fit the entire cropped image?`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showCancelButton: true,
            focusCancel: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            reverseButtons: reverseSwalButtons,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          }).then((result) => {
            if (result.isConfirmed) {
              // uploadBannerImage();
              uploadBannerImage();
            }
          });
        } else {
          uploadBannerImage();
        }
      });
    } else {
      $("#para-dataset-banner-image-status").html(
        "<span style='color: red;'> " +
          "Dimensions of cropped area must be at least 512 px" +
          "</span>"
      );
    }
  } else {
    $("#para-dataset-banner-image-status").html(
      "<span style='color: red;'> " + "Please import an image first" + "</span>"
    );
  }
});

const showCurrentBannerImage = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    $("#banner_image_loader").hide();

    bfCurrentBannerImg.src = "";
    document.getElementById("para-current-banner-img").innerHTML = "None";
    bfViewImportedImage.src = "";

    $("#div-img-container-holder").css("display", "block");
    $("#div-img-container").css("display", "none");
    $("#save-banner-image").css("visibility", "hidden");

    myCropper.destroy();

    return;
  }



  $("#banner_image_loader").show();

  document.getElementById("para-current-banner-img").innerHTML = "";

  try {
    let res = await api.getDatasetBannerImageURL(selectedBfAccount, selectedBfDataset);
    logGeneralOperationsForAnalytics(
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      AnalyticsGranularity.ACTION,
      ["Get Banner Image"]
    );

    if (res === "No banner image") {
      bfCurrentBannerImg.src = "";
      document.getElementById("para-current-banner-img").innerHTML = "None";
      bfViewImportedImage.src = "";

      $("#div-img-container-holder").css("display", "block");
      $("#div-img-container").css("display", "none");
      $("#save-banner-image").css("visibility", "hidden");

      myCropper.destroy();
    } else {
      document.getElementById("para-current-banner-img").innerHTML = "";
      bfCurrentBannerImg.src = res;
    }
    $("#banner_image_loader").hide();
  } catch (error) {
    clientError(error);
    $("#banner_image_loader").hide();

    bfCurrentBannerImg.src = "assets/img/no-banner-image.png";
    document.getElementById("para-current-banner-img").innerHTML = "None";
    bfViewImportedImage.src = "";

    $("#div-img-container-holder").css("display", "block");
    $("#div-img-container").css("display", "none");
    $("#save-banner-image").css("visibility", "hidden");

    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_BANNER,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get Banner Image"]
    );

    myCropper.destroy();
  }
};

// Add tags //

// add or edit metadata tags for a user's selected dataset in the "add/edit tags" section of the manage-dataset menu
$("#button-add-tags").click(async () => {
  Swal.fire({
    title: determineSwalLoadingMessage($("#button-add-tags")),
    html: "Please wait...",
    // timer: 5000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});

  // get the current tags from the input inside of the manage_datasets.html file inside of the tags section
  const tags = Array.from(datasetTagsTagify.getTagElms()).map((tag) => {
    return tag.textContent;
  });

  // get the name of the currently selected dataset
  var selectedBfDataset = defaultBfDataset;

  // Add tags to dataset
  try {
    await client.put(
      `/manage_datasets/datasets/${selectedBfDataset}/tags`,
      { tags },
      {
        params: {
          selected_account: defaultBfAccount,
        },
      }
    );
  } catch (e) {
    clientError(e);
    // alert the user of the error
    Swal.fire({
      title: "Failed to edit your dataset tags!",
      icon: "error",
      text: userErrorMessage(e),
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
      defaultBfDatasetId
    );

    // halt execution
    return;
  }
  // show success or failure to the user in a popup message
  Swal.fire({
    title: determineSwalSuccessMessage($("#button-add-tags")),
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then(() => {
    ipcRenderer.send(
      "track-event",
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
      defaultBfDatasetId
    );

    // run the pre-publishing checklist items to update the list found in the "Submit for pre-publishing review" section/card
    showPrePublishingStatus();

    //check if tags array is empty and set Add/Edit tags appropriately
    tags === undefined || tags.length == 0
      ? $("#button-add-tags").html("Add tags")
      : $("#button-add-tags").html("Edit tags");
  });
});

// fetch a user's metadata tags
// this function fires from two events:
//    1. when a user clicks on the pencil icon to view their list of datasets in any of the manage-dataset sections
//    2. after the user selects a dataset from the very same dropdown list
const showCurrentTags = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    // this code executes when the pencil icon that allows a user to select a dataset is clicked in the tags section
    // for now do nothing
    return;
  }



  // remove all of the tags from the current input
  datasetTagsTagify.removeAllTags();

  // make the tags input display a loading spinner after a user selects a new dataset
  datasetTagsTagify.loading(true);

  // get the tags from the Pennsieve API
  let tagsResponse;
  try {
    tagsResponse = await client.get(`/manage_datasets/datasets/${selectedBfDataset}/tags`, {
      params: { selected_account: selectedBfAccount },
    });
  } catch (e) {
    clientError(e);
    // alert the user of the error
    Swal.fire({
      title: "Failed to retrieve your selected dataset!",
      icon: "error",
      text: userErrorMessage(e),
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ADD_EDIT_TAGS,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get Tags"]
    );

    // stop the loader -- no data can be fetched for this dataset
    datasetTagsTagify.loading(false);

    // halt execution
    return;
  }

  let { tags } = tagsResponse.data;

  if (tags === undefined || tags.length == 0) {
    //if so make the button say add tags
    $("#button-add-tags").html("Add tags");
  } else {
    //make the button say edit tags
    $("#button-add-tags").html("Edit tags");
  }

  // stop displaying the tag loading spinner
  datasetTagsTagify.loading(false);

  // display the retrieved tags
  datasetTagsTagify.addTags(tags);
};

// Add license //
$("#button-add-license").click(async () => {
  setTimeout(async function () {
    Swal.fire({
      title: "Adding license to dataset",
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let selectedBfAccount = defaultBfAccount;
    let selectedBfDataset = defaultBfDataset;
    let selectedLicense = "Creative Commons Attribution";


    try {
      await client.put(
        `/manage_datasets/bf_license`,
        {
          input_license: selectedLicense,
        },
        {
          params: {
            selected_account: selectedBfAccount,
            selected_dataset: selectedBfDataset,
          },
        }
      );

      Swal.fire({
        title: "Successfully added license to dataset!",
        icon: "success",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      showCurrentLicense();

      ipcRenderer.send(
        "track-event",
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
        defaultBfDatasetId
      );

      // run the pre-publishing checklist validation -- this is displayed in the pre-publishing section
      showPrePublishingStatus();
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      Swal.fire({
        title: "Failed to add the license to your dataset!",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      ipcRenderer.send(
        "track-event",
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
        defaultBfDatasetId
      );
    }
  }, delayAnimation);
});

const showCurrentLicense = async () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  currentDatasetLicense.innerHTML = `Loading current license... <div class="ui active green inline loader tiny"></div>`;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    currentDatasetLicense.innerHTML = "None";
    return;
  }



  try {
    let bf_get_license = await client.get(`/manage_datasets/bf_license`, {
      params: {
        selected_account: selectedBfAccount,
        selected_dataset: selectedBfDataset,
      },
    });
    let { license } = bf_get_license.data;
    currentDatasetLicense.innerHTML = license;

    let licenseContainer = document.getElementById("license-lottie-div");
    if (licenseContainer.children.length < 1) {
      // licenseContainer.removeChild(licenseContainer.children[1]);
      lottie.loadAnimation({
        container: licenseContainer,
        animationData: licenseLottie,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
    }

    if (license === "Creative Commons Attribution") {
      $("#button-add-license").hide();
      $("#assign-a-license-header").hide();

      licenseContainer.style.display = "block";
      document.getElementById("license-assigned").style.display = "block";
    } else {
      $("#button-add-license").show();
      $("#assign-a-license-header").show();
      document.getElementById("license-assigned").style.display = "none";
      licenseContainer.style.display = "none";
    }
  } catch (error) {
    clientError(error);
    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_ASSIGN_LICENSE,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get License"]
    );
  }
};

// verify the dataset is valid before allowing a user to upload
const handleSelectedSubmitDirectory = async (filepath) => {
  if (filepath.length > 0) {
    if (filepath != null) {
      $("#selected-local-dataset-submit").attr("placeholder", `${filepath[0]}`);

      valid_dataset = verify_sparc_folder(filepath[0], "pennsieve");

      if (valid_dataset == true) {
        $("#button_upload_local_folder_confirm").click();
        $("#button-submit-dataset").show();
        $("#button-submit-dataset").addClass("pulse-blue");

        // remove pulse class after 4 seconds
        // pulse animation lasts 2 seconds => 2 pulses
        setTimeout(() => {
          $(".pulse-blue").removeClass("pulse-blue");
        }, 4000);
      } else {
        Swal.fire({
          icon: "warning",
          text: "This folder does not seem to be a SPARC dataset folder. Are you sure you want to proceed?",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: "Yes",
          cancelButtonText: "Cancel",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            $("#button_upload_local_folder_confirm").click();
            $("#button-submit-dataset").show();
            $("#button-submit-dataset").addClass("pulse-blue");

            // remove pulse class after 4 seconds
            // pulse animation lasts 2 seconds => 2 pulses
            setTimeout(() => {
              $(".pulse-blue").removeClass("pulse-blue");
            }, 4000);
          } else {
            $("#input-destination-getting-started-locally").attr("placeholder", "Browse here");
            $("#selected-local-dataset-submit").attr("placeholder", "Browse here");
          }
        });
      }
    }
  }
};

$("#selected-local-dataset-submit").click(async () => {
  let datasetDirectory = await ipcRenderer.invoke("open-file-dialog-submit-dataset");
  handleSelectedSubmitDirectory(datasetDirectory);
});

function walk(directory, filepaths = []) {
  const files = fs.readdirSync(directory);
  for (let filename of files) {
    const filepath = path.join(directory, filename);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filepaths);
    } else {
      filepaths.push(filepath);
    }
  }
  return filepaths;
}

const logFilesForUpload = (upload_folder_path) => {
  const foundFiles = walk(upload_folder_path);
  foundFiles.forEach((item) => {

  });
};

$("#button-submit-dataset").click(async () => {
  $("#para-please-wait-manage-dataset").html("Please wait while we verify a few things...");
  let progressSubmit = document.getElementById("div-progress-submit");
  let navContainer = document.getElementById("nav-items");
  let progressError = document.getElementById("para-progress-bar-error-status");

  var progressClone = progressSubmit.cloneNode(true);
  let cloneHeader = progressClone.children[0];
  progressClone.children[2].remove();
  cloneHeader.style = "margin: 0;";
  let cloneMeter = progressClone.children[1];
  let cloneStatus = progressClone.children[2];
  var navError = progressError.cloneNode(true);
  let organizeDatasetButton = document.getElementById("button-generate");
  let organzieDatasetButtonDiv = organizeDatasetButton.children[0];

  progressClone.style =
    "position: absolute; width: 100%; bottom: 0px; padding: 15px; color: black;";
  cloneMeter.setAttribute("id", "clone-progress-bar-upload-bf");
  cloneMeter.className = "nav-status-bar";
  cloneStatus.setAttribute("id", "clone-para-progress-bar-status");
  cloneStatus.style = "overflow-x: hidden; margin-bottom: 3px; margin-top: 5px;";
  progressClone.setAttribute("id", "nav-progress-submit");
  let returnButton = document.createElement("button");
  returnButton.type = "button";
  returnButton.id = "returnButton";
  returnButton.innerHTML = "Return to progress";
  let returnPage = document.getElementById("upload_local_dataset_btn");
  returnButton.onclick = function () {
    document.getElementById("upload_local_dataset_progress_div").style.display = "flex";
    returnPage.click();
  };
  progressClone.appendChild(returnButton);
  organizeDatasetButton.disabled = true;
  organizeDatasetButton.className = "disabled-generate-button";
  organizeDatasetButton.style = "background-color: #f6f6f6";
  organzieDatasetButtonDiv.className = "disabled-animated-div";

  let supplementary_checks = await run_pre_flight_checks(false);
  if (!supplementary_checks) {
    return;
  }

  var totalFileSize;
  let uploadedFiles = 0;
  let incrementInFileSize = 0;
  let uploadedFolders = 0;
  let uploadedFileSize = 0;
  let previousUploadedFileSize = 0;

  $("#para-please-wait-manage-dataset").html("Please wait...");
  $("#para-progress-bar-error-status").html("");

  progressBarUploadBf.value = 0;
  cloneMeter.value = 0;

  $("#button-submit-dataset").prop("disabled", true);
  $("#selected-local-dataset-submit").prop("disabled", true);
  $("#button-submit-dataset").popover("hide");
  $("#progress-bar-status").html("Preparing files ...");

  var err = false;
  var completionStatus = "Solving";
  var success_upload = true;
  var selectedbfaccount = defaultBfAccount;
  var selectedbfdataset = defaultBfDataset;


  logFilesForUpload(pathSubmitDataset.placeholder);

  // start the upload session
  datasetUploadSession.startSession();

  // Questions logs need to answer:
  // Which sessions failed? How many files were they attempting to upload per session? How many files were uploaded?
  // How many pennsieve datasets were involved in a failed upload? Successful upload?
  let sparc_logo = document.getElementById("sparc-logo-container");
  sparc_logo.style.display = "none";
  navContainer.appendChild(progressClone);
  cloneStatus.innerHTML = "Please wait...";
  document.getElementById("para-progress-bar-status").innerHTML = "";
  let navbar = document.getElementById("main-nav");
  if (navbar.classList.contains("active")) {
    document.getElementById("sidebarCollapse").click();
  }

  client
    .put(
      `/manage_datasets/datasets`,
      { filepath: pathSubmitDataset.placeholder },
      {
        params: {
          selected_account: selectedbfaccount,
          selected_dataset: selectedbfdataset,
        },
        timeout: 0,
      }
    )
    .then(async () => {
      $("#upload_local_dataset_progress_div")[0].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });



      // can tell us how many successful upload sessions a dataset ID had (the value is implicitly set to 1 via Total Events query in Analytics) within a given timeframe
      ipcRenderer.send(
        "track-event",
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET,
        defaultBfDatasetId
      );

      let getFilesFoldersResponse;
      try {
        getFilesFoldersResponse = await client.get(
          `/manage_datasets/get_number_of_files_and_folders_locally`,
          { params: { filepath: pathSubmitDataset.placeholder } }
        );
      } catch (error) {
        clientError(error);
        ipcRenderer.send(
          "track-event",
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
            ` - Number of Folders`,
          `${datasetUploadSession.id}`
        );
        return;
      }

      let data = getFilesFoldersResponse.data;

      let num_of_folders = data["totalDir"];

      // log amount of folders uploaded in the given session
      ipcRenderer.send(
        "track-event",
        "Success",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + ` - Number of Folders`,
        `${datasetUploadSession.id}`,
        num_of_folders
      );
    })
    .catch(async (error) => {
      clientError(error);
      let emessage = userErrorMessage(error);

      $("#para-please-wait-manage-dataset").html("");
      $("#para-progress-bar-status").html("");
      cloneStatus.innerHTML = "";
      $("#div-progress-submit").css("display", "none");
      document.getElementById("para-progress-bar-error-status").style = "color: red";
      document.getElementById("para-progress-bar-error-status").innerHTML = emessage;
      success_upload = false;
      organizeDatasetButton.disabled = false;
      organizeDatasetButton.className = "btn_animated generate-btn";
      organizeDatasetButton.style =
        "margin: 5px; width: 120px; height: 40px; font-size: 15px; border: none !important;";
      organzieDatasetButtonDiv.className = "btn_animated-inside";
      Swal.fire({
        icon: "error",
        title: "There was an issue uploading your dataset",
        html: emessage,
        allowOutsideClick: false,
      }).then((result) => {
        progressClone.remove();
        sparc_logo.style.display = "inline";
        if (result.isConfirmed) {
          returnPage.click();
        }
      });

      //progressClone.remove();
      progressBarUploadBf.value = 0;
      cloneMeter.value = 0;

      err = true;

      // while sessions are used for tracking file count and file size for an upload
      // we still want to know what dataset didn't upload by its pennsieve ID
      ipcRenderer.send(
        "track-event",
        "Error",
        "Manage Datasets - Upload Local Dataset",
        defaultBfDatasetId
      );

      // get total size of the dataset that failed to upload
      ipcRenderer.send(
        "track-event",
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + " - size",
        "Size",
        totalFileSize
      );

      let getFilesFoldersResponse;
      try {
        getFilesFoldersResponse = await client.get(
          `/manage_datasets/get_number_of_files_and_folders_locally`,
          { params: { filepath: pathSubmitDataset.placeholder } }
        );
      } catch (error) {
        clientError(error);
        return;
      }

      let data = getFilesFoldersResponse.data;

      let num_of_files = data["totalFiles"];
      let num_of_folders = data["totalDir"];

      // log amount of folders uploaded in the given session
      ipcRenderer.send(
        "track-event",
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + ` - Number of Folders`,
        "Number of folders local dataset",
        num_of_folders
      );

      // track total amount of files being uploaded
      // makes it easy to see aggregate amount of files we failed to upload in Local Dataset
      ipcRenderer.send(
        "track-event",
        "Error",
        ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + ` - Number of Files`,
        "Number of files local dataset",
        num_of_files
      );

      $("#upload_local_dataset_progress_div")[0].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      $("#button-submit-dataset").prop("disabled", false);
      $("#selected-local-dataset-submit").prop("disabled", false);
    });

  var countDone = 0;
  var timerProgress = setInterval(progressfunction, 1000);
  let statusMessage = "Error";

  function progressfunction() {
    $("#upload_local_dataset_progress_div")[0].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    client
      .get("/manage_datasets/datasets/upload_progress")
      .then((progressResponse) => {
        let progressData = progressResponse.data;

        statusMessage = progressData["progress"];
        completionStatus = progressData["submit_dataset_status"];
        let submitprintstatus = progressData["submit_print_status"];
        totalFileSize = progressData["total_file_size"];
        let uploadedFileSize = progressData["upload_file_size"];

        if (submitprintstatus === "Uploading") {
          $("#div-progress-submit").css("display", "block");

          if (statusMessage.includes("Success: COMPLETED!")) {
            progressBarUploadBf.value = 100;
            cloneMeter.value = 100;

            $("#para-please-wait-manage-dataset").html("");
            $("#para-progress-bar-status").html(statusMessage + smileyCan);
            cloneStatus.innerHTML = statusMessage + smileyCan;
          } else {
            var value = (uploadedFileSize / totalFileSize) * 100;

            progressBarUploadBf.value = value;
            cloneMeter.value = value;

            if (totalFileSize < displaySize) {
              var totalSizePrint = totalFileSize.toFixed(2) + " B";
            } else if (totalFileSize < displaySize * displaySize) {
              var totalSizePrint = (totalFileSize / displaySize).toFixed(2) + " KB";
            } else if (totalFileSize < displaySize * displaySize * displaySize) {
              var totalSizePrint = (totalFileSize / displaySize / displaySize).toFixed(2) + " MB";
            } else {
              var totalSizePrint =
                (totalFileSize / displaySize / displaySize / displaySize).toFixed(2) + " GB";
            }

            $("#para-please-wait-manage-dataset").html("");
            // cloneStatus.innerHTML = "Progress: " + value.toFixed(2) + "%";
            if (statusMessage.indexOf("<br")) {
              let timeIndex = statusMessage.indexOf("<br");
              let timePhrase = statusMessage.substring(timeIndex);
              cloneStatus.innerHTML = "Progress: " + value.toFixed(2) + "%" + timePhrase;
            }
            $("#para-progress-bar-status").html(
              statusMessage +
                "Progress: " +
                value.toFixed(2) +
                "%" +
                " (total size: " +
                totalSizePrint +
                ")"
            );
          }
        }
      })
      .catch((error) => {
        clientError(error);
        let emessage = userErrorMessage(error);
        ipcRenderer.send(
          "track-event",
          "Error",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + ` - Progress track`,
          defaultBfDatasetId
        );
        organizeDatasetButton.disabled = false;
        organizeDatasetButton.className = "btn_animated generate-btn";
        organizeDatasetButton.style =
          "margin: 5px; width: 120px; height: 40px; font-size: 15px; border: none !important;";
        organzieDatasetButtonDiv.className = "btn_animated-inside";

        $("#para-progress-bar-error-status").html(
          "<span style='color: red;'>" + emessage + sadCan + "</span>"
        );
        Swal.fire({
          icon: "error",
          title: "An Error Occurred While Uploading Your Dataset",
          html: "Check the error text in the Upload Local Dataset's upload page to see what went wrong.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then((result) => {
          progressClone.remove();
          sparc_logo.style.display = "inline";
          if (result.isConfirmed) {
            returnPage.click();
          }
        });
      });

    if (completionStatus === "Done") {
      countDone++;

      if (countDone > 1) {

        if (success_upload === true) {
          organizeDatasetButton.disabled = false;
          organizeDatasetButton.className = "btn_animated generate-btn";
          organizeDatasetButton.style =
            "margin: 5px; width: 120px; height: 40px; font-size: 15px; border: none !important;";
          organzieDatasetButtonDiv.className = "btn_animated-inside";
          uploadComplete.open({
            type: "success",
            message: "Upload to Pennsieve completed",
          });
          dismissStatus(progressClone.id);
          progressClone.remove();
          sparc_logo.style.display = "inline";
        }

        if (statusMessage.includes("Success: COMPLETED")) {
          ipcRenderer.send(
            "track-event",
            "Success",
            ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
              ` - Progress track`,
            defaultBfDatasetId
          );
        }

        clearInterval(timerProgress);

        $("#para-please-wait-manage-dataset").html("");

        $("#button-submit-dataset").prop("disabled", false);
        $("#selected-local-dataset-submit").prop("disabled", false);

        ipcRenderer.send(
          "track-event",
          "Success",
          ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + ` - Progress track`,
          defaultBfDatasetId
        );
      }
    }
  }

  let uploadErrorChildren = document.querySelector("#para-progress-bar-error-status").childNodes;

  const monitorBucketUpload = () => {
    // ask the server for the amount of files uploaded in the current session
    client
      .get("/manage_datasets/datasets/upload_details")
      .then((detailsResponse) => {
        let detailsData = detailsResponse.data;
        if (
          detailsData["uploaded_files"] > 0 &&
          detailsData["upload_folder_count"] > uploadedFolders
        ) {
          uploadedFiles = detailsData["uploaded_files"];
          previousUploadedFileSize = uploadedFileSize;
          uploadedFileSize = detailsData["uploaded_file_size"];
          let didFail = detailsData["did_fail"];
          let didUpload = detailsData["did_upload"];
          uploadedFolders = detailsData["upload_folder_count"];

          // analytics places values with matching action and label pairs into a single 'bucket/aggregate'
          // so log the increase in size at every step to get the sum total size of the uploaded files
          incrementInFileSize = uploadedFileSize - previousUploadedFileSize;

          // failed to upload a bucket, but did upload some files
          if (didFail && didUpload) {
            // even when the upload fails we want to know how many files were uploaded and their size
            // for the current upload session
            ipcRenderer.send(
              "track-event",
              "Success",
              ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
                ` - Number of Files`,
              `${datasetUploadSession.id}`,
              250
            );

            ipcRenderer.send(
              "track-event",
              "Success",
              ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + " - size",
              `${datasetUploadSession.id}`,
              incrementInFileSize
            );

            return;
          } else if (didFail && !didUpload) {
            // there is no session information to log outside of the general information logged in the
            // error for api_bf_submit
            return;
          } else {
            // track the amount of files uploaded for the current bucket
            ipcRenderer.send(
              "track-event",
              "Success",
              ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET +
                ` - Number of Files`,
              `${datasetUploadSession.id}`,
              uploadedFiles
            );

            ipcRenderer.send(
              "track-event",
              "Success",
              ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_UPLOAD_LOCAL_DATASET + " - size",
              `${datasetUploadSession.id}`,
              incrementInFileSize
            );
          }
        }
      })
      .catch((error) => {
        clientError(error);
        //Clear the interval to stop the generation of new sweet alerts after intitial error
        clearInterval(uploadDetailsTimer);
      });

    // if completion status was not set to done clear interval when the error span gets an error message
    if (completionStatus === "Done" || uploadErrorChildren.length > 0) {
      countDone++;

      if (countDone > 1) {
        clearInterval(uploadDetailsTimer);
      }
    }
  };

  var uploadDetailsTimer = setInterval(monitorBucketUpload, 1000);
});

const addRadioOption = (ul, text, val) => {
  let li = document.createElement("li");
  let element = `<input type="radio" id="${val}_radio" value="${val}" name="dataset_status_radio"/> <label for="${val}_radio">${text}</label> <div class="check"></div>`;
  $(li).html(element);
  $(`#${ul}`).append(li);
};

const removeRadioOptions = (ele) => {
  $(`#${ele}`).html("");
};

$("body").on("click", ".check", function () {
  $(this).siblings("input[name=dataset_status_radio]:radio").click();
});

$("body").on("change", "input[type=radio][name=dataset_status_radio]", function () {
  $("#bf_list_dataset_status").val(this.value).trigger("change");
});

// Change dataset status option change
$("#bf_list_dataset_status").on("change", async () => {
  $(bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");

  selectOptionColor(bfListDatasetStatus);

  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;
  let selectedStatusOption = bfListDatasetStatus.options[bfListDatasetStatus.selectedIndex].text;



  try {
    let bf_change_dataset_status = await client.put(`/manage_datasets/bf_dataset_status`, {
      selected_bfaccount: selectedBfAccount,
      selected_bfdataset: selectedBfDataset,
      selected_status: selectedStatusOption,
    });
    let res = bf_change_dataset_status.data.message;

    ipcRenderer.send(
      "track-event",
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS,
      defaultBfDatasetId
    );

    $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    Swal.fire({
      title: res,
      icon: "success",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  } catch (error) {
    clientError(error);
    ipcRenderer.send(
      "track-event",
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS,
      defaultBfDatasetId
    );

    var emessage = userErrorMessage(error);

    function showErrorDatasetStatus() {
      Swal.fire({
        title: "Failed to change dataset status!",
        text: emessage,
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
      $("#bf-dataset-status-spinner").css("display", "none");
    }

    showCurrentDatasetStatus(showErrorDatasetStatus);
  }
});

async function showCurrentDatasetStatus(callback) {
  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === null) {
    return;
  }

  if (selectedBfDataset === "Select dataset") {
    $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    removeOptions(bfListDatasetStatus);
    removeRadioOptions("dataset_status_ul");

    bfListDatasetStatus.style.color = "black";

    return;
  }



  try {
    let bf_dataset_status = await client.get(`/manage_datasets/bf_dataset_status`, {
      params: {
        selected_dataset: selectedBfDataset,
        selected_account: selectedBfAccount,
      },
    });
    let res = bf_dataset_status.data;
    ipcRenderer.send(
      "track-event",
      "Success",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS + ` - Get dataset Status`,
      defaultBfDatasetId
    );

    removeOptions(bfListDatasetStatus);
    removeRadioOptions("dataset_status_ul");

    for (let item in res["status_options"]) {
      let option = document.createElement("option");

      option.textContent = res["status_options"][item]["displayName"];
      option.value = res["status_options"][item]["name"];
      option.style.color = res["status_options"][item]["color"];

      bfListDatasetStatus.appendChild(option);

      addRadioOption(
        "dataset_status_ul",
        res["status_options"][item]["displayName"],
        res["status_options"][item]["name"]
      );
    }
    bfListDatasetStatus.value = res["current_status"];

    $(`input[name=dataset_status_radio][value=${res["current_status"]}]`).prop("checked", true);

    selectOptionColor(bfListDatasetStatus);

    $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");

    if (callback !== undefined) {
      callback();
    }
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Failed to change dataset status!",
      text: userErrorMessage(error),
      icon: "error",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logGeneralOperationsForAnalytics(
      "Error",
      ManageDatasetsAnalyticsPrefix.MANAGE_DATASETS_CHANGE_STATUS,
      AnalyticsGranularity.ALL_LEVELS,
      ["Get Dataset Status"]
    );

    $(bfCurrentDatasetStatusProgress).css("visibility", "hidden");
    $("#bf-dataset-status-spinner").css("display", "none");
  }
}


// -----------------------------------------------------------------------------------
// ------------------------------ Previously preload.js ------------------------------
// -----------------------------------------------------------------------------------

// Contributors table for the dataset description editing page
const currentConTable = document.getElementById("table-current-contributors");

// function to show dataset or account Confirm buttons
const showHideDropdownButtons = (category, action) => {
  if (category === "dataset") {
    if (action === "show") {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset").show();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "flex");
      $("#button-confirm-bf-dataset-getting-started").show();
    } else {
      // btn under Step 6
      $($("#button-confirm-bf-dataset").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset").hide();
      // btn under Step 1
      $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "none");
      $("#button-confirm-bf-dataset-getting-started").hide();
    }
  } else if (category === "account") {
    if (action === "show") {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "flex");
      $("#div-bf-account-btns button").show();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "flex");
      $("#div-bf-account-btns-getting-started button").show();
    } else {
      // btn under Step 6
      $("#div-bf-account-btns").css("display", "none");
      $("#div-bf-account-btns button").hide();
      // btn under Step 1
      $("#div-bf-account-btns-getting-started").css("display", "none");
      $("#div-bf-account-btns-getting-started button").hide();
    }
  }
};

// Function to clear the confirm options in the curate feature
const confirm_click_account_function = () => {
  let temp = $(".bf-account-span")
    .html()
    .replace(/^\s+|\s+$/g, "");
  if (temp == "None" || temp == "") {
    $("#div-create_empty_dataset-account-btns").css("display", "none");
    $("#div-bf-account-btns-getting-started").css("display", "none");
    $("#div-bf-account-btns-getting-started button").hide();
  } else {
    $("#div-create_empty_dataset-account-btns").css("display", "flex");
    $("#div-bf-account-btns-getting-started").css("display", "flex");
    $("#div-bf-account-btns-getting-started button").show();
  }
};

/// helper function to refresh live search dropdowns per dataset permission on change event
const initializeBootstrapSelect = (dropdown, action) => {
  if (action === "disabled") {
    $(dropdown).attr("disabled", true);
    $(".dropdown.bootstrap-select button").addClass("disabled");
    $(".dropdown.bootstrap-select").addClass("disabled");
    $(dropdown).selectpicker("refresh");
  } else if (action === "show") {
    $(dropdown).selectpicker();
    $(dropdown).selectpicker("refresh");
    $(dropdown).attr("disabled", false);
    $(".dropdown.bootstrap-select button").removeClass("disabled");
    $(".dropdown.bootstrap-select").removeClass("disabled");
  }
};

const updateDatasetList = (bfaccount) => {
  var filteredDatasets = [];

  $("#div-filter-datasets-progress-2").css("display", "none");

  removeOptions(curateDatasetDropdown);
  addOption(curateDatasetDropdown, "Search here...", "Select dataset");

  initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

  $("#bf-dataset-select-header").css("display", "none");
  $("#curatebfdatasetlist").selectpicker("hide");
  $("#curatebfdatasetlist").selectpicker("refresh");
  $(".selectpicker").selectpicker("hide");
  $(".selectpicker").selectpicker("refresh");
  $("#bf-dataset-select-div").hide();

  // waiting for dataset list to load first before initiating BF dataset dropdown list
  setTimeout(() => {
    var myPermission = $(datasetPermissionDiv).find("#select-permission-list-2").val();

    if (!myPermission) {
      myPermission = "All";
    }

    if (myPermission.toLowerCase() === "all") {
      for (var i = 0; i < datasetList.length; i++) {
        filteredDatasets.push(datasetList[i].name);
      }
    } else {
      for (var i = 0; i < datasetList.length; i++) {
        if (datasetList[i].role === myPermission.toLowerCase()) {
          filteredDatasets.push(datasetList[i].name);
        }
      }
    }

    filteredDatasets.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
    $("#curatebfdatasetlist").find("option:not(:first)").remove();

    for (myitem in filteredDatasets) {
      var myitemselect = filteredDatasets[myitem];
      var option = document.createElement("option");
      option.textContent = myitemselect;
      option.value = myitemselect;
      curateDatasetDropdown.appendChild(option);
    }

    initializeBootstrapSelect("#curatebfdatasetlist", "show");

    $("#div-filter-datasets-progress-2").css("display", "none");
    //$("#bf-dataset-select-header").css("display", "block")
    $("#curatebfdatasetlist").selectpicker("show");
    $("#curatebfdatasetlist").selectpicker("refresh");
    $(".selectpicker").selectpicker("show");
    $(".selectpicker").selectpicker("refresh");
    $("#bf-dataset-select-div").show();

    if (document.getElementById("div-permission-list-2")) {
      document.getElementById("para-filter-datasets-status-2").innerHTML =
        filteredDatasets.length +
        " dataset(s) where you have " +
        myPermission.toLowerCase() +
        " permissions were loaded successfully below.";
    }
  }, 100);
};

// per change event of current dataset span text
function confirm_click_function() {
  let temp = $(".bf-dataset-span").html();
  if ($(".bf-dataset-span").html() == "None" || $(".bf-dataset-span").html() == "") {
    $($(this).parents().find(".field").find(".div-confirm-button")).css("display", "none");
    $("#para-review-dataset-info-disseminate").text("None");
  } else {
    $($(this).parents().find(".field").find(".div-confirm-button")).css("display", "flex");
    if ($($(this).parents().find(".field").find(".synced-progress")).length) {
      if ($($(this).parents().find(".field").find(".synced-progress")).css("display") === "none") {
        $(".confirm-button").click();
      }
    } else {
      $(".confirm-button").click();
    }
  }
}

var dropdownEventID = "";
const openDropdownPrompt = async (ev, dropdown, show_timer = true) => {
  // if users edit current account
  if (dropdown === "bf") {
    var resolveMessage = "";
    if (bfAccountOptionsStatus === "") {
      if (Object.keys(bfAccountOptions).length === 1) {
        footerMessage = "No existing accounts to load. Please add an account.";
      } else {
        footerMessage = "";
      }
    } else {
      footerMessage = bfAccountOptionsStatus;
    }
    var bfacct;
    let bfAccountSwal = false;
    if (bfAccountSwal === null) {
      if (bfacct !== "Select") {
        Swal.fire({
          allowEscapeKey: false,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          title: "Loading your account details...",
          didOpen: () => {
            Swal.showLoading();
          },
        });
        $("#Question-getting-started-BF-account")
          .nextAll()
          .removeClass("show")
          .removeClass("prev")
          .removeClass("test2");
        $("#Question-generate-dataset-BF-account")
          .nextAll()
          .removeClass("show")
          .removeClass("prev")
          .removeClass("test2");
        $("#current-bf-account").text("");
        $("#current-bf-account-generate").text("");
        $("#create_empty_dataset_BF_account_span").text("");
        $(".bf-account-span").text("");
        $("#current-bf-dataset").text("None");
        $("#current-bf-dataset-generate").text("None");
        $(".bf-dataset-span").html("None");
        defaultBfDataset = "Select dataset";
        document.getElementById("ds-description").innerHTML = "";
        refreshDatasetList();
        $($("#button-confirm-bf-dataset-getting-started").parents()[0]).css("display", "none");
        $("#button-confirm-bf-dataset-getting-started").hide();

        $("#para-account-detail-curate").html("");
        $("#current-bf-dataset").text("None");
        $(".bf-dataset-span").html("None");
        showHideDropdownButtons("dataset", "hide");

        try {
          let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
            params: {
              selected_account: bfacct,
            },
          });
          let accountDetails = bf_account_details_req.data.account_details;
          $("#para-account-detail-curate").html(accountDetails);
          $("#current-bf-account").text(bfacct);
          $("#current-bf-account-generate").text(bfacct);
          $("#create_empty_dataset_BF_account_span").text(bfacct);
          $(".bf-account-span").text(bfacct);
          updateBfAccountList();
          //change icons in getting started page (guided mode)
          const gettingStartedPennsieveBtn = document.getElementById(
            "getting-started-pennsieve-account"
          );
          gettingStartedPennsieveBtn.children[0].style.display = "none";
          gettingStartedPennsieveBtn.children[1].style.display = "flex";

          try {
            let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
              params: {
                selected_account: bfacct,
              },
            });

            datasetList = [];
            datasetList = responseObject.data.datasets;
            refreshDatasetList();
          } catch (error) {
            clientError(error);
            document.getElementById("para-filter-datasets-status-2").innerHTML =
              "<span style='color: red'>" + userErrorMessage(error) + "</span>";
            return;
          }
        } catch (error) {
          clientError(error);
          Swal.fire({
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            icon: "error",
            text: userErrorMessage(error),
            footer:
              "<a href='https://docs.pennsieve.io/docs/configuring-the-client-credentials'>Why do I have this issue?</a>",
          });
          showHideDropdownButtons("account", "hide");
        }
      } else {
        Swal.showValidationMessage("Please select an account!");
      }
    } else if (bfAccountSwal === false) {
      Swal.fire({
        allowOutsideClick: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        confirmButtonText: "Connect to Pennsieve",
        showCloseButton: false,
        focusConfirm: false,
        heightAuto: false,
        reverseButtons: reverseSwalButtons,
        showCancelButton: true,

        title: `<h3 style="text-align:center">Connect your Pennsieve account using your email and password</h3><p class="tip-content" style="margin-top: .5rem">Your email and password will not be saved and not seen by anyone.</p>`,

        html: `<input type="text" id="ps_login" class="swal2-input" placeholder="Email Address for Pennsieve">
          <input type="password" id="ps_password" class="swal2-input" placeholder="Password">`,
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },

        footer: `<a target="_blank" href="https://docs.sodaforsparc.io/docs/how-to/how-to-get-a-pennsieve-account" style="text-decoration: none;">I don't have a Pennsieve account and/or access to the SPARC Organization</a>`,

        didOpen: () => {
          $(".swal-popover").popover();
          let div_footer = document.getElementsByClassName("swal2-footer")[0];
          document.getElementsByClassName("swal2-popup")[0].style.width = "43rem";
          div_footer.style.flexDirection = "column";
          div_footer.style.alignItems = "center";
          let swal_actions = document.getElementsByClassName("swal2-actions")[0];
          let api_button = document.createElement("button");
          let api_arrow = document.createElement("i");

          api_button.innerText = "Connect with API key instead";
          api_button.setAttribute("onclick", "showBFAddAccountSweetalert()");
          api_arrow.classList.add("fas");
          api_arrow.classList.add("fa-arrow-right");
          api_arrow.style.marginLeft = "10px";
          api_button.type = "button";
          api_button.style.border = "";
          api_button.id = "api_connect_btn";
          api_button.classList.add("transition-btn");
          api_button.classList.add("api_key-btn");
          api_button.classList.add("back");
          api_button.style.display = "inline";
          api_button.appendChild(api_arrow);
          swal_actions.parentElement.insertBefore(api_button, div_footer);
        },
        preConfirm: async () => {
          Swal.resetValidationMessage();
          Swal.showLoading();
          const login = Swal.getPopup().querySelector("#ps_login").value;
          const password = Swal.getPopup().querySelector("#ps_password").value;
          if (!login || !password) {
            Swal.hideLoading();
            Swal.showValidationMessage(`Please enter email and password`);
          } else {
            let key_name = SODA_SPARC_API_KEY;
            let response = await get_api_key(login, password, key_name);
            if (response[0] == "failed") {
              let error_message = response[1];
              if (response[1]["message"] === "exceptions must derive from BaseException") {
                error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">It seems that you do not have access to the SPARC Organization on Pennsieve. See our <a target="_blank" href="https://docs.sodaforsparc.io/docs/next/how-to/how-to-get-a-pennsieve-account">[dedicated help page]</a> to learn how to get access</div>`;
              }
              if (response[1]["message"] === "Error: Username or password was incorrect.") {
                error_message = `<div style="margin-top: .5rem; margin-right: 1rem; margin-left: 1rem;">Error: Username or password was incorrect</div>`;
              }
              Swal.hideLoading();
              Swal.showValidationMessage(error_message);
              document.getElementById("swal2-validation-message").style.flexDirection = "column";
            } else if (response["success"] == "success") {
              return {
                key: response["key"],
                secret: response["secret"],
                name: response["name"],
              };
            }
          }
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            allowEscapeKey: false,
            backdrop: "rgba(0,0,0, 0.4)",
            heightAuto: false,
            showConfirmButton: false,
            title: "Adding account...",
            didOpen: () => {
              Swal.showLoading();
            },
          });
          let key_name = result.value.name;
          let apiKey = result.value.key;
          let apiSecret = result.value.secret;
          //needs to be replaced
          try {
            await client.put(`/manage_datasets/account/username`, {
              keyname: key_name,
              key: apiKey,
              secret: apiSecret,
            });
            bfAccountOptions[key_name] = key_name;
            defaultBfAccount = key_name;
            defaultBfDataset = "Select dataset";

            try {
              let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
                params: {
                  selected_account: defaultBfAccount,
                },
              });
              let result = bf_account_details_req.data.account_details;
              $("#para-account-detail-curate").html(result);
              $("#current-bf-account").text(key_name);
              $("#current-bf-account-generate").text(key_name);
              $("#create_empty_dataset_BF_account_span").text(key_name);
              $(".bf-account-span").text(key_name);
              $("#current-bf-dataset").text("None");
              $("#current-bf-dataset-generate").text("None");
              $(".bf-dataset-span").html("None");
              $("#para-account-detail-curate-generate").html(result);
              $("#para_create_empty_dataset_BF_account").html(result);
              $("#para-account-detail-curate-generate").html(result);
              $(".bf-account-details-span").html(result);
              $("#para-continue-bf-dataset-getting-started").text("");

              $("#current_curation_team_status").text("None");
              $("#curation-team-share-btn").hide();
              $("#curation-team-unshare-btn").hide();
              $("#current_sparc_consortium_status").text("None");
              $("#sparc-consortium-share-btn").hide();
              $("#sparc-consortium-unshare-btn").hide();
              const gettingStartedPennsieveBtn = document.getElementById(
                "getting-started-pennsieve-account"
              );
              gettingStartedPennsieveBtn.children[0].style.display = "none";
              gettingStartedPennsieveBtn.children[1].style.display = "flex";

              showHideDropdownButtons("account", "show");
              confirm_click_account_function();
              updateBfAccountList();

              // If the clicked button is the Guided Mode log in button, refresh the page to update UI
              if (ev.getAttribute("id") === "guided-button-pennsieve-log-in") {
                openPage("guided-pennsieve-intro-tab");
              }
            } catch (error) {
              clientError(error);
              Swal.fire({
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                icon: "error",
                text: "Something went wrong!",
                footer:
                  '<a target="_blank" href="https://docs.pennsieve.io/docs/configuring-the-client-credentials">Why do I have this issue?</a>',
              });
              showHideDropdownButtons("account", "hide");
              confirm_click_account_function();
            }

            Swal.fire({
              allowEscapeKey: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              icon: "success",
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true,
              title: "Successfully added! <br/>Loading your account details...",
              didOpen: () => {
                Swal.showLoading();
              },
            });
          } catch (error) {
            clientError(error);
            Swal.showValidationMessage(userErrorMessage(error));
            Swal.close();
          }
        }
      });
    }
  } else if (dropdown === "dataset") {
    if (ev != null) {
      dropdownEventID = ev.id;
    }
    $(".svg-change-current-account.dataset").css("display", "none");
    $("#div-permission-list-2").css("display", "none");
    $(".ui.active.green.inline.loader.small").css("display", "block");

    setTimeout(async function () {
      // disable the Continue btn first
      $("#nextBtn").prop("disabled", true);
      var bfDataset = "";

      // if users edit Current dataset
      datasetPermissionDiv.style.display = "none";
      $(datasetPermissionDiv)
        .find("#curatebfdatasetlist")
        .find("option")
        .empty()
        .append('<option value="Select dataset">Search here...</option>')
        .val("Select dataset");

      $(datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "block");

      $("#bf-dataset-select-header").css("display", "none");

      $(datasetPermissionDiv).find("#para-filter-datasets-status-2").text("");
      $("#para-continue-bf-dataset-getting-started").text("");

      $(datasetPermissionDiv).find("#select-permission-list-2").val("All").trigger("change");
      $(datasetPermissionDiv).find("#curatebfdatasetlist").val("Select dataset").trigger("change");

      initializeBootstrapSelect("#curatebfdatasetlist", "disabled");

        //account is signed in but no datasets have been fetched or created
        //invoke dataset request to ensure no datasets have been created
        if (datasetList.length === 0) {
          let responseObject;
          try {
            responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
              params: {
                selected_account: defaultBfAccount,
              },
            });
          } catch (error) {
            clientError(error);
            return;
          }

          let result = responseObject.data.datasets;
          datasetList = [];
          datasetList = result;
          refreshDatasetList();
        }

        //after request check length again
      //if 0 then no datasets have been created
      if (datasetList.length === 0) {
        Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Create new dataset",
          focusCancel: false,
          focusConfirm: true,
          showCloseButton: true,
          showCancelButton: true,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          title: "<h3 style='margin-bottom:20px !important'>No dataset found</h3>",
          html: "It appears that your don't have any datasets on Pennsieve with owner or manage permission.<br><br>Please create one to get started.",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          didOpen: () => {
            $(".ui.active.green.inline.loader.small").css("display", "none");
            $(".svg-change-current-account.dataset").css("display", "block");
          },
        }).then((result) => {
          if (result.isConfirmed) {
            $("#create_new_bf_dataset_btn").click();
          }
        });
        ipcRenderer.send(
          "track-event",
          "Error",
          "Selecting dataset",
          "User has not created any datasets",
          1
        );
      }

      //datasets do exist so display popup with dataset options
      //else datasets have been created
      if (datasetList.length > 0) {
        await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          cancelButtonText: "Cancel",
          confirmButtonText: "Confirm",
          focusCancel: true,
          focusConfirm: false,
          heightAuto: false,
          allowOutsideClick: false,
          allowEscapeKey: true,
          html: datasetPermissionDiv,
          reverseButtons: reverseSwalButtons,
          showCloseButton: true,
          showCancelButton: true,
          title: "<h3 style='margin-bottom:20px !important'>Select your dataset</h3>",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster animate_fastest",
          },
          willOpen: () => {
            $("#curatebfdatasetlist").selectpicker("hide");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#bf-dataset-select-div").hide();
          },
          didOpen: () => {
            $("#div-permission-list-2").css("display", "block");
            $(".ui.active.green.inline.loader.small").css("display", "none");
            datasetPermissionDiv.style.display = "block";
            $("#curatebfdatasetlist").attr("disabled", false);
            $(datasetPermissionDiv).find("#div-filter-datasets-progress-2").css("display", "none");
            $("#curatebfdatasetlist").selectpicker("refresh");
            $("#curatebfdatasetlist").selectpicker("show");
            $("#bf-dataset-select-div").show();

            bfDataset = $("#curatebfdatasetlist").val();
            let sweet_al = document.getElementsByClassName("swal2-content")[0];
            let sweet_alrt = document.getElementsByClassName("swal2-actions")[0];
            sweet_alrt.style.marginTop = "1rem";

            let tip_container = document.createElement("div");
            let tip_content = document.createElement("p");
            tip_content.innerText =
              "Only datasets where you have owner or manager permissions will be shown in the list";
            tip_content.classList.add("tip-content");
            tip_content.style.textAlign = "left";
            tip_container.style.marginTop = ".5rem";
            tip_container.appendChild(tip_content);
            sweet_al.appendChild(tip_container);
          },
          preConfirm: () => {
            bfDataset = $("#curatebfdatasetlist").val();
            if (!bfDataset) {
              Swal.showValidationMessage("Please select a dataset!");

              $(datasetPermissionDiv)
                .find("#div-filter-datasets-progress-2")
                .css("display", "none");
              $("#curatebfdatasetlist").selectpicker("show");
              $("#curatebfdatasetlist").selectpicker("refresh");
              $("#bf-dataset-select-div").show();

              return undefined;
            } else {
              if (bfDataset === "Select dataset") {
                Swal.showValidationMessage("Please select a dataset!");

                $(datasetPermissionDiv)
                  .find("#div-filter-datasets-progress-2")
                  .css("display", "none");
                $("#curatebfdatasetlist").selectpicker("show");
                $("#curatebfdatasetlist").selectpicker("refresh");
                $("#bf-dataset-select-div").show();

                return undefined;
              } else {
                $("#license-lottie-div").css("display", "none");
                $("#license-assigned").css("display", "none");
                return bfDataset;
              }
            }
          },
        }).then((result) => {
          if (result.isConfirmed) {
            if (show_timer) {
              Swal.fire({
                allowEscapeKey: false,
                backdrop: "rgba(0,0,0, 0.4)",
                heightAuto: false,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: false,
                title: "Loading your dataset details...",
                didOpen: () => {
                  Swal.showLoading();
                },
              });
            }
            if (dropdownEventID === "dd-select-pennsieve-dataset") {
              $("#ds-name").val(bfDataset);
              $("#ds-description").val = $("#bf-dataset-subtitle").val;
              $("body").removeClass("waiting");
              $(".svg-change-current-account.dataset").css("display", "block");
              dropdownEventID = "";
              return;
            }
            $("#current-bf-dataset").text(bfDataset);
            $("#current-bf-dataset-generate").text(bfDataset);
            $(".bf-dataset-span").html(bfDataset);
            confirm_click_function();

            defaultBfDataset = bfDataset;
            // document.getElementById("ds-description").innerHTML = "";
            refreshDatasetList();
            $("#dataset-loaded-message").hide();

            showHideDropdownButtons("dataset", "show");
            document.getElementById("div-rename-bf-dataset").children[0].style.display = "flex";

            // show the confirm button underneath the dataset select dropdown if one exists
            let btn = document.querySelector(".btn-confirm-ds-selection");
            btn.style.visibility = "visible";
            btn.style.display = "flex";

            // checkPrevDivForConfirmButton("dataset");
          } else if (result.isDismissed) {
            currentDatasetLicense.innerText = currentDatasetLicense.innerText;
          }
        });

        if ($("#current-bf-dataset-generate").text() === "None") {
          showHideDropdownButtons("dataset", "hide");
        } else {
          showHideDropdownButtons("dataset", "show");
        }
        //currently changing it but not visually in the UI
        $("#bf_list_users_pi").val("Select PI");

        let oldDatasetButtonSelected = document.getElementById("oldDatasetDescription-selection");
        let newDatasetButtonSelected = document.getElementById("newDatasetDescription-selection");

        if (newDatasetButtonSelected.classList.contains("checked")) {
          document.getElementById("Question-prepare-dd-2").classList.add("show");

          document.getElementById("dd-select-pennsieve-dataset").style.display = "block";
          document.getElementById("ds-name").value =
            document.getElementById("rename_dataset_name").innerText;
        } else {
          document.getElementById("Question-prepare-dd-4").classList.add("show");
          let onMyCompButton = document.getElementById("Question-prepare-dd-4-new");
          document.getElementById("dd-select-pennsieve-dataset").style.display = "none";
          let onPennsieveButton =
            onMyCompButton.parentElement.parentElement.children[1].children[0];
          if (onMyCompButton.classList.contains("checked")) {
            document.getElementById("Question-prepare-dd-3").classList.add("show");
          } else {
            document.getElementById("Question-prepare-dd-5").classList.add("show");
          }
        }

        // update the gloabl dataset id
        for (const item of datasetList) {
          let { name } = item;
          let { id } = item;
          if (name === bfDataset) {
            defaultBfDatasetId = id;
          }
        }

        let PI_users = document.getElementById("bf_list_users_pi");
        PI_users.value = "Select PI";
        $("#bf_list_users_pi").selectpicker("refresh");

        // log a map of datasetId to dataset name to analytics
        // this will be used to help us track private datasets which are not trackable using a datasetId alone
        ipcRenderer.send(
          "track-event",
          "Dataset ID to Dataset Name Map",
          defaultBfDatasetId,
          defaultBfDataset
        );

        // document.getElementById("ds-description").innerHTML = "";
        refreshDatasetList();
        $("#dataset-loaded-message").hide();

        showHideDropdownButtons("dataset", "show");
        // checkPrevDivForConfirmButton("dataset");
      }

      // hide "Confirm" button if Current dataset set to None
      if ($("#current-bf-dataset-generate").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }

      // hide "Confirm" button if Current dataset under Getting started set to None
      if ($("#current-bf-dataset").text() === "None") {
        showHideDropdownButtons("dataset", "hide");
      } else {
        showHideDropdownButtons("dataset", "show");
      }
      $("body").removeClass("waiting");
      $(".svg-change-current-account.dataset").css("display", "block");
      $(".ui.active.green.inline.loader.small").css("display", "none");
      ipcRenderer.send("track-event", "Success", "Selecting dataset", defaultBfDatasetId, 1);
    }, 10);
  }
};

// -----------------------------------------------------------------------------------
// ------------------------------ Original renderer.js ------------------------------
// -----------------------------------------------------------------------------------


// const prevent_sleep_id = "";
// const electron_app = electron.app;
// const app = remote.app;
// const Clipboard = electron.clipboard;
var reverseSwalButtons = false;

var datasetStructureJSONObj = {
  folders: {},
  files: {},
  type: "",
};

let introStatus = {
  organizeStep3: true,
  submission: false,
  subjects: false,
  samples: false,
};


//////////////////////////////////
// App launch actions
//////////////////////////////////

// // Log file settings //
// const homeDirectory = app.getPath("home");
// const SODA_SPARC_API_KEY = "SODA-Pennsieve";

// // get port number from the main process
// const port = ipcRenderer.sendSync("get-port");

// // Check current app version //
// const appVersion = app.getVersion();
// console.log("Current SODA version:", appVersion);

// Here is where the splash screen lotties are created and loaded.
// A mutation observer watches for when the overview tab element has
// a class change to 'is-shown' to know when to load and unload the lotties
let over_view_section = document.getElementById("getting_started-section");
let column1 = document.getElementById("lottie1");
let column2 = document.getElementById("lottie2");
let column3 = document.getElementById("lottie3");
let heart_lottie = document.getElementById("heart_lottie");

var column1_lottie = lottie.loadAnimation({
  container: column1,
  animationData: column1Lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});
var column2_lottie = lottie.loadAnimation({
  container: column2,
  animationData: column2Lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});
var column3_lottie = lottie.loadAnimation({
  container: column3,
  animationData: column3Lottie,
  renderer: "svg",
  loop: true,
  autoplay: true,
});
var heart_container = lottie.loadAnimation({
  container: heart_lottie,
  animationData: heartLottie,
  renderer: "svg",
  loop: true,
  autoplay: true,
});

var overview_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var attributeValue = $(mutation.target).prop(mutation.attributeName);

    if (attributeValue.includes("is-shown") == true) {
      //add lotties
      column1_lottie.play();
      column2_lottie.play();
      column3_lottie.play();
      heart_container.play();
    } else {
      column1_lottie.stop();
      column2_lottie.stop();
      column3_lottie.stop();
      heart_container.stop();
    }
  });
});

overview_observer.observe(over_view_section, {
  attributes: true,
  attributeFilter: ["class"],
});

//////////////////////////////////
// Connect to Python back-end
//////////////////////////////////

let client = null;

// get port number from the main process

// TODO: change the default port so it is based off the discovered port in Main.js
client = axios.create({
  baseURL: `http://127.0.0.1:${port}/`,
  timeout: 300000,
});

const notyf = new Notyf({
  position: { x: "right", y: "bottom" },
  dismissible: true,
  ripple: false,
  types: [
    {
      type: "checking_server_is_live",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 1000,
    },
    {
      type: "checking_server_api_version",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 1000,
    },
    {
      type: "loading_internet",
      background: "grey",
      icon: {
        className: "fas fa-wifi",
        tagName: "i",
        color: "white",
      },
      duration: 10000,
    },
    {
      type: "ps_agent",
      background: "grey",
      icon: {
        className: "fas fa-cogs",
        tagName: "i",
        color: "white",
      },
      duration: 5000,
    },
    {
      type: "app_update",
      background: "grey",
      icon: {
        className: "fas fa-sync-alt",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "api_key_search",
      background: "grey",
      icon: {
        className: "fas fa-users-cog",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "success",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 800,
    },
    {
      type: "final",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
    {
      type: "warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-exclamation-triangle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
    {
      type: "app_update_warning",
      background: "#fa8c16",
      icon: {
        className: "fas fa-tools",
        tagName: "i",
        color: "white",
      },
      duration: 0,
    },
    {
      type: "error",
      background: "#B80D49",
      icon: {
        className: "fas fa-times-circle",
        tagName: "i",
        color: "white",
      },
      duration: 3000,
    },
  ],
});

let connected_to_internet = false;
let update_available_notification = "";
let update_downloaded_notification = "";

// utility function for async style set timeout
const wait = async (delay) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};
// check that the client connected to the server
const startupChecks = async () => {

  run_pre_flight_checks() // Run internet check immediately


  let status = false;
  let time_start = new Date();
  let error = "";

  const waitTime = 1000*60*(isElectron ? 2 : 0.1); // Wait 2 seconds if in electron context
  while (true) {
    try {
      status = await serverIsLiveStartup();
    } catch (e) {
      error = e;
      status = false;
    }
    if (status) break;
    if (new Date() - time_start > waitTime) break;
    await wait(2000);
  }

  if (!status) {

    if (!isElectron) return console.warn('[NWB GUIDE — DEV] Background services are not running outside of the Electron context')
    //two minutes pass then handle connection error
    // SWAL that the server needs to be restarted for the app to work
    clientError(error);
    // ipcRenderer.send("track-event", "Error", "Establishing Python Connection", error);

    await Swal.fire({
      icon: "error",
      html: `Something went wrong while initializing the application's background services. Please restart NWB GUIDE and try again. If this issue occurs multiple times, please open an issue on the <a href='https://github.com/catalystneuro/nwb-guide/issues'>NWB GUDE Issue Tracker</a>.`,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Restart now",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    // // Restart the app
    // app.relaunch();
    // app.exit();
  }

  console.log("Connected to Python back-end successfully");
  // ipcRenderer.send("track-event", "Success", "Establishing Python Connection");

  // dismiss the Swal
  Swal.close();

   // Update the options on the multi-select form
   const multiselectEl = document.getElementById("neuroconv-define-formats");
   const base = `http://127.0.0.1:${port}`;
   const multiselectOptions = await fetch(`${base}/neuroconv`).then((res) => res.json());
   multiselectEl.setAttribute("options", JSON.stringify(multiselectOptions))

};

startupChecks();

// Run a set of functions that will check all the core systems to verify that a user can upload datasets with no issues.
async function run_pre_flight_checks (check_update = true) {

  return new Promise(async (resolve) => {
    let connection_response = "";

    // Check the internet connection and if available check the rest.
    connection_response = await check_internet_connection();

    if (!connection_response) {
      await Swal.fire({
        title: "No Internet Connection",
        icon: "success",
        text: "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of SODA related to Pennsieve and especially none of the features located under the 'Manage Datasets' section.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        confirmButtonText: "I understand",
        showConfirmButton: true,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Do nothing
        }
      });
      return resolve(false);
    }
  });
};

// Check if the Pysoda server is live
const serverIsLiveStartup = async () => {
  let echoResponseObject;

  try {
    echoResponseObject = await client.get("/startup/echo?arg=server ready");
  } catch (error) {
    throw error;
  }

  let echoResponse = echoResponseObject.data;

  return echoResponse === "server ready" ? true : false;
};

async function check_internet_connection(show_notification = true) {
  let notification = null;
  if (show_notification) {
    notification = notyf.open({
      type: "loading_internet",
      message: "Checking Internet status...",
    });
  }
  await wait(800);


  connected_to_internet = navigator.onLine;
  if (connected_to_internet) {
    console.log("Connected to the internet");

      if (show_notification) {
        notyf.dismiss(notification);
        notyf.open({
          type: "success",
          message: "Connected to the internet",
        });
      }
  } else {
      console.error("No internet connection");
      // if (electronImports.ipcRenderer) electronImports.ipcRenderer.send("warning-no-internet-connection"); // NOTE: Proposed syntax t continue accessing the ipcRenderer
      if (show_notification) {
        notyf.dismiss(notification);
        notyf.open({
          type: "error",
          message: "Not connected to internet",
        });
      }
    }

    return navigator.onLine;
};

//////////////////////////////////
// Get html elements from UI
//////////////////////////////////

// Navigator button //
const buttonSidebar = document.getElementById("button-hamburger");
const buttonSidebarIcon = document.getElementById("button-soda-icon");
const buttonSidebarBigIcon = document.getElementById("button-soda-big-icon");

// Metadata Templates //
const downloadSubmission = document.getElementById("a-submission");
const downloadSamples = document.getElementById("a-samples");
const downloadSubjects = document.getElementById("a-subjects");
const downloadDescription = document.getElementById("a-description");
const downloadManifest = document.getElementById("a-manifest");

/////// New Organize Datasets /////////////////////
const organizeDSbackButton = document.getElementById("button-back");
const organizeDSaddNewFolder = document.getElementById("new-folder");
const contextMenu = document.getElementById("mycontext");
const fullNameValue = document.querySelector(".hoverFullName");
const homePathButton = document.getElementById("home-path");
const menuFolder = document.querySelector(".menu.reg-folder");
const menuFile = document.querySelector(".menu.file");
const menuHighLevelFolders = document.querySelector(".menu.high-level-folder");
const organizeNextStepBtn = document.getElementById("button-organize-confirm-create");
const organizePrevStepBtn = document.getElementById("button-organize-prev");
const manifestFileCheck = document.getElementById("generate-manifest-curate");
var bfAccountOptions;
var defaultBfAccount;
var defaultBfDataset = "Select dataset";
var defaultBfDatasetId = undefined;
var bfAccountOptionsStatus;

// Organize dataset //
const selectImportFileOrganizationBtn = document.getElementById(
  "button-select-upload-file-organization"
);
const tableMetadata = document.getElementById("metadata-table");
let tableMetadataCount = 0;

// Validate dataset //
const validateCurrentDSBtn = document.getElementById("button-validate-current-ds");
const validateCurrentDatasetReport = document.querySelector("#textarea-validate-current-dataset");
const currentDatasetReportBtn = document.getElementById("button-generate-report-current-ds");
const validateLocalDSBtn = document.getElementById("button-validate-local-ds");
const validateLocalDatasetReport = document.querySelector("#textarea-validate-local-dataset");
const localDatasetReportBtn = document.getElementById("button-generate-report-local-ds");
const validateLocalProgressBar = document.getElementById("div-indetermiate-bar-validate-local");
const validateSODAProgressBar = document.getElementById("div-indetermiate-bar-validate-soda");

// Generate dataset //

var subjectsTableData = [];
var samplesTableData = [];

const newDatasetName = document.querySelector("#new-dataset-name");
const manifestStatus = document.querySelector("#generate-manifest");

// Manage datasets //
var myitem;
var datasetList = [];
const bfUploadRefreshDatasetBtn = document.getElementById("button-upload-refresh-dataset-list");

const pathSubmitDataset = document.querySelector("#selected-local-dataset-submit");
const progressUploadBf = document.getElementById("div-progress-submit");
const progressBarUploadBf = document.getElementById("progress-bar-upload-bf");
const datasetPermissionDiv = document.getElementById("div-permission-list-2");
const bfDatasetSubtitle = document.querySelector("#bf-dataset-subtitle");
const bfDatasetSubtitleCharCount = document.querySelector("#para-char-count-metadata");

const bfCurrentBannerImg = document.getElementById("current-banner-img");

const bfViewImportedImage = document.querySelector("#image-banner");
const guidedBfViewImportedImage = document.querySelector("#guided-image-banner");

const bfSaveBannerImageBtn = document.getElementById("save-banner-image");
const datasetBannerImageStatus = document.querySelector("#para-dataset-banner-image-status");
const formBannerHeight = document.getElementById("form-banner-height");
const guidedFormBannerHeight = document.getElementById("guided-form-banner-height");
const currentDatasetLicense = document.querySelector("#para-dataset-license-current");
const bfListLicense = document.querySelector("#bf-license-list");
const bfAddLicenseBtn = document.getElementById("button-add-license");

// Pennsieve dataset permission //
const currentDatasetPermission = document.querySelector("#para-dataset-permission-current");
const currentAddEditDatasetPermission = document.querySelector(
  "#para-add-edit-dataset-permission-current"
);
const bfListUsersPI = document.querySelector("#bf_list_users_pi");

const bfAddPermissionCurationTeamBtn = document.getElementById(
  "button-add-permission-curation-team"
);
const datasetPermissionStatusCurationTeam = document.querySelector(
  "#para-dataset-permission-status-curation-team"
);
const bfListUsers = document.querySelector("#bf_list_users");
const bfListTeams = document.querySelector("#bf_list_teams");
const bfListRolesTeam = document.querySelector("#bf_list_roles_team");
const bfAddPermissionTeamBtn = document.getElementById("button-add-permission-team");
// Guided mode dropdowns
const guidedBfListUsersAndTeams = document.querySelector("#guided_bf_list_users_and_teams");

//Pennsieve dataset status
const bfCurrentDatasetStatusProgress = document.querySelector(
  "#div-bf-current-dataset-status-progress"
);
const bfListDatasetStatus = document.querySelector("#bf_list_dataset_status");

//Pennsieve post curation
const bfRefreshPublishingDatasetStatusBtn = document.querySelector(
  "#button-refresh-publishing-status"
);
const bfWithdrawReviewDatasetBtn = document.querySelector("#btn-withdraw-review-dataset");

//////////////////////////////////
// Constant parameters
//////////////////////////////////
const blackColor = "#000";
const redColor = "#ff1a1a";
const sparcFolderNames = ["code", "derivative", "docs", "primary", "protocol", "source"];
const smileyCan = '<img class="message-icon" src="assets/img/can-smiley.png">';
const sadCan = '<img class="message-icon" src="assets/img/can-sad.png">';
const delayAnimation = 250;

//////////////////////////////////
// Operations on JavaScript end only
//////////////////////////////////

// Sidebar Navigation //
var open = false;
const openSidebar = (buttonElement) => {
  if (!open) {
    ipcRenderer.send("resize-window", "up");
    $("#main-nav").css("width", "250px");
    $("#SODA-logo").css("display", "block");
    $(buttonSidebarIcon).css("display", "none");
    open = true;
  } else {
    ipcRenderer.send("resize-window", "down");
    $("#main-nav").css("width", "70px");
    $("#SODA-logo").css("display", "block");
    $(buttonSidebarIcon).css("display", "none");
    open = false;
  }
};

///////////////////// Prepare Metadata Section ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const createDragSort = (tagify) => {
  const onDragEnd = () => {
    tagify.updateValueByDOMTags();
  };
  new DragSort(tagify.DOM.scope, {
    selector: "." + tagify.settings.classNames.tag,
    callbacks: {
      dragEnd: onDragEnd,
    },
  });
};

//initialize Tagify input field for guided submission milestones
const guidedSubmissionTagsInput = document.getElementById(
  "guided-tagify-submission-milestone-tags-import"
);

const guidedSubmissionTagsTagify = new Tagify(guidedSubmissionTagsInput, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});
createDragSort(guidedSubmissionTagsTagify);

const guidedSubmissionTagsInputManual = document.getElementById(
  "guided-tagify-submission-milestone-tags-manual"
);
const guidedSubmissionTagsTagifyManual = new Tagify(guidedSubmissionTagsInputManual, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});
createDragSort(guidedSubmissionTagsTagifyManual);

// initiate Tagify input fields for Dataset description file
var keywordInput = document.getElementById("ds-keywords"),
  keywordTagify = new Tagify(keywordInput, {
    duplicates: false,
  });

createDragSort(keywordTagify);

var otherFundingInput = document.getElementById("ds-other-funding"),
  otherFundingTagify = new Tagify(otherFundingInput, {
    duplicates: false,
  });
createDragSort(otherFundingTagify);

var collectionDatasetInput = document.getElementById("tagify-collection-tags"),
  collectionDatasetTags = new Tagify(collectionDatasetInput, {
    whitelist: [],
    duplicates: false,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
      enforceWhitelist: true,
      maxItems: 100,
    },
    autoComplete: {
      enabled: true,
      rightKey: true,
    },
  });
createDragSort(collectionDatasetTags);

var studyOrganSystemsInput = document.getElementById("ds-study-organ-system"),
  studyOrganSystemsTagify = new Tagify(studyOrganSystemsInput, {
    whitelist: [
      "autonomic ganglion",
      "brain",
      "colon",
      "heart",
      "intestine",
      "kidney",
      "large intestine",
      "liver",
      "lower urinary tract",
      "lung",
      "nervous system",
      "pancreas",
      "peripheral nervous system",
      "small intestine",
      "spinal cord",
      "spleen",
      "stomach",
      "sympathetic nervous system",
      "urinary bladder",
    ],
    duplicates: false,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
    },
  });
createDragSort(studyOrganSystemsTagify);

var studyTechniquesInput = document.getElementById("ds-study-technique"),
  studyTechniquesTagify = new Tagify(studyTechniquesInput, {
    duplicates: false,
  });
createDragSort(studyTechniquesTagify);

var studyApproachesInput = document.getElementById("ds-study-approach"),
  studyApproachesTagify = new Tagify(studyApproachesInput, {
    duplicates: false,
  });
createDragSort(studyApproachesTagify);

// tagify the input inside of the "Add/edit tags" manage dataset section
var datasetTagsInput = document.getElementById("tagify-dataset-tags"),
  // initialize Tagify on the above input node reference
  datasetTagsTagify = new Tagify(datasetTagsInput);
createDragSort(datasetTagsTagify);

var guidedDatasetTagsInput = document.getElementById("guided-tagify-dataset-tags"),
  // initialize Tagify on the above input node reference
  guidedDatasetTagsTagify = new Tagify(guidedDatasetTagsInput);
createDragSort(guidedDatasetTagsTagify);

///////////////////// Airtable Authentication /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/////// Load SPARC airtable data
var airtableHostname = "api.airtable.com";

function sendHTTPsRequestAirtable(options, varSuccess) {
  https.get(options, (res) => {
    if (res.statusCode === 200) {
      varSuccess = true;
    } else {

      console.error(res);
      varSuccess = false;
    }
    res.on("error", (error) => {

      console.error(error);
    });
    return res;
  });
}

downloadSubmission.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", globals.templateArray[0]);
});
downloadDescription.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", globals.templateArray[1]);
});
downloadSubjects.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", globals.templateArray[2]);
});
downloadSamples.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", globals.templateArray[3]);
});
downloadManifest.addEventListener("click", (event) => {
  ipcRenderer.send("open-folder-dialog-save-metadata", globals.templateArray[4]);
});
document
  .getElementById("guided-data-deliverables-download-button")
  .addEventListener("click", (event) => {
    ipcRenderer.send("open-folder-dialog-save-metadata", "code_description.xlsx");
  });

/////////////////// Provide Grant Information section /////////////////////////
//////////////// //////////////// //////////////// //////////////// ///////////

////////////////////////Import Milestone Info//////////////////////////////////
const descriptionDateInput = document.getElementById("submission-completion-date");

const milestoneInput1 = document.getElementById("selected-milestone-1");
var milestoneTagify1 = new Tagify(milestoneInput1, {
  duplicates: false,
  delimiters: null,
  dropdown: {
    classname: "color-blue",
    maxItems: Infinity,
    enabled: 0,
    closeOnSelect: true,
  },
});
createDragSort(milestoneTagify1);

function transformImportedExcelFile(type, result) {
  for (var column of result.slice(1)) {
    var indices = getAllIndexes(column, "");
    // check if the first 2 columns are empty
    if (indices.length > 18 && type === "samples" && (indices.includes(0) || indices.includes(1))) {
      return false;
    }
    if (indices.length > 17 && type === "subjects" && indices.includes(0)) {
      return false;
    }
    var indices = getAllIndexes(column, "nan");
    for (var ind of indices) {
      column[ind] = "";f
    }
    if (type === "samples") {
      if (!specimenType.includes(column[5])) {
        column[5] = "";
      }
    }
    return result;
  }
}

function getAllIndexes(arr, val) {
  var indexes = [],
    i = -1;
  while ((i = arr.indexOf(val, i + 1)) != -1) {
    indexes.push(i);
  }
  return indexes;
}

// import existing subjects.xlsx info (calling python to load info to a dataframe)
async function loadSubjectsFileToDataframe(filePath) {
  var fieldSubjectEntries = [];
  for (var field of $("#form-add-a-subject").children().find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase());
  }

  try {
    let import_subjects_file = await client.get(`/prepare_metadata/subjects_file`, {
      params: {
        type: "subjects",
        filepath: filePath,
        ui_fields: JSON.stringify(fieldSubjectEntries),
      },
    });

    let res = import_subjects_file.data.subject_file_rows;
    // res is a dataframe, now we load it into our subjectsTableData in order to populate the UI
    if (res.length > 1) {
      result = transformImportedExcelFile("subjects", res);
      if (result !== false) {
        subjectsTableData = result;
      } else {
        Swal.fire({
          title: "Couldn't load existing subjects.xlsx file",
          text: "Please make sure the imported file follows the latest SPARC Dataset Structure 2.0.0 and try again.",
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.SUBJECTS,
          AnalyticsGranularity.ALL_LEVELS,
          "Existing",
          Destinations.LOCAL
        );
        return;
      }
      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );
      loadDataFrametoUI("local");
    } else {
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
      Swal.fire({
        title: "Couldn't load existing subjects.xlsx file",
        text: "Please make sure there is at least one subject in the subjects.xlsx file.",
        icon: "error",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  } catch (error) {
    clientError(error);
    Swal.fire({
      title: "Couldn't load existing subjects.xlsx file",
      html: userErrorMessage(error),
      icon: "error",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SUBJECTS,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

// import existing subjects.xlsx info (calling python to load info to a dataframe)
async function loadSamplesFileToDataframe(filePath) {
  var fieldSampleEntries = [];
  for (var field of $("#form-add-a-sample").children().find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase());
  }
  try {
    let importSamplesResponse = await client.get(`/prepare_metadata/samples_file`, {
      params: {
        type: "samples.xlsx",
        filepath: filePath,
        ui_fields: JSON.stringify(fieldSampleEntries),
      },
    });

    let res = importSamplesResponse.data.sample_file_rows;
    // res is a dataframe, now we load it into our samplesTableData in order to populate the UI
    if (res.length > 1) {
      result = transformImportedExcelFile("samples", res);
      if (result !== false) {
        samplesTableData = result;
      } else {
        Swal.fire({
          title: "Couldn't load existing samples.xlsx file",
          text: "Please make sure the imported file follows the latest SPARC Dataset Structure 2.0.0 and try again.",
          icon: "error",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });

        logMetadataForAnalytics(
          "Error",
          MetadataAnalyticsPrefix.SAMPLES,
          AnalyticsGranularity.ALL_LEVELS,
          "Existing",
          Destinations.LOCAL
        );

        return;
      }
      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        "Existing",
        Destinations.LOCAL
      );

      loadDataFrametoUISamples("local");
    } else {
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ALL_LEVELS,
        "Existing",
        Destinations.LOCAL
      );
      Swal.fire({
        title: "Couldn't load existing samples.xlsx file",
        text: "Please make sure there is at least one sample in the samples.xlsx file.",
        icon: "error",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  } catch (error) {
    clientError(error);

    Swal.fire({
      title: "Couldn't load existing samples.xlsx file",
      html: userErrorMessage(error),
      icon: "error",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });

    logMetadataForAnalytics(
      "Error",
      MetadataAnalyticsPrefix.SAMPLES,
      AnalyticsGranularity.ALL_LEVELS,
      "Existing",
      Destinations.LOCAL
    );
  }
}

// load and parse json file
function parseJson(path) {
  if (!fs.existsSync(path)) {
    return {};
  }
  try {
    var content = fs.readFileSync(path);
    contentJson = JSON.parse(content);
    return contentJson;
  } catch (error) {

    console.log(error);
    return {};
  }
}

const specimenType = [
  "whole organism",
  "whole organ",
  "fluid specimen",
  "tissue",
  "nerve",
  "slice",
  "section",
  "cryosection",
  "cell",
  "nucleus",
  "nucleic acid",
  "slide",
  "whole mount",
];
function createSpecimenTypeAutocomplete(id) {
  var autoCompleteJS3 = new autoComplete({
    selector: "#" + id,
    data: {
      cache: true,
      src: specimenType,
    },
    onSelection: (feedback) => {
      var selection = feedback.selection.value;
      document.querySelector("#" + id).value = selection;
    },
    trigger: {
      event: ["input", "focus"],
      // condition: () => true
    },
    resultItem: {
      destination: "#" + id,
      highlight: {
        render: true,
      },
    },
    resultsList: {
      // id: listID,
      maxResults: 5,
    },
  });
}

function createSpeciesAutocomplete(id) {
  // var listID = "autocomplete" + id;
  var autoCompleteJS2 = new autoComplete({
    selector: "#" + id,
    data: {
      src: [
        {
          "Canis lupus familiaris": "dogs, beagle dogs",
          "Mustela putorius furo": "ferrets, black ferrets",
          "Mus sp.": "mice",
          "Mus musculus": "mouse, house mouse",
          "Rattus norvegicus": "Norway rats",
          Rattus: "rats",
          "Sus scrofa": "pigs, swine, wild boar",
          "Sus scrofa domesticus": "domestic pigs",
          "Homo sapiens": "humans",
          "Felis catus": "domestic cat",
        },
      ],
      keys: [
        "Canis lupus familiaris",
        "Mustela putorius furo",
        "Mus sp.",
        "Mus musculus",
        "Sus scrofa",
        "Sus scrofa domesticus",
        "Homo sapiens",
        "Rattus",
        "Felis catus",
        "Rattus norvegicus",
      ],
    },
    resultItem: {
      element: (item, data) => {
        // Modify Results Item Style
        item.style = "display: flex; justify-content: space-between;";
        // Modify Results Item Content
        item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          ${data.match}
        </span>
        <span style="display: flex; align-items: center; font-size: 13px; font-weight: 100; text-transform: uppercase; color: rgba(0,0,0,.2);">
          ${data.key}
        </span>`;
      },
      highlight: true,
    },
    events: {
      input: {
        focus: () => {
          autoCompleteJS2.start();
        },
      },
    },
    threshold: 0,
    resultsList: {
      element: (list, data) => {
        const info = document.createElement("div");

        if (data.results.length === 0) {
          info.setAttribute("class", "no_results_species");
          info.setAttribute("onclick", "loadTaxonomySpecies('" + data.query + "', '" + id + "')");
          info.innerHTML = `Find the scientific name for <strong>"${data.query}"</strong>`;
        }
        list.prepend(info);
      },
      noResults: true,
      maxResults: 5,
      tabSelect: true,
    },
  });

  autoCompleteJS2.input.addEventListener("selection", function (event) {
    var feedback = event.detail;
    var selection = feedback.selection.key;
    // Render selected choice to selection div
    document.getElementById(id).value = selection;
    // Replace Input value with the selected value
    autoCompleteJS2.input.value = selection;
    $("#btn-confirm-species").removeClass("confirm-disabled");
  });
}

function createStrain(id, type, curationMode) {
  var autoCompleteJS4 = new autoComplete({
    selector: "#" + id,
    data: {
      src: ["Wistar", "Yucatan", "C57/B6J", "C57 BL/6J", "mixed background", "Sprague-Dawley"],
    },
    events: {
      input: {
        focus: () => {
          autoCompleteJS4.start();
        },
      },
    },
    resultItem: {
      element: (item, data) => {
        // Modify Results Item Style
        item.style = "display: flex; justify-content: space-between;";
        // Modify Results Item Content
        item.innerHTML = `
        <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          ${data.match}
        </span>`;
      },
      highlight: true,
    },
    threshold: 0,
    resultsList: {
      element: (list, data) => {
        const info = document.createElement("div");

        if (data.results.length === 0) {
          info.setAttribute("class", "no_results_species");
          info.setAttribute(
            "onclick",
            "populateRRID('" + data.query + "', '" + type + "', '" + curationMode + "')"
          );
          info.innerHTML = `Click here to check <strong>"${data.query}"</strong>`;
        }
        list.prepend(info);
      },
      noResults: true,
      maxResults: 5,
      tabSelect: true,
    },
  });

  autoCompleteJS4.input.addEventListener("selection", function (event) {
    var feedback = event.detail;
    var selection = feedback.selection.value;
    document.querySelector("#" + id).value = selection;
    var strain = $("#sweetalert-" + type + "-strain").val();
    if (strain !== "") {
      populateRRID(strain, type, curationMode);
    }
    autoCompleteJS4.input.value = selection;
  });
}

async function loadTaxonomySpecies(commonName, destinationInput) {
  Swal.fire({
    title: "Finding the scientific name for " + commonName + "...",
    html: "Please wait...",
    heightAuto: false,
    allowOutsideClick: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  try {
    let load_taxonomy_species = await client.get(`/taxonomy/species`, {
      params: {
        animals_list: [commonName],
      },
    });
    let res = load_taxonomy_species.data;

    if (Object.keys(res).length === 0) {
      Swal.fire({
        title: "Cannot find a scientific name for '" + commonName + "'",
        text: "Make sure you enter a correct species name.",
        icon: "error",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      if (!$("#btn-confirm-species").hasClass("confirm-disabled")) {
        $("#btn-confirm-species").addClass("confirm-disabled");
      }
      if (destinationInput.includes("subject")) {
        if ($("#bootbox-subject-species").val() === "") {
          $("#bootbox-subject-species").css("display", "none");
        }
        // set the Edit species button back to "+ Add species"
        $("#button-add-species-subject").html(
          `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
        );
      }
      if (destinationInput.includes("sample")) {
        if ($("#bootbox-sample-species").val() === "") {
          $("#bootbox-sample-species").css("display", "none");
        }
        // set the Edit species button back to "+ Add species"

        $("#button-add-species-sample").html(
          `<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle" width="14" height="14" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>Add species`
        );
      }
    } else {
      $("#" + destinationInput).val(res[commonName]["ScientificName"]);
      $("#btn-confirm-species").removeClass("confirm-disabled");
    }
  } catch (error) {
    clientError(error);
  }
}

// Function to add options to dropdown list
function addOption(selectbox, text, value) {
  var opt = document.createElement("OPTION");
  opt.text = text;
  opt.value = value;
  selectbox.options.add(opt);
}

var awardObj = {};

//////////////// Dataset description file ///////////////////////
//////////////// //////////////// //////////////// ////////////////

//// get datasets and append that to option list for parent datasets
function getParentDatasets() {
  var parentDatasets = [];
  for (var i = 0; i < datasetList.length; i++) {
    parentDatasets.push(datasetList[i].name);
  }
  return parentDatasets;
}

function changeAwardInputDsDescription() {
  if (dsContributorArrayLast1) {
    removeOptions(dsContributorArrayLast1);
  }
  if (dsContributorArrayFirst1) {
    removeOptions(dsContributorArrayFirst1);
    addOption(dsContributorArrayFirst1, "Select an option", "Select an option");
  }

  currentContributorsLastNames = [];
  currentContributorsFirstNames = [];
  globalContributorNameObject = {};

  /// delete old table
  $("#table-current-contributors").find("tr").slice(1, -1).remove();
  for (
    var i = 0;
    i < document.getElementById("table-current-contributors").rows[1].cells.length;
    i++
  ) {
    $($($("#table-current-contributors").find("tr")[1].cells[i]).find("input")[0]).val("");
    $($($("#table-current-contributors").find("tr")[1].cells[i]).find("textarea")[0]).val("");
  }

  var selectID = document.getElementById(
    $($($("#table-current-contributors").find("tr")[1].cells[1]).find("select")[0]).prop("id")
  );
  if (selectID) {
    removeOptions(selectID);
    $($($("#table-current-contributors").find("tr")[1].cells[1]).find("select")[0]).prop(
      "disabled",
      true
    );
  }

  var awardVal = $("#ds-description-award-input");
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"];
    Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appiYd1Tz9Sv857GZ");
    base("sparc_members")
      .select({
        filterByFormula: `({SPARC_Award_#} = "${awardVal}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          var firstName = record.get("First_name");
          var lastName = record.get("Last_name");
          globalContributorNameObject[lastName] = firstName;
          currentContributorsLastNames.push(lastName);
        }),
          fetchNextPage();
        var currentRowLeftID = $(
          $($("#table-current-contributors").find("tr")[1].cells[0]).find("select")[0]
        ).prop("id");
        if (currentRowLeftID) {
          cloneConNamesSelect(currentRowLeftID);
        }
      });
    function done(err) {
      if (err) {

        console.error(err);
        return;
      }
    }
  }
}

// on change event when users choose a contributor's last name
function onchangeLastNames() {
  $("#dd-contributor-first-name").attr("disabled", true);
  var conLastname = $("#dd-contributor-last-name").val();
  removeOptions(document.getElementById("dd-contributor-first-name"));
  if (conLastname in globalContributorNameObject) {
    addOption(
      document.getElementById("dd-contributor-first-name"),
      globalContributorNameObject[conLastname],
      globalContributorNameObject[conLastname]
    );
    $("#dd-contributor-first-name")
      .val(globalContributorNameObject[conLastname])
      .trigger("onchange");
  }
  $("#dd-contributor-first-name").attr("disabled", false);
}

// on change event when users choose a contributor's first name -> Load con info
function onchangeFirstNames() {
  var conLastname = $("#dd-contributor-last-name").val();
  var conFirstname = $("#dd-contributor-first-name").val();
  if (conFirstname !== "Select") {
    loadContributorInfo(conLastname, conFirstname);
  }
}

// Auto populate once a contributor is selected
function loadContributorInfo(lastName, firstName) {
  // first destroy old tagifies
  $($("#input-con-affiliation").siblings()[0]).remove();
  $($("#input-con-role").siblings()[0]).remove();

  var tagifyRole = new Tagify(document.getElementById("input-con-role"), {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      classname: "color-blue",
      maxItems: 25,
      enabled: 0,
      closeOnSelect: true,
    },
  });
  createDragSort(tagifyRole);

  var tagifyAffliation = new Tagify(document.getElementById("input-con-affiliation"), {
    dropdown: {
      classname: "color-blue",
      enabled: 0, // show the dropdown immediately on focus
      maxItems: 25,
      closeOnSelect: true, // keep the dropdown open after selecting a suggestion
    },
    whitelist: affiliationSuggestions,
    delimiters: null,
    duplicates: false,
  });
  createDragSort(tagifyAffliation);

  tagifyRole.removeAllTags();
  tagifyAffliation.removeAllTags();
  var contactLabel = $("#ds-contact-person");
  $(contactLabel).prop("checked", false);
  document.getElementById("input-con-ID").value = "Loading...";

  tagifyAffliation.loading(true);
  tagifyRole.loading(true);

  var airKeyContent = parseJson(airtableConfigPath);
  var airKeyInput = airKeyContent["api-key"];
  var airtableConfig = Airtable.configure({
    endpointUrl: "https://" + airtableHostname,
    apiKey: airKeyInput,
  });
  var base = Airtable.base("appiYd1Tz9Sv857GZ");
  base("sparc_members")
    .select({
      filterByFormula: `AND({First_name} = "${firstName}", {Last_name} = "${lastName}")`,
    })
    .eachPage(function page(records, fetchNextPage) {
      var conInfoObj = {};
      records.forEach(function (record) {
        conInfoObj["ID"] = record.get("ORCID");
        conInfoObj["Role"] = record.get("Dataset_contributor_roles_for_SODA");
        conInfoObj["Affiliation"] = record.get("Institution");
      }),
        fetchNextPage();

      // if no records found, leave fields empty
      leaveFieldsEmpty(conInfoObj["ID"], document.getElementById("input-con-ID"));
      leaveFieldsEmpty(conInfoObj["Role"], document.getElementById("input-con-role"));
      leaveFieldsEmpty(conInfoObj["Affiliation"], document.getElementById("input-con-affiliation"));

      tagifyAffliation.addTags(conInfoObj["Affiliation"]);
      tagifyRole.addTags(conInfoObj["Role"]);
    }),
    function done(err) {
      if (err) {

        console.error(err);
        return;
      }
    };
  tagifyAffliation.loading(false);
  tagifyRole.loading(false);
}

//// De-populate dataset dropdowns to clear options
const clearDatasetDropdowns = () => {
  for (let list of [curateDatasetDropdown]) {
    removeOptions(list);
    addOption(list, "Search here...", "Select dataset");
    list.options[0].disabled = true;
  }
};

//////////////////////// Current Contributor(s) /////////////////////

function delete_current_con(no) {
  // after a contributor is deleted, add their name back to the contributor last name dropdown list
  if (
    $("#ds-description-contributor-list-last-" + no).length > 0 &&
    $("#ds-description-contributor-list-first-" + no).length > 0
  ) {
    var deletedLastName = $("#ds-description-contributor-list-last-" + no).val();
    var deletedFirstName = $("#ds-description-contributor-list-first-" + no).val();
    globalContributorNameObject[deletedLastName] = deletedFirstName;
    currentContributorsLastNames.push(deletedLastName);
  }
  document.getElementById("row-current-name" + no + "").outerHTML = "";
}

function delete_link(no) {
  document.getElementById("row-current-link" + no + "").outerHTML = "";
}

//////////////////////// Article(s) and Protocol(s) /////////////////////

//// function to leave fields empty if no data is found on Airtable
function leaveFieldsEmpty(field, element) {
  if (field !== undefined) {
    element.value = field;
  } else {
    element.value = "";
  }
}

$(currentConTable).mousedown(function (e) {
  var length = currentConTable.rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
  }
  $(document).mousemove(move).mouseup(up);
});

$("#table-subjects").mousedown(function (e) {
  var length = document.getElementById("table-subjects").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    // the below functions updates the row index accordingly and update the order of subject IDs in json
    updateIndexForTable(document.getElementById("table-subjects"));
    updateOrderIDTable(document.getElementById("table-subjects"), subjectsTableData, "subjects");
  }
  $(document).mousemove(move).mouseup(up);
});

$("#table-samples").mousedown(function (e) {
  var length = document.getElementById("table-samples").rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    // the below functions updates the row index accordingly and update the order of sample IDs in json
    updateIndexForTable(document.getElementById("table-samples"));
    updateOrderIDTable(document.getElementById("table-samples"), samplesTableData, "samples");
  }
  $(document).mousemove(move).mouseup(up);
});

$("#contributor-table-dd").mousedown(function (e) {
  var length = document.getElementById("contributor-table-dd").rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("contributor-table-dd"));
    updateOrderContributorTable(document.getElementById("contributor-table-dd"), contributorArray);
  }
  $(document).mousemove(move).mouseup(up);
});

$("#protocol-link-table-dd").mousedown(function (e) {
  var length = document.getElementById("protocol-link-table-dd").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("protocol-link-table-dd"));
  }
  $(document).mousemove(move).mouseup(up);
});

$("#additional-link-table-dd").mousedown(function (e) {
  var length = document.getElementById("additional-link-table-dd").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("additional-link-table-dd"));
  }
  $(document).mousemove(move).mouseup(up);
});

const emptyDSInfoEntries = () => {
  var fieldSatisfied = true;
  var inforObj = grabDSInfoEntries();
  var emptyFieldArray = [];
  /// check for number of keywords
  for (var element in inforObj) {
    if (element === "keywords") {
      if (inforObj[element].length < 3) {
        emptyFieldArray.push("at least 3 keywords");
        fieldSatisfied = false;
      }
    } else {
      if (inforObj[element]) {
        if (inforObj[element].length === 0 || inforObj[element] === "Select dataset") {
          fieldSatisfied = false;
          emptyFieldArray.push(element);
        }
      }
    }
  }
  return [fieldSatisfied, emptyFieldArray];
};

function emptyLinkInfo() {
  var tableCurrentLinks = document.getElementById("protocol-link-table-dd");
  var fieldSatisfied = false;
  if (tableCurrentLinks.rows.length > 1) {
    fieldSatisfied = true;
  }
  return fieldSatisfied;
}

const emptyInfoEntries = (element) => {
  var fieldSatisfied = true;
  if (element === "") {
    fieldSatisfied = false;
  }
  return fieldSatisfied;
};

/// detect empty required fields and raise a warning
function detectEmptyRequiredFields(funding) {
  /// dataset info
  var dsContent = emptyDSInfoEntries();
  var dsSatisfied = dsContent[0];
  var dsEmptyField = dsContent[1];

  /// protocol info check
  var protocolSatisfied = emptyLinkInfo();

  /// contributor info
  var conEmptyField = [];
  var conSatisfied = true;
  var fundingSatisfied = emptyInfoEntries(funding);
  var contactPersonExists = checkAtLeastOneContactPerson();
  var contributorNumber = document.getElementById("contributor-table-dd").rows.length;
  if (!fundingSatisfied) {
    conEmptyField.push("SPARC Award");
  }
  if (!contactPersonExists) {
    conEmptyField.push("One Corresponding Author");
  }
  if (contributorNumber <= 1) {
    conEmptyField.push("At least one contributor");
  }
  if (conEmptyField.length !== 0) {
    conSatisfied = false;
  }

  /// detect empty required fields and raise a warning
  var emptyArray = [dsSatisfied, conSatisfied, protocolSatisfied];
  var emptyMessageArray = [
    "- Missing required fields under Dataset Info section: " + dsEmptyField.join(", "),
    "- Missing required fields under Contributor Info section: " + conEmptyField.join(", "),
    "- Missing required item under Article(s) and Protocol(s) Info section: At least one protocol url",
  ];
  var allFieldsSatisfied = true;
  errorMessage = [];
  for (var i = 0; i < emptyArray.length; i++) {
    if (!emptyArray[i]) {
      errorMessage.push(emptyMessageArray[i]);
      allFieldsSatisfied = false;
    }
  }
  return [allFieldsSatisfied, errorMessage];
}

//////////////////////////End of Ds description section ///////////////////////////////////
//////////////// //////////////// //////////////// //////////////// ////////////////////////

var displaySize = 1000;

//////////////////////////////////
// Manage Dataset
//////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////// This is the part where similar functions are being modified for the new ///////////////
//////////////////////////////////// Prepare dataset UI ////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

/// Add all BF accounts to the dropdown list, and then choose by default one option ('global' account)
const curateDatasetDropdown = document.getElementById("curatebfdatasetlist");

async function updateDatasetCurate(datasetDropdown, bfaccountDropdown) {
  let defaultBfAccount = bfaccountDropdown.options[bfaccountDropdown.selectedIndex].text;
  try {
    let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
      params: {
        selected_account: defaultBfAccount,
      },
    });
    datasetList = [];
    datasetList = responseObject.data.datasets;
    populateDatasetDropdownCurate(datasetDropdown, datasetList);
    refreshDatasetList();
  } catch (error) {
    clientError(error);
    curateBFAccountLoadStatus.innerHTML =
      "<span style='color: red'>" + userErrorMessage(error) + "</span>";
  }
}

//// De-populate dataset dropdowns to clear options for CURATE
function populateDatasetDropdownCurate(datasetDropdown, datasetlist) {
  removeOptions(datasetDropdown);

  /// making the first option: "Select" disabled
  addOption(datasetDropdown, "Select dataset", "Select dataset");
  var options = datasetDropdown.getElementsByTagName("option");
  options[0].disabled = true;

  for (var myitem of datasetlist) {
    var myitemselect = myitem.name;
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    datasetDropdown.appendChild(option);
  }
}
///////////////////////////////END OF NEW CURATE UI CODE ADAPTATION ///////////////////////////////////////////////////

const metadataDatasetlistChange = () => {
  $("#bf-dataset-subtitle").val("");
  $("#para-dataset-banner-image-status").html("");
  showCurrentSubtitle();
  showCurrentDescription();
  showCurrentLicense();
  showCurrentBannerImage();
  // TODO-NEW: Check flow
  showCurrentTags();
};

// Manage dataset permission
const permissionDatasetlistChange = () => {
  showCurrentPermission();
};

function datasetStatusListChange() {
  $(bfCurrentDatasetStatusProgress).css("visibility", "visible");
  $("#bf-dataset-status-spinner").css("display", "block");
  showCurrentDatasetStatus();
}

function postCurationListChange() {
  // display the pre-publishing page
  showPrePublishingPageElements();
  showPublishingStatus();
}

// upload banner image //
var cropOptions = {
  aspectRatio: 1,
  movable: false,
  // Enable to rotate the image
  rotatable: false,
  // Enable to scale the image
  scalable: false,
  // Enable to zoom the image
  zoomable: false,
  // Enable to zoom the image by dragging touch
  zoomOnTouch: false,
  // Enable to zoom the image by wheeling mouse
  zoomOnWheel: false,
  // preview: '.preview',
  viewMode: 1,
  responsive: true,
  crop: function (event) {
    var data = event.detail;
    let image_height = Math.round(data.height);

    formBannerHeight.value = image_height;
    //if image-height exceeds 2048 then prompt about scaling image down
    if (image_height < 512) {
      $("#save-banner-image").prop("disabled", true);
      $("#form-banner-height").css("color", "red");
      $("#form-banner-height").css("border", "1px solid red");
      $(".crop-image-text").css("color", "red");
    } else {
      $("#save-banner-image").prop("disabled", false);
      $("#form-banner-height").css("color", "black");
      $("#form-banner-height").css("border", "1px solid black");
      $(".crop-image-text").css("color", "black");
    }

    // formBannerWidth.value = Math.round(data.width)
  },
};
const guidedCropOptions = {
  aspectRatio: 1,
  movable: false,
  // Enable to rotate the image
  rotatable: false,
  // Enable to scale the image
  scalable: false,
  // Enable to zoom the image
  zoomable: false,
  // Enable to zoom the image by dragging touch
  zoomOnTouch: false,
  // Enable to zoom the image by wheeling mouse
  zoomOnWheel: false,
  // preview: '.preview',
  viewMode: 1,
  responsive: true,
  crop: function (event) {
    var data = event.detail;
    let image_height = Math.round(data.height);

    guidedFormBannerHeight.value = image_height;

    if (image_height < 512) {
      $("#guided-save-banner-image").prop("disabled", true);
      $("#guided-form-banner-height").css("color", "red");
      $("#guided-form-banner-height").css("border", "1px solid red");
      $(".crop-image-text").css("color", "red");
    } else {
      $("#guided-save-banner-image").prop("disabled", false);
      $("#guided-form-banner-height").css("color", "black");
      $("#guided-form-banner-height").css("border", "1px solid black");
      $(".crop-image-text").css("color", "black");
    }
  },
};

var imageExtension;
var myCropper = new Cropper(bfViewImportedImage, cropOptions);

const setupPublicationOptionsPopover = () => {
  // setup the calendar that is in the popup
  const container = document.getElementById("tui-date-picker-container");
  const target = document.getElementById("tui-date-picker-target");

  // calculate one year from now
  var oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  // initialize the calendar
  const instance = new DatePicker(container, {
    input: {
      element: target,
    },
    date: new Date(),
    // a user can lift an embargo today or a year from now
    selectableRanges: [[new Date(), oneYearFromNow]],
  });

  // display/hide calendar on toggle
  $("input[name='publishing-options']").on("change", (e) => {
    let tuiCalendarWrapper = document.getElementById("calendar-wrapper");
    if (e.target.value === "embargo-date-check") {
      tuiCalendarWrapper.style.visibility = "visible";
    } else {
      tuiCalendarWrapper.style.visibility = "hidden";
    }
  });

  // add a scroll effect
  const input = document.getElementById("tui-date-picker-target");
  let calendar = document.querySelector(".tui-calendar-body-inner");

  input.addEventListener("click", () => {
    setTimeout(() => {
      calendar.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
  });
};

async function submitReviewDatasetCheck(res) {
  var reviewstatus = res[0];
  var publishingStatus = res[1];
  if (publishingStatus === "PUBLISH_IN_PROGRESS") {
    Swal.fire({
      icon: "error",
      title: "Your dataset is currently being published. Please wait until it is completed.",
      text: "Your dataset is already under review. Please wait until the Publishers within your organization make a decision.",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else if (reviewstatus === "requested") {
    Swal.fire({
      icon: "error",
      title: "Cannot submit the dataset for review at this time!",
      text: "Your dataset is already under review. Please wait until the Publishers within your organization make a decision.",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else if (publishingStatus === "PUBLISH_SUCCEEDED") {
    // embargo release date represents the time a dataset that has been reviewed for publication becomes public
    // user sets this value in the UI otherwise it stays an empty string
    let embargoReleaseDate = "";

    // confirm with the user that they will submit a dataset and check if they want to set an embargo date
    let userResponse = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      icon: "warning",
      confirmButtonText: "Submit",
      denyButtonText: "Cancel",
      showDenyButton: true,
      title: `Submit your dataset for pre-publishing review`,
      reverseButtons: reverseSwalButtons,
      text: "",
      html: `
                <div style="display: flex; flex-direction: column;  font-size: 15px;">
                <p style="text-align:left">This dataset has already been published. This action will submit the dataset again for review to the SPARC Curation Team. While under review, the dataset will become locked until it has either been approved or rejected for publication. If accepted a new version of your dataset will be published.</p>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" name="publishing-options" value="immediate" style=" border: 0px; width: 18px; height: 18px;" checked>
                  <div style="margin-left: 5px;"><label for="immediate"> Make this dataset available to the public immediately after publishing</label></div>
                </div>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" id="embargo-date-check" name="publishing-options" value="embargo-date-check" style=" border: 0px; width: 22px; height: 22px;">
                  <div style="margin-left: 5px;"><label for="embargo-date-check" style="text-align:left">Place this dataset under embargo so that it is not made public immediately after publishing</label></div>
                </div>
                <div style="visibility:hidden; flex-direction: column;  margin-top: 10px;" id="calendar-wrapper">
                <label style="margin-bottom: 5px; font-size: 13px;">When would you like this dataset to become publicly available?<label>
                <div class="tui-datepicker-input tui-datetime-input tui-has-focus" style="margin-top: 5px;">

                    <input
                      type="text"
                      id="tui-date-picker-target"
                      aria-label="Date-Time"
                      />

                      <span class="tui-ico-date"></span>
                    </div>
                    <div
                    id="tui-date-picker-container"
                    style="margin-top: -1px; margin-left: 60px;"
                    ></div>
                </div>
              </div>
            `,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      willOpen: () => {
        setupPublicationOptionsPopover();
      },
      willClose: () => {
        // check if the embargo radio button is selected
        const checkedRadioButton = $("input:radio[name ='publishing-options']:checked").val();

        if (checkedRadioButton === "embargo-date-check") {
          // set the embargoDate variable if so
          embargoReleaseDate = $("#tui-date-picker-target").val();
        }
      },
    });

    // check if the user cancelled
    if (!userResponse.isConfirmed) {
      // do not submit the dataset
      return;
    }

    // swal loading message for the submission
    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    Swal.fire({
      title: `Submitting dataset for pre-publishing review`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    // submit the dataset for review with the given embargoReleaseDate
    await submitReviewDataset(embargoReleaseDate);
  } else {
    // status is NOT_PUBLISHED

    // embargo release date represents the time a dataset that has been reviewed for publication becomes public
    // user sets this value in the UI otherwise it stays an empty string
    let embargoReleaseDate = "";

    // confirm with the user that they will submit a dataset and check if they want to set an embargo date
    let userResponse = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Submit",
      denyButtonText: "Cancel",
      showDenyButton: true,
      title: `Submit your dataset for pre-publishing review`,
      reverseButtons: reverseSwalButtons,
      html: `
              <div style="display: flex; flex-direction: column;  font-size: 15px;">
                <p style="text-align:left">Your dataset will be submitted for review to the SPARC Curation Team. While under review, the dataset will become locked until it has either been approved or rejected for publication. </p>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" name="publishing-options" value="immediate" style=" border: 0px; width: 18px; height: 18px;" checked>
                  <div style="margin-left: 5px;"><label for="immediate"> Make this dataset available to the public immediately after publishing</label></div>
                </div>
                <div style="text-align: left; margin-bottom: 5px; display: flex; ">
                  <input type="radio" id="embargo-date-check" name="publishing-options" value="embargo-date-check" style=" border: 0px; width: 22px; height: 22px;">
                  <div style="margin-left: 5px;"><label for="embargo-date-check" style="text-align:left">Place this dataset under embargo so that it is not made public immediately after publishing</label></div>
                </div>
                <div style="visibility:hidden; flex-direction: column;  margin-top: 10px;" id="calendar-wrapper">
                <label style="margin-bottom: 5px; font-size: 13px;">When would you like this dataset to become publicly available?<label>
                <div class="tui-datepicker-input tui-datetime-input tui-has-focus" style="margin-top: 5px;">

                    <input
                      type="text"
                      id="tui-date-picker-target"
                      aria-label="Date-Time"
                      />

                      <span class="tui-ico-date"></span>
                    </div>
                    <div
                    id="tui-date-picker-container"
                    style="margin-top: -1px; margin-left: 60px;"
                    ></div>
                </div>
              </div>
            `,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      willOpen: () => {
        setupPublicationOptionsPopover();
      },
      willClose: () => {
        // check if the embargo radio button is selected
        const checkedRadioButton = $("input:radio[name ='publishing-options']:checked").val();

        if (checkedRadioButton === "embargo-date-check") {
          // set the embargoDate variable if so
          embargoReleaseDate = $("#tui-date-picker-target").val();
        }
      },
    });

    // check if the user cancelled
    if (!userResponse.isConfirmed) {
      // do not submit the dataset
      return;
    }

    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    Swal.fire({
      title: `Submitting dataset for pre-publishing review`,
      html: "Please wait...",
      // timer: 5000,
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // submit the dataset for review with the given embargoReleaseDate
    await submitReviewDataset(embargoReleaseDate);
  }
}

// //Withdraw dataset from review
function withdrawDatasetSubmission() {
  // show a SWAL loading message until the submit for prepublishing flow is successful or fails
  Swal.fire({
    title: `Preparing to withdraw the dataset submission`,
    html: "Please wait...",
    // timer: 5000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // get the publishing status of the currently selected dataset
  // then check if it can be withdrawn, then withdraw it
  // catch any uncaught errors at this level (aka greacefully catch any exceptions to alert the user we cannot withdraw their dataset)
  showPublishingStatus(withdrawDatasetCheck).catch((error) => {

    console.error(error);
    var emessage = userError(error);
    Swal.fire({
      title: "Could not withdraw dataset from publication!",
      text: `${emessage}`,
      heightAuto: false,
      icon: "error",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });

    // track the error for analysis
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );
  });
}

async function withdrawDatasetCheck(res) {
  var reviewstatus = res["publishing_status"];
  if (reviewstatus !== "requested") {
    Swal.fire({
      icon: "error",
      title: "Your dataset is not currently under review!",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  } else {
    let result = await Swal.fire({
      icon: "warning",
      text: "Your dataset will be removed from review. You will have to submit it again before publishing it. Would you like to continue?",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    if (result.isConfirmed) {
      // show a SWAL loading message until the submit for prepublishing flow is successful or fails
      Swal.fire({
        title: `Withdrawing dataset submission`,
        html: "Please wait...",
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      await withdrawReviewDataset();
    }
  }
}

async function withdrawReviewDataset() {
  bfWithdrawReviewDatasetBtn.disabled = true;
  var selectedBfAccount = $("#current-bf-account").text();
  var selectedBfDataset = $(".bf-dataset-span")
    .html()
    .replace(/^\s+|\s+$/g, "");

  try {
    await api.withdrawDatasetReviewSubmission(selectedBfDataset, selectedBfAccount);

    logGeneralOperationsForAnalytics(
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );

    // show the user their dataset's updated publishing status
    await showPublishingStatus("noClear");

    await Swal.fire({
      title: "Dataset has been withdrawn from review!",
      heightAuto: false,
      icon: "success",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });

    // reveal the current section (question-3) again using the new publishing status value
    await transitionFreeFormMode(
      document.querySelector("#begin-prepublishing-btn"),
      "submit_prepublishing_review-question-2",
      "submit_prepublishing_review-tab",
      "",
      "individual-question post-curation"
    );

    // scroll to the submit button
    // scrollToElement(".pre-publishing-continue");

    bfRefreshPublishingDatasetStatusBtn.disabled = false;
    bfWithdrawReviewDatasetBtn.disabled = false;
  } catch (error) {
    clientError(error);
    var emessage = userErrorMessage(error);
    Swal.fire({
      title: "Could not withdraw dataset from publication!",
      text: `${emessage}`,
      heightAuto: false,
      icon: "error",
      confirmButtonText: "Ok",
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Ok",
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });

    // track the error for analysis
    logGeneralOperationsForAnalytics(
      "Error",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Withdraw dataset"]
    );
  }
}

//////////////////////////////////
// Helper functions
//////////////////////////////////

// General //

function removeOptions(selectbox) {
  var i;
  for (i = selectbox.options.length - 1; i >= 0; i--) {
    selectbox.remove(i);
  }
}

function userError(error) {
  var myerror = error.message;
  return myerror;
}

// Manage Datasets //

function refreshBfUsersList() {
  var accountSelected = defaultBfAccount;

  removeOptions(bfListUsers);
  var optionUser = document.createElement("option");
  optionUser.textContent = "Select user";
  bfListUsers.appendChild(optionUser);

  removeOptions(bfListUsersPI);
  var optionUserPI = document.createElement("option");
  optionUserPI.textContent = "Select PI";
  bfListUsersPI.appendChild(optionUserPI);

  if (accountSelected !== "Select") {
    client
      .get(`manage_datasets/bf_get_users?selected_account=${accountSelected}`)
      .then((res) => {
        let users = res.data["users"];
        // The removeoptions() wasn't working in some instances (creating a double dataset list) so second removal for everything but the first element.
        $("#bf_list_users").selectpicker("refresh");
        $("#bf_list_users").find("option:not(:first)").remove();
        $("#guided_bf_list_users_and_teams").selectpicker("refresh");

        //delete all elements with data-permission-type of "team"
        const userDropdownElements = document.querySelectorAll(
          "#guided_bf_list_users_and_teams option[permission-type='user']"
        );
        userDropdownElements.forEach((element) => {
          element.remove();
        });

        $("#button-add-permission-user").hide();
        $("#bf_list_users_pi").selectpicker("refresh");
        $("#bf_list_users_pi").find("option:not(:first)").remove();
        for (var myItem in users) {
          // returns like [..,''fname lname email !!**!! pennsieve_id',',..]
          let sep_pos = users[myItem].lastIndexOf("!|**|!");
          var myUser = users[myItem].substring(0, sep_pos);
          var optionUser = document.createElement("option");
          optionUser.textContent = myUser;
          optionUser.value = users[myItem].substring(sep_pos + 6);
          bfListUsers.appendChild(optionUser);
          var optionUser2 = optionUser.cloneNode(true);
          bfListUsersPI.appendChild(optionUser2);
          var guidedOptionUser = optionUser.cloneNode(true);
          guidedOptionUser.setAttribute("permission-type", "user");
          guidedBfListUsersAndTeams.appendChild(guidedOptionUser);
        }
      })
      .catch((error) => {
        clientError(error);
      });
  }
}

function refreshBfTeamsList(teamList) {
  removeOptions(teamList);

  var accountSelected = defaultBfAccount;
  var optionTeam = document.createElement("option");

  optionTeam.textContent = "Select team";
  teamList.appendChild(optionTeam);

  if (accountSelected !== "Select") {
    client
      .get(`/manage_datasets/bf_get_teams?selected_account=${accountSelected}`)
      .then((res) => {
        let teams = res.data["teams"];
        // The removeoptions() wasn't working in some instances (creating a double list) so second removal for everything but the first element.
        $("#bf_list_teams").selectpicker("refresh");
        $("#bf_list_teams").find("option:not(:first)").remove();
        $("#guided_bf_list_users_and_teams").selectpicker("refresh");
        $("#button-add-permission-team").hide();
        for (var myItem in teams) {
          var myTeam = teams[myItem];
          var optionTeam = document.createElement("option");
          optionTeam.textContent = myTeam;
          optionTeam.value = myTeam;
          teamList.appendChild(optionTeam);
          var guidedOptionTeam = optionTeam.cloneNode(true);
          guidedOptionTeam.setAttribute("permission-type", "team");
          guidedBfListUsersAndTeams.appendChild(guidedOptionTeam);
        }
        confirm_click_account_function();
      })
      .catch((error) => {

        console.error(error);
        confirm_click_account_function();
      });
  }
}

const selectOptionColor = (mylist) => {
  mylist.style.color = mylist.options[mylist.selectedIndex].style.color;
};

////////////////////////////////DATASET FILTERING FEATURE/////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

// this function now is only used to load all datasets ("All" permission)
// onto the dataset_description file ds-name select
const refreshDatasetList = () => {
  var datasetPermission = "All";

  var filteredDatasets = [];
  if (datasetPermission.toLowerCase() === "all") {
    for (var i = 0; i < datasetList.length; i++) {
      filteredDatasets.push(datasetList[i].name);
    }
  }
  filteredDatasets.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  populateDatasetDropdowns(filteredDatasets);
  // parentDSTagify.settings.whitelist = getParentDatasets();
  return filteredDatasets.length;
};

/// populate the dropdowns with refreshed dataset list
const populateDatasetDropdowns = (mylist) => {
  clearDatasetDropdowns();
  for (myitem in mylist) {
    var myitemselect = mylist[myitem];
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    var option1 = option.cloneNode(true);
    var option2 = option.cloneNode(true);

    curateDatasetDropdown.appendChild(option2);
  }
  metadataDatasetlistChange();
  permissionDatasetlistChange();
  postCurationListChange();
  datasetStatusListChange();
};
////////////////////////////////////END OF DATASET FILTERING FEATURE//////////////////////////////

async function updateBfAccountList() {
  let responseObject;
  try {
    responseObject = await client.get("manage_datasets/bf_account_list");
  } catch (error) {
    clientError(error);
    confirm_click_account_function();
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);
    return;
  }

  let accountList = responseObject.data["accounts"];
  for (myitem in accountList) {
    var myitemselect = accountList[myitem];
    var option = document.createElement("option");
    option.textContent = myitemselect;
    option.value = myitemselect;
    var option2 = option.cloneNode(true);
  }
  await loadDefaultAccount();
  if (accountList[0] === "Select" && accountList.length === 1) {
    // todo: no existing accounts to load
  }
  refreshBfUsersList();
  refreshBfTeamsList(bfListTeams);
}

async function loadDefaultAccount() {
  let responseObject;

  try {
    responseObject = await client.get("/manage_datasets/bf_default_account_load");
  } catch (e) {
    clientError(e);
    confirm_click_account_function();
    return;
  }

  let accounts = responseObject.data["defaultAccounts"];

  if (accounts.length > 0) {
    var myitemselect = accounts[0];
    const guidedPennsieveAccount = document.getElementById("getting-started-pennsieve-account");
    svgElements = guidedPennsieveAccount.children;
    svgElements[0].style.display = "none";
    svgElements[1].style.display = "flex";
    defaultBfAccount = myitemselect;

    $("#current-bf-account").text(myitemselect);
    $("#current-bf-account-generate").text(myitemselect);
    $("#create_empty_dataset_BF_account_span").text(myitemselect);
    $(".bf-account-span").text(myitemselect);
    showHideDropdownButtons("account", "show");
    refreshBfUsersList();
    refreshBfTeamsList(bfListTeams);
  }
}

const showPrePublishingPageElements = () => {
  var selectedBfAccount = defaultBfAccount;
  var selectedBfDataset = defaultBfDataset;

  if (selectedBfDataset === "Select dataset") {
    return;
  }

  // show the "Begin Publishing" button and hide the checklist and submission section
  $("#begin-prepublishing-btn").show();
  $("#prepublishing-checklist-container").hide();
  $("#prepublishing-submit-btn-container").hide();
  $("#excluded-files-container").hide();
  $(".pre-publishing-continue-container").hide();
};

async function showPublishingStatus(callback) {
  return new Promise(async function (resolve, reject) {
    if (callback == "noClear") {
      var nothing;
    }
    var selectedBfAccount = $("#current-bf-account").text();
    var selectedBfDataset = $(".bf-dataset-span")
      .html()
      .replace(/^\s+|\s+$/g, "");

    if (selectedBfDataset === "None") {
      resolve();
    } else {
      try {
        let get_publishing_status = await client.get(
          `/disseminate_datasets/datasets/${selectedBfDataset}/publishing_status?selected_account=${selectedBfAccount}`
        );
        let res = get_publishing_status.data;

        try {
          //update the dataset's publication status and display
          //onscreen for the user under their dataset name
          $("#para-review-dataset-info-disseminate").text(publishStatusOutputConversion(res));

          if (callback === submitReviewDatasetCheck || callback === withdrawDatasetCheck) {
            return resolve(callback(res));
          }

          resolve();
        } catch (error) {
          // an exception will be caught and rejected
          // if the executor function is not ready before an exception is found it is uncaught without the try catch
          reject(error);
        }
      } catch (error) {
        clientError(error);

        Swal.fire({
          title: "Could not get your publishing status!",
          text: userErrorMessage(error),
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          confirmButtonText: "Ok",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
        });

        logGeneralOperationsForAnalytics(
          "Error",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
          AnalyticsGranularity.ALL_LEVELS,
          ["Show publishing status"]
        );

        resolve();
      }
    }
  });
}

function publishStatusOutputConversion(res) {
  var reviewStatus = res["publishing_status"];
  var publishStatus = res["review_request_status"];

  var outputMessage = "";
  if (reviewStatus === "draft" || reviewStatus === "cancelled") {
    outputMessage += "Dataset is not under review currently";
  } else if (reviewStatus === "requested") {
    outputMessage += "Dataset is currently under review by your Publishing Team";
  } else if (reviewStatus === "rejected") {
    outputMessage += "Dataset has been rejected by your Publishing Team and may require revision";
  } else if (reviewStatus === "accepted") {
    outputMessage += "Dataset has been accepted for publication by your Publishing Team";
  }

  return outputMessage;
}

const allowedMedataFiles = [
  "submission.xlsx",
  "submission.csv",
  "submission.json",
  "dataset_description.xlsx",
  "dataset_description.csv",
  "dataset_description.json",
  "subjects.xlsx",
  "subjects.csv",
  "subjects.json",
  "samples.xlsx",
  "samples.csv",
  "samples.json",
  "README.txt",
  "CHANGES.txt",
];

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
////////////////// ORGANIZE DATASETS NEW FEATURE /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var backFolder = [];
var forwardFolder = [];

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"];
var highLevelFolderToolTip = {
  code: "<b>code</b>: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  derivative:
    "<b>derivative</b>: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  docs: "<b>docs</b>: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  source:
    "<b>source</b>: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  primary:
    "<b>primary</b>: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  protocol:
    "<b>protocol</b>: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a target='_blank' href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>.",
};

/// back button Curate
organizeDSbackButton.addEventListener("click", function () {
  var slashCount = globals.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = getGlobalPath(globals.organizeDSglobalPath);
    if (filtered.length === 1) {
      globals.organizeDSglobalPath.value = filtered[0] + "/";
    } else {
      globals.organizeDSglobalPath.value = filtered.slice(0, filtered.length - 1).join("/") + "/";
    }
    var myPath = datasetStructureJSONObj;
    for (var item of filtered.slice(1, filtered.length - 1)) {
      myPath = myPath["folders"][item];
    }
    // construct UI with files and folders
    $("#items").empty();
    already_created_elem = [];
    let items = loadFileFolder(myPath); //array -
    let total_item_count = items[1].length + items[0].length;
    //we have some items to display
    listItems(myPath, "#items", 500, (reset = true));
    organizeLandingUIEffect();
    // reconstruct div with new elements
    getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
  }
});

// Add folder button
organizeDSaddNewFolder.addEventListener("click", function (event) {
  event.preventDefault();
  var slashCount = globals.organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var newFolderName = "New Folder";
    Swal.fire({
      title: "Add new folder...",
      text: "Enter a name below:",
      heightAuto: false,
      input: "text",
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: "Cancel",
      confirmButtonText: "Add folder",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        $(".swal2-input").attr("id", "add-new-folder-input");
        $(".swal2-confirm").attr("id", "add-new-folder-button");
        $("#add-new-folder-input").keyup(function () {
          var val = $("#add-new-folder-input").val();
          for (var char of nonAllowedCharacters) {
            if (val.includes(char)) {
              Swal.showValidationMessage(
                `The folder name cannot contains the following characters ${nonAllowedCharacters}, please enter a different name!`
              );
              $("#add-new-folder-button").attr("disabled", true);
              return;
            }
            $("#add-new-folder-button").attr("disabled", false);
          }
        });
      },
      didDestroy: () => {
        $(".swal2-confirm").attr("id", "");
        $(".swal2-input").attr("id", "");
      },
    }).then((result) => {
      if (result.value) {
        if (result.value !== null && result.value !== "") {
          newFolderName = result.value.trim();
          // check for duplicate or files with the same name
          var duplicate = false;
          var itemDivElements = document.getElementById("items").children;
          for (var i = 0; i < itemDivElements.length; i++) {
            if (newFolderName === itemDivElements[i].innerText) {
              duplicate = true;
              break;
            }
          }
          if (duplicate) {
            Swal.fire({
              icon: "error",
              text: "Duplicate folder name: " + newFolderName,
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });

            logCurationForAnalytics(
              "Error",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );
          } else {
            // var appendString = "";
            // appendString =
            //   appendString +
            //   '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">' +
            //   newFolderName +
            //   "</div></div>";
            // $(appendString).appendTo("#items");

            /// update datasetStructureJSONObj
            var currentPath = globals.organizeDSglobalPath.value;
            var jsonPathArray = currentPath.split("/");
            var filtered = jsonPathArray.slice(1).filter(function (el) {
              return el != "";
            });

            var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
            // update Json object with new folder created
            var renamedNewFolder = newFolderName;
            myPath["folders"][renamedNewFolder] = {
              folders: {},
              files: {},
              type: "virtual",
              action: ["new"],
            };

            listItems(myPath, "#items", 500, (reset = true));
            getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);

            // log that the folder was successfully added
            logCurationForAnalytics(
              "Success",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
              ["Step 3", "Add", "Folder"],
              determineDatasetLocation()
            );

            hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
            hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
          }
        }
      }
    });
  } else {
    Swal.fire({
      icon: "error",
      text: "New folders cannot be added at this level. If you want to add high-level SPARC folder(s), please go back to the previous step to do so.",
      confirmButtonText: "OK",
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });
  }
});

// ///////////////////////////////////////////////////////////////////////////
// recursively populate json object
function populateJSONObjFolder(action, jsonObject, folderPath) {
  var myitems = fs.readdirSync(folderPath);
  myitems.forEach((element) => {
    //prevented here
    var statsObj = fs.statSync(path.join(folderPath, element));
    var addedElement = path.join(folderPath, element);
    if (statsObj.isDirectory() && !/(^|\/)\[^\/\.]/g.test(element)) {
      if (irregularFolderArray.includes(addedElement)) {
        var renamedFolderName = "";
        if (action !== "ignore" && action !== "") {
          if (action === "remove") {
            renamedFolderName = removeIrregularFolders(element);
          } else if (action === "replace") {
            renamedFolderName = replaceIrregularFolders(element);
          }
          jsonObject["folders"][renamedFolderName] = {
            type: "local",
            folders: {},
            files: {},
            path: addedElement,
            action: ["new", "renamed"],
          };
          element = renamedFolderName;
        }
      } else {
        jsonObject["folders"][element] = {
          type: "local",
          folders: {},
          files: {},
          path: addedElement,
          action: ["new"],
        };
      }
      populateJSONObjFolder(action, jsonObject["folders"][element], addedElement);
    } else if (statsObj.isFile() && !/(^|\/)\.[^\/\.]/g.test(element)) {
      jsonObject["files"][element] = {
        path: addedElement,
        description: "",
        "additional-metadata": "",
        type: "local",
        action: ["new"],
      };
    }
  });
}

let full_name_show = false;

function hideFullName() {
  full_name_show = false;
  fullNameValue.style.display = "none";
  fullNameValue.style.top = "-250%";
  fullNameValue.style.left = "-250%";
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  full_name_show = true;
  var isOverflowing =
    element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    var mouseX = ev.pageX - 200;
    var mouseY = ev.pageY;
    fullNameValue.innerHTML = text;
    $(".hoverFullName").css({ top: mouseY, left: mouseX });
    setTimeout(() => {
      if (full_name_show) {
        // fullNameValue.style.display = "block";
        $(".hoverFullName").fadeIn("slow");
      }
    }, 800);
  }
}

/// hover over a function for full name
function hoverForFullName(ev) {
  var fullPath = ev.innerText;
  // ev.children[1] is the child element folder_desc of div.single-item,
  // which we will put through the overflowing check in showFullName function
  showFullName(event, ev.children[1], fullPath);
}

// // If the document is clicked somewhere
// document.addEventListener('onmouseover', function(e){
//   if (e.target.classList.value !== "myFile") {
//     hideFullPath()
//   } else {
//     hoverForPath(e)
//   }
// });

document.addEventListener("onmouseover", function (e) {
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e);
  } else {
    hideFullName();
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
function showDetailsFile() {
  $(".div-display-details.file").toggleClass("show");
  // $(".div-display-details.folders").hide()
}

const pasteFromClipboard = (event, target_element) => {
  event.preventDefault();
  let key = Clipboard.readText();

  if (target_element == "bootbox-api-key" || target_element == "bootbox-api-secret") {
    $(`#${target_element}`).val(key);
  }
};

var bfAddAccountBootboxMessage = `<form>
    <div class="form-group row" style="justify-content: center; margin-top: .5rem; margin-bottom: 2rem;">
      <div style="display: flex; width: 100%">
        <input placeholder="Enter key name" type="text" style="width: 100%; margin: 0;" id="bootbox-key-name" class="swal2-input" />
      </div>
    </div>
    <div style="justify-content: center;">
      <div style="display:flex; align-items: flex-end; width: 100%;">
        <input placeholder="Enter API key" id="bootbox-api-key" type="text" class="swal2-input" style="width: 100%; margin: 0;" />
      </div>
    </div>
    <div style="justify-content: center; margin-bottom: .5rem; margin-top: 2rem;">
      <div style="display:flex; align-items: flex-end; width: 100%">
        <input placeholder="Enter API secret" id="bootbox-api-secret" class="swal2-input" type="text" style="margin: 0; width: 100%" />
      </div>
    </div>
  </form>`;

var bfaddaccountTitle = `<h3 style="text-align:center">Connect your Pennsieve account using an API key</h3>`;

// this function is called in the beginning to load bf accounts to a list
// which will be fed as dropdown options
async function retrieveBFAccounts() {
  bfAccountOptions = [];
  bfAccountOptionsStatus = "";

  if (hasConnectedAccountWithPennsieve()) {
    client
      .get("manage_datasets/bf_account_list")
      .then((res) => {
        let accounts = res.data;
        for (const myitem in accounts) {
          bfAccountOptions[accounts[myitem]] = accounts[myitem];
        }

        showDefaultBFAccount();
      })
      .catch((error) => {
        // clientError(error)
        bfAccountOptionsStatus = error;
      });
  } else {
    bfAccountOptionsStatus = "No account connected";
  }
  return [bfAccountOptions, bfAccountOptionsStatus];
}

let defaultAccountDetails = "";
async function showDefaultBFAccount() {
  try {
    let bf_default_acc_req = await client.get("manage_datasets/bf_default_account_load");
    let accounts = bf_default_acc_req.data.defaultAccounts;
    if (accounts.length > 0) {
      var myitemselect = accounts[0];
      defaultBfAccount = myitemselect;
      try {
        let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
          params: {
            selected_account: defaultBfAccount,
          },
        });
        let accountDetails = bf_account_details_req.data.account_details;
        $("#para-account-detail-curate").html(accountDetails);
        $("#current-bf-account").text(defaultBfAccount);
        $("#current-bf-account-generate").text(defaultBfAccount);
        $("#create_empty_dataset_BF_account_span").text(defaultBfAccount);
        $(".bf-account-span").text(defaultBfAccount);
        $("#card-right bf-account-details-span").html(accountDetails);
        $("#para_create_empty_dataset_BF_account").html(accountDetails);
        $("#para-account-detail-curate-generate").html(accountDetails);
        $(".bf-account-details-span").html(accountDetails);
        defaultAccountDetails = accountDetails;

        $("#div-bf-account-load-progress").css("display", "none");
        showHideDropdownButtons("account", "show");
        // refreshDatasetList()
        updateDatasetList();
      } catch (error) {
        clientError(error);

        $("#para-account-detail-curate").html("None");
        $("#current-bf-account").text("None");
        $("#current-bf-account-generate").text("None");
        $("#create_empty_dataset_BF_account_span").text("None");
        $(".bf-account-span").text("None");
        $("#para-account-detail-curate-generate").html("None");
        $("#para_create_empty_dataset_BF_account").html("None");
        $(".bf-account-details-span").html("None");

        $("#div-bf-account-load-progress").css("display", "none");
        showHideDropdownButtons("account", "hide");
      }
    }
  } catch (error) {
    clientError(error);
  }
}

////// function to trigger action for each context menu option
function hideMenu(category, menu1, menu2, menu3) {
  if (category === "folder") {
    menu1.style.display = "none";
    menu1.style.top = "-200%";
    menu1.style.left = "-200%";
  } else if (category === "high-level-folder") {
    menu2.style.display = "none";
    menu2.style.top = "-220%";
    menu2.style.left = "-220%";
  } else {
    menu3.style.display = "none";
    menu3.style.top = "-210%";
    menu3.style.left = "-210%";
  }
}

function changeStepOrganize(step) {
  if (step.id === "button-organize-prev") {
    document.getElementById("div-step-1-organize").style.display = "block";
    document.getElementById("div-step-2-organize").style.display = "none";
    document.getElementById("dash-title").innerHTML =
      "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>High-level folders";
    organizeNextStepBtn.style.display = "block";
    organizePrevStepBtn.style.display = "none";
  } else {
    document.getElementById("div-step-1-organize").style.display = "none";
    document.getElementById("div-step-2-organize").style.display = "block";
    document.getElementById("dash-title").innerHTML =
      "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>Generate dataset";
    organizePrevStepBtn.style.display = "block";
    organizeNextStepBtn.style.display = "none";
  }
}

var newDSName;
function generateDataset(button) {
  document.getElementById("para-organize-datasets-success").style.display = "none";
  document.getElementById("para-organize-datasets-error").style.display = "none";
  if (button.id === "btn-generate-locally") {
    $("#btn-generate-BF").removeClass("active");
    $(button).toggleClass("active");
    Swal.fire({
      title: "Generate dataset locally",
      text: "Enter a name for the dataset:",
      input: "text",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm and Choose Location",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate_fastest",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        newDSName = result.value.trim();
        ipcRenderer.send("open-file-dialog-newdataset");
      }
    });
  } else {
    $("#btn-generate-locally").removeClass("active");
    $(button).toggleClass("active");
  }
}

//// Step 3. Organize dataset: Add files or folders with drag&drop
function allowDrop(ev) {
  ev.preventDefault();
}

var filesElement;
var targetElement;
async function drop(ev) {
  irregularFolderArray = [];
  let renamedFolderName = "";
  let replaced = [];
  var action = "";
  filesElement = ev.dataTransfer.files;
  targetElement = ev.target;
  // get global path
  var currentPath = globals.organizeDSglobalPath.value;
  var jsonPathArray = currentPath.split("/");
  var filtered = jsonPathArray.slice(1).filter(function (el) {
    return el != "";
  });

  var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
  irregularFolderArray = [];
  var action = "";
  filesElement = ev.dataTransfer.files;
  targetElement = ev.target;
  var importedFiles = {};
  var importedFolders = {};
  var nonAllowedDuplicateFiles = [];
  ev.preventDefault();
  var uiFiles = {};
  var uiFolders = {};

  $("body").addClass("waiting");

  for (var file in myPath["files"]) {
    uiFiles[path.parse(file).base] = 1;
  }
  for (var folder in myPath["folders"]) {
    uiFolders[path.parse(folder).name] = 1;
  }
  for (var i = 0; i < ev.dataTransfer.files.length; i++) {
    var ele = ev.dataTransfer.files[i].path;
    if (path.basename(ele).indexOf(".") === -1) {
      detectIrregularFolders(path.basename(ele), ele);
    }
  }
  var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contain any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
  if (irregularFolderArray.length > 0) {
    Swal.fire({
      title:
        "The following folders contain non-allowed characters in their names. How should we handle them?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        irregularFolderArray.join("</br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Replace characters with (-)",
      denyButtonText: "Remove characters",
      cancelButtonText: "Cancel",
      footer: footer,
      didOpen: () => {
        $(".swal-popover").popover();
      },
    }).then(async (result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        action = "replace";
        if (irregularFolderArray.length > 0) {
          for (let i = 0; i < irregularFolderArray.length; i++) {
            renamedFolderName = replaceIrregularFolders(irregularFolderArray[i]);
            replaced.push(renamedFolderName);
          }
        }
      } else if (result.isDenied) {
        action = "remove";
        if (irregularFolderArray.length > 0) {
          for (let i = 0; i < irregularFolderArray.length; i++) {
            renamedFolderName = removeIrregularFolders(irregularFolderArray[i]);
            replaced.push(renamedFolderName);
          }
        }
      } else {
        return;
      }
      let load_spinner_promise = new Promise(async (resolved) => {
        let background = document.createElement("div");
        let spinner_container = document.createElement("div");
        let spinner_icon = document.createElement("div");
        spinner_container.setAttribute("id", "items_loading_container");
        spinner_icon.setAttribute("id", "item_load");
        spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
        background.setAttribute("class", "loading-items-background");
        background.setAttribute("id", "loading-items-background-overlay");

        spinner_container.append(spinner_icon);
        document.body.prepend(background);
        document.body.prepend(spinner_container);
        let loading_items_spinner = document.getElementById("items_loading_container");
        loading_items_spinner.style.display = "block";
        if (loading_items_spinner.style.display === "block") {
          setTimeout(() => {
            resolved();
          }, 100);
        }
      }).then(async () => {
        await dropHelper(
          filesElement,
          targetElement,
          action,
          myPath,
          importedFiles,
          importedFolders,
          nonAllowedDuplicateFiles,
          uiFiles,
          uiFolders
        );
        // Swal.close();
        document.getElementById("loading-items-background-overlay").remove();
        document.getElementById("items_loading_container").remove();
        // background.remove();
      });
    });
  } else {
    let load_spinner_promise = new Promise(async (resolved) => {
      let background = document.createElement("div");
      let spinner_container = document.createElement("div");
      let spinner_icon = document.createElement("div");
      spinner_container.setAttribute("id", "items_loading_container");
      spinner_icon.setAttribute("id", "item_load");
      spinner_icon.setAttribute("class", "ui large active inline loader icon-wrapper");
      background.setAttribute("class", "loading-items-background");
      background.setAttribute("id", "loading-items-background-overlay");

      spinner_container.append(spinner_icon);
      document.body.prepend(background);
      document.body.prepend(spinner_container);
      let loading_items_spinner = document.getElementById("items_loading_container");
      loading_items_spinner.style.display = "block";
      if (loading_items_spinner.style.display === "block") {
        setTimeout(() => {
          resolved();
        }, 100);
      }
    }).then(async () => {
      await dropHelper(
        filesElement,
        targetElement,
        "",
        myPath,
        importedFiles,
        importedFolders,
        nonAllowedDuplicateFiles,
        uiFiles,
        uiFolders
      );
      // Swal.close();
      document.getElementById("loading-items-background-overlay").remove();
      document.getElementById("items_loading_container").remove();
      // background.remove();
    });
  }
}

const dropHelper = async (
  ev1,
  ev2,
  action,
  myPath,
  importedFiles,
  importedFolders,
  nonAllowedDuplicateFiles,
  uiFiles,
  uiFolders
) => {
  let importToast = new Notyf({
    position: { x: "right", y: "bottom" },
    ripple: true,
    dismissible: true,
    ripple: false,
    types: [
      {
        type: "success",
        background: "#13716D",
        icon: {
          className: "fas fa-check-circle",
          tagName: "i",
          color: "white",
        },
        duration: 2500,
      },
    ],
  });
  let nonAllowedCharacterFiles = [];
  var folderPath = [];
  var duplicateFolders = [];
  var hiddenFiles = [];
  var nonAllowedFiles = [];

  for (var i = 0; i < ev1.length; i++) {
    /// Get all the file information
    var itemPath = ev1[i].path;
    var itemName = path.parse(itemPath).base;
    var duplicate = false;
    var statsObj = fs.statSync(itemPath);
    // check for duplicate or files with the same name
    for (var j = 0; j < ev2.children.length; j++) {
      if (itemName === ev2.children[j].innerText) {
        duplicate = true;
        break;
      }
    }
    /// check for File duplicate
    if (statsObj.isFile()) {
      var nonAllowedDuplicate = false;
      var originalFileName = path.parse(itemPath).base;
      var slashCount = globals.organizeDSglobalPath.value.trim().split("/").length - 1;
      const fileNameRegex = /[^-a-zA-z0-9]/g;

      if (path.parse(itemPath).name.substr(0, 1) === ".") {
        if (path.parse(itemPath).base === ".DS_Store") {
          nonAllowedFiles.push(itemPath);
          continue;
        } else {
          hiddenFiles.push(itemPath);
          continue;
        }
      }
      if (path.parse(itemPath).base === "Thumbs.db") {
        nonAllowedFiles.push(itemPath);
        continue;
      }

      if (slashCount === 1) {
        await Swal.fire({
          icon: "error",
          html: "<p>This interface is only for including files in the SPARC folders. If you are trying to add SPARC metadata file(s), you can do so in the next Step.</p>",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
        break;
      } else {
        if (JSON.stringify(myPath["files"]) === "{}" && JSON.stringify(importedFiles) === "{}") {
          importedFiles[path.parse(itemPath).base] = {
            path: itemPath,
            basename: path.parse(itemPath).base,
          };
        } else {
          //check if fileName is in to-be-imported object keys
          if (importedFiles.hasOwnProperty(originalFileName)) {
            nonAllowedDuplicate = true;
            nonAllowedDuplicateFiles.push(itemPath);
            continue;
          } else {
            //check if filename is in already-imported object keys
            if (myPath["files"].hasOwnProperty(originalFileName)) {
              nonAllowedDuplicate = true;
              nonAllowedDuplicateFiles.push(itemPath);
              continue;
            } else {
              if (Object.keys(myPath["files"]).length === 0) {
                importedFiles[originalFileName] = {
                  path: itemPath,
                  basename: originalFileName,
                };
              }
              for (let objectKey in myPath["files"]) {
                if (objectKey !== undefined) {
                  nonAllowedDuplicate = false;
                  //just checking if paths are the same
                  if (itemPath === myPath["files"][objectKey]["path"]) {
                    nonAllowedDuplicateFiles.push(itemPath);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //in neither so write
                    importedFiles[originalFileName] = {
                      path: itemPath,
                      basename: originalFileName,
                    };
                  }
                }
              }
            }
          }
        }
      }
    } else if (statsObj.isDirectory()) {
      /// drop a folder
      if (slashCount === 1) {
        await Swal.fire({
          icon: "error",
          text: "Only SPARC folders can be added at this level. To add a new SPARC folder, please go back to Step 2.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
        });
      } else {
        var j = 1;
        var originalFolderName = itemName;
        var renamedFolderName = originalFolderName;

        if (irregularFolderArray.includes(itemPath)) {
          if (action !== "ignore" && action !== "") {
            if (action === "remove") {
              renamedFolderName = removeIrregularFolders(itemName);
            } else if (action === "replace") {
              renamedFolderName = replaceIrregularFolders(itemName);
            }
            importedFolders[renamedFolderName] = {
              path: itemPath,
              "original-basename": originalFolderName,
            };
          }
        } else {
          if (myPath["folders"].hasOwnProperty(originalFolderName) === true) {
            //folder is already imported
            duplicateFolders.push(itemName);
            folderPath.push(itemPath);
            continue;
          } else {
            if (importedFolders.hasOwnProperty(originalFolderName) === true) {
              //folder is already in to-be-imported list
              duplicateFolders.push(itemName);
              folderPath.push(itemPath);
              continue;
            } else {
              //folder is in neither so write
              importedFolders[originalFolderName] = {
                path: itemPath,
                "original-basename": originalFolderName,
              };
            }
          }
        }
      }
    }
  }

  if (hiddenFiles.length > 0) {
    await Swal.fire({
      title:
        "The following files have an unexpected name starting with a period. How should we handle them?",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" + hiddenFiles.join("</br>") + "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: "Remove characters",
      denyButtonText: "Continue as is",
      cancelButtonText: "Cancel",
      didOpen: () => {
        $(".swal-popover").popover();
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        //replace characters
        //check for already imported
        for (let i = 0; i < hiddenFiles.length; i++) {
          let file_name = path.parse(hiddenFiles[i]).base;
          let path_name = hiddenFiles[i];

          if (Object.keys(myPath["files"]).length > 0) {
            for (const objectKey in myPath["files"]) {
              //tries finding duplicates with the same path
              if (objectKey != undefined) {
                nonAllowedDuplicate = false;
                if (file_name.substr(1, file_name.length) === objectKey) {
                  if (path_name === myPath["files"][objectKey]["path"]) {
                    //same path and has not been renamed
                    nonAllowedDuplicateFiles.push(path_name);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //store in imported files
                    importedFiles[file_name.substr(1, file_name.length)] = {
                      path: path_name,
                      basename: file_name.substr(1, file_name.length),
                    };
                  }
                } else {
                  //store in imported files
                  importedFiles[file_name.substr(1, file_name.length)] = {
                    path: path_name,
                    basename: file_name.substr(1, file_name.length),
                  };
                }
              }
            }
          } else {
            //store in imported files
            importedFiles[file_name.substr(1, file_name.length)] = {
              path: path_name,
              basename: file_name.substr(1, file_name.length),
            };
          }
        }
      } else if (result.isDenied) {
        //leave as is

        for (let i = 0; i < hiddenFiles.length; i++) {
          let file_name = path.parse(hiddenFiles[i]).base;
          let path_name = hiddenFiles[i];

          if (Object.keys(myPath["files"]).length > 0) {
            for (const objectKey in myPath["files"]) {
              //tries finding duplicates with the same path
              if (objectKey != undefined) {
                nonAllowedDuplicate = false;
                if (file_name === objectKey) {
                  if (path_name === myPath["files"][objectKey]["path"]) {
                    //same path and has not been renamed
                    nonAllowedDuplicateFiles.push(path_name);
                    nonAllowedDuplicate = true;
                    continue;
                  } else {
                    //file path and object key path arent the same
                    //check if the file name are the same
                    //if so consider it as a duplicate

                    //store in regular files
                    importedFiles[file_name] = {
                      path: path_name,
                      basename: file_name,
                    };
                  }
                } else {
                  //store in regular files
                  importedFiles[file_name] = {
                    path: path_name,
                    basename: file_name,
                  };
                }
              }
            }
          } else {
            //store in regular files
            importedFiles[file_name] = {
              path: path_name,
              basename: file_name,
            };
          }
        }
      }
    });
  }

  if (nonAllowedFiles.length > 0) {
    await Swal.fire({
      title: "The following files are banned as per SPARC guidelines and will not be imported",
      html:
        "<div style='max-height:300px; overflow-y:auto'>" +
        nonAllowedFiles.join("</br>") +
        "</div>",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      confirmButtonText: "Okay",
    });
  }

  var listElements = showItemsAsListBootbox(duplicateFolders);
  var list = JSON.stringify(folderPath).replace(/"/g, "");
  if (duplicateFolders.length > 0) {
    await Swal.fire({
      title: "Duplicate folder(s) detected",
      icon: "warning",
      showConfirmButton: false,
      allowOutsideClick: false,
      showCloseButton: true,
      customClass: "wide-swal-auto",
      backdrop: "rgba(0, 0, 0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate_animated animate_zoomout animate__faster",
      },
      html:
        `
      <div class="caption">
        <p>Folders with the following names are already in the current folder: <p><ul style="text-align: start;">${listElements}</ul></p></p>
      </div>
      <div class="swal-button-container">
        <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
        list +
        `', 'free-form')">Skip Folders</button>
        <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}', 'free-form')">Replace Existing Folders</button>
        <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}', 'free-form')">Import Duplicates</button>
        <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', '', 'free-form')">Cancel</button>
        </div>`,
    });
  }
  let baseName = [];
  if (nonAllowedDuplicateFiles.length > 0) {
    for (let element in nonAllowedDuplicateFiles) {
      let lastSlash = nonAllowedDuplicateFiles[element].lastIndexOf("\\") + 1;
      if (lastSlash === 0) {
        lastSlash = nonAllowedDuplicateFiles[element].lastIndexOf("/") + 1;
      }
      baseName.push(
        nonAllowedDuplicateFiles[element].substring(
          lastSlash,
          nonAllowedDuplicateFiles[element].length
        )
      );
    }
    var listElements = showItemsAsListBootbox(baseName);
    var list = JSON.stringify(nonAllowedDuplicateFiles).replace(/"/g, "");
    await Swal.fire({
      title: "Duplicate file(s) detected",
      icon: "warning",
      showConfirmButton: false,
      allowOutsideClick: false,
      showCloseButton: true,
      customClass: "wide-swal-auto",
      backdrop: "rgba(0, 0, 0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate_animated animate_zoomout animate__faster",
      },
      html:
        `
      <div class="caption">
        <p>Files with the following names are already in the current folder: <p><ul style="text-align: start;">${listElements}</ul></p></p>
      </div>
      <div class="swal-button-container">
        <button id="skip" class="btn skip-btn" onclick="handleDuplicateImports('skip', '` +
        list +
        `', 'free-form')">Skip Files</button>
        <button id="replace" class="btn replace-btn" onclick="handleDuplicateImports('replace', '${list}', 'free-form')">Replace Existing Files</button>
        <button id="rename" class="btn rename-btn" onclick="handleDuplicateImports('rename', '${list}', 'free-form')">Import Duplicates</button>
        <button id="cancel" class="btn cancel-btn" onclick="handleDuplicateImports('cancel', '', 'free-form')">Cancel</button>
        </div>`,
    });
  }
  // // now append to UI files and folders

  if (Object.keys(importedFiles).length > 0) {
    for (var element in importedFiles) {
      myPath["files"][importedFiles[element]["basename"]] = {
        path: importedFiles[element]["path"],
        type: "local",
        description: "",
        "additional-metadata": "",
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(
        myPath["files"][importedFiles[element]["basename"]]["path"]
      ).base;
      if (element !== originalName) {
        myPath["files"][importedFiles[element]["basename"]]["action"].push("renamed");
      }
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)"  style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        importedFiles[element]["basename"] +
        "</div></div>";
      $(appendString).appendTo(ev2);
    }
    listItems(myPath, "#items", 500, (reset = true));
    if (Object.keys(importedFiles).length > 1) {
      importToast.open({
        type: "success",
        message: "Successfully Imported Files",
      });
    } else {
      importToast.open({
        type: "success",
        message: "Successfully Imported File",
      });
    }
    // getInFolder(
    //   ".single-item",
    //   "#items",
    //   globals.organizeDSglobalPath,
    //   datasetStructureJSONObj
    // );
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  }
  if (Object.keys(importedFolders).length > 0) {
    for (var element in importedFolders) {
      myPath["folders"][element] = {
        type: "local",
        path: importedFolders[element]["path"],
        folders: {},
        files: {},
        action: ["new"],
      };
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(myPath["folders"][element]["path"]).name;
      let placeholderString =
        '<div id="placeholder_element" class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="fas fa-file-import"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">Loading ' +
        element +
        "... </div></div>";
      $(placeholderString).appendTo(ev2);
      // await listItems(myPath, "#items");
      //listItems(myPath, "#items");
      if (element !== originalName) {
        myPath["folders"][element]["action"].push("renamed");
      }
      populateJSONObjFolder(action, myPath["folders"][element], importedFolders[element]["path"]);
      var appendString =
        '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">' +
        element +
        "</div></div>";
      $("#placeholder_element").remove();
      $(appendString).appendTo(ev2);
    }
    listItems(myPath, "#items", 500, (reset = true));
    getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
    if (Object.keys(importedFolders).length > 1) {
      importToast.open({
        type: "success",
        message: "Successfully Imported Folders",
      });
    } else {
      importToast.open({
        type: "success",
        message: "Successfully Imported Folder",
      });
    }
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  }
  beginScrollListen();
  $("body").removeClass("waiting");
};

var irregularFolderArray = [];
function detectIrregularFolders(folderName, pathEle) {
  if (checkIrregularNameBoolean(folderName)) {
    irregularFolderArray.push(pathEle);
  }
  if (fs.lstatSync(pathEle).isDirectory()) {
    fs.readdirSync(pathEle).forEach(function (folder) {
      var stat = fs.statSync(path.join(pathEle, folder));
      if (stat && stat.isDirectory()) {
        detectIrregularFolders(folder, path.join(pathEle, folder));
      }
      return irregularFolderArray;
    });
  }
}

function checkIrregularNameBoolean(folderName) {
  for (var char of nonAllowedCharacters) {
    if (folderName.includes(char)) {
      return true;
    }
  }
  return false;
}

/* The following functions aim at ignore folders with irregular characters, or replace the characters with (-),
   or remove the characters from the names.
   All return an object in the form {"type": empty for now, will be confirmed once users click an option at the popup,
                                     "paths": array of all the paths with special characters detected}
*/

function replaceIrregularFolders(pathElement) {
  var str = path.basename(pathElement);
  for (var char of nonAllowedCharacters) {
    if (str.includes(char)) {
      str = str.replace(char, "-");
    }
  }
  return str;
}

function removeIrregularFolders(pathElement) {
  var str = path.basename(pathElement);
  for (var char of nonAllowedCharacters) {
    if (str.includes(char)) {
      str = str.replace(char, "");
    }
  }
  return str;
}

//////////////////////////////////////////////////////////////////////////////
/////////////////// CONTEXT MENU OPTIONS FOR FOLDERS AND FILES ///////////////
//////////////////////////////////////////////////////////////////////////////

//// helper functions for hiding/showing context menus
function showmenu(ev, category, deleted = false) {
  //stop the real right click menu
  ev.preventDefault();
  var mouseX;
  let element = "";
  if (ev.pageX <= 200) {
    mouseX = ev.pageX + 10;
  } else {
    let active_class = $("#sidebarCollapse").attr("class");
    if (active_class.search("active") == -1) {
      mouseX = ev.pageX - 210;
    } else {
      mouseX = ev.pageX - 50;
    }
  }

  var mouseY = ev.pageY - 10;

  if (category === "folder") {
    if (deleted) {
      $(menuFolder).children("#reg-folder-delete").html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuFolder).children("#reg-folder-rename").hide();
      $(menuFolder).children("#folder-move").hide();
      $(menuFolder).children("#folder-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuFolder)
          .children("#reg-folder-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuFolder)
          .children("#folder-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(menuFolder).children("#reg-folder-rename").hide();
        $(menuFolder).children("#folder-description").hide();
      } else {
        $(menuFolder)
          .children("#reg-folder-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuFolder)
          .children("#folder-move")
          .html('<i class="fas fa-external-link-alt"></i> Move');
        $(menuFolder).children("#folder-move").show();
        $(menuFolder).children("#reg-folder-rename").show();
        $(menuFolder).children("#folder-description").show();
      }
    }
    menuFolder.style.display = "block";
    $(".menu.reg-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  } else if (category === "high-level-folder") {
    if (deleted) {
      $(menuHighLevelFolders)
        .children("#high-folder-delete")
        .html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuHighLevelFolders).children("#high-folder-rename").hide();
      $(menuHighLevelFolders).children("#folder-move").hide();
      $(menuHighLevelFolders).children("#tooltip-folders").show();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuHighLevelFolders)
          .children("#high-folder-delete")
          .html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuHighLevelFolders).children("#high-folder-delete").show();
        $(menuHighLevelFolders).children("#high-folder-rename").hide();
        $(menuHighLevelFolders).children("#folder-move").hide();
        $(menuHighLevelFolders).children("#tooltip-folders").show();
      } else {
        $(menuHighLevelFolders)
          .children("#high-folder-delete")
          .html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuHighLevelFolders).children("#high-folder-delete").show();
        $(menuHighLevelFolders).children("#high-folder-rename").hide();
        $(menuHighLevelFolders).children("#folder-move").hide();
        $(menuHighLevelFolders).children("#tooltip-folders").show();
      }
    }
    menuHighLevelFolders.style.display = "block";
    $(".menu.high-level-folder").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  } else {
    if (deleted) {
      $(menuFile).children("#file-delete").html("<i class='fas fa-undo-alt'></i> Restore");
      $(menuFile).children("#file-rename").hide();
      $(menuFile).children("#file-move").hide();
      $(menuFile).children("#file-description").hide();
    } else {
      if ($(".selected-item").length > 2) {
        $(menuFile).children("#file-delete").html('<i class="fas fa-minus-circle"></i> Delete All');
        $(menuFile)
          .children("#file-move")
          .html('<i class="fas fa-external-link-alt"></i> Move All');
        $(menuFile).children("#file-rename").hide();
        $(menuFile).children("#file-description").hide();
      } else {
        $(menuFile).children("#file-delete").html("<i class='far fa-trash-alt fa-fw'></i>Delete");
        $(menuFile).children("#file-move").html('<i class="fas fa-external-link-alt"></i> Move');
        $(menuFile).children("#file-rename").show();
        $(menuFile).children("#file-move").show();
        $(menuFile).children("#file-description").show();
      }
    }
    menuFile.style.display = "block";
    $(".menu.file").css({ top: mouseY, left: mouseX }).fadeIn("slow");
  }
}

/// options for regular sub-folders
function folderContextMenu(event) {
  $(".menu.reg-folder li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "reg-folder-rename") {
        var itemDivElements = document.getElementById("items").children;
        renameFolder(
          event,
          globals.organizeDSglobalPath,
          itemDivElements,
          datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "reg-folder-delete") {
        delFolder(event, globals.organizeDSglobalPath, "#items", ".single-item", datasetStructureJSONObj);
      } else if ($(this).attr("id") === "folder-move") {
        moveItems(event, "folders");
      }
      // Hide it AFTER the action was triggered
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
      hideFullName();
    });

  /// options for high-level folders
  $(".menu.high-level-folder li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "high-folder-rename") {
        var itemDivElements = document.getElementById("items").children;
        renameFolder(
          event,
          globals.organizeDSglobalPath,
          itemDivElements,
          datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "high-folder-delete") {
        delFolder(event, globals.organizeDSglobalPath, "#items", ".single-item", datasetStructureJSONObj);
      } else if ($(this).attr("id") === "tooltip-folders") {
        showTooltips(event);
      }
      // Hide it AFTER the action was triggered
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
      hideFullName();
    });
  /// hide both menus after an option is clicked
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  hideFullName();
}

//////// options for files
function fileContextMenu(event) {
  if ($(".div-display-details.file").hasClass("show")) {
    $(".div-display-details.file").removeClass("show");
  }
  $(".menu.file li")
    .unbind()
    .click(function () {
      if ($(this).attr("id") === "file-rename") {
        var itemDivElements = document.getElementById("items").children;
        renameFolder(
          event,
          globals.organizeDSglobalPath,
          itemDivElements,
          datasetStructureJSONObj,
          "#items",
          ".single-item"
        );
      } else if ($(this).attr("id") === "file-delete") {
        delFolder(event, globals.organizeDSglobalPath, "#items", ".single-item", datasetStructureJSONObj);
      } else if ($(this).attr("id") === "file-move") {
        moveItems(event, "files");
      } else if ($(this).attr("id") === "file-description") {
        manageDesc(event);
      }
      // Hide it AFTER the action was triggered
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
    });
  hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
}

$(document).ready(function () {
  tippy("[data-tippy-content]:not(.tippy-content-main):not(.guided-tippy-wrapper)", {
    allowHTML: true,
    interactive: true,
    placement: "top",
    theme: "light",
  });

  tippy(".tippy-content-main", {
    allowHTML: true,
    interactive: true,
    placement: "bottom",
    theme: "light",
  });

  tippy(".guided-tippy-wrapper", {
    allowHTML: true,
    interactive: true,
    placement: "bottom",
    theme: "light",
    /*apply -5 bottom margin to negate button bottom margin*/
    offset: [0, -3],
  });
});

const select_items = (items, event, isDragging) => {
  let selected_class = "";

  items.forEach((event_item) => {
    let target_element = null;
    let parent_element = null;

    if (event_item.classList[0] === "single-item") {
      parent_element = event_item;
      target_element = $(parent_element).children()[0];
      if ($(target_element).hasClass("myFol") || $(target_element).hasClass("myFile")) {
        selected_class = "selected-item";
        drag_event_fired = true;
      }
    }

    $(".selected-item").removeClass("selected-item");
    $(".ds-selected").addClass(selected_class);
    $(".ds-selected").each((index, element) => {
      target_element = $(element).children()[0];
      $(target_element).addClass(selected_class);
    });
  });
};

$(document).bind("click", (event) => {
  // If there is weird right click menu behaviour, check the hideMenu block
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("file", menuFolder, menuHighLevelFolders, menuFile);
  // hideFullPath()
  hideFullName();

  // Handle clearing selection when clicked outside.
  // Currently only handles clicks inside the folder holder area
  if (event.target.classList[0] === "div-organize-items") {
    if (drag_event_fired) {
      drag_event_fired = false;
    } else {
      $(".selected-item").removeClass("selected-item");
    }
  }
});

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  /// sort the files in objects
  if (object.hasOwnProperty("files")) {
    Object.keys(object["files"])
      .sort()
      .forEach(function (key) {
        orderedFiles[key] = object["files"][key];
      });
  }
  if (object.hasOwnProperty("folders")) {
    Object.keys(object["folders"])
      .sort()
      .forEach(function (key) {
        orderedFolders[key] = object["folders"][key];
      });
  }
  const orderedObject = {
    folders: orderedFolders,
    files: orderedFiles,
    type: "",
  };
  return orderedObject;
}

const listItems = async (jsonObj, uiItem, amount_req, reset) => {
  //allow amount to choose how many elements to create
  //break elements into sets of 100
  const rootFolders = ["primary", "source", "derivative"];
  if (globals.organizeDSglobalPath.id === "guided-input-global-path") {
    const splitPathCheck = (num, button) => {
      //based on the paths length we will determine if the back button should be disabled/hidden or not
      if (splitPath.length > num) {
        //button should be enabled
        button.disabled = false;
        button.style.display = "block";
      } else {
        //button should be disabled
        button.disabled = true;
        button.style.display = "none";
      }
    };

    let currentPageID = CURRENT_PAGE.attr("id");
    //capsules need to determine if sample or subjects section
    //subjects initially display two folder levels meanwhile samples will initially only show one folder level
    let primarySampleCapsule = document.getElementById(
      "guided-primary-samples-organization-page-capsule"
    );
    let primarySubjectCapsule = document.getElementById(
      "guided-primary-subjects-organization-page-capsule"
    );
    let sourceSampleCapsule = document.getElementById(
      "guided-source-samples-organization-page-capsule"
    );
    let sourceSubjectCapsule = document.getElementById(
      "guided-source-subjects-organization-page-capsule"
    );
    let derivativeSampleCapsule = document.getElementById(
      "guided-derivative-samples-organization-page-capsule"
    );
    let derivativeSubjectCapsule = document.getElementById(
      "guided-derivative-subjects-organization-page-capsule"
    );

    let datasetPath = document.getElementById("guided-input-global-path");
    let pathDisplay = document.getElementById("datasetPathDisplay");
    let fileExplorerBackButton = document.getElementById("guided-button-back");
    let splitPath = datasetPath.value.split("/");
    let fullPath = datasetPath.value;

    //remove my_dataset_folder and if any of the ROOT FOLDER names is included
    if (splitPath[0] === "My_dataset_folder") splitPath.shift();
    if (rootFolders.includes(splitPath[0])) splitPath.shift();
    //remove the last element in array is it is always ''
    splitPath.pop();

    //get 2 last lvls of the folder path
    let trimmedPath = "";
    if (currentPageID.includes("primary")) {
      if (primarySampleCapsule.classList.contains("active")) {
        splitPathCheck(2, fileExplorerBackButton);
      }
      if (primarySubjectCapsule.classList.contains("active")) {
        splitPathCheck(1, fileExplorerBackButton);
      }
    }
    if (currentPageID.includes("source")) {
      if (sourceSubjectCapsule.classList.contains("active")) {
        splitPathCheck(1, fileExplorerBackButton);
      }
      if (sourceSampleCapsule.classList.contains("active")) {
        splitPathCheck(2, fileExplorerBackButton);
      }
    }
    if (currentPageID.includes("derivative")) {
      //check the active capsule
      if (derivativeSampleCapsule.classList.contains("active")) {
        splitPathCheck(2, fileExplorerBackButton);
      }
      if (derivativeSubjectCapsule.classList.contains("active")) {
        splitPathCheck(1, fileExplorerBackButton);
      }
    }
    if (
      currentPageID.includes("code") ||
      currentPageID.includes("protocol") ||
      currentPageID.includes("docs") ||
      currentPageID.includes("helpers")
    ) {
      //for code/protocols/docs we only initially display one folder lvl
      splitPathCheck(1, fileExplorerBackButton);
    }

    for (let i = 0; i < splitPath.length; i++) {
      if (splitPath[i] === "My_dataset_folder" || splitPath[i] === undefined) continue;
      trimmedPath += splitPath[i] + "/";
    }

    pathDisplay.innerText = trimmedPath;
    pathDisplay._tippy.setContent(fullPath);

    //get the path of the dataset when rendering
    //with the path you can determine whether or not to disable the back button
  }

  var appendString = "";
  var sortedObj = sortObjByKeys(jsonObj);
  let file_elements = [],
    folder_elements = [];
  let count = 0;
  if (Object.keys(sortedObj["folders"]).length > 0) {
    for (var item in sortedObj["folders"]) {
      count += 1;
      var emptyFolder = "";
      if (!highLevelFolders.includes(item)) {
        if (
          JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
          JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
        ) {
          emptyFolder = " empty";
        }
      }

      cloud_item = "";
      deleted_folder = false;

      if ("action" in sortedObj["folders"][item]) {
        if (
          sortedObj["folders"][item]["action"].includes("deleted") ||
          sortedObj["folders"][item]["action"].includes("recursive_deleted")
        ) {
          emptyFolder += " deleted_folder";
          deleted_folder = true;
          if (sortedObj["folders"][item]["action"].includes("recursive_deleted")) {
            emptyFolder += " recursive_deleted_file";
          }
        }
      }

      if (sortedObj["folders"][item]["type"] == "bf") {
        cloud_item = " pennsieve_folder";
        if (deleted_folder) {
          cloud_item = " pennsieve_folder_deleted";
        }
      }

      if (
        sortedObj["folders"][item]["type"] == "local" &&
        sortedObj["folders"][item]["action"].includes("existing")
      ) {
        cloud_item = " local_folder";
        if (deleted_folder) {
          cloud_item = " local_folder_deleted";
        }
      }

      if (sortedObj["folders"][item]["action"].includes("updated")) {
        cloud_item = " update-file";
        let elem_creation =
          '<div class="single-item updated-file" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol' +
          emptyFolder +
          '"></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        // folder_elements.push(elem_creation);
        appendString = appendString + elem_creation;
        if (count === 100) {
          folder_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      } else {
        let element_creation =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol' +
          emptyFolder +
          '"></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        // folder_elements.push(element_creation);
        appendString = appendString + element_creation;
        if (count === 100) {
          folder_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      }
    }
    if (count < 100) {
      if (!folder_elements.includes(appendString) && appendString != "") {
        folder_elements.push(appendString);
        count = 0;
      }
    }
  }
  //reset count and string for file elements
  count = 0;
  appendString = "";
  if (Object.keys(sortedObj["files"]).length > 0) {
    for (var item in sortedObj["files"]) {
      count += 1;
      // not the auto-generated manifest
      if (sortedObj["files"][item].length !== 1) {
        if ("path" in sortedObj["files"][item]) {
          var extension = path.extname(sortedObj["files"][item]["path"]).slice(1);
        } else {
          var extension = "other";
        }
        if (sortedObj["files"][item]["type"] == "bf") {
          if (sortedObj["files"][item]["action"].includes("deleted")) {
            original_file_name = item.substring(0, item.lastIndexOf("-"));
            extension = original_file_name.split(".").pop();
          } else {
            extension = item.split(".").pop();
          }
        }
        if (
          ![
            "docx",
            "doc",
            "pdf",
            "txt",
            "jpg",
            "JPG",
            "jpeg",
            "JPEG",
            "xlsx",
            "xls",
            "csv",
            "png",
            "PNG",
          ].includes(extension)
        ) {
          extension = "other";
        }
      } else {
        extension = "other";
      }

      cloud_item = "";
      deleted_file = false;

      if ("action" in sortedObj["files"][item]) {
        if (
          sortedObj["files"][item]["action"].includes("deleted") ||
          sortedObj["files"][item]["action"].includes("recursive_deleted")
        ) {
          extension += " deleted_file";
          deleted_file = true;
          if (sortedObj["files"][item]["action"].includes("recursive_deleted")) {
            extension += " recursive_deleted_file";
          }
        }
      }

      if (sortedObj["files"][item]["type"] == "bf") {
        cloud_item = " pennsieve_file";
        if (deleted_file) {
          cloud_item = " pennsieve_file_deleted";
        }
        let element_creation =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";
      }

      if (
        sortedObj["files"][item]["type"] == "local" &&
        sortedObj["files"][item]["action"].includes("existing")
      ) {
        cloud_item = " local_file";
        if (deleted_file) {
          cloud_item = " local_file_deleted";
        }
      }
      if (
        sortedObj["files"][item]["type"] == "local" &&
        sortedObj["files"][item]["action"].includes("updated")
      ) {
        cloud_item = " update-file";
        if (deleted_file) {
          cloud_item = "pennsieve_file_deleted";
        }
        let elem_creation =
          '<div class="single-item updated-file" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        appendString = appendString + elem_creation;
        if (count === 100) {
          file_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      } else {
        let element_creation =
          '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="myFile ' +
          extension +
          '" oncontextmenu="fileContextMenu(this)"  style="margin-bottom: 10px""></h1><div class="folder_desc' +
          cloud_item +
          '">' +
          item +
          "</div></div>";

        appendString = appendString + element_creation;
        if (count === 100) {
          file_elements.push(appendString);
          count = 0;
          appendString = "";
          continue;
        }
      }
    }
    if (count < 100) {
      if (!file_elements.includes(appendString) && appendString != "") {
        file_elements.push(appendString);
        count = 0;
      }
      // continue;
    }
  }
  if (folder_elements[0] === "") {
    folder_elements.splice(0, 1);
  }
  if (file_elements[0] === "") {
    file_elements.splice(0, 1);
  }
  let items = [folder_elements, file_elements];

  if (amount_req != undefined) {
    //add items using a different function
    //want the initial files to be imported
    let itemDisplay = new Promise(async (resolved) => {
      if (reset != undefined) {
        await add_items_to_view(items, amount_req, reset);
        resolved();
      } else {
        await add_items_to_view(items, amount_req);
        resolved();
      }
    });
  } else {
    //load everything in place
    let itemDisplay = new Promise(async (resolved) => {
      // $(uiItem).empty();
      await add_items_to_view(items, 500);
      resolved();
    });
  }


  drag_event_fired = false;

  //check if folder_elements is an empty object and file_elements is an empty array
  if (folder_elements.length == 0 && file_elements.length == 0) {
    //Fired when no folders are to be appended to the folder structure element.
    //Gets the name of the current folder from globals.organizeDSglobalPath and instructs the user
    //on what to do in the empty folder.
    let currentFolder = "";
    let folderType;

    if (globals.organizeDSglobalPath.value == undefined) {
      currentFolder = "My_dataset_folder";
    } else {
      //Get the name of the folder the user is currently in.
      currentFolder = globals.organizeDSglobalPath.value.split("/").slice(-2)[0];
      if (currentFolder.startsWith("sub-")) {
        folderType = "subject";
      }
      if (currentFolder.startsWith("sam-")) {
        folderType = "sample";
      }
    }

    let dragDropInstructionsText;
    if (folderType === undefined) {
      dragDropInstructionsText = `Drag and Drop folders and files to be included in the <b>${currentFolder}</b> folder.`;
    } else if (folderType == "subject") {
      dragDropInstructionsText = `Drag and drop folders and files associated with the subject ${currentFolder}`;
    } else if (folderType === "sample") {
      dragDropInstructionsText = `Drag and drop folders and files associated with the sample ${currentFolder}`;
    }

    $("#items").html(
      `<div class="drag-drop-container-instructions">
        <div id="dragDropLottieContainer" style="height: 100px; width: 100px;"></div>
        <p class="text-center large">
          ${dragDropInstructionsText}
        </p>
        <p class="text-center">
          You may also <b>add</b> or <b>import</b> ${
            folderType === undefined ? "folders or files" : folderType + " data"
          } using the buttons in the upper right corner
        </p>
      </div>`
    );
    const dragDropLottieContainer = document.getElementById("dragDropLottieContainer");

    dragDropLottieContainer.innerHTML = ``;

    let dragDropAnimation = lottie.loadAnimation({
      container: dragDropLottieContainer,
      animationData: dragDrop,
      renderer: "svg",
      loop: true,
      autoplay: true,
    });
  }
};

const getInFolder = (singleUIItem, uiItem, currentLocation, globalObj) => {
  $(singleUIItem).dblclick(async function () {
    if ($(this).children("h1").hasClass("myFol")) {
      start = 0;
      listed_count = 0;
      amount = 0;
      var folderName = this.innerText;
      currentLocation.value = currentLocation.value + folderName + "/";

      var currentPath = currentLocation.value;
      var jsonPathArray = currentPath.split("/");
      var filtered = jsonPathArray.slice(1).filter(function (el) {
        return el.trim() != "";
      });
      var myPath = getRecursivePath(filtered, globalObj);
      if (myPath.length === 2) {
        filtered = myPath[1];
        currentLocation.value = "My_dataset_folder/" + filtered.join("/") + "/";
      }
      $("#items").empty();
      already_created_elem = [];
      let items = loadFileFolder(myPath);
      //we have some items to display
      listItems(myPath, "#items", 500, (reset = true));
      getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
      organizeLandingUIEffect();
      // reconstruct folders and files (child elements after emptying the Div)
      // getInFolder(singleUIItem, uiItem, currentLocation, globalObj);
    }
  });
};

function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1);
  return newString;
}

var fileNameForEdit;
///// Option to manage description for files
function manageDesc(ev) {
  var fileName = ev.parentElement.innerText;
  /// get current location of files in JSON object
  var filtered = getGlobalPath(globals.organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  //// load existing metadata/description
  loadDetailsContextMenu(
    fileName,
    myPath,
    "textarea-file-description",
    "textarea-file-metadata",
    "para-local-path-file"
  );
  $("#button-confirm-display-details-file").html("Confirm");
  showDetailsFile();
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
  fileNameForEdit = fileName;
}

function updateFileDetails(ev) {
  var fileName = fileNameForEdit;
  var filtered = getGlobalPath(globals.organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
  triggerManageDetailsPrompts(
    ev,
    fileName,
    myPath,
    "textarea-file-description",
    "textarea-file-metadata"
  );
  /// list Items again with new updated JSON structure
  listItems(myPath, "#items");
  getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
  // find checkboxes here and uncheck them
  for (var ele of $($(ev).siblings().find("input:checkbox"))) {
    document.getElementById(ele.id).checked = false;
  }
  // close the display
  showDetailsFile();
}

function addDetailsForFile(ev) {
  var checked = false;
  for (var ele of $($(ev).siblings()).find("input:checkbox")) {
    if ($(ele).prop("checked")) {
      checked = true;
      break;
    }
  }
  /// if at least 1 checkbox is checked, then confirm with users
  if (checked) {
    Swal.fire({
      icon: "warning",
      title: "Adding additional metadata for files",
      text: "Metadata will be modified for all files in the folder. Would you like to continue?",
      showCancelButton: true,
      focusCancel: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      confirmButtonText: "Yes",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate_fastest",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateFileDetails(ev);
        $("#button-confirm-display-details-file").html("Added");
      }
    });
  } else {
    updateFileDetails(ev);
    $("#button-confirm-display-details-file").html("Added");
  }
}

$("#inputNewNameDataset").on("click", () => {
  $("#nextBtn").prop("disabled", true);
  $("#inputNewNameDataset").keyup();
});

$("#inputNewNameDataset").keyup(function () {
  let step6 = document.getElementById("generate-dataset-tab");
  if (step6.classList.contains("tab-active")) {
    $("#nextBtn").prop("disabled", true);
  }

  var newName = $("#inputNewNameDataset").val().trim();

  $("#Question-generate-dataset-generate-div").removeClass("show");
  $("#Question-generate-dataset-generate-div").removeClass("test2");
  $("#Question-generate-dataset-generate-div").removeClass("prev");
  $("#Question-generate-dataset-generate-div").hide();
  $("#Question-generate-dataset-generate-div").children().hide();
  $("#para-continue-name-dataset-generate").hide();
  $("#para-continue-name-dataset-generate").text("");

  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      document.getElementById("div-confirm-inputNewNameDataset").style.display = "none";
      $("#btn-confirm-new-dataset-name").hide();
      document.getElementById("para-new-name-dataset-message").innerHTML =
        "Error: A Pennsieve dataset name cannot contain any of the following characters: /:*?'<>.";
      // $("#nextBtn").prop("disabled", true);
      $("#Question-generate-dataset-generate-div-old").removeClass("show");
      $("#div-confirm-inputNewNameDataset").css("display", "none");
      $("#btn-confirm-new-dataset-name").hide();
    } else {
      $("#div-confirm-inputNewNameDataset").css("display", "flex");
      $("#btn-confirm-new-dataset-name").show();
      $("#Question-generate-dataset-generate-div").show();
      $("#Question-generate-dataset-generate-div").children().show();

      $("#Question-generate-dataset-generate-div-old").addClass("show");
      document.getElementById("para-new-name-dataset-message").innerHTML = "";
    }
  } else {
    $("#div-confirm-inputNewNameDataset").css("display", "none");
    $("#btn-confirm-new-dataset-name").hide();
  }
});

//// Select to choose a local dataset (getting started)
document
  .getElementById("input-destination-getting-started-locally")
  .addEventListener("click", function () {
    $("#Question-getting-started-locally-destination").nextAll().removeClass("show");
    $("#Question-getting-started-locally-destination").nextAll().removeClass("test2");
    $("#Question-getting-started-locally-destination").nextAll().removeClass("prev");
    document.getElementById("input-destination-getting-started-locally").placeholder =
      "Browse here";
    $("#para-continue-location-dataset-getting-started").text("");
    document.getElementById("nextBtn").disabled = true;
    ipcRenderer.send("open-file-dialog-local-destination-curate");
  });

//// Select to choose a local dataset (generate dataset)
document
  .getElementById("input-destination-generate-dataset-locally")
  .addEventListener("click", function () {
    $("#Question-generate-dataset-locally-destination").nextAll().removeClass("show");
    $("#Question-generate-dataset-locally-destination").nextAll().removeClass("test2");
    $("#Question-generate-dataset-locally-destination").nextAll().removeClass("prev");
    document.getElementById("nextBtn").disabled = true;
    ipcRenderer.send("open-file-dialog-local-destination-curate-generate");
  });

document.getElementById("button-generate-comeback").addEventListener("click", function () {
  setTimeout(function () {
    document.getElementById("generate-dataset-progress-tab").style.display = "none";
    document.getElementById("div-vertical-progress-bar").style.display = "flex";
    document.getElementById("prevBtn").style.display = "inline";
    document.getElementById("nextBtn").style.display = "inline";
    document.getElementById("start-over-btn").style.display = "inline-block";
    showParentTab(currentTab, 1);
    if (
      globals.sodaJSONObj["starting-point"]["type"] == "new" &&
      "local-path" in globals.sodaJSONObj["starting-point"]
    ) {
      globals.sodaJSONObj["starting-point"]["type"] = "local";
    }
  }, delayAnimation);
});

/// MAIN CURATE NEW ///

const progressBarNewCurate = document.getElementById("progress-bar-new-curate");
const divGenerateProgressBar = document.getElementById("div-new-curate-meter-progress");
const generateProgressBar = document.getElementById("progress-bar-new-curate");
var progressStatus = document.getElementById("para-new-curate-progress-bar-status");

document.getElementById("button-generate").addEventListener("click", async function () {
  $($($(this).parent()[0]).parents()[0]).removeClass("tab-active");
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("prevBtn").style.display = "none";
  document.getElementById("start-over-btn").style.display = "none";
  document.getElementById("div-vertical-progress-bar").style.display = "none";
  document.getElementById("div-generate-comeback").style.display = "none";
  document.getElementById("generate-dataset-progress-tab").style.display = "flex";
  $("#sidebarCollapse").prop("disabled", false);

  // updateJSON structure after Generate dataset tab
  updateJSONStructureGenerate();
  if (globals.sodaJSONObj["starting-point"]["type"] === "local") {
    globals.sodaJSONObj["starting-point"]["type"] = "new";
  }

  let dataset_name = "";
  let dataset_destination = "";

  if ("bf-dataset-selected" in globals.sodaJSONObj) {
    dataset_name = globals.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
    dataset_destination = "Pennsieve";
  } else if ("generate-dataset" in globals.sodaJSONObj) {
    if ("destination" in globals.sodaJSONObj["generate-dataset"]) {
      let destination = globals.sodaJSONObj["generate-dataset"]["destination"];
      if (destination == "local") {
        dataset_name = globals.sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Local";
      }
      if (destination == "bf") {
        dataset_name = globals.sodaJSONObj["generate-dataset"]["dataset-name"];
        dataset_destination = "Pennsieve";
      }
    }
  }

  generateProgressBar.value = 0;

  progressStatus.innerHTML = "Please wait while we verify a few things...";

  statusText = "Please wait while we verify a few things...";
  if (dataset_destination == "Pennsieve") {
    let supplementary_checks = await run_pre_flight_checks(false);
    if (!supplementary_checks) {
      $("#sidebarCollapse").prop("disabled", false);
      return;
    }
  }

  // from here you can modify
  document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";
  document.getElementById("para-new-curate-progress-bar-error-status").innerHTML = "";
  progressStatus.innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "none";

  progressBarNewCurate.value = 0;

  // delete datasetStructureObject["files"] value (with metadata files (if any)) that was added only for the Preview tree view
  if ("files" in globals.sodaJSONObj["dataset-structure"]) {
    globals.sodaJSONObj["dataset-structure"]["files"] = {};
  }
  // delete manifest files added for treeview
  for (var highLevelFol in globals.sodaJSONObj["dataset-structure"]["folders"]) {
    if (
      "manifest.xlsx" in globals.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"] &&
      globals.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"][
        "forTreeview"
      ]
    ) {
      delete globals.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"];
    }
  }

  let emptyFilesFoldersResponse;
  try {
    emptyFilesFoldersResponse = await client.post(
      `/curate_datasets/empty_files_and_folders`,
      {
        soda_json_structure: globals.sodaJSONObj,
      },
      { timeout: 0 }
    );
  } catch (error) {
    clientError(error);
    let emessage = userErrorMessage(error);
    document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
      "<span style='color: red;'> Error: " + emessage + "</span>";
    document.getElementById("para-please-wait-new-curate").innerHTML = "";
    $("#sidebarCollapse").prop("disabled", false);
    return;
  }

  let { data } = emptyFilesFoldersResponse;

  document.getElementById("para-please-wait-new-curate").innerHTML = "Please wait...";

  let errorMessage = "";
  error_files = data["empty_files"];
  //bring duplicate outside
  error_folders = data["empty_folders"];

  if (error_files.length > 0) {
    var error_message_files = backend_to_frontend_warning_message(error_files);
    errorMessage += error_message_files;
  }

  if (error_folders.length > 0) {
    var error_message_folders = backend_to_frontend_warning_message(error_folders);
    errorMessage += error_message_folders;
  }

  if (errorMessage) {
    errorMessage += "Would you like to continue?";
    errorMessage = "<div style='text-align: left'>" + errorMessage + "</div>";
    Swal.fire({
      icon: "warning",
      html: errorMessage,
      showCancelButton: true,
      cancelButtonText: "No, I want to review my files",
      focusCancel: true,
      confirmButtonText: "Yes, Continue",
      backdrop: "rgba(0,0,0, 0.4)",
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        initiate_generate();
      } else {
        $("#sidebarCollapse").prop("disabled", false);
        document.getElementById("para-please-wait-new-curate").innerHTML = "Return to make changes";
        document.getElementById("div-generate-comeback").style.display = "flex";
      }
    });
  } else {
    initiate_generate();
  }
});

const delete_imported_manifest = () => {
  for (let highLevelFol in globals.sodaJSONObj["dataset-structure"]["folders"]) {
    if ("manifest.xlsx" in globals.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]) {
      delete globals.sodaJSONObj["dataset-structure"]["folders"][highLevelFol]["files"]["manifest.xlsx"];
    }
  }
};

function dismissStatus(id) {
  document.getElementById(id).style = "display: none;";
  //document.getElementById("dismiss-status-bar").style = "display: none;";
}

let file_counter = 0;
let folder_counter = 0;
var uploadComplete = new Notyf({
  position: { x: "right", y: "bottom" },
  dismissible: true,
  ripple: false,
  types: [
    {
      type: "success",
      background: "#13716D",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
      duration: 4000,
    },
  ],
});

//const remote = require("electron").remote;
//child.setPosition(position[0], position[1]);

// Generates a dataset organized in the Organize Dataset feature locally, or on Pennsieve
async function initiate_generate() {
  // Disable the Guided Mode sidebar button to prevent the globals.sodaJSONObj from being modified
  document.getElementById("guided_mode_view").style.pointerEvents = "none";

  // Initiate curation by calling Python function
  let manifest_files_requested = false;
  var main_curate_status = "Solving";
  var main_total_generate_dataset_size;

  // get the amount of files
  document.getElementById("para-new-curate-progress-bar-status").innerHTML = "Preparing files ...";

  progressStatus.innerHTML = "Preparing files ...";

  document.getElementById("para-please-wait-new-curate").innerHTML = "";
  document.getElementById("div-new-curate-progress").style.display = "block";
  document.getElementById("div-generate-comeback").style.display = "none";

  let organizeDataset = document.getElementById("organize_dataset_btn");
  let uploadLocally = document.getElementById("upload_local_dataset_btn");
  let organizeDataset_option_buttons = document.getElementById("div-generate-comeback");
  let statusBarContainer = document.getElementById("div-new-curate-progress");
  var statusBarClone = statusBarContainer.cloneNode(true);
  let navContainer = document.getElementById("nav-items");
  let statusText = statusBarClone.children[2];
  let statusMeter = statusBarClone.getElementsByClassName("progresstrack")[0];
  let returnButton = document.createElement("button");

  statusBarClone.id = "status-bar-curate-progress";
  statusText.setAttribute("id", "nav-curate-progress-bar-status");
  statusMeter.setAttribute("id", "nav-progress-bar-new-curate");
  statusMeter.className = "nav-status-bar";
  statusBarClone.appendChild(returnButton);
  uploadLocally.disabled = true;
  organizeDataset.disabled = true;
  organizeDataset.className = "disabled-content-button";
  uploadLocally.className = "disabled-content-button";
  organizeDataset.style = "background-color: #f6f6f6;  border: #fff;";
  uploadLocally.style = "background-color: #f6f6f6; border: #fff;";

  returnButton.type = "button";
  returnButton.id = "returnButton";
  returnButton.innerHTML = "Return to progress";

  returnButton.onclick = function () {
    organizeDataset.disabled = false;
    organizeDataset.className = "content-button is-selected";
    organizeDataset.style = "background-color: #fff";
    organizeDataset.click();
    let button = document.getElementById("button-generate");
    $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
    document.getElementById("prevBtn").style.display = "none";
    document.getElementById("start-over-btn").style.display = "none";
    document.getElementById("div-vertical-progress-bar").style.display = "none";
    document.getElementById("div-generate-comeback").style.display = "none";
    document.getElementById("generate-dataset-progress-tab").style.display = "flex";
    organizeDataset.disabled = true;
    organizeDataset.className = "disabled-content-button";
    organizeDataset.style = "background-color: #f6f6f6;  border: #fff;";
  };

  //document.body.appendChild(statusBarClone);
  let sparc_container = document.getElementById("sparc-logo-container");
  sparc_container.style.display = "none";
  navContainer.appendChild(statusBarClone);
  let navbar = document.getElementById("main-nav");
  if (navbar.classList.contains("active")) {
    document.getElementById("sidebarCollapse").click();
  }

  //dissmisButton.addEventListener("click", dismiss('status-bar-curate-progress'));
  if ("manifest-files" in globals.sodaJSONObj) {
    if ("destination" in globals.sodaJSONObj["manifest-files"]) {
      if (globals.sodaJSONObj["manifest-files"]["destination"] === "generate-dataset") {
        manifest_files_requested = true;
        delete_imported_manifest();
      }
    }
  }
  let dataset_destination = "";
  let dataset_name = "";

  // track the amount of files that have been uploaded/generated
  let uploadedFiles = 0;
  let uploadedFilesSize = 0;
  let foldersUploaded = 0;
  let previousUploadedFileSize = 0;
  let increaseInFileSize = 0;
  let generated_dataset_id = undefined;

  // determine where the dataset will be generated/uploaded
  let nameDestinationPair = determineDatasetDestination();
  dataset_name = nameDestinationPair[0];
  dataset_destination = nameDestinationPair[1];

  if (dataset_destination == "Pennsieve" || dataset_destination == "bf") {
    // create a dataset upload session
    datasetUploadSession.startSession();
  }


  client
    .post(
      `/curate_datasets/curation`,
      {
        soda_json_structure: globals.sodaJSONObj,
      },
      { timeout: 0 }
    )
    .then(async (response) => {
      let { data } = response;

      main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
      uploadedFiles = data["main_curation_uploaded_files"];

      $("#sidebarCollapse").prop("disabled", false);


      // log relevant curation details about the dataset generation/Upload to Google Analytics
      logCurationSuccessToAnalytics(
        manifest_files_requested,
        main_total_generate_dataset_size,
        dataset_name,
        dataset_destination,
        uploadedFiles,
        false
      );
      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";

      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: defaultBfAccount,
          },
        });
        datasetList = [];
        datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
      }
    })
    .catch(async (error) => {
      //Allow guided_mode_view to be clicked again
      document.getElementById("guided_mode_view").style.pointerEvents = "";

      clientError(error);
      let emessage = userErrorMessage(error);
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      $("#sidebarCollapse").prop("disabled", false);
      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
        "<span style='color: red;'>" + emessage + "</span>";
      uploadLocally.disabled = false;
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";
      Swal.fire({
        icon: "error",
        title: "An Error Occurred While Uploading Your Dataset",
        html: "Check the error text in the Organize Dataset's upload page to see what went wrong.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        statusBarClone.remove();
        sparc_container.style.display = "inline";
        if (result.isConfirmed) {
          organizeDataset.click();
          let button = document.getElementById("button-generate");
          $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
          document.getElementById("prevBtn").style.display = "none";
          document.getElementById("start-over-btn").style.display = "none";
          document.getElementById("div-vertical-progress-bar").style.display = "none";
          document.getElementById("div-generate-comeback").style.display = "flex";
          document.getElementById("generate-dataset-progress-tab").style.display = "flex";
        }
      });
      progressStatus.innerHTML = "";
      statusText.innerHTML = "";
      document.getElementById("div-new-curate-progress").style.display = "none";
      generateProgressBar.value = 0;

      try {
        let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
          params: {
            selected_account: defaultBfAccount,
          },
        });
        datasetList = [];
        datasetList = responseObject.data.datasets;
      } catch (error) {
        clientError(error);
        emessage = userErrorMessage(error);
      }

      // wait to see if the uploaded files or size will grow once the client has time to ask for the updated information
      // if they stay zero that means nothing was uploaded
      if (uploadedFiles === 0 || uploadedFilesSize === 0) {
        await wait(2000);
      }

      // log the curation errors to Google Analytics
      logCurationErrorsToAnalytics(
        uploadedFiles,
        uploadedFilesSize,
        dataset_destination,
        main_total_generate_dataset_size,
        increaseInFileSize,
        datasetUploadSession,
        false
      );
    });

  // Progress tracking function for main curate
  var countDone = 0;
  var timerProgress = setInterval(main_progressfunction, 1000);
  var successful = false;

  async function main_progressfunction() {
    let mainCurationProgressResponse;
    try {
      mainCurationProgressResponse = await client.get(`/curate_datasets/curation/progress`);
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      document.getElementById("para-new-curate-progress-bar-error-status").innerHTML =
        "<span style='color: red;'>" + emessage + "</span>";

      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.disabled = false;
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";
      Swal.fire({
        icon: "error",
        title: "An Error Occurred While Uploading Your Dataset",
        html: "Check the error text in the Organize Dataset's upload page to see what went wrong.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      }).then((result) => {
        //statusBarClone.remove();
        if (result.isConfirmed) {
          organizeDataset.click();
          let button = document.getElementById("button-generate");
          $($($(button).parent()[0]).parents()[0]).removeClass("tab-active");
          document.getElementById("prevBtn").style.display = "none";
          document.getElementById("start-over-btn").style.display = "none";
          document.getElementById("div-vertical-progress-bar").style.display = "none";
          document.getElementById("div-generate-comeback").style.display = "none";
          document.getElementById("generate-dataset-progress-tab").style.display = "flex";
        }
      });
      organizeDataset_option_buttons.style.display = "flex";
      organizeDataset.disabled = false;
      organizeDataset.className = "content-button is-selected";
      organizeDataset.style = "background-color: #fff";
      uploadLocally.disabled = false;
      uploadLocally.className = "content-button is-selected";
      uploadLocally.style = "background-color: #fff";
      console.error(error);
      //Clear the interval to stop the generation of new sweet alerts after intitial error
      clearInterval(timerProgress);
      return;
    }

    let { data } = mainCurationProgressResponse;

    main_curate_status = data["main_curate_status"];
    var start_generate = data["start_generate"];
    var main_curate_progress_message = data["main_curate_progress_message"];
    main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
    var main_generated_dataset_size = data["main_generated_dataset_size"];
    var elapsed_time_formatted = data["elapsed_time_formatted"];

    if (start_generate === 1) {
      divGenerateProgressBar.style.display = "block";
      if (main_curate_progress_message.includes("Success: COMPLETED!")) {
        generateProgressBar.value = 100;
        statusMeter.value = 100;
        progressStatus.innerHTML = main_curate_status + smileyCan;
        statusText.innerHTML = main_curate_status + smileyCan;
        successful = true;
      } else {
        var value = (main_generated_dataset_size / main_total_generate_dataset_size) * 100;
        generateProgressBar.value = value;
        statusMeter.value = value;
        if (main_total_generate_dataset_size < displaySize) {
          var totalSizePrint = main_total_generate_dataset_size.toFixed(2) + " B";
        } else if (main_total_generate_dataset_size < displaySize * displaySize) {
          var totalSizePrint = (main_total_generate_dataset_size / displaySize).toFixed(2) + " KB";
        } else if (main_total_generate_dataset_size < displaySize * displaySize * displaySize) {
          var totalSizePrint =
            (main_total_generate_dataset_size / displaySize / displaySize).toFixed(2) + " MB";
        } else {
          var totalSizePrint =
            (main_total_generate_dataset_size / displaySize / displaySize / displaySize).toFixed(
              2
            ) + " GB";
        }
        var progressMessage = "";
        var statusProgressMessage = "";
        progressMessage += main_curate_progress_message + "<br>";
        statusProgressMessage += "Progress: " + value.toFixed(2) + "%" + "<br>";
        statusProgressMessage += "Elapsed time: " + elapsed_time_formatted + "<br>";
        progressMessage +=
          "Progress: " + value.toFixed(2) + "%" + " (total size: " + totalSizePrint + ") " + "<br>";
        progressMessage += "Elapsed time: " + elapsed_time_formatted + "<br>";
        progressStatus.innerHTML = progressMessage;
        statusText.innerHTML = statusProgressMessage;
      }
    } else {
      statusText.innerHTML =
        main_curate_progress_message + "<br>" + "Elapsed time: " + elapsed_time_formatted + "<br>";
      progressStatus.innerHTML =
        main_curate_progress_message + "<br>" + "Elapsed time: " + elapsed_time_formatted + "<br>";
    }

    if (main_curate_status === "Done") {
      $("#sidebarCollapse").prop("disabled", false);
      countDone++;
      if (countDone > 1) {

        statusBarClone.remove();
        sparc_container.style.display = "inline";
        if (successful === true) {
          organizeDataset_option_buttons.style.display = "flex";
          organizeDataset.disabled = false;
          organizeDataset.className = "content-button is-selected";
          organizeDataset.style = "background-color: #fff";
          uploadLocally.disabled = false;
          uploadLocally.className = "content-button is-selected";
          uploadLocally.style = "background-color: #fff";
          uploadComplete.open({
            type: "success",
            message: "Dataset created successfully",
          });
        } else {
          //enable buttons anyways
          organizeDataset_option_buttons.style.display = "flex";
          organizeDataset.disabled = false;
          organizeDataset.className = "content-button is-selected";
          organizeDataset.style = "background-color: #fff";
          uploadLocally.disabled = false;
          uploadLocally.className = "content-button is-selected";
          uploadLocally.style = "background-color: #fff";
        }
        // then show the sidebar again
        // forceActionSidebar("show");
        clearInterval(timerProgress);
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    }
  }

  // when generating a new dataset we need to add its ID to the ID -> Name mapping
  // we need to do this only once
  let loggedDatasetNameToIdMapping = false;

  // if uploading to Pennsieve set an interval that gets the amount of files that have been uploaded
  // and their aggregate size; starts for local dataset generation as well. Provides easy way to track amount of
  // files copied and their aggregate size.
  // IMP: This handles tracking a session that tracking a session that had a successful Pennsieve upload.
  //      therefore it is unnecessary to have logs for Session ID tracking in the "api_main_curate" success block
  // IMP: Two reasons this exists:
  //    1. Pennsieve Agent can freeze. This prevents us from logging. So we log a Pennsieve dataset upload session as it happens.
  //    2. Local dataset generation and Pennsieve dataset generation can fail. Having access to how many files and their aggregate size for logging at error time is valuable data.
  const checkForBucketUpload = async () => {
    // ask the server for the amount of files uploaded in the current session
    // nothing to log for uploads where a user is solely deleting files in this section

    let mainCurationDetailsResponse;
    try {
      mainCurationDetailsResponse = await client.get(`/curate_datasets/curation/upload_details`);
    } catch (error) {
      clientError(error);
      clearInterval(timerCheckForBucketUpload);
      return;
    }

    let { data } = mainCurationDetailsResponse;

    // check if the amount of successfully uploaded files has increased
    if (
      data["main_curation_uploaded_files"] > 0 &&
      data["uploaded_folder_counter"] > foldersUploaded
    ) {
      previousUploadedFileSize = uploadedFilesSize;
      uploadedFiles = data["main_curation_uploaded_files"];
      uploadedFilesSize = data["current_size_of_uploaded_files"];
      foldersUploaded = data["uploaded_folder_counter"];

      // log the increase in the file size
      increaseInFileSize = uploadedFilesSize - previousUploadedFileSize;

      // log the aggregate file count and size values when uploading to Pennsieve
      if (dataset_destination === "bf" || dataset_destination === "Pennsieve") {
        // use the session id as the label -- this will help with aggregating the number of files uploaded per session
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE +
            " - Step 7 - Generate - Dataset - Number of Files",
          `${datasetUploadSession.id}`,
          uploadedFiles
        );

        // use the session id as the label -- this will help with aggregating the size of the given upload session
        ipcRenderer.send(
          "track-event",
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE + " - Step 7 - Generate - Dataset - Size",
          `${datasetUploadSession.id}`,
          increaseInFileSize
        );
      }
    }

    generated_dataset_id = data["generated_dataset_id"];
    // if a new Pennsieve dataset was generated log it once to the dataset id to name mapping
    if (
      !loggedDatasetNameToIdMapping &&
      generated_dataset_id !== null &&
      generated_dataset_id !== undefined
    ) {
      ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        generated_dataset_id,
        dataset_name
      );

      // don't log this again for the current upload session
      loggedDatasetNameToIdMapping = true;
    }

    //stop the inteval when the upload is complete
    if (main_curate_status === "Done") {
      clearInterval(timerCheckForBucketUpload);
    }
  };

  let timerCheckForBucketUpload = setInterval(checkForBucketUpload, 1000);
} // end initiate_generate

const show_curation_shortcut = () => {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: "No. I'll do it later",
    confirmButtonText: "Yes, I want to share it",
    heightAuto: false,
    icon: "success",
    allowOutsideClick: false,
    reverseButtons: reverseSwalButtons,
    showCancelButton: true,
    text: "Now that your dataset is uploaded, do you want to share it with the Curation Team?",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then((result) => {
    //dismissStatus("status-bar-curate-progress");
    uploadComplete.open({
      type: "success",
      message: "Upload to Pennsieve completed",
    });
    let statusBarContainer = document.getElementById("status-bar-curate-progress");
    //statusBarContainer.remove();

    if (result.isConfirmed) {
      $("#disseminate_dataset_tab").click();
      $("#share_curation_team_btn").click();
    }
  });
};

const get_num_files_and_folders = (dataset_folders) => {
  if ("files" in dataset_folders) {
    for (let file in dataset_folders["files"]) {
      file_counter += 1;
    }
  }
  if ("folders" in dataset_folders) {
    for (let folder in dataset_folders["folders"]) {
      folder_counter += 1;
      get_num_files_and_folders(dataset_folders["folders"][folder]);
    }
  }
  return;
};

function determineDatasetDestination() {
  if (globals.sodaJSONObj["generate-dataset"]) {
    if (globals.sodaJSONObj["generate-dataset"]["destination"]) {
      let destination = globals.sodaJSONObj["generate-dataset"]["destination"];
      if (destination === "bf" || destination === "Pennsieve") {
        // updating an existing dataset on Pennsieve
        if (globals.sodaJSONObj["bf-dataset-selected"]) {
          return [globals.sodaJSONObj["bf-dataset-selected"]["dataset-name"], "Pennsieve"];
        } else {
          return [
            // get dataset name,
            document.querySelector("#inputNewNameDataset").value,
            "Pennsieve",
          ];
        }
      } else {
        // replacing files in an existing local dataset
        if (globals.sodaJSONObj["generate-dataset"]["dataset-name"]) {
          return [globals.sodaJSONObj["generate-dataset"]["dataset-name"], "Local"];
        } else {
          // creating a new dataset from an existing local dataset
          return [document.querySelector("#inputNewNameDataset").value, "Local"];
        }
      }
    }
  } else {
    return [document.querySelector("#inputNewNameDataset").value, "Local"];
  }
}

function backend_to_frontend_warning_message(error_array) {
  if (error_array.length > 1) {
    var warning_message = error_array[0] + "<ul>";
  } else {
    var warning_message = "<ul>";
  }
  for (var i = 1; i < error_array.length; i++) {
    item = error_array[i];
    warning_message += "<li>" + item + "</li>";
  }
  var final_message = warning_message + "</ul>";
  return final_message;
}

var metadataIndividualFile = "";
var metadataAllowedExtensions = [];
var metadataParaElement = "";
var metadataCurationMode = "";

function importMetadataFiles(ev, metadataFile, extensionList, paraEle, curationMode) {
  document.getElementById(paraEle).innerHTML = "";
  metadataIndividualFile = metadataFile;
  metadataAllowedExtensions = extensionList;
  metadataParaElement = paraEle;
  metadataCurationMode = curationMode;
  ipcRenderer.send("open-file-dialog-metadata-curate");
}

function importPennsieveMetadataFiles(ev, metadataFile, extensionList, paraEle) {
  extensionList.forEach((file_type) => {
    file_name = metadataFile + file_type;
    if (
      file_name in globals.sodaJSONObj["metadata-files"] &&
      globals.sodaJSONObj["metadata-files"][file_name]["type"] != "bf"
    ) {
      delete globals.sodaJSONObj["metadata-files"][file_name];
    }
    deleted_file_name = file_name + "-DELETED";
    if (
      deleted_file_name in globals.sodaJSONObj["metadata-files"] &&
      globals.sodaJSONObj["metadata-files"][deleted_file_name]["type"] === "bf"
    ) {
      // update Json object with the restored object
      let index = globals.sodaJSONObj["metadata-files"][deleted_file_name]["action"].indexOf("deleted");
      globals.sodaJSONObj["metadata-files"][deleted_file_name]["action"].splice(index, 1);
      let deleted_file_name_new_key = deleted_file_name.substring(
        0,
        deleted_file_name.lastIndexOf("-")
      );
      globals.sodaJSONObj["metadata-files"][deleted_file_name_new_key] =
        globals.sodaJSONObj["metadata-files"][deleted_file_name];
      delete globals.sodaJSONObj["metadata-files"][deleted_file_name];
    }
  });
  populate_existing_metadata(globals.sodaJSONObj);
}

// When mode = "update", the buttons won't be hidden or shown to prevent button flickering effect
const curation_consortium_check = async (mode = "") => {
  let selected_account = defaultBfAccount;
  let selected_dataset = defaultBfDataset;

  $(".spinner.post-curation").show();
  $("#curation-team-unshare-btn").hide();
  $("#sparc-consortium-unshare-btn").hide();
  $("#curation-team-share-btn").hide();
  $("#sparc-consortium-share-btn").hide();

  try {
    let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
      params: {
        selected_account: defaultBfAccount,
      },
    });
    let res = bf_account_details_req.data;

    let acc_details = res["account_details"];
    // remove html tags from response
    acc_details = acc_details.replace(/<[^>]*>?/gm, "");

    let organization_id = res["organization_id"];
    if (organization_id != "N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0") {
      $("#current_curation_team_status").text("None");
      $("#current_sparc_consortium_status").text("None");

      Swal.fire({
        title: "Failed to share with Curation team!",
        text: "This account is not in the SPARC organization. Please switch accounts and try again",
        icon: "error",
        showConfirmButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      if (mode != "update") {
        $("#curation-team-unshare-btn").hide();
        $("#sparc-consortium-unshare-btn").hide();
        $("#curation-team-share-btn").hide();
        $("#sparc-consortium-share-btn").hide();
        $(".spinner.post-curation").hide();
      }
      return;
    }

    if (mode != "update") {
      $("#curation-team-unshare-btn").hide();
      $("#sparc-consortium-unshare-btn").hide();
      $("#curation-team-share-btn").hide();
      $("#sparc-consortium-share-btn").hide();
    }

    if (selected_dataset === "Select dataset") {
      $("#current_curation_team_status").text("None");
      $("#current_sparc_consortium_status").text("None");
      $(".spinner.post-curation").hide();
    } else {
      //needs to be replaced
      try {
        let bf_get_permissions = await client.get(`/manage_datasets/bf_dataset_permissions`, {
          params: {
            selected_account: selected_account,
            selected_dataset: selected_dataset,
          },
        });
        // let permissions = bf_get_permissions.data.permissions;
        let team_ids = bf_get_permissions.data.team_ids;

        let curation_permission_satisfied = false;
        let consortium_permission_satisfied = false;
        let curation_return_status = false;
        let consortium_return_status = false;

        for (var team of team_ids) {
          // SPARC Data Curation Team's id
          if (team["team_id"] == "N:team:d296053d-91db-46ae-ac80-3c137ea144e4") {
            if (team["team_role"] == "manager") {
              curation_permission_satisfied = true;
            }
          }

          // SPARC Embargoed Data Sharing Group's id
          if (team["team_id"] == "N:team:ee8d665b-d317-40f8-b63d-56874cf225a1") {
            if (team["team_role"] == "viewer") {
              consortium_permission_satisfied = true;
            }
          }
        }

        if (!curation_permission_satisfied) {
          $("#current_curation_team_status").text("Not shared with the curation team");
          curation_return_status = true;
        }
        if (!consortium_permission_satisfied) {
          $("#current_sparc_consortium_status").text("Not shared with the SPARC Consortium");
          consortium_return_status = true;
        }

        if (curation_return_status) {
          if (mode != "update") {
            $("#curation-team-share-btn").show();
            $("#curation-team-unshare-btn").hide();
          }
        }

        if (consortium_return_status) {
          if (mode != "update") {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
          }
        }

        if (curation_return_status && consortium_return_status) {
          $("#sparc-consortium-unshare-btn").hide();
          $("#sparc-consortium-share-btn").show();
          $("#curation-team-unshare-btn").hide();
          $("#curation-team-share-btn").show();
          $(".spinner.post-curation").hide();
          return;
        }
        //needs to be replaced
        try {
          let bf_dataset_permissions = await client.get(`/manage_datasets/bf_dataset_status`, {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: defaultBfDataset,
            },
          });
          let res = bf_dataset_permissions.data;

          let dataset_status_value = res["current_status"];
          let dataset_status = parseInt(dataset_status_value.substring(0, 2));
          let curation_status_satisfied = false;
          let consortium_status_satisfied = false;

          if (dataset_status > 2) {
            curation_status_satisfied = true;
          }
          if (dataset_status > 10) {
            consortium_status_satisfied = true;
          }

          if (!curation_status_satisfied) {
            $("#current_curation_team_status").text("Not shared with the curation team");
            curation_return_status = true;
          }
          if (!consortium_status_satisfied) {
            $("#current_sparc_consortium_status").text("Not shared with the SPARC Consortium");
            consortium_return_status = true;
          }

          if (curation_return_status) {
            $("#curation-team-unshare-btn").hide();
            $("#curation-team-share-btn").show();
          } else {
            $("#current_curation_team_status").text("Shared with the curation team");
            $("#curation-team-unshare-btn").show();
            $("#curation-team-share-btn").hide();
          }

          if (consortium_return_status) {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
          } else {
            $("#current_sparc_consortium_status").text("Shared with the SPARC Consortium");
            $("#sparc-consortium-unshare-btn").show();
            $("#sparc-consortium-share-btn").hide();
          }

          if (curation_return_status && consortium_return_status) {
            $("#sparc-consortium-unshare-btn").hide();
            $("#sparc-consortium-share-btn").show();
            $("#curation-team-unshare-btn").hide();
            $("#curation-team-share-btn").show();
            $(".spinner.post-curation").hide();
            return;
          }

          $(".spinner.post-curation").hide();
        } catch (error) {
          clientError(error);
          $("#current_curation_team_status").text("None");
          $("#current_sparc_consortium_status").text("None");
          $(".spinner.post-curation").hide();
        }
      } catch (error) {
        clientError(error);
        if (mode != "update") {
          $("#current_curation_team_status").text("None");
          $("#current_sparc_consortium_status").text("None");
        }
        $(".spinner.post-curation").hide();
      }
    }
  } catch (error) {
    clientError(error);

    if (mode != "update") {
      $("#curation-team-unshare-btn").hide();
      $("#sparc-consortium-unshare-btn").hide();
      $("#curation-team-share-btn").hide();
      $("#sparc-consortium-share-btn").hide();
    }

    $(".spinner.post-curation").hide();
  }
};

$("#button-generate-manifest-locally").click(() => {
  ipcRenderer.send("open-folder-dialog-save-manifest-local");
});

const recursive_remove_deleted_files = (dataset_folder) => {
  if ("files" in dataset_folder) {
    for (let item in dataset_folder["files"]) {
      if (dataset_folder["files"][item]["action"].includes("deleted")) {
        delete dataset_folder["files"][item];
      }
    }
  }

  if ("folders" in dataset_folder) {
    for (let item in dataset_folder["folders"]) {
      recursive_remove_deleted_files(dataset_folder["folders"][item]);
      if (dataset_folder["folders"][item]["action"].includes("deleted")) {
        delete dataset_folder["folders"][item];
      }
    }
  }
};

async function showBFAddAccountSweetalert() {
  await Swal.fire({
    title: bfaddaccountTitle,
    html: bfAddAccountBootboxMessage,
    showLoaderOnConfirm: true,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Connect to Pennsieve",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: `<a target="_blank" href="https://docs.sodaforsparc.io/docs/manage-dataset/connect-your-pennsieve-account-with-soda#how-to-login-with-api-key" style="text-decoration: none;">Help me get an API key</a>`,
    didOpen: () => {
      let swal_container = document.getElementsByClassName("swal2-popup")[0];
      swal_container.style.width = "43rem";
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: (result) => {
      if (result === true) {
        var name = $("#bootbox-key-name").val();
        var apiKey = $("#bootbox-api-key").val();
        var apiSecret = $("#bootbox-api-secret").val();
        return new Promise(() => {
          client
            .put("/manage_datasets/account/api_key", {
              keyname: name,
              key: apiKey,
              secret: apiSecret,
            })
            .then((response) => {
              $("#bootbox-key-name").val("");
              $("#bootbox-api-key").val("");
              $("#bootbox-api-secret").val("");
              bfAccountOptions[name] = name;
              defaultBfAccount = name;
              defaultBfDataset = "Select dataset";
              return new Promise((resolve, reject) => {
                client
                  .get("/manage_datasets/bf_account_details", {
                    params: {
                      selected_account: name,
                    },
                  })
                  .then((response) => {
                    let accountDetails = response.data.account_details;
                    $("#para-account-detail-curate").html(accountDetails);
                    $("#current-bf-account").text(name);
                    $("#current-bf-account-generate").text(name);
                    $("#create_empty_dataset_BF_account_span").text(name);
                    $(".bf-account-span").text(name);
                    $("#current-bf-dataset").text("None");
                    $("#current-bf-dataset-generate").text("None");
                    $(".bf-dataset-span").html("None");
                    $("#para-account-detail-curate-generate").html(accountDetails);
                    $("#para_create_empty_dataset_BF_account").html(accountDetails);
                    $("#para-account-detail-curate-generate").html(accountDetails);
                    $(".bf-account-details-span").html(accountDetails);
                    $("#para-continue-bf-dataset-getting-started").text("");
                    showHideDropdownButtons("account", "show");
                    confirm_click_account_function();
                    updateBfAccountList();
                  })
                  .catch((error) => {
                    Swal.showValidationMessage(userErrorMessage(error));
                    document.getElementsByClassName(
                      "swal2-actions"
                    )[0].children[1].disabled = false;
                    document.getElementsByClassName(
                      "swal2-actions"
                    )[0].children[3].disabled = false;
                    document.getElementsByClassName("swal2-actions")[0].children[0].style.display =
                      "none";
                    document.getElementsByClassName("swal2-actions")[0].children[1].style.display =
                      "inline-block";
                    showHideDropdownButtons("account", "hide");
                    confirm_click_account_function();
                  });

                Swal.fire({
                  icon: "success",
                  title: "Successfully added! <br/>Loading your account details...",
                  timer: 3000,
                  timerProgressBar: true,
                  allowEscapeKey: false,
                  heightAuto: false,
                  backdrop: "rgba(0,0,0, 0.4)",
                  showConfirmButton: false,
                });
              });
            })
            .catch((error) => {
              clientError(error);
              Swal.showValidationMessage(userErrorMessage(error));
              document.getElementsByClassName("swal2-actions")[0].children[1].disabled = false;
              document.getElementsByClassName("swal2-actions")[0].children[3].disabled = false;
              document.getElementsByClassName("swal2-actions")[0].children[0].style.display =
                "none";
              document.getElementsByClassName("swal2-actions")[0].children[1].style.display =
                "inline-block";
            });
        });
      }
    },
  });
}


const create_validation_report = (error_report) => {
  // let accordion_elements = ` <div class="title active"> `;
  let accordion_elements = "";
  let elements = Object.keys(error_report).length;

  if ((elements = 0)) {
    accordion_elements += `<ul> <li>No errors found </li> </ul>`;
  } else if (elements == 1) {
    let key = Object.keys(error_report)[0];
    accordion_elements += `<ul> `;
    if ("messages" in error_report[key]) {
      for (let i = 0; i < error_report[key]["messages"].length; i++) {
        accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </li>`;
      }
    }
    accordion_elements += `</ul>`;
  } else {
    let keys = Object.keys(error_report);
    for (key_index in keys) {
      key = keys[key_index];
      if (key == keys[0]) {
        accordion_elements += `<ul> `;
        if ("messages" in error_report[key]) {
          for (let i = 0; i < error_report[key]["messages"].length; i++) {
            accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </p> </li>`;
          }
        }
        accordion_elements += `</ul> `;
      } else {
        accordion_elements += `<ul> `;
        if ("messages" in error_report[key]) {
          for (let i = 0; i < error_report[key]["messages"].length; i++) {
            accordion_elements += `<li> <p> ${error_report[key]["messages"][i]} </p></li>`;
          }
        }
        accordion_elements += `</ul>`;
      }
    }
    // accordion_elements += `</div>`;
  }
  $("#validation_error_accordion").html(accordion_elements);
  // $("#validation_error_accordion").accordion();
};

$("#validate_dataset_bttn").on("click", async () => {
  const axiosInstance = axios.create({
    baseURL: "http://127.0.0.1:5000/",
    timeout: 0,
  });




  $("#dataset_validator_status").text("Please wait while we retrieve the dataset...");
  $("#dataset_validator_spinner").show();

  let selectedBfAccount = defaultBfAccount;
  let selectedBfDataset = defaultBfDataset;

  temp_object = {
    "bf-account-selected": {
      "account-name": selectedBfAccount,
    },
    "bf-dataset-selected": {
      "dataset-name": selectedBfDataset,
    },
  };

  let datasetResponse;

  try {
    datasetResponse = await axiosInstance("api_ps_retrieve_dataset", {
      params: {
        obj: JSON.stringify(temp_object),
      },
      responseType: "json",
      method: "get",
    });
  } catch (err) {

    console.error(error);
    $("#dataset_validator_spinner").hide();
    $("#dataset_validator_status").html(`<span style='color: red;'> ${error}</span>`);
  }

  $("#dataset_validator_status").text("Please wait while we validate the dataset...");

  try {
    datasetResponse = axiosInstance("api_validate_dataset_pipeline", {
      params: {
        selectedBfAccount,
        selectedBfDataset,
      },
      responseType: "json",
      method: "get",
    });
  } catch (error) {

    console.error(error);
    $("#dataset_validator_spinner").hide();
    $("#dataset_validator_status").html(`<span style='color: red;'> ${error}</span>`);
  }

  create_validation_report(res);
  $("#dataset_validator_status").html("");
  $("#dataset_validator_spinner").hide();
});

//function used to scale banner images
const scaleBannerImage = async (imagePath) => {
  try {
    let imageScaled = await client.post(
      `/manage_datasets/bf_banner_image/scale_image`,
      {
        image_file_path: imagePath,
      },
      {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: defaultBfDataset,
        },
      }
    );
    return imageScaled.data.scaled_image_path;
  } catch (error) {
    clientError(error);
    return error.response;
  }
};

globalThis.gatherLogs = () => {
  throw new Error('This feature was removed for NWB GUIDE. Please contact the developers if you need this feature.')
}

let docu_lottie_section = document.getElementById("documentation-section");
let doc_lottie = document.getElementById("documentation-lottie");

let contact_section = document.getElementById("contact-us-section");
let contact_lottie_container = document.getElementById("contact-us-lottie");

var contact_lottie_animation = lottie.loadAnimation({
  container: contact_lottie_container,
  animationData: contact_lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});
contact_lottie_animation.pause();
var documentation_lottie = lottie.loadAnimation({
  container: doc_lottie,
  animationData: docu_lottie /*(json js variable, (view src/assets/lotties)*/,
  renderer: "svg",
  loop: true /*controls looping*/,
  autoplay: true,
});
documentation_lottie.pause();

var documentation_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown") == true) {
      //play lottie
      documentation_lottie.play();
    } else {
      // lottie.stop(documentation_lottie);
      documentation_lottie.stop();
    }
  });
});

var contact_us_lottie_observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    var attributeValue = $(mutation.target).prop(mutation.attributeName);
    if (attributeValue.includes("is-shown") == true) {
      //play lottie
      contact_lottie_animation.play();
    } else {
      contact_lottie_animation.stop();
      // lottie.stop(contact_lottie_animation);
    }
  });
});

documentation_lottie_observer.observe(docu_lottie_section, {
  attributes: true,
  attributeFilter: ["class"],
});

contact_us_lottie_observer.observe(contact_section, {
  attributes: true,
  attributeFilter: ["class"],
});

tippy("#datasetPathDisplay", {
  placement: "top",
  theme: "soda",
  maxWidth: "100%",
});

// -------------------------------------------------------------------------------------------------------------
// --------------------------------------- From guided-curate-dataset.js ---------------------------------------
// -------------------------------------------------------------------------------------------------------------

const savePageChanges = async (pageBeingLeftID) => {
  const errorArray = [];
  try {
    //save changes to the current page
    if (pageBeingLeftID === "guided-dataset-starting-point-tab") {
      const buttonNoGuidedCurateSelected = document
        .getElementById("guided-button-guided-dataset-structuring")
        .classList.contains("selected");
      const buttonYesImportExistingSelected = document
        .getElementById("guided-button-import-existing-dataset-structure")
        .classList.contains("selected");

      if (!buttonNoGuidedCurateSelected && !buttonYesImportExistingSelected) {
        errorArray.push({
          type: "notyf",
          message: "Please select a dataset start location",
        });
        throw errorArray;
      }

      if (buttonNoGuidedCurateSelected) {
        globals.sodaJSONObj["guided-options"]["dataset-start-location"] = "guided-curate";
        globals.sodaJSONObj["starting-point"]["type"] = "new";
      }

      if (buttonYesImportExistingSelected) {
        globals.sodaJSONObj["guided-options"]["dataset-start-location"] = "import-existing";
        globals.sodaJSONObj["starting-point"]["type"] = "local";
      }
    }

    if (pageBeingLeftID === "guided-prepare-helpers-tab") {
      // This is where we save data to the globals.sodaJSONObj
      // Take a look at logic around here to see how to save data to the globals.sodaJSONObj
    }

    if (pageBeingLeftID === "guided-source-folder-tab") {
      if (
        !$("#guided-button-has-source-data").hasClass("selected") &&
        !$("#guided-button-no-source-data").hasClass("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if your dataset contains source data",
        });
        throw errorArray;
      }
    }
    if (pageBeingLeftID === "guided-derivative-folder-tab") {
      if (
        //check if divs with the buttons with IDs guided-button-has-derivative-data and guided-button-no-derivative-data have the class selected
        !document
          .getElementById("guided-button-has-derivative-data")
          .classList.contains("selected") &&
        !document.getElementById("guided-button-no-derivative-data").classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if your dataset contains derivative data",
        });
        throw errorArray;
      }
    }

    if (pageBeingLeftID === "guided-code-folder-tab") {
      const guidedButtonUserHasCodeData = document.getElementById("guided-button-has-code-data");
      const guidedButtonUserNoCodeData = document.getElementById("guided-button-no-code-data");

      const codeFolder = datasetStructureJSONObj["folders"]["code"];

      if (
        !guidedButtonUserHasCodeData.classList.contains("selected") &&
        !guidedButtonUserNoCodeData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if your dataset contains code data",
        });
        throw errorArray;
      }
      if (guidedButtonUserHasCodeData.classList.contains("selected")) {
        if (
          Object.keys(codeFolder.folders).length === 0 &&
          Object.keys(codeFolder.files).length === 0
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please add code data or indicate that you do not have code data",
          });
          throw errorArray;
        }
        $("#guided-add-code-metadata-tab").attr("data-skip-page", "false");
      }
      if (guidedButtonUserNoCodeData.classList.contains("selected")) {
        if (
          Object.keys(codeFolder.folders).length === 0 &&
          Object.keys(codeFolder.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"]["code"];
          $("#guided-add-code-metadata-tab").attr("data-skip-page", "true");
        } else {
          const { value: deleteCodeFolderWithData } = await Swal.fire({
            title: "Delete code folder?",
            text: "You indicated that your dataset does not contain code data, however, you previously added code data to your dataset. Do you want to delete the code folder?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, keep it!",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          if (deleteCodeFolderWithData) {
            delete datasetStructureJSONObj["folders"]["code"];
            $("#guided-add-code-metadata-tab").attr("data-skip-page", "true");
          } else {
            guidedButtonUserHasCodeData.click();
          }
        }
      }
    }

    if (pageBeingLeftID === "guided-protocol-folder-tab") {
      const guidedButtonUserHasProtocolData = document.getElementById(
        "guided-button-has-protocol-data"
      );
      const guidedButtonUserNoProtocolData = document.getElementById(
        "guided-button-no-protocol-data"
      );

      const protocolFolder = datasetStructureJSONObj["folders"]["protocol"];

      if (
        !guidedButtonUserHasProtocolData.classList.contains("selected") &&
        !guidedButtonUserNoProtocolData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if your dataset contains protocol data",
        });
        throw errorArray;
      }
      if (guidedButtonUserHasProtocolData.classList.contains("selected")) {
        if (
          Object.keys(protocolFolder.folders).length === 0 &&
          Object.keys(protocolFolder.files).length === 0
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please add docs protocol or indicate that you do not have protocol data",
          });
          throw errorArray;
        }
      }
      if (guidedButtonUserNoProtocolData.classList.contains("selected")) {
        if (
          Object.keys(protocolFolder.folders).length === 0 &&
          Object.keys(protocolFolder.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"]["protocol"];
        } else {
          const { value: deleteProtocolFolderWithData } = await Swal.fire({
            title: "Delete protocol folder?",
            text: "You indicated that your dataset does not contain protocol data, however, you previously added protocol data to your dataset. Do you want to delete the protocol folder?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, keep it!",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          if (deleteProtocolFolderWithData) {
            delete datasetStructureJSONObj["folders"]["protocol"];
          } else {
            guidedButtonUserHasProtocolData.click();
          }
        }
      }
    }

    if (pageBeingLeftID === "guided-docs-folder-tab") {
      const guidedButtonUserHasDocsData = document.getElementById("guided-button-has-docs-data");
      const guidedButtonUserNoDocsData = document.getElementById("guided-button-no-docs-data");

      const docsFolder = datasetStructureJSONObj["folders"]["docs"];

      if (
        !guidedButtonUserHasDocsData.classList.contains("selected") &&
        !guidedButtonUserNoDocsData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if your dataset contains docs data",
        });
        throw errorArray;
      }
      if (guidedButtonUserHasDocsData.classList.contains("selected")) {
        if (
          Object.keys(docsFolder.folders).length === 0 &&
          Object.keys(docsFolder.files).length === 0
        ) {
          errorArray.push({
            type: "notyf",
            message: "Please add docs data or indicate that you do not have docs data",
          });
          throw errorArray;
        }
      }
      if (guidedButtonUserNoDocsData.classList.contains("selected")) {
        if (
          Object.keys(docsFolder.folders).length === 0 &&
          Object.keys(docsFolder.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"]["docs"];
        } else {
          const { value: deleteDocsFolderWithData } = await Swal.fire({
            title: "Delete docs folder?",
            text: "You indicated that your dataset does not contain docs data, however, you previously added docs data to your dataset. Do you want to delete the docs folder?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, keep it!",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          if (deleteDocsFolderWithData) {
            delete datasetStructureJSONObj["folders"]["docs"];
          } else {
            guidedButtonUserHasDocsData.click();
          }
        }
      }
    }
    if (pageBeingLeftID === "guided-folder-importation-tab") {
      if (
        !$("#guided-input-destination-getting-started-locally").val() ||
        $("#guided-input-destination-getting-started-locally").val() === "Browse here"
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please select the location of your local datset",
        });
        throw errorArray;
      }
    }
    if (pageBeingLeftID === "guided-create-subjects-metadata-tab") {
      //Save the subject metadata from the subject currently being modified
      addSubject("guided");

      const subjectsAsideItemsCount = document.querySelectorAll(
        ".subjects-metadata-aside-item"
      ).length;
      const subjectsInTableDataCount = subjectsTableData.length - 1;
      if (subjectsAsideItemsCount !== subjectsInTableDataCount) {
        let result = await Swal.fire({
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
          title: "Continue without adding subject metadata to all subjects?",
          text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add subject metadata for all subjects.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Finish adding metadata to all subjects",
          cancelButtonText: "Continue without adding metadata to all subjects",
        });
        if (result.isConfirmed) {
          throw new Error("Returning to subject metadata addition page to complete all fields");
        }
      }
    }
    if (pageBeingLeftID === "guided-create-samples-metadata-tab") {
      //Save the sample metadata from the sample currently being modified
      addSample("guided");

      const samplesAsideItemsCount = document.querySelectorAll(
        ".samples-metadata-aside-item"
      ).length;
      const samplesInTableDataCount = samplesTableData.length - 1;
      if (samplesAsideItemsCount !== samplesInTableDataCount) {
        let result = await Swal.fire({
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
          title: "Continue without adding sample metadata to all samples?",
          text: "In order for your dataset to be in compliance with SPARC's dataset structure, you must add sample metadata for all samples.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Finish adding metadata to all samples",
          cancelButtonText: "Continue without adding metadata to all samples",
        });
        if (result.isConfirmed) {
          throw new Error("Returning to sample metadata addition page to complete all fields");
        }
      }
    }
    if (pageBeingLeftID === "guided-add-code-metadata-tab") {
      const buttonYesComputationalModelingData = document.getElementById(
        "guided-button-has-computational-modeling-data"
      );
      const buttonNoComputationalModelingData = document.getElementById(
        "guided-button-no-computational-modeling-data"
      );

      if (
        !buttonYesComputationalModelingData.classList.contains("selected") &&
        !buttonNoComputationalModelingData.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please specify if your dataset contains computational modeling data",
        });
        throw errorArray;
      }

      if (buttonYesComputationalModelingData.classList.contains("selected")) {
        const codeDescriptionPathElement = document.getElementById(
          "guided-code-description-para-text"
        );
        //check if the innerhtml of the code description path element is a valid path
        if (codeDescriptionPathElement.innerHTML === "") {
          errorArray.push({
            type: "notyf",
            message: "Please import your code description file",
          });
          throw errorArray;
        }

        const codeDescriptionPath = codeDescriptionPathElement.innerHTML;
        //Check if the code description file is valid
        if (!fs.existsSync(codeDescriptionPath)) {
          errorArray.push({
            type: "notyf",
            message: "The imported code_description file is not valid",
          });
          throw errorArray;
        }
      }

      if (buttonNoComputationalModelingData.classList.contains("selected")) {
        //If the user had imported a code description file, remove it
        if (globals.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
          delete globals.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];
        }
      }
    }
    if (pageBeingLeftID === "guided-pennsieve-intro-tab") {
      const confirmAccountbutton = document.getElementById(
        "guided-confirm-pennsieve-account-button"
      );
      if (!confirmAccountbutton.classList.contains("selected")) {
        if (!defaultBfAccount) {
          errorArray.push({
            type: "notyf",
            message: "Please sign in to Pennsieve before continuing",
          });
          throw errorArray;
        } else {
          errorArray.push({
            type: "notyf",
            message: "Please confirm your account before continuing",
          });
          throw errorArray;
        }
      }
    }
    if (pageBeingLeftID === "guided-banner-image-tab") {
      if (globals.sodaJSONObj["digital-metadata"]["banner-image-path"] == undefined) {
        errorArray.push({
          type: "notyf",
          message: "Please add a banner image",
        });
        throw errorArray;
      }
    }

    if (pageBeingLeftID === "guided-designate-permissions-tab") {
      const buttonYesAddAdditionalPermissions = document.getElementById(
        "guided-button-add-additional-permissions"
      );
      const buttonNoNoAdditionalPermissions = document.getElementById(
        "guided-button-no-additional-permissions"
      );

      if (
        !buttonYesAddAdditionalPermissions.classList.contains("selected") &&
        !buttonNoNoAdditionalPermissions.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message:
            "Please indicate if you would like to add additional Pennsieve permissions to your dataset",
        });
        throw errorArray;
      }

      if (buttonNoNoAdditionalPermissions.classList.contains("selected")) {
        //If the user had added additional permissions, remove them
        globals.sodaJSONObj["digital-metadata"]["user-permissions"] = [];
        globals.sodaJSONObj["digital-metadata"]["team-permissions"] = [];
      }
    }

    if (pageBeingLeftID === "guided-add-description-tab") {
      const studyPurposeInput = document.getElementById("guided-pennsieve-study-purpose");
      const studyDataCollectionInput = document.getElementById(
        "guided-pennsieve-study-data-collection"
      );
      const studyPrimaryConclusionInput = document.getElementById(
        "guided-pennsieve-study-primary-conclusion"
      );

      if (studyPurposeInput.value.trim() === "") {
        errorArray.push({
          type: "notyf",
          message: "Please enter your study's purpose",
        });
      }

      if (studyDataCollectionInput.value.trim() === "") {
        errorArray.push({
          type: "notyf",
          message: "Please your study's data collection method",
        });
      }

      if (studyPrimaryConclusionInput.value.trim() === "") {
        errorArray.push({
          type: "notyf",
          message: "Please enter your study's primary conclusion",
        });
      }
      if (errorArray.length > 0) {
        throw errorArray;
      } else {
        globals.sodaJSONObj["digital-metadata"]["description"] = {
          "study-purpose": studyPurposeInput.value.trim(),
          "data-collection": studyDataCollectionInput.value.trim(),
          "primary-conclusion": studyPrimaryConclusionInput.value.trim(),
        };
      }
    }

    if (pageBeingLeftID === "guided-add-tags-tab") {
      let datasetTags = getTagsFromTagifyElement(guidedDatasetTagsTagify);
      //remove duplicates from datasetTags
      datasetTags = [...new Set(datasetTags)];
      globals.sodaJSONObj["digital-metadata"]["dataset-tags"] = datasetTags;
    }

    if (pageBeingLeftID === "guided-assign-license-tab") {
      const licenseCheckbox = document.getElementById("guided-license-checkbox");
      if (!licenseCheckbox.checked) {
        errorArray.push({
          type: "notyf",
          message: "Please accept the application of the CC-BY license to your dataset.",
        });
        throw errorArray;
      }
      setGuidedLicense("Creative Commons Attribution (CC-BY)");
    }
    if (pageBeingLeftID === "guided-dataset-generate-location-tab") {
      const buttonGenerateLocally = document.getElementById(
        "guided-button-generate-dataset-locally"
      );
      const buttonGenerateOnPennsieve = document.getElementById(
        "guided-button-generate-dataset-on-pennsieve"
      );

      // If the user did not select if they would like to import a SPARC award,
      // throw an error
      if (
        !buttonGenerateLocally.classList.contains("selected") &&
        !buttonGenerateOnPennsieve.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate where you would like to genrate your dataset",
        });
        throw errorArray;
      }

      if (buttonGenerateOnPennsieve.classList.contains("selected")) {
        const accountName = document.getElementById("guided-bf-account");
        if (accountName.innerHTML.trim() === "None" || accountName.innerHTML.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please select a Pennsieve account to generate your dataset on",
          });
          throw errorArray;
        }
        globals.sodaJSONObj["generate-dataset"]["destination"] = "bf";
      }
    }
    if (pageBeingLeftID === "guided-dataset-generate-destination-tab") {
      const buttonGenerateOnExistingPennsieveDataset = document.getElementById(
        "guided-button-pennsieve-generate-existing"
      );
      const buttonGenerateOnNewPennsieveDataset = document.getElementById(
        "guided-button-pennsieve-generate-new"
      );

      // If the user did not select if they would like to import a SPARC award,
      // throw an error
      if (
        !buttonGenerateOnExistingPennsieveDataset.classList.contains("selected") &&
        !buttonGenerateOnNewPennsieveDataset.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message:
            "Please indicate if you would like to generate on a new or existing Pennsieve dataset",
        });
        throw errorArray;
      }

      if (buttonGenerateOnExistingPennsieveDataset.classList.contains("selected")) {
        globals.sodaJSONObj["generate-dataset"]["destination"] = "local";
      }

      if (buttonGenerateOnNewPennsieveDataset.classList.contains("selected")) {
        confirmDatasetGenerationNameinput = document.getElementById("guided-input-dataset-name");
        if (confirmDatasetGenerationNameinput.value.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a name for your new Pennsieve dataset",
          });
          throw errorArray;
        }
        globals.sodaJSONObj["digital-metadata"]["name"] = confirmDatasetGenerationNameinput.value.trim();
        globals.sodaJSONObj["generate-dataset"]["destination"] = "bf";
      }
    }

    if (pageBeingLeftID === "guided-folder-structure-preview-tab") {
      //if folders and files in datasetStruture json obj are empty, warn the user
      if (
        Object.keys(datasetStructureJSONObj["folders"]).length === 0 &&
        Object.keys(datasetStructureJSONObj["files"]).length === 0
      ) {
        const { value: continueProgress } = await Swal.fire({
          title: `No folders or files have been added to your dataset.`,
          html: `You can go back and add folders and files to your dataset, however, if
          you choose to generate your dataset on the final step, no folders or files will be
          added to your target destination.`,
          allowEscapeKey: false,
          allowOutsideClick: false,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showConfirmButton: true,
          showCancelButton: true,
          cancelButtonText: "Go back to add folders and files",
          cancelButtonWidth: "200px",
          confirmButtonText: "Continue without adding folders and files",
          reverseSwalButtons: true,
        });
        if (!continueProgress) {
          $(this).removeClass("loading");
          return;
        }
      }

      /*
      // Notify the user of empty pages since this is the last page they can structure their dataset
      const emptyFilesFoldersResponse = await client.post(
        `/curate_datasets/empty_files_and_folders`,
        {
          soda_json_structure: globals.sodaJSONObj,
        },
        { timeout: 0 }
      );
      let { data } = emptyFilesFoldersResponse;
      //bring duplicate outside
      empty_files = data["empty_files"];
      empty_folders = data["empty_folders"];
      let errorMessage = "";
      if (empty_files.length > 0) {
        const error_message_files = backend_to_frontend_warning_message(empty_files);
        errorMessage += error_message_files;
      }
      if (empty_folders.length > 0) {
        const error_message_folders = backend_to_frontend_warning_message(empty_folders);
        errorMessage += error_message_folders;
      }
      if (errorMessage) {
        errorMessage += "Would you like to continue?";
        errorMessage = "<div style='text-align: left'>" + errorMessage + "</div>";
        const { value: continueWithEmptyFolders } = await Swal.fire({
          icon: "warning",
          html: errorMessage,
          showCancelButton: true,
          cancelButtonText: "No, I want to review my files",
          focusCancel: true,
          confirmButtonText: "Yes, Continue",
          backdrop: "rgba(0,0,0, 0.4)",
          reverseButtons: reverseSwalButtons,
          heightAuto: false,
          allowOutsideClick: false,
        });
        if (!continueWithEmptyFolders) {
          errorArray.push({
            type: "notyf",
            message: "Please remove the empty files before continuing",
          });
          throw errorArray;
        }
      }*/
    }
    if (pageBeingLeftID === "guided-manifest-file-generation-tab") {
      const buttonYesAutoGenerateManifestFiles = document.getElementById(
        "guided-button-auto-generate-manifest-files"
      );
      const buttonNoImportManifestFiles = document.getElementById(
        "guided-button-import-manifest-files"
      );

      if (
        !buttonYesAutoGenerateManifestFiles.classList.contains("selected") &&
        !buttonNoImportManifestFiles.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate how you would like to prepare your manifest files",
        });
        throw errorArray;
      }
      if (buttonYesAutoGenerateManifestFiles.classList.contains("selected")) {
      }
    }

    if (pageBeingLeftID === "guided-airtable-award-tab") {
      const buttonYesImportSparcAward = document.getElementById("guided-button-import-sparc-award");
      const buttonNoEnterSparcAwardManually = document.getElementById(
        "guided-button-enter-sparc-award-manually"
      );

      // If the user did not select if they would like to import a SPARC award,
      // throw an error
      if (
        !buttonYesImportSparcAward.classList.contains("selected") &&
        !buttonNoEnterSparcAwardManually.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if you would like to import a SPARC award",
        });
        throw errorArray;
      }

      if (buttonYesImportSparcAward.classList.contains("selected")) {
        const selectedAwardFromDropdown = $("#guided-sparc-award-dropdown option:selected").val();

        if (selectedAwardFromDropdown === "") {
          errorArray.push({
            type: "notyf",
            message: "Please select a SPARC award option from the dropdown menu",
          });
          throw errorArray;
        }

        //Set the sparc award to the imported sparc award's value
        globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
          selectedAwardFromDropdown;
      }

      if (buttonNoEnterSparcAwardManually.classList.contains("selected")) {
        const sparcAwardInput = document.getElementById("guided-input-sparc-award");
        if (sparcAwardInput.value.trim() === "") {
          errorArray.push({
            type: "notyf",
            message: "Please enter a SPARC award",
          });
          throw errorArray;
        }

        globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] =
          sparcAwardInput.value.trim();
        //Delete the imported SPARC award as the user entered the award manually.
        delete globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["imported-sparc-award"];
      }
    }
    if (pageBeingLeftID === "guided-contributors-tab") {
      // Make sure the user has added at least one contributor
      const contributors = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
      if (contributors.length === 0) {
        errorArray.push({
          type: "notyf",
          message: "Please add at least one contributor to your dataset",
        });
        throw errorArray;
      }
    }
    if (pageBeingLeftID === "guided-protocols-tab") {
      const buttonYesUserHasProtocols = document.getElementById("guided-button-user-has-protocols");
      const buttonNoDelayProtocolEntry = document.getElementById(
        "guided-button-delay-protocol-entry"
      );
      if (
        !buttonYesUserHasProtocols.classList.contains("selected") &&
        !buttonNoDelayProtocolEntry.classList.contains("selected")
      ) {
        errorArray.push({
          type: "notyf",
          message: "Please indicate if protocols are ready to be added to your dataset",
        });
        throw errorArray;
      }

      if (buttonYesUserHasProtocols.classList.contains("selected")) {
        let protocols = [];

        const protocolFields = document.querySelectorAll(".guided-protocol-field-container");
        //loop through protocol fields and get protocol values
        const protocolFieldsArray = Array.from(protocolFields);
        protocolFieldsArray.forEach((protocolField) => {
          const protocolUrlInput = protocolField.dataset.protocolUrl;
          const protocolDescriptionInput = protocolField.dataset.protocolDescription;
          const protocolType = protocolField.dataset.protocolType;

          const protocolObj = {
            link: protocolUrlInput,
            type: protocolType,
            relation: "isProtocolFor",
            description: protocolDescriptionInput,
          };
          protocols.push(protocolObj);
        });

        if (protocols.length === 0) {
          errorArray.push({
            type: "notyf",
            message: "Please add at least one protocol",
          });
          throw errorArray;
        }
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = protocols;
      }

      if (buttonNoDelayProtocolEntry.classList.contains("selected")) {
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = [];
      }
    }

    if (pageBeingLeftID === "guided-create-description-metadata-tab") {
      try {
        guidedSaveDescriptionDatasetInformation();
        guidedSaveDescriptionStudyInformation();
        guidedSaveDescriptionContributorInformation();
      } catch (error) {
        console.log(error);
        errorArray.push({
          type: "notyf",
          message: error,
        });
        throw errorArray;
      }
    }

    if (pageBeingLeftID === "guided-create-readme-metadata-tab") {
      const readMeTextArea = document.getElementById("guided-textarea-create-readme");
      if (readMeTextArea.value.trim() === "") {
        errorArray.push({
          type: "notyf",
          message: "Please enter a README for your dataset",
        });
        throw errorArray;
      } else {
        const readMe = readMeTextArea.value.trim();
        globals.sodaJSONObj["dataset-metadata"]["README"] = readMe;
      }
    }
  } catch (error) {
    throw error;
  }
};

const getNonSkippedGuidedModePages = (parentElementToGetChildrenPagesFrom) => {
  let allChildPages = Array.from(
    parentElementToGetChildrenPagesFrom.querySelectorAll(".guided--page")
  );
  const nonSkippedChildPages = allChildPages.filter((page) => {
    //filter out pages with not null data-skipped-page attribute and data-skip-page attribute is not true
    return !page.getAttribute("data-skip-page") || page.getAttribute("data-skip-page") != "true";
  });

  return nonSkippedChildPages;
};

const renderSideBar = (activePage) => {
  const guidedNavItemsContainer = document.getElementById("guided-nav-items");
  const guidedPageNavigationHeader = document.getElementById("guided-page-navigation-header");

  if (activePage === "guided-dataset-dissemination-tab") {
    //Hide the side bar navigawtion and navigation header
    guidedPageNavigationHeader.classList.add("hidden");
    guidedNavItemsContainer.innerHTML = ``;
    return;
  }
  //Show the page navigation header if it had been previously hidden
  guidedPageNavigationHeader.classList.remove("hidden");

  const completedTabs = globals.sodaJSONObj["completed-tabs"];
  const skippedPages = globals.sodaJSONObj["skipped-pages"];

  const pageStructureObject = {};

  const highLevelStepElements = Array.from(document.querySelectorAll(".guided--parent-tab"));

  for (const element of highLevelStepElements) {
    const highLevelStepName = element.getAttribute("data-parent-tab-name");
    pageStructureObject[highLevelStepName] = {};

    const notSkippedPages = getNonSkippedGuidedModePages(element);

    for (const page of notSkippedPages) {
      const pageName = page.getAttribute("data-page-name");
      const pageID = page.getAttribute("id");
      pageStructureObject[highLevelStepName][pageID] = {
        pageName: pageName,
        completed: completedTabs.includes(pageID),
      };
    }
  }
  let navBarHTML = "";
  for (const [highLevelStepName, highLevelStepObject] of Object.entries(pageStructureObject)) {
    // Add the high level drop down to the nav bar
    const dropdDown = `
    <div class="guided--nav-bar-dropdown">
      <p class="guided--help-text mb-0">
        ${highLevelStepName}
      </p>
      <i class="fas fa-chevron-right"></i>
    </div>
  `;

    // Add the high level drop down's children links to the nav bar
    let dropDownContent = ``;
    for (const [pageID, pageObject] of Object.entries(highLevelStepObject)) {
      //add but keep hidden for now!!!!!!!!!!!!!!!!!!
      dropDownContent += `
      <div
        class="
          guided--nav-bar-section-page
          hidden
          ${pageObject.completed ? " completed" : " not-completed"}
          ${pageID === activePage ? "active" : ""}"
        data-target-page="${pageID}"
      >
        <div class="guided--nav-bar-section-page-title">
          ${pageObject.pageName}
        </div>
      </div>
    `;
    }

    // Add each section to the nav bar element
    const dropDownContainer = `
      <div class="guided--nav-bar-section">
        ${dropdDown}
        ${dropDownContent}
      </div>
    `;
    navBarHTML += dropDownContainer;
  }
  guidedNavItemsContainer.innerHTML = navBarHTML;

  const guidedNavBarDropdowns = Array.from(document.querySelectorAll(".guided--nav-bar-dropdown"));
  for (const guidedNavBarDropdown of guidedNavBarDropdowns) {
    guidedNavBarDropdown.addEventListener("click", (event) => {
      //remove hidden from child elements with guided--nav-bar-section-page class
      const guidedNavBarSectionPage = guidedNavBarDropdown.parentElement.querySelectorAll(
        ".guided--nav-bar-section-page"
      );
      for (const guidedNavBarSectionPageElement of guidedNavBarSectionPage) {
        guidedNavBarSectionPageElement.classList.toggle("hidden");
      }
      //toggle the chevron
      const chevron = guidedNavBarDropdown.querySelector("i");
      chevron.classList.toggle("fa-chevron-right");
      chevron.classList.toggle("fa-chevron-down");
    });

    //click the dropdown if it has a child element with data-target-page that matches the active page
    if (guidedNavBarDropdown.parentElement.querySelector(`[data-target-page="${activePage}"]`)) {
      guidedNavBarDropdown.click();
    }
  }

  const guidedNavBarSectionPages = Array.from(
    document.querySelectorAll(".guided--nav-bar-section-page")
  );
  for (const guidedNavBarSectionPage of guidedNavBarSectionPages) {
    guidedNavBarSectionPage.addEventListener("click", async (event) => {
      const currentPageUserIsLeaving = CURRENT_PAGE.attr("id");
      const pageToNavigateTo = guidedNavBarSectionPage.getAttribute("data-target-page");
      const pageToNaviatetoName = document
        .getElementById(pageToNavigateTo)
        .getAttribute("data-page-name");

      // Do nothing if the user clicks the tab of the page they are currently on
      if (currentPageUserIsLeaving === pageToNavigateTo) {
        return;
      }

      try {
        await savePageChanges(currentPageUserIsLeaving);
        const allNonSkippedPages = getNonSkippedGuidedModePages(document).map(
          (element) => element.id
        );
        // Get the pages in the allNonSkippedPages array that cone after the page the user is leaving
        // and before the page the user is going to
        const pagesBetweenCurrentAndTargetPage = allNonSkippedPages.slice(
          allNonSkippedPages.indexOf(currentPageUserIsLeaving),
          allNonSkippedPages.indexOf(pageToNavigateTo)
        );

        //If the user is skipping forward with the nav bar, pages between current page and target page
        //Need to be validated. If they're going backwards, the for loop below will not be ran.
        for (const page of pagesBetweenCurrentAndTargetPage) {
          try {
            await checkIfPageIsValid(page);
          } catch (error) {
            const pageWithErrorName = document.getElementById(page).getAttribute("data-page-name");
            await openPage(page);
            await Swal.fire({
              title: `An error occured on an intermediate page: ${pageWithErrorName}`,
              html: `Please address the issues before continuing to ${pageToNaviatetoName}:
                <br />
                <br />
                <ul>
                  ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
                </ul>
              `,
              icon: "info",
              confirmButtonText: "Fix the errors on this page",
              focusConfirm: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              width: 700,
            });
            return;
          }
        }

        //All pages have been validated. Open the target page.
        await openPage(pageToNavigateTo);
      } catch (error) {
        const pageWithErrorName = CURRENT_PAGE.data("pageName");
        const { value: continueWithoutSavingCurrPageChanges } = await Swal.fire({
          title: "The current page was not able to be saved",
          html: `The following error${
            error.length > 1 ? "s" : ""
          } occurred when attempting to save the ${pageWithErrorName} page:
            <br />
            <br />
            <ul>
              ${error.map((error) => `<li class="text-left">${error.message}</li>`).join("")}
            </ul>
            <br />
            Would you like to continue without saving the changes to the current page?`,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Yes, continue without saving",
          cancelButtonText: "No, I would like to address the errors",
          confirmButtonWidth: 255,
          cancelButtonWidth: 255,
          focusCancel: true,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          width: 700,
        });
        if (continueWithoutSavingCurrPageChanges) {
          await openPage(pageToNavigateTo);
        }
      }
    });
  }

  const nextPagetoComplete = guidedNavItemsContainer.querySelector(
    ".guided--nav-bar-section-page.not-completed"
  );
  if (nextPagetoComplete) {
    nextPagetoComplete.classList.remove("not-completed");
    //Add pulse blue animation for 3 seconds
    nextPagetoComplete.style.borderLeft = "3px solid #007bff";
    nextPagetoComplete.style.animation = "pulse-blue 3s infinite";
  }
};

const updateDatasetUploadProgressTable = (progressObject) => {
  const datasetUploadTableBody = document.getElementById("guided-tbody-dataset-upload");
  //delete datasetUPloadTableBody children with class "upload-status-tr"
  const uploadStatusTRs = datasetUploadTableBody.querySelectorAll(".upload-status-tr");
  for (const uploadStatusTR of uploadStatusTRs) {
    datasetUploadTableBody.removeChild(uploadStatusTR);
  }
  //remove dtasetUploadTableBody children that don't have the id guided-upload-progress-bar-tr
  for (const child of datasetUploadTableBody.children) {
    if (!child.getAttribute("id") === "guided-upload-progress-bar-tr") {
      datasetUploadTableBody.removeChild(child);
    }
  }
  let uploadStatusElement = "";
  for (const [uploadStatusKey, uploadStatusValue] of Object.entries(progressObject))
    uploadStatusElement += `
      <tr class="upload-status-tr">
        <td class="middle aligned progress-bar-table-left">
          <b>${uploadStatusKey}:</b>
        </td>
        <td class="middle aligned remove-left-border">${uploadStatusValue}</td>
      </tr>
    `;
  //insert adjustStatusElement at the end of datasetUploadTablebody
  datasetUploadTableBody.insertAdjacentHTML("beforeend", uploadStatusElement);
};

const guidedLockSideBar = () => {
  const sidebar = document.getElementById("sidebarCollapse");
  const guidedModeSection = document.getElementById("guided_mode-section");
  const guidedDatsetTab = document.getElementById("guided_curate_dataset-tab");
  const guidedNav = document.getElementById("guided-nav");

  if (!sidebar.classList.contains("active")) {
    sidebar.click();
  }
  sidebar.disabled = true;
  guidedModeSection.style.marginLeft = "-70px";
  guidedDatsetTab.style.marginLeft = "215px";
  guidedNav.style.display = "flex";

  /* *************************************************** */
  /* ************  Build the Nav Bar !!!  ************** */
  /* *************************************************** */

  // return data-parent-tab-name for each .guided--parent-tab element
};

const guidedSetCurationTeamUI = (boolSharedWithCurationTeam) => {
  const textSharedWithCurationTeamStatus = document.getElementById(
    "guided-dataset-shared-with-curation-team-status"
  );
  if (boolSharedWithCurationTeam) {
    textSharedWithCurationTeamStatus.innerHTML = "Shared with the SPARC Curation Team";
    $("#guided-button-share-dataset-with-curation-team").hide();
    $("#guided-button-unshare-dataset-with-curation-team").show();
  } else {
    textSharedWithCurationTeamStatus.innerHTML = "Not shared with the SPARC Curation Team";
    $("#guided-button-share-dataset-with-curation-team").show();
    $("#guided-button-unshare-dataset-with-curation-team").hide();
  }
};

const guidedModifyCurationTeamAccess = async (action) => {
  if (action === "share") {
    const guidedShareWithCurationTeamButton = document.getElementById(
      "guided-button-share-dataset-with-curation-team"
    );
    guidedShareWithCurationTeamButton.disabled = true;
    guidedShareWithCurationTeamButton.classList.add("loading");
    const { value: confirmShareWithCurationTeam } = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      focusCancel: true,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "This will inform the Curation Team that your dataset is ready to be reviewed. It is then advised not to make changes to the dataset until the Curation Team contacts you. Would you like to continue?",
    });
    if (confirmShareWithCurationTeam) {
      try {
        await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: "manager",
          },
          {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: globals.sodaJSONObj["digital-metadata"]["name"],
              scope: "team",
              name: "SPARC Data Curation Team",
            },
          }
        );
        guidedSetCurationTeamUI(true);
        swal.fire({
          width: "550px",
          icon: "success",
          title: "Dataset successfully shared with the Curation Team",
          html: `It is now advised that you do not make changes to the dataset until
          the Curation Team follows up with you.`,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          confirmButtonText: "OK",
          focusConfirm: true,
        });
      } catch (error) {
        notyf.open({
          duration: "5000",
          type: "error",
          message: "Error sharing dataset with the Curation Team",
        });
      }
    }
    guidedShareWithCurationTeamButton.disabled = false;
    guidedShareWithCurationTeamButton.classList.remove("loading");
  }
  if (action === "unshare") {
    const guidedUnshareWithCurationTeamButton = document.getElementById(
      "guided-button-unshare-dataset-with-curation-team"
    );
    guidedUnshareWithCurationTeamButton.disabled = true;
    guidedUnshareWithCurationTeamButton.classList.add("loading");

    const { value: confirmUnshareWithCurationTeam } = await Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      cancelButtonText: "No",
      confirmButtonText: "Yes",
      focusCancel: true,
      icon: "warning",
      reverseButtons: reverseSwalButtons,
      showCancelButton: true,
      text: "Are you sure you would like to remove the SPARC Data Curation Team as a manager of this dataset?",
    });
    if (confirmUnshareWithCurationTeam) {
      try {
        await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: "remove current permissions",
          },
          {
            params: {
              selected_account: defaultBfAccount,
              selected_dataset: globals.sodaJSONObj["digital-metadata"]["name"],
              scope: "team",
              name: "SPARC Data Curation Team",
            },
          }
        );
        guidedSetCurationTeamUI(false);
        swal.fire({
          width: "550px",
          icon: "success",
          title: "Dataset successfully unshared with the Curation Team",
          html: `You are now free to make any necessary modifications to your dataset. Once you are
          ready to reshare with the Curation Team, please revisit this page.`,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          confirmButtonText: "OK",
          focusConfirm: true,
        });
      } catch (error) {
        notyf.open({
          duration: "5000",
          type: "error",
          message: "Error removing Curation Team access",
        });
      }
    }
    guidedUnshareWithCurationTeamButton.disabled = false;
    guidedUnshareWithCurationTeamButton.classList.remove("loading");
  }
};

const checkIfDatasetExistsOnPennsieve = async (datasetNameOrID) => {
  let datasetExists = false;
  const datasetList = await api.getDatasetsForAccount(defaultBfAccount);
  for (const dataset of datasetList) {
    if (dataset.name === datasetNameOrID || dataset.id === datasetNameOrID) {
      datasetExists = true;
      break;
    }
  }
  return datasetExists;
};

// Adds the click handlers to the info drop downs in Guided Mode
// The selectors also append the info icon before the label depending on data attributes
// passed in the HTML
const infoDropdowns = document.getElementsByClassName("guided--info-dropdown");
for (const infoDropdown of Array.from(infoDropdowns)) {
  const infoTextElement = infoDropdown.querySelector(".guided--dropdown-text");
  const dropdownType = infoTextElement.dataset.dropdownType;
  if (dropdownType === "info") {
    //insert the info icon before the text
    infoTextElement.insertAdjacentHTML("beforebegin", ` <i class="fas fa-info-circle"></i>`);
  }
  if (dropdownType === "warning") {
    //insert the warning icon before the text
    infoTextElement.insertAdjacentHTML(
      "beforebegin",
      ` <i class="fas fa-exclamation-triangle"></i>`
    );
  }

  infoDropdown.addEventListener("click", () => {
    const infoContainer = infoDropdown.nextElementSibling;
    const infoContainerChevron = infoDropdown.querySelector(".fa-chevron-right");

    const infoContainerIsopen = infoContainer.classList.contains("container-open");

    if (infoContainerIsopen) {
      infoContainerChevron.style.transform = "rotate(0deg)";
      infoContainer.classList.remove("container-open");
    } else {
      infoContainerChevron.style.transform = "rotate(90deg)";
      infoContainer.classList.add("container-open");
    }
  });
}

const guidedSaveAndExit = async (exitPoint) => {
  if (exitPoint === "main-nav" || exitPoint === "sub-nav") {
    const { value: returnToGuidedHomeScreen } = await Swal.fire({
      title: "Are you sure?",
      text: `Exiting Guided Mode will discard any changes you have made on the
      current page. You will be taken back to the homescreen, where you will be able
      to continue the current dataset you are curating which will be located under datasets
      in progress.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Exit guided mode",
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    });
    if (returnToGuidedHomeScreen) {
      globals.guidedUnLockSideBar();
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
      openPage("guided-prepare-helpers-tab");
      hideSubNavAndShowMainNav("back");
      $("#guided-button-dataset-intro-back").click();
      $("#guided-button-dataset-intro-back").click();
    }
  } else if (exitPoint === "intro") {
    const { value: returnToGuidedHomeScreen } = await Swal.fire({
      title: "Are you sure?",
      text: `Transitioning from guided mode to free form mode will cause you to lose
        the progress you have made on the current page. You will still be able to continue
        curating your current dataset by selecting its card on the guided mode homepage.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Exit guided mode",
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    });
    if (returnToGuidedHomeScreen) {
      globals.guidedUnLockSideBar();
      const guidedIntroPage = document.getElementById("guided-intro-page");
      const guidedDatasetNameSubtitlePage = document.getElementById("guided-new-dataset-info");

      if (!guidedIntroPage.classList.contains("hidden")) {
        //click past the intro page
        $("#guided-button-dataset-intro-back").click();
      } else if (!guidedDatasetNameSubtitlePage.classList.contains("hidden")) {
        //click past the dataset name/subtitle page and intro page
        $("#guided-button-dataset-intro-back").click();
        $("#guided-button-dataset-intro-back").click();
      }
    }
  }
};

//Initialize description tagify variables as null
//to make them accessible to functions outside of $(document).ready
let guidedDatasetKeywordsTagify = null;
let guidedStudyTechniquesTagify = null;
let guidedStudyApproachTagify = null;
let guidedStudyOrganSystemsTagify = null;
let guidedOtherFundingsourcesTagify = null;

//main nav variables initialized to first page of guided mode
let CURRENT_PAGE;

/////////////////////////////////////////////////////////
/////////////       Util functions      /////////////////
/////////////////////////////////////////////////////////
const pulseNextButton = () => {
  $("#guided-next-button").addClass("pulse-blue");
};
const unPulseNextButton = () => {
  $("#guided-next-button").removeClass("pulse-blue");
};
const enableProgressButton = () => {
  $("#guided-next-button").prop("disabled", false);
};

const disableElementById = (id) => {
  elementToDisable = document.getElementById(id);
  elementToDisable.style.opacity = "0.5";
  elementToDisable.style.pointerEvents = "none";
};
const enableElementById = (id) => {
  elementToEnable = document.getElementById(id);
  elementToEnable.style.opacity = "1";
  elementToEnable.style.pointerEvents = "auto";
};
const switchElementVisibility = (elementIdToHide, elementIdToShow) => {
  const elementToHide = document.getElementById(elementIdToHide);
  const elementToShow = document.getElementById(elementIdToShow);
  elementToHide.classList.add("hidden");
  elementToShow.classList.remove("hidden");
};
const hideSubNavAndShowMainNav = (navButtonToClick) => {
  $("#guided-sub-page-navigation-footer-div").hide();
  $("#guided-footer-div").css("display", "flex");
  //show the buttons incase they were hidden
  $("#guided-next-button").show();
  $("#guided-back-button").show();
  if (navButtonToClick) {
    if (navButtonToClick === "next") {
      $("#guided-next-button").click();
    }
    if (navButtonToClick === "back") {
      $("#guided-back-button").click();
    }
  }
};

const showMainNav = () => {
  $("#guided-footer-div").css("display", "flex");
};

const scrollToBottomOfGuidedBody = () => {
  const elementToScrollTo = document.querySelector(".guided--body");
  elementToScrollTo.scrollTop = elementToScrollTo.scrollHeight;
};

const getOpenSubPageInPage = (pageID) => {
  const subPageContainer = document.getElementById(pageID);
  const openSubPage = subPageContainer.querySelector(".sub-page:not(.hidden)");
  return openSubPage.id;
};

const openSubPageNavigation = (pageBeingNavigatedTo) => {
  //Get the id of the page that's currently open and might need a refresh
  const openSubPageID = getOpenSubPageInPage(pageBeingNavigatedTo);
  //Refresh data on the open sub-page
  setActiveSubPage(openSubPageID);
  //Hide the footer div while user is in sub-page navigation
  $("#guided-footer-div").hide();
  //Show the sub-page navigation footer
  $("#guided-sub-page-navigation-footer-div").css("display", "flex");
};

const guidedTransitionFromHome = () => {
  //Hide the home screen
  document.getElementById("guided-home").classList.add("hidden");
  //Hide the header and footer for the dataset name/subtitle page
  $("#guided-header-div").hide();
  $("#guided-footer-div").hide();

  //Show the guided mode starting container
  document.getElementById("guided-mode-starting-container").classList.remove("hidden");

  //hide the name+subtitle page and show the intro page
  switchElementVisibility("guided-new-dataset-info", "guided-intro-page");
  //Reset name, subtitle, and subtitle char count
  document.getElementById("guided-dataset-name-input").value = "";
  document.getElementById("guided-dataset-subtitle-input").value = "";
  document.getElementById("guided-subtitle-char-count").innerHTML = `255 characters remaining`;

  guidedLockSideBar();

  //Show the intro footer
  document.getElementById("guided-footer-intro").classList.remove("hidden");
};


const guidedTransitionFromDatasetNameSubtitlePage = () => {
  //Hide dataset name and subtitle parent tab
  document.getElementById("guided-mode-starting-container").classList.add("hidden");
  //hide the intro footer
  document.getElementById("guided-footer-intro").classList.add("hidden");

  //Show the dataset structure page
  $("#prepare-dataset-parent-tab").css("display", "flex");
  $("#guided-header-div").css("display", "flex");
  $("#guided-footer-div").css("display", "flex");

  //Set the current page to the guided curation page
  CURRENT_PAGE = $("#guided-prepare-helpers-tab");

  openPage("guided-prepare-helpers-tab");

  //reset sub-page navigation (Set the first sub-page to be the active sub-page
  //for all pages with sub-pages)
  const subPageCapsuleContainers = Array.from(
    document.querySelectorAll(".guided--capsule-container-sub-page")
  );
  for (const pageCapsule of subPageCapsuleContainers) {
    const firstSubPage = pageCapsule.querySelector(".guided--capsule-sub-page");
    setActiveSubPage(firstSubPage.id.replace("-capsule", ""));
  }
};

const saveGuidedProgress = (guidedProgressFileName) => {
  //return if guidedProgressFileName is not a strnig greater than 0
  if (typeof guidedProgressFileName !== "string" || guidedProgressFileName.length === 0) {
    throw "saveGuidedProgress: guidedProgressFileName must be a string greater than 0";
  }
  //Destination: HOMEDIR/SODA/Guided-Progress
  globals.sodaJSONObj["last-modified"] = new Date();

  //If the user is past the intro/name+subtitle page, save the current page to be resumed later
  if (CURRENT_PAGE) {
    globals.sodaJSONObj["page-before-exit"] = CURRENT_PAGE.attr("id");
  }

  // NOTE: Not looking for existing saves anymore...
  // try {
  //   //create Guided-Progress folder if one does not exist
  //   fs.mkdirSync(guidedProgressFilePath, { recursive: true });
  // } catch (error) {
  //   console.log(error);
  // }
  // var guidedFilePath = path.join(guidedProgressFilePath, guidedProgressFileName + ".json");

  // delete globals.sodaJSONObj["dataset-structure"] value that was added only for the Preview tree view
  if ("files" in globals.sodaJSONObj["dataset-structure"]) {
    globals.sodaJSONObj["dataset-structure"]["files"] = {};
  }

  //Add datasetStructureJSONObj to the globals.sodaJSONObj and use to load the
  //datasetStructureJsonObj when progress resumed
  globals.sodaJSONObj["saved-datset-structure-json-obj"] = datasetStructureJSONObj;
  globals.sodaJSONObj["subjects-table-data"] = subjectsTableData;
  globals.sodaJSONObj["samples-table-data"] = samplesTableData;

  // fs.writeFileSync(guidedFilePath, JSON.stringify(globals.sodaJSONObj, null, 2));
};

const readFileAsync = async (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (error, result) => {
      if (error) {
        throw new Error(error);
      } else {
        resolve(JSON.parse(result));
      }
    });
  });
};

const getProgressFileData = async (progressFile) => {
  let progressFilePath = path.join(guidedProgressFilePath, progressFile + ".json");
  return readFileAsync(progressFilePath);
};
const deleteProgressCard = async (progressCardDeleteButton) => {
  const progressCard = progressCardDeleteButton.parentElement.parentElement;
  const progressCardNameToDelete = progressCard.querySelector(".progress-file-name").textContent;

  const result = await Swal.fire({
    title: `Are you sure you would like to delete SODA progress made on the dataset: ${progressCardNameToDelete}?`,
    text: "Your progress file will be deleted permanently, and all existing progress will be lost.",
    icon: "warning",
    heightAuto: false,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Delete progress file",
    cancelButtonText: "Cancel",
    focusCancel: true,
  });
  if (result.isConfirmed) {
    //Get the path of the progress file to delete
    const progressFilePathToDelete = path.join(
      guidedProgressFilePath,
      progressCardNameToDelete + ".json"
    );
    //delete the progress file
    fs.unlinkSync(progressFilePathToDelete, (err) => {
      console.log(err);
    });

    //remove the progress card from the DOM
    progressCard.remove();
  }
};

const renderManifestCards = () => {
  const guidedManifestData = globals.sodaJSONObj["guided-manifest-files"];
  const highLevelFoldersWithManifestData = Object.keys(guidedManifestData);

  const manifestCards = highLevelFoldersWithManifestData
    .map((highLevelFolder) => {
      return generateManifestEditCard(highLevelFolder);
    })
    .join("\n");

  const manifestFilesCardsContainer = document.getElementById(
    "guided-container-manifest-file-cards"
  );

  manifestFilesCardsContainer.innerHTML = manifestCards;

  smoothScrollToElement(manifestFilesCardsContainer);
};

const generateManifestEditCard = (highLevelFolderName) => {
  return `
    <div class="guided--dataset-card">
      <div class="guided--dataset-card-body shrink">
        <div class="guided--dataset-card-row">
          <h1 class="guided--text-dataset-card">
            <span class="manifest-folder-name">${highLevelFolderName}</span>
          </h1>
        </div>
      </div>
      <div class="guided--container-dataset-card-center">
        <button
          class="ui primary button guided--button-footer"
          style="
            background-color: var(--color-light-green) !important;
            width: 280px !important;
            margin: 4px;
          "
          onClick="guidedOpenManifestEditSwal('${highLevelFolderName}')"
        >
          Preview/Edit ${highLevelFolderName} manifest file
        </button>
      </div>
    </div>
  `;
};

const guidedOpenManifestEditSwal = async (highLevelFolderName) => {
  const existingManifestData = globals.sodaJSONObj["guided-manifest-files"][highLevelFolderName];

  let manifestFileHeaders = existingManifestData["headers"];
  let manifestFileData = existingManifestData["data"];

  let guidedManifestTable;

  const readOnlyHeaders = ["filename", "file type", "timestamp"];

  const { value: saveManifestFiles } = await Swal.fire({
    title:
      "<span style='font-size: 18px !important;'>Edit the manifest file below: </span> <br><span style='font-size: 13px; font-weight: 500'> Tip: Double click on a cell to edit it.<span>",
    html: "<div id='guided-div-manifest-edit'></div>",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: true,
    confirmButtonText: "Confirm",
    showCancelButton: true,
    width: "90%",
    customClass: "swal-large",
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      Swal.hideLoading();
      const manifestSpreadsheetContainer = document.getElementById("guided-div-manifest-edit");
      guidedManifestTable = jspreadsheet(manifestSpreadsheetContainer, {
        tableOverflow: true,
        data: manifestFileData,
        columns: manifestFileHeaders.map((header) => {
          return {
            readOnly: readOnlyHeaders.includes(header) ? true : false,
            type: "text",
            title: header,
            width: 200,
          };
        }),
      });
    },
  });

  if (saveManifestFiles) {
    const savedHeaders = guidedManifestTable.getHeaders().split(",");
    const savedData = guidedManifestTable.getData();

    globals.sodaJSONObj["guided-manifest-files"][highLevelFolderName] = {
      headers: savedHeaders,
      data: savedData,
    };

    //Save the globals.sodaJSONObj with the new manifest file
    saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    //Rerender the manifest cards
    renderManifestCards();
  }
};

const extractFilNamesFromManifestData = (manifestData) => {
  let allFileNamesinDsStructure = [];
  for (const highLevelFolder of Object.keys(manifestData)) {
    for (const row of manifestData[highLevelFolder]["data"]) {
      allFileNamesinDsStructure.push(row[0]);
    }
  }
  //return sorted allFileNamesinDsStructure
  return allFileNamesinDsStructure.sort();
};
const diffCheckManifestFiles = (newManifestData, existingManifestData) => {
  const prevManifestFileNames = extractFilNamesFromManifestData(existingManifestData);
  const newManifestFileNames = extractFilNamesFromManifestData(newManifestData);

  if (JSON.stringify(prevManifestFileNames) === JSON.stringify(newManifestFileNames)) {
    //All files have remained the same, no need to diff check
    return existingManifestData;
  }

  const numImmutableManifestDataCols = 3;

  // Create a hash table for the existing manifest data
  const existingManifestDataHashTable = {};
  for (const highLevelFolderName in existingManifestData) {
    const existingManifestDataHeaders = existingManifestData[highLevelFolderName]["headers"];
    const existingManifestDataData = existingManifestData[highLevelFolderName]["data"];

    for (const row of existingManifestDataData) {
      const fileObj = {};
      const fileName = row[0];
      //Create a new array from row starting at index 2
      const fileData = row.slice(numImmutableManifestDataCols);
      for (const [index, rowValue] of fileData.entries()) {
        const oldHeader = existingManifestDataHeaders[index + numImmutableManifestDataCols];
        fileObj[oldHeader] = rowValue;
      }
      existingManifestDataHashTable[fileName] = fileObj;
    }
  }

  let returnObj = {};

  for (const highLevelFolder of Object.keys(newManifestData)) {
    if (!existingManifestData[highLevelFolder]) {
      //If the high level folder does not exist in the existing manifest data, add it
      returnObj[highLevelFolder] = newManifestData[highLevelFolder];
    } else {
      //If the high level folder does exist in the existing manifest data, update it
      let newManifestReturnObj = {};
      newManifestReturnObj["headers"] = existingManifestData[highLevelFolder]["headers"];
      newManifestReturnObj["data"] = [];

      const rowData = newManifestData[highLevelFolder]["data"];
      for (const row of rowData) {
        const fileName = row[0];

        if (existingManifestDataHashTable[fileName]) {
          //Push the new values generated
          let updatedRow = row.slice(0, numImmutableManifestDataCols);

          for (const header of newManifestReturnObj["headers"].slice(
            numImmutableManifestDataCols
          )) {
            updatedRow.push(existingManifestDataHashTable[fileName][header]);
          }
          newManifestReturnObj["data"].push(updatedRow);
        } else {
          //If the file does not exist in the existing manifest data, add it
          newManifestReturnObj["data"].push(row);
        }
        returnObj[highLevelFolder] = newManifestReturnObj;
      }
    }
  }

  return returnObj;
};

document
  .getElementById("guided-button-auto-generate-manifest-files")
  .addEventListener("click", async () => {
    //Wait for current call stack to finish
    await new Promise((r) => setTimeout(r, 0));

    const manifestFilesCardsContainer = document.getElementById(
      "guided-container-manifest-file-cards"
    );

    manifestFilesCardsContainer.innerHTML = `
    <div class="guided--section">
    <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
    </div>
    Updating your dataset's manifest files...
    `;

    scrollToBottomOfGuidedBody();

    try {
      // Retrieve the manifest data to be used to generate the manifest files
      const res = await client.post(
        `/curate_datasets/guided_generate_high_level_folder_manifest_data`,
        {
          dataset_structure_obj: datasetStructureJSONObj,
        },
        { timeout: 0 }
      );
      const manifestRes = res.data;
      //loop through each of the high level folders and store their manifest headers and data
      //into the globals.sodaJSONObj

      let newManifestData = {};

      for (const [highLevelFolderName, manifestFileData] of Object.entries(manifestRes)) {
        //Only save manifest files for hlf that returned more than the headers
        //(meaning manifest file data was generated in the response)
        if (manifestFileData.length > 1) {
          //Remove the first element from the array and set it as the headers
          const manifestHeader = manifestFileData.shift();

          newManifestData[highLevelFolderName] = {
            headers: manifestHeader,
            data: manifestFileData,
          };
        }
      }
      const existingManifestData = globals.sodaJSONObj["guided-manifest-files"];
      let updatedManifestData;

      if (existingManifestData) {
        updatedManifestData = diffCheckManifestFiles(newManifestData, existingManifestData);
      } else {
        updatedManifestData = newManifestData;
      }

      globals.sodaJSONObj["guided-manifest-files"] = updatedManifestData;
      // Save the globals.sodaJSONObj with the new manifest files
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (err) {
      console.log(err);
      clientError(err);
      userError(err);
    }

    //Rerender the manifest cards
    renderManifestCards();
  });

$("#guided-sparc-award-dropdown").selectpicker();

const renderGuidedAwardSelectionDropdown = () => {
  $("#guided-sparc-award-dropdown").selectpicker("refresh");
  const awardDropDownElements = document.getElementById("guided-sparc-award-dropdown");

  //reset the options before adding new ones
  awardDropDownElements.innerHTML = "";
  $("#guided-sparc-award-dropdown").selectpicker("refresh");

  // Append the select an award option
  const selectAnAwardOption = document.createElement("option");
  selectAnAwardOption.textContent = "Select an award";
  selectAnAwardOption.value = "";
  selectAnAwardOption.selected = true;
  awardDropDownElements.appendChild(selectAnAwardOption);

  const currentSparcAward = globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];

  for (const [val, key] of Object.entries(awardObj)) {
    let awardElement = document.createElement("option");
    awardElement.textContent = key;
    awardElement.value = val;
    if (currentSparcAward && currentSparcAward === val) {
      awardElement.selected = true;
    }

    awardDropDownElements.appendChild(awardElement);
  }

  $("#guided-sparc-award-dropdown").selectpicker("refresh");
};

document
  .getElementById("guided-button-refresh-sparc-award-dropdown")
  .addEventListener("click", () => {
    //Update the dropdown
    renderGuidedAwardSelectionDropdown();
    //Notify the user that the dropdown has been updated
    notyf.open({
      duration: "4000",
      type: "success",
      message: "The SPARC Award dropdown was successfully updated",
    });
  });

document.getElementById("guided-button-import-sparc-award").addEventListener("click", async () => {
  const divToShowWhenConnected = document.getElementById("guided-div-imported-SPARC-award");
  const divToShowWhenNotConnected = document.getElementById("guided-div-connect-airtable");
  const guidedButtonConnectAirtableAccount = document.getElementById(
    "guided-button-connect-airtable-account"
  );
  const airTableKeyObj = parseJson(airtableConfigPath);

  if (Object.keys(airTableKeyObj).length === 0) {
    //If the airtable key object is empty, show the div to connect to airtable
    divToShowWhenConnected.classList.add("hidden");
    divToShowWhenNotConnected.classList.remove("hidden");
  } else {
    const airTablePreviewText = document.getElementById("guided-current-sparc-award");
    airTablePreviewText.innerHTML = airTableKeyObj["key-name"];
    //If the airtable key object is not empty, show the div to select the SPARC award
    divToShowWhenConnected.classList.remove("hidden");
    divToShowWhenNotConnected.classList.add("hidden");
    renderGuidedAwardSelectionDropdown();
  }
});

const setActiveCapsule = (targetPageID) => {
  $(".guided--capsule").removeClass("active");
  let targetCapsuleID = targetPageID.replace("-tab", "-capsule");
  let targetCapsule = $(`#${targetCapsuleID}`);
  //check if targetCapsule parent has the class guided--capsule-container-branch
  if (targetCapsule.parent().hasClass("guided--capsule-container-branch")) {
    $(".guided--capsule-container-branch").hide();
    targetCapsule.parent().css("display", "flex");
  }
  targetCapsule.addClass("active");
};

const setActiveProgressionTab = (targetPageID) => {
  $(".guided--progression-tab").removeClass("selected-tab");
  let targetPageParentID = $(`#${targetPageID}`).parent().attr("id");
  let targetProgressionTabID = targetPageParentID.replace("parent-tab", "progression-tab");
  let targetProgressionTab = $(`#${targetProgressionTabID}`);
  targetProgressionTab.addClass("selected-tab");
};

const handlePageBranching = (selectedCardElement) => {
  //hide capsule containers for page branches that are not selected
  const capsuleContainerID = selectedCardElement
    .attr("id")
    .replace("card", "branch-capsule-container");
  $(".guided--capsule-container-branch").hide();
  $(`#${capsuleContainerID}`).css("display", "flex");

  //handle skip pages following card
  if (selectedCardElement.data("branch-pages-group-class")) {
    const branchPagesGroupClass = selectedCardElement.attr("data-branch-pages-group-class");
    $(`.${branchPagesGroupClass}`).attr("data-skip-page", "true");
    const pageBranchToRemoveSkip = selectedCardElement.attr("id").replace("card", "branch-page");
    $(`.${pageBranchToRemoveSkip}`).attr("data-skip-page", "false");
  }

  selectedCardElement.siblings().removeClass("checked");
  selectedCardElement.siblings().addClass("non-selected");
  selectedCardElement.removeClass("non-selected");
  selectedCardElement.addClass("checked");

  const tabPanelId = selectedCardElement.attr("id").replace("card", "panel");
  const tabPanel = $(`#${tabPanelId}`);
  //checks to see if clicked card has a panel, if so, hides siblings and smooth scrolls to it
  if (tabPanel.length != 0) {
    tabPanel.siblings().hide();
    tabPanel.css("display", "flex");
    tabPanel[0].scrollIntoView({
      behavior: "smooth",
    });
  }
};

function guidedShowTreePreview(new_dataset_name, targetElement) {
  const dsJsonObjCopy = JSON.parse(JSON.stringify(datasetStructureJSONObj));

  //Add the Readme file to the preview if it exists in JSON
  if (globals.sodaJSONObj["dataset-metadata"]["README"]) {
    dsJsonObjCopy["files"]["README.txt"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the Subjects metadata file to the preview if at least one subject has been added
  if (subjectsTableData.length > 0) {
    dsJsonObjCopy["files"]["subjects.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the Samples metadata file to the preview if at least one sample has been added
  if (samplesTableData.length > 0) {
    dsJsonObjCopy["files"]["samples.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the code_description metadata file to the preview if the code_description path has been declared
  if (globals.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]) {
    dsJsonObjCopy["files"]["code_description.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the manifest files that have been created to the preview
  for (const manifestFileKey of Object.keys(globals.sodaJSONObj["guided-manifest-files"])) {
    dsJsonObjCopy["folders"][manifestFileKey]["files"]["manifest.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the submission metadata file to the preview if the submission metadata page has been completed
  if (globals.sodaJSONObj["completed-tabs"].includes("guided-create-submission-metadata-tab")) {
    dsJsonObjCopy["files"]["submission.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  //Add the dataset_description metadata file to the preview if the dataset_description page has been completed
  if (globals.sodaJSONObj["completed-tabs"].includes("guided-create-description-metadata-tab")) {
    dsJsonObjCopy["files"]["dataset_description.xlsx"] = {
      action: ["new"],
      path: "",
      type: "local",
    };
  }

  const guidedJsTreePreviewData = create_child_node(
    dsJsonObjCopy,
    new_dataset_name,
    "folder",
    "",
    true,
    false,
    false,
    "",
    "preview"
  );
  $(targetElement).jstree(true).settings.core.data = guidedJsTreePreviewData;
  $(targetElement).jstree(true).refresh();
  //Open Jstree element with passed in folder node name
  const openFolder = (folderName) => {
    const tree = $("#jstree").jstree(true);
    const node = tree.get_node(folderName);
    tree.open_node(node);
  };
}

const guidedUpdateFolderStructure = (highLevelFolder, subjectsOrSamples) => {
  //add high level folder if it does not exist
  if (!datasetStructureJSONObj["folders"][highLevelFolder]) {
    datasetStructureJSONObj["folders"][highLevelFolder] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  }
  //Add pools to the datsetStructuresJSONObj if they don't exist
  const pools = Object.keys(globals.sodaJSONObj.getPools());
  for (const pool of pools) {
    if (!datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool]) {
      datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool] = {
        folders: {},
        files: {},
        type: "",
        action: [],
      };
    }
  }
  if (subjectsOrSamples === "subjects") {
    //Add subjects to datsetStructuresJSONObj if they don't exist
    const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
    for (subject of subjectsInPools) {
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
          "folders"
        ][subject.subjectName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName]["folders"][
          subject.subjectName
        ] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
    for (subject of subjectsOutsidePools) {
      if (!datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName]) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
  }

  if (subjectsOrSamples === "samples") {
    //Add samples to datsetStructuresJSONObj if they don't exist
    const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
    for (sample of samplesInPools) {
      /**
       * Check to see if the sample's pool is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (!datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      /**
       * Check to see if the sample's subject is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]["folders"][
          sample.subjectName
        ]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]["folders"][
          sample.subjectName
        ] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      /**
       * Check to see if the sample's folder is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]["folders"][
          sample.subjectName
        ]["folders"][sample.sampleName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName]["folders"][
          sample.subjectName
        ]["folders"][sample.sampleName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
    for (sample of samplesOutsidePools) {
      /**
       * Check to see if the sample's subject is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (!datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName]) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      /**
       * Check to see if the sample's folder is in the datasetStructureJSONObj.
       * If not, add it.
       */
      if (
        !datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
  }
};

const cleanUpEmptyGuidedStructureFolders = async (
  highLevelFolder,
  subjectsOrSamples,
  boolCleanUpAllGuidedStructureFolders
) => {
  if (subjectsOrSamples === "subjects") {
    //Remove subjects from datsetStructuresJSONObj if they don't exist
    const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();

    if (boolCleanUpAllGuidedStructureFolders === true) {
      //Delete folders for pools
      for (const subject of subjectsInPools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
            "folders"
          ][subject.subjectName];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
            "folders"
          ][subject.subjectName];
        }
      }

      //Delete all folders for subjects outside of pools
      for (const subject of subjectsOutsidePools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
            subject.subjectName
          ];
        }
      }

      //Delete all pools with empty folders
      const pools = globals.sodaJSONObj.getPools();
      for (const pool of Object.keys(pools)) {
        const poolFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
        if (
          Object.keys(poolFolderContents.folders).length === 0 &&
          Object.keys(poolFolderContents.files).length === 0
        ) {
          delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
        }
      }

      //Delete the high level folder if no folders or files were added
      const highLevelFolderContents = datasetStructureJSONObj["folders"][highLevelFolder];
      if (
        Object.keys(highLevelFolderContents.folders).length === 0 &&
        Object.keys(highLevelFolderContents.files).length === 0
      ) {
        delete datasetStructureJSONObj["folders"][highLevelFolder];
      }

      return true;
    } else {
      const subjectsWithEmptyFolders = [];

      //loop through subjectsInPools and add subjects with empty folders to subjectsWithEmptyFolders
      for (const subject of subjectsInPools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
            "folders"
          ][subject.subjectName];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          subjectsWithEmptyFolders.push(subject);
        }
      }

      //loop through subjectsOutsidePools and add subjects with empty folders to subjectsWithEmptyFolders
      for (const subject of subjectsOutsidePools) {
        const subjectFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName];
        if (
          Object.keys(subjectFolderContents.folders).length === 0 &&
          Object.keys(subjectFolderContents.files).length === 0
        ) {
          subjectsWithEmptyFolders.push(subject);
        }
      }

      if (subjectsWithEmptyFolders.length > 0) {
        let result = await Swal.fire({
          heightAuto: false,
          backdrop: "rgba(0,0,0,0.4)",
          icon: "warning",
          title: "Missing data",
          html: `${highLevelFolder} data was not added to the following subjects:<br /><br />
            <ul>
              ${subjectsWithEmptyFolders
                .map((subject) => `<li class="text-left">${subject.subjectName}</li>`)
                .join("")}
            </ul>`,
          reverseButtons: true,
          showCancelButton: true,
          cancelButtonColor: "#6e7881",
          cancelButtonText: `Finish adding ${highLevelFolder} data to subjects`,
          confirmButtonText: `Continue without adding ${highLevelFolder} data to all subjects`,
        });
        if (result.isConfirmed) {
          for (subject of subjectsWithEmptyFolders) {
            if (subject.poolName) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][subject.subjectName];
            } else {
              console.log(
                datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.subjectName]
              );
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.subjectName
              ];
            }
          }
          //Delete all pools with empty folders
          const pools = globals.sodaJSONObj.getPools();
          for (const pool of Object.keys(pools)) {
            const poolFolderContents =
              datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
            if (
              Object.keys(poolFolderContents.folders).length === 0 &&
              Object.keys(poolFolderContents.files).length === 0
            ) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
            }
          }
          return true;
        }
      } else {
        //Delete all pools with empty folders
        const pools = globals.sodaJSONObj.getPools();
        for (const pool of Object.keys(pools)) {
          const poolFolderContents =
            datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
          if (
            Object.keys(poolFolderContents.folders).length === 0 &&
            Object.keys(poolFolderContents.files).length === 0
          ) {
            delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][pool];
          }
        }
        return true;
      }
    }
  }

  if (subjectsOrSamples === "samples") {
    //Get samples to check if their folders are
    const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();

    if (boolCleanUpAllGuidedStructureFolders === true) {
      //delete all folders for samples in pools
      for (const sample of samplesInPools) {
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
          "folders"
        ][sample.subjectName]["folders"][sample.sampleName];
      }
      //delete all folders for samples outside of pools
      for (const sample of samplesOutsidePools) {
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
          "folders"
        ][sample.sampleName];
      }

      return true;
    } else {
      const samplesWithEmptyFolders = [];

      //loop through samplesInPools and add samples with empty folders to samplesWithEmptyFolders
      for (const sample of samplesInPools) {
        const sampleFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
            "folders"
          ][sample.subjectName]["folders"][sample.sampleName];
        if (
          Object.keys(sampleFolderContents.folders).length === 0 &&
          Object.keys(sampleFolderContents.files).length === 0
        ) {
          samplesWithEmptyFolders.push(sample);
        }
      }
      //loop through samplesOutsidePools and add samples with empty folders to samplesWithEmptyFolders
      for (const sample of samplesOutsidePools) {
        const sampleFolderContents =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
            "folders"
          ][sample.sampleName];
        if (
          Object.keys(sampleFolderContents.folders).length === 0 &&
          Object.keys(sampleFolderContents.files).length === 0
        ) {
          samplesWithEmptyFolders.push(sample);
        }
      }

      if (samplesWithEmptyFolders.length > 0) {
        let result = await Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          title: "Missing data",
          html: `${highLevelFolder} data was not added to the following samples:<br /><br />
            <ul>
              ${samplesWithEmptyFolders
                .map(
                  (sample) =>
                    `<li class="text-left">${sample.subjectName}/${sample.sampleName}</li>`
                )
                .join("")}
            </ul>`,
          icon: "warning",
          reverseButtons: true,
          showCancelButton: true,
          cancelButtonColor: "#6e7881",
          cancelButtonText: `Finish adding ${highLevelFolder} data to samples`,
          confirmButtonText: `Continue without adding ${highLevelFolder} data to all samples`,
        });
        //If the user indicates they do not have any subjects, skip to source folder
        if (result.isConfirmed) {
          //delete empty samples from the datasetStructureJSONObj
          for (sample of samplesWithEmptyFolders) {
            if (sample.poolName) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                sample.poolName
              ]["folders"][sample.subjectName]["folders"][sample.sampleName];
            } else {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                sample.subjectName
              ]["folders"][sample.sampleName];
            }
          }
          return true;
        }
      } else {
        return true;
      }
    }
  }
};

const updateGuidedRadioButtonsFromJSON = (parentPageID) => {
  const parentPage = document.getElementById(parentPageID);
  const guidedRadioButtons = parentPage.querySelectorAll(".guided--radio-button");
  for (const guidedRadioButton of guidedRadioButtons) {
    //Get the button config value from the UI
    const buttonConfigValue = guidedRadioButton.getAttribute("data-button-config-value");
    if (buttonConfigValue) {
      const buttonConfigValueState = guidedRadioButton.getAttribute(
        "data-button-config-value-state"
      );
      if (globals.sodaJSONObj["button-config"][buttonConfigValue] === buttonConfigValueState) {
        //click the button
        guidedRadioButton.click();
      }
    }
  }
};

const guidedLoadDescriptionDatasetInformation = () => {
  const descriptionMetadata =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"];

  guidedDatasetKeywordsTagify.removeAllTags();

  if (descriptionMetadata) {
    //check the checkbox for the study type where name is dataset-relation
    const studyType = descriptionMetadata["type"];
    const studyTypeRadioButton = document.querySelector(
      `input[name='dataset-relation'][value='${studyType}']`
    );
    if (studyTypeRadioButton) {
      studyTypeRadioButton.checked = true;
    }
    guidedDatasetKeywordsTagify.addTags(descriptionMetadata["keywords"]);
  } else {
    //reset the study type checkboxes
    const studyTypeRadioButtons = document.querySelectorAll("input[name='dataset-relation']");
    for (const studyTypeRadioButton of studyTypeRadioButtons) {
      studyTypeRadioButton.checked = false;
    }
  }
};

const guidedLoadDescriptionStudyInformation = () => {
  const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
  const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
  const studyPrimaryConclusionInput = document.getElementById("guided-ds-study-primary-conclusion");
  const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");

  //reset dataset descript tags
  guidedStudyOrganSystemsTagify.removeAllTags();
  guidedStudyApproachTagify.removeAllTags();
  guidedStudyTechniquesTagify.removeAllTags();

  const studyInformationMetadata =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"];

  if (studyInformationMetadata) {
    studyPurposeInput.value = studyInformationMetadata["study purpose"];
    studyDataCollectionInput.value = studyInformationMetadata["study data collection"];
    studyPrimaryConclusionInput.value = studyInformationMetadata["study primary conclusion"];
    studyCollectionTitleInput.value = studyInformationMetadata["study collection title"];

    guidedStudyOrganSystemsTagify.addTags(studyInformationMetadata["study organ system"]);
    guidedStudyApproachTagify.addTags(studyInformationMetadata["study approach"]);
    guidedStudyTechniquesTagify.addTags(studyInformationMetadata["study technique"]);
  } else {
    //reset the inputs
    studyPurposeInput.value = "";
    studyDataCollectionInput.value = "";
    studyPrimaryConclusionInput.value = "";
    studyCollectionTitleInput.value = "";
    guidedStudyOrganSystemsTagify.removeAllTags();
    guidedStudyApproachTagify.removeAllTags();
    guidedStudyTechniquesTagify.removeAllTags();
  }
};

const guidedLoadDescriptionContributorInformation = () => {
  const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
  const contributorInformationMetadata =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"];

  guidedOtherFundingsourcesTagify.removeAllTags();

  if (contributorInformationMetadata) {
    acknowledgementsInput.value = contributorInformationMetadata["acknowledgment"];
    //Add tags besides the sparc award
    guidedOtherFundingsourcesTagify.addTags(
      contributorInformationMetadata["funding"].filter((fudingSource) => {
        return fudingSource !== globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      })
    );
  } else {
    acknowledgementsInput.value = "";
    guidedOtherFundingsourcesTagify.removeAllTags();
  }
};

const guidedResetUserTeamPermissionsDropdowns = () => {
  $("#guided_bf_list_users_and_teams").val("Select individuals or teams to grant permissions to");
  $("#guided_bf_list_users_and_teams").selectpicker("refresh");
  $("#select-permission-list-users-and-teams").val("Select role");
};

let addListener = true;
function copyLink(link) {
  const copyIcon = document.getElementById("guided-pennsieve-copy-icon");
  Clipboard.writeText(link);
  copyIcon.classList.remove("fa-copy");
  copyIcon.classList.add("fa-check");

  notyf.open({
    duration: "2000",
    type: "success",
    message: "Link copied!",
  });
}

const validatePageArray = async (arrayOfPagesToCheck) => {
  const x = getNonSkippedGuidedModePages(document);
  for (const page of x) {
    try {
      await checkIfPageIsValid(page.id);
    } catch (error) {
      await openPage(page.id);
      break;
    }
  }
};

const checkIfPageIsValid = async (pageID) => {
  try {
    await openPage(pageID);
    await savePageChanges(pageID);
  } catch (error) {
    throw error;
  }
};

//Main function that prepares individual pages based on the state of the globals.sodaJSONObj
//The general flow is to check if there is values for the keys relevant to the page
//If the keys exist, extract the data from the globals.sodaJSONObj and populate the page
//If the keys do not exist, reset the page (inputs, tables etc.) to the default state
const openPage = async (targetPageID) => {
  let itemsContainer = document.getElementById("items-guided-container");
  if (itemsContainer.classList.contains("border-styling")) {
    itemsContainer.classList.remove("border-styling");
  }
  try {
    //reset the radio buttons for the page being navigated to
    globals.resetGuidedRadioButtons(targetPageID);
    //update the radio buttons using the button config from globals.sodaJSONObj
    updateGuidedRadioButtonsFromJSON(targetPageID);
    //Show the main nav bar
    //Note: if other nav bar needs to be shown, it will be handled later in this function
    hideSubNavAndShowMainNav(false);

    //Hide the high level progress steps and green pills if the user is on the before getting started page
    if (targetPageID === "guided-prepare-helpers-tab") {
      document.getElementById("structure-dataset-capsule-container").classList.add("hidden");
      document.querySelector(".guided--progression-tab-container").classList.add("hidden");
    } else {
      document.getElementById("structure-dataset-capsule-container").classList.remove("hidden");
      document.querySelector(".guided--progression-tab-container").classList.remove("hidden");
    }

    if (
      targetPageID === "guided-dataset-generation-confirmation-tab" ||
      targetPageID === "guided-dataset-generation-tab" ||
      targetPageID === "guided-dataset-dissemination-tab"
    ) {
      $("#guided-next-button").css("visibility", "hidden");
    } else {
      $("#guided-next-button").css("visibility", "visible");
    }

    if (
      targetPageID === "guided-dataset-dissemination-tab" ||
      targetPageID === "guided-dataset-generation-tab"
    ) {
      $("#guided-back-button").css("visibility", "hidden");
    } else {
      $("#guided-back-button").css("visibility", "visible");
    }

    if (targetPageID === "guided-prepare-helpers-tab") {
      //Hide the new dataset and existings local dataset capsule containers because
      //We do now know what the user wants to do yet
      $("#guided-curate-new-dataset-branch-capsule-container").hide();
      $("#guided-curate-existing-local-dataset-branch-capsule-container").hide();
      const dataDeliverableButton = document.getElementById("getting-started-data-deliverable-btn");
      const airTableGettingStartedBtn = document.getElementById(
        "getting-started-button-import-sparc-award"
      );
      const importedDataDeliverable =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["filepath"];

      if (importedDataDeliverable) {
        dataDeliverableButton.children[0].style.display = "none";
        dataDeliverableButton.children[1].style.display = "flex";
      } else {
        dataDeliverableButton.children[0].style.display = "flex";
        dataDeliverableButton.children[1].style.display = "none";
      }

      // var airKeyContent = parseJson(airtableConfigPath);
      // if (Object.keys(airKeyContent).length != 0) {
      //   //This is where we update the UI for the helper page
      //   airTableGettingStartedBtn.children[1].style.display = "none";
      //   airTableGettingStartedBtn.children[0].style.display = "flex";
      //   // This auto selects the airtable button within
      //   // the SPARC Award number page
      //   // document.getElementById("guided-button-import-sparc-award").click();
      // } else {
        //This is where we reset the UI for the helper page
        airTableGettingStartedBtn.children[1].style.display = "flex";
        airTableGettingStartedBtn.children[0].style.display = "none";
      // }
    }

    if (targetPageID === "guided-subjects-folder-tab") {
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-primary-data-organization-tab") {
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-source-data-organization-tab") {
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-derivative-data-organization-tab") {
      openSubPageNavigation(targetPageID);
    }

    if (targetPageID === "guided-protocol-folder-tab") {
      //Append the guided-file-explorer element to the derivative folder organization container
      $("#guided-file-explorer-elements").appendTo($("#guided-user-has-protocol-data"));
      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document.getElementById("guided-file-explorer-elements").classList.remove("hidden");
    }

    if (targetPageID === "guided-code-folder-tab") {
      itemsContainer.classList.add("border-styling");
      const codeFolder = datasetStructureJSONObj["folders"]["code"];
      if (!codeFolder) {
        //create a docs folder
        datasetStructureJSONObj["folders"]["code"] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo($("#guided-user-has-code-data"));
      updateFolderStructureUI(highLevelFolderPageData.code);

      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document.getElementById("guided-file-explorer-elements").classList.remove("hidden");
    }

    if (targetPageID === "guided-protocol-folder-tab") {
      itemsContainer.classList.add("border-styling");
      const protocolFolder = datasetStructureJSONObj["folders"]["protocol"];
      if (!protocolFolder) {
        //create a docs folder
        datasetStructureJSONObj["folders"]["protocol"] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo($("#guided-user-has-protocol-data"));
      updateFolderStructureUI(highLevelFolderPageData.protocol);

      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document.getElementById("guided-file-explorer-elements").classList.remove("hidden");
    }

    if (targetPageID === "guided-docs-folder-tab") {
      itemsContainer.classList.add("border-styling");
      const docsFolder = datasetStructureJSONObj["folders"]["docs"];
      if (!docsFolder) {
        //create a docs folder
        datasetStructureJSONObj["folders"]["docs"] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
      //Append the guided-file-explorer element to the docs folder organization container
      $("#guided-file-explorer-elements").appendTo($("#guided-user-has-docs-data"));
      updateFolderStructureUI(highLevelFolderPageData.docs);
      //Remove hidden class from file explorer element in case it was hidden
      //when showing the intro for prim/src/deriv organization
      document.getElementById("guided-file-explorer-elements").classList.remove("hidden");
    }

    if (targetPageID === "guided-folder-structure-preview-tab") {
      const folderStructurePreview = document.getElementById("guided-folder-structure-review");
      $(folderStructurePreview).jstree({
        core: {
          check_callback: true,
          data: {},
        },
        plugins: ["types"],
        types: {
          folder: {
            icon: "fas fa-folder fa-fw",
          },
          "folder open": {
            icon: "fas fa-folder-open fa-fw",
          },
          "folder closed": {
            icon: "fas fa-folder fa-fw",
          },
          "file xlsx": {
            icon: "./assets/img/excel-file.png",
          },
          "file xls": {
            icon: "./assets/img/excel-file.png",
          },
          "file png": {
            icon: "./assets/img/png-file.png",
          },
          "file PNG": {
            icon: "./assets/img/png-file.png",
          },
          "file pdf": {
            icon: "./assets/img/pdf-file.png",
          },
          "file txt": {
            icon: "./assets/img/txt-file.png",
          },
          "file csv": {
            icon: "./assets/img/csv-file.png",
          },
          "file CSV": {
            icon: "./assets/img/csv-file.png",
          },
          "file DOC": {
            icon: "./assets/img/doc-file.png",
          },
          "file DOCX": {
            icon: "./assets/img/doc-file.png",
          },
          "file docx": {
            icon: "./assets/img/doc-file.png",
          },
          "file doc": {
            icon: "./assets/img/doc-file.png",
          },
          "file jpeg": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file JPEG": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file other": {
            icon: "./assets/img/other-file.png",
          },
        },
      });
      $(folderStructurePreview).on("open_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder open");
      });
      $(folderStructurePreview).on("close_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder closed");
      });
      guidedShowTreePreview(globals.sodaJSONObj["digital-metadata"]["name"], folderStructurePreview);
    }

    if (targetPageID === "guided-manifest-file-generation-tab") {
      // Note: manifest file auto-generation is handled by an event listener on the button
      // with the ID: guided-button-auto-generate-manifest-files

      //Delete any manifest files in the dataset structure.
      for (const folder of Object.keys(datasetStructureJSONObj["folders"])) {
        if (datasetStructureJSONObj["folders"][folder]["files"]["manifest.xlsx"]) {
          delete datasetStructureJSONObj["folders"][folder]["files"]["manifest.xlsx"];
        }
      }
    }

    if (targetPageID === "guided-airtable-award-tab") {
      const sparcAward = globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];

      const sparcAwardInput = document.getElementById("guided-input-sparc-award");
      //If a sparc award exists, set the sparc award input
      //If not, reset the input
      if (sparcAward) {
        sparcAwardInput.value = sparcAward;
      } else {
        sparcAwardInput.value = "";
      }
    }

    if (targetPageID === "guided-create-submission-metadata-tab") {
      let submission_metadata = globals.sodaJSONObj["dataset-metadata"]["submission-metadata"];

      let dataDeliverableLottieContainer = document.getElementById(
        "data-deliverable-lottie-container"
      );
      let dataDeliverableParaText = document.getElementById("guided-data-deliverable-para-text");

      if (Object.keys(submission_metadata).length > 0) {
        if (submission_metadata["filepath"]) {
          dataDeliverableLottieContainer.innerHTML = "";
          lottie.loadAnimation({
            container: dataDeliverableLottieContainer,
            animationData: successCheck,
            renderer: "svg",
            loop: false,
            autoplay: true,
          });
          dataDeliverableParaText.innerHTML = submission_metadata["filepath"];
        } else {
          //reset the code metadata lotties and para text
          dataDeliverableLottieContainer.innerHTML = "";
          lottie.loadAnimation({
            container: dataDeliverableLottieContainer,
            animationData: dragDrop,
            renderer: "svg",
            loop: true,
            autoplay: true,
          });
          dataDeliverableParaText.innerHTML = "";
        }
      } else {
        //reset the code metadata lotties and para text
        dataDeliverableLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: dataDeliverableLottieContainer,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
        dataDeliverableParaText.innerHTML = "";
      }

      const sparcAward = globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      const sparcAwardInputManual = document.getElementById("guided-submission-sparc-award-manual");
      //If a sparc award exists, set the sparc award manual input
      //If not, reset the input
      if (sparcAward) {
        sparcAwardInputManual.value = sparcAward;
      } else {
        //If no sparc award exists, reset the inputs
        sparcAwardInputManual.value = "";
      }

      const milestones = globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
      guidedSubmissionTagsTagifyManual.removeAllTags();

      //If milestones exist, add the tags to the milestone tagify element
      if (milestones) {
        guidedSubmissionTagsTagifyManual.addTags(milestones);
      }

      const completionDate =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];
      const completionDateInputManual = document.getElementById(
        "guided-submission-completion-date-manual"
      );
      //If completion date exists, set the completion date input
      //If not, reset the input
      completionDateInputManual.innerHTML = `
        <option value="Select a completion date">Select a completion date</option>
        <option value="Enter my own date">Enter my own date</option>
        <option value="N/A">N/A</option>
      `;
      if (completionDate) {
        completionDateInputManual.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
        //select the completion date that was added
        completionDateInputManual.value = completionDate;
      }

      //Open the page and leave the sub-page hydration to the sub-page function
      openSubPageNavigation(targetPageID);
    }
    if (targetPageID === "guided-contributors-tab") {
      renderDatasetDescriptionContributorsTable();
    }
    if (targetPageID === "guided-protocols-tab") {
      renderProtocolsTable();
      //Click the manual button because we don't currently allow protocols.io import
      $("#guided-section-enter-protocols-manually").click();
    }
    if (targetPageID === "guided-create-description-metadata-tab") {
      guidedLoadDescriptionDatasetInformation();
      guidedLoadDescriptionStudyInformation();
      guidedLoadDescriptionContributorInformation();
      renderAdditionalLinksTable();
      document.getElementById("SPARC-award-other-funding-label").innerHTML =
        globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
    }

    if (targetPageID === "guided-samples-folder-tab") {
      renderSamplesTables();
    }
    if (targetPageID === "guided-pennsieve-intro-tab") {
      const confirmPennsieveAccountDiv = document.getElementById(
        "guided-confirm-pennsieve-account"
      );
      const selectPennsieveAccountDiv = document.getElementById("guided-select-pennsieve-account");
      if (!defaultBfAccount) {
        confirmPennsieveAccountDiv.classList.add("hidden");
        selectPennsieveAccountDiv.classList.remove("hidden");
      } else {
        confirmPennsieveAccountDiv.classList.remove("hidden");
        selectPennsieveAccountDiv.classList.add("hidden");

        const pennsieveIntroText = document.getElementById("guided-pennsive-intro-bf-account");
        const pennsieveIntroAccountDetailsText = document.getElementById(
          "guided-pennsive-intro-account-details"
        );
        pennsieveIntroText.innerHTML = defaultBfAccount;

        setTimeout(() => {
          pennsieveIntroAccountDetailsText.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 0);

        (async () => {
          try {
            let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
              params: {
                selected_account: defaultBfAccount,
              },
            });
            let accountDetailsRes = bf_account_details_req.data.account_details;
            pennsieveIntroAccountDetailsText.innerHTML = accountDetailsRes;
          } catch (error) {
            currentAccountDetailsText.innerHTML = "Error loading account details";
            console.log(error);
          }
        })();
      }
    }
    if (targetPageID === "guided-banner-image-tab") {
      if (globals.sodaJSONObj["digital-metadata"]["banner-image-path"]) {
        guidedShowBannerImagePreview(globals.sodaJSONObj["digital-metadata"]["banner-image-path"]);
      } else {
        //reset the banner image page
        $("#guided-button-add-banner-image").html("Add banner image");
        $("#guided-banner-image-preview-container").hide();
      }
    }
    if (targetPageID === "guided-designate-permissions-tab") {
      //Get the user information of the user that is currently curating
      const user = await api.getUserInformation();

      const loggedInUserString = `${user["firstName"]} ${user["lastName"]} (${user["email"]})`;
      const loggedInUserUUID = user["id"];
      const loggedInUserName = `${user["firstName"]} ${user["lastName"]}`;

      const loggedInUserPiObj = {
        userString: loggedInUserString,
        UUID: loggedInUserUUID,
        name: loggedInUserName,
      };
      setGuidedDatasetPiOwner(loggedInUserPiObj);

      renderPermissionsTable();
      guidedResetUserTeamPermissionsDropdowns();
    }
    if (targetPageID === "guided-add-description-tab") {
      const studyPurposeInput = document.getElementById("guided-pennsieve-study-purpose");
      const studyDataCollectionInput = document.getElementById(
        "guided-pennsieve-study-data-collection"
      );
      const studyPrimaryConclusionInput = document.getElementById(
        "guided-pennsieve-study-primary-conclusion"
      );

      const studyInformationFromDescriptionMetadata =
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"];

      const descriptionMetadata = globals.sodaJSONObj["digital-metadata"]["description"];

      if (Object.keys(descriptionMetadata).length > 0) {
        studyPurposeInput.value = descriptionMetadata["study-purpose"];
        studyDataCollectionInput.value = descriptionMetadata["data-collection"];
        studyPrimaryConclusionInput.value = descriptionMetadata["primary-conclusion"];
      } else if (studyInformationFromDescriptionMetadata) {
        studyPurposeInput.value = studyInformationFromDescriptionMetadata["study purpose"];
        studyDataCollectionInput.value =
          studyInformationFromDescriptionMetadata["study data collection"];
        studyPrimaryConclusionInput.value =
          studyInformationFromDescriptionMetadata["study primary conclusion"];
      } else {
        studyPurposeInput.value = "";
        studyDataCollectionInput.value = "";
        studyPrimaryConclusionInput.value = "";
      }
    }

    if (targetPageID === "guided-add-tags-tab") {
      const descriptionMetadata =
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"];
      const datasetTags = globals.sodaJSONObj["digital-metadata"]["dataset-tags"];

      guidedDatasetTagsTagify.removeAllTags();

      //Try to add tags from a previous session if they exist
      //If not, try to populate the keywords entered during description metadata addition
      if (datasetTags) {
        guidedDatasetTagsTagify.addTags(datasetTags);
      } else if (descriptionMetadata) {
        if (descriptionMetadata["keywords"]) {
          guidedDatasetTagsTagify.addTags(descriptionMetadata["keywords"]);
        }
      }
    }

    if (targetPageID === "guided-assign-license-tab") {
      const licenseCheckbox = document.getElementById("guided-license-checkbox");
      if (globals.sodaJSONObj["digital-metadata"]["license"]) {
        licenseCheckbox.checked = true;
      } else {
        licenseCheckbox.checked = false;
      }
    }

    if (targetPageID === "guided-dataset-generate-location-tab") {
      const currentAccountText = document.getElementById("guided-bf-account");
      const currentAccountDetailsText = document.getElementById("guided-account-details");
      if (defaultBfAccount) {
        currentAccountText.innerHTML = defaultBfAccount;
        (async () => {
          try {
            let bf_account_details_req = await client.get(`/manage_datasets/bf_account_details`, {
              params: {
                selected_account: defaultBfAccount,
              },
            });
            let accountDetailsRes = bf_account_details_req.data.account_details;
            currentAccountDetailsText.innerHTML = accountDetailsRes;
          } catch (error) {
            currentAccountDetailsText.innerHTML = "Error loading account details";
            console.log(error);
          }
        })();
      } else {
        currentAccountText.innerHTML = "None";
        currentAccountDetailsText.innerHTML = "None";
      }
    }

    if (targetPageID === "guided-dataset-generate-destination-tab") {
      const datasetName = globals.sodaJSONObj["digital-metadata"]["name"];

      const confirmDatasetGenerationNameinput = document.getElementById(
        "guided-input-dataset-name"
      );

      confirmDatasetGenerationNameinput.value = datasetName;
    }

    if (targetPageID === "guided-dataset-generation-confirmation-tab") {
      //Set the inner text of the generate/retry pennsieve dataset button depending on
      //whether a dataset has bee uploaded from this progress file
      const generateOrRetryDatasetUploadButton = document.getElementById(
        "guided-generate-dataset-button"
      );
      const reviewGenerateButtionTextElement = document.getElementById(
        "review-generate-button-text"
      );
      if (globals.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]) {
        const generateButtonText = "Resume Pennsieve upload in progress";
        generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
        reviewGenerateButtionTextElement.innerHTML = generateButtonText;
      } else {
        const generateButtonText = "Generate dataset on Pennsieve";
        generateOrRetryDatasetUploadButton.innerHTML = generateButtonText;
        reviewGenerateButtionTextElement.innerHTML = generateButtonText;
      }

      //Reset the dataset upload UI
      const pennsieveMetadataUploadTable = document.getElementById(
        "guided-tbody-pennsieve-metadata-upload"
      );
      const pennsieveMetadataUploadTableRows = pennsieveMetadataUploadTable.children;
      for (const row of pennsieveMetadataUploadTableRows) {
        if (row.classList.contains("permissions-upload-tr")) {
          //delete the row to reset permissions UI
          row.remove();
        } else {
          row.classList.add("hidden");
        }
      }
      document
        .getElementById("guided-div-pennsieve-metadata-upload-status-table")
        .classList.add("hidden");

      const datasetMetadataUploadTable = document.getElementById(
        "guided-tbody-dataset-metadata-upload"
      );
      const datasetMetadataUploadTableRows = datasetMetadataUploadTable.children;
      for (const row of datasetMetadataUploadTableRows) {
        row.classList.add("hidden");
      }
      document
        .getElementById("guided-div-dataset-metadata-upload-status-table")
        .classList.add("hidden");

      document.getElementById("guided-div-dataset-upload-progress-bar").classList.add("hidden");

      //reset the progress bar to 0
      setGuidedProgressBarValue(0);
      updateDatasetUploadProgressTable({
        "Upload status": `Preparing dataset for upload`,
      });

      const datsetName = globals.sodaJSONObj["digital-metadata"]["name"];
      const datsetSubtitle = globals.sodaJSONObj["digital-metadata"]["subtitle"];
      const datasetPiOwner = globals.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"];
      const datasetUserPermissions = globals.sodaJSONObj["digital-metadata"]["user-permissions"];
      const datasetTeamPermissions = globals.sodaJSONObj["digital-metadata"]["team-permissions"];
      const datasetTags = globals.sodaJSONObj["digital-metadata"]["dataset-tags"];
      const datasetLicense = globals.sodaJSONObj["digital-metadata"]["license"];

      const datasetNameReviewText = document.getElementById("guided-review-dataset-name");

      const datasetSubtitleReviewText = document.getElementById("guided-review-dataset-subtitle");
      const datasetDescriptionReviewText = document.getElementById(
        "guided-review-dataset-description"
      );
      const datasetPiOwnerReviewText = document.getElementById("guided-review-dataset-pi-owner");
      const datasetUserPermissionsReviewText = document.getElementById(
        "guided-review-dataset-user-permissions"
      );
      const datasetTeamPermissionsReviewText = document.getElementById(
        "guided-review-dataset-team-permissions"
      );
      const datasetTagsReviewText = document.getElementById("guided-review-dataset-tags");
      const datasetLicenseReviewText = document.getElementById("guided-review-dataset-license");

      datasetNameReviewText.innerHTML = datsetName;
      datasetSubtitleReviewText.innerHTML = datsetSubtitle;

      datasetDescriptionReviewText.innerHTML = Object.keys(
        globals.sodaJSONObj["digital-metadata"]["description"]
      )
        .map((key) => {
          const description = globals.sodaJSONObj["digital-metadata"]["description"][key];
          //change - to spaces in description and then capitalize
          const descriptionTitle = key
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          return `<b>${descriptionTitle}</b>: ${globals.sodaJSONObj["digital-metadata"]["description"][key]}<br /><br />`;
        })
        .join("\n");

      datasetPiOwnerReviewText.innerHTML = datasetPiOwner;

      if (datasetUserPermissions.length > 0) {
        const datasetUserPermissionsString = datasetUserPermissions
          .map((permission) => permission.userString)
          .join("<br>");
        datasetUserPermissionsReviewText.innerHTML = datasetUserPermissionsString;
      } else {
        datasetUserPermissionsReviewText.innerHTML = "No additional user permissions added";
      }

      if (datasetTeamPermissions.length > 0) {
        const datasetTeamPermissionsString = datasetTeamPermissions
          .map((permission) => permission.teamString)
          .join("<br>");
        datasetTeamPermissionsReviewText.innerHTML = datasetTeamPermissionsString;
      } else {
        datasetTeamPermissionsReviewText.innerHTML = "No additional team permissions added";
      }

      datasetTagsReviewText.innerHTML = datasetTags.join(", ");
      datasetLicenseReviewText.innerHTML = datasetLicense;

      const folderStructurePreview = document.getElementById(
        "guided-folder-structure-review-generate"
      );
      $(folderStructurePreview).jstree({
        core: {
          check_callback: true,
          data: {},
        },
        plugins: ["types"],
        types: {
          folder: {
            icon: "fas fa-folder fa-fw",
          },
          "folder open": {
            icon: "fas fa-folder-open fa-fw",
          },
          "folder closed": {
            icon: "fas fa-folder fa-fw",
          },
          "file xlsx": {
            icon: "./assets/img/excel-file.png",
          },
          "file xls": {
            icon: "./assets/img/excel-file.png",
          },
          "file png": {
            icon: "./assets/img/png-file.png",
          },
          "file PNG": {
            icon: "./assets/img/png-file.png",
          },
          "file pdf": {
            icon: "./assets/img/pdf-file.png",
          },
          "file txt": {
            icon: "./assets/img/txt-file.png",
          },
          "file csv": {
            icon: "./assets/img/csv-file.png",
          },
          "file CSV": {
            icon: "./assets/img/csv-file.png",
          },
          "file DOC": {
            icon: "./assets/img/doc-file.png",
          },
          "file DOCX": {
            icon: "./assets/img/doc-file.png",
          },
          "file docx": {
            icon: "./assets/img/doc-file.png",
          },
          "file doc": {
            icon: "./assets/img/doc-file.png",
          },
          "file jpeg": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file JPEG": {
            icon: "./assets/img/jpeg-file.png",
          },
          "file other": {
            icon: "./assets/img/other-file.png",
          },
        },
      });
      $(folderStructurePreview).on("open_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder open");
      });
      $(folderStructurePreview).on("close_node.jstree", function (event, data) {
        data.instance.set_type(data.node, "folder closed");
      });
      guidedShowTreePreview(globals.sodaJSONObj["digital-metadata"]["name"], folderStructurePreview);
    }

    if (targetPageID === "guided-create-subjects-metadata-tab") {
      //remove custom fields that may have existed from a previous session
      document.getElementById("guided-accordian-custom-fields").innerHTML = "";
      document.getElementById("guided-bootbox-subject-id").value = "";

      //Add protocol titles to the protocol dropdown
      const protocols = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

      // Hide the subjects protocol section if no protocols have been attached to the dataset
      const subjectsProtocolContainer = document.getElementById(
        "guided-container-subjects-protocol"
      );
      protocols.length > 0
        ? subjectsProtocolContainer.classList.remove("hidden")
        : subjectsProtocolContainer.classList.add("hidden");

      document.getElementById("guided-bootbox-subject-protocol-title").innerHTML = `
        <option value="">No protocols associated with this sample</option>
        ${protocols
          .map((protocol) => {
            return `
              <option
                value="${protocol.description}"
                data-protocol-link="${protocol.link}"
              >
                ${protocol.description}
              </option>
            `;
          })
          .join("\n")}))
      `;

      document.getElementById("guided-bootbox-subject-protocol-location").innerHTML = `
        <option value="">No protocols associated with this sample</option>
        ${protocols
          .map((protocol) => {
            return `
              <option
                value="${protocol.link}"
                data-protocol-description="${protocol.description}"
              >
                ${protocol.link}
              </option>
            `;
          })
          .join("\n")}))
      `;
      renderSubjectsMetadataAsideItems();
      const subjectsMetadataBlackArrowLottieContainer = document.getElementById(
        "subjects-metadata-black-arrow-lottie-container"
      );
      subjectsMetadataBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: subjectsMetadataBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      switchElementVisibility("guided-form-add-a-subject", "guided-form-add-a-subject-intro");
    }

    if (targetPageID === "guided-create-samples-metadata-tab") {
      //remove custom fields that may have existed from a previous session
      document.getElementById("guided-accordian-custom-fields-samples").innerHTML = "";
      document.getElementById("guided-bootbox-subject-id-samples").value = "";
      document.getElementById("guided-bootbox-sample-id").value = "";
      renderSamplesMetadataAsideItems();
      const samplesMetadataBlackArrowLottieContainer = document.getElementById(
        "samples-metadata-black-arrow-lottie-container"
      );
      samplesMetadataBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: samplesMetadataBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      switchElementVisibility("guided-form-add-a-sample", "guided-form-add-a-sample-intro");

      // Hide the samples protocol section if no protocols have been attached to the dataset
      const samplesProtocolContainer = document.getElementById("guided-container-samples-protocol");
      globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"].length > 0
        ? samplesProtocolContainer.classList.remove("hidden")
        : samplesProtocolContainer.classList.add("hidden");
    }
    if (targetPageID === "guided-add-code-metadata-tab") {
      const codeDescriptionPath =
        globals.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"];

      const codeDescriptionLottieContainer = document.getElementById(
        "code-description-lottie-container"
      );
      const codeDescriptionParaText = document.getElementById("guided-code-description-para-text");

      if (codeDescriptionPath) {
        codeDescriptionLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: codeDescriptionLottieContainer,
          animationData: successCheck,
          renderer: "svg",
          loop: false,
          autoplay: true,
        });
        codeDescriptionParaText.innerHTML = codeDescriptionPath;
      } else {
        //reset the code metadata lotties and para text
        codeDescriptionLottieContainer.innerHTML = "";
        lottie.loadAnimation({
          container: codeDescriptionLottieContainer,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
        codeDescriptionParaText.innerHTML = "";
      }
    }
    if (targetPageID === "guided-create-readme-metadata-tab") {
      const readMeTextArea = document.getElementById("guided-textarea-create-readme");

      const readMe = globals.sodaJSONObj["dataset-metadata"]["README"];

      if (readMe) {
        readMeTextArea.value = readMe;
      } else {
        readMeTextArea.value = "";
      }
    }

    if (targetPageID === "guided-dataset-generation-tab") {
      document.getElementById("guided-dataset-upload-complete-message").classList.add("hidden");
    }

    if (targetPageID === "guided-dataset-dissemination-tab") {
      const pennsieveDatasetID = globals.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];

      if (pennsieveDatasetID) {
        const pennsieveDatasetLink = document.getElementById("guided-pennsieve-dataset-link");

        const pennsieveCopy = document.getElementById("guided-pennsieve-copy-dataset-link");

        const copyIcon = document.getElementById("guided-pennsieve-copy-icon");
        copyIcon.classList.remove("fa-check");
        copyIcon.classList.add("fa-copy");

        let datasetLink = `https://app.pennsieve.io/N:organization:618e8dd9-f8d2-4dc4-9abb-c6aaab2e78a0/datasets/${pennsieveDatasetID}/overview`;
        let linkIcon = `<i class="fas fa-link" style="margin-right: 0.4rem; margin-left: 0.4rem"></i>`;

        pennsieveDatasetLink.innerHTML = linkIcon + datasetLink;
        pennsieveDatasetLink.href = datasetLink;

        // TODO: removed link copied notyf until we can get it to not fire twice.

        pennsieveCopy.removeEventListener(
          "click",
          () => {
            copyLink(datasetLink);
          },
          true
        );
        if (addListener) {
          pennsieveCopy.addEventListener("click", () => {
            copyLink(datasetLink);
          });
          addListener = false;
        }
      }

      document.getElementById("guided-pennsieve-dataset-name").innerHTML =
        globals.sodaJSONObj["digital-metadata"]["name"];
      let bf_get_permissions = await client.get(`/manage_datasets/bf_dataset_permissions`, {
        params: {
          selected_account: defaultBfAccount,
          selected_dataset: globals.sodaJSONObj["digital-metadata"]["name"],
        },
      });
      let datasetPermissions = bf_get_permissions.data.permissions;

      let sharedWithSPARCCurationTeam = false;

      for (const permission of datasetPermissions) {
        if (permission.includes("SPARC Data Curation Team")) {
          sharedWithSPARCCurationTeam = true;
        }
      }

      guidedSetCurationTeamUI(sharedWithSPARCCurationTeam);
    }

    let currentParentTab = CURRENT_PAGE.parent();
    let targetPage = $(`#${targetPageID}`);
    let targetPageParentTab = targetPage.parent();

    //Set all capsules to grey and set capsule of page being traversed to green
    setActiveCapsule(targetPageID);
    setActiveProgressionTab(targetPageID);
    renderSideBar(targetPageID);

    const guidedBody = document.getElementById("guided-body");

    //Check to see if target element has the same parent as current sub step
    if (currentParentTab.attr("id") === targetPageParentTab.attr("id")) {
      CURRENT_PAGE.hide();
      CURRENT_PAGE = targetPage;
      CURRENT_PAGE.css("display", "flex");
      //smooth scroll to top of guidedBody
      guidedBody.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      CURRENT_PAGE.hide();
      currentParentTab.hide();
      targetPageParentTab.show();
      CURRENT_PAGE = targetPage;
      CURRENT_PAGE.css("display", "flex");
      //smooth scroll to top of guidedBody
      guidedBody.scrollTo({
        top: 0,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const setActiveSubPage = (pageIdToActivate) => {
  const pageElementToActivate = document.getElementById(pageIdToActivate);

  //create a switch statement for pageIdToActivate to load data from globals.sodaJSONObj
  //depending on page being opened
  switch (pageIdToActivate) {
    case "guided-specify-subjects-page": {
      const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
      //Combine sample data from subjects in and out of pools
      let subjects = [...subjectsInPools, ...subjectsOutsidePools];
      const subjectElementRows = subjects
        .map((subject) => {
          return generateSubjectRowElement(subject.subjectName);
        })
        .join("\n");
      document.getElementById("subject-specification-table-body").innerHTML = subjectElementRows;
      //remove the add subject help text
      document.getElementById("guided-add-subject-instructions").classList.add("hidden");
      break;
    }

    case "guided-organize-subjects-into-pools-page": {
      const pools = globals.sodaJSONObj.getPools();

      const poolElementRows = Object.keys(pools)
        .map((pool) => {
          return generatePoolRowElement(pool);
        })
        .join("\n");
      document.getElementById("pools-specification-table-body").innerHTML = poolElementRows;

      for (const poolName of Object.keys(pools)) {
        const newPoolSubjectsSelectElement = document.querySelector(
          `select[name="${poolName}-subjects-selection-dropdown"]`
        );
        //create a select2 dropdown for the pool subjects
        $(newPoolSubjectsSelectElement).select2({
          placeholder: "Select subjects",
          tags: true,
          width: "100%",
          closeOnSelect: false,
          createTag: function () {
            // Disable tagging
            return null;
          },
        });
        //update the newPoolSubjectsElement with the subjects in the pool
        updatePoolDropdown($(newPoolSubjectsSelectElement), poolName);
        $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
          updatePoolDropdown($(e.currentTarget), poolName);
        });
        $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
          const subjectToRemove = e.params.data.id;
          globals.sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
        });
        $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
          const selectedSubject = e.params.data.id;
          globals.sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
        });
      }
      break;
    }

    case "guided-specify-samples-page": {
      const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
      //Combine sample data from subjects in and out of pools
      let subjects = [...subjectsInPools, ...subjectsOutsidePools];

      //Create the HTML for the subjects
      const subjectSampleAdditionTables = subjects
        .map((subject) => {
          return renderSubjectSampleAdditionTable(subject);
        })
        .join("\n");

      //Add the subject sample addition elements to the DOM
      const subjectSampleAdditionTableContainer = document.getElementById(
        "guided-div-add-samples-tables"
      );

      subjectSampleAdditionTableContainer.innerHTML = subjectSampleAdditionTables;
      break;
    }

    case "guided-primary-samples-organization-page": {
      //If the user indicated they have no samples, skip this page
      //and go to primary subject data organization page
      if (
        document.getElementById("guided-primary-samples-organization-page").dataset.skipSubPage ===
        "true"
      ) {
        setActiveSubPage("guided-primary-subjects-organization-page");
        return;
      }

      renderSamplesHighLevelFolderAsideItems("primary");
      guidedUpdateFolderStructure("primary", "samples");

      $("#guided-file-explorer-elements").appendTo(
        $("#guided-primary-samples-file-explorer-container")
      );

      //Hide the file explorer and show the intro
      document.getElementById("guided-file-explorer-elements").classList.add("hidden");
      document
        .getElementById("guided-primary-samples-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const primarySamplesFileExplorerBlackArrowLottieContainer = document.getElementById(
        "primary-samples-file-explorer-black-arrow-lottie-container"
      );
      primarySamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: primarySamplesFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-primary-subjects-organization-page": {
      renderSubjectsHighLevelFolderAsideItems("primary");
      guidedUpdateFolderStructure("primary", "subjects");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-primary-subjects-file-explorer-container")
      );
      //Hide the file explorer and show the intro
      document.getElementById("guided-file-explorer-elements").classList.add("hidden");
      document
        .getElementById("guided-primary-subjects-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const primarySubjectsFileExplorerBlackArrowLottieContainer = document.getElementById(
        "primary-subjects-file-explorer-black-arrow-lottie-container"
      );
      primarySubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: primarySubjectsFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-source-samples-organization-page": {
      //If the user indicated they have no samples, skip this page
      //and go to source subject data organization page
      if (
        document.getElementById("guided-source-samples-organization-page").dataset.skipSubPage ===
        "true"
      ) {
        setActiveSubPage("guided-source-subjects-organization-page");
        return;
      }

      renderSamplesHighLevelFolderAsideItems("source");
      guidedUpdateFolderStructure("source", "samples");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-source-samples-file-explorer-container")
      );

      //Hide the file explorer and show the intro
      document.getElementById("guided-file-explorer-elements").classList.add("hidden");
      document
        .getElementById("guided-source-samples-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const sourceSamplesFileExplorerBlackArrowLottieContainer = document.getElementById(
        "source-samples-file-explorer-black-arrow-lottie-container"
      );
      sourceSamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: sourceSamplesFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-source-subjects-organization-page": {
      renderSubjectsHighLevelFolderAsideItems("source");
      guidedUpdateFolderStructure("source", "subjects");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-source-subjects-file-explorer-container")
      );
      //Hide the file explorer and show the intro
      document.getElementById("guided-file-explorer-elements").classList.add("hidden");
      document
        .getElementById("guided-source-subjects-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const sourceSubjectsFileExplorerBlackArrowLottieContainer = document.getElementById(
        "source-subjects-file-explorer-black-arrow-lottie-container"
      );
      sourceSubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: sourceSubjectsFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-derivative-samples-organization-page": {
      //If the user indicated they have no samples, skip this page
      //and go to derivative subject data organization page
      if (
        document.getElementById("guided-derivative-samples-organization-page").dataset
          .skipSubPage === "true"
      ) {
        setActiveSubPage("guided-derivative-subjects-organization-page");
        return;
      }

      renderSamplesHighLevelFolderAsideItems("derivative");
      guidedUpdateFolderStructure("derivative", "samples");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-derivative-samples-file-explorer-container")
      );

      //Hide the file explorer and show the intro
      document.getElementById("guided-file-explorer-elements").classList.add("hidden");
      document
        .getElementById("guided-derivative-samples-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const derivativeSamplesFileExplorerBlackArrowLottieContainer = document.getElementById(
        "derivative-samples-file-explorer-black-arrow-lottie-container"
      );
      derivativeSamplesFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: derivativeSamplesFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-derivative-subjects-organization-page": {
      renderSubjectsHighLevelFolderAsideItems("derivative");
      guidedUpdateFolderStructure("derivative", "subjects");
      $("#guided-file-explorer-elements").appendTo(
        $("#guided-derivative-subjects-file-explorer-container")
      );
      //Hide the file explorer and show the intro
      document.getElementById("guided-file-explorer-elements").classList.add("hidden");
      document
        .getElementById("guided-derivative-subjects-file-explorer-intro")
        .classList.remove("hidden");

      //Load the black arrow lottie animation
      const derivativeSubjectsFileExplorerBlackArrowLottieContainer = document.getElementById(
        "derivative-subjects-file-explorer-black-arrow-lottie-container"
      );
      derivativeSubjectsFileExplorerBlackArrowLottieContainer.innerHTML = "";
      lottie.loadAnimation({
        container: derivativeSubjectsFileExplorerBlackArrowLottieContainer,
        animationData: blackArrow,
        renderer: "svg",
        loop: true,
        autoplay: true,
      });
      break;
    }

    case "guided-data-derivative-import-page": {
      const importedMilestones =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-imported-milestones"];

      if (importedMilestones) {
        renderMilestoneSelectionTable(importedMilestones);
        const tempSelectedMilestones =
          globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-selected-milestones"];
        if (tempSelectedMilestones) {
          //Check the checkboxes for previously selected milestones
          const milestoneDescriptionsToCheck = tempSelectedMilestones.map((milestone) => {
            return milestone["description"];
          });
          for (const milestone of milestoneDescriptionsToCheck) {
            //find the checkbox with name milestone and value of milestone
            const milestoneCheckbox = document.querySelector(
              `input[name="milestone"][value="${milestone}"]`
            );
            if (milestoneCheckbox) {
              milestoneCheckbox.checked = true;
            }
          }
        }
        unHideAndSmoothScrollToElement("guided-div-data-deliverables-import");
      } else {
        document.getElementById("guided-div-data-deliverables-import").classList.add("hidden");
      }
      break;
    }

    case "guided-completion-date-selection-page": {
      const selectedMilestoneData =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-selected-milestones"];

      // get a unique set of completionDates from checkedMilestoneData
      const uniqueCompletionDates = Array.from(
        new Set(selectedMilestoneData.map((milestone) => milestone.completionDate))
      );

      if (uniqueCompletionDates.length === 1) {
        //save the completion date into globals.sodaJSONObj
        const uniqueCompletionDate = uniqueCompletionDates[0];
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
          uniqueCompletionDate;

        document.getElementById("guided-completion-date-container").innerHTML =
          createCompletionDateRadioElement("completion-date", uniqueCompletionDate);
        //check the completion date
        document.querySelector(
          `input[name="completion-date"][value="${uniqueCompletionDate}"]`
        ).checked = true;
      }

      if (uniqueCompletionDates.length > 1) {
        //filter value 'N/A' from uniqueCompletionDates
        const filteredUniqueCompletionDates = uniqueCompletionDates.filter(
          (date) => date !== "N/A"
        );

        //create a radio button for each unique date
        const completionDateCheckMarks = filteredUniqueCompletionDates
          .map((completionDate) => {
            return createCompletionDateRadioElement("completion-date", completionDate);
          })
          .join("\n");
        document.getElementById("guided-completion-date-container").innerHTML =
          completionDateCheckMarks;

        //If a completion date has already been selected, select it's radio button
        const selectedCompletionDate =
          globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];
        if (selectedCompletionDate) {
          const selectedCompletionDateRadioElement = document.querySelector(
            `input[name="completion-date"][value="${selectedCompletionDate}"]`
          );
          if (selectedCompletionDateRadioElement) {
            selectedCompletionDateRadioElement.checked = true;
          }
        }
      }
      break;
    }

    case "guided-submission-metadata-page": {
      const sparcAward = globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      const selectedMilestones =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-selected-milestones"];

      const completionDate =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];

      const sparcAwardInput = document.getElementById("guided-submission-sparc-award");
      const completionDateInput = document.getElementById("guided-submission-completion-date");

      guidedSubmissionTagsTagify.removeAllTags();

      sparcAwardInput.value = sparcAward;

      const uniqueMilestones = Array.from(
        new Set(selectedMilestones.map((milestone) => milestone.milestone))
      );
      guidedSubmissionTagsTagify.addTags(uniqueMilestones);

      completionDateInput.innerHTML += `<option value="${completionDate}">${completionDate}</option>`;
      //select the completion date that was added
      completionDateInput.value = completionDate;

      break;
    }
  }

  //Show target page and hide its siblings
  pageElementToActivate.classList.remove("hidden");
  const pageElementSiblings = pageElementToActivate.parentElement.children;
  //filter pageElementSiblings to only contain elements with class "sub-page"
  const pageElementSiblingsToHide = Array.from(pageElementSiblings).filter((pageElementSibling) => {
    return (
      pageElementSibling.classList.contains("sub-page") &&
      pageElementSibling.id !== pageIdToActivate
    );
  });
  //hide all pageElementSiblingsToHide
  pageElementSiblingsToHide.forEach((pageElementSibling) => {
    pageElementSibling.classList.add("hidden");
  });

  //Set page's capsule to active and remove active from sibling capsules
  const pageCapsuleToActivate = document.getElementById(`${pageIdToActivate}-capsule`);
  pageCapsuleToActivate.classList.add("active");
  const siblingCapsules = pageCapsuleToActivate.parentElement.children;
  for (const siblingCapsule of siblingCapsules) {
    if (siblingCapsule.id !== `${pageIdToActivate}-capsule`) {
      siblingCapsule.classList.remove("active");
    }
  }
};

const guidedIncreaseCurateProgressBar = (percentToIncrease) => {
  $("#guided-progress-bar-new-curate").attr(
    "value",
    parseInt($("#guided-progress-bar-new-curate").attr("value")) + percentToIncrease
  );
};
const setGuidedProgressBarValue = (value) => {
  $("#guided-progress-bar-new-curate").attr("value", value);
};
function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const isNumberBetween = (number, minVal, maxVal) => {
  return !isNaN(parseFloat(number)) && isFinite(number) && number >= minVal && number <= maxVal;
};
function subSamInputIsValid(subSamInput) {
  const subSamInputPattern = /^[a-z]+-[0-9A-Za-z-]+$/;
  return subSamInputPattern.test(subSamInput);
}
const generateAlertElement = (alertType, warningMessageText) => {
  return `
      <div style="margin-right:.5rem"class="alert alert-${alertType} guided--alert" role="alert">
        ${warningMessageText}
      </div>
    `;
};
const generateAlertMessage = (elementToWarn) => {
  const alertMessage = elementToWarn.data("alert-message");
  const alertType = elementToWarn.data("alert-type");
  if (!elementToWarn.next().hasClass("alert")) {
    elementToWarn.after(generateAlertElement(alertType, alertMessage));
  }
  enableProgressButton();
};
const removeAlertMessageIfExists = (elementToCheck) => {
  const alertMessageToRemove = elementToCheck.next();
  if (alertMessageToRemove.hasClass("alert")) {
    elementToCheck.next().remove();
  }
};
const validateInput = (inputElementToValidate) => {
  let inputIsValid = false;

  const inputID = inputElementToValidate.attr("id");
  if (inputID === "guided-dataset-name-input") {
    let name = inputElementToValidate.val().trim();
    if (name !== "") {
      if (!check_forbidden_characters_bf(name)) {
        removeAlertMessageIfExists(inputElementToValidate);
        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
      }
    }
  }
  if (inputID === "guided-dataset-subtitle-input") {
    let subtitle = inputElementToValidate.val().trim();
    if (subtitle !== "") {
      if (subtitle.length < 257) {
        removeAlertMessageIfExists(inputElementToValidate);
        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
      }
    }
  }
  if (inputID === "guided-number-of-subjects-input") {
    let numSubjects = inputElementToValidate.val().trim();
    if (numSubjects !== "") {
      if (isNumberBetween(numSubjects, 1, 1000)) {
        removeAlertMessageIfExists(inputElementToValidate);
        $("#guided-same-amount-samples-form").css("display", "flex");
        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
        $("#guided-same-amount-samples-form").hide();
      }
    } else {
      $("#guided-same-amount-samples-form").hide();
    }
  }
  if (inputID === "guided-number-of-samples-input") {
    let numSamples = inputElementToValidate.val().trim();
    if (numSamples !== "") {
      if (isNumberBetween(numSamples, 1, 1000)) {
        removeAlertMessageIfExists(inputElementToValidate);
        $("#guided-button-generate-subjects-table").show();

        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
        $("#guided-button-generate-subjects-table").hide();
      }
    } else {
      $("#guided-button-generate-subjects-table").hide();
    }
  }
  if (inputID === "guided-number-of-samples-input") {
    let numSamples = inputElementToValidate.val().trim();
    if (numSamples !== "") {
      if (isNumberBetween(numSamples, 1, 1000)) {
        removeAlertMessageIfExists(inputElementToValidate);
        $("#guided-button-generate-subjects-table").show();

        inputIsValid = true;
      } else {
        generateAlertMessage(inputElementToValidate);
        $("#guided-button-generate-subjects-table").hide();
      }
    } else {
      $("#guided-button-generate-subjects-table").hide();
    }
  }
  return inputIsValid;
};

/////////////////////////////////////////////////////////
//////////       GUIDED FORM VALIDATORS       ///////////
/////////////////////////////////////////////////////////

const openEditGuidedDatasetSwal = async (datasetName) => {
  swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    icon: "info",
    title: "Editing a dataset curated via guided mode is handled via Free-Form mode.",
    html: `\nTo edit <b>${datasetName}</b>, go to Free-Form mode, select the dataset component that you would like
    to modify, select ${datasetName} from the dataset selection drop-down, and edit the data in Free-Form mode.`,
    confirmButtonText: "OK",
  });
};

const patchPreviousGuidedModeVersions = () => {
  let forceUserToRestartFromFirstPage = false;

  //temp patch contributor affiliations if they are still a string (they were added in the previous version)
  const contributors = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  if (contributors) {
    for (contributor of globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"]) {
      //if contributor is in old format (string), convert to new format (array)
      if (!Array.isArray(contributor.conAffliation)) {
        contributor.conAffliation = [contributor.conAffliation];
      }
    }
  }

  //temp patch subjectsTableData to add "RRID for strain" field
  if (subjectsTableData.length > 0) {
    //check if subjectsTableData has "RRID for strain" field
    if (!subjectsTableData[0].includes("RRID for strain")) {
      //insert "RRID for strain" string as the 6th element of subjectsTableData[0]
      subjectsTableData[0].splice(6, 0, "RRID for strain");
      //Insert empty string as the 6th element for each subject in subjectsTableData
      //besides the first element, which is the header row
      for (let i = 1; i < subjectsTableData.length; i++) {
        subjectsTableData[i].splice(6, 0, "");
      }
    }
  }

  const resetGuidedManifestFiles = () => {
    globals.sodaJSONObj["guided-manifest-files"] = {};
  };

  //Update manifest files key from old key ("manifest-files") to new key ("guided-manifest-files")
  if (globals.sodaJSONObj["manifest-files"]) {
    resetGuidedManifestFiles();
    delete globals.sodaJSONObj["manifest-files"];
    forceUserToRestartFromFirstPage = true;
  }

  let oldManifestFileHeaders = false;
  for (highLevelFolderManifestData in globals.sodaJSONObj["guided-manifest-files"]) {
    if (
      globals.sodaJSONObj["guided-manifest-files"][highLevelFolderManifestData]["headers"][0] ===
      "File Name"
    ) {
      oldManifestFileHeaders = true;
    }
  }
  if (oldManifestFileHeaders) {
    resetGuidedManifestFiles();
    forceUserToRestartFromFirstPage = true;
  }

  //Add key to track status of Pennsieve uploads
  if (!globals.sodaJSONObj["pennsieve-upload-status"]) {
    globals.sodaJSONObj["pennsieve-upload-status"] = {
      "dataset-metadata-upload-status": "not-started",
    };
  }

  if (!globals.sodaJSONObj["previously-uploaded-data"]) {
    globals.sodaJSONObj["previously-uploaded-data"] = {};
    forceUserToRestartFromFirstPage = true;
  }

  if (!globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"]) {
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = [];
  }

  if (!globals.sodaJSONObj["skipped-pages"]) {
    globals.sodaJSONObj["skipped-pages"] = [];

    forceUserToRestartFromFirstPage = true;
  }

  return forceUserToRestartFromFirstPage;
};

//Loads UI when continue curation button is pressed
const guidedResumeProgress = async (resumeProgressButton) => {
  resumeProgressButton.addClass("loading");
  const datasetNameToResume = resumeProgressButton
    .parent()
    .siblings()
    .find($(".progress-file-name"))
    .html();
  const datasetResumeJsonObj = await getProgressFileData(datasetNameToResume);

  // If the dataset had been previously successfully uploaded, check to make sure it exists on Pennsieve still.
  if (datasetResumeJsonObj["previous-guided-upload-dataset-name"]) {
    const previouslyUploadedName = datasetResumeJsonObj["previous-guided-upload-dataset-name"];
    const datasetToResumeExistsOnPennsieve = await checkIfDatasetExistsOnPennsieve(
      previouslyUploadedName
    );
    if (!datasetToResumeExistsOnPennsieve) {
      notyf.open({
        type: "error",
        message: `The dataset ${previouslyUploadedName} was not found on Pennsieve therefore you can no longer modify this dataset via Guided Mode.`,
        duration: 7000,
      });
      resumeProgressButton.removeClass("loading");
      return;
    }
  }
  globals.sodaJSONObj = datasetResumeJsonObj;

  attachGuidedMethodsToSodaJSONObj();

  datasetStructureJSONObj = globals.sodaJSONObj["saved-datset-structure-json-obj"];
  subjectsTableData = globals.sodaJSONObj["subjects-table-data"];
  samplesTableData = globals.sodaJSONObj["samples-table-data"];

  //patches the sodajsonobj if it was created in a previous version of guided mode
  //and returns a boolean to indicate if the user should be forced to restart from the first page
  const forceStartFromFirstPage = patchPreviousGuidedModeVersions();

  //Return the user to the last page they exited on
  let pageToReturnTo = datasetResumeJsonObj["page-before-exit"];

  //If a patch was applied that requires the user to restart from the first page,
  //then force the user to restart from the first page
  if (forceStartFromFirstPage) {
    pageToReturnTo = "guided-prepare-helpers-tab";
  }

  //If the dataset was successfully uploaded, send the user to the share with curation team
  if (datasetResumeJsonObj["previous-guided-upload-dataset-name"]) {
    pageToReturnTo = "guided-dataset-dissemination-tab";
  }

  // Delete the button status for the Pennsieve account confirmation section
  // So the user has to confirm their Pennsieve account before uploading
  delete globals.sodaJSONObj["button-config"]["pennsieve-account-has-been-confirmed"];

  guidedTransitionFromHome();
  //Set the dataset name and subtitle input values using the
  //previously saved dataset name and subtitle
  document.getElementById("guided-dataset-name-input").value =
    datasetResumeJsonObj["digital-metadata"]["name"];
  document.getElementById("guided-dataset-subtitle-input").value =
    datasetResumeJsonObj["digital-metadata"]["subtitle"];

  guidedTransitionFromDatasetNameSubtitlePage();

  //Hide the before getting started page so it doesn't flash when resuming progress
  $("#guided-prepare-helpers-tab").css("display", "none");

  if (pageToReturnTo) {
    //Hide the sub-page navigation and show the main page navigation footer
    //If the user traverses to a page that requires the sub-page navigation,
    //the sub-page will be shown during openPage() function
    hideSubNavAndShowMainNav(false);

    //If the last page the exited was the upload page, take them to the review page
    pageToReturnTo === "guided-dataset-generation-tab"
      ? openPage("guided-dataset-generation-confirmation-tab")
      : openPage(pageToReturnTo);
  }
  guidedLockSideBar();
};

//Add  spinner to element
const guidedUploadStatusIcon = (elementID, status) => {
  let statusElement = document.getElementById(`${elementID}`);
  statusElement.innerHTML = ``;
  let spinner = `
    <div class="spinner-border" role="status" style="
      height: 24px;
      width: 24px;
    "></div>`;

  if (status === "loading") {
    statusElement.innerHTML = spinner;
  }
  if (status === "success") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: successCheck,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
  if (status === "error") {
    lottie.loadAnimation({
      container: statusElement,
      animationData: errorMark,
      renderer: "svg",
      loop: false,
      autoplay: true,
    });
  }
};

//dataset description (first page) functions
const guidedCreateSodaJSONObj = () => {
  globals.sodaJSONObj = {};

  globals.sodaJSONObj["guided-options"] = {};
  globals.sodaJSONObj["bf-account-selected"] = {};
  globals.sodaJSONObj["dataset-structure"] = { files: {}, folders: {} };
  globals.sodaJSONObj["generate-dataset"] = {};
  globals.sodaJSONObj["guided-manifest-files"] = {};
  globals.sodaJSONObj["metadata-files"] = {};
  globals.sodaJSONObj["starting-point"] = {};
  globals.sodaJSONObj["dataset-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["shared-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["protocol-data"] = [];
  globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"] = {};
  globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"] = {};
  globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["subjects"] = {};
  globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["samples"] = {};
  globals.sodaJSONObj["dataset-metadata"]["subject-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["sample-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["submission-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["description-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["code-metadata"] = {};
  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] = [];
  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = [];
  globals.sodaJSONObj["dataset-metadata"]["README"] = "";
  globals.sodaJSONObj["dataset-metadata"]["CHANGES"] = "";
  globals.sodaJSONObj["digital-metadata"] = {};
  globals.sodaJSONObj["previously-uploaded-data"] = {};
  globals.sodaJSONObj["digital-metadata"]["description"] = {};
  globals.sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  globals.sodaJSONObj["digital-metadata"]["user-permissions"] = [];
  globals.sodaJSONObj["digital-metadata"]["team-permissions"] = [];
  globals.sodaJSONObj["completed-tabs"] = [];
  globals.sodaJSONObj["skipped-pages"] = [];
  globals.sodaJSONObj["last-modified"] = "";
  globals.sodaJSONObj["button-config"] = {};
  globals.sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] = false;
  datasetStructureJSONObj = { folders: {}, files: {} };
};

const attachGuidedMethodsToSodaJSONObj = () => {
  const guidedHighLevelFolders = ["primary", "source", "derivative"];

  globals.sodaJSONObj.getAllSubjects = function () {
    let subjectsInPools = [];
    let subjectsOutsidePools = [];

    for (const [poolName, pool] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(pool)) {
        subjectsInPools.push({
          subjectName: subjectName,
          poolName: poolName,
          samples: Object.keys(subjectData),
        });
      }
    }

    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      subjectsOutsidePools.push({
        subjectName: subjectName,
        samples: Object.keys(subjectData),
      });
    }
    return [subjectsInPools, subjectsOutsidePools];
  };
  globals.sodaJSONObj.addSubject = function (subjectName) {
    //check if subject with the same name already exists
    if (
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subjectName] ||
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName]
    ) {
      throw new Error("Subject names must be unique.");
    }
    this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName] = {};
  };
  globals.sodaJSONObj.renameSubject = function (prevSubjectName, newSubjectName) {
    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    const subjects = [...subjectsInPools, ...subjectsOutsidePools];

    if (prevSubjectName === newSubjectName) {
      return;
    }

    //Throw an error if the subject name that the user is changing the old subject name
    //to already exists
    if (subjects.filter((subject) => subject.subjectName === newSubjectName).length > 0) {
      throw new Error("Subject names must be unique.");
    }

    for (const subject of subjects) {
      if (subject.subjectName === prevSubjectName) {
        //if the subject is in a pool
        if (subject.poolName) {
          this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subject.poolName][
            newSubjectName
          ] =
            this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subject.poolName][
              prevSubjectName
            ];
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            subject.poolName
          ][prevSubjectName];

          //Rename the subjects folders in the datasetStructJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            if (
              datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subject.poolName
              ]?.["folders"]?.[prevSubjectName]
            ) {
              datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
                "folders"
              ][newSubjectName] =
                datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subject.poolName][
                  "folders"
                ][prevSubjectName];
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][prevSubjectName];
            }
          }
        } else {
          //if the subject is not in a pool
          this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][newSubjectName] =
            this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][prevSubjectName];
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
            prevSubjectName
          ];

          //Rename the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            if (
              datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                prevSubjectName
              ]
            ) {
              datasetStructureJSONObj["folders"][highLevelFolder]["folders"][newSubjectName] =
                datasetStructureJSONObj["folders"][highLevelFolder]["folders"][prevSubjectName];
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                prevSubjectName
              ];
            }
          }
        }
      }
    }

    //Rename the subject's entry in the subjectsTableData
    for (const subjectDataArray of subjectsTableData.slice(1)) {
      if (subjectDataArray[0] === prevSubjectName) {
        subjectDataArray[0] = newSubjectName;
      }
    }
  };
  globals.sodaJSONObj.deleteSubject = function (subjectName) {
    const [subjectsInPools, subjectsOutsidePools] = this.getAllSubjects();
    const subjects = [...subjectsInPools, ...subjectsOutsidePools];
    for (const subject of subjects) {
      if (subject.subjectName === subjectName) {
        //if the subject is in a pool
        if (subject.poolName) {
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            subject.poolName
          ][subjectName];

          //Delete the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            if (
              datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                subject.poolName
              ]?.["folders"]?.[subjectName]
            ) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                subject.poolName
              ]["folders"][subjectName];
            }
          }
        } else {
          //if the subject is not in a pool
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];

          //Delete the subjects folders in the datasetStructeJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            if (
              datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName]
            ) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
            }
          }
        }
      }
    }

    //remove the subject's subject metadata
    subjectsTableData = subjectsTableData.filter((subject) => {
      return subject[0] !== subjectName;
    });
  };
  globals.sodaJSONObj.getSubjectsOutsidePools = function () {
    let subjectsNotInPools = Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    );
    return /*subjectsInPools.concat(*/ subjectsNotInPools /*)*/;
  };
  globals.sodaJSONObj.getSubjectsInPools = function () {
    return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
  };
  globals.sodaJSONObj.moveSubjectIntoPool = function (subjectName, poolName) {
    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName][subjectName] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName];

    //Move the subjects folders in the datasetStructeJSONObj
    for (const highLevelFolder of guidedHighLevelFolders) {
      if (datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[subjectName]) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]["folders"][
          subjectName
        ] = datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName];
      }
    }

    //Add the pool name to the subjectsTableData if if an entry exists
    for (const subjectDataArray of subjectsTableData.slice(1)) {
      if (subjectDataArray[0] === subjectName) {
        subjectDataArray[1] = poolName;
      }
    }
  };
  globals.sodaJSONObj.moveSubjectOutOfPool = function (subjectName, poolName) {
    this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName][subjectName];
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName][
      subjectName
    ];

    //Copy the subject folders from the pool into the root of the high level folder
    for (const highLevelFolder of guidedHighLevelFolders) {
      if (
        datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]?.[
          "folders"
        ]?.[subjectName]
      ) {
        datasetStructureJSONObj["folders"][highLevelFolder]["folders"][subjectName] =
          datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]["folders"][
            subjectName
          ];
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName]["folders"][
          subjectName
        ];
      }
    }

    //Remove the pool from the subject's entry in the subjectsTableData
    for (const subjectDataArray of subjectsTableData) {
      if (subjectDataArray[0] === subjectName) {
        subjectDataArray[1] = "";
      }
    }

    //Remove the sample from the samplesTableData
    for (const sampleDataArray of samplesTableData) {
      if (sampleDataArray[0] === subjectName) {
        sampleDataArray[3] = "";
      }
    }
  };
  globals.sodaJSONObj.addPool = function (poolName) {
    if (this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName]) {
      throw new Error("Pool names must be unique.");
    }

    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName] = {};
  };
  globals.sodaJSONObj.renamePool = function (prevPoolName, newPoolName) {
    //check if name already exists
    if (prevPoolName != newPoolName) {
      if (this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][newPoolName]) {
        throw new Error("Pool names must be unique.");
      }

      if (this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName]) {
        this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][newPoolName] =
          this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName];
        delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][prevPoolName];

        //Rename the pool folder in the datasetStructureJSONObj
        for (const highLevelFolder of guidedHighLevelFolders) {
          if (
            datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[prevPoolName]
          ) {
            datasetStructureJSONObj["folders"][highLevelFolder]["folders"][newPoolName] =
              datasetStructureJSONObj["folders"][highLevelFolder]["folders"][prevPoolName];
            delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][prevPoolName];
          }
        }

        //Rename the pool in the subjectsTableData
        for (const subjectDataArray of subjectsTableData.slice(1)) {
          if (subjectDataArray[1] === prevPoolName) {
            subjectDataArray[1] = newPoolName;
          }
        }

        //Rename the pool in the samplesTableData
        for (const sampleDataArray of samplesTableData.slice(1)) {
          if (sampleDataArray[3] === prevPoolName) {
            sampleDataArray[3] = newPoolName;
          }
        }
      }
    }
  };
  globals.sodaJSONObj.deletePool = function (poolName) {
    //empty the subjects in the pool back into subjects
    let pool = this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName];

    //Loop through the subjects and remove their folders from the pool in the dataset structure
    //this handles moving the subject folders back to the root of the high level folder
    //and removes the pool from the subject/sample metadata arrays
    for (let subject in pool) {
      globals.sodaJSONObj.moveSubjectOutOfPool(subject, poolName);
    }

    for (const highLevelFolder of guidedHighLevelFolders) {
      if (datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[poolName]) {
        delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][poolName];
      }
    }

    //delete the pool after copying the subjects back into subjects
    delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName];
  };
  globals.sodaJSONObj.getPools = function () {
    return this["dataset-metadata"]["pool-subject-sample-structure"]["pools"];
  };
  globals.sodaJSONObj.getPoolSubjects = function (poolName) {
    return Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][poolName]
    );
  };

  globals.sodaJSONObj.getAllSamplesFromSubjects = function () {
    let samplesInPools = [];
    let samplesOutsidePools = [];

    //get all the samples in subjects in pools
    for (const [poolName, poolData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(poolData)) {
        for (sampleName of Object.keys(subjectData)) {
          samplesInPools.push({
            sampleName: sampleName,
            subjectName: subjectName,
            poolName: poolName,
          });
        }
      }
    }

    //get all the samples in subjects not in pools
    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      for (sampleName of Object.keys(subjectData)) {
        samplesOutsidePools.push({
          sampleName: sampleName,
          subjectName: subjectName,
        });
      }
    }
    return [samplesInPools, samplesOutsidePools];
  };

  globals.sodaJSONObj.addSampleToSubject = function (sampleName, subjectPoolName, subjectName) {
    const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    //Check samples already added and throw an error if a sample with the sample name already exists.
    for (const sample of samples) {
      if (sample.sampleName === sampleName) {
        throw new Error(
          `Sample names must be unique. \n${sampleName} already exists in ${sample.subjectName}`
        );
      }
    }

    if (subjectPoolName) {
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][subjectPoolName][
        subjectName
      ][sampleName] = {};
    } else {
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][subjectName][
        sampleName
      ] = {};
    }
  };
  globals.sodaJSONObj.renameSample = function (prevSampleName, newSampleName) {
    const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    if (prevSampleName != newSampleName) {
      //Check samples already added and throw an error if a sample with the sample name already exists.
      for (const sample of samples) {
        if (sample.sampleName === newSampleName) {
          throw new Error(
            `Sample names must be unique. \n${newSampleName} already exists in ${sample.subjectName}`
          );
        }
      }

      //find the sample and rename it
      for (const sample of samples) {
        if (sample.sampleName === prevSampleName) {
          //Rename the sample's sample metadata
          for (const sampleMetadataRow of samplesTableData.slice(1)) {
            if (sampleMetadataRow[1] === prevSampleName) {
              sampleMetadataRow[1] = newSampleName;
            }
          }

          if (sample.poolName) {
            this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][sample.poolName][
              sample.subjectName
            ][newSampleName] =
              this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][sample.poolName][
                sample.subjectName
              ][prevSampleName];
            delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
              sample.poolName
            ][sample.subjectName][prevSampleName];

            //Rename the samples folders in the datasetStructeJSONObj
            for (const highLevelFolder of guidedHighLevelFolders) {
              if (
                datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                  sample.poolName
                ]?.["folders"]?.[sample.subjectName]?.["folders"]?.[prevSampleName]
              ) {
                datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
                  "folders"
                ][sample.subjectName]["folders"][newSampleName] =
                  datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.poolName][
                    "folders"
                  ][sample.subjectName]["folders"][prevSampleName];
                delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.poolName
                ]["folders"][sample.subjectName]["folders"][prevSampleName];
              }
            }
          } else {
            this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
              sample.subjectName
            ][newSampleName] =
              this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
                sample.subjectName
              ][prevSampleName];
            delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
              sample.subjectName
            ][prevSampleName];
            //Rename the samples folders in the datasetStructeJSONObj
            for (const highLevelFolder of guidedHighLevelFolders) {
              if (
                datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                  sample.subjectName
                ]?.["folders"]?.[prevSampleName]
              ) {
                datasetStructureJSONObj["folders"][highLevelFolder]["folders"][sample.subjectName][
                  "folders"
                ][newSampleName] =
                  datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                    sample.subjectName
                  ]["folders"][prevSampleName];
                delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                  sample.subjectName
                ]["folders"][prevSampleName];
              }
            }
          }
        }
      }
    }
  };

  globals.sodaJSONObj.deleteSample = function (sampleName) {
    const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
    //Combine sample data from samples in and out of pools
    let samples = [...samplesInPools, ...samplesOutsidePools];

    for (const sample of samples) {
      if (sample.sampleName === sampleName) {
        //remove the sample's sample metadata
        samplesTableData = samplesTableData.filter((sampleDataArray) => {
          return sampleDataArray[1] !== sample.sampleName;
        });

        if (sample.poolName) {
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
            sample.poolName
          ][sample.subjectName][sampleName];

          //Delete the samples folder in the datasetStructureJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            if (
              datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                sample.poolName
              ]?.["folders"]?.[sample.subjectName]?.["folders"]?.[sampleName]
            ) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                sample.poolName
              ]["folders"][sample.subjectName]["folders"][sampleName];
            }
          }
        } else {
          delete this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"][
            sample.subjectName
          ][sampleName];

          //Delete the samples folder in the datasetStructureJSONObj
          for (const highLevelFolder of guidedHighLevelFolders) {
            if (
              datasetStructureJSONObj?.["folders"]?.[highLevelFolder]?.["folders"]?.[
                sample.subjectName
              ]?.["folders"]?.[sampleName]
            ) {
              delete datasetStructureJSONObj["folders"][highLevelFolder]["folders"][
                sample.subjectName
              ]["folders"][sampleName];
            }
          }
        }
      }
    }
  };
  globals.sodaJSONObj.getAllSubjects = function () {
    let subjectsInPools = [];
    let subjectsOutsidePools = [];

    for (const [poolName, pool] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      for (const [subjectName, subjectData] of Object.entries(pool)) {
        subjectsInPools.push({
          subjectName: subjectName,
          poolName: poolName,
          samples: Object.keys(subjectData),
        });
      }
    }

    for (const [subjectName, subjectData] of Object.entries(
      this["dataset-metadata"]["pool-subject-sample-structure"]["subjects"]
    )) {
      subjectsOutsidePools.push({
        subjectName: subjectName,
        samples: Object.keys(subjectData),
      });
    }
    return [subjectsInPools, subjectsOutsidePools];
  };

  globals.sodaJSONObj.updatePrimaryDatasetStructure = function () {
    //Add pool keys to primary dataset structure
    for (const pool of Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"]
    )) {
      if (datasetStructureJSONObj["folders"]["primary"]["folders"][pool]) {
        datasetStructureJSONObj["folders"]["primary"]["folders"][pool] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
    //Add sample keys to primary dataset structure
    for (const sample of Object.keys(
      this["dataset-metadata"]["pool-subject-sample-structure"]["samples"]
    )) {
      if (datasetStructureJSONObj["folders"]["primary"]["folders"][sample]) {
        datasetStructureJSONObj["folders"]["primary"]["folders"][sample] = {
          folders: {},
          files: {},
          type: "",
          action: [],
        };
      }
    }
  };
};

/********** Folder structure utility **********/
const highLevelFolderPageData = {
  primary: {
    headerText: "Virtually structure your primary folder in the interface below.",
    contentsText:
      "Your primary should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "primary/",
    backPageId: "guided-primary-folder-tab",
  },
  source: {
    headerText: "Virtually structure your source folder in the interface below.",
    contentsText:
      "Your source folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "source/",
    backPageId: "guided-source-folder-tab",
  },
  derivative: {
    headerText: "Virtually structure your derivative folder in the interface below.",
    contentsText:
      "Your derivative folder should contain lorem ipsum foo bar random instructional text will go here",
    pathSuffix: "derivative/",
    backPageId: "guided-derivative-folder-tab",
  },
  code: {
    headerText: "Provide the code data associated with your dataset in the interface below",
    contentsText: `You can also virtually structure the data and rename files/folders
    as you would like to have them in your dataset when it is generated (note that none of
    your original data will be modified).<br />`,
    pathSuffix: "code/",
    backPageId: "guided-code-folder-tab",
  },
  protocol: {
    headerText: "Provide the protocol data associated with your dataset in the interface below",
    contentsText: `You can also virtually structure the data and rename files/folders
    as you would like to have them in your dataset when it is generated (note that none of
    your original data will be modified).`,
    pathSuffix: "protocol/",
    backPageId: "guided-protocol-folder-tab",
  },
  docs: {
    headerText: "Provide docs data associated with your dataset in the interface below",
    contentsText: `You can also virtually structure the data and rename files/folders
    as you would like to have them in your dataset when it is generated (note that none of
    your original data will be modified).`,
    pathSuffix: "docs/",
    backPageId: "guided-docs-folder-tab",
  },
};
const generateHighLevelFolderSubFolderPageData = (
  sampleOrSubject,
  highLevelFolderName,
  pathSuffix
) => {
  const customPageData = {
    pathSuffix: `${highLevelFolderName}/${pathSuffix}`,
    backPageId: `guided-${sampleOrSubject}-folder-tab`,
  };
  return customPageData;
};

const updateFolderStructureUI = (pageDataObj) => {
  //If the pageDataObj has header and contents, set element text and hide
  //If not, remove the elements from the screen
  const fileExplorer = document.getElementById("guided-file-explorer-elements");
  const structureFolderHeaderElement = document.getElementById("structure-folder-header");
  const structureFolderContentsElement = document.getElementById("structure-folder-contents");

  // fileExplorer.style.webkitAnimation = "none";
  fileExplorer.classList.remove("file-explorer-transition");

  if (pageDataObj.headerText) {
    structureFolderHeaderElement.innerHTML = pageDataObj.headerText;
    structureFolderHeaderElement.classList.remove("hidden");
  } else {
    structureFolderHeaderElement.classList.add("hidden");
  }
  if (pageDataObj.contentsText) {
    structureFolderContentsElement.innerHTML = pageDataObj.contentsText;
    structureFolderContentsElement.classList.remove("hidden");
  } else {
    structureFolderContentsElement.classList.add("hidden");
  }

  // if (fileExplorer.classList.contains("file-explorer-transition")) {
  // }
  // fileExplorer.style.webkitAnimation = "";
  setTimeout(function () {
    fileExplorer.classList.add("file-explorer-transition");
  }, 200);

  $("#guided-input-global-path").val(`My_dataset_folder/${pageDataObj.pathSuffix}`);
  var filtered = getGlobalPath(globals.organizeDSglobalPath);
  globals.organizeDSglobalPath.value = filtered.slice(0, filtered.length).join("/") + "/";

  var myPath = datasetStructureJSONObj;
  for (var item of filtered.slice(1, filtered.length)) {
    myPath = myPath["folders"][item];
  }
  // construct UI with files and folders
  //var appendString = loadFileFolder(myPath);

  /// empty the div

  // reconstruct div with new elements

  //where folder section items will be created
  listItems(myPath, "#items", 500, (reset = true));
  getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
};
//Description metadata functions
const editAdditionalLink = (clickedEditLinkButton) => {
  const tr = clickedEditLinkButton.parentNode.parentNode;
};

const deleteAdditionalLink = (clickedDeleteLinkButton) => {
  const tr = clickedDeleteLinkButton.parentNode.parentNode;
  const linkNameToDelete = tr.querySelector(".link-name-cell").innerHTML.trim();
  const additionalLinks =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  //filter additional links to remove the one to be deleted
  const filteredAdditionalLinks = additionalLinks.filter((link) => {
    return link.link != linkNameToDelete;
  });
  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"] =
    filteredAdditionalLinks;
  //update the UI
  renderAdditionalLinksTable();
};
const generateadditionalLinkRowElement = (link, linkType, linkRelation) => {
  return `
    <tr>
      <td class="middle aligned collapsing link-name-cell">
        ${link}
      </td>
      <td class="middle aligned collapsing">
        ${linkType}
      </td>
      <td class="middle aligned collapsing">
        ${linkRelation}
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="deleteAdditionalLink(this)"
        >
          Delete link
        </button>
      </td>
    </tr>
  `;
};

const generateContributorField = (
  contributorLastName,
  contributorFirstName,
  contributorORCID,
  contributorAffiliations,
  contributorRoles
) => {
  const initialContributorAffiliationString = contributorAffiliations
    ? contributorAffiliations.join(",")
    : "";
  const initialContributorRoleString = contributorRoles ? contributorRoles.join(",") : "";
  return `
      <div
        class="guided--section mt-lg neumorphic guided-contributor-field-container"
        style="width: 100%; position: relative;"
        data-contributor-first-name="${contributorFirstName ? contributorFirstName : ""}"
        data-contributor-last-name="${contributorLastName ? contributorLastName : ""}"
      >
        <i
          class="fas fa-times fa-2x"
          style="
            position: absolute;
            top: 10px;
            right: 15px;
            color: black;
            cursor: pointer;
          "
          onclick="removeContributorField(this)"
        >
        </i>
        <h2 class="guided--text-sub-step">
          Enter
          <span class="contributor-first-name">${
            contributorFirstName ? contributorFirstName : "contributor's"
          }</span>'s
          contributor details
        </h2>
        <div class="space-between w-100">
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">Last name: </label>
            <input
              class="
                guided--input
                guided-last-name-input
              "
              type="text"
              placeholder="Enter last name here"
              onkeyup="validateInput($(this))"
              value="${contributorLastName ? contributorLastName : ""}"
            />
          </div>
          <div class="guided--flex-center mt-sm" style="width: 45%">
            <label class="guided--form-label required">First name: </label>
            <input
              class="
                guided--input
                guided-first-name-input
              "
              type="text"
              placeholder="Enter first name here"
              onkeyup="validateInput($(this))"
              value="${contributorFirstName ? contributorFirstName : ""}"
            />
          </div>
        </div>
        <label class="guided--form-label mt-md required">ORCID: </label>
        <input
          class="
            guided--input
            guided-orcid-input
          "
          type="text"
          placeholder="Enter ORCID here"
          onkeyup="validateInput($(this))"
          value="${contributorORCID ? contributorORCID : ""}"
        />
        <label class="guided--form-label mt-md required">Affiliation(s): </label>
        <input class="guided-contributor-affiliation-input"
          contenteditable="true"
          data-initial-contributor-affiliation="${initialContributorAffiliationString}"
        />
        <label class="guided--form-label mt-md required">Role(s): </label>
        <input class="guided-contributor-role-input"
          contenteditable="true"
          data-initial-contributor-roles="${initialContributorRoleString}"
        />
      </div>
    `;
};

const removeContributorField = (contributorDeleteButton) => {
  const contributorField = contributorDeleteButton.parentElement;
  const contributorFirstName = contributorField.dataset.contributorFirstName;
  const contributorLastName = contributorField.dataset.contributorLastName;

  const contributorsBeforeDelete =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  //If the contributor has data-first-name and data-last-name, then it is a contributor that
  //already been added. Delete it from the contributors array.
  if (contributorFirstName && contributorLastName) {
    const filteredContributors = contributorsBeforeDelete.filter((contributor) => {
      //remove contributors with matching first and last name
      return !(
        contributor.contributorFirstName == contributorFirstName &&
        contributor.contributorLastName == contributorLastName
      );
    });

    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] = filteredContributors;
  }

  contributorField.remove();
};

const fetchContributorDataFromAirTable = async () => {
  try {
    const sparcAward = globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
    const airTableKeyData = parseJson(airtableConfigPath);
    if (
      sparcAward &&
      airTableKeyData["api-key"] &&
      airTableKeyData["api-key"] &&
      airTableKeyData["key-name"] !== "" &&
      airTableKeyData["api-key"] !== ""
    ) {
      let contributorData = [];

      const airKeyInput = airTableKeyData["api-key"];

      Airtable.configure({
        endpointUrl: "https://" + airtableHostname,
        apiKey: airKeyInput,
      });
      var base = Airtable.base("appiYd1Tz9Sv857GZ");
      await base("sparc_members")
        .select({
          filterByFormula: `({SPARC_Award_#} = "${sparcAward}")`,
        })
        .eachPage(function page(records, fetchNextPage) {
          records.forEach(function (record) {
            const firstName = record.get("First_name");
            const lastName = record.get("Last_name");
            const orcid = record.get("ORCID");
            const affiliation = record.get("Institution");
            const roles = record.get("Dataset_contributor_roles_for_SODA");

            if (firstName !== undefined && lastName !== undefined) {
              contributorData.push({
                firstName: firstName,
                lastName: lastName,
                orcid: orcid,
                affiliation: affiliation,
                roles: roles,
              });
            }
          }),
            fetchNextPage();
        });

      return contributorData;
    } else {
      //return an empty array if the user is not connected with AirTable
      return [];
    }
  } catch (error) {
    console.log(error);
    //If there is an error, return an empty array since no contributor data was fetched.
    return [];
  }
};

const addContributor = (
  contributorFirstName,
  contributorLastName,
  contributorORCID,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  if (getContributorByOrcid(contributorORCID)) {
    throw new Error("A contributor with the entered ORCID already exists");
  }

  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"].push({
    contributorFirstName: contributorFirstName,
    contributorLastName: contributorLastName,
    conName: `${contributorFirstName} ${contributorLastName}`,
    conID: contributorORCID,
    conAffliation: contributorAffiliationsArray.map((affiliation) => affiliation.value),
    conRole: contributorRolesArray.map((role) => role.value),
  });
};

const editContributorByOrcid = (
  prevContributorOrcid,
  contributorFirstName,
  contributorLastName,
  newContributorOrcid,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  const contributor = getContributorByOrcid(prevContributorOrcid);
  if (!contributor) {
    throw new Error("No contributor with the entered ORCID exists");
  }

  if (prevContributorOrcid !== newContributorOrcid) {
    if (getContributorByOrcid(newContributorOrcid)) {
      throw new Error("A contributor with the entered ORCID already exists");
    }
  }

  contributor.contributorFirstName = contributorFirstName;
  contributor.contributorLastName = contributorLastName;
  contributor.conName = `${contributorFirstName} ${contributorLastName}`;
  contributor.conID = newContributorOrcid;
  contributor.conAffliation = contributorAffiliationsArray.map((affiliation) => affiliation.value);
  contributor.conRole = contributorRolesArray.map((role) => role.value);
};

const deleteContributor = (clickedDelContribuButton, contributorOrcid) => {
  const contributorField = clickedDelContribuButton.parentElement.parentElement;
  const contributorsBeforeDelete =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
    contributorsBeforeDelete.filter((contributor) => {
      return contributor.conID !== contributorOrcid;
    });
  contributorField.remove();
  //rerender the table after deleting a contributor
  renderDatasetDescriptionContributorsTable();
};

const getContributorByOrcid = (orcid) => {
  const contributors = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  const contributor = contributors.find((contributor) => {
    return contributor.conID == orcid;
  });
  return contributor;
};

const verifyOrcidID = (event) => {
  // console.log(event.value);
  let userInput = event.value;
  //17 chars
  if (userInput.length > 17) {
    if (userInput.substr(0, 18) === "https://orcid.org/") {
      //verify every four characters forward if they are a number
      let afterLink = userInput.substr(18);
    }
    // console.log(userInput.substr(17));
    //char 18 will be after the forward slash
  }
};

const updateContributorByOrcid = (
  contributorFirstName,
  contributorLastName,
  contributorORCID,
  contributorAffiliationsArray,
  contributorRolesArray
) => {
  const contributorsBeforeUpdate =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];
  //Delete the contributor so we can add a new one with the updated information.
  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"] =
    contributorsBeforeUpdate.filter((contributor) => {
      //remove contributors with matching ORCID
      return contributor.conID !== contributorORCID;
    });

  addContributor(
    contributorFirstName,
    contributorLastName,
    contributorORCID,
    contributorAffiliationsArray,
    contributorRolesArray
  );
};

const openGuidedEditContributorSwal = async (contibuttorOrcidToEdit) => {
  const contributorData = getContributorByOrcid(contibuttorOrcidToEdit);
  const contributorFirstName = contributorData.contributorFirstName;
  const contributorLastName = contributorData.contributorLastName;
  const contributorORCID = contributorData.conID;
  const contributorAffiliationsArray = contributorData.conAffliation;
  const contributorRolesArray = contributorData.conRole;

  let affiliationTagify;
  let contributorRolesTagify;

  await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "800px",
    heightAuto: false,
    // title: contributorSwalTitle,
    html: `
      <div class="guided--flex-center mt-sm">
        <label class="guided--form-label centered mb-md">
          Make changes to the contributor's information below.
        </label>
        <div class="space-between w-100">
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required">Last name: </label>
              <input
                class="guided--input"
                id="guided-contributor-last-name"
                type="text"
                placeholder="Contributor's Last name"
                value=""
              />
            </div>
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required">First name: </label>
              <input
                class="guided--input"
                id="guided-contributor-first-name"
                type="text"
                placeholder="Contributor's first name"
                value=""
              />
            </div>
          </div>
          <label class="guided--form-label mt-md required">ORCID: </label>
          <input
            class="guided--input"
            id="guided-contributor-orcid"
            type="text"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            value=""
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            If your contributor does not have an ORCID, have the contributor <a
            target="_blank"
            href="https://orcid.org"
            >sign up for one on orcid.org</a
          >.

          </p>
          <label class="guided--form-label mt-md required">Affiliation(s): </label>
          <input id="guided-contributor-affiliation-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Institution(s) the contributor is affiliated with.
            <br />
            <b>
              Press enter after entering an institution to add it to the list.
            </b>
          </p>
          <label class="guided--form-label mt-md required">Role(s): </label>
          <input id="guided-contributor-roles-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Role(s) the contributor played in the creation of the dataset.
            <br />
            <b>
              Select a role from the dropdown to add it to the list.
            </b>
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Edit contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      //Create Affiliation(s) tagify for each contributor
      const contributorAffiliationInput = document.getElementById(
        "guided-contributor-affiliation-input"
      );
      affiliationTagify = new Tagify(contributorAffiliationInput, {
        duplicate: false,
      });
      createDragSort(affiliationTagify);
      affiliationTagify.addTags(contributorAffiliationsArray);

      const contributorRolesInput = document.getElementById("guided-contributor-roles-input");
      contributorRolesTagify = new Tagify(contributorRolesInput, {
        whitelist: [
          "PrincipleInvestigator",
          "Creator",
          "CoInvestigator",
          "DataCollector",
          "DataCurator",
          "DataManager",
          "Distributor",
          "Editor",
          "Producer",
          "ProjectLeader",
          "ProjectManager",
          "ProjectMember",
          "RelatedPerson",
          "Researcher",
          "ResearchGroup",
          "Sponsor",
          "Supervisor",
          "WorkPackageLeader",
          "Other",
        ],
        enforceWhitelist: true,
        dropdown: {
          enabled: 0,
          closeOnSelect: true,
          position: "auto",
        },
      });
      createDragSort(contributorRolesTagify);
      contributorRolesTagify.addTags(contributorRolesArray);

      document.getElementById("guided-contributor-first-name").value = contributorFirstName;
      document.getElementById("guided-contributor-last-name").value = contributorLastName;
      document.getElementById("guided-contributor-orcid").value = contributorORCID;
    },

    preConfirm: (inputValue) => {
      const contributorFirstName = document.getElementById("guided-contributor-first-name").value;
      const contributorLastName = document.getElementById("guided-contributor-last-name").value;
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value;
      const contributorAffiliations = affiliationTagify.value;
      const contributorRoles = contributorRolesTagify.value;

      if (
        !contributorFirstName ||
        !contributorLastName ||
        !contributorOrcid ||
        !contributorAffiliations.length > 0 ||
        !contributorRoles.length > 0
      ) {
        Swal.showValidationMessage("Please fill out all required fields");
      } else {
        if (contributorOrcid.length != 37) {
          Swal.showValidationMessage(
            "Please enter Orcid ID in the format: https://orcid.org/0000-0000-0000-0000"
          );
        } else {
          //verify first orcid link
          let orcidSite = contributorOrcid.substr(0, 18);
          if (orcidSite === "https://orcid.org/") {
            //verify digits after
            let orcidDigits = contributorOrcid.substr(18);
            let total = 0;
            for (let i = 0; i < orcidDigits.length - 1; i++) {
              const digit = parseInt(orcidDigits.substr(i, 1));
              if (isNaN(digit)) {
                continue;
              }
              total = (total + digit) * 2;
            }

            const remainder = total % 11;
            const result = (12 - remainder) % 11;
            const checkDigit = result === 10 ? "X" : String(result);

            if (checkDigit !== contributorOrcid.substr(-1)) {
              Swal.showValidationMessage("ORCID is not valid");
            } else {
              try {
                editContributorByOrcid(
                  contibuttorOrcidToEdit,
                  contributorFirstName,
                  contributorLastName,
                  contributorOrcid,
                  contributorAffiliations,
                  contributorRoles
                );
              } catch (error) {
                Swal.showValidationMessage(error);
              }
            }
          } else {
            Swal.showValidationMessage(
              "Please enter your ORCID ID with https://orcid.org/ in the beginning"
            );
          }
        }
      }

      //rerender the table after adding a contributor
      renderDatasetDescriptionContributorsTable();
    },
  });
};

const openGuidedAddContributorSwal = async () => {
  let contributorAdditionHeader;
  let addContributorTitle;

  try {
    const existingContributors =
      globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

    const extingContributorOrcids = existingContributors.map((contributor) => {
      return contributor.conID;
    });

    let contributorData = await fetchContributorDataFromAirTable();

    //Filter out contributors that have already been added
    contributorData = contributorData.filter((contributor) => {
      return !extingContributorOrcids.includes(contributor.orcid);
    });

    // If contributor data is returned from airtable, add a select option for each contributor with
    // a returned first and last name
    if (contributorData.length > 0) {
      addContributorTitle =
        "Select a contributor from the dropdown below or add their information manually.";
      contributorAdditionHeader = `
          <option
            value=""
            data-first-name=""
            data-last-name=""
            data-orcid=""
            data-affiliation=""
            data-roles=""
          >
            Select a contributor
          </option>
        `;

      const contributorOptions = contributorData.map((contributor) => {
        return `
          <option
            value="${contributor.firstName} ${contributor.lastName}"
            data-first-name="${contributor.firstName}"
            data-last-name="${contributor.lastName}"
            data-orcid="${contributor.orcid ?? ""}"
            data-affiliation="${contributor.affiliation ?? ""}"
            data-roles="${contributor.roles ? contributor.roles.join(",") : ""}"
          >
            ${contributor.firstName} ${contributor.lastName}
          </option>
        `;
      });

      contributorAdditionHeader = `
        <select
          class="w-100"
          id="guided-dd-contributor-dropdown"
          data-live-search="true"
          name="Dataset contributor"
        >
          <option
            value=""
            data-first-name=""
            data-last-name=""
            data-orcid=""
            data-affiliation=""
            data-roles=""
          >
            Select a contributor imported from AirTable
          </option>
          ${contributorOptions}
        </select>
      `;
    } else {
      contributorAdditionHeader = ``;
      addContributorTitle = "Enter the contributor's information below.";
    }
  } catch (error) {
    console.log(error);
  }

  let affiliationTagify;
  let contributorRolesTagify;

  const { value: newContributorData } = await Swal.fire({
    allowOutsideClick: false,
    allowEscapeKey: false,
    backdrop: "rgba(0,0,0, 0.4)",
    width: "800px",
    heightAuto: false,
    // title: contributorSwalTitle,
    html: `
      <div class="guided--flex-center mt-sm">
        <label class="guided--form-label centered mb-md">
          ${addContributorTitle}
        </label>
        ${contributorAdditionHeader}
        <div class="space-between w-100">
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required">Last name: </label>
              <input
                class="guided--input"
                id="guided-contributor-last-name"
                type="text"
                placeholder="Contributor's Last name"
                value=""
              />
            </div>
            <div class="guided--flex-center mt-sm" style="width: 45%">
              <label class="guided--form-label required">First name: </label>
              <input
                class="guided--input"
                id="guided-contributor-first-name"
                type="text"
                placeholder="Contributor's first name"
                value=""
              />
            </div>
          </div>
          <label class="guided--form-label mt-md required">ORCID: </label>
          <input
            class="guided--input"
            id="guided-contributor-orcid"
            type="text"
            placeholder="https://orcid.org/0000-0000-0000-0000"
            value=""
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            If your contributor does not have an ORCID, have the contributor <a
            target="_blank"
            href="https://orcid.org"
            >sign up for one on orcid.org</a
          >.

          </p>
          <label class="guided--form-label mt-md required">Affiliation(s): </label>
          <input id="guided-contributor-affiliation-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Institution(s) the contributor is affiliated with.
            <br />
            <b>
              Press enter after entering an institution to add it to the list.
            </b>
          </p>
          <label class="guided--form-label mt-md required">Role(s): </label>
          <input id="guided-contributor-roles-input"
            contenteditable="true"
          />
          <p class="guided--text-input-instructions mb-0 text-left">
            Role(s) the contributor played in the creation of the dataset.
            <br />
            <b>
              Select a role from the dropdown to add it to the list.
            </b>
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Add contributor",
    confirmButtonColor: "#3085d6 !important",
    willOpen: () => {
      //Create Affiliation(s) tagify for each contributor
      const contributorAffiliationInput = document.getElementById(
        "guided-contributor-affiliation-input"
      );
      affiliationTagify = new Tagify(contributorAffiliationInput, {
        duplicate: false,
      });
      createDragSort(affiliationTagify);

      const contributorRolesInput = document.getElementById("guided-contributor-roles-input");
      contributorRolesTagify = new Tagify(contributorRolesInput, {
        whitelist: [
          "PrincipleInvestigator",
          "Creator",
          "CoInvestigator",
          "DataCollector",
          "DataCurator",
          "DataManager",
          "Distributor",
          "Editor",
          "Producer",
          "ProjectLeader",
          "ProjectManager",
          "ProjectMember",
          "RelatedPerson",
          "Researcher",
          "ResearchGroup",
          "Sponsor",
          "Supervisor",
          "WorkPackageLeader",
          "Other",
        ],
        enforceWhitelist: true,
        dropdown: {
          enabled: 0,
          closeOnSelect: true,
          position: "auto",
        },
      });
      createDragSort(contributorRolesTagify);

      $("#guided-dd-contributor-dropdown").selectpicker({
        style: "guided--select-picker",
      });
      $("#guided-dd-contributor-dropdown").selectpicker("refresh");
      $("#guided-dd-contributor-dropdown").on("change", function (e) {
        const selectedFirstName = $("#guided-dd-contributor-dropdown option:selected").data(
          "first-name"
        );
        const selectedLastName = $("#guided-dd-contributor-dropdown option:selected").data(
          "last-name"
        );
        const selectedOrcid = $("#guided-dd-contributor-dropdown option:selected").data("orcid");
        const selectedAffiliation = $("#guided-dd-contributor-dropdown option:selected").data(
          "affiliation"
        );
        const selectedRoles = $("#guided-dd-contributor-dropdown option:selected").data("roles");

        document.getElementById("guided-contributor-first-name").value = selectedFirstName;
        document.getElementById("guided-contributor-last-name").value = selectedLastName;
        document.getElementById("guided-contributor-orcid").value = selectedOrcid;

        affiliationTagify.removeAllTags();
        affiliationTagify.addTags(selectedAffiliation);

        contributorRolesTagify.removeAllTags();
        contributorRolesTagify.addTags(selectedRoles.split());
      });
    },

    preConfirm: (inputValue) => {
      const contributorFirstName = document.getElementById("guided-contributor-first-name").value;
      const contributorLastName = document.getElementById("guided-contributor-last-name").value;
      const contributorOrcid = document.getElementById("guided-contributor-orcid").value;
      const contributorAffiliations = affiliationTagify.value;
      const contributorRoles = contributorRolesTagify.value;

      if (
        !contributorFirstName ||
        !contributorLastName ||
        !contributorOrcid ||
        !contributorAffiliations.length > 0 ||
        !contributorRoles.length > 0
      ) {
        Swal.showValidationMessage("Please fill out all required fields");
      } else {
        if (contributorOrcid.length != 37) {
          Swal.showValidationMessage(
            "Please enter Orcid ID in the format: https://orcid.org/0000-0000-0000-0000"
          );
        } else {
          //verify first orcid link
          let orcidSite = contributorOrcid.substr(0, 18);
          if (orcidSite === "https://orcid.org/") {
            //verify digits after
            let orcidDigits = contributorOrcid.substr(18);
            let total = 0;
            for (let i = 0; i < orcidDigits.length - 1; i++) {
              const digit = parseInt(orcidDigits.substr(i, 1));
              if (isNaN(digit)) {
                continue;
              }
              total = (total + digit) * 2;
            }

            const remainder = total % 11;
            const result = (12 - remainder) % 11;
            const checkDigit = result === 10 ? "X" : String(result);

            if (checkDigit !== contributorOrcid.substr(-1)) {
              Swal.showValidationMessage("ORCID is not valid");
            } else {
              try {
                addContributor(
                  contributorFirstName,
                  contributorLastName,
                  contributorOrcid,
                  contributorAffiliations,
                  contributorRoles
                );
              } catch (error) {
                Swal.showValidationMessage(error);
              }
            }
          } else {
            Swal.showValidationMessage(
              "Please enter your ORCID ID with https://orcid.org/ in the beginning"
            );
          }
        }
      }

      //rerender the table after adding a contributor
      renderDatasetDescriptionContributorsTable();
    },
  });
};

const generateContributorTableRow = (contributorObj) => {
  const contributorFullName = contributorObj["conName"];
  const contributorOrcid = contributorObj["conID"];
  const contributorRoleString = contributorObj["conRole"].join(", ");

  return `
    <tr>
      <td class="middle aligned">
        ${contributorFullName}
      </td>
      <td class="middle aligned">
        ${contributorRoleString}
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
          onclick="openGuidedEditContributorSwal('${contributorOrcid}')"
        >
        View/Edit
        </button>
      </td>
      <td class="middle aligned collapsing text-center">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="deleteContributor(this, '${contributorOrcid}')"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
};

const renderDatasetDescriptionContributorsTable = () => {
  const contributorsTable = document.getElementById("guided-DD-connoributors-table");

  let contributorsTableHTML;

  const contributors = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

  if (contributors.length === 0) {
    contributorsTableHTML = `
      <tr>
        <td colspan="4">
          <div style="margin-right:.5rem" class="alert alert-warning guided--alert" role="alert">
            No contributors have been added to your dataset. To add a contributor, click the "Add a new contributor" button below.
          </div>
        </td>
      </tr>
    `;
  } else {
    contributorsTableHTML = contributors
      .map((contributor) => {
        return generateContributorTableRow(contributor);
      })
      .join("\n");
  }
  contributorsTable.innerHTML = contributorsTableHTML;
};

const addContributorField = () => {
  const contributorsContainer = document.getElementById("contributors-container");
  //create a new div to hold contributor fields
  const newContributorField = document.createElement("div");
  newContributorField.classList.add("guided--section");
  newContributorField.classList.add("mt-lg");
  newContributorField.classList.add("neumorphic");
  newContributorField.classList.add("guided-contributor-field-container");
  newContributorField.style.width = "100%";
  newContributorField.style.position = "relative";

  newContributorField.innerHTML = `
    <i
      class="fas fa-times fa-2x"
      style="
        position: absolute;
        top: 10px;
        right: 15px;
        color: black;
        cursor: pointer;
      "
      onclick="removeContributorField(this)"
    >
    </i>
    <h2 class="guided--text-sub-step">
      Enter contributor details
    </h2>
    <div class="space-between w-100">
      <div class="guided--flex-center mt-sm" style="width: 45%">
        <label class="guided--form-label required">Last name: </label>
        <input
          class="guided--input guided-last-name-input"
          type="text"
          placeholder="Enter last name here"
          onkeyup="validateInput($(this))"
        />
      </div>
      <div class="guided--flex-center mt-sm" style="width: 45%">
        <label class="guided--form-label required">First name: </label>
        <input
          class="guided--input guided-first-name-input"
          type="text"
          placeholder="Enter first name here"
          onkeyup="validateInput($(this))"
        />
      </div>
    </div>
    <label class="guided--form-label required mt-md">ORCID: </label>
    <input
      class="guided--input guided-orcid-input"
      type="text"
      placeholder="Enter ORCID here"
      onkeyup="validateInput($(this))"
    />
    <label class="guided--form-label required mt-md">Affiliation(s): </label>
    <input class="guided-contributor-affiliation-input"
          contenteditable="true"
    />

    <label class="guided--form-label required mt-md">Role(s): </label>
    <input class="guided-contributor-role-input"
      contenteditable="true"
      placeholder='Type here to view and add contributor roles from the list of standard roles'
    />
  `;

  contributorsContainer.appendChild(newContributorField);

  //select the last contributor role input (the one that was just added)
  const newlyAddedContributorField = contributorsContainer.lastChild;

  //Create Affiliation(s) tagify for each contributor
  const contributorAffiliationInput = newlyAddedContributorField.querySelector(
    ".guided-contributor-affiliation-input"
  );
  const affiliationTagify = new Tagify(contributorAffiliationInput, {
    duplicate: false,
  });

  createDragSort(affiliationTagify);

  const newContributorRoleElement = newlyAddedContributorField.querySelector(
    ".guided-contributor-role-input"
  );
  //Add a new tagify for the contributor role field for the new contributor field
  const tagify = new Tagify(newContributorRoleElement, {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
      position: "auto",
    },
  });
  //scroll to the new element

  createDragSort(tagify);
  smoothScrollToElement(newlyAddedContributorField);
};

const addProtocolField = async () => {
  const protocolsContainer = document.getElementById("protocols-container");
  const values = await openProtocolSwal();
  if (values) {
    let firstProtocol = protocolsContainer.children[0];
    if (firstProtocol.id === "protocolAlert") {
      firstProtocol.remove();
    }
    const newProtocolField = generateProtocolField(values[0], values[1], values[3]);
    //add sweet alert here
    protocolsContainer.insertAdjacentHTML("beforeend", newProtocolField);
    //scroll to the new element
    scrollToBottomOfGuidedBody();
  }
};

const openProtocolSwal = async (protocolElement) => {
  //pass in name of url and check within soda json
  let protocolURL = "";
  let protocolDescription = "";
  if (protocolElement) {
    protocolURL = protocolElement.dataset.protocolUrl;
    protocolDescription = protocolElement.dataset.protocolDescription;
  }
  const { value: values } = await Swal.fire({
    title: "Add a protocol",
    html:
      `<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL" value="${protocolURL}">` +
      `<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description">${protocolDescription}</textarea>`,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    width: "38rem",
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      var link = $("#DD-protocol-link").val();
      let protocolLink = "";
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      } else {
        if (doiRegex.declared({ exact: true }).test(link) === true) {
          protocolLink = "DOI";
        } else {
          //check if link is valid
          if (validator.isURL(link) != true) {
            Swal.showValidationMessage(`Please enter a valid link`);
          } else {
            //link is valid url and check for 'doi' in link
            if (link.includes("doi")) {
              protocolLink = "DOI";
            } else {
              protocolLink = "URL";
            }
          }
        }
      }
      if ($("#DD-protocol-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
      }
      var duplicate = checkLinkDuplicate(
        $("#DD-protocol-link").val(),
        document.getElementById("protocol-link-table-dd")
      );
      if (duplicate) {
        Swal.showValidationMessage(
          "Duplicate protocol. The protocol you entered is already added."
        );
      }
      return [
        $("#DD-protocol-link").val(),
        protocolLink,
        "IsProtocolFor",
        $("#DD-protocol-description").val(),
      ];
    },
  });
  if (values) {
    if (protocolElement) {
      protocolElement.dataset.protocolUrl = values[0];
      protocolElement.children[0].innerText = values[0];
      protocolElement.dataset.protocolType = values[1];
      protocolElement.children[1].innerText = values[1];
      protocolElement.dataset.protocolDescription = values[3];
    } else {
      return values;
    }
  }
};

const removeProtocolField = (protocolElement) => {
  const protocolURL = protocolElement.dataset.protocolUrl;
  const protocolDescription = protocolElement.dataset.protocolDescription;

  const protocolsBeforeDelete =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  //If the protocol has data-protocol-url and data-protocol-description, then it is a protocol that
  //already been added. Delete it from the protocols array.
  if (protocolsBeforeDelete != undefined) {
    //protocolsBeforeDelete will be undefined on a new dataset with no protocols yet
    //until protocols are saved we won't need to go through this
    const filteredProtocols = protocolsBeforeDelete.filter((protocol) => {
      //remove protocols with matching protocol url and protocol description
      return !(protocol.link == protocolURL && protocol.description == protocolDescription);
    });

    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"] = filteredProtocols;
  }

  protocolElement.remove();
  //if all are deleted then append message
  let protocolsContainer = document.getElementById("protocols-container");
  if (protocolsContainer.children.length === 0) {
    const emptyRowWarning = generateAlertElement(
      "warning",
      "You currently have no protocols for your dataset. To add, click the 'Add a new protocol' button"
    );
    let warningRowElement = `<tr id="protocolAlert"><td colspan="5">${emptyRowWarning}</td></tr>`;
    document.getElementById("protocols-container").innerHTML = warningRowElement;
  }
};

//TODO: handle new blank protocol fields (when parameter are blank)
const generateProtocolField = (protocolUrl, protocolType, protocolDescription) => {
  return `
    <tr
      class="guided-protocol-field-container"
      data-protocol-url="${protocolUrl}"
      data-protocol-description="${protocolDescription}"
      data-protocol-type="${protocolType}"
    >
      <td class="middle aligned collapsing link-name-cell" style="color: black">
        ${protocolUrl}
      </td>
      <td class="middle aligned collapsing link-name-cell" style="color: black">
        ${protocolType}
      </td>
      <td class="middle aligned collapsing link-name-cell">
        <button
          type="button"
          class="btn btn-sm"
          style="color: white; background-color: var(--color-light-green); border-color: var(--color-light-green);"
          onclick="openProtocolSwal(this.parentElement.parentElement)"
        >
        View/Edit
        </button>
      </td>
      <td class="middle aligned collapsing link-name-cell">
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick=removeProtocolField(this.parentElement.parentElement)
        >
        Delete
        </button>
      </td>
    </tr>
  `;
};

const renderProtocolsTable = () => {
  const protocols = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];

  const protocolsContainer = document.getElementById("protocols-container");

  //protocols is either undefined when brand new dataset or 0 when returning from a saved dataset
  if (protocols === undefined || protocols.length === 0) {
    const emptyRowWarning = generateAlertElement(
      "warning",
      "You currently have no protocols for your dataset. To add, click the 'Add a new protocol' button"
    );
    let warningRowElement = `<tr id="protocolAlert"><td colspan="5">${emptyRowWarning}</td></tr>`;
    protocolsContainer.innerHTML = warningRowElement;
    return;
  }

  const protocolElements = protocols
    .map((protocol) => {
      return generateProtocolField(protocol["link"], protocol["type"], protocol["description"]);
    })
    .join("\n");
  protocolsContainer.innerHTML = protocolElements;
};

const renderContributorFields = (contributionMembersArray) => {
  //loop through curationMembers object
  let contributionMembersElements = contributionMembersArray
    .map((contributionMember) => {
      return generateContributorField(
        contributionMember["contributorLastName"],
        contributionMember["contributorFirstName"],
        contributionMember["conID"],
        contributionMember["conAffliation"],
        contributionMember["conRole"]
      );
    })
    .join("\n");

  const contributorsContainer = document.getElementById("contributors-container");
  contributorsContainer.innerHTML = contributionMembersElements;

  //Create Affiliation(s) tagify for each contributor
  const contributorAffiliationInputs = contributorsContainer.querySelectorAll(
    ".guided-contributor-affiliation-input"
  );
  contributorAffiliationInputs.forEach((contributorAffiliationInput) => {
    const tagify = new Tagify(contributorAffiliationInput, {
      duplicate: false,
    });
    createDragSort(tagify);
    if (contributorAffiliationInput.dataset.initialContributorAffiliation) {
      const initialAffiliations = contributorAffiliationInput.dataset.initialContributorAffiliation;
      const initialAffiliationsArray = initialAffiliations.split(",");
      for (const initialAffiliation of initialAffiliationsArray) {
        tagify.addTags([initialAffiliation]);
      }
    }
  });

  //create Role(s) tagify for each contributor
  const contributorRoleInputs = contributorsContainer.querySelectorAll(
    ".guided-contributor-role-input"
  );
  contributorRoleInputs.forEach((contributorRoleElement) => {
    const tagify = new Tagify(contributorRoleElement, {
      whitelist: [
        "PrincipleInvestigator",
        "Creator",
        "CoInvestigator",
        "DataCollector",
        "DataCurator",
        "DataManager",
        "Distributor",
        "Editor",
        "Producer",
        "ProjectLeader",
        "ProjectManager",
        "ProjectMember",
        "RelatedPerson",
        "Researcher",
        "ResearchGroup",
        "Sponsor",
        "Supervisor",
        "WorkPackageLeader",
        "Other",
      ],
      enforceWhitelist: true,
      dropdown: {
        enabled: 0,
        closeOnSelect: true,
        position: "auto",
      },
    });
    createDragSort(tagify);
    //if contributorRoleElement has data-initial-contributors, the create a tagify for each comma split contributor role
    if (contributorRoleElement.dataset.initialContributorRoles) {
      const initialContributors = contributorRoleElement.dataset.initialContributorRoles;
      const initialContributorsArray = initialContributors.split(",");
      for (const contirubtorRole of initialContributorsArray) {
        tagify.addTags([contirubtorRole]);
      }
    }
  });

  //show the contributor fields
  unHideAndSmoothScrollToElement("guided-div-contributor-field-set");
};
const renderAdditionalLinksTable = () => {
  const additionalLinksTableBody = document.getElementById("additional-links-table-body");
  const additionalLinkData =
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];
  if (additionalLinkData.length != 0) {
    const additionalLinkElements = additionalLinkData
      .map((link) => {
        return generateadditionalLinkRowElement(link.link, link.type, link.relation);
      })
      .join("\n");
    additionalLinksTableBody.innerHTML = additionalLinkElements;
  } else {
    const emptyRowWarning = generateAlertElement(
      "warning",
      `You currently have no additional links. To add a link, click the "Add additional link" button below.`
    );
    warningRowElement = `<tr><td colspan="5">${emptyRowWarning}</td></tr>`;
    //add empty rowWarning to additionalLinksTableBody
    additionalLinksTableBody.innerHTML = warningRowElement;
  }
};
const openAddAdditionLinkSwal = async () => {
  const { value: values } = await Swal.fire({
    title: "Add additional link",
    html: `
      <label>
        URL or DOI:
      </label>
      <input
        id="guided-other-link"
        class="swal2-input"
        placeholder="Enter a URL"
      />
      <label>
        Relation to the dataset:
      </label>
      <select id="guided-other-link-relation" class="swal2-input">
        <option value="Select">Select a relation</option>
        <option value="IsCitedBy">IsCitedBy</option>
        <option value="Cites">Cites</option>
        <option value="IsSupplementTo">IsSupplementTo</option>
        <option value="IsSupplementedBy">IsSupplementedBy</option>
        <option value="IsContinuedByContinues">IsContinuedByContinues</option>
        <option value="IsDescribedBy">IsDescribedBy</option>
        <option value="Describes">Describes</option>
        <option value="HasMetadata">HasMetadata</option>
        <option value="IsMetadataFor">IsMetadataFor</option>
        <option value="HasVersion">HasVersion</option>
        <option value="IsVersionOf">IsVersionOf</option>
        <option value="IsNewVersionOf">IsNewVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
        <option value="HasPart">HasPart</option>
        <option value="IsPublishedIn">IsPublishedIn</option>
        <option value="IsReferencedBy">IsReferencedBy</option>
        <option value="References">References</option>
        <option value="IsDocumentedBy">IsDocumentedBy</option>
        <option value="Documents">Documents</option>
        <option value="IsCompiledBy">IsCompiledBy</option>
        <option value="Compiles">Compiles</option>
        <option value="IsVariantFormOf">IsVariantFormOf</option>
        <option value="IsOriginalFormOf">IsOriginalFormOf</option>
        <option value="IsIdenticalTo">IsIdenticalTo</option>
        <option value="IsReviewedBy">IsReviewedBy</option>
        <option value="Reviews">Reviews</option>
        <option value="IsDerivedFrom">IsDerivedFrom</option>
        <option value="IsSourceOf">IsSourceOf</option>
        <option value="IsRequiredBy">IsRequiredBy</option>
        <option value="Requires">Requires</option>
        <option value="IsObsoletedBy">IsObsoletedBy</option>
        <option value="Obsoletes">Obsoletes</option>
      </select>
      <label>
        Link description:
      </label>
      <textarea
        id="guided-other-description"
        class="swal2-textarea"
        placeholder="Enter a description"
      ></textarea>
    `,
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      const link = $("#guided-other-link").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link.`);
      }
      if ($("#guided-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please select a link relation.`);
      }
      if ($("#guided-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
      }
      var duplicate = checkLinkDuplicate(link, document.getElementById("other-link-table-dd"));
      if (duplicate) {
        Swal.showValidationMessage("Duplicate URL/DOI. The URL/DOI you entered is already added.");
      }
      return [
        $("#guided-other-link").val(),
        $("#guided-other-link-relation").val(),
        $("#guided-other-description").val(),
      ];
    },
  });
  if (values) {
    const link = values[0];
    const relation = values[1];
    let linkType;
    //check if link starts with "https://"
    if (link.startsWith("https://doi.org/")) {
      linkType = "DOI";
    } else {
      linkType = "URL";
    }
    const description = values[2];
    //add link to jsonObj
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"].push({
      link: link,
      relation: relation,
      description: description,
      type: linkType,
    });
    renderAdditionalLinksTable();
  }
};
/*const addOtherLinkField = () => {
  const otherLinksContainer = document.getElementById("other-links-container");
  //create a new div to hold other link fields
  const newOtherLink = document.createElement("div");
  newOtherLink.classList.add("guided--section");
  newOtherLink.classList.add("mt-lg");
  newOtherLink.classList.add("neumorphic");
  newOtherLink.classList.add("guided-other-links-field-container");
  newOtherLink.style.position = "relative";

  newOtherLink.innerHTML = `
    <i
      class="fas fa-times fa-2x"
      style="
        position: absolute;
        top: 10px;
        right: 15px;
        color: black;
        cursor: pointer;
      "
      onclick="removeOtherLinkField(this)"
    >
    </i>
    <h2 class="guided--text-sub-step">Enter link information</h2>
    <label class="guided--form-label mt-lg">Link URL: </label>
    <input
      class="guided--input guided-other-link-url-input"
      type="text"
      placeholder="Enter link URL here"
      onkeyup="validateInput($(this))"
    />
    <label class="guided--form-label mt-lg"
      >Link description:</label
    >
    <textarea
      class="guided--input guided--text-area guided-other-link-description-input"
      type="text"
      placeholder="Enter link description here"
      style="height: 7.5em; padding-bottom: 20px"
      onkeyup="validateInput($(this))"
    ></textarea>
    <label class="guided--form-label mt-lg"
      >Dataset relation:</label
    >
    <div style="display: flex; width:100%; align-items: center;">
      <p class="guided--help-text m-0">
        Text to put here (A)?
      </p>
      <div class="form-group mx-2">
        <select class="form-control guided-other-link-relation-dropdown" style="background-color: white !important">
          <option value="Select">Select a relation</option>
          <option value="IsCitedBy">IsCitedBy</option>
          <option value="Cites">Cites</option>
          <option value="IsSupplementTo">IsSupplementTo</option>
          <option value="IsSupplementedBy">IsSupplementedBy</option>
          <option value="IsContinuedByContinues">IsContinuedByContinues</option>
          <option value="IsDescribedBy">IsDescribedBy</option>
          <option value="Describes">Describes</option>
          <option value="HasMetadata">HasMetadata</option>
          <option value="IsMetadataFor">IsMetadataFor</option>
          <option value="HasVersion">HasVersion</option>
          <option value="IsVersionOf">IsVersionOf</option>
          <option value="IsNewVersionOf">IsNewVersionOf</option>
          <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
          <option value="IsPreviousVersionOf">IsPreviousVersionOf</option>
          <option value="HasPart">HasPart</option>
          <option value="IsPublishedIn">IsPublishedIn</option>
          <option value="IsReferencedBy">IsReferencedBy</option>
          <option value="References">References</option>
          <option value="IsDocumentedBy">IsDocumentedBy</option>
          <option value="Documents">Documents</option>
          <option value="IsCompiledBy">IsCompiledBy</option>
          <option value="Compiles">Compiles</option>
          <option value="IsVariantFormOf">IsVariantFormOf</option>
          <option value="IsOriginalFormOf">IsOriginalFormOf</option>
          <option value="IsIdenticalTo">IsIdenticalTo</option>
          <option value="IsReviewedBy">IsReviewedBy</option>
          <option value="Reviews">Reviews</option>
          <option value="IsDerivedFrom">IsDerivedFrom</option>
          <option value="IsSourceOf">IsSourceOf</option>
          <option value="IsRequiredBy">IsRequiredBy</option>
          <option value="Requires">Requires</option>
          <option value="IsObsoletedBy">IsObsoletedBy</option>
          <option value="Obsoletes">Obsoletes</option>
        </select>
      </div>
          <p class="guided--help-text m-0">
        Text to put here (B)?
      </p>
    </div>
  `;
  otherLinksContainer.appendChild(newOtherLink);
  //select the last protocol field (the one that was just added)
  const newlyAddedOtherLinkField = otherLinksContainer.lastChild;
  smoothScrollToElement(newlyAddedOtherLinkField);
};

const removeOtherLinkField = (otherLinkDeleteButton) => {
  const otherLinkField = protocolDeleteButton.parentElement;
  otherLinkField.remove();
};*/

//SUBJECT TABLE FUNCTIONS
const returnToTableFromFolderStructure = (clickedBackButton) => {
  previousFolderStructurePage = clickedBackButton.attr("data-prev-page");
  openPage(previousFolderStructurePage);
  $("#guided-footer-div").css("display", "flex");
  clickedBackButton.remove();
};

const returnToSubjectMetadataTableFromSubjectMetadataForm = () => {
  //Clear metadata form inputs
  clearAllSubjectFormFields(guidedSubjectsFormDiv);
};
const returnToSampleMetadataTableFromSampleMetadataForm = () => {
  //Clear metadata form inputs
  clearAllSubjectFormFields(guidedSamplesFormDiv);
  openPage("guided-create-samples-metadata-tab");
  $("#guided-footer-div").css("display", "flex");
};

const renderSubjectSampleAdditionTable = (subject) => {
  return `
    <table
      class="ui celled striped table"
      style="margin-bottom: 10px; width: 800px"
      data-samples-subject-name="${subject.subjectName}"
      data-samples-subjects-pool-name="${subject.poolName ? subject.poolName : ""}"
    >
      <thead>
        <tr>
          <th class="text-center" colspan="2" style="position: relative">
            <div class="space-between w-100 hidden">
              <span class="samples-subjects-pool">${subject.poolName ? subject.poolName : ""}</span>
              <span class="samples-subject-name">${subject.subjectName}</span>
            </div>

            Enter a unique sample ID for each sample taken from subject ${subject.subjectName}
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style="position: absolute; top: 10px; right: 20px;"
              onclick="addSampleSpecificationTableRow(this)"
            >
              Add sample
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        ${subject.samples
          .map((sample) => {
            return generateSampleRowElement(sample);
          })
          .join("\n")}
      </tbody>
    </table>
  `;
};

const guidedLoadSubjectMetadataIfExists = (subjectMetadataId) => {
  //loop through all subjectsTableData elements besides the first one
  for (let i = 0; i < subjectsTableData.length; i++) {
    //check through elements of tableData to find a subject ID match
    if (subjectsTableData[i][0] === subjectMetadataId) {
      //if the id matches, load the metadata into the form
      populateForms(subjectMetadataId, "", "guided");
      return;
    }
  }
};

const guidedLoadSampleMetadataIfExists = (sampleMetadataId, subjectMetadataId) => {
  //loop through all samplesTableData elemenents besides the first one
  for (let i = 1; i < samplesTableData.length; i++) {
    if (
      samplesTableData[i][0] === subjectMetadataId &&
      samplesTableData[i][1] === sampleMetadataId
    ) {
      //if the id matches, load the metadata into the form
      populateFormsSamples(subjectMetadataId, sampleMetadataId, "", "guided");
      return;
    }
  }
};
const openModifySubjectMetadataPage = (subjectMetadataID) => {
  guidedLoadSubjectMetadataIfExists(subjectMetadataID);
};
const openModifySampleMetadataPage = (
  sampleMetadataID,
  sampleMetadataSubjectID,
  sampleMetadataPoolID
) => {
  //Get all samples from the dataset and add all other samples to the was derived from dropdown
  const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];
  const samplesBesidesCurrSample = samples.filter(
    (sample) => sample.sampleName !== sampleMetadataID
  );
  document.getElementById("guided-bootbox-wasDerivedFromSample").innerHTML = `
 <option value="">Sample not derived from another sample</option>
 ${samplesBesidesCurrSample
   .map((sample) => {
     return `<option value="${sample.sampleName}">${sample.sampleName}</option>`;
   })
   .join("\n")}))
 `;

  //Add protocol titles to the protocol dropdown
  const protocols = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["protocols"];
  document.getElementById("guided-bootbox-sample-protocol-title").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.description}"
            data-protocol-link="${protocol.link}"
          >
            ${protocol.description}
          </option>
        `;
      })
      .join("\n")}))
  `;
  document.getElementById("guided-bootbox-sample-protocol-location").innerHTML = `
    <option value="">No protocols associated with this sample</option>
    ${protocols
      .map((protocol) => {
        return `
          <option
            value="${protocol.link}"
            data-protocol-description="${protocol.description}"
          >
            ${protocol.link}
          </option>
        `;
      })
      .join("\n")}))
  `;

  guidedLoadSampleMetadataIfExists(sampleMetadataID, sampleMetadataSubjectID);

  document.getElementById("guided-bootbox-sample-id").value = sampleMetadataID;
  document.getElementById("guided-bootbox-subject-id-samples").value = sampleMetadataSubjectID;
  document.getElementById("guided-bootbox-sample-pool-id").value = sampleMetadataPoolID;
};

const openCopySubjectMetadataPopup = async () => {
  //save current subject metadata entered in the form
  addSubject("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < subjectsTableData.length; i++) {
    const subjectID = subjectsTableData[i][0];
    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
          <input type="checkbox" name="copy-to" value="${subjectID}">
          <label>${subjectID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between" style="max-height: 500px; overflow-y: auto;">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subject would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which subjects would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;
  swal
    .fire({
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      width: 950,
      html: copyMetadataElement,
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      confirmButtonColor: "Copy",
      focusCancel: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        const selectedCopyFromSubject = $("input[name='copy-from']:checked").val();
        //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
        let selectedCopyToSubjects = [];
        $("input[name='copy-to']:checked").each(function () {
          selectedCopyToSubjects.push($(this).val());
        });
        let copyFromSubjectData = [];
        for (var i = 1; i < subjectsTableData.length; i++) {
          if (subjectsTableData[i][0] === selectedCopyFromSubject) {
            //copy all elements from matching array except the first two
            copyFromSubjectData = subjectsTableData[i].slice(2);
          }
        }
        for (subject of selectedCopyToSubjects) {
          //loop through all subjectsTableData elements besides the first one
          for (let i = 1; i < subjectsTableData.length; i++) {
            //check through elements of tableData to find a subject ID match
            if (subjectsTableData[i][0] === subject) {
              subjectsTableData[i] = [
                subjectsTableData[i][0],
                subjectsTableData[i][1],
                ...copyFromSubjectData,
              ];
            }
          }
        }
        const currentSubjectOpenInView = document.getElementById("guided-bootbox-subject-id").value;
        if (currentSubjectOpenInView) {
          //If a subject was open in the UI, update it with the new metadata
          openModifySubjectMetadataPage(currentSubjectOpenInView);
        }

        saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
      }
    });
};

const openCopySampleMetadataPopup = async () => {
  addSample("guided");

  let copyFromMetadata = ``;
  let copyToMetadata = ``;

  for (let i = 1; i < samplesTableData.length; i++) {
    const sampleID = samplesTableData[i][1];

    copyFromMetadata += `
      <div class="field text-left">
        <div class="ui radio checkbox">
          <input type="radio" name="copy-from" value="${sampleID}">
          <label>${sampleID}</label>
        </div>
      </div>
    `;
    copyToMetadata += `
      <div class="field text-left">
        <div class="ui checkbox">
        <input type="checkbox" name="copy-to" value="${sampleID}">
        <label>${sampleID}</label>
        </div>
      </div>
    `;
  }

  const copyMetadataElement = `
    <div class="space-between">
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which sample would you like to copy metadata from?</label>
          ${copyFromMetadata}
        </div>
      </div>
      <div class="ui form">
        <div class="grouped fields">
          <label class="guided--form-label med text-left">Which samples would you like to copy metadata to?</label>
          ${copyToMetadata}
        </div>
      </div>
    </div>
  `;

  swal
    .fire({
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      width: 950,
      html: copyMetadataElement,
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      confirmButtonText: "Copy",
      focusCancel: true,
    })
    .then((result) => {
      if (result.isConfirmed) {
        const selectedCopyFromSample = $("input[name='copy-from']:checked").val();
        //loop through checked copy-to checkboxes and return the value of the checkbox element if checked
        let selectedCopyToSamples = []; //["sam2","sam3"]
        $("input[name='copy-to']:checked").each(function () {
          selectedCopyToSamples.push($(this).val());
        });

        let copyFromSampleData = [];
        //Create a variable for the third entry ("was derived from") to make it easier to copy into the
        //middle of the array
        let wasDerivedFrom = "";

        //Add the data from the selected copy fro sample to cpoyFromSampleData array
        for (var i = 1; i < samplesTableData.length; i++) {
          if (samplesTableData[i][1] === selectedCopyFromSample) {
            //copy all elements from matching array except the first one
            wasDerivedFrom = samplesTableData[i][2];
            copyFromSampleData = samplesTableData[i].slice(4);
          }
        }
        for (sample of selectedCopyToSamples) {
          samplesTableData.forEach((sampleData, index) => {
            if (sampleData[1] === sample) {
              sampleData = [sampleData[0], sampleData[1], wasDerivedFrom, sampleData[3]];
              sampleData = sampleData.concat(copyFromSampleData);
              samplesTableData[index] = sampleData;
            }
          });
        }
        const currentSampleOpenInView = document.getElementById("guided-bootbox-sample-id").value;
        const currentSampleSubjectOpenInView = document.getElementById(
          "guided-bootbox-subject-id-samples"
        ).value;
        const currentSamplePoolOpenInView = document.getElementById(
          "guided-bootbox-sample-pool-id"
        ).value;

        //If a sample was open in the UI, update it with the new metadata
        if (currentSampleOpenInView) {
          openModifySampleMetadataPage(
            currentSampleOpenInView,
            currentSampleSubjectOpenInView,
            currentSamplePoolOpenInView
          );
        }
        saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
      }
    });
};

const specifySubject = (event, subjectNameInput) => {
  if (event.which == 13) {
    try {
      const subjectName = `sub-${subjectNameInput.val().trim()}`;
      const subjectNameElement = `
        <div class="space-between w-100">
          <span class="subject-id">${subjectName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer;"
            onclick="openSubjectRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const subjectIdCellToAddNameTo = subjectNameInput.parent();
      const trashCanElement =
        subjectIdCellToAddNameTo[0].parentElement.nextElementSibling.children[0];
      trashCanElement.style.display = "block";

      if (subjectName.length > 0) {
        if (!subSamInputIsValid(subjectName)) {
          generateAlertMessage(subjectNameInput);
          return;
        }
        //remove the add subject help text
        document.getElementById("guided-add-subject-instructions").classList.add("hidden");
        removeAlertMessageIfExists(subjectNameInput);
        if (subjectNameInput.attr("data-prev-name")) {
          const subjectToRename = subjectNameInput.attr("data-prev-name");
          globals.sodaJSONObj.renameSubject(subjectToRename, subjectName);
        } else {
          //case where subject name is valid and not being renamed:
          globals.sodaJSONObj.addSubject(subjectName);
        }
        subjectIdCellToAddNameTo.html(subjectNameElement);
        addSubjectSpecificationTableRow();
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};

const specifySample = (event, sampleNameInput) => {
  let buttonContainer =
    sampleNameInput[0].parentElement.parentElement.parentElement.parentElement
      .previousElementSibling;

  let addSampleButton = buttonContainer.children[0].children[0].children[1];
  if (event.which == 13) {
    try {
      const sampleName = `sam-${sampleNameInput.val().trim()}`;
      const sampleRenameElement = `
      <div class="space-between w-100">
        <span class="sample-id">${sampleName}</span>
        <i
          class="far fa-edit jump-back"
          style="cursor: pointer;"
          onclick="openSampleRenameInput($(this))"
        >
        </i>
      </div>
    `;
      const sampleIdCellToAddNameTo = sampleNameInput.parent();
      let sampleTrashCan = sampleIdCellToAddNameTo[0].parentElement.nextElementSibling.children[0];

      //get the pool of the subject that the sample is being added to
      const subjectSampleAdditionTable = sampleNameInput.closest("table");
      const subjectsPoolToAddSampleTo = subjectSampleAdditionTable
        .find(".samples-subjects-pool")
        .text();
      const subjectToAddSampleTo = subjectSampleAdditionTable.find(".samples-subject-name").text();

      if (sampleName.length > 0) {
        if (!subSamInputIsValid(sampleName)) {
          //show alert message below pool name input if input is invalid and abort function
          generateAlertMessage(sampleNameInput);
          return;
        }
        removeAlertMessageIfExists(sampleNameInput);

        if (sampleNameInput.attr("data-prev-name")) {
          const sampleToRename = sampleNameInput.attr("data-prev-name");
          globals.sodaJSONObj.renameSample(
            sampleToRename,
            sampleName,
            subjectsPoolToAddSampleTo,
            subjectToAddSampleTo
          );
        } else {
          //Add the new sample to globals.sodaJSONObj
          globals.sodaJSONObj.addSampleToSubject(
            sampleName,
            subjectsPoolToAddSampleTo,
            subjectToAddSampleTo
          );
          //then show trash can svg
          sampleTrashCan.style.display = "block";
        }
        sampleIdCellToAddNameTo.html(sampleRenameElement);
        if (!sampleNameInput.attr("data-prev-name")) {
          addSampleSpecificationTableRow(addSampleButton);
        }
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};

const specifyPool = (event, poolNameInput) => {
  if (event.which == 13) {
    try {
      const poolName = `pool-${poolNameInput.val().trim()}`;
      const poolNameElement = `
        <div class="space-between" style="width: 250px;">
          <span class="pool-id">${poolName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer;"
            onclick="openPoolRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const poolSubjectSelectElement = `
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      `;
      const poolSubjectsDropdownCell = poolNameInput.parent().parent().next();
      const poolTrashcan = poolSubjectsDropdownCell[0].nextElementSibling.children[0];
      const poolIdCellToAddNameTo = poolNameInput.parent();
      let poolsTable = $("#pools-table");
      if (poolName !== "pool-") {
        if (!subSamInputIsValid(poolName)) {
          notyf.open({
            duration: "3000",
            type: "error",
            message: "Pool IDs may not contain spaces or special characters",
          });
          return;
        }
        removeAlertMessageIfExists(poolsTable);
        if (poolNameInput.attr("data-prev-name")) {
          const poolFolderToRename = poolNameInput.attr("data-prev-name");

          globals.sodaJSONObj.renamePool(poolFolderToRename, poolName);

          //refresh the UI to update the dropdowns to avoid having to update select2 dropdowns
          setActiveSubPage("guided-organize-subjects-into-pools-page");
          return;
        } else {
          //Add left border back to subject dropdown cell to separate pool name and subject dropdown
          poolSubjectsDropdownCell.removeClass("remove-left-border");

          //Add the new pool to globals.sodaJSONObj
          globals.sodaJSONObj.addPool(poolName);
          poolTrashcan.style.display = "block";

          //Add the select2 base element
          poolSubjectsDropdownCell.html(poolSubjectSelectElement);

          //Get the newly created select2 element
          const newPoolSubjectsSelectElement = document.querySelector(
            `select[name="${poolName}-subjects-selection-dropdown"]`
          );

          //create a select2 dropdown for the pool subjects
          $(newPoolSubjectsSelectElement).select2({
            placeholder: "Select subjects",
            tags: true,
            width: "100%",
            closeOnSelect: false,
          });
          $(newPoolSubjectsSelectElement).on("select2:open", (e) => {
            updatePoolDropdown($(e.currentTarget), poolName);
          });
          $(newPoolSubjectsSelectElement).on("select2:unselect", (e) => {
            const subjectToRemove = e.params.data.id;
            globals.sodaJSONObj.moveSubjectOutOfPool(subjectToRemove, poolName);
          });
          $(newPoolSubjectsSelectElement).on("select2:select", function (e) {
            const selectedSubject = e.params.data.id;
            globals.sodaJSONObj.moveSubjectIntoPool(selectedSubject, poolName);
          });
        }
        poolIdCellToAddNameTo.html(poolNameElement);
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};

const updatePoolDropdown = (poolDropDown, poolName) => {
  poolDropDown.empty().trigger("change");
  //add subjects in pool to dropdown and set as selected
  const poolsSubjects = globals.sodaJSONObj.getPoolSubjects(poolName);
  for (const subject of poolsSubjects) {
    var newOption = new Option(subject, subject, true, true);
    poolDropDown.append(newOption).trigger("change");
  }

  //add subject options not in pool to dropdown and set as unselected
  const subjectsNotInPools = globals.sodaJSONObj.getSubjectsOutsidePools();
  for (const subject of subjectsNotInPools) {
    var newOption = new Option(subject, subject, false, false);
    poolDropDown.append(newOption).trigger("change");
  }
};

//On edit button click, creates a new subject ID rename input box
const openSubjectRenameInput = (subjectNameEditButton) => {
  const subjectIdCellToRename = subjectNameEditButton.closest("td");
  const prevSubjectName = subjectIdCellToRename.find(".subject-id").text();
  prevSubjectInput = prevSubjectName.substr(prevSubjectName.search("-") + 1);
  const subjectRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sub-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-subject-id"
        value=${prevSubjectInput}
        placeholder="Enter subject ID and press enter"
        onkeyup="specifySubject(event, $(this))"
        data-input-set="guided-subjects-folder-tab"
        data-alert-message="Subject IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSubjectName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
    </div>
  `;
  subjectIdCellToRename.html(subjectRenameElement);
};
const openPoolRenameInput = (poolNameEditButton) => {
  const poolIdCellToRename = poolNameEditButton.closest("td");
  const prevPoolName = poolIdCellToRename.find(".pool-id").text();
  const prevPoolInput = prevPoolName.substr(prevPoolName.search("-") + 1);
  const poolRenameElement = `
    <div class="space-between" style="align-items: center; width: 250px;">
      <span style="margin-right: 5px;">pool-</span>
      <input
        class="guided--input"
        type="text"
        name="guided-pool-id"
        value=${prevPoolInput}
        placeholder="Enter new pool ID"
        onkeyup="specifyPool(event, $(this))"
        data-input-set="guided-pools-folder-tab"
        data-alert-message="Pool IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevPoolName}"
        style="width: 180px;"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
    </div>
  `;
  poolIdCellToRename.html(poolRenameElement);
};

//updates the indices for guided tables using class given to spans in index cells
const updateGuidedTableIndices = (tableIndexClass) => {
  const indiciesToUpdate = $(`.${tableIndexClass}`);
  indiciesToUpdate.each((index, indexElement) => {
    let newIndex = index + 1;
    indexElement.innerHTML = newIndex;
  });
};

const generateSubjectRowElement = (subjectName) => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <div class="space-between w-100">
            <span class="subject-id">${subjectName}</span>
            <i
              class="far fa-edit jump-back"
              style="cursor: pointer"
              onclick="openSubjectRenameInput($(this))"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deleteSubject($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSubjectSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned subject-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sub-</span>
          <input
            id="guided--subject-input"
            class="guided--input"
            type="text"
            name="guided-subject-id"
            placeholder="Enter subject ID and press enter"
            onkeyup="specifySubject(event, $(this))"
            data-input-set="guided-subjects-folder-tab"
            data-alert-message="Subject IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
        </div>
      </td>


      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer; display: none;"
          onclick="deleteSubject($(this))"
        ></i>
      </td>
      </tr>
  `;
};

const generatePoolRowElement = (poolName) => {
  return `
    <tr>
      <td class="middle aligned pool-cell collapsing">
        <div class="space-between" style="align-items: center; width: 250px">
          <div class="space-between" style="width: 250px">
            <span class="pool-id">${poolName}</span>
            <i
              class="far fa-edit jump-back"
              style="cursor: pointer"
              onclick="openPoolRenameInput($(this))"
            >
            </i>
          </div>
        </div>
      </td>
      <td class="middle aligned pool-subjects">
        <select
          class="js-example-basic-multiple"
          style="width: 100%"
          name="${poolName}-subjects-selection-dropdown"
          multiple="multiple"
        ></select>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer"
          onclick="deletePool($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const generateSampleRowElement = (sampleName) => {
  return `
    <tr>
    <td class="middle aligned sample-id-cell">
      <div class="space-between w-100" style="align-items: center">
    <div class="space-between w-100">
      <span class="sample-id">${sampleName}</span>
      <i class="far fa-edit jump-back" style="cursor: pointer;" onclick="openSampleRenameInput($(this))">
      </i>
    </div>
  </div>
    </td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i class="far fa-trash-alt" style="color: red; cursor: pointer" onclick="deleteSample($(this))"></i>
    </td>
  </tr>`;
};
const generateSampleSpecificationRowElement = () => {
  return `
    <tr>
      <td class="middle aligned sample-id-cell">
        <div class="space-between w-100" style="align-items: center">
          <span style="margin-right: 5px;">sam-</span>
          <input
            id="guided--sample-input"
            class="guided--input"
            type="text"
            name="guided-sample-id"
            placeholder="Enter sample ID and press enter"
            onkeyup="specifySample(event, $(this))"
            data-input-set="guided-samples-folder-tab"
            data-alert-message="Sample IDs may not contain spaces or special characters"
            data-alert-type="danger"
            style="margin-right: 5px;"
          />
          <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
        </div>
      </td>
      <td class="middle aligned collapsing text-center remove-left-border">
        <i
          class="far fa-trash-alt"
          style="color: red; cursor: pointer; display: none;"
          onclick="deleteSample($(this))"
        ></i>
      </td>
    </tr>
  `;
};

const confirmEnter = (button) => {
  let input_id = button.previousElementSibling.id;
  let sampleTable = false;
  let addSampleButton = "";
  let sampleTableContainers = "";
  if (input_id === "guided--sample-input") {
    //confirming the sample input, manually create another one
    addSampleButton =
      button.parentElement.parentElement.parentElement.parentElement.previousElementSibling
        .children[0].children[0].children[1];
    sampleTableContainers = document.getElementById("guided-div-add-samples-tables").children;
    sampleTable = true;
    // addSampleSpecificationTableRow();
  }
  const ke = new KeyboardEvent("keyup", {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
  });

  let input_field = button.previousElementSibling;
  if (input_field.tagName === "INPUT") {
    input_field.dispatchEvent(ke);
  } else {
    //alert message is the previousElement
    input_field.parentNode.children[1].dispatchEvent(ke);
  }
  if (sampleTable) {
    //for adding a new sample row
    let clickSampleButton = true;
    for (let i = 0; i < sampleTableContainers.length; i++) {
      sampleEntries = sampleTableContainers[i].children[1];
      if (sampleEntries.children.length > 0) {
        //entries have been create so look at the last one if an input is there
        let lastEntryCount = sampleEntries.children.length - 1;
        let lastEntry = sampleEntries.children[lastEntryCount];
        let lastEntryTagType = lastEntry.children[0].children[0].children[1];
        if (lastEntryTagType === "INPUT") {
          //an input is already made (duplicates will have duplicate ids)
          clickSampleButton = false;
          break;
        }
      }
      if (clickSampleButton) {
        addSampleButton.click();
      }
    }
  }
};

const keydownListener = (event) => {
  if (event.key === "Enter") {
    enterKey = true;
  } else {
    enterKey = false;
  }
};

const onBlurEvent = (element) => {
  if (event.path[0].value.length > 0) {
    if (enterKey === false) {
      confirmEnter(event.path[1].children[2]);
    }
  }
};

const endConfirmOnBlur = (element) => {
  window.removeEventListener("keydown", keydownListener);
  document.getElementById(element).removeEventListener("blur", onBlurEvent);
};

var enterKey = false;
const confirmOnBlur = (element) => {
  window.addEventListener("keydown", keydownListener);
  document.getElementById(element).addEventListener("blur", onBlurEvent);
};

const addSubjectSpecificationTableRow = () => {
  const subjectSpecificationTableBody = document.getElementById("subject-specification-table-body");
  //check if subject specification table body has an input with the name guided-subject-id
  const subjectSpecificationTableInput = subjectSpecificationTableBody.querySelector(
    "input[name='guided-subject-id']"
  );

  if (subjectSpecificationTableInput) {
    //focus on the input that already exists
    subjectSpecificationTableInput.focus();
  } else {
    //create a new table row on
    subjectSpecificationTableBody.innerHTML += generateSubjectSpecificationRowElement();

    const newSubjectRow = subjectSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSubjectRow
    const newSubjectInput = newSubjectRow.querySelector("input[name='guided-subject-id']");
    //focus on the new input element
    newSubjectInput.focus();
    //scroll to bottom of guided body so back/continue buttons are visible
    scrollToBottomOfGuidedBody();
    //CREATE EVENT LISTENER FOR ON FOCUS
    confirmOnBlur("guided--subject-input");

    document.getElementById("guided-add-subject-instructions").classList.remove("hidden");
  }
};
const addSampleSpecificationTableRow = (clickedSubjectAddSampleButton) => {
  const addSampleTable = clickedSubjectAddSampleButton.closest("table");
  const addSampleTableBody = addSampleTable.querySelector("tbody");

  //check if subject specification table body has an input with the name guided-subject-id
  const sampleSpecificationTableInput = addSampleTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  //check for any

  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    //No need to create a new row
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row Input element
    addSampleTableBody.innerHTML += generateSampleSpecificationRowElement();
    const newSamplerow = addSampleTableBody.querySelector("tr:last-child");
    //Focus the new sample row element
    const newSampleInput = newSamplerow.querySelector("input[name='guided-sample-id']");
    window.addEventListener("keydown", keydownListener);
    newSampleInput.addEventListener("blur", onBlurEvent);
    newSampleInput.focus();
  }
};

const generateNewSampleRowTd = () => {
  return `
    <td class="middle aligned pool-cell collapsing">
      <div class="space-between" style="align-items: center; width: 250px;">
        <span style="margin-right: 5px;">sam-</span>
        <input
          class="guided--input"
          type="text"
          name="guided-sample-id"
          placeholder="Enter sample ID"
          onkeyup="specifySample(event, $(this))"
          data-alert-message="Sample IDs may not contain spaces or special characters"
          data-alert-type="danger"
          style="width: 250px"
        />
      </div>
    </td>
    <td
      class="middle aligned samples-subject-dropdown-cell remove-left-border"
    ></td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="deleteSample($(this))"
      ></i>
    </td>
  `;
};
const addSampleTableRow = () => {
  const sampleSpecificationTableBody = document.getElementById("samples-specification-table-body");
  //check if sample specification table body has an input with the name guided-sample-id
  const sampleSpecificationTableInput = sampleSpecificationTableBody.querySelector(
    "input[name='guided-sample-id']"
  );
  if (sampleSpecificationTableInput) {
    //focus on the input that already exists
    sampleSpecificationTableInput.focus();
  } else {
    //create a new table row on
    const newSamplesTableRow = sampleSpecificationTableBody.insertRow(-1);
    newSamplesTableRow.innerHTML = generateNewSampleRowTd();
    const newSampleRow = sampleSpecificationTableBody.querySelector("tr:last-child");
    //get the input element in newSampleRow
    const newSampleInput = newSampleRow.querySelector("input[name='guided-sample-id']");
    smoothScrollToElement(newSampleRow);
    newSampleInput.focus();
  }
};

const generatePoolSpecificationRowElement = () => {
  return `
    <td class="middle aligned pool-cell collapsing">
      <div class="space-between" style="align-items: center; width: 250px;">
        <span style="margin-right: 5px;">pool-</span>
        <input
          class="guided--input"
          type="text"
          name="guided-pool-id"
          placeholder="Enter pool ID"
          onkeyup="specifyPool(event, $(this))"
          data-input-set="guided-subjects-folder-tab"
          data-alert-message="Pool IDs may not contain spaces or special characters"
          data-alert-type="danger"
          style="width: 100%;"
        />
        <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
      </div>
    </td>
    <td class="middle aligned pool-subjects remove-left-border">
    </td>
    <td class="middle aligned collapsing text-center remove-left-border">
      <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer; display: none;"
        onclick="deletePool($(this))"
      ></i>
    </td>
  `;
};
const addPoolTableRow = () => {
  const poolsTableBody = document.getElementById("pools-specification-table-body");
  const poolSpecificationTableInput = poolsTableBody.querySelector("input[name='guided-pool-id']");

  const re = new RegExp("/^(d|w)+$/g");

  if (poolSpecificationTableInput) {
    //focus on the input that already exists
    //check if pool has input
    if (poolSpecificationTableInput.val != "") {
      confirmEnter(poolSpecificationTableInput);
      // addPoolTableRow();
      // let newPoolTableRow = poolsTableBody.insertRow(-1);
      // newPoolTableRow.innerHTML = generatePoolSpecificationRowElement();
    } else {
      poolSpecificationTableInput.focus();
    }
  } else {
    //insert a new table row container with js as select2 breaks when adding a new row
    //via template literals
    const newPoolTableRow = poolsTableBody.insertRow(-1);
    newPoolTableRow.innerHTML = generatePoolSpecificationRowElement();
  }
};

//Deletes the entered subject folder from dsJSONObj and updates UI
const deleteSubjectFolder = (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();
  //delete the table row element in the UI
  subjectIdCellToDelete.remove();
  //Update subject table row indices
  updateGuidedTableIndices("subject-table-index");
  //delete the subject folder from sodaJSONobj
  delete globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][subjectIdToDelete];
  //delete the subject folder from the dataset structure obj
  delete datasetStructureJSONObj["folders"]["primary"]["folders"][subjectIdToDelete];
};
//deletes subject from jsonObj and UI
const deleteSubject = (subjectDeleteButton) => {
  const subjectIdCellToDelete = subjectDeleteButton.closest("tr");
  const subjectIdToDelete = subjectIdCellToDelete.find(".subject-id").text();

  //Check to see if a subject has been added to the element
  //if it has, delete the subject from the pool-sub-sam structure
  if (subjectIdToDelete) {
    globals.sodaJSONObj.deleteSubject(subjectIdToDelete);
  }

  //delete the table row element in the UI
  subjectIdCellToDelete.remove();
  //remove the add subject help text
  document.getElementById("guided-add-subject-instructions").classList.add("hidden");
};
const deletePool = (poolDeleteButton) => {
  const poolIdCellToDelete = poolDeleteButton.closest("tr");
  const poolIdToDelete = poolIdCellToDelete.find(".pool-id").text();
  //delete the table row element in the UI
  poolIdCellToDelete.remove();
  globals.sodaJSONObj.deletePool(poolIdToDelete);
  removeAlertMessageIfExists($("#pools-table"));
};

const deleteSample = (sampleDeleteButton) => {
  const sampleIdCellToDelete = sampleDeleteButton.closest("tr");
  const sampleIdToDelete = sampleIdCellToDelete.find(".sample-id").text();

  //Check to see if a sample has been added to the element
  //if it has, delete the sample from the pool-sub-sam structure
  if (sampleIdToDelete) {
    globals.sodaJSONObj.deleteSample(sampleIdToDelete);
  }

  //delete the table row element in the UI
  sampleIdCellToDelete.remove();
};

//SAMPLE TABLE FUNCTIONS

$("#guided-button-generate-samples-table").on("click", () => {
  let numSubjectRowsToCreate = parseInt($("#guided-number-of-samples-input").val());
  let subjectsTableBody = document.getElementById("samples-table-body");

  $("#number-of-samples-prompt").hide();
  $("#samples-table").css("display", "flex");
});

const createSampleFolder = (event, sampleNameInput) => {
  if (event.which == 13) {
    try {
      const sampleName = sampleNameInput.val().trim();
      const sampleNameElement = `
        <div class="space-between">
          <span class="sample-id">${sampleName}</span>
          <i
            class="far fa-edit jump-back"
            style="cursor: pointer"
            onclick="openSampleRenameInput($(this))"
          >
          </i>
        </div>
      `;
      const sampleIdCellToAddNameTo = sampleNameInput.parent();
      const sampleParentSubjectName = sampleNameInput
        .closest("tbody")
        .siblings()
        .find(".sample-table-name")
        .text()
        .trim();
      let sampleNameArray = [];
      //Add all existing sample names to anarray
      Object.keys(datasetStructureJSONObj["folders"]["primary"]["folders"]).map((subjectName) => {
        let samplesInSubject = Object.keys(
          datasetStructureJSONObj["folders"]["primary"]["folders"][subjectName]["folders"]
        );
        Array.prototype.push.apply(sampleNameArray, samplesInSubject);
      });
      //Throw error if entered sample name is duplicate
      if (sampleNameArray.includes(sampleName)) {
        //Change input back to the previous name but throw an error to abort following logic
        if (sampleNameInput.attr("data-prev-name") === sampleName) {
          sampleIdCellToAddNameTo.html(sampleNameElement);
        }
        throw new Error("Sample name already exists");
      }

      if (sampleName.length > 0) {
        if (subSamInputIsValid(sampleName)) {
          removeAlertMessageIfExists(sampleNameInput);
          //Add sample to sodaJSONobj
          globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
            sampleParentSubjectName
          ].push(sampleName);

          sampleIdCellToAddNameTo.html(sampleNameElement);

          sampleTargetFolder = getRecursivePath(
            ["primary", sampleParentSubjectName],
            datasetStructureJSONObj
          ).folders;
          //Check to see if input has prev-name data attribute
          //Added when renaming sample
          if (sampleNameInput.attr("data-prev-name")) {
            //get the name of the sample being renamed
            const sampleFolderToRename = sampleNameInput.attr("data-prev-name");
            //Remove old sample in sodaJSONobj
            globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
              sampleParentSubjectName
            ] = globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"][
              sampleParentSubjectName
            ].filter((sample) => {
              return sample !== sampleFolderToRename;
            });

            //create a temp copy of the folder to be renamed
            copiedFolderToRename = sampleTargetFolder[sampleFolderToRename];
            //set the copied obj from the prev name to the new obj name
            sampleTargetFolder[sampleName] = copiedFolderToRename;
            //delete the temp copy of the folder that was renamed
            delete sampleTargetFolder[sampleFolderToRename];
          } else {
            //Create an empty folder for the new sample
            sampleTargetFolder[sampleName] = {
              folders: {},
              files: {},
              type: "",
              action: [],
            };
          }
        } else {
          generateAlertMessage(sampleNameInput);
        }
      }
    } catch (error) {
      notyf.open({
        duration: "3000",
        type: "error",
        message: error,
      });
    }
  }
};
const openSampleRenameInput = (subjectNameEditButton) => {
  const sampleIdCellToRename = subjectNameEditButton.closest("td");
  const prevSampleName = sampleIdCellToRename.find(".sample-id").text();
  const prevSampleInput = prevSampleName.substr(prevSampleName.search("-") + 1);
  const sampleRenameElement = `
    <div class="space-between w-100" style="align-items: center">
      <span style="margin-right: 5px;">sam-</span>
      <input
        class="guided--input"
        type="text"
        value=${prevSampleInput}
        name="guided-sample-id"
        placeholder="Enter new sample ID"
        onkeyup="specifySample(event, $(this))"
        data-input-set="guided-samples-folder-tab"
        data-alert-message="Sample IDs may not contain spaces or special characters"
        data-alert-type="danger"
        data-prev-name="${prevSampleName}"
      />
      <i class="far fa-check-circle fa-solid" style="cursor: pointer; margin-left: 15px; color: var(--color-light-green); font-size: 1.24rem;" onclick="confirmEnter(this)"></i>
    </div>
  `;
  sampleIdCellToRename.html(sampleRenameElement);
};

const removePermission = (clickedPermissionRemoveButton) => {
  let permissionElementToRemove = clickedPermissionRemoveButton.closest("tr");
  let permissionEntityType = permissionElementToRemove.attr("data-entity-type");
  let permissionNameToRemove = permissionElementToRemove.find(".permission-name-cell").text();
  let permissionTypeToRemove = permissionElementToRemove.find(".permission-type-cell").text();

  if (permissionEntityType === "owner") {
    notyf.open({
      duration: "6000",
      type: "error",
      message: "You can not remove yourself as the owner of this dataset",
    });
    return;
  }
  if (permissionEntityType === "loggedInUser") {
    notyf.open({
      duration: "6000",
      type: "error",
      message:
        "You can not deselect yourself as a manager, as you need manager permissions to upload a dataset",
    });
    return;
  }
  if (permissionEntityType === "user") {
    const currentUsers = globals.sodaJSONObj["digital-metadata"]["user-permissions"];
    const filteredUsers = currentUsers.filter((user) => {
      return !(
        user.userString == permissionNameToRemove &&
        user.permission == permissionTypeToRemove &&
        !user.loggedInUser
      );
    });
    globals.sodaJSONObj["digital-metadata"]["user-permissions"] = filteredUsers;
  }
  if (permissionEntityType === "team") {
    const currentTeams = globals.sodaJSONObj["digital-metadata"]["team-permissions"];
    const filteredTeams = currentTeams.filter((team) => {
      return !(
        team.teamString == permissionNameToRemove && team.permission == permissionTypeToRemove
      );
    });
    globals.sodaJSONObj["digital-metadata"]["team-permissions"] = filteredTeams;
  }
  //rerender the permissions table to reflect changes to user/team permissions
  renderPermissionsTable();
};

const createPermissionsTableRowElement = (entityType, name, permission) => {
  return `
    <tr data-entity-type=${entityType}>
      <td class="middle aligned permission-name-cell">${name}</td>
      <td class="middle aligned remove-left-border permission-type-cell">${permission}</td>
      <td class="middle aligned text-center remove-left-border" style="width: 20px">
        <i
        class="far fa-trash-alt"
        style="color: red; cursor: pointer"
        onclick="removePermission($(this))"
        ></i>
      </td>
    </tr>
  `;
};
const renderPermissionsTable = () => {
  let permissionsTableElements = [];
  const owner = globals.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"];
  const users = globals.sodaJSONObj["digital-metadata"]["user-permissions"];
  const teams = globals.sodaJSONObj["digital-metadata"]["team-permissions"];
  permissionsTableElements.push(createPermissionsTableRowElement("owner", owner, "owner"));

  for (user of users) {
    permissionsTableElements.push(
      createPermissionsTableRowElement(
        user.loggedInUser ? "loggedInUser" : "user",
        user["userString"],
        user["permission"]
      )
    );
  }
  for (team of teams) {
    permissionsTableElements.push(
      createPermissionsTableRowElement("team", team["teamString"], team["permission"])
    );
  }

  let permissionsTable = permissionsTableElements.join("\n");
  let permissionsTableBody = document.getElementById("permissions-table-body");
  permissionsTableBody.innerHTML = permissionsTable;
};

$("#guided-button-no-source-data").on("click", () => {
  //ask user to confirm they would like to delete source folder if it exists
  if (datasetStructureJSONObj["folders"]["source"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the source folder.",
      text: "Are you sure you would like to delete your source folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete source folder
        delete datasetStructureJSONObj["folders"]["source"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no source files
        $("#guided-button-has-source-data").click();
      }
    });
  }
});

/*********** Derivative page functions ***********/
$("#guided-button-has-derivative-data").on("click", () => {
  if (datasetStructureJSONObj["folders"]["derivative"] == undefined)
    datasetStructureJSONObj["folders"]["derivative"] = {
      folders: {},
      files: {},
      type: "",
      action: [],
    };
  $("#guided-file-explorer-elements").appendTo($("#guided-user-has-derivative-data"));
  updateFolderStructureUI(highLevelFolderPageData.derivative);
});
$("#guided-button-no-derivative-data").on("click", () => {
  //ask user to confirm they would like to delete derivative folder if it exists
  if (datasetStructureJSONObj["folders"]["derivative"] != undefined) {
    Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      title:
        "Reverting your decision will wipe out any changes you have made to the derivative folder.",
      text: "Are you sure you would like to delete your derivative folder progress?",
      icon: "warning",
      showConfirmButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#3085d6 !important",
      showCancelButton: true,
      focusCancel: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      customClass: "swal-wide",
      backdrop: "rgba(0,0,0, 0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        //User agrees to delete derivative folder
        delete datasetStructureJSONObj["folders"]["derivative"];
      } else {
        //User cancels
        //reset button UI to how it was before the user clicked no derivative files
        $("#guided-button-has-derivative-data").click();
      }
    });
  }
});

const getTagsFromTagifyElement = (tagifyElement) => {
  return Array.from(tagifyElement.getTagElms()).map((tag) => {
    return tag.textContent;
  });
};

$("#guided-submission-completion-date").change(function () {
  const text = $("#guided-submission-completion-date").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date").children().last();
        $option.prop("selected", true);
      }
    });
  }
});

$("#guided-submission-completion-date-manual").change(function () {
  const text = $("#guided-submission-completion-date-manual").val();
  if (text == "Enter my own date") {
    Swal.fire({
      allowOutsideClick: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      showCloseButton: true,
      focusConfirm: true,
      heightAuto: false,
      reverseButtons: reverseSwalButtons,
      showCancelButton: false,
      title: `<span style="text-align:center"> Enter your Milestone completion date </span>`,
      html: `<input type="date" id="milestone_date_picker" >`,
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      didOpen: () => {
        document.getElementById("milestone_date_picker").valueAsDate = new Date();
      },
      preConfirm: async () => {
        const input_date = document.getElementById("milestone_date_picker").value;
        return {
          date: input_date,
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const input_date = result.value.date;
        //remove options from dropdown that already have input_date as value
        $("#guided-submission-completion-date-manual option").each(function () {
          if (this.value == input_date) {
            $(this).remove();
          }
        });
        $("#guided-submission-completion-date-manual").append(
          `<option value="${input_date}">${input_date}</option>`
        );
        var $option = $("#guided-submission-completion-date-manual").children().last();
        $option.prop("selected", true);
      }
    });
  }
});
/////////////////////////////////////////////////////////
//////////       GUIDED OBJECT ACCESSORS       //////////
/////////////////////////////////////////////////////////
const setOrUpdateGuidedDatasetName = (newDatasetName) => {
  return new Promise((resolve, reject) => {
    const previousDatasetName = globals.sodaJSONObj["digital-metadata"]["name"];
    //If updataing the dataset, update the old banner image path with a new one
    if (previousDatasetName) {
      //If previousDatasetName is equal to the newDatasetName, we don't need to update any progress files
      if (previousDatasetName === newDatasetName) {
        resolve("No changes made to dataset name");
      }

      //get names of existing progress saves
      const existingProgressNames = [] // fs.readdirSync(guidedProgressFilePath); // NOTE: Not looking for existing saves anymore...
      //Remove '.json' from each element in existingProgressNames
      existingProgressNames.forEach((element, index) => {
        existingProgressNames[index] = element.replace(".json", "");
      });
      //check if dataset name is already in use
      if (existingProgressNames.includes(newDatasetName)) {
        reject(
          "An existing progress file already exists with that name. Please choose a different name."
        );
      }

      //update old progress file with new dataset name
      const oldProgressFilePath = `${guidedProgressFilePath}/${previousDatasetName}.json`;
      const newProgressFilePath = `${guidedProgressFilePath}/${newDatasetName}.json`;
      // fs.renameSync(oldProgressFilePath, newProgressFilePath); // NOTE: Not looking for existing saves anymore...

      const bannerImagePathToUpdate = globals.sodaJSONObj["digital-metadata"]["banner-image-path"];
      if (bannerImagePathToUpdate) {
        const newBannerImagePath = bannerImagePathToUpdate.replace(
          previousDatasetName,
          datasetName
        );
        //Rename the old banner image folder to the new dataset name
        // fs.renameSync(bannerImagePathToUpdate, newBannerImagePath); // NOTE: Not looking for existing saves anymore...
        //change the banner image path in the JSON obj
        globals.sodaJSONObj["digital-metadata"]["banner-image-path"] = newBannerImagePath;
      }
      globals.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
      saveGuidedProgress(newDatasetName);
      resolve("Dataset name updated");
    } else {
      globals.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;
      saveGuidedProgress(newDatasetName);
      resolve("Dataset name updated");
    }
  });
};

const getGuidedDatasetName = () => {
  return globals.sodaJSONObj["digital-metadata"]["name"];
};

const setGuidedDatasetSubtitle = (datasetSubtitle) => {
  globals.sodaJSONObj["digital-metadata"]["subtitle"] = datasetSubtitle;
};
const getGuidedDatasetSubtitle = () => {
  return globals.sodaJSONObj["digital-metadata"]["subtitle"];
};

const guidedShowBannerImagePreview = (imagePath) => {
  const bannerImagePreviewelement = document.getElementById("guided-banner-image-preview");

  // bannerImagePreviewelement.innerHTML = '';
  if (bannerImagePreviewelement.childElementCount > 0) {
    bannerImagePreviewelement.removeChild(bannerImagePreviewelement.firstChild);
  }

  let date = new Date();
  let guidedbannerImageElem = document.createElement("img");
  //imagePath + cachebreakeer at the end to update image every time
  guidedbannerImageElem.src = imagePath + "?" + date.getMilliseconds();
  guidedbannerImageElem.alt = "Preview of banner image";
  guidedbannerImageElem.style = "max-height: 300px";

  bannerImagePreviewelement.appendChild(guidedbannerImageElem);

  // bannerImagePreviewelement.innerHTML = guidedBannerImageElement;
  $("#guided-banner-image-preview-container").show();
  $("#guided-button-add-banner-image").html("Edit banner image");
};
const setGuidedBannerImage = (croppedImagePath) => {
  globals.sodaJSONObj["digital-metadata"]["banner-image-path"] = croppedImagePath;
  guidedShowBannerImagePreview(croppedImagePath);
};

const setGuidedDatasetPiOwner = (newPiOwnerObj) => {
  globals.sodaJSONObj["digital-metadata"]["pi-owner"] = {};
  globals.sodaJSONObj["digital-metadata"]["pi-owner"]["userString"] = newPiOwnerObj.userString;
  globals.sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"] = newPiOwnerObj.UUID;
  globals.sodaJSONObj["digital-metadata"]["pi-owner"]["name"] = newPiOwnerObj.name;
};

const guidedAddUserPermission = (newUserPermissionObj) => {
  //If an existing user with the same ID already exists, update the existing user's position
  for (userPermission of globals.sodaJSONObj["digital-metadata"]["user-permissions"]) {
    if (
      userPermission["userString"] == newUserPermissionObj.userString &&
      userPermission["UUID"] == newUserPermissionObj.UUID
    ) {
      userPermission["permission"] = newUserPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  globals.sodaJSONObj["digital-metadata"]["user-permissions"].push(newUserPermissionObj);
  renderPermissionsTable();
};
const guidedRemoveUserPermission = (userParentElement) => {};

const guidedAddTeamPermission = (newTeamPermissionObj) => {
  //If an existing team with the same ID already exists, update the existing team's position
  for (teamPermission of globals.sodaJSONObj["digital-metadata"]["team-permissions"]) {
    if (
      teamPermission["teamString"] == newTeamPermissionObj.teamString &&
      teamPermission["UUID"] == newTeamPermissionObj.UUID
    ) {
      teamPermission["permission"] = newTeamPermissionObj.permission;
      renderPermissionsTable();
      return;
    }
  }
  //add a new user permission
  globals.sodaJSONObj["digital-metadata"]["team-permissions"].push(newTeamPermissionObj);
  renderPermissionsTable();
};
const guidedRemoveTeamPermission = (teamParentElement) => {};

const setGuidedLicense = (newLicense) => {
  globals.sodaJSONObj["digital-metadata"]["license"] = "Creative Commons Attribution";
};

const renderSamplesHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-samples-aside`);
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectsWithSamples = subjects.filter((subject) => {
    return subject.samples.length > 0;
  });

  let asideElementTemplateLiteral = ``;

  //create an array of objects that groups subjectsWithSamples by poolName property
  const subjectsWithSamplesInPools = subjectsWithSamples.reduce((acc, subject) => {
    if (subject.poolName) {
      if (acc[subject.poolName]) {
        acc[subject.poolName].push(subject);
      } else {
        acc[subject.poolName] = [subject];
      }
    }
    return acc;
  }, {});
  //loop through the pools and create an aside element for each sample in the pools subjects
  for (const [poolName, subjects] of Object.entries(subjectsWithSamplesInPools)) {
    asideElementTemplateLiteral += `
    ${subjects
      .map((subject) => {
        return `
        <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
            <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
              <label class="guided--form-label centered" style="color: black;">
                ${subject.subjectName}
              </label>
              </div>
                ${subject.samples
                  .map((sample) => {
                    return `
                    <a
                      class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                      data-path-suffix="${subject.poolName}/${subject.subjectName}/${sample}"
                      style="padding-left: 1rem; direction: ltr"
                    >${sample}</a>
                  `;
                  })
                  .join("\n")}
            </div>`;
      })
      .join("\n")}`;
  }

  //filter out subjects that are not in a pool
  const subjectsWithSamplesOutsidePools = subjectsWithSamples.filter((subject) => {
    return !subject.poolName;
  });
  //loop through the subjects and create an aside element for each
  for (const subject of subjectsWithSamplesOutsidePools) {
    asideElementTemplateLiteral += `
      <div style="display: flex; flex-direction: column; width: 100%; border-radius: 4px; margin-bottom: 1rem">
      <div class="justify-center" style="background: lightgray; padding: 5px 0 2px 0;">
        <label class="guided--form-label centered" style="color: black;">
          ${subject.subjectName}
        </label>
      </div>
        ${subject.samples
          .map((sample) => {
            return `
              <a
                class="${highLevelFolderName}-selection-aside-item selection-aside-item"
                style="direction: ltr; padding-left: 1rem;"
                data-path-suffix="${subject.subjectName}/${sample}"
              >${sample}</a>
`;
          })
          .join("\n")}
    `;
  }

  //Add the samples to the DOM
  asideElement.innerHTML = asideElementTemplateLiteral;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );

  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-samples-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility(
          `guided-${highLevelFolderName}-samples-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      const samplePageData = generateHighLevelFolderSubFolderPageData(
        "sample",
        highLevelFolderName,
        pathSuffix
      );

      if (globals.sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] == false) {
        $("#items").html(`
          <div
            class="single-item ds-selectable"
            id="guided-sample-data-folder"
            onmouseover="hoverForFullName(this)"
            onmouseleave="hideFullName()"
          >
            <h1 oncontextmenu="folderContextMenu(this)" class="myFol empty"></h1>
            <div class="folder_desc">Sample data folder</div>
          </div>
          <div
            class="single-item ds-selectable"
            id="guided-sample-data-file"
            onmouseover="hoverForFullName(this)"
            onmouseleave="hideFullName()"
          >
            <h1
              class="myFile xlsx"
              oncontextmenu="fileContextMenu(this)"
              style="margin-bottom: 10px"
            ></h1>
            <div class="folder_desc">Sample data file.xlsx</div>
          </div>
        `);
        //right click the second child in #items jqeury
        introJs()
          .setOptions({
            steps: [
              {
                element: document.querySelector(".primary-selection-aside-item"),
                intro: "Select the different samples here to specify data files for each of them.",
              },
              {
                element: document.querySelector("#guided-button-back"),
                intro:
                  "To view the folders above the folder you are currently in, click the up button.",
              },
              {
                element: document.querySelector("#guided-new-folder"),
                intro:
                  "To include a new empty folder, click the 'New folder' button. You can then specify data to be included into it.",
              },
              {
                element: document.querySelector("#guided-import-folder"),
                intro: "To import a folder from your computer, click the 'Import folder' button.",
              },
              {
                element: document.querySelector("#guided-imoprt-file"),
                intro: "To import a data file from your computer, click the 'Import file' button.",
              },
              {
                element: document.getElementById("items"),
                intro: `Folders inside your dataset are represented by the folder icon.<br /><br />
                  To view the contents of a folder, double click the folder.<br /><br />
                  Right clicking a folder will bring up a context menu which allows you to rename, move, or delete the folder.`,
              },
              {
                element: document.getElementById("items"),
                intro: `Files inside your dataset are represented with an icon relative to the file type.<br /><br />
                  Right clicking a file will bring up a context menu which allows you to rename, move, or delete the file.`,
              },
            ],
            exitOnEsc: false,
            exitOnOverlayClick: false,
            disableInteraction: false,
          })
          .onbeforeexit(function () {
            globals.sodaJSONObj["button-config"]["has-seen-file-explorer-intro"] = true;
            //reUpdate the file explorer
            updateFolderStructureUI(samplePageData);
          })
          .start();
      } else {
        //render folder section in #items
        //create an animation effect to the items box here
        // $("#items")
        updateFolderStructureUI(samplePageData);
      }
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

const renderSubjectsHighLevelFolderAsideItems = (highLevelFolderName) => {
  const asideElement = document.getElementById(`guided-${highLevelFolderName}-subjects-aside`);
  asideElement.innerHTML = "";
  const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  //sort subjects object by subjectName property alphabetically

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a
            class="${highLevelFolderName}-selection-aside-item selection-aside-item"
            style="align-self: center; width: 97%; direction: ltr;"
            data-path-suffix="${subject.poolName ? subject.poolName + "/" : ""}${
        subject.subjectName
      }"
          >${subject.subjectName}</a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(
    `a.${highLevelFolderName}-selection-aside-item`
  );
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show subject folder explorer if intro is open
      const introElement = document.getElementById(
        `guided-${highLevelFolderName}-subjects-file-explorer-intro`
      );
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility(
          `guided-${highLevelFolderName}-subjects-file-explorer-intro`,
          "guided-file-explorer-elements"
        );
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //get the path prefix from the clicked item
      const pathSuffix = e.target.dataset.pathSuffix;

      const samplePageData = generateHighLevelFolderSubFolderPageData(
        "subject",
        highLevelFolderName,
        pathSuffix
      );
      updateFolderStructureUI(samplePageData);
    });
    //add hover event that changes the background color to black
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

const renderSubjectsMetadataAsideItems = () => {
  const asideElement = document.getElementById(`guided-subjects-metadata-aside`);
  asideElement.innerHTML = "";

  const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();

  //Combine sample data from subjects in and out of pools
  let subjects = [...subjectsInPools, ...subjectsOutsidePools];

  const subjectMetadataCopyButton = document.getElementById("guided-button-subject-metadata-copy");
  if (subjects.length > 1) {
    subjectMetadataCopyButton.classList.remove("hidden");
  } else {
    subjectMetadataCopyButton.classList.add("hidden");
  }

  const subjectsFormEntries = guidedSubjectsFormDiv.querySelectorAll(".subjects-form-entry");
  //Create an array of subjectFormEntries name attribute
  const subjectsFormNames = [...subjectsFormEntries].map((entry) => {
    return entry.name;
  });

  if (subjectsTableData.length == 0) {
    //Get items with class "subjects-form-entry" from subjectsForDiv

    subjectsTableData[0] = subjectsFormNames;
    for (const subject of subjects) {
      const subjectDataArray = [];
      subjectDataArray.push(subject.subjectName);
      subjectDataArray.push(subject.poolName ? subject.poolName : "");

      for (let i = 0; i < subjectsFormNames.length - 2; i++) {
        subjectDataArray.push("");
      }
      subjectsTableData.push(subjectDataArray);
    }
  } else {
    //Add subjects that have not yet been added to the table to the table
    for (const subject of subjects) {
      let subjectAlreadyInTable = false;
      for (let i = 0; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] == subject.subjectName) {
          subjectAlreadyInTable = true;
        }
      }
      if (!subjectAlreadyInTable) {
        const subjectDataArray = [];
        subjectDataArray.push(subject.subjectName);
        subjectDataArray.push(subject.poolName ? subject.poolName : "");
        for (let i = 0; i < subjectsTableData[0].length - 2; i++) {
          subjectDataArray.push("");
        }
        subjectsTableData.push(subjectDataArray);
      }
    }

    //If custom fields have been added to the subjectsTableData, create a field for each custom field
    //added
    for (let i = 0; i < subjectsTableData[0].length; i++) {
      if (!subjectsFormNames.includes(subjectsTableData[0][i])) {
        addCustomHeader("subjects", subjectsTableData[0][i], "guided");
      }
    }
  }

  //Create the HTML for the subjects
  const subjectItems = subjects
    .map((subject) => {
      return `
          <a
            class="subjects-metadata-aside-item selection-aside-item"
            data-pool-id="${subject.poolName ? subject.poolName : ""}"
          ><span class="subject-metadata-id">${subject.subjectName}</span></a>
        `;
    })
    .join("\n");

  //Add the subjects to the DOM
  asideElement.innerHTML = subjectItems;

  //add click event to each subject item
  const selectionAsideItems = document.querySelectorAll(`a.subjects-metadata-aside-item`);
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById("guided-form-add-a-subject-intro");
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility("guided-form-add-a-subject-intro", "guided-form-add-a-subject");
      }
      //Save the subject metadata from the previous subject being worked on
      previousSubject = document.getElementById("guided-bootbox-subject-id").value;
      //check to see if previousSubject is empty
      if (previousSubject) {
        addSubject("guided");
      }

      clearAllSubjectFormFields(guidedSubjectsFormDiv);

      //call openModifySubjectMetadataPage function on clicked item
      openModifySubjectMetadataPage(e.target.innerText);

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });

      document.getElementById("guided-bootbox-subject-id").value = e.target.innerText;
      //Set the pool id field based of clicked elements data-pool-id attribute
      document.getElementById("guided-bootbox-subject-pool-id").value =
        e.target.getAttribute("data-pool-id");

      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    });
    //add hover event that changes the background color
    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};
const renderSamplesMetadataAsideItems = () => {
  const asideElement = document.getElementById(`guided-samples-metadata-aside`);
  asideElement.innerHTML = "";

  const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  let samples = [...samplesInPools, ...samplesOutsidePools];

  const sampleMetadataCopyButton = document.getElementById("guided-button-sample-metadata-copy");
  if (samples.length > 1) {
    sampleMetadataCopyButton.classList.remove("hidden");
  } else {
    sampleMetadataCopyButton.classList.add("hidden");
  }

  const samplesFormEntries = guidedSamplesFormDiv.querySelectorAll(".samples-form-entry");

  //Create an array of samplesFormEntries name attribute
  const samplesFormNames = [...samplesFormEntries].map((entry) => {
    return entry.name;
  });

  if (samplesTableData.length == 0) {
    //Get items with class "samples-form-entry" from samplesForDiv
    samplesTableData[0] = samplesFormNames;
    for (const sample of samples) {
      const sampleDataArray = [];
      sampleDataArray.push(sample.subjectName);
      sampleDataArray.push(sample.sampleName);
      //Push an empty string for was derived from
      sampleDataArray.push("");
      sampleDataArray.push(sample.poolName ? sample.poolName : "");
      for (let i = 0; i < samplesFormNames.length - 4; i++) {
        sampleDataArray.push("");
      }
      samplesTableData.push(sampleDataArray);
    }
  } else {
    //Add samples that have not yet been added to the table to the table
    for (const sample of samples) {
      let sampleAlreadyInTable = false;
      for (let i = 0; i < samplesTableData.length; i++) {
        if (samplesTableData[i][1] == sample.sampleName) {
          sampleAlreadyInTable = true;
        }
      }
      if (!sampleAlreadyInTable) {
        const sampleDataArray = [];
        sampleDataArray.push(sample.subjectName);
        sampleDataArray.push(sample.sampleName);
        //Push an empty string for was derived from
        sampleDataArray.push("");
        sampleDataArray.push(sample.poolName ? sample.poolName : "");
        for (let i = 0; i < samplesTableData[0].length - 4; i++) {
          sampleDataArray.push("");
        }
        samplesTableData.push(sampleDataArray);
      }
    }
  }

  //If custom fields have been added to the samplesTableData, create a field for each custom field
  //added
  for (let i = 0; i < samplesTableData[0].length; i++) {
    if (!samplesFormNames.includes(samplesTableData[0][i])) {
      addCustomHeader("samples", samplesTableData[0][i], "guided");
    }
  }

  //Create the HTML for the samples
  const sampleItems = samples
    .map((sample) => {
      return `
        <a
          class="samples-metadata-aside-item selection-aside-item"
          data-samples-subject-name="${sample.subjectName}"
          data-samples-pool-id="${sample.poolName ? sample.poolName : ""}"
        >
          <span class="sample-metadata-id">
          ${sample.subjectName}/${sample.sampleName}
          </span>
        </a>
        `;
    })
    .join("\n");

  //Add the samples to the DOM
  asideElement.innerHTML = sampleItems;

  //add click event to each sample item
  const selectionAsideItems = document.querySelectorAll(`a.samples-metadata-aside-item`);
  selectionAsideItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      //Hide intro and show metadata fields if intro is open
      const introElement = document.getElementById("guided-form-add-a-sample-intro");
      if (!introElement.classList.contains("hidden")) {
        switchElementVisibility("guided-form-add-a-sample-intro", "guided-form-add-a-sample");
      }

      previousSample = document.getElementById("guided-bootbox-sample-id").value;

      //check to see if previousSample is empty
      if (previousSample) {
        addSample("guided");
      }

      //add selected class to clicked element
      e.target.classList.add("is-selected");
      //remove selected class from all other elements
      selectionAsideItems.forEach((item) => {
        if (item != e.target) {
          item.classList.remove("is-selected");
        }
      });
      //Get sample's subject and pool from rendered HTML
      const samplesSubject = e.target.getAttribute("data-samples-subject-name");
      const samplesPool = e.target.getAttribute("data-samples-pool-id");

      //Set the subject id field based of clicked elements data-subject-id attribute
      document.getElementById("guided-bootbox-subject-id-samples").value = samplesSubject;

      //Set the pool id field based of clicked elements data-pool-id attribute
      document.getElementById("guided-bootbox-sample-pool-id").value = samplesPool;

      //clear all sample form fields
      clearAllSubjectFormFields(guidedSamplesFormDiv);

      //call openModifySampleMetadataPage function on clicked item
      openModifySampleMetadataPage(e.target.innerText.split("/")[1], samplesSubject, samplesPool);

      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    });

    item.addEventListener("mouseover", (e) => {
      e.target.style.backgroundColor = "whitesmoke";
    });
    item.addEventListener("mouseout", (e) => {
      e.target.style.backgroundColor = "";
    });
  });
};

$(document).ready(async () => {
  $("#guided-button-start-new-curate").on("click", () => {
    guidedTransitionFromHome();
  });

  $("#guided-button-dataset-intro-back").on("click", () => {
    const guidedIntroPage = document.getElementById("guided-intro-page");
    const guidedDatasetNameSubtitlePage = document.getElementById("guided-new-dataset-info");
    if (!guidedIntroPage.classList.contains("hidden")) {
      //remove text from dataset name and subtitle inputs
      document.getElementById("guided-dataset-name-input").value = "";
      document.getElementById("guided-dataset-subtitle-input").value = "";

      switchElementVisibility("guided-mode-starting-container", "guided-home");
      //hide the intro footer
      document.getElementById("guided-footer-intro").classList.add("hidden");
      globals.prepareHomeScreen();
    } else if (!guidedDatasetNameSubtitlePage.classList.contains("hidden")) {
      switchElementVisibility("guided-new-dataset-info", "guided-intro-page");
    }
  });
  $("#guided-button-dataset-intro-next").on("click", async function () {
    const guidedIntroPage = document.getElementById("guided-intro-page");
    const guidedDatasetNameSubtitlePage = document.getElementById("guided-new-dataset-info");

    if (!guidedIntroPage.classList.contains("hidden")) {
      switchElementVisibility("guided-intro-page", "guided-new-dataset-info");
    } else if (!guidedDatasetNameSubtitlePage.classList.contains("hidden")) {
      let errorArray = [];

      try {
        $(this).addClass("loading");

        let datasetNameInput = document.getElementById("guided-dataset-name-input").value.trim();
        let datasetSubtitleInput = document
          .getElementById("guided-dataset-subtitle-input")
          .value.trim();
        if (!datasetNameInput) {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset name.",
          });
        }
        if (!datasetSubtitleInput) {
          errorArray.push({
            type: "notyf",
            message: "Please enter a dataset subtitle.",
          });
        }
        if (errorArray.length > 0) {
          throw errorArray;
        }

        console.log('PASSED', globals.sodaJSONObj, globals)

        if (Object.keys(globals.sodaJSONObj).length === 0) {
          //get names of existing progress saves
          const existingProgressNames = [] //fs.readdirSync(guidedProgressFilePath); // NOTE: Not looking for existing saves anymore...
          //Remove '.json' from each element in existingProgressNames
          existingProgressNames.forEach((element, index) => {
            existingProgressNames[index] = element.replace(".json", "");
          });
          //check if dataset name is already in use
          if (existingProgressNames.includes(datasetNameInput)) {
            errorArray.push({
              type: "notyf",
              message:
                "An existing progress file already exists with that name. Please choose a different name.",
            });
            throw errorArray;
          }

          guidedCreateSodaJSONObj();
          attachGuidedMethodsToSodaJSONObj();

          await setOrUpdateGuidedDatasetName(datasetNameInput);
          setGuidedDatasetSubtitle(datasetSubtitleInput);
          saveGuidedProgress(datasetNameInput);
        } else {
          //updating current progress file
          try {
            await setOrUpdateGuidedDatasetName(datasetNameInput);
          } catch (error) {
            errorArray.push({
              type: "notyf",
              message: error,
            });
            throw errorArray;
          }
          setGuidedDatasetSubtitle(datasetSubtitleInput);
          saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
        }
        $(this).removeClass("loading");

        globals.resetGuidedRadioButtons("guided-dataset-starting-point-tab");
        guidedTransitionFromDatasetNameSubtitlePage();
      } catch (error) {
        errorArray.map((error) => {
          if (error.type === "notyf") {
            notyf.open({
              duration: "4000",
              type: "error",
              message: error.message,
            });
          }
        });
        $(this).removeClass("loading");
      }
      $(this).removeClass("loading");
    }
  });
  $("#guided-modify-dataset-name-subtitle").on("click", async () => {
    let errorArray = [];
    try {
      const datasetName = getGuidedDatasetName();
      const datasetSubtitle = getGuidedDatasetSubtitle();

      if (datasetName === datasetNameInputValue && datasetSubtitle === datasetSubtitleInputValue) {
        //If not changes were made to the name or subtitle, exit the page
        guidedTransitionFromDatasetNameSubtitlePage();
        return;
      }

      if (datasetName != datasetNameInputValue) {
        //check if dataset name is already in use
        const existingProgressFileNames = fs.readdirSync(guidedProgressFilePath);
        //Get the name of the progress files without the file type
        const existingProgressDatasetNames = existingProgressFileNames.map((fileName) => {
          return fileName.split(".")[0];
        });
        if (existingProgressDatasetNames.includes(datasetNameInputValue)) {
          const result = await Swal.fire({
            title: "An existing progress file with this name already exists",
            text: "Would you like to overwrite it? This will replace existing data saved under the old progress file with your current progress.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, overwrite existing file",
            cancelButtonText: "No, cancel",
          });
          if (result.isConfirmed) {
            setOrUpdateGuidedDatasetName(datasetNameInputValue);
            setGuidedDatasetSubtitle(datasetSubtitleInputValue);
            saveGuidedProgress(datasetNameInputValue);
          }
        } else {
          setOrUpdateGuidedDatasetName(datasetNameInputValue);

          setGuidedDatasetSubtitle(datasetSubtitleInputValue);
          saveGuidedProgress(datasetNameInputValue);
        }
      } else {
        setGuidedDatasetSubtitle(datasetSubtitleInputValue);
        saveGuidedProgress(datasetNameInputValue);
      }
      //transition out of dataset name/subtitle page
      guidedTransitionFromDatasetNameSubtitlePage();
    } catch (error) {
      errorArray.map((error) => {
        if (error.type === "notyf") {
          notyf.open({
            duration: "4000",
            type: "error",
            message: error.message,
          });
        }
        errorArray = [];
      });
    }
  });

  //WHEN STRUCTURING FOLDER GUIDED
  $("#guided-button-import-existing-dataset-structure").on("click", () => {
    //Hide proper capsules and apply proper skip pages
    $("#guided-curate-new-dataset-branch-capsule-container").hide();
    $("#guided-curate-existing-local-dataset-branch-capsule-container").css("display", "flex");
    $(".guided-curate-existing-local-dataset-branch-page").attr("data-skip-page", "false");
    $(".guided-curate-new-dataset-branch-page").attr("data-skip-page", "true");
  });
  //WHEN IMPORTING LOCAL STRUCTURE
  $("#guided-button-guided-dataset-structuring").on("click", () => {
    //Hide proper capsules and apply proper skip pages
    $("#guided-curate-existing-local-dataset-branch-capsule-container").hide();
    $("#guided-curate-new-dataset-branch-capsule-container").css("display", "flex");

    $(".guided-curate-new-dataset-branch-page").attr("data-skip-page", "false");
    $(".guided-curate-existing-local-dataset-branch-page").attr("data-skip-page", "true");
  });
  $("#guided-structure-new-dataset").on("click", () => {
    $("#guided-next-button").click();
  });
  $("#guided-import-existing-dataset").on("click", () => {
    $("#guided-next-button").click();
  });

  $("#guided-button-add-permission-user-or-team").on("click", function () {
    try {
      //get the selected permission element
      const newPermissionElement = $("#guided_bf_list_users_and_teams option:selected");
      const newPermissionRoleElement = $("#select-permission-list-users-and-teams");

      //throw error if no user/team or role is selected
      if (
        newPermissionElement.val().trim() === "Select individuals or teams to grant permissions to"
      ) {
        throw "Please select a user or team to designate a permission to";
      }
      if (newPermissionRoleElement.val().trim() === "Select role") {
        throw "Please select a role for the user or team";
      }
      if (
        newPermissionElement.val().trim() === globals.sodaJSONObj["digital-metadata"]["pi-owner"]["UUID"]
      ) {
        throw `${newPermissionElement.text().trim()} is designated as the PI owner.
        To designate them as a ${newPermissionRoleElement
          .val()
          .trim()}, go back and remove them as the PI owner.`;
      }

      if (newPermissionElement[0].getAttribute("permission-type") == "user") {
        //if the selected element is a user, add the user to the user permissions array
        userString = newPermissionElement.text().trim();
        userName = userString.split("(")[0].trim();
        UUID = newPermissionElement.val().trim();
        userPermission = newPermissionRoleElement.val().trim();
        const newUserPermissionObj = {
          userString: userString,
          userName: userName,
          UUID: UUID,
          permission: userPermission,
        };
        guidedAddUserPermission(newUserPermissionObj);
      }
      if (newPermissionElement[0].getAttribute("permission-type") == "team") {
        //if the selected element is a team, add the team to the team permissions array
        const newTeamPermissionObj = {
          teamString: newPermissionElement.text().trim(),
          UUID: newPermissionElement.val().trim(),
          permission: newPermissionRoleElement.val().trim(),
        };
        guidedAddTeamPermission(newTeamPermissionObj);
      }
      $(this)[0].scrollIntoView({
        behavior: "smooth",
      });
      guidedResetUserTeamPermissionsDropdowns();
    } catch (error) {
      notyf.open({
        duration: "4000",
        type: "error",
        message: error,
      });
    }
  });
  $("#guided-button-add-permission-user").on("click", function () {
    const newUserPermission = {
      userString: $("#guided_bf_list_users option:selected").text().trim(),
      UUID: $("#guided_bf_list_users").val().trim(),
      permission: $("#select-permission-list-users-and-teams").val(),
    };
    removeAlertMessageIfExists($("#guided-designated-user-permissions-info"));
    guidedAddUserPermission(newUserPermission);
  });

  $("#guided-button-add-permission-team").on("click", function () {
    const newTeamPermissionObj = {
      teamString: $("#guided_bf_list_teams").val().trim(),
      permission: $("#select-permission-list-4").val(),
    };
    removeAlertMessageIfExists($("#guided-designated-team-permissions-info"));
    guidedAddTeamPermission(newTeamPermissionObj);
  });

  $(".guided--radio-button").on("click", function () {
    const selectedButton = $(this);
    const notSelectedButton = $(this).siblings(".guided--radio-button");

    notSelectedButton.removeClass("selected");
    notSelectedButton.addClass("not-selected basic");

    //If button has prevent-radio-handler data attribute, other buttons, will be deselected
    //but all other radio button functions will be halted
    if (selectedButton.data("prevent-radio-handler") === true) {
      return;
    }

    selectedButton.removeClass("not-selected basic");
    selectedButton.addClass("selected");

    //Hide all child containers of non-selected buttons
    notSelectedButton.each(function () {
      if ($(this).data("next-element")) {
        globals.nextQuestionID = $(this).data("next-element");
        $(`#${globals.nextQuestionID}`).addClass("hidden");
      }
    });

    //Display and scroll to selected element container if data-next-element exists
    if (selectedButton.data("next-element")) {
      const id = globals.nextQuestionID = selectedButton.data("next-element");

      const nextQuestionElement = document.getElementById(id)
      nextQuestionElement.classList.remove("hidden");
      //slow scroll to the next question
      //temp fix to prevent scrolling error
      const elementsToNotScrollTo = [
        "guided-add-samples-table",
        "guided-add-pools-table",
        "guided-div-add-subjects-table",
        "guided-div-resume-progress-cards",
        "guided-div-update-uploaded-cards",
      ];
      if (!elementsToNotScrollTo.includes(globals.nextQuestionID)) {
        nextQuestionElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    }
    //Store the button's config value in globals.sodaJSONObj
    if (selectedButton.data("button-config-value")) {
      const buttonConfigValue = selectedButton.data("button-config-value");
      const buttonConfigValueState = selectedButton.data("button-config-value-state");
      globals.sodaJSONObj["button-config"][buttonConfigValue] = buttonConfigValueState;
    }
  });

  $("#guided-button-samples-not-same").on("click", () => {
    $("#guided-button-generate-subjects-table").show();
  });
  $("#guided-button-samples-same").on("click", () => {
    $("#guided-button-generate-subjects-table").hide();
  });

  /////////////////////////////////////////////////////////
  //////////       GUIDED jsTree FUNCTIONS       //////////
  /////////////////////////////////////////////////////////

  var guidedJstreePreview = document.getElementById("guided-div-dataset-tree-preview");

  $(guidedJstreePreview).jstree({
    core: {
      check_callback: true,
      data: {},
    },
    plugins: ["types"],
    types: {
      folder: {
        icon: "fas fa-folder fa-fw",
      },
      "folder open": {
        icon: "fas fa-folder-open fa-fw",
      },
      "folder closed": {
        icon: "fas fa-folder fa-fw",
      },
      "file xlsx": {
        icon: "./assets/img/excel-file.png",
      },
      "file xls": {
        icon: "./assets/img/excel-file.png",
      },
      "file png": {
        icon: "./assets/img/png-file.png",
      },
      "file PNG": {
        icon: "./assets/img/png-file.png",
      },
      "file pdf": {
        icon: "./assets/img/pdf-file.png",
      },
      "file txt": {
        icon: "./assets/img/txt-file.png",
      },
      "file csv": {
        icon: "./assets/img/csv-file.png",
      },
      "file CSV": {
        icon: "./assets/img/csv-file.png",
      },
      "file DOC": {
        icon: "./assets/img/doc-file.png",
      },
      "file DOCX": {
        icon: "./assets/img/doc-file.png",
      },
      "file docx": {
        icon: "./assets/img/doc-file.png",
      },
      "file doc": {
        icon: "./assets/img/doc-file.png",
      },
      "file jpeg": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file JPEG": {
        icon: "./assets/img/jpeg-file.png",
      },
      "file other": {
        icon: "./assets/img/other-file.png",
      },
    },
  });

  $(guidedJstreePreview).on("open_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder open");
  });
  $(guidedJstreePreview).on("close_node.jstree", function (event, data) {
    data.instance.set_type(data.node, "folder closed");
  });

  /////////////////////////////////////////////////////////
  /////////  PENNSIEVE METADATA BUTTON HANDLERS   /////////
  /////////////////////////////////////////////////////////

  $("#guided-dataset-subtitle-input").on("keyup", () => {
    const guidedDatasetSubtitleCharCount = document.getElementById("guided-subtitle-char-count");
    countCharacters(
      document.getElementById("guided-dataset-subtitle-input"),
      guidedDatasetSubtitleCharCount
    );
  });

  //card click hanndler that displays the card's panel using the card's id prefix
  //e.g. clicking a card with id "foo-bar-card" will display the panel with the id "foo-bar-panel"
  $(".guided--card-container > div").on("click", function () {
    handlePageBranching($(this));
  });

  document
    .getElementById("guided-bootbox-sample-protocol-title")
    .addEventListener("change", function () {
      const newDescriptionAssociatedLink = $(this).find(":selected").data("protocol-link");
      document.getElementById("guided-bootbox-sample-protocol-location").value =
        newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
    });
  document
    .getElementById("guided-bootbox-sample-protocol-location")
    .addEventListener("change", function () {
      const newDescriptionAssociatedDescription = $(this)
        .find(":selected")
        .data("protocol-description");
      document.getElementById("guided-bootbox-sample-protocol-title").value =
        newDescriptionAssociatedDescription ? newDescriptionAssociatedDescription : "";
    });

  document
    .getElementById("guided-bootbox-subject-protocol-title")
    .addEventListener("change", function () {
      const newDescriptionAssociatedLink = $(this).find(":selected").data("protocol-link");
      document.getElementById("guided-bootbox-subject-protocol-location").value =
        newDescriptionAssociatedLink ? newDescriptionAssociatedLink : "";
    });
  document
    .getElementById("guided-bootbox-subject-protocol-location")
    .addEventListener("change", function () {
      const newDescriptionAssociatedDescription = $(this)
        .find(":selected")
        .data("protocol-description");
      document.getElementById("guided-bootbox-subject-protocol-title").value =
        newDescriptionAssociatedDescription ? newDescriptionAssociatedDescription : "";
    });

  // function for importing a banner image if one already exists
  $("#guided-button-add-banner-image").click(async () => {
    $("#guided-banner-image-modal").modal("show");
  });

  // Action when user click on "Import image" button for banner image
  $("#guided-button-import-banner-image").click(async () => {
    $("#guided-para-dataset-banner-image-status").html("");
    let filePaths = await ipcRenderer.invoke("open-file-dialog-import-banner-image");
    guidedHandleSelectedBannerImage(filePaths);
  });
  /////////////////////////////////////////////////////////
  //////////    GUIDED IPC RENDERER LISTENERS    //////////
  /////////////////////////////////////////////////////////

  const guidedHandleSelectedBannerImage = async (path) => {
    if (path.length > 0) {
      let original_image_path = path[0];
      let image_path = original_image_path;
      let destination_image_path = require("path").join(
        homeDirectory,
        "SODA",
        "banner-image-conversion"
      );
      let converted_image_file = require("path").join(destination_image_path, "converted-tiff.jpg");
      let conversion_success = true;
      imageExtension = path[0].split(".").pop();

      if (imageExtension.toLowerCase() == "tiff") {
        Swal.fire({
          title: "Image conversion in progress!",
          html: "Pennsieve does not support .tiff banner images. Please wait while SODA converts your image to the appropriate format required.",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showClass: {
            popup: "animate__animated animate__fadeInDown animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__fadeOutUp animate__faster",
          },
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await Jimp.read(original_image_path)
          .then(async (file) => {
            if (!fs.existsSync(destination_image_path)) {
              fs.mkdirSync(destination_image_path, { recursive: true });
            }

            try {
              if (fs.existsSync(converted_image_file)) {
                fs.unlinkSync(converted_image_file);
              }
            } catch (err) {
              conversion_success = false;
              console.error(err);
            }

            return file.write(converted_image_file, async () => {
              if (fs.existsSync(converted_image_file)) {
                let stats = fs.statSync(converted_image_file);
                let fileSizeInBytes = stats.size;
                let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                if (fileSizeInMegabytes > 5) {
                  fs.unlinkSync(converted_image_file);

                  await Jimp.read(original_image_path)
                    .then((file) => {
                      return file.resize(1024, 1024).write(converted_image_file, () => {
                        document.getElementById("div-img-container-holder").style.display = "none";
                        document.getElementById("div-img-container").style.display = "block";

                        $("#para-path-image").html(image_path);
                        guidedBfViewImportedImage.src = converted_image_file;
                        myCropper.destroy();
                        myCropper = new Cropper(guidedBfViewImportedImage, guidedCropOptions);
                        $("#save-banner-image").css("visibility", "visible");
                        $("body").removeClass("waiting");
                      });
                    })
                    .catch((err) => {
                      conversion_success = false;
                      console.error(err);
                    });
                  if (fs.existsSync(converted_image_file)) {
                    let stats = fs.statSync(converted_image_file);
                    let fileSizeInBytes = stats.size;
                    let fileSizeInMegabytes = fileSizeInBytes / (1000 * 1000);

                    if (fileSizeInMegabytes > 5) {
                      conversion_success = false;
                      // SHOW ERROR
                    }
                  }
                }
                image_path = converted_image_file;
                imageExtension = "jpg";
                $("#para-path-image").html(image_path);
                guidedBfViewImportedImage.src = image_path;
                myCropper.destroy();
                myCropper = new Cropper(guidedBfViewImportedImage, guidedCropOptions);
                $("#save-banner-image").css("visibility", "visible");
              }
            });
          })
          .catch((err) => {
            conversion_success = false;
            console.error(err);
            Swal.fire({
              icon: "error",
              text: "Something went wrong",
              confirmButtonText: "OK",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          });
        if (conversion_success == false) {
          $("body").removeClass("waiting");
          return;
        } else {
          Swal.close();
        }
      } else {
        document.getElementById("guided-div-img-container-holder").style.display = "none";
        document.getElementById("guided-div-img-container").style.display = "block";

        $("#guided-para-path-image").html(image_path);
        guidedBfViewImportedImage.src = image_path;
        myCropper.destroy();
        myCropper = new Cropper(guidedBfViewImportedImage, guidedCropOptions);

        $("#guided-save-banner-image").css("visibility", "visible");
      }
    }
  };

  $("#guided-input-destination-getting-started-locally").on("click", () => {
    ipcRenderer.send("guided-open-file-dialog-local-destination-curate");
  });

  //FETCH FUNCTIONS//
  //fetch
  const guidedUpdateUploadStatus = (uploadContainerElement, status) => {
    if (status === "uploading") {
      uploadContainerElement.classList.add("uploading");
      uploadContainerElement.classList.remove("uploaded");
      uploadContainerElement.classList.remove("error");
    } else if (status === "uploaded") {
      uploadContainerElement.classList.add("uploaded");
      uploadContainerElement.classList.remove("uploading");
      uploadContainerElement.classList.remove("error");
    } else if (status === "error") {
      uploadContainerElement.classList.add("error");
      uploadContainerElement.classList.remove("uploading");
      uploadContainerElement.classList.remove("uploaded");
    }
  };

  const guidedCreateDataset = async (bfAccount, datasetName) => {
    document.getElementById("guided-dataset-name-upload-tr").classList.remove("hidden");
    const datasetNameUploadText = document.getElementById("guided-dataset-name-upload-text");

    datasetNameUploadText.innerHTML = "Creating dataset...";
    guidedUploadStatusIcon("guided-dataset-name-upload-status", "loading");

    //If the dataset has already been created in Guided Mode, we should have an ID for the
    //dataset. If a dataset with the ID still exists on Pennsieve, we will upload to that dataset.
    if (globals.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]) {
      let datasetExistsOnPennsieve = await checkIfDatasetExistsOnPennsieve(
        globals.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"]
      );
      if (datasetExistsOnPennsieve) {
        datasetNameUploadText.innerHTML = "Dataset already exists on Pennsieve";
        guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
        return globals.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"];
      } else {
        // if the previously uploaded dataset does not exist, wipe out the previously uploaded metadata
        // so new metadata can be uploaded to the newly created dataset
        // (This would happen if the user deleted the dataset on Pennsieve)
        globals.sodaJSONObj["previously-uploaded-data"] = {};
        saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
      }
    }

    try {
      let bf_new_dataset = await client.post(
        `/manage_datasets/datasets`,
        {
          input_dataset_name: datasetName,
        },
        {
          params: {
            selected_account: bfAccount,
          },
        }
      );
      let createdDatasetsID = bf_new_dataset.data.id;
      datasetNameUploadText.innerHTML = `Successfully created dataset with name: ${datasetName}`;
      ipcRenderer.send(
        "track-event",
        "Dataset ID to Dataset Name Map",
        createdDatasetsID,
        datasetName
      );
      guidedUploadStatusIcon("guided-dataset-name-upload-status", "success");
      refreshDatasetList();
      addNewDatasetToList(datasetName);

      //Save the dataset ID generated by pennsieve so the dataset is not re-uploaded when the user
      //resumes progress after failing an upload
      globals.sodaJSONObj["digital-metadata"]["pennsieve-dataset-id"] = createdDatasetsID;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);

      return createdDatasetsID;
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);

      datasetNameUploadText.innerHTML = "Failed to create a new dataset.";

      if (emessage == "Dataset name already exists") {
        datasetNameUploadText.innerHTML = `A dataset with the name <b>${datasetName}</b> already exists on Pennsieve.<br />
          Please rename your dataset and try again.`;
        document.getElementById("guided-dataset-name-upload-status").innerHTML = `
          <button
            class="ui positive button guided--button"
            id="guided-button-rename-dataset"
            style="
              margin: 5px !important;
              background-color: var(--color-light-green) !important;
              width: 140px !important;
            "
          >
            Rename dataset
          </button>
        `;
        //add an on-click handler to the added button
        $("#guided-button-rename-dataset").on("click", () => {
          openGuidedDatasetRenameSwal();
        });
      }
      Swal.fire({
        title: `Failed to create a new dataset.`,
        text: emessage,
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      throw emessage;
    }
  };

  const guidedAddDatasetSubtitle = async (bfAccount, datasetName, datasetSubtitle) => {
    document.getElementById("guided-dataset-subtitle-upload-tr").classList.remove("hidden");
    const datasetSubtitleUploadText = document.getElementById(
      "guided-dataset-subtitle-upload-text"
    );
    datasetSubtitleUploadText.innerHTML = "Adding dataset subtitle...";
    guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "loading");

    const previousUploadSubtitle = globals.sodaJSONObj["previously-uploaded-data"]["subtitle"];

    if (previousUploadSubtitle === datasetSubtitle) {
      datasetSubtitleUploadText.innerHTML = "Dataset subtitle already added on Pennsieve";
      guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "success");
      return;
    }

    try {
      await client.put(
        `/manage_datasets/bf_dataset_subtitle`,
        {
          input_subtitle: datasetSubtitle,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      datasetSubtitleUploadText.innerHTML = `Successfully added dataset subtitle: ${datasetSubtitle}`;
      guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "success");
      globals.sodaJSONObj["previously-uploaded-data"]["subtitle"] = datasetSubtitle;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetSubtitleUploadText.innerHTML = "Failed to add a dataset subtitle.";
      guidedUploadStatusIcon("guided-dataset-subtitle-upload-status", "error");
    }
  };

  const guidedAddDatasetDescription = async (
    bfAccount,
    datasetName,
    studyPurpose,
    dataCollection,
    dataConclusion
  ) => {
    document.getElementById("guided-dataset-description-upload-tr").classList.remove("hidden");
    const datasetDescriptionUploadText = document.getElementById(
      "guided-dataset-description-upload-text"
    );
    datasetDescriptionUploadText.innerHTML = "Adding dataset description...";
    guidedUploadStatusIcon("guided-dataset-description-upload-status", "loading");

    let descriptionArray = [];

    descriptionArray.push("**Study Purpose:** " + studyPurpose + "\n\n");
    descriptionArray.push("**Data Collection:** " + dataCollection + "\n\n");
    descriptionArray.push("**Data Conclusion:** " + dataConclusion + "\n\n");

    const description = descriptionArray.join("");

    const previouslyUploadedDescription = globals.sodaJSONObj["previously-uploaded-data"]["description"];

    if (previouslyUploadedDescription === description) {
      datasetDescriptionUploadText.innerHTML = "Dataset description already added on Pennsieve";
      guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
      return;
    }

    try {
      let res = await client.put(
        `/manage_datasets/datasets/${datasetName}/readme`,
        { updated_readme: description },
        { params: { selected_account: bfAccount } }
      );

      datasetDescriptionUploadText.innerHTML = `Successfully added dataset description!`;
      guidedUploadStatusIcon("guided-dataset-description-upload-status", "success");
      globals.sodaJSONObj["previously-uploaded-data"]["description"] = description;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      datasetDescriptionUploadText.innerHTML = "Failed to add a dataset description.";
      guidedUploadStatusIcon("guided-dataset-description-upload-status", "error");
    }
  };
  const guidedAddDatasetBannerImage = async (bfAccount, datasetName, bannerImagePath) => {
    document.getElementById("guided-dataset-banner-image-upload-tr").classList.remove("hidden");
    const datasetBannerImageUploadText = document.getElementById(
      "guided-dataset-banner-image-upload-text"
    );
    datasetBannerImageUploadText.innerHTML = "Adding dataset banner image...";
    guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "loading");

    const previouslyUploadedBannerImagePath =
      globals.sodaJSONObj["previously-uploaded-data"]["banner-image-path"];

    if (previouslyUploadedBannerImagePath === bannerImagePath) {
      datasetBannerImageUploadText.innerHTML = "Dataset banner image already added on Pennsieve";
      guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "success");
      return;
    }

    try {
      await client.put(
        `/manage_datasets/bf_banner_image`,
        {
          input_banner_image_path: bannerImagePath,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      datasetBannerImageUploadText.innerHTML = `Successfully added dataset banner image!`;
      guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "success");
      globals.sodaJSONObj["previously-uploaded-data"]["banner-image-path"] = bannerImagePath;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetBannerImageUploadText.innerHTML = "Failed to add a dataset banner image.";
      guidedUploadStatusIcon("guided-dataset-banner-image-upload-status", "error");
    }
  };
  const guidedAddDatasetLicense = async (bfAccount, datasetName, datasetLicense) => {
    document.getElementById("guided-dataset-license-upload-tr").classList.remove("hidden");
    const datasetLicenseUploadText = document.getElementById("guided-dataset-license-upload-text");
    datasetLicenseUploadText.innerHTML = "Adding dataset license...";
    guidedUploadStatusIcon("guided-dataset-license-upload-status", "loading");

    const previouslyUploadedLicense = globals.sodaJSONObj["previously-uploaded-data"]["license"];

    if (previouslyUploadedLicense === datasetLicense) {
      datasetLicenseUploadText.innerHTML = "Dataset license already added on Pennsieve";
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "success");
      return;
    }

    try {
      await client.put(
        `/manage_datasets/bf_license`,
        {
          input_license: datasetLicense,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      datasetLicenseUploadText.innerHTML = `Successfully added dataset license: ${datasetLicense}`;
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "success");
      globals.sodaJSONObj["previously-uploaded-data"]["license"] = datasetLicense;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      console.error(error);
      let emessage = userErrorMessage(error);
      datasetLicenseUploadText.innerHTML = "Failed to add a dataset license.";
      guidedUploadStatusIcon("guided-dataset-license-upload-status", "error");
    }
  };

  const guidedAddPiOwner = async (bfAccount, datasetName, piOwnerObj) => {
    let loggedInUserIsNotPiOwner;
    for (user of globals.sodaJSONObj["digital-metadata"]["user-permissions"]) {
      if (user.loggedInUser) {
        //if logged in user has a user permission, then someone else is set as pi owner
        loggedInUserIsNotPiOwner = true;
      }
    }

    document.getElementById("guided-dataset-pi-owner-upload-tr").classList.remove("hidden");
    const datasetPiOwnerUploadText = document.getElementById("guided-dataset-pi-owner-upload-text");
    datasetPiOwnerUploadText.innerHTML = "Adding PI owner...";
    guidedUploadStatusIcon("guided-dataset-pi-owner-upload-status", "loading");

    if (loggedInUserIsNotPiOwner) {
      const previouslyUploadedPiOwnerObj = globals.sodaJSONObj["previously-uploaded-data"]["pi-owner"];

      if (previouslyUploadedPiOwnerObj === piOwnerObj) {
        datasetPiOwnerUploadText.innerHTML = "PI owner already added on Pennsieve";
        guidedUploadStatusIcon("guided-dataset-pi-owner-upload-status", "success");
        return;
      }

      try {
        await client.patch(
          `/manage_datasets/bf_dataset_permissions`,
          {
            input_role: "owner",
          },
          {
            params: {
              selected_account: bfAccount,
              selected_dataset: datasetName,
              scope: "user",
              name: piOwnerObj["UUID"],
            },
          }
        );
        datasetPiOwnerUploadText.innerHTML = `Successfully added PI: ${piOwnerObj["name"]}`;
        guidedUploadStatusIcon("guided-dataset-pi-owner-upload-status", "success");
        globals.sodaJSONObj["previously-uploaded-data"]["pi-owner"] = piOwnerObj;
        saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
      } catch (error) {
        console.error(error);
        let emessage = userErrorMessage(error);
        datasetPiOwnerUploadText.innerHTML = "Failed to add a PI owner.";
        guidedUploadStatusIcon("guided-dataset-pi-owner-upload-status", "error");
      }
    } else {
      datasetPiOwnerUploadText.innerHTML = `Successfully added PI: ${piOwnerObj["name"]}`;
      guidedUploadStatusIcon("guided-dataset-pi-owner-upload-status", "success");
    }
  };

  const guidedAddDatasetTags = async (bfAccount, datasetName, tags) => {
    document.getElementById("guided-dataset-tags-upload-tr").classList.remove("hidden");
    const datasetTagsUploadText = document.getElementById("guided-dataset-tags-upload-text");
    datasetTagsUploadText.innerHTML = "Adding dataset tags...";
    guidedUploadStatusIcon("guided-dataset-tags-upload-status", "loading");

    const previouslyUploadedTags = globals.sodaJSONObj["previously-uploaded-data"]["tags"];

    if (JSON.stringify(previouslyUploadedTags) === JSON.stringify(tags)) {
      datasetTagsUploadText.innerHTML = "Dataset tags already added on Pennsieve";
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "success");
      return;
    }

    try {
      await client.put(
        `/manage_datasets/datasets/${datasetName}/tags`,
        { tags },
        {
          params: {
            selected_account: bfAccount,
          },
        }
      );

      datasetTagsUploadText.innerHTML = `Successfully added dataset tags: ${tags.join(", ")}`;
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "success");
      globals.sodaJSONObj["previously-uploaded-data"]["tags"] = tags;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      datasetTagsUploadText.innerHTML = "Failed to add dataset tags.";
      guidedUploadStatusIcon("guided-dataset-tags-upload-status", "error");
    }
  };
  const guidedGrantUserPermission = async (
    bfAccount,
    datasetName,
    userName,
    userUUID,
    selectedRole
  ) => {


    const userPermissionUploadElement = `
        <tr id="guided-dataset-${userUUID}-permissions-upload-tr" class="permissions-upload-tr">
          <td class="middle aligned" id="guided-dataset-${userUUID}-permissions-upload-text">
            Granting ${userName} ${selectedRole} permissions...
          </td>
          <td class="middle aligned text-center collapsing border-left-0 p-0">
            <div
              class="guided--container-upload-status"
              id="guided-dataset-${userUUID}-permissions-upload-status"
            ></div>
          </td>
        </tr>
      `;

    //apend the upload element to the end of the table body
    document
      .getElementById("guided-tbody-pennsieve-metadata-upload")
      .insertAdjacentHTML("beforeend", userPermissionUploadElement);

    const userPermissionUploadStatusText = document.getElementById(
      `guided-dataset-${userUUID}-permissions-upload-text`
    );

    guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "loading");

    try {
      let bf_add_permission = await client.patch(
        `/manage_datasets/bf_dataset_permissions`,
        {
          input_role: selectedRole,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
            scope: "user",
            name: userUUID,
          },
        }
      );
      guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "success");
      userPermissionUploadStatusText.innerHTML = `${selectedRole} permissions granted to user: ${userName}`;

    } catch (error) {
      guidedUploadStatusIcon(`guided-dataset-${userUUID}-permissions-upload-status`, "error");
      userPermissionUploadStatusText.innerHTML = `Failed to grant ${selectedRole} permissions to ${userName}`;

      console.error(error);
      let emessage = userError(error);
      throw error;
    }
  };

  const guidedAddUserPermissions = async (bfAccount, datasetName, userPermissionsArray) => {
    //filter user permissions with loggedInUser key
    const promises = userPermissionsArray.map((userPermission) => {
      return guidedGrantUserPermission(
        bfAccount,
        datasetName,
        userPermission.userName,
        userPermission.UUID,
        userPermission.permission
      );
    });
    const result = await Promise.allSettled(promises);
  };

  const guidedGrantTeamPermission = async (
    bfAccount,
    datasetName,
    teamUUID,
    teamString,
    selectedRole
  ) => {
    const teamPermissionUploadElement = `
      <tr id="guided-dataset-${teamString}-permissions-upload-tr" class="permissions-upload-tr">
        <td class="middle aligned" id="guided-dataset-${teamString}-permissions-upload-text">
          Granting ${teamString} ${selectedRole} permissions.
        </td>
        <td class="middle aligned text-center collapsing border-left-0 p-0">
          <div
            class="guided--container-upload-status"
            id="guided-dataset-${teamString}-permissions-upload-status"
          ></div>
        </td>
      </tr>
    `;

    //apend the upload element to the end of the table body
    document
      .getElementById("guided-tbody-pennsieve-metadata-upload")
      .insertAdjacentHTML("beforeend", teamPermissionUploadElement);

    const teamPermissionUploadStatusText = document.getElementById(
      `guided-dataset-${teamString}-permissions-upload-text`
    );
    guidedUploadStatusIcon(`guided-dataset-${teamString}-permissions-upload-status`, "loading");

    try {
      let bf_add_permission = await client.patch(
        `/manage_datasets/bf_dataset_permissions`,
        {
          input_role: selectedRole,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
            scope: "team",
            name: teamUUID,
          },
        }
      );
      guidedUploadStatusIcon(`guided-dataset-${teamString}-permissions-upload-status`, "success");
      teamPermissionUploadStatusText.innerHTML = `${selectedRole} permissions granted to team: ${teamString}`;

    } catch (error) {
      guidedUploadStatusIcon(`guided-dataset-${teamString}-permissions-upload-status`, "error");
      teamPermissionUploadStatusText.innerHTML = `Failed to grant ${selectedRole} permissions to ${teamString}`;

      console.error(error);
      let emessage = userError(error);
      throw error;
    }
  };

  const guidedAddTeamPermissions = async (bfAccount, datasetName, teamPermissionsArray) => {
    const promises = teamPermissionsArray.map((teamPermission) => {
      return guidedGrantTeamPermission(
        bfAccount,
        datasetName,
        teamPermission.UUID,
        teamPermission.teamString,
        teamPermission.permission
      );
    });
    const result = await Promise.allSettled(promises);
  };

  $("#guided-button-preview-folder-structure").on("click", () => {
    Swal.fire({
      title: "Dataset folder structure preview",
      width: 800,
      html: `<div id="guided-folder-structure-preview" style="display: block; width: 100%;"></div>`,
    });
    var folderStructurePreview = document.getElementById("guided-folder-structure-preview");

    $(folderStructurePreview).jstree({
      core: {
        check_callback: true,
        data: {},
      },
      plugins: ["types"],
      types: {
        folder: {
          icon: "fas fa-folder fa-fw",
        },
        "folder open": {
          icon: "fas fa-folder-open fa-fw",
        },
        "folder closed": {
          icon: "fas fa-folder fa-fw",
        },
        "file xlsx": {
          icon: "./assets/img/excel-file.png",
        },
        "file xls": {
          icon: "./assets/img/excel-file.png",
        },
        "file png": {
          icon: "./assets/img/png-file.png",
        },
        "file PNG": {
          icon: "./assets/img/png-file.png",
        },
        "file pdf": {
          icon: "./assets/img/pdf-file.png",
        },
        "file txt": {
          icon: "./assets/img/txt-file.png",
        },
        "file csv": {
          icon: "./assets/img/csv-file.png",
        },
        "file CSV": {
          icon: "./assets/img/csv-file.png",
        },
        "file DOC": {
          icon: "./assets/img/doc-file.png",
        },
        "file DOCX": {
          icon: "./assets/img/doc-file.png",
        },
        "file docx": {
          icon: "./assets/img/doc-file.png",
        },
        "file doc": {
          icon: "./assets/img/doc-file.png",
        },
        "file jpeg": {
          icon: "./assets/img/jpeg-file.png",
        },
        "file JPEG": {
          icon: "./assets/img/jpeg-file.png",
        },
        "file other": {
          icon: "./assets/img/other-file.png",
        },
      },
    });
    $(folderStructurePreview).on("open_node.jstree", function (event, data) {
      data.instance.set_type(data.node, "folder open");
    });
    $(folderStructurePreview).on("close_node.jstree", function (event, data) {
      data.instance.set_type(data.node, "folder closed");
    });
    guidedShowTreePreview(globals.sodaJSONObj["digital-metadata"]["name"], folderStructurePreview);

    const folderPage = CURRENT_PAGE.attr("id");
    if (folderPage === "guided-subjects-folder-tab") {
      //open jsTree to correct folder
      $(folderStructurePreview)
        .jstree(true)
        .open_node($(folderStructurePreview).jstree(true).get_node("#"));
    }
  });

  //const add_dataset_permission = async();

  //********************************************************************************************************

  const guidedUploadSubjectsMetadata = async (bfAccount, datasetName, subjectsTableData) => {
    document.getElementById("guided-subjects-metadata-upload-tr").classList.remove("hidden");
    const subjectsMetadataUploadText = document.getElementById(
      "guided-subjects-metadata-upload-text"
    );
    subjectsMetadataUploadText.innerHTML = "Uploading subjects metadata...";
    guidedUploadStatusIcon("guided-subjects-metadata-upload-status", "loading");

    const previouslyUpdatedSubjectsMetadata =
      globals.sodaJSONObj["previously-uploaded-data"]["subjects-metadata"];

    if (JSON.stringify(previouslyUpdatedSubjectsMetadata) === JSON.stringify(subjectsTableData)) {
      guidedUploadStatusIcon("guided-subjects-metadata-upload-status", "success");
      subjectsMetadataUploadText.innerHTML = "Subjects metadata added to Pennsieve";
      return;
    }

    try {
      await client.post(
        `/prepare_metadata/subjects_file`,
        {
          filepath: "",
          selected_account: bfAccount,
          selected_dataset: datasetName,
          subjects_header_row: subjectsTableData,
        },
        {
          params: {
            upload_boolean: true,
          },
        }
      );
      guidedUploadStatusIcon("guided-subjects-metadata-upload-status", "success");
      subjectsMetadataUploadText.innerHTML = `Subjects metadata successfully uploaded`;
      globals.sodaJSONObj["previously-uploaded-data"]["subjects-metadata"] = subjectsTableData;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      guidedUploadStatusIcon("guided-subjects-metadata-upload-status", "error");
      subjectsMetadataUploadText.innerHTML = `Failed to upload subjects metadata`;
      clientError(error);
    }
  };
  const guidedUploadSamplesMetadata = async (bfAccount, datasetName, samplesTableData) => {
    document.getElementById("guided-samples-metadata-upload-tr").classList.remove("hidden");
    const samplesMetadataUploadText = document.getElementById(
      "guided-samples-metadata-upload-text"
    );
    samplesMetadataUploadText.innerHTML = "Uploading samples metadata...";
    guidedUploadStatusIcon("guided-samples-metadata-upload-status", "loading");

    const previouslyUpdatedSamplesMetadata =
      globals.sodaJSONObj["previously-uploaded-data"]["samples-metadata"];

    if (JSON.stringify(previouslyUpdatedSamplesMetadata) === JSON.stringify(samplesTableData)) {
      guidedUploadStatusIcon("guided-samples-metadata-upload-status", "success");
      samplesMetadataUploadText.innerHTML = "Samples metadata added to Pennsieve";
      return;
    }

    try {
      await client.post(
        `/prepare_metadata/samples_file`,
        {
          filepath: "",
          selected_account: bfAccount,
          selected_dataset: datasetName,
          samples_str: samplesTableData,
        },
        {
          params: {
            upload_boolean: true,
          },
        }
      );
      guidedUploadStatusIcon("guided-samples-metadata-upload-status", "success");
      samplesMetadataUploadText.innerHTML = `Samples metadata successfully uploaded`;
      globals.sodaJSONObj["previously-uploaded-data"]["samples-metadata"] = samplesTableData;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      guidedUploadStatusIcon("guided-samples-metadata-upload-status", "error");
      samplesMetadataUploadText.innerHTML = `Failed to upload samples metadata`;
      clientError(error);
    }
  };
  const guidedUploadSubmissionMetadata = async (bfAccount, datasetName, submissionMetadataJSON) => {
    document.getElementById("guided-submission-metadata-upload-tr").classList.remove("hidden");
    const submissionMetadataUploadText = document.getElementById(
      "guided-submission-metadata-upload-text"
    );
    submissionMetadataUploadText.innerHTML = "Uploading submission metadata...";
    guidedUploadStatusIcon("guided-submission-metadata-upload-status", "loading");

    const previouslyUpdatedSubmissionMetadata =
      globals.sodaJSONObj["previously-uploaded-data"]["submission-metadata"];

    if (
      JSON.stringify(previouslyUpdatedSubmissionMetadata) === JSON.stringify(submissionMetadataJSON)
    ) {
      guidedUploadStatusIcon("guided-submission-metadata-upload-status", "success");
      submissionMetadataUploadText.innerHTML = "Submission metadata added to Pennsieve";
      return;
    }

    try {
      await client.post(
        `/prepare_metadata/submission_file`,
        {
          submission_file_rows: submissionMetadataJSON,
          filepath: "",
          upload_boolean: true,
        },
        {
          params: {
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      guidedUploadStatusIcon("guided-submission-metadata-upload-status", "success");
      submissionMetadataUploadText.innerHTML = `Submission metadata successfully uploaded`;
      globals.sodaJSONObj["previously-uploaded-data"]["submission-metadata"] = submissionMetadataJSON;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      guidedUploadStatusIcon("guided-submission-metadata-upload-status", "error");
      submissionMetadataUploadText.innerHTML = `Failed to upload submission metadata`;
      clientError(error);
    }
  };

  const guidedUploadDatasetDescriptionMetadata = async (
    bfAccount,
    datasetName,
    datasetInformation,
    studyInformation,
    contributorInformation,
    additionalLinks
  ) => {
    document
      .getElementById("guided-dataset-description-metadata-upload-tr")
      .classList.remove("hidden");
    const datasetDescriptionMetadataUploadText = document.getElementById(
      "guided-dataset-description-metadata-upload-text"
    );
    datasetDescriptionMetadataUploadText.innerHTML = "Uploading dataset description metadata...";
    guidedUploadStatusIcon("guided-dataset-description-metadata-upload-status", "loading");

    const previouslyUpdatedDatasetDescriptionMetadata =
      globals.sodaJSONObj["previously-uploaded-data"]["dataset-description-metadata"];

    if (
      JSON.stringify(previouslyUpdatedDatasetDescriptionMetadata) ===
      JSON.stringify({
        datasetInformation,
        studyInformation,
        contributorInformation,
        additionalLinks,
      })
    ) {
      guidedUploadStatusIcon("guided-dataset-description-metadata-upload-status", "success");
      datasetDescriptionMetadataUploadText.innerHTML =
        "Dataset description metadata added to Pennsieve";
      return;
    }

    try {
      await client.post(
        `/prepare_metadata/dataset_description_file`,
        {
          selected_account: bfAccount,
          selected_dataset: datasetName,
          filepath: "",
          dataset_str: datasetInformation,
          study_str: studyInformation,
          contributor_str: contributorInformation,
          related_info_str: additionalLinks,
        },
        {
          params: {
            upload_boolean: true,
          },
        }
      );
      guidedUploadStatusIcon("guided-dataset-description-metadata-upload-status", "success");
      datasetDescriptionMetadataUploadText.innerHTML =
        "Dataset description metadata successfully uploaded";
      globals.sodaJSONObj["previously-uploaded-data"]["dataset-description-metadata"] = {
        datasetInformation,
        studyInformation,
        contributorInformation,
        additionalLinks,
      };
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      guidedUploadStatusIcon("guided-dataset-description-metadata-upload-status", "error");
      datasetDescriptionMetadataUploadText.innerHTML = `Failed to upload dataset description metadata`;
      clientError(error);
    }
  };

  const guidedUploadCodeDescriptionMetadata = async (
    bfAccount,
    datasetName,
    codeDescriptionFilePath
  ) => {
    document
      .getElementById("guided-code-description-metadata-upload-tr")
      .classList.remove("hidden");
    const codeDescriptionMetadataUploadText = document.getElementById(
      "guided-code-description-metadata-upload-text"
    );
    codeDescriptionMetadataUploadText.innerHTML = "Uploading code description metadata...";
    guidedUploadStatusIcon("guided-code-description-metadata-upload-status", "loading");

    try {
      await client.post("/prepare_metadata/code_description_file", {
        filepath: codeDescriptionFilePath,
        selected_account: bfAccount,
        selected_dataset: datasetName,
      });
      guidedUploadStatusIcon("guided-code-description-metadata-upload-status", "success");
      codeDescriptionMetadataUploadText.innerHTML = "Code description metadata added to Pennsieve";
    } catch (error) {
      guidedUploadStatusIcon("guided-code-description-metadata-upload-status", "error");
      codeDescriptionMetadataUploadText.innerHTML = `Failed to upload code description metadata`;
      clientError(error);
    }
  };

  const guidedUploadREADMEorCHANGESMetadata = async (
    bfAccount,
    datasetName,
    readmeORchanges, //lowercase file type
    readmeOrChangesMetadata
  ) => {
    document
      .getElementById(`guided-${readmeORchanges}-metadata-upload-tr`)
      .classList.remove("hidden");
    const datasetDescriptionMetadataUploadText = document.getElementById(
      `guided-${readmeORchanges}-metadata-upload-text`
    );
    datasetDescriptionMetadataUploadText.innerHTML = `Uploading ${readmeORchanges.toUpperCase()} metadata...`;
    guidedUploadStatusIcon(`guided-${readmeORchanges}-metadata-upload-status`, "loading");

    const previouslyUpdatedREADMEorCHANGESMetadata =
      globals.sodaJSONObj["previously-uploaded-data"][`${readmeORchanges}-metadata`];

    if (
      JSON.stringify(previouslyUpdatedREADMEorCHANGESMetadata) ===
      JSON.stringify(readmeOrChangesMetadata)
    ) {
      guidedUploadStatusIcon(`guided-${readmeORchanges}-metadata-upload-status`, "success");
      datasetDescriptionMetadataUploadText.innerHTML = `${readmeORchanges.toUpperCase()} metadata added to Pennsieve`;
      return;
    }

    try {
      await client.post(
        "/prepare_metadata/readme_changes_file",
        {
          text: readmeOrChangesMetadata,
        },
        {
          params: {
            file_type: `${readmeORchanges.toUpperCase()}.txt`,
            selected_account: bfAccount,
            selected_dataset: datasetName,
          },
        }
      );
      guidedUploadStatusIcon(`guided-${readmeORchanges}-metadata-upload-status`, "success");
      datasetDescriptionMetadataUploadText.innerHTML = `${readmeORchanges.toUpperCase()} metadata successfully uploaded`;
      globals.sodaJSONObj["previously-uploaded-data"][`${readmeORchanges}-metadata`] =
        readmeOrChangesMetadata;
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
    } catch (error) {
      guidedUploadStatusIcon(`guided-${readmeORchanges}-metadata-upload-status`, "error");
      datasetDescriptionMetadataUploadText.innerHTML = `Failed to upload ${readmeORchanges.toUpperCase()} metadata`;
      clientError(error);
    }
  };

  const guidedPennsieveDatasetUpload = async () => {
    try {
      const guidedBfAccount = defaultBfAccount;
      const guidedDatasetName = globals.sodaJSONObj["digital-metadata"]["name"];
      const guidedDatasetSubtitle = globals.sodaJSONObj["digital-metadata"]["subtitle"];
      const guidedUsers = globals.sodaJSONObj["digital-metadata"]["user-permissions"];
      const guidedPIOwner = globals.sodaJSONObj["digital-metadata"]["pi-owner"];
      const guidedTeams = globals.sodaJSONObj["digital-metadata"]["team-permissions"];

      let guidedPennsieveStudyPurpose =
        globals.sodaJSONObj["digital-metadata"]["description"]["study-purpose"];
      let guidedPennsieveDataCollection =
        globals.sodaJSONObj["digital-metadata"]["description"]["data-collection"];
      let guidedPennsievePrimaryConclusion =
        globals.sodaJSONObj["digital-metadata"]["description"]["primary-conclusion"];

      const guidedTags = globals.sodaJSONObj["digital-metadata"]["dataset-tags"];
      const guidedLicense = globals.sodaJSONObj["digital-metadata"]["license"];
      const guidedBannerImagePath = globals.sodaJSONObj["digital-metadata"]["banner-image-path"];

      //Subjects Metadata Variables
      const guidedSubjectsMetadata = globals.sodaJSONObj["subjects-table-data"];

      //Samples Metadata variables
      const guidedSamplesMetadata = globals.sodaJSONObj["samples-table-data"];

      //Submission Metadata variables
      const guidedSparcAward = globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"];
      const guidedMilestones = globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"];
      const guidedCompletionDate =
        globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"];
      let guidedSubmissionMetadataJSON = [];
      guidedSubmissionMetadataJSON.push({
        award: guidedSparcAward,
        date: guidedCompletionDate,
        milestone: guidedMilestones[0],
      });
      for (let i = 1; i < guidedMilestones.length; i++) {
        guidedSubmissionMetadataJSON.push({
          award: "",
          date: "",
          milestone: guidedMilestones[i],
        });
      }

      //Dataset Description Metadata variables
      const guidedDatasetInformation =
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"];

      const guidedStudyInformation =
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"];

      let guidedContributorInformation = {
        ...globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"],
      };

      //add the SPARC award as the first element in the funding source array if it's not already in the funding array
      if (!guidedContributorInformation["funding"].includes(guidedSparcAward)) {
        guidedContributorInformation["funding"].unshift(guidedSparcAward);
      }

      //Add contributors from globals.sodaJSONObj to guidedContributorInformation in the "contributors" key
      let contributors = globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributors"];

      guidedContributorInformation["contributors"] = contributors.map((contributor) => {
        return {
          conAffliation: contributor["conAffliation"].join(", "),
          conID: contributor["conID"],
          conName: contributor["conName"],
          conRole: contributor["conRole"].join(", "),
          contributorFirstName: contributor["contributorFirstName"],
          contributorLastName: contributor["contributorLastName"],
        };
      });

      const guidedAdditionalLinks =
        globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["additional-links"];

      //README and CHANGES Metadata variables
      const guidedReadMeMetadata = globals.sodaJSONObj["dataset-metadata"]["README"];
      const guidedChangesMetadata = globals.sodaJSONObj["dataset-metadata"]["CHANGES"];

      // get apps base path
      const basepath = app.getAppPath();
      const resourcesPath = process.resourcesPath;

      // set the templates path
      try {
        await client.put("prepare_metadata/template_paths", {
          basepath: basepath,
          resourcesPath: resourcesPath,
        });
      } catch (error) {
        clientError(error);
        ipcRenderer.send("track-event", "Error", "Setting Templates Path");
        throw "Error setting templates path";
      }
      //Run ple flight checks to ensure SODA is prepared to upload to Pennsieve
      let supplementary_checks = await run_pre_flight_checks(false);

      // set the templates path
      if (!supplementary_checks) {
        $("#sidebarCollapse").prop("disabled", false);
        return;
      }

      //Display the Pennsieve metadata upload table
      unHideAndSmoothScrollToElement("guided-div-pennsieve-metadata-upload-status-table");

      let datasetUploadResponse = await guidedCreateDataset(guidedBfAccount, guidedDatasetName);
      await guidedAddDatasetSubtitle(guidedBfAccount, guidedDatasetName, guidedDatasetSubtitle);
      await guidedAddDatasetDescription(
        guidedBfAccount,
        guidedDatasetName,
        guidedPennsieveStudyPurpose,
        guidedPennsieveDataCollection,
        guidedPennsievePrimaryConclusion
      );
      await guidedAddDatasetBannerImage(guidedBfAccount, guidedDatasetName, guidedBannerImagePath);
      await guidedAddDatasetLicense(guidedBfAccount, guidedDatasetName, guidedLicense);
      await guidedAddDatasetTags(guidedBfAccount, guidedDatasetName, guidedTags);
      await guidedAddPiOwner(guidedBfAccount, guidedDatasetName, guidedPIOwner);
      await guidedAddUserPermissions(guidedBfAccount, guidedDatasetName, guidedUsers);
      await guidedAddTeamPermissions(guidedBfAccount, guidedDatasetName, guidedTeams);

      //Display the Dataset metadata upload table
      unHideAndSmoothScrollToElement("guided-div-dataset-metadata-upload-status-table");


      //set timeout for 2 seconds
      await new Promise((r) => setTimeout(r, 2000));

      if (guidedSubjectsMetadata.length > 0) {
        await guidedUploadSubjectsMetadata(
          guidedBfAccount,
          guidedDatasetName,
          guidedSubjectsMetadata
        );
      }
      if (guidedSamplesMetadata.length > 0) {
        await guidedUploadSamplesMetadata(
          guidedBfAccount,
          guidedDatasetName,
          guidedSamplesMetadata
        );
      }

      let submissionMetadataRes = await guidedUploadSubmissionMetadata(
        guidedBfAccount,
        guidedDatasetName,
        guidedSubmissionMetadataJSON
      );

      let descriptionMetadataRes = await guidedUploadDatasetDescriptionMetadata(
        guidedBfAccount,
        guidedDatasetName,
        guidedDatasetInformation,
        guidedStudyInformation,
        guidedContributorInformation,
        guidedAdditionalLinks
      );

      let readMeMetadataRes = await guidedUploadREADMEorCHANGESMetadata(
        guidedBfAccount,
        guidedDatasetName,
        "readme",
        guidedReadMeMetadata
      );

      if (guidedChangesMetadata.length > 0) {
        let changesMetadataRes = await guidedUploadREADMEorCHANGESMetadata(
          guidedBfAccount,
          guidedDatasetName,
          "changes",
          guidedChangesMetadata
        );
      }
      if (fs.existsSync(globals.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"])) {
        let codeDescriptionRes = await guidedUploadCodeDescriptionMetadata(
          guidedBfAccount,
          guidedDatasetName,
          globals.sodaJSONObj["dataset-metadata"]["code-metadata"]["code_description"]
        );
      }

      //Display the main dataset upload progress bar
      unHideAndSmoothScrollToElement("guided-div-dataset-upload-status-table");

      await guidedCreateManifestFilesAndAddToDatasetStructure();

      //Upload the dataset files
      const mainCurationResponse = await guidedUploadDatasetToPennsieve();
    } catch (error) {
      console.log(error);
      clientError(error);
      let emessage = userErrorMessage(error);
      //make an unclosable sweet alert that forces the user to close out of the app
      await Swal.fire({
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        title: "An error occurred during your upload",
        html: `
          <p>Error message: ${emessage}</p>
          <p>
            Please close the SODA app and restart it again. You will be able to resume your upload
            in progress by returning to Guided Mode and clicking the "Resume Upload"
            button on your dataset's progress card.
          </p>
        `,
        showCancelButton: false,
        confirmButtonText: "Close SODA Application",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      app.showExitPrompt = false;
      app.quit();
    }
  };
  const openGuidedDatasetRenameSwal = async () => {
    const currentDatasetUploadName = globals.sodaJSONObj["digital-metadata"]["name"];

    const { value: newDatasetName } = await Swal.fire({
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      title: "Rename your dataset",
      html: `<b>Current dataset name:</b> ${currentDatasetUploadName}<br /><br />Enter a new name for your dataset below:`,
      input: "text",
      inputPlaceholder: "Enter a new name for your dataset",
      inputAttributes: {
        autocapitalize: "off",
      },
      inputValue: currentDatasetUploadName,
      showCancelButton: true,
      confirmButtonText: "Rename",
      confirmButtonColor: "#3085d6 !important",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
      preConfirm: (inputValue) => {
        if (inputValue === "") {
          Swal.showValidationMessage("Please enter a name for your dataset!");
          return false;
        }
        if (inputValue === currentDatasetUploadName) {
          Swal.showValidationMessage("Please enter a new name for your dataset!");
          return false;
        }
      },
    });
    if (newDatasetName) {
      globals.sodaJSONObj["digital-metadata"]["name"] = newDatasetName;

      guidedPennsieveDatasetUpload();
    }
  };

  const guidedCreateManifestFilesAndAddToDatasetStructure = async () => {
    // if the user chose to auto-generate manifest files, create the excel files in local storage
    // and add the paths to the manifest files in the datasetStructure object
    if (globals.sodaJSONObj["button-config"]["manifest-files-generated-automatically"] === "yes") {
      /**
       * If the user has selected to auto-generate manifest files,
       * grab the manifest data for each high level folder, create an excel file
       * using the manifest data, and add the excel file to the datasetStructureJSONObj
       */

      // First, empty the guided_manifest_files so we can add the new manifest files
      fs.emptyDirSync(guidedManifestFilePath);

      const guidedManifestData = globals.sodaJSONObj["guided-manifest-files"];

      for (const [highLevelFolder, manifestData] of Object.entries(guidedManifestData)) {
        let manifestJSON = processManifestInfo(
          guidedManifestData[highLevelFolder]["headers"],
          guidedManifestData[highLevelFolder]["data"]
        );
        jsonManifest = JSON.stringify(manifestJSON);

        const manifestPath = path.join(guidedManifestFilePath, highLevelFolder, "manifest.xlsx");

        fs.mkdirSync(path.join(guidedManifestFilePath, highLevelFolder), {
          recursive: true,
        });

        convertJSONToXlsx(JSON.parse(jsonManifest), manifestPath);

        datasetStructureJSONObj["folders"][highLevelFolder]["files"]["manifest.xlsx"] = {
          action: ["new"],
          path: manifestPath,
          type: "local",
        };
      }
    }
  };

  const guidedUploadDatasetToPennsieve = async () => {
    updateJSONStructureDSstructure();

    // Initiate curation by calling Python function
    let manifest_files_requested = false;
    let main_curate_status = "Solving";
    let main_total_generate_dataset_size;

    // track the amount of files that have been uploaded/generated
    let uploadedFiles = 0;
    let uploadedFilesSize = 0;
    let foldersUploaded = 0;
    let previousUploadedFileSize = 0;
    let increaseInFileSize = 0;
    let generated_dataset_id = undefined;

    let dataset_name;
    let dataset_destination;

    if (globals.sodaJSONObj["generate-dataset"]["destination"] == "bf") {
      globals.sodaJSONObj["generate-dataset"]["generate-option"] = "new";
      //Replace files and folders since guided mode always uploads to an existing Pennsieve dataset
      globals.sodaJSONObj["generate-dataset"]["if-existing"] = "merge";
      globals.sodaJSONObj["generate-dataset"]["if-existing-files"] = "skip";
      dataset_name = globals.sodaJSONObj["digital-metadata"]["name"];
      globals.sodaJSONObj["bf-dataset-selected"] = {};
      globals.sodaJSONObj["bf-dataset-selected"]["dataset-name"] = dataset_name;
      globals.sodaJSONObj["bf-account-selected"]["account-name"] = defaultBfAccount;
      dataset_destination = "Pennsieve";
    }

    // if uploading to Pennsieve start a tracking session for the dataset upload
    if (dataset_destination == "Pennsieve") {
      // create a dataset upload session
      datasetUploadSession.startSession();
    }

    client
      .post(
        `/curate_datasets/curation`,
        {
          soda_json_structure: globals.sodaJSONObj,
        },
        { timeout: 0 }
      )
      .then(async (curationRes) => {
        main_total_generate_dataset_size = curationRes["main_total_generate_dataset_size"];
        uploadedFiles = curationRes["main_curation_uploaded_files"];
        $("#sidebarCollapse").prop("disabled", false);


        // log relevant curation details about the dataset generation/Upload to Google Analytics
        logCurationSuccessToAnalytics(
          manifest_files_requested,
          main_total_generate_dataset_size,
          dataset_name,
          dataset_destination,
          uploadedFiles,
          true
        );

        updateDatasetUploadProgressTable({
          "Upload status": "Dataset successfully uploaded to Pennsieve!",
        });

        // Clear the saved upload progress data because the dataset has been successfully
        // uploaded to Pennsieve, and any future uploads will upload using new data
        globals.sodaJSONObj["previously-uploaded-data"] = {};

        globals.sodaJSONObj["previous-guided-upload-dataset-name"] =
          globals.sodaJSONObj["digital-metadata"]["name"];

        // Save the globals.sodaJSONObj after a successful upload
        saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);

        //Display the click next text
        document
          .getElementById("guided-dataset-upload-complete-message")
          .classList.remove("hidden");

        scrollToBottomOfGuidedBody();

        //Show the next button
        $("#guided-next-button").css("visibility", "visible");

        try {
          let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
            params: {
              selected_account: defaultBfAccount,
            },
          });
          datasetList = [];
          datasetList = responseObject.data.datasets;
        } catch (error) {
          clientError(error);
        }
      })
      .catch(async (error) => {
        clientError(error);
        let emessage = userErrorMessage(error);
        try {
          let responseObject = await client.get(`manage_datasets/bf_dataset_account`, {
            params: {
              selected_account: defaultBfAccount,
            },
          });
          datasetList = [];
          datasetList = responseObject.data.datasets;
        } catch (error) {
          clientError(error);
        }

        // wait to see if the uploaded files or size will grow once the client has time to ask for the updated information
        // if they stay zero that means nothing was uploaded
        if (uploadedFiles === 0 || uploadedFilesSize === 0) {
          await wait(2000);
        }

        // log the curation errors to Google Analytics
        logCurationErrorsToAnalytics(
          uploadedFiles,
          uploadedFilesSize,
          dataset_destination,
          main_total_generate_dataset_size,
          increaseInFileSize,
          datasetUploadSession,
          true
        );
        //make an unclosable sweet alert that forces the user to close out of the app
        await Swal.fire({
          allowOutsideClick: false,
          allowEscapeKey: false,
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          icon: "error",
          title: "An error occurred during your upload",
          html: `
          <p>Error message: ${emessage}</p>
          <p>
            Please close the SODA app and restart it again. You will be able to resume your upload
            in progress by returning to Guided Mode and clicking the "Resume Upload"
            button on your dataset's progress card.
          </p>
        `,
          showCancelButton: false,
          confirmButtonText: "Close SODA Application",
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        });
        app.showExitPrompt = false;
        app.quit();
      });
    const guidedUpdateUploadStatus = async () => {
      let mainCurationProgressResponse;
      try {
        mainCurationProgressResponse = await client.get(`/curate_datasets/curation/progress`);
      } catch (error) {
        clientError(error);
        let emessage = userErrorMessage(error);
        console.error(emessage);
        console.error(error);
        //Clear the interval to stop the generation of new sweet alerts after intitial error
        clearInterval(timerProgress);
        throw emessage;
      }

      let { data } = mainCurationProgressResponse;

      main_curate_status = data["main_curate_status"];
      const start_generate = data["start_generate"];
      const main_curate_progress_message = data["main_curate_progress_message"];
      main_total_generate_dataset_size = data["main_total_generate_dataset_size"];
      const main_generated_dataset_size = data["main_generated_dataset_size"];
      const elapsed_time_formatted = data["elapsed_time_formatted"];

      if (start_generate === 1) {
        $("#guided-progress-bar-new-curate").css("display", "block");
        //Case when the dataset upload is complete
        if (main_curate_progress_message.includes("Success: COMPLETED!")) {
          setGuidedProgressBarValue(100);
        } else {
          const percentOfDatasetUploaded =
            (main_generated_dataset_size / main_total_generate_dataset_size) * 100;
          setGuidedProgressBarValue(percentOfDatasetUploaded);

          let totalSizePrint;
          if (main_total_generate_dataset_size < displaySize) {
            totalSizePrint = main_total_generate_dataset_size.toFixed(2) + " B";
          } else if (main_total_generate_dataset_size < displaySize * displaySize) {
            totalSizePrint = (main_total_generate_dataset_size / displaySize).toFixed(2) + " KB";
          } else if (main_total_generate_dataset_size < displaySize * displaySize * displaySize) {
            totalSizePrint =
              (main_total_generate_dataset_size / displaySize / displaySize).toFixed(2) + " MB";
          } else {
            totalSizePrint =
              (main_total_generate_dataset_size / displaySize / displaySize / displaySize).toFixed(
                2
              ) + " GB";
          }
          updateDatasetUploadProgressTable({
            "Upload status": `${main_curate_progress_message}`,
            "Percent uploaded": `${percentOfDatasetUploaded.toFixed(2)}%`,
            "Elapsed time": `${elapsed_time_formatted}`,
          });
        }
      } else {
        updateDatasetUploadProgressTable({
          "Upload status": `${main_curate_progress_message}`,
          "Elapsed time": `${elapsed_time_formatted}`,
        });
      }
      //If the curate function is complete, clear the interval
      if (main_curate_status === "Done") {
        $("#sidebarCollapse").prop("disabled", false);

        // then show the sidebar again
        // forceActionSidebar("show");
        clearInterval(timerProgress);
        // electron.powerSaveBlocker.stop(prevent_sleep_id)
      }
    };
    // Progress tracking function for main curate
    var timerProgress = setInterval(guidedUpdateUploadStatus, 1000);

    // when generating a new dataset we need to add its ID to the ID -> Name mapping
    // we need to do this only once
    let loggedDatasetNameToIdMapping = false;

    // if uploading to Pennsieve set an interval that gets the amount of files that have been uploaded
    // and their aggregate size; starts for local dataset generation as well. Provides easy way to track amount of
    // files copied and their aggregate size.
    // IMP: This handles tracking a session that tracking a session that had a successful Pennsieve upload.
    //      therefore it is unnecessary to have logs for Session ID tracking in the "api_main_curate" success block
    // IMP: Two reasons this exists:
    //    1. Pennsieve Agent can freeze. This prevents us from logging. So we log a Pennsieve dataset upload session as it happens.
    //    2. Local dataset generation and Pennsieve dataset generation can fail. Having access to how many files and their aggregate size for logging at error time is valuable data.
    const checkForBucketUpload = async () => {
      // ask the server for the amount of files uploaded in the current session
      // nothing to log for uploads where a user is solely deleting files in this section

      let mainCurationDetailsResponse;
      try {
        mainCurationDetailsResponse = await client.get(`/curate_datasets/curation/upload_details`);
      } catch (error) {
        clientError(error);
        clearInterval(timerCheckForBucketUpload);
        return;
      }

      let { data } = mainCurationDetailsResponse;

      // check if the amount of successfully uploaded files has increased
      if (
        data["main_curation_uploaded_files"] > 0 &&
        data["uploaded_folder_counter"] > foldersUploaded
      ) {
        previousUploadedFileSize = uploadedFilesSize;
        uploadedFiles = data["main_curation_uploaded_files"];
        uploadedFilesSize = data["current_size_of_uploaded_files"];
        foldersUploaded = data["uploaded_folder_counter"];

        // log the increase in the file size
        increaseInFileSize = uploadedFilesSize - previousUploadedFileSize;

        // log the aggregate file count and size values when uploading to Pennsieve
        if (dataset_destination === "bf" || dataset_destination === "Pennsieve") {
          // use the session id as the label -- this will help with aggregating the number of files uploaded per session
          ipcRenderer.send(
            "track-event",
            "Success",
            "Guided Mode - Generate - Dataset - Number of Files",
            `${datasetUploadSession.id}`,
            uploadedFiles
          );

          // use the session id as the label -- this will help with aggregating the size of the given upload session
          ipcRenderer.send(
            "track-event",
            "Success",
            "Guided Mode - Generate - Dataset - Size",
            `${datasetUploadSession.id}`,
            increaseInFileSize
          );
        }
      }

      //stop the inteval when the upload is complete
      if (main_curate_status === "Done") {
        clearInterval(timerCheckForBucketUpload);
      }
    };

    let timerCheckForBucketUpload = setInterval(checkForBucketUpload, 1000);
  };

  $("#guided-add-subject-button").on("click", () => {
    $("#guided-subjects-intro").hide();
    $("#guided-add-subject-div").show();
  });

  const getCheckedContributors = () => {
    const checkedContributors = document.querySelectorAll("input[name='contributor']:checked");
    const checkedContributorsArray = Array.from(checkedContributors);
    checkedContributorData = checkedContributorsArray.map((checkedContributor) => {
      const tableRow = checkedContributor.parentElement.parentElement.parentElement;
      const contributorLastName = tableRow.children[1].innerHTML.trim();
      const contributorFirstName = tableRow.children[2].innerHTML.trim();
      return {
        contributorFirstName: contributorFirstName,
        contributorLastName: contributorLastName,
      };
    });
    return checkedContributorData;
  };

  $("#guided-button-edit-protocol-fields").on("click", () => {
    enableElementById("protocols-container");
    enableElementById("guided-button-add-protocol");
    //switch button from edit to save
    document.getElementById("guided-button-edit-protocol-fields").style.display = "none";
    document.getElementById("guided-button-save-protocol-fields").style.display = "flex";
    unPulseNextButton();
  });
  $("#guided-button-save-other-link-fields").on("click", () => {
    let allInputsValid = true;
    //get all contributor fields
    const otherLinkFields = document.querySelectorAll(".guided-other-links-field-container");
    //check if contributorFields is empty
    if (otherLinkFields.length === 0) {
      notyf.error("Please add at least one other link");
      //Add a contributor field to help the user out a lil
      //addContributorField();
      return;
    }

    //loop through contributor fields and get values
    const otherLinkFieldsArray = Array.from(otherLinkFields);
    ///////////////////////////////////////////////////////////////////////////////
    otherLinkFieldsArray.forEach((otherLinkField) => {
      const linkUrl = otherLinkField.querySelector(".guided-other-link-url-input");
      const linkDescription = otherLinkField.querySelector(".guided-other-link-description-input");
      const linkRelation = otherLinkField.querySelector(".guided-other-link-relation-dropdown");

      const textInputs = [linkUrl, linkDescription];

      //check if all text inputs are valid
      textInputs.forEach((textInput) => {
        if (textInput.value === "") {
          textInput.style.setProperty("border-color", "red", "important");
          allInputsValid = false;
        } else {
          textInput.style.setProperty("border-color", "hsl(0, 0%, 88%)", "important");
        }
      });
      if (linkRelation.value === "Select") {
        linkRelation.style.setProperty("border-color", "red", "important");
        allInputsValid = false;
      } else {
        linkRelation.style.setProperty("border-color", "hsl(0, 0%, 88%)", "important");
      }
      const contributorInputObj = {
        linkUrl: linkUrl.value,
        linkDescription: linkDescription.value,
        linkRelation: linkRelation.value,
      };
    });
    ///////////////////////////////////////////////////////////////////////////////
    if (!allInputsValid) {
      notyf.error("Please fill out all link fields");
      return;
    }

    //set opacity and remove pointer events for table and show edit button
    disableElementById("other-links-container");
    disableElementById("guided-button-add-other-link");

    //switch button from save to edit
    document.getElementById("guided-button-save-other-link-fields").style.display = "none";
    document.getElementById("guided-button-edit-other-link-fields").style.display = "flex";
    pulseNextButton();
  });
  $("#guided-button-add-additional-link").on("click", async () => {
    openAddAdditionLinkSwal();
  });
  $("#guided-button-edit-other-link-fields").on("click", () => {
    enableElementById("other-links-container");
    enableElementById("guided-button-add-other-link");
    //switch button from edit to save
    document.getElementById("guided-button-edit-other-link-fields").style.display = "none";
    document.getElementById("guided-button-save-other-link-fields").style.display = "flex";
    unPulseNextButton();
  });

  function guidedGenerateRCFilesHelper(type) {
    var textValue = $(`#guided-textarea-create-${type}`).val().trim();
    if (textValue === "") {
      Swal.fire({
        title: "Incomplete information",
        text: "Plase fill in the textarea.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
        showCancelButton: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
      return "empty";
    }
  }
  async function guidedSaveRCFile(type) {
    var result = guidedGenerateRCFilesHelper(type);
    if (result === "empty") {
      return;
    }
    var { value: continueProgress } = await Swal.fire({
      title: `Any existing ${type.toUpperCase()}.txt file in the specified location will be replaced.`,
      text: "Are you sure you want to continue?",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
    });
    if (!continueProgress) {
      return;
    }
    let data = $(`#guided-textarea-create-${type}`).val().trim();
    let destinationPath;
    if (type === "changes") {
      destinationPath = path.join($("#guided-dataset-path").text().trim(), "CHANGES.xlsx");
    } else {
      destinationPath = path.join($("#guided-dataset-path").text().trim(), "README.xlsx");
    }
    fs.writeFile(destinationPath, data, (err) => {
      if (err) {
        console.log(err);

        var emessage = userError(error);
        Swal.fire({
          title: `Failed to generate the existing ${type}.txt file`,
          html: emessage,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          icon: "error",
          didOpen: () => {
            Swal.hideLoading();
          },
        });
      } else {
        if (type === "changes") {
          var newName = path.join(path.dirname(destinationPath), "CHANGES.txt");
        } else {
          var newName = path.join(path.dirname(destinationPath), "README.txt");
        }
        fs.rename(destinationPath, newName, async (err) => {
          if (err) {
            console.log(err);

            Swal.fire({
              title: `Failed to generate the ${type}.txt file`,
              html: err,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              icon: "error",
              didOpen: () => {
                Swal.hideLoading();
              },
            });
          } else {
            Swal.fire({
              title: `The ${type.toUpperCase()}.txt file has been successfully generated at the specified location.`,
              icon: "success",
              showConfirmButton: true,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              didOpen: () => {
                Swal.hideLoading();
              },
            });
          }
        });
      }
    });
  }
  $("#guided-generate-subjects-file").on("click", () => {
    addSubject("guided");
    clearAllSubjectFormFields(guidedSubjectsFormDiv);
  });
  $("#guided-generate-samples-file").on("click", () => {
    addSample("guided");
    returnToSampleMetadataTableFromSampleMetadataForm();
  });
  $("#guided-generate-submission-file").on("click", () => {
    guidedSaveSubmissionFile();
  });
  $("#guided-generate-readme-file").on("click", () => {
    guidedSaveRCFile("readme");
  });
  $("#guided-generate-changes-file").on("click", () => {
    guidedSaveRCFile("changes");
  });

  $("#guided-generate-dataset-button").on("click", async function () {
    console.error('Removed Pennseive agent download...')
    openPage("guided-dataset-generation-tab");
    guidedPennsieveDatasetUpload();
  });

  const guidedSaveBannerImage = async () => {
    $("#guided-para-dataset-banner-image-status").html("Please wait...");
    //Save cropped image locally and check size
    let imageFolder = path.join(homeDirectory, "SODA", "guided-banner-images");
    let imageType = "";

    if (!fs.existsSync(imageFolder)) {
      fs.mkdirSync(imageFolder, { recursive: true });
    }

    if (imageExtension == "png") {
      imageType = "image/png";
    } else {
      imageType = "image/jpeg";
    }
    let datasetName = globals.sodaJSONObj["digital-metadata"]["name"];
    let imagePath = path.join(imageFolder, `${datasetName}.` + imageExtension);
    let croppedImageDataURI = myCropper.getCroppedCanvas().toDataURL(imageType);

    imageDataURI.outputFile(croppedImageDataURI, imagePath).then(async () => {
      let image_file_size = fs.statSync(imagePath)["size"];
      if (image_file_size < 5 * 1024 * 1024) {
        $("#guided-para-dataset-banner-image-status").html("");
        setGuidedBannerImage(imagePath);
        $("#guided-banner-image-modal").modal("hide");
        $("#guided-button-add-banner-image").text("Edit banner image");
      } else {
        //image needs to be scaled
        $("#guided-para-dataset-banner-image-status").html("");
        let scaledImagePath = await scaleBannerImage(imagePath);
        setGuidedBannerImage(scaledImagePath);
        $("#guided-banner-image-modal").modal("hide");
        $("#guided-button-add-banner-image").text("Edit banner image");
      }
    });
  };
  /**************************************/
  $("#guided-save-banner-image").click(async (event) => {
    $("#guided-para-dataset-banner-image-status").html("");
    if (guidedBfViewImportedImage.src.length > 0) {
      if (guidedFormBannerHeight.value > 511) {
        Swal.fire({
          icon: "warning",
          text: `As per NIH guidelines, banner image must not display animals or graphic/bloody tissues. Do you confirm that?`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          reverseButtons: reverseSwalButtons,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        }).then(async (result) => {
          if (guidedFormBannerHeight.value < 1024) {
            Swal.fire({
              icon: "warning",
              text: `Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is ${guidedFormBannerHeight.value} px. Would you like to continue?`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              focusCancel: true,
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then(async (result) => {
              if (result.isConfirmed) {
                guidedSaveBannerImage();
              }
            });
          } else if (guidedFormBannerHeight.value > 2048) {
            Swal.fire({
              icon: "warning",
              text: `Your cropped image is ${formBannerHeight.value} px and is bigger than the 2048px standard. Would you like to scale this image down to fit the entire cropped image?`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showCancelButton: true,
              focusCancel: true,
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then(async (result) => {
              if (result.isConfirmed) {
                guidedSaveBannerImage();
              }
            });
          } else {
            guidedSaveBannerImage();
          }
        });
      } else {
        $("#guided-para-dataset-banner-image-status").html(
          "<span style='color: red;'> " +
            "Dimensions of cropped area must be at least 512 px" +
            "</span>"
        );
      }
    } else {
      $("#guided-para-dataset-banner-image-status").html(
        "<span style='color: red;'> " + "Please import an image first" + "</span>"
      );
    }
  });

  //next button click handler
  $("#guided-next-button").on("click", async function () {
    //Get the ID of the current page to handle actions on page leave (next button pressed)
    const pageBeingLeftID = CURRENT_PAGE.attr("id");
    //remove blue pulse
    $(this).removeClass("pulse-blue");
    //add a bootstrap loader to the next button
    $(this).addClass("loading");
    let errorArray = [];

    try {
      await savePageChanges(pageBeingLeftID);

      //Mark page as completed in JSONObj so we know what pages to load when loading local saves
      //(if it hasn't already been marked complete)
      if (!globals.sodaJSONObj["completed-tabs"].includes(pageBeingLeftID)) {
        globals.sodaJSONObj["completed-tabs"].push(pageBeingLeftID);
      }

      //Save progress onto local storage with the dataset name as the key
      saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);

      const getNextPageNotSkipped = (startingPage) => {
        //Check if param element's following element is undefined
        //(usually the case when the element is the last element in it's container)
        if (startingPage.next().attr("id") != undefined) {
          //if not, check if it has the data-attribute skip-page
          //if so, recurse back until a page without the skip-page attribute is found
          let nextPage = startingPage.next();
          if (nextPage.attr("data-skip-page") && nextPage.attr("data-skip-page") == "true") {
            return getNextPageNotSkipped(nextPage);
          } else {
            //element is valid and not to be skipped
            return nextPage;
          }
        } else {
          //previous element was the last element in the container.
          //go to the next page-set and return the first page to be transitioned to.
          nextPage = startingPage.parent().next().children(".guided--page").first();
          if (nextPage.attr("data-skip-page") && nextPage.attr("data-skip-page") == "true") {
            return getNextPageNotSkipped(nextPage);
          } else {
            //element is valid and not to be skipped
            return nextPage;
          }
        }
      };

      //NAVIGATE TO NEXT PAGE + CHANGE ACTIVE TAB/SET ACTIVE PROGRESSION TAB
      //if more tabs in parent tab, go to next tab and update capsule
      let targetPage = getNextPageNotSkipped(CURRENT_PAGE);
      let targetPageID = targetPage.attr("id");

      openPage(targetPageID);
    } catch (error) {

      error.map((error) => {
        // get the total number of words in error.message
        if (error.type === "notyf") {
          notyf.open({
            duration: "5500",
            type: "error",
            message: error.message,
          });
        }
      });
    }
    $(this).removeClass("loading");
  });

  //back button click handler
  $("#guided-back-button").on("click", () => {
    const pageBeingLeftID = CURRENT_PAGE.attr("id");

    if (pageBeingLeftID === "guided-prepare-helpers-tab") {
      //Hide dataset name and subtitle parent tab
      document.getElementById("guided-mode-starting-container").classList.remove("hidden");

      switchElementVisibility("guided-intro-page", "guided-new-dataset-info");

      //show the intro footer
      document.getElementById("guided-footer-intro").classList.remove("hidden");

      //Show the dataset structure page
      $("#prepare-dataset-parent-tab").hide();
      $("#guided-header-div").hide();
      $("#guided-footer-div").hide();

      //Set the dataset name and subtitle with the values from jsonObj
      const datasetName = getGuidedDatasetName();
      const datasetSubtitle = getGuidedDatasetSubtitle();
      const datasetNameInputElement = document.getElementById("guided-dataset-name-input");
      const datasetSubtitleInputElement = document.getElementById("guided-dataset-subtitle-input");
      const datasetSubtitleCharacterCountText = document.getElementById(
        "guided-subtitle-char-count"
      );
      datasetNameInputElement.value = datasetName;
      datasetSubtitleInputElement.value = datasetSubtitle;
      datasetSubtitleCharacterCountText.innerHTML = `${
        255 - datasetSubtitle.length
      } characters remaining`;

      CURRENT_PAGE = null;

      return;
    }

    const getPrevPageNotSkipped = (startingPage) => {
      //Check if param element's following element is undefined
      //(usually the case when the element is the last element in it's container)
      if (!startingPage.prev().hasClass("guided--capsule-container")) {
        //if not, check if it has the data-attribute skip-page
        //if so, recurse back until a page without the skip-page attribute is found
        let prevPage = startingPage.prev();
        if (prevPage.attr("data-skip-page") && prevPage.attr("data-skip-page") == "true") {
          return getPrevPageNotSkipped(prevPage);
        } else {
          //element is valid and not to be skipped
          return prevPage;
        }
      } else {
        //previous element was the last element in the container.
        //go to the next page-set and return the first page to be transitioned to.
        prevPage = startingPage.parent().prev().children(".guided--page").last();
        if (prevPage.attr("data-skip-page") && prevPage.attr("data-skip-page") == "true") {
          return getPrevPageNotSkipped(prevPage);
        } else {
          //element is valid and not to be skipped
          return prevPage;
        }
      }
    };
    let targetPage = getPrevPageNotSkipped(CURRENT_PAGE);
    let targetPageID = targetPage.attr("id");
    openPage(targetPageID);
  });

  //sub page next button click handler
  $("#guided-button-sub-page-continue").on("click", async () => {
    //Get the id of the parent page that's currently open
    const currentParentPageID = CURRENT_PAGE.attr("id");
    //Get the id of the sub-page that's currently open
    const openSubPageID = getOpenSubPageInPage(currentParentPageID);

    switch (currentParentPageID) {
      case "guided-subjects-folder-tab": {
        switch (openSubPageID) {
          case "guided-specify-subjects-page": {
            const buttonYesSubjects = document.getElementById("guided-button-add-subjects-table");
            const buttonNoSubjects = document.getElementById("guided-button-no-subjects");
            if (
              !buttonYesSubjects.classList.contains("selected") &&
              !buttonNoSubjects.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if your dataset contains subjects.",
              });
              return;
            }
            if (buttonYesSubjects.classList.contains("selected")) {
              //Get the count of all subjects in and outside of pools
              const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
              const subjectsCount = [...subjectsInPools, ...subjectsOutsidePools].length;

              //Check to see if any subjects were added, and if not, disallow the user
              //from progressing until they add at least one subject or select that they do not
              if (subjectsCount === 0) {
                notyf.open({
                  duration: "5000",
                  type: "error",
                  message:
                    "Please add at least one subject or indicate that your dataset does not contain subjects.",
                });
                return;
              }

              $(".guided-subject-sample-data-addition-page").attr("data-skip-page", "false");
              setActiveSubPage("guided-organize-subjects-into-pools-page");
            }
            if (buttonNoSubjects.classList.contains("selected")) {
              $(".guided-subject-sample-data-addition-page").attr("data-skip-page", "true");
              //If there's no subjects (and samples), delete the primary, source, and derivative folders
              for (const folder of ["primary", "source", "derivative"]) {
                if (datasetStructureJSONObj["folders"][folder]) {
                  delete datasetStructureJSONObj["folders"][folder];
                }
              }
              hideSubNavAndShowMainNav("next");
            }

            break;
          }

          case "guided-organize-subjects-into-pools-page": {
            const buttonYesPools = document.getElementById(
              "guided-button-organize-subjects-into-pools"
            );
            const buttonNoPools = document.getElementById("guided-button-no-pools");
            if (
              !buttonYesPools.classList.contains("selected") &&
              !buttonNoPools.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you would like to organize your subjects into pools.",
              });
              return;
            }

            if (buttonYesPools.classList.contains("selected")) {
              const pools =
                globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"];

              //Check to see if any pools were added, and if not, disallow the user
              //from progressing until they add at least one pool or select that they do not
              //have any pools
              if (Object.keys(pools).length === 0) {
                notyf.open({
                  duration: "5000",
                  type: "error",
                  message:
                    "Please add at least one pool or indicate that your dataset does not contain pools.",
                });
                return;
              }
              //delete empty pools
              for (const pool of Object.keys(pools)) {
                if (
                  Object.keys(
                    globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"][pool]
                  ).length === 0
                ) {
                  delete globals.sodaJSONObj["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
                    pool
                  ];
                }
              }
            }

            setActiveSubPage("guided-specify-samples-page");
            break;
          }

          case "guided-specify-samples-page": {
            const buttonYesSamples = document.getElementById("guided-button-add-samples-tables");
            const buttonNoSamples = document.getElementById("guided-button-no-samples");
            if (
              !buttonYesSamples.classList.contains("selected") &&
              !buttonNoSamples.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if your dataset's subjects have samples.",
              });
              return;
            }
            if (buttonYesSamples.classList.contains("selected")) {
              const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
              //Combine sample data from samples in and out of pools
              const samplesCount = [...samplesInPools, ...samplesOutsidePools].length;
              //Check to see if any samples were added, and if not, disallow the user
              //from progressing until they add at least one sample or select that they do not
              //have any samples
              if (samplesCount === 0) {
                notyf.open({
                  duration: "5000",
                  type: "error",
                  message:
                    "Please add at least one sample or indicate that your dataset does not contain samples.",
                });
                return;
              }

              document
                .getElementById("guided-primary-samples-organization-page")
                .setAttribute("data-skip-sub-page", "false");
              document
                .getElementById("guided-source-samples-organization-page")
                .setAttribute("data-skip-sub-page", "false");
              document
                .getElementById("guided-derivative-samples-organization-page")
                .setAttribute("data-skip-sub-page", "false");
              hideSubNavAndShowMainNav("next");
            }

            if (buttonNoSamples.classList.contains("selected")) {
              //add skip-sub-page attribute to element
              document
                .getElementById("guided-primary-samples-organization-page")
                .setAttribute("data-skip-sub-page", "true");
              document
                .getElementById("guided-source-samples-organization-page")
                .setAttribute("data-skip-sub-page", "true");
              document
                .getElementById("guided-derivative-samples-organization-page")
                .setAttribute("data-skip-sub-page", "true");

              hideSubNavAndShowMainNav("next");
            }

            break;
          }
        }
        break;
      }

      case "guided-primary-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-primary-samples-organization-page": {
            const buttonYesPrimarySampleData = document.getElementById(
              "guided-button-add-sample-primary-data"
            );
            const buttonNoPrimarySampleData = document.getElementById(
              "guided-button-no-sample-primary-data"
            );
            if (
              !buttonYesPrimarySampleData.classList.contains("selected") &&
              !buttonNoPrimarySampleData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you have primary data to add to your samples.",
              });
              return;
            }
            if (buttonYesPrimarySampleData.classList.contains("selected")) {
              const continueWithoutAddingPrimaryDataToAllSamples =
                await cleanUpEmptyGuidedStructureFolders("primary", "samples", false);
              if (continueWithoutAddingPrimaryDataToAllSamples) {
                setActiveSubPage("guided-primary-subjects-organization-page");
              }
            }
            if (buttonNoPrimarySampleData.classList.contains("selected")) {
              const continueAfterDeletingAllPrimarySampleFolders =
                await cleanUpEmptyGuidedStructureFolders("primary", "samples", true);
              if (continueAfterDeletingAllPrimarySampleFolders) {
                setActiveSubPage("guided-primary-subjects-organization-page");
              }
            }
            break;
          }

          case "guided-primary-subjects-organization-page": {
            const buttonYesPrimarySubjectData = document.getElementById(
              "guided-button-add-subject-primary-data"
            );
            const buttonNoPrimarySubjectData = document.getElementById(
              "guided-button-no-subject-primary-data"
            );
            if (
              !buttonYesPrimarySubjectData.classList.contains("selected") &&
              !buttonNoPrimarySubjectData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you have primary data to add to your subjects.",
              });
              return;
            }
            if (buttonYesPrimarySubjectData.classList.contains("selected")) {
              const continueWithoutAddingPrimaryDataToAllSubjects =
                await cleanUpEmptyGuidedStructureFolders("primary", "subjects", false);
              if (continueWithoutAddingPrimaryDataToAllSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            if (buttonNoPrimarySubjectData.classList.contains("selected")) {
              const continueAfterDeletingAllPrimaryPoolsAndSubjects =
                await cleanUpEmptyGuidedStructureFolders("primary", "subjects", true);
              if (continueAfterDeletingAllPrimaryPoolsAndSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }

            break;
          }
        }
        break;
      }

      case "guided-source-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-source-samples-organization-page": {
            const buttonYesSourceSampleData = document.getElementById(
              "guided-button-add-sample-source-data"
            );
            const buttonNoSourceSampleData = document.getElementById(
              "guided-button-no-sample-source-data"
            );
            if (
              !buttonYesSourceSampleData.classList.contains("selected") &&
              !buttonNoSourceSampleData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you have source data to add to your samples.",
              });
              return;
            }
            if (buttonYesSourceSampleData.classList.contains("selected")) {
              const continueWithoutAddingSourceDataToAllSamples =
                await cleanUpEmptyGuidedStructureFolders("source", "samples", false);
              if (continueWithoutAddingSourceDataToAllSamples) {
                setActiveSubPage("guided-source-subjects-organization-page");
              }
            }
            if (buttonNoSourceSampleData.classList.contains("selected")) {
              const continueAfterDeletingAllSourceSampleFolders =
                await cleanUpEmptyGuidedStructureFolders("source", "samples", true);
              if (continueAfterDeletingAllSourceSampleFolders) {
                setActiveSubPage("guided-source-subjects-organization-page");
              }
            }
            break;
          }

          case "guided-source-subjects-organization-page": {
            const buttonYesSourceSubjectData = document.getElementById(
              "guided-button-add-subject-source-data"
            );
            const buttonNoSourceSubjectData = document.getElementById(
              "guided-button-no-subject-source-data"
            );
            if (
              !buttonYesSourceSubjectData.classList.contains("selected") &&
              !buttonNoSourceSubjectData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you have source data to add to your subjects.",
              });
              return;
            }
            if (buttonYesSourceSubjectData.classList.contains("selected")) {
              const continueWithoutAddingSourceDataToAllSubjects =
                await cleanUpEmptyGuidedStructureFolders("source", "subjects", false);
              if (continueWithoutAddingSourceDataToAllSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            if (buttonNoSourceSubjectData.classList.contains("selected")) {
              const continueAfterDeletingAllSourcePoolsAndSubjects =
                await cleanUpEmptyGuidedStructureFolders("source", "subjects", true);
              if (continueAfterDeletingAllSourcePoolsAndSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            break;
          }
        }
        break;
      }

      case "guided-derivative-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-derivative-samples-organization-page": {
            const buttonYesDerivativeSampleData = document.getElementById(
              "guided-button-add-sample-derivative-data"
            );
            const buttonNoDerivativeSampleData = document.getElementById(
              "guided-button-no-sample-derivative-data"
            );
            if (
              !buttonYesDerivativeSampleData.classList.contains("selected") &&
              !buttonNoDerivativeSampleData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you have derivative data to add to your samples.",
              });
              return;
            }
            if (buttonYesDerivativeSampleData.classList.contains("selected")) {
              const continueWithoutAddingDerivativeDataToAllSamples =
                await cleanUpEmptyGuidedStructureFolders("derivative", "samples", false);
              if (continueWithoutAddingDerivativeDataToAllSamples) {
                setActiveSubPage("guided-derivative-subjects-organization-page");
              }
            }
            if (buttonNoDerivativeSampleData.classList.contains("selected")) {
              const continueAfterDeletingAllDerivativeSampleFolders =
                await cleanUpEmptyGuidedStructureFolders("derivative", "samples", true);
              if (continueAfterDeletingAllDerivativeSampleFolders) {
                setActiveSubPage("guided-derivative-subjects-organization-page");
              }
            }
            break;
          }

          case "guided-derivative-subjects-organization-page": {
            const buttonYesDerivativeSubjectData = document.getElementById(
              "guided-button-add-subject-derivative-data"
            );
            const buttonNoDerivativeSubjectData = document.getElementById(
              "guided-button-no-subject-derivative-data"
            );
            if (
              !buttonYesDerivativeSubjectData.classList.contains("selected") &&
              !buttonNoDerivativeSubjectData.classList.contains("selected")
            ) {
              notyf.open({
                duration: "5000",
                type: "error",
                message: "Please indicate if you have derivative data to add to your subjects.",
              });
              return;
            }
            if (buttonYesDerivativeSubjectData.classList.contains("selected")) {
              const continueWithoutAddingDerivativeDataToAllSubjects =
                await cleanUpEmptyGuidedStructureFolders("derivative", "subjects", false);
              if (continueWithoutAddingDerivativeDataToAllSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            if (buttonNoDerivativeSubjectData.classList.contains("selected")) {
              const continueAfterDeletingAllDerivativePoolsAndSubjects =
                await cleanUpEmptyGuidedStructureFolders("derivative", "subjects", true);
              if (continueAfterDeletingAllDerivativePoolsAndSubjects) {
                hideSubNavAndShowMainNav("next");
              }
            }
            break;
          }
        }
        break;
      }

      case "guided-create-submission-metadata-tab": {
        const buttonYesImportDataDerivatives = document.getElementById(
          "guided-button-import-data-deliverables"
        );
        const buttonNoEnterSubmissionDataManually = document.getElementById(
          "guided-button-enter-submission-metadata-manually"
        );
        if (
          !buttonYesImportDataDerivatives.classList.contains("selected") &&
          !buttonNoEnterSubmissionDataManually.classList.contains("selected")
        ) {
          notyf.open({
            duration: "5000",
            type: "error",
            message: "Please indicate if you would like to import milestone data.",
          });
          break;
        }

        if (buttonYesImportDataDerivatives.classList.contains("selected")) {
          switch (openSubPageID) {
            case "guided-data-derivative-import-page": {
              if (buttonYesImportDataDerivatives.classList.contains("selected")) {
                const checkedMilestoneData = getCheckedMilestones();
                //if user does not select any milestones, show error message
                if (checkedMilestoneData.length === 0) {
                  notyf.error("Please select at least one milestone");
                  return;
                }

                globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["temp-selected-milestones"] =
                  checkedMilestoneData;
                setActiveSubPage("guided-completion-date-selection-page");
              }
              if (buttonNoEnterSubmissionDataManually.classList.contains("selected")) {
                //skip to submission metadata page where user can enter milestones
                //and completion date manually
                setActiveSubPage("guided-submission-metadata-page");
              }
              break;
            }
            case "guided-completion-date-selection-page": {
              const selectedCompletionDate = document.querySelector(
                "input[name='completion-date']:checked"
              );
              if (!selectedCompletionDate) {
                notyf.error("Please select a completion date");
                return;
              }

              const completionDate = selectedCompletionDate.value;
              globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] =
                completionDate;
              setActiveSubPage("guided-submission-metadata-page");
              break;
            }
            case "guided-submission-metadata-page": {
              const award = $("#guided-submission-sparc-award").val();
              const date = $("#guided-submission-completion-date").val();
              const milestones = getTagsFromTagifyElement(guidedSubmissionTagsTagify);
              //validate submission metadata
              if (award === "") {
                notyf.error("Please add a SPARC award number to your submission metadata");
                return;
              }
              if (date === "Enter my own date") {
                notyf.error("Please add a completion date to your submission metadata");
                return;
              }
              if (milestones.length === 0) {
                notyf.error("Please add at least one milestone to your submission metadata");
                return;
              }
              // save the award string to JSONObj to be shared with other award inputs
              globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = award;
              //Save the data and milestones to the globals.sodaJSONObj
              globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = milestones;
              globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] = date;
              globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["submission-data-entry"] =
                "import";

              hideSubNavAndShowMainNav("next");
              break;
            }
          }
        }
        if (buttonNoEnterSubmissionDataManually.classList.contains("selected")) {
          const award = $("#guided-submission-sparc-award-manual").val();
          const date = $("#guided-submission-completion-date-manual").val();
          const milestones = getTagsFromTagifyElement(guidedSubmissionTagsTagifyManual);
          //validate manually entered submission metadata
          if (award === "") {
            notyf.error("Please add a SPARC award number to your submission metadata");
            return;
          }
          if (date === "Enter my own date") {
            notyf.error("Please add a completion date to your submission metadata");
            return;
          }
          if (milestones.length === 0) {
            notyf.error("Please add at least one milestone to your submission metadata");
            return;
          }
          // save the award string to JSONObj to be shared with other award inputs
          globals.sodaJSONObj["dataset-metadata"]["shared-metadata"]["sparc-award"] = award;
          //Save the data and milestones to the globals.sodaJSONObj
          globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["milestones"] = milestones;
          globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["completion-date"] = date;
          globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["submission-data-entry"] =
            "manual";

          hideSubNavAndShowMainNav("next");
        }
        break;
        break;
      }
    }
    //Save progress onto local storage with the dataset name as the key
    saveGuidedProgress(globals.sodaJSONObj["digital-metadata"]["name"]);
  });

  //sub page back button click handler
  $("#guided-button-sub-page-back").on("click", () => {
    //Get the id of the parent page that's currently open
    currentParentPageID = CURRENT_PAGE.attr("id");
    //Get the id of the sub-page that's currently open
    const openSubPageID = getOpenSubPageInPage(currentParentPageID);

    switch (currentParentPageID) {
      case "guided-subjects-folder-tab": {
        switch (openSubPageID) {
          case "guided-specify-subjects-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-organize-subjects-into-pools-page": {
            setActiveSubPage("guided-specify-subjects-page");
            break;
          }

          case "guided-specify-samples-page": {
            setActiveSubPage("guided-organize-subjects-into-pools-page");
            break;
          }
        }
        break;
      }

      case "guided-primary-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-primary-samples-organization-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-primary-subjects-organization-page": {
            if (
              document.getElementById("guided-primary-samples-organization-page").dataset
                .skipSubPage === "true"
            ) {
              hideSubNavAndShowMainNav("back");
              break;
            }
            setActiveSubPage("guided-primary-samples-organization-page");
            break;
          }
        }
        break;
      }

      case "guided-source-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-source-samples-organization-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-source-subjects-organization-page": {
            setActiveSubPage("guided-source-samples-organization-page");
            break;
          }
        }
        break;
      }

      case "guided-derivative-data-organization-tab": {
        switch (openSubPageID) {
          case "guided-derivative-samples-organization-page": {
            hideSubNavAndShowMainNav("back");
            break;
          }

          case "guided-derivative-subjects-organization-page": {
            setActiveSubPage("guided-derivative-samples-organization-page");
            break;
          }
        }
        break;
      }

      case "guided-create-submission-metadata-tab": {
        const buttonYesImportDataDerivatives = document.getElementById(
          "guided-button-import-data-deliverables"
        );
        const buttonNoEnterSubmissionDataManually = document.getElementById(
          "guided-button-enter-submission-metadata-manually"
        );
        if (
          !buttonYesImportDataDerivatives.classList.contains("selected") &&
          !buttonNoEnterSubmissionDataManually.classList.contains("selected")
        ) {
          hideSubNavAndShowMainNav("back");
          break;
        }
        if (buttonYesImportDataDerivatives.classList.contains("selected")) {
          switch (openSubPageID) {
            case "guided-data-derivative-import-page": {
              hideSubNavAndShowMainNav("back");
              break;
            }
            case "guided-completion-date-selection-page": {
              setActiveSubPage("guided-data-derivative-import-page");
              break;
            }
            case "guided-submission-metadata-page": {
              if (
                document
                  .getElementById("guided-button-import-data-deliverables")
                  .classList.contains("selected")
              ) {
                setActiveSubPage("guided-completion-date-selection-page");
              }

              if (
                document
                  .getElementById("guided-button-enter-submission-metadata-manually")
                  .classList.contains("selected")
              ) {
                setActiveSubPage("guided-data-derivative-import-page");
              }
              break;
            }
          }
        }
        if (buttonNoEnterSubmissionDataManually.classList.contains("selected")) {
          hideSubNavAndShowMainNav("back");
        }
        break;
      }
    }
  });

  //tagify initializations
  const guidedOtherFundingSourcesInput = document.getElementById("guided-ds-other-funding");
  guidedOtherFundingsourcesTagify = new Tagify(guidedOtherFundingSourcesInput, {
    duplicates: false,
  });
  createDragSort(guidedOtherFundingsourcesTagify);
  const guidedStudyOrganSystemsInput = document.getElementById("guided-ds-study-organ-system");
  guidedStudyOrganSystemsTagify = new Tagify(guidedStudyOrganSystemsInput, {
    whitelist: [
      "autonomic ganglion",
      "brain",
      "colon",
      "heart",
      "intestine",
      "kidney",
      "large intestine",
      "liver",
      "lower urinary tract",
      "lung",
      "nervous system",
      "pancreas",
      "peripheral nervous system",
      "small intestine",
      "spinal cord",
      "spleen",
      "stomach",
      "sympathetic nervous system",
      "urinary bladder",
    ],
    duplicates: false,
    dropdown: {
      enabled: 0,
      closeOnSelect: true,
    },
  });
  createDragSort(guidedStudyOrganSystemsTagify);

  const guidedDatasetKeyWordsInput = document.getElementById("guided-ds-dataset-keywords");
  guidedDatasetKeywordsTagify = new Tagify(guidedDatasetKeyWordsInput, {
    duplicates: false,
  });
  createDragSort(guidedDatasetKeywordsTagify);

  const guidedStudyApproachInput = document.getElementById("guided-ds-study-approach");
  guidedStudyApproachTagify = new Tagify(guidedStudyApproachInput, {
    duplicates: false,
  });
  createDragSort(guidedStudyApproachTagify);

  const guidedStudyTechniquesInput = document.getElementById("guided-ds-study-technique");
  guidedStudyTechniquesTagify = new Tagify(guidedStudyTechniquesInput, {
    duplicates: false,
  });
  createDragSort(guidedStudyTechniquesTagify);

  /// back button Curate
  $("#guided-button-back").on("click", function () {
    var slashCount = globals.organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount !== 1) {
      var filtered = getGlobalPath(globals.organizeDSglobalPath);
      if (filtered.length === 1) {
        globals.organizeDSglobalPath.value = filtered[0] + "/";
      } else {
        globals.organizeDSglobalPath.value = filtered.slice(0, filtered.length - 1).join("/") + "/";
      }
      var myPath = datasetStructureJSONObj;
      for (var item of filtered.slice(1, filtered.length - 1)) {
        myPath = myPath["folders"][item];
      }
      // construct UI with files and folders
      $("#items").empty();
      already_created_elem = [];
      let items = loadFileFolder(myPath); //array -
      let total_item_count = items[1].length + items[0].length;
      //we have some items to display
      listItems(myPath, "#items", 500, (reset = true));
      organizeLandingUIEffect();
      // reconstruct div with new elements
      getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
    }
  });
  $("#guided-new-folder").on("click", () => {
    event.preventDefault();
    var slashCount = globals.organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount !== 1) {
      var newFolderName = "New Folder";
      Swal.fire({
        title: "Add new folder...",
        text: "Enter a name below:",
        heightAuto: false,
        input: "text",
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: "Cancel",
        confirmButtonText: "Add folder",
        reverseButtons: reverseSwalButtons,
        showClass: {
          popup: "animate__animated animate__fadeInDown animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
        didOpen: () => {
          $(".swal2-input").attr("id", "add-new-folder-input");
          $(".swal2-confirm").attr("id", "add-new-folder-button");
          $("#add-new-folder-input").keyup(function () {
            var val = $("#add-new-folder-input").val();
            for (var char of nonAllowedCharacters) {
              if (val.includes(char)) {
                Swal.showValidationMessage(
                  `The folder name cannot contains the following characters ${nonAllowedCharacters}, please enter a different name!`
                );
                $("#add-new-folder-button").attr("disabled", true);
                return;
              }
              $("#add-new-folder-button").attr("disabled", false);
            }
          });
        },
        didDestroy: () => {
          $(".swal2-confirm").attr("id", "");
          $(".swal2-input").attr("id", "");
        },
      }).then((result) => {
        if (result.value) {
          if (result.value !== null && result.value !== "") {
            newFolderName = result.value.trim();
            // check for duplicate or files with the same name
            var duplicate = false;
            var itemDivElements = document.getElementById("items").children;
            for (var i = 0; i < itemDivElements.length; i++) {
              if (newFolderName === itemDivElements[i].innerText) {
                duplicate = true;
                break;
              }
            }
            if (duplicate) {
              Swal.fire({
                icon: "error",
                text: "Duplicate folder name: " + newFolderName,
                confirmButtonText: "OK",
                heightAuto: false,
                backdrop: "rgba(0,0,0, 0.4)",
              });

              logCurationForAnalytics(
                "Error",
                PrepareDatasetsAnalyticsPrefix.CURATE,
                AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                ["Step 3", "Add", "Folder"],
                determineDatasetLocation()
              );
            } else {
              // var appendString = "";
              // appendString =
              //   appendString +
              //   '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">' +
              //   newFolderName +
              //   "</div></div>";
              // $(appendString).appendTo("#items");

              /// update datasetStructureJSONObj
              var currentPath = globals.organizeDSglobalPath.value;
              var jsonPathArray = currentPath.split("/");
              var filtered = jsonPathArray.slice(1).filter(function (el) {
                return el != "";
              });

              var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
              // update Json object with new folder created
              var renamedNewFolder = newFolderName;
              myPath["folders"][renamedNewFolder] = {
                folders: {},
                files: {},
                type: "virtual",
                action: ["new"],
              };

              listItems(myPath, "#items", 500, (reset = true));
              getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);

              // log that the folder was successfully added
              logCurationForAnalytics(
                "Success",
                PrepareDatasetsAnalyticsPrefix.CURATE,
                AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                ["Step 3", "Add", "Folder"],
                determineDatasetLocation()
              );

              hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile);
              hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile);
            }
          }
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        text: "New folders cannot be added at this level. If you want to add high-level SPARC folder(s), please go back to the previous step to do so.",
        confirmButtonText: "OK",
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    }
  });
  $("#guided-imoprt-file").on("click", () => {
    ipcRenderer.send("open-files-organize-datasets-dialog");
  });
  $("#guided-import-folder").on("click", () => {
    ipcRenderer.send("open-folders-organize-datasets-dialog");
  });
});

const currentAccount = (account, userDetails) => {
  return `
<div style="
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: 15px;
  height: auto;
  box-shadow: 0px 0px 10px #d5d5d5;
  padding: 15px 25px;
  border-radius: 5px;"
>
    <div style="
      display: flex;
      flex-direction: row;
      justify-content: space-between;"
    >
      <div class="card-container manage-dataset">
        <div style="display: flex">
          <h5 class="card-left" style="
              text-align: right;
              color: #808080;
              font-size: 15px;
              padding-right: 5px;
            ">
            Current account:
          </h5>
          <div class="md-change-current-account" style="margin-left: 10px; display: flex; justify-content: space-between;">
            <h5 class="card-right bf-account-span" style="
                color: #000;
                font-weight: 600;
                margin-left: 4px;
                font-size: 15px;
                width: fit-content;
              " id="getting-started-account">${defaultBfAccount}</h5>
          </div>
        </div>
      </div>
    </div>
    <div style="
        display: flex;
        flex-direction: row;
        margin-bottom: 15px;"
    >
      <div class="card-container manage-dataset">
        <div>
          <h5 class="card-left" style="
              text-align: right;
              color: #808080;
              font-size: 15px;
              padding-right: 20px;
            ">
            Account details:
          </h5>
          <h5 class="card-right bf-account-details-span" style="
              color: #000;
              font-weight: 600;
              margin-left: 15px;
              font-size: 15px;
            " id="account-info-getting-started">${defaultAccountDetails}</h5>
        </div>
      </div>
    </div>
</div>
`;
};

const dataDeliverableTitle = `
Drag and Drop your data deliverable
`;

const dataDeliverableMessage = `
<div style="margin-top: 1.5rem;">
<div class="guided--container-file-import" droppable="true" ondrop="dropHandler(event, 'guided-data-deliverable-para-text', 'DataDeliverablesDocument', 'guided-getting-started', dataDeliverables=true);" ondragover="return false;">
  <div class="guided--file-import" data-code-metadata-file-type="data_deliverable" style="min-height: 333px; width: 550px;">
    <div id="swal-data-deliverable" class="code-metadata-lottie-container" style="height: 100px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px); content-visibility: visible;"><defs><clipPath id="__lottie_element_791"><rect width="300" height="300" x="0" y="0"></rect></clipPath></defs><g clip-path="url(#__lottie_element_791)"><g transform="matrix(1,0,0,1,99,36.82099914550781)" opacity="1" style="display: block;"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M12,65.67900085449219 C12,65.67900085449219 12,59.67900085449219 12,59.67900085449219"></path></g><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke-dasharray=" 13.893 13.893" stroke-dashoffset="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M12,45.7859992980957 C12,45.7859992980957 12,24.94700050354004 12,24.94700050354004"></path></g><g opacity="1" transform="matrix(1,0,0,1,15,15)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M-3,3 C-3,3 -3,-3 -3,-3 C-3,-3 3,-3 3,-3"></path></g><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke-dasharray=" 10.909 10.909" stroke-dashoffset="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M28.909000396728516,12 C28.909000396728516,12 132.5449981689453,12 132.5449981689453,12"></path></g><g opacity="1" transform="matrix(1,0,0,1,141,15)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M-3,-3 C-3,-3 3,-3 3,-3 C3,-3 3,3 3,3"></path></g><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke-dasharray=" 10.909 10.909" stroke-dashoffset="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M144,28.909000396728516 C144,28.909000396728516 144,132.54600524902344 144,132.54600524902344"></path></g><g opacity="1" transform="matrix(1,0,0,1,141,141)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M3,-3 C3,-3 3,3 3,3 C3,3 -3,3 -3,3"></path></g><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke-dasharray=" 11.333 11.333" stroke-dashoffset="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M126.66699981689453,144 C126.66699981689453,144 109.66699981689453,144 109.66699981689453,144"></path></g><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M104,144 C104,144 98,144 98,144"></path></g></g><g transform="matrix(1,0,0,1,122.58927917480469,49.94279098510742)" opacity="1" style="display: block;"><g opacity="1" transform="matrix(1,0,0,1,60.5620002746582,60.5620002746582)"><path stroke-linecap="butt" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="10" d=" M35.5620002746582,-35.5620002746582 C35.5620002746582,-35.5620002746582 -35.5620002746582,-23.679000854492188 -35.5620002746582,-23.679000854492188 C-35.5620002746582,-23.679000854492188 -10.25100040435791,-10.25100040435791 -10.25100040435791,-10.25100040435791 C-10.25100040435791,-10.25100040435791 -35.20399856567383,14.70300006866455 -35.20399856567383,14.70300006866455 C-35.20399856567383,14.70300006866455 -15.003999710083008,34.90299987792969 -15.003999710083008,34.90299987792969 C-15.003999710083008,34.90299987792969 9.949000358581543,9.949999809265137 9.949000358581543,9.949999809265137 C9.949000358581543,9.949999809265137 23.679000854492188,35.5620002746582 23.679000854492188,35.5620002746582 C23.679000854492188,35.5620002746582 35.5620002746582,-35.5620002746582 35.5620002746582,-35.5620002746582z"></path></g></g><g transform="matrix(1,0,0,1,102.64799499511719,40.451995849609375)" opacity="1" style="display: block;"><g opacity="1" transform="matrix(1,0,0,1,74.48500061035156,74.48500061035156)"><path stroke-linecap="round" stroke-linejoin="round" fill-opacity="0" stroke="rgb(74,144,226)" stroke-opacity="1" stroke-width="12" d=" M-66,0 C-66,-33 -66,-66 -66,-66 C-66,-66 66,-66 66,-66 C66,-66 66,66 66,66 C66,66 66,66 66,66 C66,66 -66,66 -66,66 C-66,66 -66,33 -66,0"></path></g></g></g></svg></div>
    <div style="display: flex;">
      <p class="guided--help-text text-center" style="/* width: 284px; *//* display: flex; *//* flex-direction: row; */">
        Drag and Drop</p>
        <p style="margin-left: 4px; font-weight: 600;">
          Data Deliverables document
        </p>
    </div>
    <p class="guided--help-text text-center mt-sm mb-sm">
      OR
    </p>
    <button class="ui primary basic button" onclick="openDDDimport('guided')" style="margin-top: 2rem !important;">
      <i class="fas fa-file-import" style="margin-right: 7px"></i>Import Data Deliverables document
    </button>
    <p class="guided--help-text small text-center mt-sm" id="guided-data-deliverable-para-text" style="max-width: 240px; overflow-wrap: break-word"></p>
  </div>
</div>
</div>
`;

const showDataDeliverableDropDown = async () => {
  const dataDeliverableButton = document.getElementById("getting-started-data-deliverable-btn");

  await Swal.fire({
    title: dataDeliverableTitle,
    html: dataDeliverableMessage,
    showCancelButton: true,
    showConfirmButton: false,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Continue",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    didOpen: () => {
      let swal_container = document.getElementsByClassName("swal2-popup")[0];
      let swal_actions = document.getElementsByClassName("swal2-actions")[0];
      let swal_content = document.getElementsByClassName("swal2-content")[0];
      let DDLottie = document.getElementById("swal-data-deliverable");
      let swal_header = document.getElementsByClassName("swal2-header")[0];
      swal_header.remove();
      DDLottie.innerHTML = "";
      swal_container.style.width = "43rem";
      swal_actions.style.marginTop = "-2px";
      swal_actions.style.marginBottom = "-7px";

      let ddFilePath = globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["filepath"];
      if (ddFilePath) {
        //append file path
        let firstItem = swal_content.children[0];
        let paragraph = document.createElement("p");
        let paragraph2 = document.createElement("p");
        paragraph2.innerText =
          "To replace the current Data Deliverables just drop in or select a new one.";

        paragraph2.style.marginBottom = "1rem";
        paragraph.style.marginTop = "1rem";
        paragraph.style.fontWeight = "700";
        paragraph.innerText = "File Path: " + ddFilePath;
        if (firstItem.children[0].id === "getting-started-filepath") {
          firstItem.children[0].remove();
          firstItem.children[firstItem.childElementCount - 1].remove();
        }
        firstItem.append(paragraph2);
        firstItem.prepend(paragraph);
        dataDeliverableButton.children[0].style.display = "none";
        dataDeliverableButton.children[1].style.display = "flex";
        lottie.loadAnimation({
          container: DDLottie,
          animationData: successCheck,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
        document.getElementById("guided-button-import-data-deliverables").click();
      } else {
        lottie.loadAnimation({
          container: DDLottie,
          animationData: dragDrop,
          renderer: "svg",
          loop: true,
          autoplay: true,
        });
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
  });
  if (globals.sodaJSONObj["dataset-metadata"]["submission-metadata"]["filepath"]) {
    dataDeliverableButton.children[0].style.display = "none";
    dataDeliverableButton.children[1].style.display = "flex";
  } else {
    dataDeliverableButton.children[0].style.display = "flex";
    dataDeliverableButton.children[1].style.display = "none";
  }
};

const currentUserDropdown = async () => {
  const pennsieveDetails = await Swal.fire({
    title: "Current Pennsieve Details",
    html: currentAccount(defaultBfAccount, $("#para-account-detail-curate").text()),
    showCancelButton: true,
    // showConfirmButton: false,
    // focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Change Account",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
    didOpen: () => {
      let swal_container = document.getElementsByClassName("swal2-popup")[0];
      let swal_actions = document.getElementsByClassName("swal2-actions")[0];
      // let DDLottie = document.getElementById("swal-data-deliverable");
      let swal_header = document.getElementsByClassName("swal2-header")[0];
      swal_header.style.borderBottom = "3px solid var(--color-bg-plum)";
      swal_header.style.marginTop = "-1rem";
      swal_header.style.padding = ".5rem";
      // DDLottie.innerHTML = "";
      swal_container.style.width = "43rem";
      swal_actions.style.marginTop = "12px";
      swal_actions.style.marginBottom = "-7px";
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
  });

  if (pennsieveDetails.isConfirmed) {
    await openDropdownPrompt(this, "bf");
  }
};

const pennsieveButton = document.getElementById("getting-started-pennsieve-account");
const dataDeliverableButton = document.getElementById("getting-started-data-deliverable-btn");
const airTableButton = document.getElementById("getting-started-button-import-sparc-award");

airTableButton.addEventListener("click", async () => {
  await helpSPARCAward("submission", "guided--getting-started");
});
dataDeliverableButton.addEventListener("click", async () => {
  await showDataDeliverableDropDown();
});
pennsieveButton.addEventListener("click", async () => {
  if (!defaultBfAccount) {
    await openDropdownPrompt(this, "bf");
  } else {
    await currentUserDropdown();
  }
});

const guidedSaveDescriptionDatasetInformation = () => {
  const title = globals.sodaJSONObj["digital-metadata"]["name"];
  const subtitle = globals.sodaJSONObj["digital-metadata"]["subtitle"];
  let studyType = null;
  const selectedStudyTypeRadioButton = document.querySelector(
    "input[name='dataset-relation']:checked"
  );
  if (!selectedStudyTypeRadioButton) {
    throw "Please select a study type";
  } else {
    studyType = selectedStudyTypeRadioButton.value;
  }

  //get the keywords from the keywords textarea
  const keywordArray = getTagsFromTagifyElement(guidedDatasetKeywordsTagify);
  if (keywordArray.length < 3) {
    throw "Please enter at least 3 keywords";
  }

  //Get the count of all subjects in and outside of pools
  const [subjectsInPools, subjectsOutsidePools] = globals.sodaJSONObj.getAllSubjects();
  const numSubjects = [...subjectsInPools, ...subjectsOutsidePools].length;

  //Get the count of all samples
  const [samplesInPools, samplesOutsidePools] = globals.sodaJSONObj.getAllSamplesFromSubjects();
  //Combine sample data from samples in and out of pools
  const numSamples = [...samplesInPools, ...samplesOutsidePools].length;

  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["dataset-information"] = {
    name: title,
    description: subtitle,
    type: studyType,
    keywords: keywordArray,
    "number of samples": numSamples,
    "number of subjects": numSubjects,
  };
};

const guidedSaveDescriptionStudyInformation = () => {
  const studyOrganSystemTags = getTagsFromTagifyElement(guidedStudyOrganSystemsTagify);
  const studyApproachTags = getTagsFromTagifyElement(guidedStudyApproachTagify);
  const studyTechniqueTags = getTagsFromTagifyElement(guidedStudyTechniquesTagify);

  const studyPurposeInput = document.getElementById("guided-ds-study-purpose");
  const studyDataCollectionInput = document.getElementById("guided-ds-study-data-collection");
  const studyPrimaryConclusionInput = document.getElementById("guided-ds-study-primary-conclusion");
  const studyCollectionTitleInput = document.getElementById("guided-ds-study-collection-title");
  //Initialize the study information variables
  let studyPurpose = null;
  let studyDataCollection = null;
  let studyPrimaryConclusion = null;
  let studyCollectionTitle = null;

  //Throw an error if any study information variables are not filled out
  if (!studyPurposeInput.value.trim()) {
    throw "Please add a study purpose";
  } else {
    studyPurpose = studyPurposeInput.value.trim();
  }
  if (!studyDataCollectionInput.value.trim()) {
    throw "Please add a study data collection";
  } else {
    studyDataCollection = studyDataCollectionInput.value.trim();
  }
  if (!studyPrimaryConclusionInput.value.trim()) {
    throw "Please add a study primary conclusion";
  } else {
    studyPrimaryConclusion = studyPrimaryConclusionInput.value.trim();
  }
  if (studyOrganSystemTags.length < 1) {
    throw "Please add at least one study organ system";
  }
  if (studyApproachTags.length < 1) {
    throw "Please add at least one study approach";
  }
  if (studyTechniqueTags.length < 1) {
    throw "Please add at least one study technique";
  }

  studyCollectionTitle = studyCollectionTitleInput.value.trim();

  //After validation, add the study information to the JSON object
  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["study-information"] = {
    "study organ system": studyOrganSystemTags,
    "study approach": studyApproachTags,
    "study technique": studyTechniqueTags,
    "study purpose": studyPurpose,
    "study data collection": studyDataCollection,
    "study primary conclusion": studyPrimaryConclusion,
    "study collection title": studyCollectionTitle,
  };
};
const guidedSaveDescriptionContributorInformation = () => {
  const acknowledgementsInput = document.getElementById("guided-ds-acknowledgements");
  const acknowledgements = acknowledgementsInput.value.trim();

  // Get tags from other funding tagify
  const otherFunding = getTagsFromTagifyElement(guidedOtherFundingsourcesTagify);

  globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["contributor-information"] = {
    funding: otherFunding,
    acknowledgment: acknowledgements,
  };
};

const guidedCombineLinkSections = () => {
  var protocolLinks = getGuidedProtocolSection();
  var otherLinks = getGuidedAdditionalLinkSection();
  protocolLinks.push.apply(protocolLinks, otherLinks);
  return protocolLinks;
};

const guidedSaveParticipantInformation = () => {
  let numSubjects = $("#guided-ds-samples-no").val();
  let numSamples = $("#guided-ds-samples-no").val();
  if (numSubjects.length == 0 || numSamples.length == 0) {
    /*Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        icon: "error",
        text: "Please fill in all of the required participant information fields.",
        title: "Incomplete information",
      });*/
  } else {
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["numSubjects"] = numSubjects;
    globals.sodaJSONObj["dataset-metadata"]["description-metadata"]["numSamples"] = numSamples;
  }
};


// Set these as a global variable to remain consistent with the old SODA app
// All of these functions are called in HTML
globalThis.guidedSaveAndExit = guidedSaveAndExit;
globalThis.validateInput = validateInput
globalThis.guidedResumeProgress = guidedResumeProgress;
