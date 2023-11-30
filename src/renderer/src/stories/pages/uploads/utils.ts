
import dandiUploadSchema from "../../../../../../schemas/dandi-upload.schema";

export const isStaging = (id: string) => parseInt(id) >= 100000;


function isNumeric(str: string) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }


  export const validate = (name: string, parent: any) => {

    const value = parent[name]
    if (name === 'dandiset' && value) {
        if (willCreate(value))  return [{
            type: 'warning',
            message: `This will create a new dandiset <b>${value}</b>`
        }]
        else if (isNumeric(value)){
            const { enum: enumValue } = dandiUploadSchema.properties.dandiset;
            if (enumValue && !enumValue.includes(value)) return [{
                type: 'error',
                message: `<b>Dandiset ID Not Found.</b> <br><small>Specify a Title to create a new Dandiset.</small>`
            }]
        }
    }
}

export const willCreate = (value: string) => !isNumeric(value)
