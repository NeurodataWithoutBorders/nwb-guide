import { describe, expect, test } from "vitest";

import * as time from "../src/electron/frontend/utils/time";
import { updateURLParams } from "../src/electron/frontend/utils/url";

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { localTimeZone } from "../src/schemas/timezone.schema";

describe('updateURLParams', () => {
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Save the original location and history objects
    originalLocation = global.location;
    originalHistory = global.history;

    // Mock location object
    global.location = {
      search: '',
      pathname: '/test',
    };

    // Mock history object
    global.history = {
      state: {},
      pushState: vi.fn(),
    };

  });

  afterEach(() => {
    // Restore the original location and history objects
    global.location = originalLocation;
    global.history = originalHistory;
  });

  it('should add new parameters to the URL', () => {
    updateURLParams({ foo: 'bar' });
    expect(global.history.pushState).toHaveBeenCalledWith({ foo: "bar" }, null, '/test?foo=bar');
  });

  it('should update existing parameters in the URL', () => {
    global.location.search = '?foo=old';
    updateURLParams({ foo: 'new' });
    expect(global.history.pushState).toHaveBeenCalledWith({ foo: "new" }, null, '/test?foo=new');
  });

  it('should delete parameters from the URL when value is undefined', () => {
    global.location.search = '?foo=bar';
    updateURLParams({ foo: undefined });
    expect(global.history.pushState).toHaveBeenCalledWith({}, null, '/test');
  });

  it('should handle multiple parameters correctly', () => {
    global.location.search = '?foo=bar&baz=qux';
    updateURLParams({ foo: 'new', baz: undefined, quux: 'corge' });
    expect(global.history.pushState).toHaveBeenCalledWith({ foo: "new", quux: "corge" }, null, '/test?foo=new&quux=corge');
  });

  it('should merge new parameters with existing state', () => {
    global.history.state = { existing: 'value' };
    updateURLParams({ foo: 'bar' });
    expect(global.history.state).toEqual({ existing: 'value', foo: 'bar' });
  });

  it('should not change the state if history.state is null', () => {
    global.history.state = null;
    updateURLParams({ foo: 'bar' });
    expect(global.history.pushState).toHaveBeenCalledWith(null, null, '/test?foo=bar');
  });
});


describe('Timezone Utils', () => {
    const originalDateNow = Date.now;

    beforeEach(() => {
      Date.now = originalDateNow; // Reset Date.now() mock if it was used
    });

    describe('getTimezoneOffset', () => {
      it('should return the correct timezone offset for the local timezone', () => {
        const offset = time.getTimezoneOffset(new Date('2023-06-12T12:00:00Z'));
        expect(offset).toBeTypeOf('number');
      });

      it('should return the correct timezone offset for a specific timezone', () => {
        const offset = time.getTimezoneOffset(new Date('2023-06-12T12:00:00Z'), 'America/New_York');
        console.log(offset)
        expect(offset).toBe(14400000); // 4 hours offset in milliseconds
      });

      it('should handle string date inputs correctly', () => {
        const offset = time.getTimezoneOffset('2023-06-12T12:00:00Z', 'America/New_York');
        expect(offset).toBe(14400000); // 4 hours offset in milliseconds
      });
    });

    describe('formatTimezoneOffset', () => {
      it('should format positive offset correctly', () => {
        const formattedOffset = time.formatTimezoneOffset(-14400000);
        expect(formattedOffset).toBe('+04:00');
      });

      it('should format negative offset correctly', () => {
        const formattedOffset = time.formatTimezoneOffset(14400000);
        expect(formattedOffset).toBe('-04:00');
      });

      it('should format zero offset correctly', () => {
        const formattedOffset = time.formatTimezoneOffset(0);
        expect(formattedOffset).toBe('+00:00');
      });
    });

    describe('getISODateInTimezone', () => {

      it('should return the correct ISO date for a specific timezone', () => {
        const isoDate = time.getISODateInTimezone(new Date('2023-06-12T12:00:00Z'), 'America/New_York');
        expect(isoDate).toBe('2023-06-12T08:00:00.000Z'); // Adjusted for 4 hours offset
      });

      it('should handle string date inputs correctly', () => {
        const isoDate = time.getISODateInTimezone('2023-06-12T12:00:00Z', 'America/New_York');
        expect(isoDate).toBe('2023-06-12T08:00:00.000Z'); // Adjusted for 4 hours offset
      });
    });

  });
