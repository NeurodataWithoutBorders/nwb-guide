Dataset Generation
==================

Our tutorials focus on converting extracellular electrophysiology data in the SpikeGLX and Phy formats.
To get you started as quickly as possible, we’ve created a way to generate this Neuropixel-like dataset at the click of a button!

.. note::
  The **SpikeGLX** data format stores electrophysiology recordings.

  The **Phy** data format stores spike sorting results.

Navigate to the **Settings** page using the main sidebar. Then press the **Generate** button in the top-right corner to initiate the dataset creation.

.. figure:: ./screenshots/dataset-creation.png
  :align: center
  :alt: Dataset Creation Screen

  Press the Generate button on the Settings page to create the dataset.

The generated dataset will be organized as follows:

.. code-block:: bash

    dataset/
    ├── mouse1/
    │   ├── mouse1_Session1/
    │   │   ├── mouse1_Session1_g0/
    │   │   │   ├── mouse1_Session1_g0_imec/
    │   │   │   │   ├── mouse1_Session1_g0_imec.ap.bin
    │   │   │   │   ├── mouse1_Session1_g0_imec.ap.meta
    │   │   │   │   ├── mouse1_Session1_g0_imec.lf.bin
    │   │   │   │   └── mouse1_Session1_g0_imec.lf.meta
    │   │   │   └── mouse1_Session1_phy/
    │   │   │
    │   │   └── mouse1_Session2/
    │   │       ├── mouse1_Session2_g0/
    │   │       │   ...
    │   │       └── mouse1_Session2_phy/
    │   │           ...
    │   │
    └── mouse2/
        ├── mouse2_Session1/
        │   ...
        │
        └── mouse2_Session2/
            ...

Now you’re ready to start your first conversion using the NWB GUIDE!
