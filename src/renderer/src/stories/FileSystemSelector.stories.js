import { FilesystemSelector } from "./FileSystemSelector";

export default {
    title: "Components/Filesystem Selector",
};

const Template = (args) => new FilesystemSelector(args);

export const File = Template.bind({});
export const Folder = Template.bind({});
Folder.args = {
    type: "directory",
};

export const FileMultiple = Template.bind({});
FileMultiple.args = { multiple: true }

export const FolderMultiple = Template.bind({});
FolderMultiple.args = {
    type: "directory",
    multiple: true
};
