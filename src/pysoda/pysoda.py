# -*- coding: utf-8 -*-

# python module for Software for Organizing Data Automatically (SODA)
import os ## Since some functions are not available on all OS
import platform
from os import listdir, stat, makedirs, mkdir
from os.path import isdir, isfile, join, splitext, getmtime, basename, normpath, exists, expanduser, split, dirname
import pandas as pd
from time import strftime, localtime
from shutil import copy2
from blackfynn import Blackfynn
from configparser import ConfigParser
import threading
from glob import glob
import json
from pandas.io.html import read_html
import numpy as np
import collections
import subprocess
import shutil

### Global variables
curateprogress = ' '
curatestatus = ' '
curateprintstatus = ' '

userpath = expanduser("~")
configpath = join(userpath, '.blackfynn', 'config.ini')
submitdataprogress = ' '
submitdatastatus = ' '
submitprintstatus = ' '

### FEATURE #1: SPARC dataset organizer
# Organize dataset
def savefileorganization(jsonpath, jsondescription, pathsavefileorganization):
    try:
        mydict = jsonpath
        mydict2 = jsondescription
        mydict.update(mydict2)
        dictkeys = list(mydict.keys())
        dictkeys.sort()
        df = pd.DataFrame(columns=[dictkeys[0]])
        df[dictkeys[0]] = mydict[dictkeys[0]]
        for i in range(1,len(dictkeys)):
            dfnew = pd.DataFrame(columns=[dictkeys[i]])
            dfnew[dictkeys[i]] = mydict[dictkeys[i]]
            df = pd.concat([df, dfnew], axis=1)
        df = df.replace(np.nan, '', regex=True)
        csvsavepath = join(pathsavefileorganization)
        df.to_csv(csvsavepath, index = None, header=True)
        return 'Saved!'
    except Exception as e:
        raise e

compare = lambda x, y: collections.Counter(x) == collections.Counter(y)
def uploadfileorganization(pathuploadfileorganization, headernames):
    try:
        csvsavepath = join(pathuploadfileorganization)
        df = pd.read_csv(csvsavepath)
        dfnan = df.isnull()
        mydict = {}
        dictkeys = df.columns
        if not compare(dictkeys, headernames):
            raise Exception("Error: Please select a valid file")
        rowcount = len(df.index)
        for i in range(len(dictkeys)):
            pathvect = []
            for j in range(rowcount):
                pathval = df.at[j, dictkeys[i]]
                if not dfnan.at[j, dictkeys[i]]:
                    pathvect.append(pathval)
                else:
                    pathvect.append("")
            mydict[dictkeys[i]] = pathvect
        return mydict
    except Exception as e:
        raise e

def previewfileorganization(jsonpath):
    mydict = jsonpath
    userpath = expanduser("~")
    preview_path = join(userpath, "SODA", "Preview")
    try:
        makedirs(preview_path)
    except:
        raise Exception("Preview Folder already present, click on 'Delete Preview Folder' option to get rid of the older vesion")

    folderrequired = []
    for i in mydict.keys():
        if mydict[i] != []:
            folderrequired.append(i)
            if i != 'main':
                makedirs(join(preview_path, i))

    for i in folderrequired:
        paths = mydict[i]
        if (i == 'main'):
            preview_folder_structure(paths, join(preview_path))
        else:
            preview_folder_structure(paths, join(preview_path, i))
    open_file(preview_path)
    return preview_path

def open_file(file_path):
    """
    Opening folder on all platforms
    https://stackoverflow.com/questions/6631299/python-opening-a-folder-in-explorer-nautilus-mac-thingie
    """
    if platform.system() == "Windows":
        subprocess.Popen(r'explorer /select,' + str(file_path))
    elif platform.system() == "Darwin":
        subprocess.Popen(["open", file_path])
    else:
        subprocess.Popen(["xdg-open", file_path])

def preview_folder_structure(paths, folder_path):
    for p in paths:
        if isfile(p):
            file = basename(p)
            open(join(folder_path, file), 'a').close()
        else:
            all_files = listdir(p)
            all_files_path = []
            for f in all_files:
                all_files_path.append(join(p, f))

            # print(folder_path)
            pname = basename(p)
            # print(join(folder_path, p))
            new_folder_path = join(folder_path, pname)
            # print(pname)
            # print(new_folder_path)
            makedirs(new_folder_path)
            preview_folder_structure(all_files_path, new_folder_path)
    return

