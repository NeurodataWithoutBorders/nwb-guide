
// NOTE: Taken from the conversion that our example Ecephys schema was extracted from

const validElectrode = {
    "inter_sample_shift": 0,
    "channel_name": "LF0",
    "group_name": "s0",
    "gain_to_uV": 9.375,
    "contact_shapes": "square",
    "shank_electrode_number": 0,
    "offset_to_uV": 0
}

export const testEcephysData = {
    "Device": [
        {
            "name": "Neuropixel-Imec",
            "description": "{\"probe_type\": \"0\", \"probe_type_description\": \"NP1.0\", \"flex_part_number\": \"NP2_FLEX_0\", \"connected_base_station_part_number\": \"NP2_QBSC_00\"}",
            "manufacturer": "Imec"
        }
    ],
    "ElectrodeGroup": [
        {
            "name": "s0",
            "description": "A group representing shank s0.",
            "location": "unknown",
            "device": "Neuropixel-Imec"
        }
    ],
    "ElectrodeColumns": [
        {
            "name": "inter_sample_shift",
            "description": "Time-delay of each channel sampling in proportion to the per-frame sampling period.",
            "data_type": "float64"
        },
        {
            "name": "channel_name",
            "description": "The name of this channel.",
            "data_type": "str"
        },
        {
            "name": "group_name",
            "description": "The name of the ElectrodeGroup this channel's electrode is a part of.",
            "data_type": "str"
        },
        {
            "name": "gain_to_uV",
            "description": "The scaling factor from the data type to microVolts, applied before the offset.",
            "data_type": "float64"
        },
        {
            "name": "contact_shapes",
            "description": "The shape of the electrode.",
            "data_type": "str"
        },
        {
            "name": "shank_electrode_number",
            "description": "0-based index of the electrode on the shank.",
            "data_type": "int64"
        },
        {
            "name": "offset_to_uV",
            "description": "The offset from the data type to microVolts, applied after the gain.",
            "data_type": "float64"
        }
    ],

    // Just a single electrode here
    "Electrodes": [

        validElectrode,

    ]
}