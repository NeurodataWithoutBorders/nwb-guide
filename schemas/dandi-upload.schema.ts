import upload from './json/dandi/upload.json' assert { type: "json" }


upload.properties.number_of_jobs.transform = upload.properties.number_of_threads.transform = (value, prevValue) => {
    if (value === 0){
        if (prevValue === -1) return 1
        else return -1
    }

    return value
}

export default upload
