
import { get } from "dandi";
import dandiUploadSchema from "../../../../../../schemas/dandi-upload.schema";
import { html } from "lit";

export const isStaging = (id: string) => parseInt(id) >= 100000;


function isNumeric(str: string) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }


  export const validate = async (name: string, parent: any) => {

    const value = parent[name]

    if (name === 'number_of_jobs' || name === 'number_of_threads') {
        if (value > 1) return [{
            type: 'warning',
            message: `<b>⚠️</b> Increasing the ${name.split('_').join(' ')} may result in unpredictable behaviors.`
        }]
    }

    if (name === 'dandiset' && value) {
        if (isNumeric(value)){

            if (value.length !== 6) return [{
                type: 'error',
                message: `<b>Invalid ID –</b> Dandiset ID must be 6 digits.`
            }]

            const staging = isStaging(value)

            const dandiset = await get(value, { type: staging ? "staging" : undefined })

            if (dandiset.detail) {
                if (dandiset.detail.includes('Not found')) return [{
                    type: 'error',
                    message: `<b>Invalid ID –</b> This Dandiset does not exist.`
                }]

                if (dandiset.detail.includes('credentials were not provided')) return [{
                    type: 'warning',
                    message: `<b>Authentication error –</b> This Dandiset does not appear to be linked to your account.`
                }]
            }

            // NOTE: This may not be thrown anymore with the above detail checks
            const { enum: enumValue } = dandiUploadSchema.properties.dandiset;
            if (enumValue && !enumValue.includes(value)) return [{
                type: 'error',
                message: `<b>No Access –</b> This Dandiset does not belong to you.`
            }]

            return true
        } else {
            return [{
                type: 'error',
                message: `<b>Dandiset not found –</b> Create a new Dandiset or enter a valid Dandiset ID.`
            }]
        }
    }
}

export const willCreate = (value: string) => !isNumeric(value)

// Regular expression to validate an NIH award number.
// Based on https://era.nih.gov/files/Deciphering_NIH_Application.pdf
// and https://era.nih.gov/erahelp/commons/Commons/understandGrantNums.htm
const NIH_AWARD_REGEX = /^\d \w+ \w{2} \d{6}-\d{2}([A|S|X|P]\d)?$/;

export function awardNumberValidator(awardNumber: string): boolean {
  return NIH_AWARD_REGEX.test(awardNumber);
}

export const AWARD_VALIDATION_FAIL_MESSAGE = 'Award number must be properly space-delimited.\n\nExample (exclude quotes):\n"1 R01 CA 123456-01A1"';
