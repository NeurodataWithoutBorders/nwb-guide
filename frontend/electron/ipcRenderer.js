const { ipcRenderer } = require("electron")
const fs = require("fs-extra")

const organizeDSaddFiles = document.getElementById("add-files");
const organizeDSaddFolders = document.getElementById("add-folders")


exports.default = ipcRenderer;

// Check app version on current app and display in the side bar
ipcRenderer.on("app_version", (event, arg) => {
    const version = document.getElementById("version");
    ipcRenderer.removeAllListeners("app_version");
    version.innerText = arg.version;
  });

  // Check for update and show the pop up box
  ipcRenderer.on("update_available", () => {
    ipcRenderer.removeAllListeners("update_available");
    ipcRenderer.send(
      "track-event",
      "App Update",
      "Update Requested",
      `User OS-${os.platform()}-${os.release()}- SODAv${app.getVersion()}`
    );
    update_available_notification = notyf.open({
      type: "app_update",
      message: "A new update is available. Downloading now...",
    });
  });

  // Restart the app for update. Does not restart on macos
  const restartApp = async () => {
    notyf.open({
      type: "app_update_warning",
      message: "Closing SODA now...",
    });

    ipcRenderer.send(
      "track-event",
      "App Update",
      "App Restarted",
      `User OS-${os.platform()}-${os.release()}- SODAv${app.getVersion()}`
    );
    ipcRenderer.send("restart_app");
  };




  /////////////////////// Download Metadata Templates ////////////////////////////
