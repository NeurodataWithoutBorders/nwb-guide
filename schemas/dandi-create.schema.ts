import create from './json/dandi/create.json' assert { type: "json" }
const schema = structuredClone(create)
delete schema.properties.embargo_status
delete schema.properties.nih_award_number

export default schema
