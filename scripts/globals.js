
const { fs, app, path, log, port } = require('../src/electron/index.js').default
const exportObject = {}

exportObject.Tagify = require("@yaireo/tagify");
const DragSort = exportObject.DragSort = require("@yaireo/dragsort");

exportObject.tippy = require("tippy.js").default;
exportObject.lottie = require("lottie-web");

// ---------- NWB GUIDE Helpers ----------
const joinPath = exportObject.joinPath = (...args) => path?.join(...args);

exportObject.port = port;

// ---------- SODA Helper Functions ----------

// load and parse json file
exportObject.parseJson = (path) => {
  if (!fs?.existsSync(path)) {
    return {};
  }
  try {
    var content = fs.readFileSync(path);
    contentJson = JSON.parse(content);
    return contentJson;
  } catch (error) {
    log.error(error);
    console.log(error);
    return {};
  }
}

exportObject.createDragSort = (tagify) => {
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

// Global Progress Info
exportObject.sodaJSONObj = {};

exportObject.subjectsTableData = [];
exportObject.samplesTableData = [];

exportObject.datasetStructureJSONObj = {
  folders: {},
  files: {},
  type: "",
};

exportObject.guidedResetProgressVariables = () => {
  exportObject.sodaJSONObj = {};
  exportObject.datasetStructureJSONObj = {};
  exportObject.subjectsTableData = [];
  exportObject.samplesTableData = [];
}


exportObject.already_created_elem = [];
exportObject.listed_count = 0;
exportObject.start = 0;
exportObject.preprended_items = 0;
exportObject.amount = 500;

exportObject.resetLazyLoading = () => {
  already_created_elem = [];
  listed_count = 0;
  start = 0;
  preprended_items = 0;
  amount = 500;
};

///////////////////// Prepare Metadata Section ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const homeDirectory = exportObject.homeDirectory = app?.getPath("home") ?? '';

const metadataPath = exportObject.metadataPath = joinPath(homeDirectory, "SODA", "METADATA");
const awardFileName = exportObject.awardFileName = "awards.json";
const affiliationFileName = exportObject.affiliationFileName = "affiliations.json";
const milestoneFileName = exportObject.milestoneFileName = "milestones.json";
const airtableConfigFileName = exportObject.airtableConfigFileName = "airtable-config.json";
const protocolConfigFileName = exportObject.protocolConfigFileName = "protocol-config.json";
const awardPath = exportObject.awardPath = joinPath(metadataPath, awardFileName);
const affiliationConfigPath = exportObject.affiliationConfigPath = joinPath(metadataPath, affiliationFileName);
const milestonePath = exportObject.milestonePath = joinPath(metadataPath, milestoneFileName);
const airtableConfigPath = exportObject.airtableConfigPath = joinPath(metadataPath, airtableConfigFileName);
const progressFilePath = exportObject.progressFilePath = joinPath(homeDirectory, "SODA", "Progress");
const guidedProgressFilePath = exportObject.guidedProgressFilePath = joinPath(homeDirectory, "SODA", "Guided-Progress");
const guidedManifestFilePath = exportObject.guidedManifestFilePath = joinPath(homeDirectory, "SODA", "guided_manifest_files");
const protocolConfigPath = exportObject.protocolConfigPath = joinPath(metadataPath, protocolConfigFileName);
const allCollectionTags = exportObject.allCollectionTags = {};
const currentTags = exportObject.currentTags = {};
const currentCollectionTags = exportObject.currentCollectionTags = [];

module.exports = exportObject