const downloadTemplates = (templateItem, destinationFolder) => {
    var templatePath = path.join(__dirname, "file_templates", templateItem);
    var destinationPath = path.join(destinationFolder, templateItem);
    if (fs.existsSync(destinationPath)) {
      var emessage = "File '" + templateItem + "' already exists in " + destinationFolder;
      Swal.fire({
        icon: "error",
        title: "Metadata file already exists",
        text: `${emessage}`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      ipcRenderer.send("track-event", "Error", `Download Template - ${templateItem}`);
    } else {
      fs.createReadStream(templatePath).pipe(fs.createWriteStream(destinationPath));
      var emessage = `Successfully saved '${templateItem}' to ${destinationFolder}`;
      Swal.fire({
        icon: "success",
        title: "Download successful",
        text: `${emessage}`,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
      ipcRenderer.send("track-event", "Success", `Download Template - ${templateItem}`);
    }
  };

  ipcRenderer.on("selected-metadata-download-folder", (event, path, filename) => {
    if (path.length > 0) {
      downloadTemplates(filename, path[0]);
    }
  });

  ipcRenderer.on("selected-DDD-download-folder", (event, path, filename) => {
    if (path.length > 0) {
      downloadTemplates(filename, path[0]);
    }
  });

  // Subjects File Helper

async function generateSubjectsFileHelper(uploadBFBoolean) {
    if (uploadBFBoolean) {
      var { value: continueProgress } = await Swal.fire({
        title:
          "Any existing subjects.xlsx file in the high-level folder of the selected dataset will be replaced.",
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
    } else {
      var { value: continueProgress } = await Swal.fire({
        title: "Any existing subjects.xlsx file in the specified location will be replaced.",
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
    }
    Swal.fire({
      title: "Generating the subjects.xlsx file",
      html: "Please wait...",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((result) => {});

    let bfdataset = document.getElementById("bf_dataset_load_subjects").innerText.trim();
    try {

      let save_locally = await client.post(
        `/prepare_metadata/subjects_file`,
        {
          filepath: subjectsDestinationPath,
          selected_account: defaultBfAccount,
          selected_dataset: bfdataset,
          subjects_header_row: subjectsTableData,
        },
        {
          params: {
            upload_boolean: uploadBFBoolean,
          },
        }
      );

      let res = save_locally.data;

      Swal.fire({
        title: "The subjects.xlsx file has been successfully generated at the specified location.",
        icon: "success",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      // log the success to Pennsieve
      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );

      // log the size of the metadata file that was generated at varying levels of granularity
      const size = res;
      logMetadataSizeForAnalytics(uploadBFBoolean, "subjects.xlsx", size);
    } catch (error) {
      clientError(error);
      let emessage = userErrorMessage(error);

      Swal.fire({
        title: "Failed to generate the subjects.xlsx file.",
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      // log the error to analytics
      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SUBJECTS,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );
    }
  }

  globalThis.generateSubjectsFileHelper = generateSubjectsFileHelper; // For parity with SODA

  // generate samples file
  ipcRenderer.on("selected-generate-metadata-samples", (event, dirpath, filename) => {
    if (dirpath.length > 0) {
      var destinationPath = path.join(dirpath[0], filename);
      if (fs.existsSync(destinationPath)) {
        var emessage =
          "File '" + filename + "' already exists in " + dirpath[0] + ". Do you want to replace it?";
        Swal.fire({
          icon: "warning",
          title: "Metadata file already exists",
          text: `${emessage}`,
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          showConfirmButton: true,
          showCancelButton: true,
          cancelButtonText: "No",
          confirmButtonText: "Yes",
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: "Generating the samples.xlsx file",
              html: "Please wait...",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              allowEscapeKey: false,
              allowOutsideClick: false,
              timerProgressBar: false,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {});
            generateSamplesFileHelper(uploadBFBoolean);
          }
        });
      } else {
        Swal.fire({
          title: "Generating the samples.xlsx file",
          html: "Please wait...",
          heightAuto: false,
          backdrop: "rgba(0,0,0, 0.4)",
          allowEscapeKey: false,
          allowOutsideClick: false,
          timerProgressBar: false,
          didOpen: () => {
            Swal.showLoading();
          },
        }).then((result) => {});
        generateSamplesFileHelper(uploadBFBoolean);
      }
    }
  });

  async function generateSamplesFileHelper(uploadBFBoolean) {
    if (uploadBFBoolean) {
      var { value: continueProgress } = await Swal.fire({
        title:
          "Any existing samples.xlsx file in the high-level folder of the selected dataset will be replaced.",
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
    } else {
      var { value: continueProgress } = await Swal.fire({
        title: "Any existing samples.xlsx file in the specified location will be replaced.",
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
    }
    Swal.fire({
      title: "Generating the samples.xlsx file",
      html: "Please wait...",
      allowEscapeKey: false,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      timerProgressBar: false,
      didOpen: () => {
        Swal.showLoading();
      },
    }).then((result) => {});

    try {
      let samplesFileResponse = await client.post(
        "prepare_metadata/samples_file",
        {
          filepath: samplesDestinationPath,
          selected_account: defaultBfAccount,
          selected_dataset: $("#bf_dataset_load_samples").text().trim(),
          samples_str: samplesTableData,
        },
        {
          params: {
            upload_boolean: uploadBFBoolean,
          },
        }
      );

      Swal.fire({
        title: "The samples.xlsx file has been successfully generated at the specified location.",
        icon: "success",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      logMetadataForAnalytics(
        "Success",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );

      // log the size of the metadata file that was generated at varying levels of granularity
      const { size } = samplesFileResponse.data;
      logMetadataSizeForAnalytics(uploadBFBoolean, "samples.xlsx", size);
    } catch (error) {
      clientError(error);
      var emessage = userErrorMessage(error);
      Swal.fire({
        title: "Failed to generate the samples.xlsx file.",
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error",
      });

      logMetadataForAnalytics(
        "Error",
        MetadataAnalyticsPrefix.SAMPLES,
        AnalyticsGranularity.ALL_LEVELS,
        "Generate",
        uploadBFBoolean ? Destinations.PENNSIEVE : Destinations.LOCAL
      );
    }
  }

  // import Primary folder
  ipcRenderer.on("selected-local-primary-folder", (event, primaryFolderPath) => {
    if (primaryFolderPath.length > 0) {
      importPrimaryFolderSubjects(primaryFolderPath[0]);
    }
  });
  ipcRenderer.on("selected-local-primary-folder-samples", (event, primaryFolderPath) => {
    if (primaryFolderPath.length > 0) {
      importPrimaryFolderSamples(primaryFolderPath[0]);
    }
  });


/*
******************************************************
******************************************************
Analytics Logging Section
******************************************************
******************************************************
*/

// Log the dataset description Successes and Errors as the user moves through the process of Preparing their metadata file
// Inputs:
//  category: string - "Success" indicates a successful operation; "Error" indicates a failed operation
//  analyticsActionPrefix: string - One of the analytics action prefixes defined below in an enum
//  analyticsGranularity: string - Determines what levels of granularity get logged; options are: "prefix", "action", "action with destination", "all levels of granularity."
//  action: string - Optional. Indicates the step in the metadata preparation process the Success or Failure occurs
//  destination: string - Optional. The destination where the action is occurring; defined below in an enum

function logMetadataForAnalytics(
    category,
    analyticsActionPrefix,
    granularity,
    action,
    destination
  ) {
    // the name of the action being logged
    let actionName = analyticsActionPrefix;

    // check if only logging the prefix or all levels of granularity
    if (
      granularity === AnalyticsGranularity.PREFIX ||
      granularity === AnalyticsGranularity.ALL_LEVELS
    ) {
      // log the prefix, category of the event
      ipcRenderer.send("track-event", `${category}`, actionName);
    }

    // check if the user provided an action to be part of the action name
    if (action !== "") {
      // update the action name with the given action
      actionName = actionName + " - " + action;
    } else {
      // add not set so when looking at analytics we can easily identify sections logged without providing an action
      // so we can fix the log call by including an appropriate action
      actionName = actionName + " - " + "(not set)";
    }

    // check if the user wants to log the action without the destination
    if (
      granularity === AnalyticsGranularity.ACTION ||
      granularity === AnalyticsGranularity.ALL_LEVELS ||
      granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
    ) {
      // track every time the user wanted to generate a metadata file or everytime the user wanted to use a pre-existing metadata file
      ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
    }

    if (
      granularity === AnalyticsGranularity.ACTION_WITH_DESTINATION ||
      granularity === AnalyticsGranularity.ALL_LEVELS ||
      granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
    ) {
      // add the destination to the action
      actionName = actionName + " - " + destination;
      // log only the action with the destination added
      if (destination === Destinations.PENNSIEVE) {
        ipcRenderer.send("track-event", `${category}`, actionName, defaultBfDatasetId);
      } else {
        ipcRenderer.send("track-event", `${category}`, actionName, action, 1);
      }
    }
  }

  // Log the size of a metadata file that was created locally or uploaded to Pennsieve
  // Inputs:
  //    uploadBFBoolean: boolean - True when the metadata file was created on Pennsieve; false when the Metadata file was created locally
  //    metadataFileName: string - the name of the metadata file that was created along with its extension
  async function logMetadataSizeForAnalytics(uploadBFBoolean, metadataFileName, size) {
    ipcRenderer.send(
      "track-event",
      "Success",
      "Prepare Metadata - Generate",
      "Size of Total Metadata Files Generated",
      size
    );

    let fileNameToPrefixMapping = {
      dataset_description: MetadataAnalyticsPrefix.DATASET_DESCRIPTION,
      submission: MetadataAnalyticsPrefix.SUBMISSION,
      subjects: MetadataAnalyticsPrefix.SUBJECTS,
      samples: MetadataAnalyticsPrefix.SAMPLES,
      readme: MetadataAnalyticsPrefix.README,
      changes: MetadataAnalyticsPrefix.CHANGES,
      manifest: MetadataAnalyticsPrefix.MANIFEST,
    };

    // remove the extension from the metadata file's name
    let metadataFileWithoutExtension = metadataFileName.slice(0, metadataFileName.indexOf("."));

    // get the appropriate prefix for logging the given metadata file's size
    let currentMetadataLoggingPrefix =
      fileNameToPrefixMapping[`${metadataFileWithoutExtension.toLowerCase()}`];

    // log the size to analytics using the Action as a root logging level
    // that aggregates the size of all metadata files of a particular type created through SODA
    ipcRenderer.send(
      "track-event",
      "Success",
      currentMetadataLoggingPrefix + " - Generate - Size",
      "Size",
      size
    );

    // get the destination of the metadata file
    let destination = uploadBFBoolean ? "Pennsieve" : "Local";

    // log the size of the metadata file along with its location; label is the selected dataset's ID or a note informing us the dataset is stored locally
    ipcRenderer.send(
      "track-event",
      "Success",
      currentMetadataLoggingPrefix + ` - Generate - ${destination} - Size`,
      uploadBFBoolean ? defaultBfDatasetId : "Local",
      size
    );
  }

  // get the size of a file in bytes given a path to a file
  const getFileSizeInBytes = (path) => {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(stats.size);
        }
      });
    });
  };

  const MetadataAnalyticsPrefix = {
    DATASET_DESCRIPTION: "Prepare Metadata - dataset_description",
    MANIFEST: "Prepare Metadata - manifest",
    SUBJECTS: "Prepare Metadata - subjects",
    SAMPLES: "Prepare Metadata - samples",
    README: "Prepare Metadata - readme",
    CHANGES: "Prepare Metadata - changes",
    SUBMISSION: "Prepare Metadata - submission",
  };

  const ManageDatasetsAnalyticsPrefix = {
    MANAGE_DATASETS_CREATE_DATASET: "Manage Datasets - Create a new dataset",
    MANAGE_DATASETS_RENAME_DATASET: "Manage Datasets - Rename an existing dataset",
    MANAGE_DATASETS_MAKE_PI_OWNER: "Manage Datasets - Make PI owner of dataset",
    MANAGE_DATASETS_ADD_EDIT_PERMISSIONS: "Manage Datasets - Add/Edit Permissions",
    MANAGE_DATASETS_ADD_EDIT_SUBTITLE: "Manage Datasets - Add/Edit Subtitle",
    MANAGE_DATASETS_ADD_EDIT_README: "Manage Datasets - Add/Edit Readme",
    MANAGE_DATASETS_ADD_EDIT_BANNER: "Manage Datasets - Upload a Banner Image",
    MANAGE_DATASETS_ADD_EDIT_TAGS: "Manage Datasets - Add/Edit Tags",
    MANAGE_DATASETS_ASSIGN_LICENSE: "Manage Datasets - Assign a License",
    MANAGE_DATASETS_UPLOAD_LOCAL_DATASET: "Manage Datasets - Upload Local Dataset",
    MANAGE_DATASETS_CHANGE_STATUS: "Manage Datasets - Change Dataset Status",
  };

  const DisseminateDatasetsAnalyticsPrefix = {
    DISSEMINATE_REVIEW: "Disseminate Datasets - Pre-publishing Review",
    DISSEMINATE_CURATION_TEAM: "Disseminate Datasets - Share with Curation Team",
    DISSEMINATE_SPARC_CONSORTIUM: "Disseminate Datasets - Share with SPARC Consortium",
  };

  const PrepareDatasetsAnalyticsPrefix = {
    CURATE: "Prepare Datasets - Organize dataset",
  };

  const AnalyticsGranularity = {
    PREFIX: "prefix",
    ACTION: "action",
    ACTION_WITH_DESTINATION: "action with destination",
    ACTION_AND_ACTION_WITH_DESTINATION: "action and action with destination",
    ALL_LEVELS: "all levels of granularity",
  };

  const Destinations = {
    LOCAL: "Local",
    PENNSIEVE: "Pennsieve",
    SAVED: "Saved",
    NEW: "New",
  };

  const Actions = {
    GENERATE: "Generate",
    EXISTING: "Existing",
    NEW: "New",
  };

  function logCurationForAnalytics(
    category,
    analyticsActionPrefix,
    granularity,
    actions,
    location,
    generalLog
  ) {
    // if no actions to log return
    if (!actions) {
      return;
    }

    // the name of the action being logged
    let actionName = analyticsActionPrefix;

    // check if only logging the prefix or all levels of granularity
    if (
      granularity === AnalyticsGranularity.PREFIX ||
      granularity === AnalyticsGranularity.ALL_LEVELS
    ) {
      // log the prefix, category of the event
      ipcRenderer.send("track-event", `${category}`, actionName);
    }

    // check if the user wants to log the action(s)
    if (
      granularity === AnalyticsGranularity.ACTION ||
      granularity === AnalyticsGranularity.ALL_LEVELS ||
      granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
    ) {
      // iterate through the actions
      for (let idx = 0; idx < actions.length; idx++) {
        // track the action
        actionName = actionName + " - " + actions[idx];
        ipcRenderer.send("track-event", `${category}`, actionName, actions[idx], 1);
      }

      // reset the action's name
      actionName = analyticsActionPrefix;
    }

    // check if the user wants to log the action(s) with the destination
    if (
      granularity === AnalyticsGranularity.ACTION_WITH_DESTINATION ||
      granularity === AnalyticsGranularity.ALL_LEVELS ||
      granularity === AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION
    ) {
      // iterate through the actions
      for (let idx = 0; idx < actions.length; idx++) {
        // track the action
        actionName = actionName + " - " + actions[idx];
      }

      if (!generalLog) {
        // add the location
        actionName = actionName + " - " + location;
      }

      // determine logging format
      if (location === Destinations.PENNSIEVE) {
        // use the datasetid as a label and do not add an aggregation value
        ipcRenderer.send("track-event", `${category}`, actionName, defaultBfDatasetId);
      } else {
        // log the location as a label and add an aggregation value
        ipcRenderer.send("track-event", `${category}`, actionName, location, 1);
      }
    }
  }

  function getMetadataFileNameFromStatus(metadataFileStatus) {
    // get the UI text that displays the file path
    let filePath = metadataFileStatus.text();

    let fileName = path.basename(filePath);

    // remove the extension
    fileName = fileName.slice(0, fileName.indexOf("."));

    return fileName;
  }

  function determineLocationFromStatus(metadataFileStatus) {
    let filePath = metadataFileStatus.text();

    // determine if the user imported from Pennsieve or Locally
    let pennsieveFile = filePath.toUpperCase().includes("Pennsieve".toUpperCase());

    return pennsieveFile;
  }

  function logGeneralOperationsForAnalytics(category, analyticsPrefix, granularity, actions) {
    // if no actions to log return
    if (!actions) {
      return;
    }

    // the name of the action being logged
    let actionName = analyticsPrefix;

    // check if only logging the prefix or all levels of granularity
    if (
      granularity === AnalyticsGranularity.PREFIX ||
      granularity === AnalyticsGranularity.ALL_LEVELS
    ) {
      // log the prefix, category of the event
      ipcRenderer.send("track-event", `${category}`, actionName);
    }

    // check if the user wants to log the action(s)
    if (
      granularity === AnalyticsGranularity.ACTION ||
      granularity === AnalyticsGranularity.ALL_LEVELS
    ) {
      // iterate through the actions
      for (let idx = 0; idx < actions.length; idx++) {
        // track the action
        actionName = analyticsPrefix + " - " + actions[idx];
        ipcRenderer.send("track-event", `${category}`, actionName, defaultBfDatasetId);
      }
    }
  }


ipcRenderer.on("warning-publish-dataset-selection", (event, index) => {
    if (index === 0) {
      submitReviewDataset();
    }
    $("#submit_prepublishing_review-spinner").hide();
  });

  ipcRenderer.on("warning-publish-dataset-again-selection", (event, index) => {
    if (index === 0) {
      submitReviewDataset();
    }
    $("#submit_prepublishing_review-spinner").hide();
  });

  async function submitReviewDataset(embargoReleaseDate) {
    $("#para-submit_prepublishing_review-status").text("");
    bfRefreshPublishingDatasetStatusBtn.disabled = true;
    var selectedBfAccount = defaultBfAccount;
    var selectedBfDataset = defaultBfDataset;

    // title text
    let title = "";

    // check if the user has selected any files they want to be hidden to the public upon publication (aka ignored/excluded files)
    // set the loading message title accordingly
    if (excludedFilesInPublicationFlow()) {
      title = "Ignoring selected files and submitting dataset for pre-publishing review";
    } else {
      title = "Submitting dataset for pre-publishing review";
    }

    // show a SWAL loading message until the submit for prepublishing flow is successful or fails
    Swal.fire({
      title: title,
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

    // if there are excluded files upload them to Pennsieve so they will not be viewable to the public upon publication
    if (excludedFilesInPublicationFlow()) {
      // get the excluded files from the excluded files list in the third step of the pre-publishing review submission flow
      let files = getExcludedFilesFromPublicationFlow();
      try {
        // exclude the user's selected files from publication
        //check res
        await api.updateDatasetExcludedFiles(defaultBfDatasetId, files);
      } catch (error) {
        clientError(error);
        // log the error
        logGeneralOperationsForAnalytics(
          "Error",
          DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
          AnalyticsGranularity.ALL_LEVELS,
          ["Updating excluded files"]
        );

        var emessage = userErrorMessage(error);

        // alert the user of the error
        Swal.fire({
          backdrop: "rgba(0,0,0, 0.4)",
          heightAuto: false,
          confirmButtonText: "Ok",
          title: `Could not exclude the selected files from publication`,
          icon: "error",
          reverseButtons: reverseSwalButtons,
          text: `${emessage}`,
          showClass: {
            popup: "animate__animated animate__zoomIn animate__faster",
          },
          hideClass: {
            popup: "animate__animated animate__zoomOut animate__faster",
          },
        });
        // stop publication
        return;
      }
    }

    try {
      await api.submitDatasetForPublication(
        selectedBfAccount,
        selectedBfDataset,
        embargoReleaseDate,
        embargoReleaseDate === "" ? "publication" : "embargo"
      );
    } catch (error) {
      clientError(error);
      logGeneralOperationsForAnalytics(
        "Error",
        DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
        AnalyticsGranularity.ALL_LEVELS,
        ["Submit dataset"]
      );

      var emessage = userErrorMessage(error);

      // alert the user of an error
      Swal.fire({
        backdrop: "rgba(0,0,0, 0.4)",
        heightAuto: false,
        confirmButtonText: "Ok",
        title: `Could not submit your dataset for pre-publishing review`,
        icon: "error",
        reverseButtons: reverseSwalButtons,
        text: emessage,
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });

      // stop execution
      return;
    }

    // update the publishing status UI element
    await showPublishingStatus("noClear");

    // track success
    logGeneralOperationsForAnalytics(
      "Success",
      DisseminateDatasetsAnalyticsPrefix.DISSEMINATE_REVIEW,
      AnalyticsGranularity.ALL_LEVELS,
      ["Submit dataset"]
    );

    // alert the user the submission was successful
    Swal.fire({
      backdrop: "rgba(0,0,0, 0.4)",
      heightAuto: false,
      confirmButtonText: "Ok",
      title: `Dataset has been submitted for pre-publishing review to the publishers within your organization!`,
      icon: "success",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    await transitionFreeFormMode(
      document.querySelector("#begin-prepublishing-btn"),
      "submit_prepublishing_review-question-2",
      "submit_prepublishing_review-tab",
      "",
      "individual-question post-curation"
    );
  }


  ipcRenderer.on("selected-new-dataset", async (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        document.getElementById("para-organize-datasets-loading").style.display = "block";
        document.getElementById("para-organize-datasets-loading").innerHTML =
          "<span>Please wait...</span>";



        try {
          await client.post(
            `/organize_datasets/datasets`,

            {
              generation_type: "create-new",
              generation_destination_path: filepath[0],
              dataset_name: newDSName,
              soda_json_directory_structure: datasetStructureJSONObj,
            },
            {
              timeout: 0,
            },
            {
              timeout: 0,
            }
          );

          document.getElementById("para-organize-datasets-error").style.display = "none";
          document.getElementById("para-organize-datasets-success").style.display = "block";
          document.getElementById("para-organize-datasets-success").innerHTML =
            "<span>Generated successfully!</span>";
        } catch (error) {
          clientError(error);
          document.getElementById("para-organize-datasets-success").style.display = "none";
          document.getElementById("para-organize-datasets-error").style.display = "block";
          document.getElementById("para-organize-datasets-error").innerHTML =
            "<span> " + userErrorMessage(error) + "</span>";
        }
      }
    }
  });

  //////////// FILE BROWSERS to import existing files and folders /////////////////////
  organizeDSaddFiles.addEventListener("click", function () {
    ipcRenderer.send("open-files-organize-datasets-dialog");
  });

  ipcRenderer.on("selected-files-organize-datasets", async (event, path) => {
    var filtered = getGlobalPath(globals.organizeDSglobalPath);
    var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
    let hidden_files_present = false;
    path = path.filter(
      (file_path) => fs.statSync(file_path).isFile() && !/(^|\/)\.[^\/\.]/g.test(file_path)
    );
    path.forEach((file_path) => {
      if (/(^|\/)\.[^\/\.]/g.test(file_path)) {
        hidden_files_present = true;
      }
    });
    if (hidden_files_present == true) {
      Swal.fire({
        icon: "warning",
        text: "We found some hidden files. These will be ignored when importing.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
      });
    }
    if (path.length > 0) {
      if (path.length < 0) {
        await addFilesfunction(
          path,
          myPath,
          globals.organizeDSglobalPath,
          "#items",
          ".single-item",
          datasetStructureJSONObj
        );
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
          await addFilesfunction(
            path,
            myPath,
            globals.organizeDSglobalPath,
            "#items",
            ".single-item",
            datasetStructureJSONObj
          );
          // Swal.close();
          document.getElementById("loading-items-background-overlay").remove();
          document.getElementById("items_loading_container").remove();
          // background.remove();
        });
      }
    }
  });

  organizeDSaddFolders.addEventListener("click", function () {
    ipcRenderer.send("open-folders-organize-datasets-dialog");
  });

  ipcRenderer.on("selected-folders-organize-datasets", async (event, pathElement) => {
    var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contain any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
    irregularFolderArray = [];
    var filtered = getGlobalPath(globals.organizeDSglobalPath);
    var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj);
    for (var ele of pathElement) {
      detectIrregularFolders(path.basename(ele), ele);
    }
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
        didOpen: () => {
          $(".swal-popover").popover();
        },
        footer: footer,
      }).then(async (result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
          if (pathElement.length > 0) {
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
              await addFoldersfunction("replace", irregularFolderArray, pathElement, myPath);
              document.getElementById("loading-items-background-overlay").remove();
              document.getElementById("items_loading_container").remove();
            });
          } else {
            await addFoldersfunction("replace", irregularFolderArray, pathElement, myPath);
          }
        } else if (result.isDenied) {
          if (pathElement.length > 0) {
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
              await addFoldersfunction("remove", irregularFolderArray, pathElement, myPath);
              document.getElementById("loading-items-background-overlay").remove();
              document.getElementById("items_loading_container").remove();
            });
          } else {
            await addFoldersfunction("remove", irregularFolderArray, pathElement, myPath);
          }
        }
      });
    } else {
      if (pathElement.length > 0) {
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
          await addFoldersfunction("", irregularFolderArray, pathElement, myPath);
          document.getElementById("loading-items-background-overlay").remove();
          document.getElementById("items_loading_container").remove();
        });
      } else {
        await addFoldersfunction("", irregularFolderArray, pathElement, myPath);
      }
    }
  });

  const addFoldersfunction = async (action, nonallowedFolderArray, folderArray, currentLocation) => {
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
    var uiFolders = {};
    var importedFolders = {};
    var duplicateFolders = [];
    var folderPath = [];

    if (JSON.stringify(currentLocation["folders"]) !== "{}") {
      for (var folder in currentLocation["folders"]) {
        uiFolders[folder] = 1;
      }
    }
    var slashCount = globals.organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount === 1) {
      Swal.fire({
        icon: "error",
        text: "Only SPARC folders can be added at this level. To add a new SPARC folder, please go back to Step 2.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });

      // log the error
      logCurationForAnalytics(
        "Error",
        PrepareDatasetsAnalyticsPrefix.CURATE,
        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
        ["Step 3", "Import", "Folder"],
        determineDatasetLocation()
      );
    } else {
      // if non-allowed characters are detected, do the action
      // AND
      // check for duplicates/folders with the same name
      for (var i = 0; i < folderArray.length; i++) {
        var j = 1;
        var originalFolderName = path.basename(folderArray[i]);
        var renamedFolderName = originalFolderName;

        if (originalFolderName in currentLocation["folders"]) {
          //folder matches object key
          folderPath.push(folderArray[i]);
          duplicateFolders.push(originalFolderName);
        } else {
          if (originalFolderName in importedFolders) {
            folderPath.push(folderArray[i]);
            duplicateFolders.push(originalFolderName);
          } else {
            if (nonallowedFolderArray.includes(folderArray[i])) {
              if (action !== "ignore" && action !== "") {
                if (action === "remove") {
                  renamedFolderName = removeIrregularFolders(folderArray[i]);
                } else if (action === "replace") {
                  renamedFolderName = replaceIrregularFolders(folderArray[i]);
                }
                importedFolders[renamedFolderName] = {
                  path: folderArray[i],
                  "original-basename": originalFolderName,
                };
              }
            } else {
              importedFolders[originalFolderName] = {
                path: folderArray[i],
                "original-basename": originalFolderName,
              };
            }
          }
        }

        if (nonallowedFolderArray.includes(folderArray[i])) {
          if (action !== "ignore" && action !== "") {
            if (action === "remove") {
              renamedFolderName = removeIrregularFolders(folderArray[i]);
            } else if (action === "replace") {
              renamedFolderName = replaceIrregularFolders(folderArray[i]);
            }
            importedFolders[renamedFolderName] = {
              path: folderArray[i],
              "original-basename": originalFolderName,
            };
          }
        } else {
          var listElements = showItemsAsListBootbox(duplicateFolders);
          var list = JSON.stringify(folderPath).replace(/"/g, "");
          if (duplicateFolders.length > 0) {
            Swal.fire({
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
        }
      }

      if (Object.keys(importedFolders).length > 0) {
        for (var element in importedFolders) {
          currentLocation["folders"][element] = {
            type: "local",
            path: importedFolders[element]["path"],
            folders: {},
            files: {},
            action: ["new"],
          };
          populateJSONObjFolder(
            action,
            currentLocation["folders"][element],
            importedFolders[element]["path"]
          );
          // check if a folder has to be renamed due to duplicate reason
          if (element !== importedFolders[element]["original-basename"]) {
            currentLocation["folders"][element]["action"].push("renamed");
          }
        }
        // $("#items").empty();
        listItems(currentLocation, "#items", 500, (reset = true));
        getInFolder(".single-item", "#items", globals.organizeDSglobalPath, datasetStructureJSONObj);
        beginScrollListen();
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

        // log the success
        logCurationForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          ["Step 3", "Import", "Folder"],
          determineDatasetLocation()
        );
      }
    }
  };




// SAVE FILE ORG
ipcRenderer.on("save-file-organization-dialog", (event) => {
    const options = {
      title: "Save File Organization",
      filters: [{ name: "JSON", extensions: ["json"] }],
    };
    dialog.showSaveDialog(null, options, (filename) => {
      event.sender.send("selected-saveorganizationfile", filename);
    });
  });



ipcRenderer.on("selected-local-destination-datasetCurate", async (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        globals.sodaJSONObj["starting-point"]["local-path"] = "";
        document.getElementById("input-destination-getting-started-locally").placeholder =
          filepath[0];
        if (
          globals.sodaJSONObj["starting-point"]["type"] === "local" &&
          globals.sodaJSONObj["starting-point"]["local-path"] == ""
        ) {
          valid_dataset = verify_sparc_folder(
            document.getElementById("input-destination-getting-started-locally").placeholder,
            "local"
          );
          if (valid_dataset == true) {
            var action = "";
            irregularFolderArray = [];
            var replaced = [];
            let finished = 0;
            detectIrregularFolders(path.basename(filepath[0]), filepath[0]);
            var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
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
                didOpen: () => {
                  $(".swal-popover").popover();
                },
                footer: footer,
              }).then(async (result) => {
                // var replaced = [];
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
                  document.getElementById("input-destination-getting-started-locally").placeholder =
                    "Browse here";
                  globals.sodaJSONObj["starting-point"]["local-path"] = "";
                  $("#para-continue-location-dataset-getting-started").text("");
                  return;
                }

                let numb = document.getElementById("local_dataset_number");
                numb.innerText = "0%";
                progressBar_rightSide = document.getElementById("left-side_less_than_50");
                progressBar_leftSide = document.getElementById("right-side_greater_than_50");
                progressBar_rightSide.style.transform = `rotate(0deg)`;
                progressBar_leftSide.style.transform = `rotate(0deg)`;
                document.getElementById("loading_local_dataset").style.display = "block";
                globals.sodaJSONObj["starting-point"]["local-path"] = filepath[0];

                let root_folder_path = $("#input-destination-getting-started-locally").attr(
                  "placeholder"
                );

                let local_progress = setInterval(progressReport, 500);
                async function progressReport() {
                  try {
                    let monitorProgressResponse = await client.get(
                      `/organize_datasets/datasets/import/progress`
                    );

                    let { data } = monitorProgressResponse;
                    percentage_amount = data["progress_percentage"].toFixed(2);
                    finished = data["create_soda_json_completed"];

                    progressBar_rightSide = document.getElementById("left-side_less_than_50");
                    progressBar_leftSide = document.getElementById("right-side_greater_than_50");

                    numb.innerText = percentage_amount + "%";
                    if (percentage_amount <= 50) {
                      progressBar_rightSide.style.transform = `rotate(${
                        percentage_amount * 0.01 * 360
                      }deg)`;
                    } else {
                      progressBar_rightSide.style.transition = "";
                      progressBar_rightSide.classList.add("notransition");
                      progressBar_rightSide.style.transform = `rotate(180deg)`;
                      progressBar_leftSide.style.transform = `rotate(${
                        percentage_amount * 0.01 * 180
                      }deg)`;
                    }

                    if (finished === 1) {
                      progressBar_leftSide.style.transform = `rotate(180deg)`;
                      numb.innerText = "100%";
                      clearInterval(local_progress);
                      progressBar_rightSide.classList.remove("notransition");
                      populate_existing_folders(datasetStructureJSONObj);
                      populate_existing_metadata(globals.sodaJSONObj);
                      $("#para-continue-location-dataset-getting-started").text(
                        "Please continue below."
                      );
                      $("#nextBtn").prop("disabled", false);
                      // log the success to analytics
                      logMetadataForAnalytics(
                        "Success",
                        PrepareDatasetsAnalyticsPrefix.CURATE,
                        AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                        Actions.EXISTING,
                        Destinations.LOCAL
                      );
                      setTimeout(() => {
                        document.getElementById("loading_local_dataset").style.display = "none";
                      }, 1000);
                    }
                  } catch (error) {
                    clientError(error);
                    clearInterval(local_progress);
                  }
                }
                //create setInterval variable that will keep track of the iterated items
              });
            } else {
              document.getElementById("loading_local_dataset").style.display = "block";
              progressBar_rightSide = document.getElementById("left-side_less_than_50");
              progressBar_leftSide = document.getElementById("right-side_greater_than_50");
              progressBar_leftSide.style.transform = `rotate(0deg)`;
              progressBar_rightSide.style.transform = `rotate(0deg)`;
              let numb = document.getElementById("local_dataset_number");
              numb.innerText = "0%";

              action = "";
              globals.sodaJSONObj["starting-point"]["local-path"] = filepath[0];
              let root_folder_path = $("#input-destination-getting-started-locally").attr(
                "placeholder"
              );

              let percentage_amount = 0;
              let local_progress = setInterval(progressReport, 500);
              async function progressReport() {
                try {
                  let monitorProgressResponse = await client.get(
                    `/organize_datasets/datasets/import/progress`
                  );

                  let { data } = monitorProgressResponse;
                  percentage_amount = data["progress_percentage"].toFixed(2);
                  finished = data["create_soda_json_completed"];
                  progressBar_rightSide = document.getElementById("left-side_less_than_50");
                  progressBar_leftSide = document.getElementById("right-side_greater_than_50");

                  numb.innerText = percentage_amount + "%";
                  if (percentage_amount <= 50) {
                    progressBar_rightSide.style.transform = `rotate(${
                      percentage_amount * 0.01 * 360
                    }deg)`;
                  } else {
                    progressBar_rightSide.style.transition = "";
                    progressBar_rightSide.classList.add("notransition");
                    progressBar_rightSide.style.transform = `rotate(180deg)`;
                    progressBar_leftSide.style.transform = `rotate(${
                      percentage_amount * 0.01 * 180
                    }deg)`;
                  }
                  if (finished === 1) {
                    progressBar_leftSide.style.transform = `rotate(180deg)`;
                    numb.innerText = "100%";

                    clearInterval(local_progress);
                    progressBar_rightSide.classList.remove("notransition");
                    populate_existing_folders(datasetStructureJSONObj);
                    populate_existing_metadata(globals.sodaJSONObj);
                    $("#para-continue-location-dataset-getting-started").text(
                      "Please continue below."
                    );
                    $("#nextBtn").prop("disabled", false);
                    // log the success to analytics
                    logMetadataForAnalytics(
                      "Success",
                      PrepareDatasetsAnalyticsPrefix.CURATE,
                      AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
                      Actions.EXISTING,
                      Destinations.LOCAL
                    );
                    setTimeout(() => {
                      document.getElementById("loading_local_dataset").style.display = "none";
                    }, 1000);
                  }
                } catch (error) {
                  clientError(error);
                  clearInterval(local_progress);
                }
              }

              try {
                let importLocalDatasetResponse = await client.post(
                  `/organize_datasets/datasets/import`,
                  {
                    sodajsonobject: globals.sodaJSONObj,
                    root_folder_path: root_folder_path,
                    irregular_folders: irregularFolderArray,
                    replaced: replaced,
                  },
                  { timeout: 0 }
                );
                let { data } = importLocalDatasetResponse;
                sodajsonobject = data;
                datasetStructureJSONObj = sodajsonobject["dataset-structure"];
              } catch (error) {
                clientError(error);
                clearInterval(local_progress);
              }
            }
          } else {
            Swal.fire({
              icon: "warning",
              html: `This folder seem to have non-SPARC folders. Please select a folder that has a valid SPARC dataset structure.
                <br/>
                See the "Data Organization" section of the SPARC documentation for more
                <a a target="_blank" href="https://sparc.science/help/3FXikFXC8shPRd8xZqhjVT#top"> details</a>`,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showConfirmButton: false,
              showCancelButton: true,
              focusCancel: true,
              cancelButtonText: "Okay",
              reverseButtons: reverseSwalButtons,
              showClass: {
                popup: "animate__animated animate__zoomIn animate__faster",
              },
              hideClass: {
                popup: "animate__animated animate__zoomOut animate__faster",
              },
            }).then((result) => {
              if (result.isConfirmed) {
              } else {
                document.getElementById("input-destination-getting-started-locally").placeholder =
                  "Browse here";
                globals.sodaJSONObj["starting-point"]["local-path"] = "";
                $("#para-continue-location-dataset-getting-started").text("");
              }
            });

            // log the failure to select an appropriate folder to analytics
            logMetadataForAnalytics(
              "Error",
              PrepareDatasetsAnalyticsPrefix.CURATE,
              AnalyticsGranularity.ALL_LEVELS,
              Actions.EXISTING,
              Destinations.LOCAL
            );
          }
        }
      }
    } else {
      document.getElementById("nextBtn").disabled = true;
      $("#para-continue-location-dataset-getting-started").text("");
    }
  });

  ipcRenderer.on("guided-selected-local-destination-datasetCurate", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        globals.sodaJSONObj["starting-point"]["local-path"] = "";
        globals.sodaJSONObj["starting-point"]["type"] = "local";

        $("#guided-input-destination-getting-started-locally").val(filepath[0]);
        $(".guidedDatasetPath").text(filepath[0]);

        valid_dataset = verify_sparc_folder(filepath[0]);
        if (valid_dataset == true) {
          var action = "";
          irregularFolderArray = [];
          detectIrregularFolders(path.basename(filepath[0]), filepath[0]);
          var footer = `<a style='text-decoration: none !important' class='swal-popover' data-content='A folder name cannot contains any of the following special characters: <br> ${nonAllowedCharacters}' rel='popover' data-html='true' data-placement='right' data-trigger='hover'>What characters are not allowed?</a>`;
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
              didOpen: () => {
                $(".swal-popover").popover();
              },
              footer: footer,
            }).then((result) => {
              /* Read more about isConfirmed, isDenied below */
              if (result.isConfirmed) {
                action = "replace";
              } else if (result.isDenied) {
                action = "remove";
              } else {
                $("#guided-input-destination-getting-started-locally").val("Browse here");
                globals.sodaJSONObj["starting-point"]["local-path"] = "";
                $("#para-continue-location-dataset-getting-started").text("");
                return;
              }
              globals.sodaJSONObj["starting-point"]["local-path"] = filepath[0];

              let root_folder_path = $("#guided-input-destination-getting-started-locally").val();

              create_json_object(action, globals.sodaJSONObj, root_folder_path);
              datasetStructureJSONObj = globals.sodaJSONObj["dataset-structure"];
              populate_existing_folders(datasetStructureJSONObj);
              populate_existing_metadata(globals.sodaJSONObj);
              enableProgressButton();
            });
          } else {
            action = "";
            let root_folder_path = $("#guided-input-destination-getting-started-locally").val();
            globals.sodaJSONObj["starting-point"]["local-path"] = filepath[0];
            create_json_object(action, globals.sodaJSONObj, root_folder_path);
            datasetStructureJSONObj = globals.sodaJSONObj["dataset-structure"];
            populate_existing_folders(datasetStructureJSONObj);
            populate_existing_metadata(globals.sodaJSONObj);
          }
        } else {
          Swal.fire({
            icon: "warning",
            html: `This folder does not seems to include any SPARC folders. Please select a folder that has a valid SPARC dataset structure.
                <br/>
                If you are trying to create a new dataset folder, select the 'Prepare a new dataset' option.`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showConfirmButton: false,
            showCancelButton: true,
            focusCancel: true,
            cancelButtonText: "Okay",
            reverseButtons: reverseSwalButtons,
            showClass: {
              popup: "animate__animated animate__zoomIn animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__zoomOut animate__faster",
            },
          }).then((result) => {
            if (result.isConfirmed) {
            } else {
              $("#guided-input-destination-getting-started-locally").val("Browse here");
              $(".guidedDatasetPath").text("");
              globals.sodaJSONObj["starting-point"]["local-path"] = "";
            }
          });
        }
      }
    } else {
    }
  });


