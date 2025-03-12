// Test that the indexed database is not cleared on initial render and cleared
// when a url is provided and the component is rendered again as in PreviewPage.js
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Neurosift } from '../../src/electron/frontend/core/components/Neurosift.js';

describe('Neurosift', () => {
    let originalIndexedDB: IDBFactory;
    let mockDeleteDatabase: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Mock indexedDB.deleteDatabase so that we can test if it is called
        mockDeleteDatabase = vi.fn();
        originalIndexedDB = window.indexedDB;
        window.indexedDB = {
            deleteDatabase: mockDeleteDatabase,
            open: vi.fn(),
            databases: vi.fn(),
            cmp: vi.fn()
        } as unknown as IDBFactory;
    });

    afterEach(() => {
        // Restore original indexedDB
        window.indexedDB = originalIndexedDB;
    });

    test('if neurosift storage is not cleared on initial render', async () => {
        const neurosift = new Neurosift();

        // Add the component to the DOM
        document.body.appendChild(neurosift);

        // Wait for the component to render
        await neurosift.requestUpdate();

        // Verify deleteDatabase was not called
        expect(mockDeleteDatabase).not.toHaveBeenCalled();

        // Remove the component from the DOM
        document.body.removeChild(neurosift);
    });

    test('if neurosift storage is cleared when url is provided and component is rendered again', async () => {
        const neurosift = new Neurosift();

        // Add the component to the DOM
        document.body.appendChild(neurosift);

        // Wait for the component to render
        await neurosift.requestUpdate();

        // Set the URL to a test URL
        neurosift.url = 'http://test.url/files/test.nwb';

        // Wait for the component to render again
        await neurosift.requestUpdate();

        // Verify deleteDatabase was called
        expect(mockDeleteDatabase).toHaveBeenCalledWith('neurosift-hdf5-cache');
        expect(mockDeleteDatabase).toHaveBeenCalledTimes(1);

        // Wait for the component to render again
        await neurosift.requestUpdate();

        // Verify deleteDatabase was called
        expect(mockDeleteDatabase).toHaveBeenCalledWith('neurosift-hdf5-cache');
        expect(mockDeleteDatabase).toHaveBeenCalledTimes(2);

        // Remove the component from the DOM
        document.body.removeChild(neurosift);
    });
});
