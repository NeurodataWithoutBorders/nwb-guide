import { describe, expect, test } from "vitest";
import { preprocessMetadataSchema } from "../src/schemas/base-metadata.schema";
import processSubjectSchema from "../src/schemas/subject.schema";

// import '../src/schemas/source-data.schema'

describe("Check changes to the Subject schema", () => {

    const baseSchema = preprocessMetadataSchema()

    const schema = processSubjectSchema(baseSchema)

    test("Check sessions property is added to the Subject schema", () => {
        expect(schema.properties.sessions).toBeDefined()
        expect(schema.required.includes("sessions")).toBe(true)
    })

    test("Check that the Subject schema is sorted correctly", () => {

        const desiredOrder = [
            "sessions",
            "subject_id",
            "sex",
            "species",
            "age",
            "age__reference",
            "date_of_birth",
            "genotype",
            "strain",
            "description",
            "weight",
        ]

        const sortedKeys = Object.keys(schema.properties)

        expect(sortedKeys).toEqual(desiredOrder)

    })
})