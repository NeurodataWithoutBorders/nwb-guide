import { Page } from "../../Page";

export class ManagedPage extends Page {
  constructor(...args) {
    super(...args);
  }

  getDetails = (path) => {
    let details = {};
    if (path.length !== 2) throw new Error("Path must have {subject}/{session} form.");
    try {
      const subSplit = path[0].split("-");
      const sesSplit = path[1].split("-");
      details.subject = subSplit.length === 2 ? subSplit[1] : subSplit[0];
      details.session = sesSplit.length === 2 ? sesSplit[1] : sesSplit[0];
    } catch (e) {
      throw new Error("Path must have {subject}/{session} form.");
    }
    return details;
  };
}
