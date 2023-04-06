
import { baseUrl } from '../globals';
import json from './validation.json' assert { type: "json" };

// NOTE: Only validation missing on NWBFile Metadata is check_subject_exists and check_processing_module_name

export const validateOnChange = async (name, parent, path) => {

    let functions = []

    const fullPath = [...path, name]
    functions = fullPath.reduce((acc, key) => acc[key], json)

    if (functions === undefined) {
      let lastWildcard;
      fullPath.reduce((acc,key) => {
        if (acc?.['*']) lastWildcard = acc['*'].replace(`{*}`, `${name}`)
        return acc[key]
      }, json)

      if (lastWildcard) functions = [lastWildcard]

    }


    if (!functions || functions.length === 0) return // No validation for this field
    if (!Array.isArray(functions)) functions = [functions]
    
    // Client-side validation of multiple conditions. May be able to offload this to a single server-side call
    const res = (await Promise.all(functions.map(async func => {
      return await fetch(`${baseUrl}/neuroconv/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent,
          function_name: func
        })
      }).then(res => res.json())
    }))).flat()


    if (res.find(res => res)) return res.filter(res => res).map(o => {
      return {
        message: o.message,
        type: o.importance === 'CRITICAL' ? 'error' : 'warning',
        missing: o.message.includes('is missing') // Indicates that the field is missing
      }
    }) // Some of the requests end in errors

    return true

  }