def deletePreviewFileOrganization():
    userpath = expanduser("~")
    preview_path = join(userpath, "SODA")
    shutil.rmtree(preview_path)
    return

### FEATURE #2: SPARC metadata generator

def curatedataset2(pathdataset, createnewstatus, pathnewdataset, \
        manifeststatus, submissionstatus, pathsubmission, datasetdescriptionstatus, pathdescription, \
        subjectsstatus, pathsubjects, samplesstatus, pathsamples, jsonpath, jsondescription, modifyexistingstatus, bfdirectlystatus, 
        alreadyorganizedstatus, organizedatasetstatus, newdatasetname):

    global curateprogress
    global curatestatus
    global curateprintstatus
    curateprogress = ' '
    curatestatus = ''
    curateprintstatus = ' '
    error = ''
    c = 0

    if alreadyorganizedstatus:
        if not isdir(pathdataset):
            curatestatus = 'Done'
            raise Exception('Error: Please select a valid dataset folder')

    if createnewstatus:
        if not isdir(pathnewdataset):
            curatestatus = 'Done'
            raise Exception('Error: Please select a valid folder for new dataset')
 
    if submissionstatus:
        if not isfile(pathsubmission):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for submission file\n'
            c += 1
        # Adding check for correct file name
        if splitext(basename(pathsubmission))[0] != 'submission':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for submission file\n' 
            c += 1

    if datasetdescriptionstatus:
        if not isfile(pathdescription):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for dataset description file\n'
            c += 1
        # Adding check for correct file name
        if splitext(basename(pathdescription))[0] != 'dataset_description':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for dataset_description file\n'
            c += 1

    if subjectsstatus:
        if not isfile(pathsubjects):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for subjects file\n'
            c += 1
        # Adding check for correct file name
        if splitext(basename(pathsubjects))[0] != 'subjects':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for subjects file\n'
            c += 1

    if samplesstatus:
        if not isfile(pathsamples):
            curatestatus = 'Done'
            error = error + 'Error: Select valid path for samples file\n'
            c += 1
        # Adding check for correct file name
        if splitext(basename(pathsamples))[0] != 'samples':
            curatestatus = 'Done'
            error = error + 'Error: Select valid name for samples file\n'
            c += 1
    if c > 0:
        raise Exception(error)

    # check if path in jsonpath are valid
    c = 0
    error = ''
    for folders in jsonpath.keys():
        if jsonpath[folders] != []: 
            for path in jsonpath[folders]:
                if not exists(path):
                    c += 1
                    error = error + path + ' does not exist \n'

    if c > 0:
        error = error + '\n'
        error = error + 'Please remove invalid paths'
        curatestatus = 'Done'
        raise Exception(error)   
        
    #get list of file in pathnewdataset
    # see if any of submission, dataset_description, subjects, samples exist
    # Show error 'File xxx already exists at target location: either delete or select "None" in the SODA interface'
    if modifyexistingstatus:
        # c = 0
        # error = ''
        # for i in glob(pathdataset + '\*'):
        #     if i == pathdataset + '\submission.xlsx' and submissionstatus:
        #         error = error + 'submission file already present\n'
        #         c += 1
        #     if i == pathdataset + '\dataset_description.xlsx' and datasetdescriptionstatus:
        #         error = error + 'dataset_description file already present\n'
        #         c += 1
        #     if i == pathdataset + '\samples.xlsx' and samplesstatus:
        #         error = error + 'samples file already present\n'
        #         c += 1
        #     if i == pathdataset + '\subjects.xlsx' and subjectsstatus:
        #         error = error + 'subjects file already present\n'
        #         c += 1

        c = 0
        error = ''
        namefiles = [f for f in listdir(pathdataset) if isfile(join(pathdataset, f))]
        if 'submission.xlsx' in namefiles and submissionstatus:
            error = error + 'submission file already present\n'
            c += 1
        if 'dataset_description.xlsx' in namefiles and datasetdescriptionstatus:
            error = error + 'dataset_description file already present\n'
            c += 1
        if  'samples.xlsx' in namefiles and samplesstatus:
            error = error + 'samples file already present\n'
            c += 1
        if  'subjects.xlsx' in namefiles and subjectsstatus:
            error = error + 'subjects file already present\n'
            c += 1

        if c > 0:
            error = error + ''
            error = error + 'Either delete or select "None" in the SODA interface'
            curatestatus = 'Done'
            raise Exception(error)

        else:
            try:
                curateprogress = 'Started'
                curateprintstatus = 'Curating'

                curateprogress = curateprogress + ', ,' + "New dataset not requested"

                if manifeststatus:
                    createmanifestwithdescription(pathdataset, jsonpath, jsondescription)
                    curateprogress = curateprogress + ', ,' + 'Manifest created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Manifest not requested'

                if submissionstatus:
                    copyfile(pathsubmission, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Submission file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Submission file not requested'

                if datasetdescriptionstatus:
                    copyfile(pathdescription, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Dataset description file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Dataset description file not requested'

                if subjectsstatus:
                    copyfile(pathsubjects, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Subjects file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Subjects file not requested'

                if samplesstatus:
                    copyfile(pathsamples, pathdataset)
                    curateprogress = curateprogress + ', ,' + 'Samples file created'
                else:
                    curateprogress = curateprogress + ', ,' + 'Samples file not requested'

                curateprogress = curateprogress + ', ,' + 'Success: COMPLETED!'
                curatestatus = 'Done'

            except Exception as e:
                curatestatus = 'Done'
                raise e


    elif createnewstatus:
        try:
            pathnewdatasetfolder = join(pathnewdataset, newdatasetname)
        except Exception as e:
            curatestatus = 'Done'
            raise e
        try:  
            
            pathnewdatasetfolder  = return_new_path(pathnewdatasetfolder)
            curateprogress = 'Started'
            curateprintstatus = 'Curating'

            pathdataset = pathnewdatasetfolder
            mkdir(pathdataset)

            createdataset2(jsonpath, pathdataset)
            curateprogress = curateprogress + ', ,' + 'New dataset created'

            if manifeststatus:
                createmanifestwithdescription(pathdataset, jsonpath, jsondescription)
                curateprogress = curateprogress + ', ,' + 'Manifest created'
            else:
                curateprogress = curateprogress + ', ,' + 'Manifest not requested'

            if submissionstatus:
                copyfile(pathsubmission, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Submission file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Submission file not requested'

            if datasetdescriptionstatus:
                copyfile(pathdescription, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Dataset description file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Dataset description file not requested'

            if subjectsstatus:
                copyfile(pathsubjects, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Subjects file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Subjects file not requested'

            if samplesstatus:
                copyfile(pathsamples, pathdataset)
                curateprogress = curateprogress + ', ,' + 'Samples file created'
            else:
                curateprogress = curateprogress + ', ,' + 'Samples file not requested'

            curateprogress = curateprogress + ', ,' + 'Success: COMPLETED!'
            curatestatus = 'Done'

        except Exception as e:
            curatestatus = 'Done'
            raise e



def curatedatasetprogress():
    global curateprogress
    global curatestatus
    global curateprintstatus
    return (curateprogress, curatestatus, curateprintstatus)


def createmanifestwithdescription(datasetpath, jsonpath, jsondescription):

    # Get the names of all the subfolder in the dataset
    folders = list(jsonpath.keys())
    if 'main' in folders:
        folders.remove('main')
    # In each subfolder, generate a manifest file
    for folder in folders:
        if (jsonpath[folder] != []):

            # Initialize dataframe where manifest info will be stored
            df = pd.DataFrame(columns=['filename', 'timestamp', 'description',
                                    'file type', 'Additional Metadata…'])
            # Get list of files/folders in the the folde#
            # Remove manifest file from the list if already exists
            folderpath = join(datasetpath, folder)
            allfiles = jsonpath[folder]
            alldescription = jsondescription[folder + '_description']
            manifestexists = join(folderpath, 'manifest.xlsx')

            countpath = -1
            for pathname in allfiles:
                countpath += 1
                if basename(pathname) == 'manifest.xlsx':
                    allfiles.pop(countpath)
                    alldescription.pop(countpath)

            # if manifestexists in allfiles:
            #     allfiles.remove(manifestexists)

            # Populate manifest dataframe
            filename = []
            timestamp = []
            filetype = []
            filedescription = []
            countpath = -1
            for filepath in allfiles:
                countpath += 1
                file = basename(filepath)
                filename.append(splitext(file)[0])
                lastmodtime = getmtime(filepath)
                timestamp.append(strftime('%Y-%m-%d %H:%M:%S',
                                          localtime(lastmodtime)))
                filedescription.append(alldescription[countpath])
                if isdir(filepath):
                    filetype.append('folder')
                else:
                    fileextension = splitext(file)[1]
                    if not fileextension:  #if empty (happens for Readme files)
                        fileextension = 'None'
                    filetype.append(fileextension)

            df['filename'] = filename
            df['timestamp'] = timestamp
            df['file type'] = filetype
            df['description'] = filedescription


            # Save manifest as Excel sheet
            manifestfile = join(folderpath, 'manifest.xlsx')
            df.to_excel(manifestfile, index=None, header=True)

# jpath = {}
# jpath['code'] = [ r'/Users/bpatel/Desktop/manifest.xlsx', r'/Users/bpatel/Desktop/save2.csv', r'/Users/bpatel/Desktop/save.csv']
# jdes = {}
# jdes['code_description'] = ['', 'save2des', 'savedes']
# deskpath = r'/Users/bpatel/Desktop/new-datasets'
# createmanifestwithdescription(deskpath, jpath, jdes)


def createdataset2(jsonpath, pathdataset):
    mydict = jsonpath
    userpath = expanduser("~")
    preview_path = pathdataset

    folderrequired = []
    for i in mydict.keys():
        if mydict[i] != []:
            folderrequired.append(i)
            if i != 'main':
                makedirs(join(preview_path, i))

    for i in folderrequired:
        for path in mydict[i]:
            if (i == 'main'):
                create_new_file(path, join(pathdataset))
            else:
                create_new_file(path, join(pathdataset, i))

def create_new_file(path, folder_path):
    if isfile(path):
        copyfile(path, folder_path)
    elif isdir(path):
        foldername = basename(path)
        copytree(path, join(folder_path, foldername))


def return_new_path(topath):
    """
    This function checks if the folder already exists and in such cases, appends the name with (2) or (3) etc.
    """
    if exists(topath):
        for i in range(2, 20001):
            if not exists(topath + ' (' + str(i) + ')'):
                return topath + ' (' + str(i) + ')'
    else:
        return topath

def copytree(src, dst, symlinks=False, ignore=None):
    if not exists(dst):
        makedirs(dst)
    for item in listdir(src):
        s = join(src, item)
        d = join(dst, item)
        if isdir(s):
            copytree(s, d, symlinks, ignore)
        else:
            if not exists(d) or stat(s).st_mtime - stat(d).st_mtime > 1:
                copy2(s, d)

def copyfile(src, dst):
    copy2(src, dst)


### FEATURE #4: SODA Blackfynn interface
# Log in to Blackfynn
def bfaddaccount(keyname, key, secret):
    error, c = '', 0
    keyname = keyname.strip()
    if (not keyname) or (not key) or (not secret):
        raise Exception('Error: Please enter valid keyname, key, and/or secret')

    if (keyname.isspace()) or (key.isspace()) or (secret.isspace()):
        raise Exception('Error: Please enter valid keyname, key, and/or secret')

    bfpath = join(userpath, '.blackfynn')
    #Load existing or create new config file
    config = ConfigParser()
    if exists(configpath):
        config.read(configpath)
        if config.has_section(keyname):
            raise Exception('Error: Key name already exists')
    else:
        if not exists(bfpath):
            mkdir(bfpath)
        if not exists(join(bfpath, 'cache')):
            mkdir(join(bfpath, 'cache'))

    #Add new account
    config.add_section(keyname)
    config.set(keyname, 'api_token', key)
    config.set(keyname, 'api_secret', secret)

    with open(configpath, 'w') as configfile:
        config.write(configfile)

    #Check key and secret are valid, if not delete account from config
    try:
        bf = Blackfynn(keyname)
        with open(configpath, 'w') as configfile:
            config.write(configfile)
        return 'Sucesss: added account ' + str(bf)
    except:
        bfdeleteaccount(keyname)
        raise Exception('Authentication Error: please check that key name, key, and secret are entered properly')

def bfdeleteaccount(keyname):
    config = ConfigParser()
    config.read(configpath)
    config.remove_section(keyname)
    with open(configpath, 'w') as configfile:
        config.write(configfile)

def bfaccountlist():
    accountlist = ['Select']
    if exists(configpath):
        config = ConfigParser()
        config.read(configpath)
        accountname = config.sections()
        accountnamenoglobal = [n for n in accountname if n != "global"]
        if accountnamenoglobal:
            for n in accountnamenoglobal:
                try:
                    bfn = Blackfynn(n)
                    accountlist.append(n)
                except:
                    config.remove_section(n)
            with open(configpath, 'w') as configfile:
                config.write(configfile)

    return accountlist

# Visualize existing dataset in the selected account
def bfdatasetaccount(accountname):
    try:
        bf = Blackfynn(accountname)
        dataset_list = ['Select dataset']
        for ds in bf.datasets():
            dataset_list.append(ds.name)
        return dataset_list
    except Exception as e:
        raise e

# Add new empty dataset folder
def bfnewdatasetfolder(datasetname, accountname):
    error, c = '', 0
    datasetname = datasetname.strip()
    if (not datasetname):
        error = error + 'Error: Please enter valid dataset folder name'
        c += 1

    if (datasetname.isspace()):
        error = error + 'Error: Please enter valid dataset folder name'
        c += 1

    try:
        bf = Blackfynn(accountname)
    except Exception as e:
        error = error + 'Error: Please select a valid Blackfynn account'
        c += 1

    dataset_list = []
    for ds in bf.datasets():
        dataset_list.append(ds.name)
    if datasetname in dataset_list:
        error = error + 'Error: Dataset folder name already exists'
        c += 1
    else:
        bf.create_dataset(datasetname)
    if c>0:
        raise Exception(error)

# Submit dataset to selected account
def bfsubmitdataset(accountname, bfdataset, pathdataset):
    global submitdataprogress
    global submitdatastatus
    global submitprintstatus
    submitdataprogress = ' '
    submitdatastatus = ' '
    submitprintstatus = ' '
    error, c = '', 0

    try:
        bf = Blackfynn(accountname)
    except Exception as e:
        submitdatastatus = 'Done'
        error = error + 'Error: Please select a valid Blackfynn account'
        c += 1

    try:
        myds = bf.get_dataset(bfdataset)
    except Exception as e:
        submitdatastatus = 'Done'
        error = error + 'Error: Please select a valid Blackfynn dataset'
        c += 1

    if not isdir(pathdataset):
        #if not isdir(pathdataset):
        submitdatastatus = 'Done'
        error = error + 'Error: Please select a valid local dataset folder'
        c += 1
    if c>0:
        raise Exception(error)

    try:
        def calluploadfolder():
            global submitdataprogress
            global submitdatastatus
            submitdataprogress = "Started uploading to dataset %s \n" %(bfdataset)
            myds = bf.get_dataset(bfdataset)
            myfolder = myds.name
            mypath = pathdataset
            upload_structured_file(myds, mypath, myfolder)
            submitdataprogress = submitdataprogress + ', ,' + "Success: dataset and associated files have been uploaded"
            submitdatastatus = 'Done'

        submitprintstatus = 'Uploading'
        t = threading.Thread(target=calluploadfolder)
        t.start()
    except Exception as e:
        submitdatastatus = 'Done'
        raise e


def upload_structured_file(myds, mypath, myfolder):
    global submitdataprogress
    global submitdatastatus

    mypath = join(mypath)
    for f in listdir(mypath):
        if isfile(join(mypath, f)):
            submitdataprogress = submitdataprogress + ', ,' + "Uploading " + f + " in " + myfolder
            filepath = join(mypath, f)
            myds.upload(filepath)
            submitdataprogress = submitdataprogress + ',' + " uploaded"
        else:
            submitdataprogress = submitdataprogress + ', ,' +"Creating folder " + f
            mybffolder = myds.create_collection(f)
            myfolderpath = join(mypath, f)
            upload_structured_file(mybffolder, myfolderpath, f)

def submitdatasetprogress():
    global submitdataprogress
    global submitdatastatus
    global submitprintstatus
    return (submitdataprogress, submitdatastatus, submitprintstatus)

# Share dataset with Curation Team