ipcRenderer.on("selected-local-destination-datasetCurate-generate", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        $("#div-confirm-destination-locally").css("display", "flex");
        $("#div-confirm-destination-locally button").show();
        document.getElementById("input-destination-generate-dataset-locally").placeholder =
          filepath[0];
        document.getElementById("input-destination-generate-dataset-locally").value = filepath[0];
        document.getElementById("nextBtn").disabled = true;
      } else {
        $("#div-confirm-destination-locally").css("display", "none");
        $("#div-confirm-destination-locally button").hide();
        document.getElementById("input-destination-generate-dataset-locally").placeholder =
          "Browse here";
      }
    } else {
      $("#div-confirm-destination-locally").css("display", "none");
      $("#div-confirm-destination-locally button").hide();
      document.getElementById("input-destination-generate-dataset-locally").placeholder =
        "Browse here";
    }
  });


ipcRenderer.on("selected-metadataCurate", (event, mypath) => {
    if (mypath.length > 0) {
      var dotCount = path.basename(mypath[0]).trim().split(".").length - 1;
      if (dotCount === 1) {
        var metadataWithoutExtension = path
          .basename(mypath[0])
          .slice(0, path.basename(mypath[0]).indexOf("."));
        var extension = path.basename(mypath[0]).slice(path.basename(mypath[0]).indexOf("."));

        let file_size = 0;

        try {
          if (fs.existsSync(mypath[0])) {
            let stats = fs.statSync(mypath[0]);
            file_size = stats.size;
          }
        } catch (err) {
          console.error(err);
          document.getElementById(metadataParaElement).innerHTML =
            "<span style='color:red'>Your SPARC metadata file does not exist or is unreadable. Please verify that you are importing the correct metadata file from your system. </span>";

          return;
        }

        if (file_size == 0) {
          document.getElementById(metadataParaElement).innerHTML =
            "<span style='color:red'>Your SPARC metadata file is empty! Please verify that you are importing the correct metadata file from your system.</span>";

          return;
        }
        if (metadataWithoutExtension === metadataIndividualFile) {
          if (metadataAllowedExtensions.includes(extension)) {
            document.getElementById(metadataParaElement).innerHTML = mypath[0];
            if (metadataCurationMode === "free-form") {
              $($("#" + metadataParaElement).parents()[1])
                .find(".div-metadata-confirm")
                .css("display", "flex");
              $($("#" + metadataParaElement).parents()[1])
                .find(".div-metadata-go-back")
                .css("display", "none");
            }
            if (metadataCurationMode === "guided") {
              //Add success checkmark lottie animation inside metadata card
              const dragDropContainer = document.getElementById(metadataParaElement).parentElement;
              //get the value of data-code-metadata-file-type from dragDropContainer
              const metadataFileType = dragDropContainer.dataset.codeMetadataFileType;
              //save the path of the metadata file to the json object
              globals.sodaJSONObj["dataset-metadata"]["code-metadata"][metadataFileType] = mypath[0];

              const lottieContainer = dragDropContainer.querySelector(
                ".code-metadata-lottie-container"
              );
              lottieContainer.innerHTML = "";
              lottie.loadAnimation({
                container: lottieContainer,
                animationData: successCheck,
                renderer: "svg",
                loop: false,
                autoplay: true,
              });
            }
          } else {
            document.getElementById(metadataParaElement).innerHTML =
              "<span style='color:red'>Your SPARC metadata file must be in one of the formats listed above!</span>";
          }
        } else {
          document.getElementById(metadataParaElement).innerHTML =
            "<span style='color:red'>Your SPARC metadata file must be named and formatted exactly as listed above!</span>";
        }
      }
    }
  });


