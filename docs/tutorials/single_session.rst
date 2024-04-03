Converting a Single Session
===========================

As a researcher, you’ve just completed an experimental session and you’d like to convert your data to NWB right away.

Upon launching the GUIDE, you'll begin on the Convert page. If you’re opening the application for the first time, there should be no pipelines listed on this page.

.. figure:: ../assets/tutorials/home-page.png
  :align: center
  :alt: Home page

Press the **Create a new conversion pipeline** button to start the conversion process.

Project Structure
-----------------

Project Setup
^^^^^^^^^^^^^

The Project Setup page will have you define two pieces of information about your pipeline: the **name** and, optionally, the **output location** for your NWB files.

You’ll notice that the name property has a red asterisk next to it, which identifies it as a required property.

.. figure:: ../assets/tutorials/single/info-page.png
  :align: center
  :alt: Project Setup page with no name (invalid)


After specifying a unique project name, the colored background and error message will disappear, allowing you to advance to the next page.

.. figure:: ../assets/tutorials/single/valid-name.png
  :align: center
  :alt: Project Setup page with valid name

Workflow Configuration
^^^^^^^^^^^^^^^^^^^^^^
On this page, you’ll specify the type of **workflow** you’d like to follow for this conversion pipeline.

Since this is a single-session workflow, you’ll need to specify a **Subject ID** and **Session ID** to identify the data you’ll be converting.

.. figure:: ../assets/tutorials/single/workflow-page.png
  :align: center
  :alt: Workflow page

Additionally, we’ll turn off the option to upload to the DANDI Archive and approach this in a later tutorial.

Data Formats
^^^^^^^^^^^^
Next, you’ll specify the data formats you’re working with on the Data Formats page. The GUIDE supports 40+ total neurophysiology formats. A full registry of available formats is available :doc:`here </format_support>`.

.. figure:: ../assets/tutorials/single/formats-page.png
  :align: center
  :alt: Date Formats page

The tutorial we're working with uses the SpikeGLX and Phy formats, a common output for Neuropixels recordings and subsequent spike sorting. To specify that your pipeline will handle these files, you’ll press the “Add Format” button.

.. figure:: ../assets/tutorials/single/format-options.png
  :align: center
  :alt: Format pop-up on the Data Formats page

Then, select the relevant formats—in this case, **SpikeGLX Recording** and **Phy Sorting**—from the pop-up list. Use the search bar to filter for the format you need.


.. figure:: ../assets/tutorials/single/search-behavior.png
  :align: center
  :alt: Searching for SpikeGLX in the format pop-up

The selected formats will then display above the button.


.. figure:: ../assets/tutorials/single/interface-added.png
  :align: center
  :alt: Data Formats page with SpikeGLX Recording added to the list

Advance to the next page when you have **SpikeGLX Recording** and **Phy Sorting** selected.

.. figure:: ../assets/tutorials/single/all-interfaces-added.png
  :align: center
  :alt: Data Formats page with both SpikeGLX Recording and Phy Sorting added to the list

Data Entry
-----------

Source Data Information
^^^^^^^^^^^^^^^^^^^^^^^
On this page, specify the relevant **.bin** (Spikeglx) file and **phy** folder so that the GUIDE can find this source data to complete the conversion.

As discussed in the :doc:`Dataset Generation </tutorials/dataset>` tutorial, these can be found in the ``~/NWB_GUIDE/test-data/data`` directory.

You can either click the file selector to navigate to the file or drag-and-drop into the GUIDE from your file navigator.

.. figure:: ../assets/tutorials/single/sourcedata-page-specified.png
  :align: center
  :alt: Source Data page with source locations specified


Session Metadata
^^^^^^^^^^^^^^^^
The file metadata page is a great opportunity to add rich annotations to the file, which will be read by anyone reusing your data in the future!

The Session Start Time in the **General Metadata** section is already specified because this field was automatically extracted from the SpikeGLX source data.

.. figure:: ../assets/tutorials/single/metadata-nwbfile.png
  :align: center
  :alt: Metadata page with invalid Subject information


However, we still need to add the Subject information—as noted by the red accents around that item. Let’s say that our subject is a male mouse with an age of P25W, which represents 25 weeks old.

.. figure:: ../assets/tutorials/single/metadata-subject-complete.png
  :align: center
  :alt: Metadata page with valid **Subject** information

  The status of the Subject information will update in real-time as you fill out the form.


This dataset will also have **Ecephys** metadata extracted from the SpikeGLX source data.

.. figure:: ../assets/tutorials/single/metadata-ecephys.png
  :align: center
  :alt: Ecephys metadata extracted from the SpikeGLX source data


Let's leave this as-is and advance to the next page.

The next step generates a preview file and displays real-time progress throughout the conversion process.

File Conversion
---------------

Inspector Report
^^^^^^^^^^^^^^^^

The Inspector Report page allows you to validate the preview file against the latest Best Practices and make suggestions to improve the content or representations.

.. figure:: ../assets/tutorials/single/inspect-page.png
  :align: center
  :alt: NWB Inspector report



Conversion Preview
^^^^^^^^^^^^^^^^^^
On the Conversion Preview, Neurosift allows you to explore the structure of the NWB file and ensure the packaged data matches your expectations.


.. figure:: ../assets/tutorials/single/preview-page.png
  :align: center
  :alt: Neurosift preview visualization

Advancing from this page will trigger the full conversion of your data to the NWB format, a process that may take some time depending on the dataset size.

Conversion Review
^^^^^^^^^^^^^^^^^

Congratulations on finishing your first conversion of neurophysiology files using the NWB GUIDE!

.. figure:: ../assets/tutorials/single/conversion-results-page.png
  :align: center
  :alt: Conversion results page with a list of converted files

This was a straightforward workflow with only a single session... But what if you have multiple sessions to convert?
