import { joinPath } from "../globals";
import { conversionSaveFolderPath, guidedProgressFilePath, previewSaveFolderPath } from "../dependencies/simple";
import { fs } from "../electron";

export const remove = (name) => {
    //Get the path of the progress file to delete
    const progressFilePathToDelete = joinPath(guidedProgressFilePath, name + ".json");

    //delete the progress file
    if (fs) fs.unlinkSync(progressFilePathToDelete);
    else localStorage.removeItem(progressFilePathToDelete);

    if (fs) {
        // delete default preview location
        fs.rmSync(joinPath(previewSaveFolderPath, name), { recursive: true, force: true });

        // delete default conversion location
        fs.rmSync(joinPath(conversionSaveFolderPath, name), { recursive: true, force: true });
    }

    return true;
};
