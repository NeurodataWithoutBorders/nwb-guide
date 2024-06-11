
import { get } from "dandi";
import dandiUploadSchema, { regenerateDandisets } from "../../../../../../schemas/dandi-upload.schema";

import { validateDANDIApiKey } from "../../../validation/dandi";
import { Modal } from "../../Modal";
import { header } from "../../forms/utils";

import { JSONSchemaInput } from "../../JSONSchemaInput";

import { Button } from "../../Button.js";
import { global } from "../../../progress/index.js";
import { merge } from "../utils";

import dandiGlobalSchema from "../../../../../../schemas/json/dandi/global.json";

export const isStaging = (id: string) => parseInt(id) >= 100000;


function isNumeric(str: string) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }


  export async function validate (name: string, parent: any) {

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
            const type = staging ? "staging" : undefined;
            const token = await getAPIKey.call(this, staging);

            const dandiset = await get(value, {
                type,
                token
             })

            if (dandiset.detail) {
                if (dandiset.detail.includes('Not found')) return [{
                    type: 'error',
                    message: `<b>Invalid ID –</b> This Dandiset does not exist.`
                }]

                if (dandiset.detail.includes('credentials were not provided')) return [{
                    type: 'warning',
                    message: `<b>Authentication error –</b> This is an embargoed Dandiset and you haven't provided the correct credentials.`
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


// this:
export async function getAPIKey(
    // this: Page,
    staging = false
) {

    const whichAPIKey = staging ? "development_api_key" : "main_api_key";
    const DANDI = global.data.DANDI;
    let api_key = DANDI?.api_keys?.[whichAPIKey];

    const errors = await validateDANDIApiKey(api_key, staging);

    const isInvalid = !errors || errors.length;

    if (isInvalid) {
        const modal = new Modal({
            header: `${api_key ? "Update" : "Provide"} your ${header(whichAPIKey)}`,
            open: true,
            onClose: () => modal.remove(),
        });

        const container = document.createElement("div");

        const input = new JSONSchemaInput({
            path: [whichAPIKey],
            schema: dandiGlobalSchema.properties.api_keys.properties[whichAPIKey],
        });

        container.append(input);

        container.style.padding = "25px";

        modal.append(container);

        let notification;

        const notify = (message, type) => {
            if (notification) this.dismiss(notification);
            return (notification = this.notify(message, type));
        };

        modal.onClose = async () => notify("The updated DANDI API key was not set", "error");

        api_key = await new Promise((resolve) => {
            const button = new Button({
                label: "Save",
                primary: true,
                onClick: async () => {
                    const value = input.value;
                    if (value) {
                        const errors = await validateDANDIApiKey(input.value, staging);
                        if (!errors || !errors.length) {
                            modal.remove();

                            merge(
                                {
                                    DANDI: {
                                        api_keys: {
                                            [whichAPIKey]: value,
                                        },
                                    },
                                },
                                global.data
                            );

                            global.save();
                            resolve(value);
                        } else {
                            notify(errors[0].message, "error");
                            return false;
                        }
                    } else {
                        notify("Your DANDI API key was not set", "error");
                    }
                },
            });

            modal.footer = button;

            document.body.append(modal);
        });

        await regenerateDandisets()
    }

    return api_key;
}