ipcRenderer.on("selected-manifest-folder", async (event, result) => {
    if (!result["canceled"]) {
      $("body").addClass("waiting");
      let manifest_destination = result["filePaths"][0];
      let manifest_state = {};

      if ("manifest-files" in globals.sodaJSONObj) {
        manifest_state = globals.sodaJSONObj["manifest-files"];
        globals.sodaJSONObj["manifest-files"]["local-destination"] = manifest_destination;
      } else {
        manifest_state = {};
        globals.sodaJSONObj["manifest-files"] = {};
        globals.sodaJSONObj["manifest-files"]["local-destination"] = manifest_destination;
      }

      delete_imported_manifest();

      let temp_sodaJSONObj = JSON.parse(JSON.stringify(globals.sodaJSONObj));
      let dataset_name = "Undetermined";

      recursive_remove_deleted_files(temp_sodaJSONObj["dataset-structure"]);

      if ("bf-dataset-selected" in globals.sodaJSONObj) {
        if ("dataset-name" in globals.sodaJSONObj) {
          dataset_name = globals.sodaJSONObj["bf-dataset-selected"]["dataset-name"];
        }
      }

      try {
        await client.post(
          `/curate_datasets/manifest_files`,
          {
            generate_purpose: "",
            soda_json_object: temp_sodaJSONObj,
          },
          { timeout: 0 }
        );

        $("body").removeClass("waiting");
        logCurationForAnalytics(
          "Success",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          ["Step 5", "Generate", "Manifest"],
          determineDatasetLocation()
        );
      } catch (error) {
        clientError(error);
        $("body").removeClass("waiting");

        // log the error to analytics
        logCurationForAnalytics(
          "Error",
          PrepareDatasetsAnalyticsPrefix.CURATE,
          AnalyticsGranularity.ACTION_AND_ACTION_WITH_DESTINATION,
          ["Step 5", "Generate", "Manifest"],
          determineDatasetLocation()
        );
      }
    }
  });
