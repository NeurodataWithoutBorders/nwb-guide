import { FilesystemSelector } from "./FileSystemSelector";

export default {
    title: "Components/Filesystem Selector",
};

const Template = (args) => new FilesystemSelector(args);

const types = ['file', 'directory']

export const File = Template.bind({});
export const Folder = Template.bind({});
Folder.args = {
    type: types[1],
};

export const FileMultiple = Template.bind({});
FileMultiple.args = { multiple: true };

export const FolderMultiple = Template.bind({});
FolderMultiple.args = {
    type: types[1],
    multiple: true,
};

export const Both = Template.bind({});
Both.args = {
    type: types,
};

export const BothMultiple = Template.bind({});
BothMultiple.args = {
    type: types,
    multiple: true,
};



